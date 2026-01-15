#!/usr/bin/env python3
"""
Improved OCR Preprocessing Module
==================================
Drop-in replacement for image preprocessing with better extraction quality.

Usage:
    from improved_ocr_preprocessing import ImprovedOCRProcessor
    
    processor = ImprovedOCRProcessor()
    text = processor.process_image('./bus_timetable.jpg', debug=True)
"""

import cv2
import numpy as np
import pytesseract
import logging
from PIL import Image, ImageEnhance
from pathlib import Path
from typing import Optional, Tuple, Dict
import re

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class ImageQualityAssessment:
    """Assess image quality for OCR suitability."""
    
    @staticmethod
    def assess(image_path: str) -> Dict[str, any]:
        """Comprehensive image quality assessment."""
        image = cv2.imread(image_path)
        if image is None:
            raise FileNotFoundError(f"Image not found: {image_path}")
        
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        
        # Calculate metrics
        laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()
        brightness = np.mean(gray)
        contrast = np.std(gray)
        (h, w) = gray.shape[:2]
        
        # Assess
        assessment = {
            'sharpness': laplacian_var,
            'brightness': brightness,
            'contrast': contrast,
            'resolution': {'width': w, 'height': h},
            'suitable_for_ocr': True,
            'warnings': []
        }
        
        if laplacian_var < 100:
            assessment['suitable_for_ocr'] = False
            assessment['warnings'].append(f'Blurry image (sharpness={laplacian_var:.1f})')
        
        if brightness < 50 or brightness > 200:
            assessment['warnings'].append(f'Poor brightness (brightness={brightness:.1f})')
        
        if contrast < 30:
            assessment['suitable_for_ocr'] = False
            assessment['warnings'].append(f'Low contrast (contrast={contrast:.1f})')
        
        if h < 300 or w < 300:
            assessment['warnings'].append(f'Low resolution ({w}x{h})')
        
        return assessment


class AdvancedPreprocessing:
    """Advanced image preprocessing for OCR."""
    
    @staticmethod
    def rotate_correct(image: np.ndarray) -> np.ndarray:
        """Auto-detect and correct image rotation."""
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY) if len(image.shape) == 3 else image
        
        # Detect edges
        edges = cv2.Canny(gray, 50, 150)
        
        # Find contours
        contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        if not contours:
            return image
        
        # Get largest contour
        cnt = max(contours, key=cv2.contourArea)
        rect = cv2.minAreaRect(cnt)
        angle = rect[-1]
        
        # Fix angle orientation
        if angle < -45:
            angle = 90 + angle
        elif angle > 45:
            angle = angle - 90
        
        # Only rotate if significant
        if abs(angle) < 0.5:
            return image
        
        logger.info(f"Rotating image by {angle:.1f}°")
        
        # Apply rotation
        (h, w) = gray.shape[:2]
        center = (w // 2, h // 2)
        M = cv2.getRotationMatrix2D(center, angle, 1.0)
        rotated = cv2.warpAffine(image, M, (w, h),
                                flags=cv2.INTER_CUBIC,
                                borderMode=cv2.BORDER_REPLICATE)
        
        return rotated
    
    @staticmethod
    def denoise(image: np.ndarray) -> np.ndarray:
        """Smart denoising preserving text edges."""
        logger.info("Applying denoising...")
        
        # Non-Local Means Denoising (best for text)
        if len(image.shape) == 3:
            # Color image
            denoised = cv2.fastNlMeansDenoisingColored(
                image, None,
                h=10,
                templateWindowSize=7,
                searchWindowSize=21
            )
        else:
            # Grayscale
            denoised = cv2.fastNlMeansDenoising(
                image, None,
                h=10,
                templateWindowSize=7,
                searchWindowSize=21
            )
        
        return denoised
    
    @staticmethod
    def upscale(image: np.ndarray, target_height: int = 1200) -> np.ndarray:
        """Upscale image for better OCR (1200+ pixels recommended)."""
        (h, w) = image.shape[:2]
        
        if h >= target_height:
            logger.info(f"Image height {h} >= {target_height}, no upscaling needed")
            return image
        
        scale = target_height / h
        new_w = int(w * scale)
        new_h = int(h * scale)
        
        logger.info(f"Upscaling from {w}x{h} to {new_w}x{new_h}")
        
        # INTER_CUBIC is best for upscaling
        upscaled = cv2.resize(image, (new_w, new_h), 
                             interpolation=cv2.INTER_CUBIC)
        
        return upscaled
    
    @staticmethod
    def adaptive_threshold(image: np.ndarray) -> np.ndarray:
        """Apply adaptive thresholding for tables."""
        if len(image.shape) == 3:
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        else:
            gray = image
        
        logger.info("Applying adaptive thresholding...")
        
        # Adaptive Gaussian threshold (best for tables with varying lighting)
        thresh = cv2.adaptiveThreshold(
            gray, 255,
            cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
            cv2.THRESH_BINARY,
            blockSize=21,  # Larger block for clearer separation
            C=5  # Increase C for better foreground/background separation
        )
        
        return thresh
    
    @staticmethod
    def morphological_cleanup(image: np.ndarray) -> np.ndarray:
        """Clean up binary image with morphological operations."""
        logger.info("Applying morphological cleanup...")
        
        # Small kernel for light cleanup
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (3, 3))
        
        # Close small holes
        cleaned = cv2.morphologyEx(image, cv2.MORPH_CLOSE, kernel, iterations=1)
        
        # Open small noise
        cleaned = cv2.morphologyEx(cleaned, cv2.MORPH_OPEN, kernel, iterations=1)
        
        return cleaned


