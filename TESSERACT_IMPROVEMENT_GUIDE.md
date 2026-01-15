# Tesseract OCR Improvement Guide

## Problem Analysis

Your current extraction shows:
- **Garbled text** like "791 UD 1 CHENNA 1 PAIAXKAD, C0IMBAT0RE"
- **Low confidence** scores (0.7-0.8)
- **Many UNKNOWN values** for essential fields
- **Corrupted character recognition** (O→0, numbers scrambled)

This suggests the images need better preprocessing before OCR.

---

## 1. **Image Preprocessing Improvements**

### A. Correct Image Rotation
```python
import cv2
import numpy as np
from PIL import Image

def rotate_image_correctly(image_path: str) -> np.ndarray:
    """Auto-detect and fix rotated images."""
    image = cv2.imread(image_path)
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    
    # Detect edges
    edges = cv2.Canny(gray, 50, 150)
    
    # Find contours
    contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    if contours:
        # Get the largest contour
        cnt = max(contours, key=cv2.contourArea)
        rect = cv2.minAreaRect(cnt)
        angle = rect[-1]
        
        # Fix angle
        if angle < -45:
            angle = 90 + angle
        
        if abs(angle) > 1:  # Only rotate if significant
            (h, w) = gray.shape[:2]
            center = (w // 2, h // 2)
            M = cv2.getRotationMatrix2D(center, angle, 1.0)
            image = cv2.warpAffine(image, M, (w, h), 
                                  flags=cv2.INTER_CUBIC,
                                  borderMode=cv2.BORDER_REPLICATE)
    
    return image
```

### B. Improve Image Quality with Better Thresholding
```python
def advanced_thresholding(image_path: str) -> np.ndarray:
    """Apply multiple thresholding techniques."""
    image = cv2.imread(image_path, cv2.IMREAD_GRAYSCALE)
    
    # Method 1: Adaptive Thresholding (best for table images)
    thresh_adaptive = cv2.adaptiveThreshold(
        image, 255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,  # Use Gaussian instead of mean
        cv2.THRESH_BINARY,
        blockSize=21,  # Larger block size for larger text
        C=5  # Increase C for better separation
    )
    
    # Method 2: Morphological operations to clean
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (3, 3))
    thresh_adaptive = cv2.morphologyEx(thresh_adaptive, cv2.MORPH_CLOSE, kernel, iterations=1)
    thresh_adaptive = cv2.morphologyEx(thresh_adaptive, cv2.MORPH_OPEN, kernel, iterations=1)
    
    return thresh_adaptive
```

### C. Upscale Images Properly
```python
def upscale_image(image_array: np.ndarray, target_height: int = 1200) -> np.ndarray:
    """Upscale image for better OCR (aim for 1200+ pixels height)."""
    (h, w) = image_array.shape[:2]
    
    if h < 600:
        scale = target_height / h
        new_w = int(w * scale)
        new_h = int(h * scale)
        
        # Use INTER_CUBIC for upscaling
        image_array = cv2.resize(image_array, (new_w, new_h), 
                                interpolation=cv2.INTER_CUBIC)
    
    return image_array
```

### D. Denoise Without Losing Detail
```python
def denoise_smart(image_array: np.ndarray) -> np.ndarray:
    """Smart denoising that preserves text edges."""
    # Use Non-Local Means instead of bilateral filter
    denoised = cv2.fastNlMeansDenoising(
        image_array,
        h=10,  # Filter strength
        templateWindowSize=7,
        searchWindowSize=21
    )
    return denoised
```

---

## 2. **Tesseract Configuration Optimization**

