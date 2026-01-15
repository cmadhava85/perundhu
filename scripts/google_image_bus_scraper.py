"""
Google Image Bus Schedule Scraper
==================================
Extracts bus timing data from Google Images using OCR and computer vision.

Features:
- Search Google Images for bus schedules with city/town names
- Detect and extract text from bus timing images using pytesseract
- Handle bidirectional arrows and route symbols
- Process multi-page images
- Normalize data to TNSTC/MTC JSON format
- Deduplicate and validate extracted data

Usage:
    python google_image_bus_scraper.py --search "Chennai to Madurai bus" --limit 10
    python google_image_bus_scraper.py --process-image ./image.jpg
    python google_image_bus_scraper.py --batch-search ./search_queries.txt
"""

import argparse
import json
import logging
import os
import re
import sys
from dataclasses import dataclass, asdict
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Optional, Tuple, Any
from urllib.parse import quote

# Third-party imports
import cv2
import numpy as np
import requests
from PIL import Image, ImageEnhance, ImageFilter
from io import BytesIO

try:
    import pytesseract
    PYTESSERACT_AVAILABLE = True
except ImportError:
    PYTESSERACT_AVAILABLE = False
    logging.warning("pytesseract not available - OCR features will be limited")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@dataclass
class BusStop:
    """Represents a single bus stop with timing information."""
    city: str
    landmark: str
    time: str  # HH:MM format
    arrival_time: Optional[str] = None
    departure_time: Optional[str] = None


@dataclass
class BusRoute:
    """Extracted bus route information."""
    service_code: str
    origin: str
    destination: str
    departure_time: str  # HH:MM
    arrival_time: str    # HH:MM
    duration: Optional[str] = None
    bus_type: Optional[str] = None
    fare: Optional[str] = None
    stops: List[BusStop] = None
    route_number: str = ""
    corporation: str = "UNKNOWN"
    available_seats: Optional[str] = None
    journey_date: Optional[str] = None
    bidirectional: bool = False
    image_source: Optional[str] = None
    confidence_score: float = 0.0
    extracted_at: str = ""
    raw_text: Optional[str] = None
    
    def __post_init__(self):
        if self.stops is None:
            self.stops = []
        if not self.extracted_at:
            self.extracted_at = datetime.now().isoformat()