class TextCleaning:
    """Post-OCR text cleaning."""
    
    # Common OCR character confusions
    CHARACTER_MAP = {
        'O': '0', 'o': '0',  # O→0 (letter to number)
        'l': '1', 'I': '1', '|': '1',  # l, I → 1
        'Z': '2', 'z': '2',  # Z→2
        'S': '5', 's': '5',  # S→5
        'G': '9', 'g': '9',  # G→9
        'B': '8', 'b': '8',  # B→8
    }
    
    # Common city name corrections
    CITY_MAP = {
        'CHENNA': 'CHENNAI',
        'CENNAI': 'CHENNAI',
        'COIMNATORE': 'COIMBATORE',
        'COIMBATCRE': 'COIMBATORE',
        'COIMBATORE': 'COIMBATORE',
        'MADUA': 'MADURAI',
        'MADURAJ': 'MADURAI',
        'MADURAI': 'MADURAI',
        'TRICHY': 'TRICHY',
        'TRICHV': 'TRICHY',
        'SALEM': 'SALEM',
        'ERODE': 'ERODE',
        'VELLORE': 'VELLORE',
        'BANGALORE': 'BANGALORE',
        'PUDUCHERRY': 'PUDUCHERRY',
        'PONDICHERRY': 'PUDUCHERRY',
    }
    
    @staticmethod
    def clean_text(text: str) -> str:
        """Clean OCR text intelligently."""
        logger.info("Cleaning OCR text...")
        
        # Fix common character errors (be conservative)
        # Only fix in time-like contexts (HH:MM)
        time_pattern = r'\b([O0o]|l|I|1)([0-9]{1,2})(:([0-9]{2}))?\b'
        
        def fix_time_char(match):
            hour = match.group(1)
            # Replace O/o with 0
            if hour.upper() == 'O':
                hour = '0'
            return f"{hour}{match.group(2)}{match.group(3) or ''}"
        
        text = re.sub(time_pattern, fix_time_char, text)
        
        # Fix multiple spaces
        text = re.sub(r'\s{2,}', ' ', text)
        
        # Fix broken times (add leading zero if needed)
        text = re.sub(r'\b([0-9]):([0-9]{2})\b', r'0\1:\2', text)
        
        return text.strip()
    
    @staticmethod
    def extract_times(text: str) -> list:
        """Extract time values with validation."""
        logger.info("Extracting time values...")
        
        # Pattern: HH:MM with optional AM/PM
        time_pattern = r'\b([01]?[0-9]):([0-5][0-9])\s*(AM|PM|am|pm)?\b'
        
        matches = re.findall(time_pattern, text)
        times = []
        
        for hour, minute, period in matches:
            hour = int(hour)
            minute = int(minute)
            
            # Validate hour range
            if hour > 23:
                continue
            
            # Handle AM/PM
            if period and period.upper() == 'PM' and hour < 12:
                hour += 12
            elif period and period.upper() == 'AM' and hour == 12:
                hour = 0
            
            time_str = f"{hour:02d}:{minute:02d}"
            if time_str not in times:  # Avoid duplicates
                times.append(time_str)
        
        logger.info(f"Found {len(times)} time values: {times[:5]}...")
        
        return times