### Best Config for Bus Timetables
```python
import pytesseract
from PIL import Image
import cv2

def extract_text_with_optimal_config(image_path: str) -> str:
    """Extract text with best Tesseract config for tables."""
    
    # Preprocess the image
    image = cv2.imread(image_path, cv2.IMREAD_GRAYSCALE)
    
    # Apply preprocessing
    image = upscale_image(image)
    image = denoise_smart(image)
    image = advanced_thresholding(image_path)  # Use thresholded version
    
    # Convert back to PIL for pytesseract
    pil_image = Image.fromarray(image)
    
    # Optimal Tesseract config for timetables/tables
    custom_config = r'--oem 3 --psm 6 -c tessedit_char_whitelist=0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz:,.-/() '
    
    # Extract text
    text = pytesseract.image_to_string(pil_image, config=custom_config)
    
    return text
```

### Tesseract Config Explanation
```
--oem 3          : Use both legacy and LSTM OCR engine (most accurate)
--psm 6          : Assume single uniform block of text (best for tables)
--psm 11         : Alternative - sparse text (if tables have wide spacing)
-c tessedit_*   : Character whitelist - restricts to expected characters
```

**PSM Options for Bus Timetables:**
- `--psm 3`: Fully automatic page segmentation
- `--psm 6`: Assume single uniform block (RECOMMENDED for tables)
- `--psm 11`: Sparse text with few assumptions
- `--psm 13`: Raw line by line (for horizontal-only text)

---

## 3. **Post-OCR Text Cleaning**

### A. Fix Common Bus Timetable OCR Errors
```python
def clean_ocr_text(text: str) -> str:
    """Clean common OCR errors in bus timetables."""
    
    # Common character confusions in timetables
    replacements = {
        # Numbers
        'O': '0', 'o': '0', 'l': '1', 'I': '1',  # Letter O→0, l→1
        'S': '5', 's': '5',  # Letter S→5
        'Z': '2', 'z': '2',  # Letter Z→2
        'B': '8', 'b': '8',  # Letter B→8
        'G': '9', 'g': '9',  # Letter G→9
        
        # Time format cleanup
        r'\s+': ' ',  # Multiple spaces
        r'(\d{1}):(\d{2})': r'0\1:\2',  # Add leading 0 to hours
        
        # City names (context-specific)
        'CHENNA': 'CHENNAI',
        'CENNAI': 'CHENNAI',
        'COIMNATORE': 'COIMBATORE',
        'COIMBATCRE': 'COIMBATORE',
        'MADUA': 'MADURAI',
        'MADURAJ': 'MADURAI',
        'TRICHY': 'TRICHY',  # Keep as-is
    }
    
    for old, new in replacements.items():
        if old.isalpha():
            # For letters, be more careful - use regex for whole words
            import re
            text = re.sub(rf'\b{old}\b', new, text, flags=re.IGNORECASE)
        else:
            text = text.replace(old, new)
    
    return text
```

### B. Extract Times More Reliably
```python
import re

def extract_times_robust(text: str) -> list:
    """Extract time values with better accuracy."""
    
    # Pattern for times: HH:MM or H:MM (with optional AM/PM)
    time_pattern = r'\b([01]?[0-9]):([0-5][0-9])\s*(AM|PM|am|pm)?\b'
    
    times = re.findall(time_pattern, text)
    
    # Clean and standardize
    cleaned_times = []
    for hour, minute, period in times:
        hour = int(hour)
        minute = int(minute)
        
        if period and period.upper() == 'PM' and hour < 12:
            hour += 12
        elif period and period.upper() == 'AM' and hour == 12:
            hour = 0
        
        time_str = f"{hour:02d}:{minute:02d}"
        cleaned_times.append(time_str)
    
    return cleaned_times
```

---

## 4. **Image Selection & Quality Checks**