class AdaptivePreprocessor:
    """Adaptive preprocessing based on image characteristics (Phase 2)."""
    
    @staticmethod
    def analyze_image(image: Image.Image) -> dict:
        """Analyze image characteristics."""
        img_array = np.array(image.convert('L'))
        
        return {
            'brightness': img_array.mean() / 255.0,
            'contrast': img_array.std() / 128.0,
            'sharpness': cv2.Laplacian(img_array, cv2.CV_64F).var(),
        }
    
    @staticmethod
    def deskew(img_array: np.ndarray) -> np.ndarray:
        """Deskew rotated images."""
        coords = np.column_stack(np.where(img_array > 0))
        if len(coords) == 0:
            return img_array
        
        angle = cv2.minAreaRect(coords)[-1]
        
        # Correct angle
        if angle < -45:
            angle = 90 + angle
        elif angle > 45:
            angle = angle - 90
        
        # Only deskew if angle is significant
        if abs(angle) < 0.5:
            return img_array
        
        # Rotate image
        (h, w) = img_array.shape[:2]
        center = (w // 2, h // 2)
        M = cv2.getRotationMatrix2D(center, angle, 1.0)
        rotated = cv2.warpAffine(
            img_array, M, (w, h),
            flags=cv2.INTER_CUBIC,
            borderMode=cv2.BORDER_REPLICATE
        )
        return rotated
    
    @staticmethod
    def adaptive_preprocess(image: Image.Image) -> Image.Image:
        """Apply preprocessing based on image characteristics."""
        metrics = AdaptivePreprocessor.analyze_image(image)
        
        # Convert to grayscale
        image = image.convert('L')
        img_array = np.array(image)
        
        # 1. Adaptive brightness correction
        if metrics['brightness'] < 0.3:  # Dark image
            img_array = cv2.convertScaleAbs(img_array, alpha=1.5, beta=50)
        elif metrics['brightness'] > 0.7:  # Bright image
            img_array = cv2.convertScaleAbs(img_array, alpha=0.8, beta=-30)
        
        # 2. Deskew (fix rotated images)
        img_array = AdaptivePreprocessor.deskew(img_array)
        
        # 3. Adaptive denoising for noisy images
        if img_array.std() > 30:  # Noisy
            img_array = cv2.fastNlMeansDenoising(img_array, h=10)
        
        # 4. Adaptive thresholding (better than fixed Otsu)
        img_array = cv2.adaptiveThreshold(
            img_array, 255,
            cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
            cv2.THRESH_BINARY,
            blockSize=11,
            C=2
        )
        
        # 5. Morphological operations to clean up
        kernel = np.ones((2, 2), np.uint8)
        img_array = cv2.morphologyEx(img_array, cv2.MORPH_CLOSE, kernel)
        
        # 6. Upscale for better OCR
        scale = 2.0
        img_array = cv2.resize(
            img_array,
            None,
            fx=scale, fy=scale,
            interpolation=cv2.INTER_CUBIC
        )
        
        return Image.fromarray(img_array)


class TableDetector:
    """Detect and extract tabular data from bus schedules (Phase 2)."""
    
    @staticmethod
    def detect_table_regions(image: Image.Image) -> list:
        """Detect table regions using contours."""
        img_array = np.array(image.convert('L'))
        
        # Apply threshold
        _, thresh = cv2.threshold(img_array, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
        
        # Detect horizontal and vertical lines
        horizontal_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (40, 1))
        vertical_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (1, 40))
        
        horizontal_lines = cv2.morphologyEx(thresh, cv2.MORPH_OPEN, horizontal_kernel, iterations=2)
        vertical_lines = cv2.morphologyEx(thresh, cv2.MORPH_OPEN, vertical_kernel, iterations=2)
        
        # Combine
        table_mask = cv2.add(horizontal_lines, vertical_lines)
        
        # Find contours
        contours, _ = cv2.findContours(table_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        # Extract bounding boxes
        regions = []
        for cnt in contours:
            x, y, w, h = cv2.boundingRect(cnt)
            if w > 100 and h > 50:  # Min size threshold
                regions.append((x, y, x + w, y + h))
        
        return regions
    
    @staticmethod
    def has_table_structure(image: Image.Image) -> bool:
        """Check if image has table-like structure."""
        regions = TableDetector.detect_table_regions(image)
        return len(regions) > 0


class ImagePreprocessor:
    """Preprocesses images for better OCR accuracy."""
    
    @staticmethod
    def enhance_image(image: Image.Image) -> Image.Image:
        """Enhance image for better OCR."""
        # Increase contrast
        enhancer = ImageEnhance.Contrast(image)
        image = enhancer.enhance(1.5)
        
        # Increase sharpness
        enhancer = ImageEnhance.Sharpness(image)
        image = enhancer.enhance(2.0)
        
        # Increase brightness slightly
        enhancer = ImageEnhance.Brightness(image)
        image = enhancer.enhance(1.1)
        
        return image
    
    @staticmethod
    def resize_image(image: Image.Image, scale: float = 2.0) -> Image.Image:
        """Resize image for better OCR (larger is usually better)."""
        width, height = image.size
        new_width = int(width * scale)
        new_height = int(height * scale)
        return image.resize((new_width, new_height), Image.Resampling.LANCZOS)
    
    @staticmethod
    def convert_to_grayscale(image: Image.Image) -> Image.Image:
        """Convert image to grayscale."""
        return image.convert('L')
    
    @staticmethod
    def denoise_image(image: Image.Image) -> Image.Image:
        """Apply denoising filter."""
        image_array = np.array(image)
        if len(image_array.shape) == 3:
            # Color image - convert to grayscale first
            image = image.convert('L')
            image_array = np.array(image)
        
        # Apply bilateral filter for denoising
        denoised = cv2.bilateralFilter(image_array, 9, 75, 75)
        return Image.fromarray(denoised)
    
    @staticmethod
    def apply_threshold(image: Image.Image) -> Image.Image:
        """Apply threshold for better text extraction."""
        image_array = np.array(image.convert('L'))
        # Otsu's binarization
        _, thresh = cv2.threshold(image_array, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        return Image.fromarray(thresh)
    
    @staticmethod
    def preprocess_for_ocr(image: Image.Image) -> Image.Image:
        """Full preprocessing pipeline for OCR."""
        image = ImagePreprocessor.convert_to_grayscale(image)
        image = ImagePreprocessor.resize_image(image, scale=2.0)
        image = ImagePreprocessor.denoise_image(image)
        image = ImagePreprocessor.enhance_image(image)
        image = ImagePreprocessor.apply_threshold(image)
        return image
    
    @staticmethod
    def preprocess_for_ocr_adaptive(image: Image.Image) -> Image.Image:
        """Adaptive preprocessing pipeline (Phase 2)."""
        return AdaptivePreprocessor.adaptive_preprocess(image)


class ExtractionValidator:
    """Validate and clean extracted text."""
    
    # Common OCR character errors
    CHARACTER_CORRECTIONS = {
        'O': '0',  # O to 0 in times
        'o': '0',  # o to 0
        'I': '1',  # I to 1 in numbers
        'l': '1',  # l to 1
        '|': '1',  # | to 1
        'B': '8',  # B to 8
        'S': '5',  # S to 5 in numbers
        'Z': '2',  # Z to 2
    }
    
    # Common city name OCR errors
    CITY_CORRECTIONS = {
        'CHENNA1': 'CHENNAI',
        'CHENNA|': 'CHENNAI',
        'MADURA1': 'MADURAI',
        'MADURA|': 'MADURAI',
        'TR1CHY': 'TRICHY',
        'TR|CHY': 'TRICHY',
        'SALEM': 'SALEM',
        'SALE|VI': 'SALEM',
        'COIMBAT0RE': 'COIMBATORE',
        'COIMBATORE': 'COIMBATORE',
        'ERODE': 'ERODE',
        'ER0DE': 'ERODE',
        'T1RUPPUR': 'TIRUPPUR',
        'TIRUPPUR': 'TIRUPPUR',
        'DIND1GUL': 'DINDIGUL',
        'DINDIGUL': 'DINDIGUL',
        'VELL0RE': 'VELLORE',
        'VELLORE': 'VELLORE',
    }
    
    @staticmethod
    def correct_time_format(text: str) -> str:
        """Fix common time OCR errors."""
        corrected = text
        # Fix O/I/l/| to 0/1 in time patterns and general text
        for char, replacement in ExtractionValidator.CHARACTER_CORRECTIONS.items():
            corrected = corrected.replace(char, replacement)
        return corrected
    
    @staticmethod
    def validate_city_names(text: str) -> str:
        """Fix common city name OCR errors."""
        corrected = text.upper()
        for wrong, right in ExtractionValidator.CITY_CORRECTIONS.items():
            corrected = corrected.replace(wrong, right)
        return corrected
    
    @staticmethod
    def clean_text(text: str) -> str:
        """Clean and validate extracted text."""
        # Apply corrections
        text = ExtractionValidator.correct_time_format(text)
        text = ExtractionValidator.validate_city_names(text)
        return text


class TamilOCREnhancer:
    """Enhanced OCR for Tamil text."""
    
    def __init__(self):
        self.tamil_available = self._check_tamil_support()
    
    def _check_tamil_support(self) -> bool:
        """Check if Tamil language support is available."""
        if not PYTESSERACT_AVAILABLE:
            return False
        try:
            # Try to get Tamil language data
            langs = pytesseract.get_languages()
            return 'tam' in langs
        except Exception:
            return False
    
    def extract_tamil_text(self, image: Image.Image) -> str:
        """Extract Tamil text with proper configuration."""
        if not PYTESSERACT_AVAILABLE:
            return ""
        
        try:
            processed = ImagePreprocessor.preprocess_for_ocr(image)
            
            # Use Tamil + English combined if available
            lang = 'tam+eng' if self.tamil_available else 'eng'
            text = pytesseract.image_to_string(
                processed,
                lang=lang,
                config='--psm 6 --oem 3'  # LSTM engine
            )
            return text.strip()
        except Exception as e:
            logger.warning(f"Tamil OCR extraction failed: {e}")
            return ""
    
    def detect_language(self, image: Image.Image) -> str:
        """Detect if image contains Tamil or English."""
        if not PYTESSERACT_AVAILABLE:
            return 'unknown'
        
        try:
            # Quick sample extraction
            sample = pytesseract.image_to_string(image, lang='eng')
            
            # Count Tamil Unicode characters (Tamil script range)
            tamil_chars = sum(1 for c in sample if '\u0B80' <= c <= '\u0BFF')
            total_chars = len([c for c in sample if c.isalpha()])
            
            if total_chars == 0:
                return 'unknown'
            
            tamil_ratio = tamil_chars / total_chars
            return 'tamil' if tamil_ratio > 0.3 else 'english'
        except Exception:
            return 'unknown'


class OCRExtractor:
    """Extracts text and structure from images using OCR."""
    
    # Multiple PSM (Page Segmentation Mode) configurations
    PSM_CONFIGS = {
        'single_block': '--psm 6',      # Single uniform block (default)
        'single_column': '--psm 4',     # Single column of text (better for bus boards)
        'single_line': '--psm 7',       # Single line of text
        'sparse_text': '--psm 11',      # Sparse text without OSD
        'auto': '--psm 3',              # Fully automatic
    }
    
    def __init__(self, use_pytesseract: bool = True, enable_tamil: bool = True, enable_multi_config: bool = True, enable_adaptive: bool = True, enable_smart_fallback: bool = True):
        self.use_pytesseract = use_pytesseract and PYTESSERACT_AVAILABLE
        self.enable_tamil = enable_tamil
        self.enable_multi_config = enable_multi_config
        self.enable_adaptive = enable_adaptive
        self.enable_smart_fallback = enable_smart_fallback
        self.tamil_enhancer = TamilOCREnhancer() if enable_tamil else None
        self.validator = ExtractionValidator()
        
        if not self.use_pytesseract and use_pytesseract:
            logger.warning("pytesseract not available, OCR functionality limited")
    
    def extract_text(self, image: Image.Image) -> str:
        """Extract text from image using pytesseract with enhanced multi-config."""
        if not self.use_pytesseract:
            logger.warning("pytesseract not available")
            return ""
        
        try:
            # Try Tamil detection if enabled
            if self.enable_tamil and self.tamil_enhancer:
                lang = self.tamil_enhancer.detect_language(image)
                if lang == 'tamil':
                    text = self.tamil_enhancer.extract_tamil_text(image)
                    if text:
                        logger.info("Tamil text detected and extracted")
                        return self.validator.clean_text(text)
            
            # Use multi-config if enabled
            if self.enable_multi_config:
                result = self.extract_text_multi_config(image)
                return self.validator.clean_text(result['text'])
            
            # Fallback to single config
            processed = ImagePreprocessor.preprocess_for_ocr(image)
            text = pytesseract.image_to_string(
                processed,
                config='--psm 6'
            )
            return self.validator.clean_text(text.strip())
        except Exception as e:
            logger.error(f"Error extracting text with pytesseract: {e}")
            return ""
    
    def extract_with_smart_fallback(self, image: Image.Image) -> dict:
        """Extract with multiple fallback strategies (Phase 2)."""
        if not self.use_pytesseract:
            return {'text': '', 'confidence': 0.0, 'strategy': 'none'}
        
        strategies = [
            ('adaptive', self._strategy_adaptive),
            ('standard', self._strategy_standard),
            ('high_contrast', self._strategy_high_contrast),
            ('table_aware', self._strategy_table_aware),
        ]
        
        best_result = None
        best_score = 0.0
        
        for strategy_name, strategy_func in strategies:
            try:
                result = strategy_func(image)
                # Score = confidence * text_length_factor
                score = result['confidence'] * (1 + min(len(result['text']) / 100, 1))
                
                if score > best_score:
                    best_score = score
                    best_result = result
                    best_result['strategy'] = strategy_name
                
                # If high confidence, stop trying
                if result['confidence'] > 90:
                    logger.info(f"High confidence achieved with {strategy_name}")
                    break
            except Exception as e:
                logger.debug(f"Strategy {strategy_name} failed: {e}")
        
        if best_result:
            best_result['text'] = self.validator.clean_text(best_result['text'])
            logger.info(f"Best strategy: {best_result.get('strategy', 'unknown')} (conf: {best_result['confidence']:.1f}%)")
        
        return best_result or {'text': '', 'confidence': 0.0, 'strategy': 'none'}
    
    def _strategy_adaptive(self, image: Image.Image) -> dict:
        """Adaptive preprocessing + multi-config OCR."""
        if self.enable_adaptive:
            processed = ImagePreprocessor.preprocess_for_ocr_adaptive(image)
        else:
            processed = ImagePreprocessor.preprocess_for_ocr(image)
        
        if self.enable_multi_config:
            result = self.extract_text_multi_config(processed)
            return {'text': result['text'], 'confidence': result['confidence']}
        else:
            text = pytesseract.image_to_string(processed, config='--psm 6')
            return {'text': text, 'confidence': 75.0}
    
    def _strategy_standard(self, image: Image.Image) -> dict:
        """Standard preprocessing."""
        processed = ImagePreprocessor.preprocess_for_ocr(image)
        result = self.extract_text_multi_config(processed)
        return {'text': result['text'], 'confidence': result['confidence']}
    
    def _strategy_high_contrast(self, image: Image.Image) -> dict:
        """Extreme contrast enhancement."""
        img_array = np.array(image.convert('L'))
        # CLAHE (Contrast Limited Adaptive Histogram Equalization)
        clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
        enhanced = clahe.apply(img_array)
        enhanced_img = Image.fromarray(enhanced)
        
        # Apply standard preprocessing
        enhanced_img = ImagePreprocessor.resize_image(enhanced_img, scale=2.0)
        text = pytesseract.image_to_string(enhanced_img, config='--psm 6')
        return {'text': text, 'confidence': 70.0}
    
    def _strategy_table_aware(self, image: Image.Image) -> dict:
        """Table-aware extraction."""
        # Check if image has table structure
        if TableDetector.has_table_structure(image):
            # Use column-based PSM
            processed = ImagePreprocessor.preprocess_for_ocr(image)
            text = pytesseract.image_to_string(processed, config='--psm 4')  # Single column
            return {'text': text, 'confidence': 80.0}
        else:
            # Use standard
            return self._strategy_standard(image)
    
    def extract_text_multi_config(self, image: Image.Image) -> Dict[str, Any]:
        """Try multiple OCR configs and return best result."""
        if not self.use_pytesseract:
            return {'text': '', 'confidence': 0.0, 'config': 'none'}
        
        results = []
        processed = ImagePreprocessor.preprocess_for_ocr(image)
        
        for config_name, psm in self.PSM_CONFIGS.items():
            try:
                # Get text and confidence
                data = pytesseract.image_to_data(
                    processed,
                    config=psm,
                    output_type=pytesseract.Output.DICT
                )
                
                text = ' '.join([word for word in data['text'] if word.strip()])
                confidences = [c for c in data['conf'] if c != -1]
                avg_confidence = sum(confidences) / len(confidences) if confidences else 0
                word_count = len([w for w in data['text'] if w.strip()])
                
                results.append({
                    'text': text,
                    'confidence': avg_confidence,
                    'config': config_name,
                    'word_count': word_count
                })
            except Exception as e:
                logger.debug(f"Config {config_name} failed: {e}")
        
        if not results:
            return {'text': '', 'confidence': 0.0, 'config': 'none'}
        
        # Return result with best confidence AND reasonable word count
        # Weight: confidence * (1 + min(word_count/10, 1)) 
        # This favors results with both good confidence and more extracted text
        best = max(results, key=lambda x: x['confidence'] * (1 + min(x['word_count']/10, 1)))
        logger.info(f"Best OCR config: {best['config']} (conf: {best['confidence']:.1f}%, words: {best['word_count']})")
        return best
    
    def extract_text_with_confidence(self, image: Image.Image) -> Tuple[str, float]:
        """Extract text and estimate confidence score."""
        if not self.use_pytesseract:
            return "", 0.0
        
        try:
            # Use smart fallback if enabled (Phase 2)
            if self.enable_smart_fallback:
                result = self.extract_with_smart_fallback(image)
                return result['text'], result['confidence'] / 100.0
            
            # Use multi-config if enabled (Phase 1)
            if self.enable_multi_config:
                result = self.extract_text_multi_config(image)
                text = self.validator.clean_text(result['text'])
                confidence = result['confidence'] / 100.0
                return text, confidence
            
            # Fallback to single config
            processed = ImagePreprocessor.preprocess_for_ocr(image)
            
            # Get detailed OCR data
            data = pytesseract.image_to_data(
                processed,
                output_type=pytesseract.Output.DICT
            )
            
            # Extract text and calculate average confidence
            text_parts = []
            confidences = []
            
            for i, word in enumerate(data['text']):
                if word.strip():
                    text_parts.append(word)
                    conf = float(data['conf'][i])
                    if conf > 0:
                        confidences.append(conf)
            
            text = ' '.join(text_parts)
            text = self.validator.clean_text(text)
            avg_confidence = np.mean(confidences) / 100.0 if confidences else 0.0
            
            return text, avg_confidence
        except Exception as e:
            logger.error(f"Error extracting text with confidence: {e}")
            return "", 0.0
    
    def extract_structure(self, image: Image.Image) -> Dict[str, Any]:
        """Extract structured data (tables, text blocks) from image."""
        if not self.use_pytesseract:
            return {}
        
        try:
            processed = ImagePreprocessor.preprocess_for_ocr(image)
            
            data = pytesseract.image_to_data(
                processed,
                output_type=pytesseract.Output.DICT
            )
            
            # Organize by approximate rows and columns
            structure = {
                'lines': [],
                'blocks': [],
                'confidence': 0.0
            }
            
            # Group words into lines
            current_line = []
            current_y = None
            
            for i, text in enumerate(data['text']):
                if not text.strip():
                    continue
                
                y = data['top'][i]
                
                # Start new line if y-coordinate changes significantly
                if current_y is not None and abs(y - current_y) > 10:
                    if current_line:
                        structure['lines'].append(' '.join(current_line))
                    current_line = [text]
                    current_y = y
                else:
                    current_line.append(text)
                    if current_y is None:
                        current_y = y
            
            if current_line:
                structure['lines'].append(' '.join(current_line))
            
            # Calculate average confidence
            confidences = [float(c) for c in data['conf'] if float(c) > 0]
            structure['confidence'] = np.mean(confidences) / 100.0 if confidences else 0.0
            
            return structure
        except Exception as e:
            logger.error(f"Error extracting structure: {e}")
            return {'lines': [], 'blocks': [], 'confidence': 0.0}


class OriginDestinationDetector:
    """Detects origin and destination from bus schedule text with improved accuracy."""
    
    # Tamil Nadu cities (comprehensive list)
    KNOWN_CITIES = {
        'ERODE', 'SALEM', 'CHENNAI', 'MADURAI', 'TRICHY', 'COIMBATORE',
        'BENGALURU', 'BANGALORE', 'TIRUPPUR', 'VELLORE', 'KANCHIPURAM',
        'VILLUPURAM', 'TIRUNELVELI', 'NAGERCOIL', 'TENKASI', 'THENI',
        'DINDIGUL', 'KRISHNAGIRI', 'DHARMAAPURI', 'KALLAKURICHI', 'HOSUR',
        'ULHASNAGAR', 'PUNE', 'HYDERABAD', 'ANDHRA PRADESH', 'RAMESHWARAM',
        'KANYAKUMARI', 'CUDDALORE', 'CHENGALPATTU', 'RANIPET', 'KARUR',
        'TIRUPATHUR', 'PERAMBALUR', 'ARIYALUR', 'PUDUCHERRY', 'PONDICHERRY'
    }
    
    # Location names to city mappings (e.g., "Perundhu Nilayam" -> "RAMESHWARAM")
    LOCATION_TO_CITY = {
        'PERUNDHU NILAYAM': 'RAMESHWARAM',
        'CENTRAL BUS STAND': 'UNKNOWN',
        'BUSSTAND': 'UNKNOWN',
        'CENTRAL': 'UNKNOWN',
    }
    
    @staticmethod
    def detect_from_explicit_labels(text: str) -> Tuple[Optional[str], Optional[str]]:
        """Detect origin/destination from explicit labels like 'From X to Y'."""
        text_upper = text.upper()
        
        # Convert newlines to spaces for multi-line matching
        text_normalized = re.sub(r'\s+', ' ', text_upper)
        
        # Pattern: "From X To Y" (with flexible whitespace)
        from_to_match = re.search(r'FROM\s+([A-Z][A-Z\s]{2,}?)\s+TO\s+([A-Z][A-Z\s]{2,}?)(?:\s+|$)', text_normalized)
        if from_to_match:
            return from_to_match.group(1).strip(), from_to_match.group(2).strip()
        
        # Pattern: "ERODE Mandalam Express to BENGALURU" (Image 8812 case)
        # Detects: City ServiceType ... to Destination (handles multi-line)
        service_types = ['MANDALAM', 'EXPRESS', 'DELUXE', 'ORDINARY', 'AC', 'SLEEPER', 'NON-STOP', 'SEMI-EXPRESS']
        
        # First try: City ServiceType ... To Destination (all together)
        for service in service_types:
            pattern = rf'([A-Z][A-Z\s]{{2,}}?)\s+{service}.*?\s+TO\s+([A-Z][A-Z\s]{{2,}})(?:\s+|$)'
            match = re.search(pattern, text_normalized)
            if match:
                return match.group(1).strip(), match.group(2).strip()
        
        # Second try: City (line 1) ServiceType (line 2) ... To Destination
        # This handles: "ERODE\nDELUXE SERVICE\nDestination: BENGALURU"
        lines = text.split('\n')
        if len(lines) >= 2:
            candidate_origin = lines[0].strip().upper()
            if candidate_origin in OriginDestinationDetector.KNOWN_CITIES:
                # Check if next line is a service type
                next_line = lines[1].strip().upper()
                for service in service_types:
                    if service in next_line:
                        # Found service type, now look for destination
                        full_text = ' '.join(lines)
                        dest_match = re.search(rf'DESTINATION\s*[:=]?\s*([A-Z][A-Z\s]{{2,}})(?:\s+|$)', full_text.upper())
                        if dest_match:
                            return candidate_origin, dest_match.group(1).strip()
        
        # Pattern: "From X" (single origin)
        from_match = re.search(r'FROM\s+([A-Z][A-Z\s]{2,}?)(?:\s+TO|\s+→|$)', text_normalized)
        origin = from_match.group(1).strip() if from_match else None
        
        # Pattern: "To Y" (single destination)
        to_match = re.search(r'TO\s+([A-Z][A-Z\s]{2,}?)(?:\s+FROM|VIA|$)', text_normalized)
        destination = to_match.group(1).strip() if to_match else None
        
        # Pattern: "Origin: X, Destination: Y"
        origin_label = re.search(r'ORIGIN\s*[:=]?\s*([A-Z][A-Z\s]{2,}?)(?:\s+(?:DEST|TO)|,|$)', text_normalized)
        if origin_label and not origin:
            origin = origin_label.group(1).strip()
        
        dest_label = re.search(r'DESTINATION\s*[:=]?\s*([A-Z][A-Z\s]{2,}?)(?:\s+(?:FROM|ORIGIN)|$)', text_normalized)
        if dest_label and not destination:
            destination = dest_label.group(1).strip()
        
        # Pattern: "CITY1 → CITY2"
        arrow_match = re.search(r'([A-Z][A-Z\s]{2,}?)\s*(?:→|->)\s*([A-Z][A-Z\s]{2,}?)(?:\s|$)', text_normalized)
        if arrow_match:
            if not origin:
                origin = arrow_match.group(1).strip()
            if not destination:
                destination = arrow_match.group(2).strip()
        
        return origin, destination
    
    @staticmethod
    def detect_from_table_format(text: str) -> Tuple[Optional[str], Optional[str]]:
        """
        Detect origin/destination from table format where:
        - Origin is stated at top (Image 8805 format)
        - Table rows contain destinations and times
        
        Example:
        TRICHY
        SALEM        06:00
        KRISHNAGIRI  08:30
        BENGALURU    12:15
        """
        lines = text.split('\n')
        if not lines:
            return None, None
        
        origin = None
        destination = None
        
        # Extract all cities from text first
        text_upper = text.upper()
        potential_cities = []
        for city in OriginDestinationDetector.KNOWN_CITIES:
            if city in text_upper:
                potential_cities.append(city)
        
        if len(potential_cities) < 2:
            return None, None
        
        # Check first few lines for origin (city name only, or city with words like "Bus Services")
        for i, line in enumerate(lines[:5]):
            line_clean = line.strip().upper()
            
            # Skip empty lines
            if not line_clean:
                continue
            
            # If line is exactly a city name, it's likely the origin
            if line_clean in OriginDestinationDetector.KNOWN_CITIES:
                if not re.search(r'\d{1,2}:\d{2}', line_clean):
                    origin = line_clean
                    break
            
            # Also check for lines like "TRICHY Bus Services" or "TRICHY to Multiple Cities"
            for city in OriginDestinationDetector.KNOWN_CITIES:
                if line_clean.startswith(city) and line_clean != city:
                    # Check if it's something like "CITY Bus Services", "CITY to X", etc
                    words_after = line_clean[len(city):].strip()
                    if words_after and not re.search(r'\d{1,2}:\d{2}', words_after):
                        # Likely origin with description
                        origin = city
                        break
            
            if origin:
                break
        
        # If we found origin, look for destination in table rows (lines with times)
        if origin:
            for line in lines:
                line_upper = line.strip().upper()
                
                # Look for lines with time pattern
                if re.search(r'\d{1,2}:\d{2}', line_upper):
                    # Extract city name (part before the time)
                    city_part = re.sub(r'\d{1,2}:\d{2}.*$', '', line_upper).strip()
                    
                    # Find first city mentioned in this line
                    for city in OriginDestinationDetector.KNOWN_CITIES:
                        if city in city_part:
                            if not destination:
                                destination = city
                            break
            
            if destination:
                return origin, destination
        
        # Fallback: Try to extract from lines that might have "From CITY" pattern
        for line in lines[:10]:
            line_upper = line.strip().upper()
            
            # Check for "From CITY" or "from: CITY" pattern
            from_match = re.search(r'FROM\s*[:=]?\s*([A-Z][A-Z\s]{2,}?)(?:\s+|$)', line_upper)
            if from_match:
                candidate = from_match.group(1).strip()
                if candidate in OriginDestinationDetector.KNOWN_CITIES:
                    origin = candidate
                    break
        
        # If we found origin from "From CITY" pattern, look for destinations in table
        if origin:
            for line in lines:
                line_upper = line.strip().upper()
                
                # Look for lines with time pattern
                if re.search(r'\d{1,2}:\d{2}', line_upper):
                    # Extract city name
                    city_part = re.sub(r'\d{1,2}:\d{2}.*$', '', line_upper).strip()
                    
                    for city in OriginDestinationDetector.KNOWN_CITIES:
                        if city in city_part and city != origin:
                            if not destination:
                                destination = city
                            break
            
            if destination:
                return origin, destination
        
        return None, None
    
    @staticmethod
    def validate_cities(origin: Optional[str], destination: Optional[str]) -> Tuple[Optional[str], Optional[str]]:
        """Validate and clean up city names."""
        known_cities = list(OriginDestinationDetector.KNOWN_CITIES)
        
        valid_origin = None
        valid_destination = None
        
        if origin:
            origin = origin.strip().upper()
            if origin in known_cities:
                valid_origin = origin
            elif len(origin) > 3 and re.match(r'^[A-Z\s]+$', origin):
                # Look for partial matches
                for city in known_cities:
                    if city in origin or origin in city:
                        valid_origin = city
                        break
                if not valid_origin:
                    valid_origin = origin  # Accept as-is if looks like a city
        
        if destination:
            destination = destination.strip().upper()
            if destination in known_cities:
                valid_destination = destination
            elif len(destination) > 3 and re.match(r'^[A-Z\s]+$', destination):
                # Look for partial matches
                for city in known_cities:
                    if city in destination or destination in city:
                        valid_destination = city
                        break
                if not valid_destination:
                    valid_destination = destination  # Accept as-is if looks like a city
        
        return valid_origin, valid_destination
    
    @staticmethod
    def detect(text: str) -> Tuple[Optional[str], Optional[str]]:
        """Complete detection pipeline with Via format support."""
        # Try Via format first (highest priority)
        origin, destination, stops = OriginDestinationDetector.detect_via_format(text)
        if origin and destination:
            origin, destination = OriginDestinationDetector.validate_cities(origin, destination)
            return origin, destination
        
        # Try explicit labels next (high priority)
        origin, destination = OriginDestinationDetector.detect_from_explicit_labels(text)
        origin, destination = OriginDestinationDetector.validate_cities(origin, destination)
        if origin and destination:
            return origin, destination
        
        # If only found origin or destination, try table format for the missing piece
        table_origin, table_dest = OriginDestinationDetector.detect_from_table_format(text)
        
        # Use table format results to fill gaps
        if not origin and table_origin:
            origin = table_origin
        if not destination and table_dest:
            destination = table_dest
        
        origin, destination = OriginDestinationDetector.validate_cities(origin, destination)
        return origin, destination
    
    @staticmethod
    def detect_via_format(text: str) -> Tuple[Optional[str], Optional[str], List[str]]:
        """
        Detect route in 'Origin Via Stop1 Via Stop2 To Destination' format.
        
        Common in Tamil Nadu bus timetables where:
        - Origin is stated at top (sometimes with location name)
        - Intermediate stops prefixed with "Via"
        - Final destination may be preceded by "To"
        
        Returns:
            Tuple of (origin, destination, [intermediate_stops])
        """
        text_upper = text.upper()
        stops = []
        
        # First check if location name exists (e.g., "Perundhu Nilayam")
        origin = None
        for loc_name, city_name in OriginDestinationDetector.LOCATION_TO_CITY.items():
            if loc_name in text_upper:
                origin = city_name
                break
        
        # Parse "Via" pattern: "Origin Via Stop1 Via Stop2 To Destination"
        # Pattern: "(ORIGIN|CITY) (VIA CITY)+ (TO CITY)?"
        
        # Look for lines with "Via" keyword
        via_pattern = r'([A-Z][A-Z\s]{2,}?)\s+VIA\s+([A-Z][A-Z\s]{2,}?)'
        via_matches = re.findall(via_pattern, text_upper)
        
        destination = None
        
        # If we found via matches, first group is origin, rest are stops
        if via_matches:
            if not origin:
                origin = via_matches[0][0].strip()
            
            # All matches are stops
            for match in via_matches:
                stop = match[1].strip()
                if stop not in stops:
                    stops.append(stop)
        
        # Look for "To Destination" pattern (destination after "To")
        to_pattern = r'\s+TO\s+([A-Z][A-Z\s]{2,}?)(?:\s+VIA|\s*$)'
        to_match = re.search(to_pattern, text_upper)
        if to_match:
            destination = to_match.group(1).strip()
        
        # If no "To", look for pattern: "ORIGIN VIA ... CITY" where last city might be destination
        if not destination and via_matches:
            # Check if last stop could be destination
            potential_dest = via_matches[-1][1].strip() if via_matches else None
            if potential_dest and potential_dest != origin:
                destination = potential_dest
        
        return origin, destination, stops


class DataExtractor:
    """Extracts structured bus timing data from OCR text."""
    
    # Regex patterns for common bus schedule formats
    PATTERNS = {
        'time': r'\b(0[0-9]|1[0-9]|2[0-3]):([0-5][0-9])\b(?:\s*(AM|PM|am|pm))?',
        'route_number': r'Route\s*(?:No\.?|Number)?\s*:?\s*([A-Z0-9\-]+)',
        'departure': r'(?:Depart|Dept|Leave|Departure|से निकलता)\s*(?:Time)?:?\s*(\d{1,2}:\d{2}\s*(?:AM|PM)?)',
        'arrival': r'(?:Arrive|Arrival|पहुँचता)\s*(?:Time)?:?\s*(\d{1,2}:\d{2}\s*(?:AM|PM)?)',
        'duration': r'(?:Duration|Hrs?|घंटे|Neram)\s*:?\s*([\d.]+\s*(?:hrs?|घंटे))',
        'fare': r'(?:Fare|Price|Cost|किराया)\s*:?\s*(?:Rs\.?|₹)?\s*([\d,]+(?:\.\d{2})?)',
        'bus_type': r'(?:Bus\s+Type|Vehicle)\s*:?\s*([A-Za-z\s]+(?:AC|NON-AC|SLEEPER|SEATER)?)',
        'city': r'([A-Z][A-Z\s]+(?:City|Chennai|Madurai|Trichy|Coimbatore|Salem|Tiruppur|Erode))',
        'arrow_symbols': r'[→↔↑↓⇔\-\>]',
        'bidirectional': r'(?:↔|⇔|both\s+ways|दोनों\s+ओर)',
    }
    
    @staticmethod
    def extract_times(text: str) -> List[str]:
        """Extract all time references from text."""
        matches = re.findall(DataExtractor.PATTERNS['time'], text)
        times = []
        for match in matches:
            hour, minute, period = match
            hour = int(hour)
            minute = int(minute)
            
            # Validate hour and minute ranges
            if hour > 23 or minute > 59:
                continue  # Skip invalid times
            
            # Convert to 24-hour format if AM/PM is present
            # Only convert if hour is in 12-hour format (1-12)
            if period:
                if period.upper() == 'PM' and hour != 12 and hour <= 11:
                    hour += 12
                elif period.upper() == 'AM' and hour == 12:
                    hour = 0
            
            time_str = f"{hour:02d}:{minute:02d}"
            times.append(time_str)

        
        return times
    
    @staticmethod
    def extract_cities(text: str) -> List[str]:
        """Extract city/town names from text."""
        # Look for known city patterns
        cities = []
        
        # Check for specific Tamil Nadu cities
        tn_cities = [
            'CHENNAI', 'MADURAI', 'TRICHY', 'COIMBATORE', 'SALEM', 
            'TIRUPPUR', 'ERODE', 'KANCHIPURAM', 'VILLUPURAM', 'VELLORE',
            'DINDIGUL', 'THENI', 'TENKASI', 'NAGERCOIL', 'TIRUNELVELI'
        ]
        
        text_upper = text.upper()
        for city in tn_cities:
            if city in text_upper:
                cities.append(city)
        
        return list(set(cities))  # Remove duplicates
    
    @staticmethod
    def extract_stops(text: str) -> List[BusStop]:
        """
        Extract route information from text.
        
        Handles formats:
        1. Table format: City names with times on separate lines
        2. Via format: "Origin Via City1 Via City2 To Destination"
        
        IMPORTANT: In bus schedule tables, each row with a time is often a SEPARATE 
        BUS RUN (not a stop). This returns the row data for further processing.
        Caller should treat these as individual runs when multiple times exist.
        """
        stops = []
        
        # Try Via format first
        text_upper = text.upper()
        
        # Pattern: Extract "Via CITY TIME" or "VIA CITY @ TIME"
        via_stop_pattern = r'VIA\s+([A-Z][A-Z\s]{2,}?)\s+(\d{1,2}:\d{2})'
        via_stops = re.findall(via_stop_pattern, text_upper)
        
        if via_stops:
            for city, time in via_stops:
                stop = BusStop(
                    city=city.strip(),
                    landmark=city.strip(),
                    time=time,
                    departure_time=time
                )
                stops.append(stop)
            
            if stops:
                return stops
        
        # Fallback to table format extraction
        # Split by common stop delimiters
        lines = text.split('\n')
        
        for line in lines:
            line = line.strip()
            if not line or len(line) < 3:
                continue
            
            # Try to extract city, landmark, and time from line
            times = DataExtractor.extract_times(line)
            
            if times:
                # Extract potential city name
                words = line.split()
                # Filter out common words and times
                potential_city = ' '.join([w for w in words if not re.match(r'^\d{1,2}:\d{2}', w)])
                
                stop = BusStop(
                    city=potential_city[:30] if potential_city else 'UNKNOWN',
                    landmark=potential_city[:50] if potential_city else 'UNKNOWN',
                    time=times[0] if times else '00:00',
                    departure_time=times[0] if times else None
                )
                stops.append(stop)
        
        return stops
    
    @staticmethod
    def detect_bidirectional(text: str) -> bool:
        """Detect if route is bidirectional from text or symbols."""
        bidirectional_indicators = [
            '↔', '⇔', 'both ways', 'bidirectional', 'दोनों ओर',
            'return', 'round trip', 'two way'
        ]
        
        text_lower = text.lower()
        for indicator in bidirectional_indicators:
            if indicator.lower() in text_lower:
                return True
        
        return bool(re.search(DataExtractor.PATTERNS['bidirectional'], text))
    
    @staticmethod
    def normalize_time(time_str: str) -> str:
        """Normalize time string to HH:MM format."""
        # Handle various time formats
        time_str = time_str.strip().upper()
        
        # Remove AM/PM suffix and convert to 24-hour format if needed
        match = re.match(r'(\d{1,2}):(\d{2})\s*(AM|PM)?', time_str)
        if match:
            hour, minute, period = match.groups()
            hour = int(hour)
            
            if period:
                if period == 'PM' and hour != 12:
                    hour += 12
                elif period == 'AM' and hour == 12:
                    hour = 0
            
            return f"{hour:02d}:{minute}"
        
        return time_str


class GoogleImageSearcher:
    """Searches Google Images for bus schedule images."""
    
    USER_AGENTS = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
    ]
    
    def __init__(self, max_retries: int = 3, enable_dedup: bool = True, search_size: str = 'medium'):
        """
        Initialize searcher.
        
        Args:
            max_retries: Max retry attempts
            enable_dedup: Enable duplicate image detection
            search_size: Image size preference ('small', 'medium', 'large', 'extra-large')
        """
        self.max_retries = max_retries
        self.session = requests.Session()
        self.enable_dedup = enable_dedup
        self.search_size = search_size
        # Track processed image hashes to detect duplicates
        self.processed_hashes = set()
        self.image_urls_cache = set()
    
    def _enhance_search_query(self, query: str) -> str:
        """
        Enhance search query with relevant keywords for better results.
        
        Examples:
            "Chennai to Madurai bus" → "Chennai to Madurai bus schedule ticket timing time table"
            "bus time" → "bus schedule timing time table booking"
        """
        query_lower = query.lower()
        
        # Keywords to add based on content
        enhancement_keywords = {
            'bus': ['schedule', 'timing', 'time table', 'ticket', 'fare', 'route'],
            'train': ['schedule', 'timing', 'ticket', 'platform', 'route'],
            'flight': ['schedule', 'timing', 'ticket', 'seat', 'route'],
        }
        
        # Find relevant keywords and add them
        enhanced = query
        for key, keywords in enhancement_keywords.items():
            if key in query_lower:
                # Add keywords that aren't already in query
                for kw in keywords:
                    if kw not in query_lower:
                        enhanced += f" {kw}"
                break
        
        return enhanced
    
    def _get_direct_image_urls(self, query: str, limit: int) -> List[str]:
        """
        Get image URLs directly without using third-party search APIs.
        Uses Bing Image Search direct URL construction.
        """
        urls = []
        try:
            from bing_image_downloader import downloader
            
            logger.info(f"Searching Bing for images: {query}")
            
            # Use bing-image-downloader to fetch URLs
            downloader_obj = downloader.Bing(
                query=query,
                limit=limit,
                download=False,  # We only want URLs, not downloads
                silent=True,
                adult_filter_off=False,
                force_replace=False
            )
            
            # Get the image URLs
            image_list = downloader_obj.asarray()
            if image_list is not None and len(image_list) > 0:
                urls = image_list[:limit].tolist() if hasattr(image_list, 'tolist') else list(image_list)[:limit]
                logger.info(f"Direct Bing search found {len(urls)} images")
        except Exception as e:
            logger.debug(f"Direct image URL fetch failed: {e}")
        
        return urls
    
    def search_images(self, query: str, limit: int = 10, enhance_query: bool = True) -> List[str]:
        """
        Search for images using alternative method (since direct Google Images API is restricted).
        
        Note: Direct Google Images API requires authentication. This uses alternative approaches:
        1. Bing Images (primary - most reliable)
        2. DuckDuckGo Images (fallback)
        3. Auto-enhanced queries for better results
        
        Args:
            query: Search query (e.g., "Chennai to Madurai bus schedule")
            limit: Maximum number of images to retrieve
            enhance_query: Whether to enhance query with keywords for better results
        
        Returns:
            List of image URLs (deduplicated if enabled)
        """
        logger.info(f"Searching for images: {query}")
        
        # Enhance query for better search results
        if enhance_query:
            original_query = query
            query = self._enhance_search_query(query)
            if query != original_query:
                logger.info(f"Enhanced query: {original_query} → {query}")
        
        image_urls = []
        
        # Try primary method: Direct Bing search (most reliable)
        image_urls.extend(self._get_direct_image_urls(query, limit * 2))
        
        # Try DuckDuckGo as fallback
        if len(image_urls) < limit:
            image_urls.extend(self._search_duckduckgo(query, limit * 2))
        
        # If still not enough, try Bing fallback
        if len(image_urls) < limit:
            needed = limit * 2 - len(image_urls)
            image_urls.extend(self._search_bing(query, needed))
        
        # Remove duplicates and cache
        unique_urls = []
        for url in image_urls:
            if url not in self.image_urls_cache and url:
                unique_urls.append(url)
                self.image_urls_cache.add(url)
        
        logger.info(f"Found {len(unique_urls)} unique images (dedup enabled: {self.enable_dedup})")
        return unique_urls[:limit]
    
    def _search_duckduckgo(self, query: str, limit: int) -> List[str]:
        """Search images using DuckDuckGo image search API."""
        try:
            urls = []
            # Using DuckDuckGo's API endpoint for image search
            from urllib.parse import urlencode
            
            params = {
                'q': query,
                'ia': 'images',
                'iax': 'images'
            }
            
            search_url = f"https://api.duckduckgo.com/?{urlencode(params)}&format=json"
            headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
            
            try:
                response = self.session.get(search_url, headers=headers, timeout=10)
                response.raise_for_status()
                data = response.json()
                
                # Extract image URLs from results
                if 'Results' in data:
                    for result in data.get('Results', [])[:limit]:
                        if 'Image' in result:
                            urls.append(result['Image'])
                
                logger.info(f"DuckDuckGo search returned {len(urls)} results for: {query}")
            except Exception as e:
                logger.debug(f"DuckDuckGo API error: {e}")
            
            return urls
        except Exception as e:
            logger.warning(f"DuckDuckGo search failed: {e}")
            return []
    
    def _search_bing(self, query: str, limit: int) -> List[str]:
        """Search images using Bing Image Search with Selenium for JavaScript rendering."""
        try:
            urls = []
            
            logger.info(f"Scraping Bing Images for: {query}")
            
            try:
                from selenium import webdriver
                from selenium.webdriver.common.by import By
                import json
                import time
                
                # Construct Bing Images search URL
                from urllib.parse import urlencode
                encoded_query = quote(query)
                bing_search_url = f"https://www.bing.com/images/search?q={encoded_query}&form=QBILPG"
                
                logger.info(f"Search URL: {bing_search_url}")
                
                # Setup headless browser
                options = webdriver.ChromeOptions()
                options.add_argument('--headless')
                options.add_argument('--no-sandbox')
                options.add_argument('--disable-dev-shm-usage')
                options.add_argument('--disable-gpu')
                
                driver = webdriver.Chrome(options=options)
                
                try:
                    driver.get(bing_search_url)
                    
                    # Wait for images to load
                    time.sleep(2)
                    
                    # Scroll to load more images
                    for scroll_count in range(3):
                        driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
                        time.sleep(1)
                    
                    # Extract image URLs from .iusc elements
                    # Bing stores image metadata in <div class="iusc"> with 'm' attribute
                    iusc_elements = driver.find_elements(By.CLASS_NAME, "iusc")
                    
                    logger.info(f"Found {len(iusc_elements)} IUSC elements")
                    
                    for elem in iusc_elements:
                        try:
                            # Get the JSON data from the 'm' attribute
                            m_attr = elem.get_attribute("m")
                            
                            if m_attr:
                                # Parse JSON to extract image URL
                                data = json.loads(m_attr)
                                
                                if "murl" in data and data["murl"]:
                                    image_url = data["murl"]
                                    
                                    # Validate URL
                                    if image_url.startswith("http"):
                                        urls.append(image_url)
                                        
                                        if len(urls) >= limit:
                                            break
                        except (json.JSONDecodeError, KeyError, TypeError):
                            # Skip if JSON parsing fails or murl not present
                            continue
                    
                    logger.info(f"Bing Selenium extracted {len(urls)} image URLs")
                    
                finally:
                    driver.quit()
                
            except ImportError:
                logger.warning("Selenium not available, using fallback method")
                
                # Fallback: Use bing-image-downloader
                try:
                    from bing_image_downloader import downloader
                    
                    downloader_obj = downloader.Bing(
                        query=query,
                        limit=limit,
                        download=False,
                        silent=True,
                        adult_filter_off=False
                    )
                    
                    image_list = downloader_obj.asarray()
                    if image_list is not None and len(image_list) > 0:
                        urls = list(image_list)[:limit]
                        logger.info(f"Bing downloader found {len(urls)} images")
                except Exception as e:
                    logger.warning(f"Bing downloader failed: {e}")
            
            return urls
        except Exception as e:
            logger.warning(f"Bing search failed: {e}")
            return []
    
    def _compute_image_hash(self, image_data: bytes) -> str:
        """
        Compute SHA256 hash of image data for duplicate detection.
        
        Returns:
            Hex string of image hash
        """
        import hashlib
        return hashlib.sha256(image_data).hexdigest()
    
    def _is_duplicate_image(self, image_data: bytes) -> bool:
        """
        Check if image has been processed before (duplicate detection).
        
        Returns:
            True if duplicate, False otherwise
        """
        if not self.enable_dedup:
            return False
        
        image_hash = self._compute_image_hash(image_data)
        if image_hash in self.processed_hashes:
            logger.info(f"Skipping duplicate image (hash: {image_hash[:16]}...)")
            return True
        
        self.processed_hashes.add(image_hash)
        return False
    
    def download_image(self, url: str) -> Optional[Tuple[Image.Image, str]]:
        """
        Download and return image from URL.
        
        Returns:
            Tuple of (PIL Image, image_hash) or None if failed/duplicate
        """
        try:
            headers = {'User-Agent': np.random.choice(self.USER_AGENTS)}
            response = self.session.get(url, headers=headers, timeout=10)
            response.raise_for_status()
            
            image_data = response.content
            
            # Check for duplicates
            if self._is_duplicate_image(image_data):
                logger.warning(f"Skipping duplicate image from {url}")
                return None
            
            image_hash = self._compute_image_hash(image_data)
            image = Image.open(BytesIO(image_data))
            
            return (image, image_hash)
        except Exception as e:
            logger.warning(f"Failed to download image from {url}: {e}")
            return None


class BusDataProcessor:
    """Processes and normalizes extracted bus data."""
    
    @staticmethod
    def generate_service_code(origin: str, destination: str, time: str) -> str:
        """Generate a service code similar to TNSTC format."""
        origin_code = origin[:3].upper()
        dest_code = destination[:3].upper()
        time_code = time.replace(':', '')
        
        return f"IMG{origin_code}{dest_code}{time_code}"
    
    @staticmethod
    def normalize_route(raw_text: str, image_source: str = None) -> Optional[BusRoute]:
        """
        Convert raw OCR text to structured BusRoute.
        
        Args:
            raw_text: Text extracted from image via OCR
            image_source: Source image URL or path
        
        Returns:
            BusRoute object or None if parsing fails
        """
        try:
            if not raw_text or raw_text.strip() == '':
                return None
            
            # Extract key information
            times = DataExtractor.extract_times(raw_text)
            is_bidirectional = DataExtractor.detect_bidirectional(raw_text)
            
            # Use improved origin/destination detection (handles Image 8812 case)
            origin, destination = OriginDestinationDetector.detect(raw_text)
            
            # Fallback to city extraction if explicit labels not found
            if not origin or not destination:
                cities = DataExtractor.extract_cities(raw_text)
                if len(cities) >= 2:
                    if not origin:
                        origin = cities[0]
                    if not destination:
                        destination = cities[1] if len(cities) > 1 else cities[0]
            
            stops = DataExtractor.extract_stops(raw_text)
            
            if not origin or not destination or not times:
                logger.warning("Insufficient data extracted from image")
                return None
            
            departure_time = times[0] if times else "00:00"
            arrival_time = times[1] if len(times) > 1 else "00:00"
            
            # Generate service code
            service_code = BusDataProcessor.generate_service_code(origin, destination, departure_time)
            
            # Create BusRoute object
            route = BusRoute(
                service_code=service_code,
                origin=origin,
                destination=destination,
                departure_time=departure_time,
                arrival_time=arrival_time,
                stops=stops,
                bidirectional=is_bidirectional,
                image_source=image_source,
                raw_text=raw_text,
                confidence_score=0.7  # Default confidence
            )
            
            return route
        
        except Exception as e:
            logger.error(f"Error normalizing route: {e}")
            return None
    
    @staticmethod
    def to_tnstc_format(route: BusRoute) -> Dict[str, Any]:
        """Convert BusRoute to TNSTC/MTC JSON format (now includes image_source for verification)."""
        return {
            'service_code': route.service_code,
            'route_number': route.route_number,
            'corporation': route.corporation,
            'origin': route.origin,
            'destination': route.destination,
            'departure_time': route.departure_time,
            'arrival_time': route.arrival_time,
            'duration': route.duration or 'UNKNOWN',
            'available_seats': route.available_seats or 'UNKNOWN',
            'bus_type': route.bus_type or 'STANDARD',
            'fare': route.fare or 'UNKNOWN',
            'journey_date': route.journey_date or datetime.now().strftime('%d/%m/%Y'),
            'stops': [
                {
                    'city': stop.city,
                    'landmark': stop.landmark,
                    'time': stop.time
                }
                for stop in route.stops
            ],
            'extracted_at': route.extracted_at,
            'source': 'Google Images',
            'image_source': route.image_source,  # ✅ Now included to verify extraction
            'confidence_score': route.confidence_score,
            'bidirectional': route.bidirectional
        }


class BusImageAnalyzer:
    """Main analyzer combining all components."""
    
    def __init__(self, output_dir: str = './data/google_images_bus'):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
        self.ocr = OCRExtractor()
        self.searcher = GoogleImageSearcher()
        self.processor = BusDataProcessor()
        self.extracted_routes = []
    
    def process_local_image(self, image_path: str) -> Optional[BusRoute]:
        """Process a local image file."""
        try:
            logger.info(f"Processing local image: {image_path}")
            
            image = Image.open(image_path)
            
            # Extract text
            text, confidence = self.ocr.extract_text_with_confidence(image)
            
            if not text:
                logger.warning(f"No text extracted from {image_path}")
                return None
            
            logger.info(f"Extracted text (confidence: {confidence:.2%}): {text[:100]}...")
            
            # Normalize to BusRoute
            route = self.processor.normalize_route(text, image_source=image_path)
            
            if route:
                route.confidence_score = confidence
                self.extracted_routes.append(route)
                logger.info(f"Successfully extracted route: {route.service_code}")
            
            return route
        
        except Exception as e:
            logger.error(f"Error processing image {image_path}: {e}")
            return None
    
    def process_url_image(self, url: str) -> Optional[BusRoute]:
        """Process image from URL with duplicate detection and hash tracking."""
        try:
            logger.info(f"Processing image from URL: {url}")
            
            result = self.searcher.download_image(url)
            if result is None:
                return None
            
            image, image_hash = result  # Unpack tuple
            
            # Extract text
            text, confidence = self.ocr.extract_text_with_confidence(image)
            
            if not text:
                logger.warning(f"No text extracted from {url}")
                return None
            
            logger.info(f"Extracted text (confidence: {confidence:.2%}): {text[:100]}...")
            
            # Normalize to BusRoute
            route = self.processor.normalize_route(text, image_source=url)
            
            if route:
                route.confidence_score = confidence
                self.extracted_routes.append(route)
                logger.info(f"Successfully extracted route: {route.service_code} (image hash: {image_hash[:16]}...)")
            
            return route
        
        except Exception as e:
            logger.error(f"Error processing URL image {url}: {e}")
            return None
    
    def search_and_process(self, query: str, limit: int = 5) -> List[BusRoute]:
        """Search Google Images and process results."""
        logger.info(f"Searching for: {query}")
        
        image_urls = self.searcher.search_images(query, limit=limit, enhance_query=False)
        logger.info(f"Found {len(image_urls)} images")
        
        routes = []
        for idx, url in enumerate(image_urls, 1):
            logger.info(f"Processing image {idx}/{len(image_urls)}")
            route = self.process_url_image(url)
            if route:
                routes.append(route)
        
        return routes
    
    def search_and_process_enhanced(self, query: str, limit: int = 5, enhance_query: bool = True) -> List[BusRoute]:
        """Search Google Images with optional query enhancement and process results."""
        logger.info(f"Searching for: {query} (enhance_query={enhance_query})")
        
        image_urls = self.searcher.search_images(query, limit=limit, enhance_query=enhance_query)
        logger.info(f"Found {len(image_urls)} unique images (duplicate detection: {self.searcher.enable_dedup})")
        
        routes = []
        for idx, url in enumerate(image_urls, 1):
            logger.info(f"Processing image {idx}/{len(image_urls)}")
            route = self.process_url_image(url)
            if route:
                routes.append(route)
        
        return routes
    
    def save_results(self, filename: str = 'extracted_buses.json') -> Path:
        """Save extracted routes to JSON file."""
        output_path = self.output_dir / filename
        
        # Convert routes to TNSTC format
        tnstc_data = [
            self.processor.to_tnstc_format(route)
            for route in self.extracted_routes
        ]
        
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(tnstc_data, f, indent=2, ensure_ascii=False)
        
        logger.info(f"Saved {len(tnstc_data)} routes to {output_path}")
        return output_path
    
    def get_summary(self) -> Dict[str, Any]:
        """Get summary of extracted data."""
        if not self.extracted_routes:
            return {
                'total_routes': 0,
                'total_stops': 0,
                'avg_confidence': 0.0,
                'cities': [],
                'bidirectional_routes': 0
            }
        
        total_stops = sum(len(route.stops) for route in self.extracted_routes)
        avg_confidence = np.mean([route.confidence_score for route in self.extracted_routes])
        cities = set()
        for route in self.extracted_routes:
            cities.add(route.origin)
            cities.add(route.destination)
        
        bidirectional = sum(1 for route in self.extracted_routes if route.bidirectional)
        
        return {
            'total_routes': len(self.extracted_routes),
            'total_stops': total_stops,
            'avg_confidence': float(avg_confidence),
            'cities': sorted(list(cities)),
            'bidirectional_routes': bidirectional
        }


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description='Extract bus timing data from Google Images'
    )
    
    parser.add_argument(
        '--search',
        type=str,
        help='Search query for Google Images (e.g., "Chennai to Madurai bus schedule")'
    )
    
    parser.add_argument(
        '--process-image',
        type=str,
        help='Process a local image file'
    )
    
    parser.add_argument(
        '--process-url',
        type=str,
        help='Process an image from URL'
    )
    
    parser.add_argument(
        '--batch-search',
        type=str,
        help='File containing search queries (one per line)'
    )
    
    parser.add_argument(
        '--limit',
        type=int,
        default=10,
        help='Maximum number of images to process'
    )
    
    parser.add_argument(
        '--output',
        type=str,
        default='./data/google_images_bus',
        help='Output directory for results'
    )
    
    parser.add_argument(
        '--no-enhance-query',
        action='store_true',
        help='Disable automatic query enhancement (for better search results)'
    )
    
    parser.add_argument(
        '--no-dedup',
        action='store_true',
        help='Disable duplicate image detection'
    )
    
    parser.add_argument(
        '--image-size',
        type=str,
        choices=['small', 'medium', 'large', 'extra-large'],
        default='medium',
        help='Preferred image size for better quality'
    )
    
    args = parser.parse_args()
    
    # Initialize analyzer with options
    analyzer = BusImageAnalyzer(output_dir=args.output)
    analyzer.searcher.enable_dedup = not args.no_dedup
    analyzer.searcher.search_size = args.image_size
    
    enhance_query = not args.no_enhance_query
    
    # Process based on arguments
    if args.process_image:
        logger.info("Processing local image")
        route = analyzer.process_local_image(args.process_image)
        if route:
            logger.info(f"Extracted: {route.service_code}")
    
    elif args.process_url:
        logger.info("Processing URL image")
        route = analyzer.process_url_image(args.process_url)
        if route:
            logger.info(f"Extracted: {route.service_code}")
    
    elif args.batch_search:
        logger.info(f"Processing batch search from {args.batch_search}")
        with open(args.batch_search, 'r') as f:
            queries = [line.strip() for line in f if line.strip()]
        
        for query in queries:
            analyzer.search_and_process_enhanced(query, limit=args.limit, enhance_query=enhance_query)
    
    elif args.search:
        logger.info(f"Searching for: {args.search}")
        analyzer.search_and_process_enhanced(args.search, limit=args.limit, enhance_query=enhance_query)
    
    else:
        parser.print_help()
        return
    
    # Save and display summary
    if analyzer.extracted_routes:
        output_path = analyzer.save_results()
        summary = analyzer.get_summary()
        
        logger.info("\n" + "=" * 60)
        logger.info("EXTRACTION SUMMARY")
        logger.info("=" * 60)
        for key, value in summary.items():
            logger.info(f"{key}: {value}")
        logger.info(f"Results saved to: {output_path}")
    else:
        logger.warning("No routes extracted")


if __name__ == '__main__':
    main()