class ImprovedOCRProcessor:
    """Complete improved OCR pipeline."""
    
    def __init__(self, tesseract_path: Optional[str] = None):
        """Initialize processor with optional Tesseract path."""
        if tesseract_path:
            pytesseract.pytesseract.pytesseract_cmd = tesseract_path
    
    def process_image(self, image_path: str, debug: bool = False) -> str:
        """
        Process image and extract text with best quality.
        
        Args:
            image_path: Path to image file
            debug: Save intermediate processing steps
            
        Returns:
            Cleaned OCR text
        """
        logger.info(f"\n{'='*60}")
        logger.info(f"Processing: {image_path}")
        logger.info(f"{'='*60}")
        
        # Step 1: Quality assessment
        quality = ImageQualityAssessment.assess(image_path)
        logger.info(f"Quality Assessment:")
        logger.info(f"  - Sharpness: {quality['sharpness']:.1f}")
        logger.info(f"  - Brightness: {quality['brightness']:.1f}")
        logger.info(f"  - Contrast: {quality['contrast']:.1f}")
        logger.info(f"  - Resolution: {quality['resolution']['width']}x{quality['resolution']['height']}")
        
        if not quality['suitable_for_ocr']:
            logger.warning(f"⚠️  Image quality issues: {quality['warnings']}")
        
        # Step 2: Preprocessing
        logger.info("\nPreprocessing steps:")
        
        image = cv2.imread(image_path)
        
        # Correct rotation
        image = AdvancedPreprocessing.rotate_correct(image)
        if debug:
            cv2.imwrite('_debug_01_rotated.jpg', image)
        
        # Denoise
        image = AdvancedPreprocessing.denoise(image)
        if debug:
            cv2.imwrite('_debug_02_denoised.jpg', image)
        
        # Upscale
        image = AdvancedPreprocessing.upscale(image, target_height=1200)
        if debug:
            cv2.imwrite('_debug_03_upscaled.jpg', image)
        
        # Threshold
        thresh = AdvancedPreprocessing.adaptive_threshold(image)
        if debug:
            cv2.imwrite('_debug_04_thresholded.jpg', thresh)
        
        # Morphological cleanup
        thresh = AdvancedPreprocessing.morphological_cleanup(thresh)
        if debug:
            cv2.imwrite('_debug_05_cleaned.jpg', thresh)
        
        # Step 3: OCR extraction
        logger.info("\nExtracting text with Tesseract...")
        
        pil_image = Image.fromarray(thresh)
        
        # Optimal config for timetables/tables
        custom_config = r'--oem 3 --psm 6 -c tessedit_char_whitelist=0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz:,.-/() '
        
        text = pytesseract.image_to_string(pil_image, config=custom_config)
        
        # Step 4: Post-processing
        logger.info("Post-processing text...")
        cleaned_text = TextCleaning.clean_text(text)
        times = TextCleaning.extract_times(cleaned_text)
        
        # Summary
        logger.info(f"\n{'='*60}")
        logger.info(f"EXTRACTION SUMMARY")
        logger.info(f"{'='*60}")
        logger.info(f"✓ Extracted {len(times)} time values")
        logger.info(f"✓ Text length: {len(cleaned_text)} characters")
        logger.info(f"✓ Sample (first 200 chars):")
        logger.info(f"  {cleaned_text[:200]}")
        
        if debug:
            logger.info(f"\n✓ Debug files saved: _debug_*.jpg")
        
        return cleaned_text
    
    def process_batch(self, image_dir: str, debug: bool = False) -> dict:
        """
        Process multiple images in a directory.
        
        Args:
            image_dir: Directory containing images
            debug: Save debug files
            
        Returns:
            Dictionary with results for each image
        """
        image_dir = Path(image_dir)
        results = {}
        
        for image_path in sorted(image_dir.glob('*.jpg')) + sorted(image_dir.glob('*.png')):
            try:
                text = self.process_image(str(image_path), debug=debug)
                results[image_path.name] = {
                    'status': 'success',
                    'text': text
                }
            except Exception as e:
                logger.error(f"Error processing {image_path.name}: {e}")
                results[image_path.name] = {
                    'status': 'error',
                    'error': str(e)
                }
        
        return results


# Example usage
if __name__ == "__main__":
    processor = ImprovedOCRProcessor()
    
    # Example: Process a single image
    # text = processor.process_image('./bus_timetable.jpg', debug=True)
    
    # Example: Process batch of images
    # results = processor.process_batch('./images/', debug=True)
    
    print("✓ ImprovedOCRProcessor ready to use")