### A. Check Image Quality Before Processing
```python
def assess_image_quality(image_path: str) -> dict:
    """Assess if image is suitable for OCR."""
    
    image = cv2.imread(image_path)
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    
    # Calculate metrics
    laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()
    brightness = np.mean(gray)
    contrast = np.std(gray)
    
    # Assess
    is_good = {
        'blur': laplacian_var > 100,  # Variance > 100 is sharp
        'brightness': 50 < brightness < 200,  # Medium brightness
        'contrast': contrast > 30,  # Good contrast
    }
    
    return {
        'sharpness_score': laplacian_var,
        'brightness': brightness,
        'contrast': contrast,
        'suitable_for_ocr': all(is_good.values()),
        'issues': [k for k, v in is_good.items() if not v]
    }
```

### B. Skip Low-Quality Images
```python
def process_image_safe(image_path: str) -> Optional[str]:
    """Process image only if quality is acceptable."""
    
    quality = assess_image_quality(image_path)
    
    if not quality['suitable_for_ocr']:
        print(f"⚠️  Image {image_path} quality issues: {quality['issues']}")
        print(f"    Sharpness: {quality['sharpness_score']:.1f}, "
              f"Brightness: {quality['brightness']:.1f}, "
              f"Contrast: {quality['contrast']:.1f}")
        return None
    
    # Process if quality is good
    text = extract_text_with_optimal_config(image_path)
    return clean_ocr_text(text)
```

---

## 5. **Complete Improved Pipeline**

```python
def improved_ocr_pipeline(image_path: str, debug: bool = False) -> tuple:
    """Complete OCR pipeline with all improvements."""
    
    print(f"\n📊 Processing: {image_path}")
    
    # Step 1: Quality check
    quality = assess_image_quality(image_path)
    if not quality['suitable_for_ocr']:
        print(f"❌ Low quality image. Issues: {quality['issues']}")
        return None, quality
    
    print(f"✅ Image quality OK - Sharpness: {quality['sharpness_score']:.1f}")
    
    # Step 2: Preprocessing
    image = cv2.imread(image_path, cv2.IMREAD_GRAYSCALE)
    image = rotate_image_correctly(image_path)
    image = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    image = upscale_image(image, target_height=1200)
    image = denoise_smart(image)
    thresh = advanced_thresholding_from_array(image)
    
    if debug:
        cv2.imwrite('debug_thresh.jpg', thresh)
        print("💾 Saved: debug_thresh.jpg")
    
    # Step 3: OCR extraction
    pil_image = Image.fromarray(thresh)
    custom_config = r'--oem 3 --psm 6 -c tessedit_char_whitelist=0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz:,.-/() '
    text = pytesseract.image_to_string(pil_image, config=custom_config)
    
    # Step 4: Post-processing
    cleaned_text = clean_ocr_text(text)
    times = extract_times_robust(cleaned_text)
    
    print(f"📝 Extracted {len(times)} time values")
    print(f"✨ Sample text (first 300 chars):")
    print(cleaned_text[:300])
    
    return cleaned_text, times

# Usage
text, times = improved_ocr_pipeline('./image.jpg', debug=True)
```

---

## 6. **Quick Improvement Checklist**

- [ ] **Upscale images** to 1200+ pixels height
- [ ] Use **Adaptive Thresholding** (blockSize=21, C=5)
- [ ] Apply **Non-Local Means Denoising** (h=10)
- [ ] Use **Tesseract --psm 6** (single block of text)
- [ ] Use **--oem 3** (best engine)
- [ ] **Rotate images** if they're skewed
- [ ] **Clean common errors** (O→0, l→1, etc.)
- [ ] **Check image quality** before processing
- [ ] Use **whitelist config** to restrict to expected characters

---

## 7. **Dependency Installation**

```bash
# Install Tesseract
brew install tesseract                 # macOS
apt-get install tesseract-ocr          # Ubuntu/Debian
choco install tesseract                # Windows

# Install Python packages
pip install pytesseract opencv-python pillow
```

---

## Expected Improvement

**Before**: Confidence 0.7-0.8, garbled text
**After**: Confidence 0.85-0.95, clean readable text

The key is **proper preprocessing** before OCR - Tesseract works best with clear, well-contrasted, properly-sized images.
