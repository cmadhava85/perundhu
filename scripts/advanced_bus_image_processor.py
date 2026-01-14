"""
Advanced Bus Schedule Image Processing
=======================================
Handles symbol detection, multi-page images, and advanced image analysis.

Features:
- Arrow and symbol detection (directional, bidirectional, route markers)
- Multi-page image detection and splitting
- Table structure recognition
- Data validation and deduplication
"""

import logging
import re
from dataclasses import dataclass
from typing import List, Dict, Tuple, Optional, Any
from collections import defaultdict
import hashlib

import cv2
import numpy as np
from PIL import Image
import pytesseract

logger = logging.getLogger(__name__)


@dataclass
class SymbolDetection:
    """Result of symbol detection in image."""
    has_arrow: bool
    arrow_type: str  # 'forward', 'backward', 'bidirectional', 'vertical', 'none'
    arrow_positions: List[Tuple[int, int]]  # (x, y) coordinates
    route_symbols: List[str]
    confidence: float


class SymbolDetector:
    """Detects arrows, symbols, and directional indicators in images."""
    
    # Unicode and ASCII arrow symbols
    ARROW_SYMBOLS = {
        '→': 'forward',
        '←': 'backward',
        '↔': 'bidirectional',
        '⇒': 'forward_bold',
        '⇐': 'backward_bold',
        '⇔': 'bidirectional_bold',
        '↑': 'up',
        '↓': 'down',
        '⊡': 'square_marker',
        '●': 'circle_marker',
        '■': 'filled_square',
        '○': 'circle',
    }
    
    def __init__(self):
        self.arrow_templates = self._create_arrow_templates()
    
    def _create_arrow_templates(self) -> Dict[str, np.ndarray]:
        """Create simple arrow templates for template matching."""
        templates = {}
        
        # Create simple arrow templates
        # Right arrow (→)
        right_arrow = np.zeros((20, 20), dtype=np.uint8)
        cv2.arrowedLine(right_arrow, (2, 10), (18, 10), 255, 2)
        templates['right_arrow'] = right_arrow
        
        # Left arrow (←)
        left_arrow = np.zeros((20, 20), dtype=np.uint8)
        cv2.arrowedLine(left_arrow, (18, 10), (2, 10), 255, 2)
        templates['left_arrow'] = left_arrow
        
        # Bidirectional arrow (↔)
        bi_arrow = np.zeros((20, 20), dtype=np.uint8)
        cv2.arrowedLine(bi_arrow, (2, 10), (18, 10), 255, 2)
        cv2.arrowedLine(bi_arrow, (18, 10), (2, 10), 255, 2)
        templates['bidirectional_arrow'] = bi_arrow
        
        return templates
    
    def detect_unicode_symbols(self, text: str) -> Dict[str, Any]:
        """Detect arrow and symbol Unicode characters in text."""
        result = {
            'symbols_found': [],
            'arrow_type': 'none',
            'is_bidirectional': False,
            'confidence': 0.0
        }
        
        for char, arrow_type in self.ARROW_SYMBOLS.items():
            if char in text:
                result['symbols_found'].append({
                    'symbol': char,
                    'type': arrow_type
                })
                
                if 'bidirectional' in arrow_type:
                    result['is_bidirectional'] = True
                    result['arrow_type'] = 'bidirectional'
                elif arrow_type in ['forward', 'forward_bold']:
                    if result['arrow_type'] == 'none':
                        result['arrow_type'] = 'forward'
        
        if result['symbols_found']:
            result['confidence'] = 0.95
        
        return result
    
    def detect_arrows_in_image(self, image: Image.Image) -> SymbolDetection:
        """Detect arrows in image using template matching."""
        image_array = np.array(image.convert('L'))
        
        arrow_positions = []
        arrow_type = 'none'
        max_confidence = 0.0
        
        for name, template in self.arrow_templates.items():
            # Resize template to match image scale
            if image_array.shape[0] > 50:
                template_resized = cv2.resize(template, (50, 50))
            else:
                template_resized = template
            
            # Template matching
            try:
                result = cv2.matchTemplate(image_array, template_resized, cv2.TM_CCOEFF)
                loc = np.where(result >= result.max() * 0.8)  # 80% confidence threshold
                
                for pt in zip(*loc[::-1]):
                    arrow_positions.append(pt)
                    max_confidence = max(max_confidence, 0.85)
                
                if loc[0].size > 0:  # Found matches
                    if 'bidirectional' in name:
                        arrow_type = 'bidirectional'
                    elif 'left' in name:
                        arrow_type = 'backward'
                    elif 'right' in name:
                        arrow_type = 'forward'
            
            except cv2.error:
                continue
        
        return SymbolDetection(
            has_arrow=len(arrow_positions) > 0,
            arrow_type=arrow_type,
            arrow_positions=arrow_positions,
            route_symbols=[],
            confidence=max_confidence
        )
    
    def detect_symbols(self, image: Image.Image, text: str = '') -> SymbolDetection:
        """Comprehensive symbol detection combining multiple methods."""
        # Check for Unicode symbols in text
        unicode_result = self.detect_unicode_symbols(text)
        
        # Check for arrows in image
        image_result = self.detect_arrows_in_image(image)
        
        # Combine results
        is_bidirectional = unicode_result['is_bidirectional'] or image_result.arrow_type == 'bidirectional'
        
        arrow_type = unicode_result['arrow_type']
        if arrow_type == 'none':
            arrow_type = image_result.arrow_type
        
        confidence = max(unicode_result['confidence'], image_result.confidence)
        
        return SymbolDetection(
            has_arrow=unicode_result['symbols_found'] or image_result.has_arrow,
            arrow_type=arrow_type,
            arrow_positions=image_result.arrow_positions,
            route_symbols=unicode_result['symbols_found'],
            confidence=confidence
        )


class MultiPageImageHandler:
    """Handles detection and processing of multi-page images."""
    
    @staticmethod
    def detect_page_boundaries(image: Image.Image) -> List[Tuple[int, int, int, int]]:
        """
        Detect multiple pages/sections in a single image.
        Returns list of bounding boxes (x1, y1, x2, y2) for each page.
        """
        image_array = np.array(image.convert('L'))
        
        # Apply edge detection
        edges = cv2.Canny(image_array, 100, 200)
        
        # Find contours
        contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        # Find bounding rectangles
        pages = []
        min_area = 10000  # Minimum area to consider as a page
        
        for contour in contours:
            x, y, w, h = cv2.boundingRect(contour)
            if w * h > min_area:
                pages.append((x, y, x + w, y + h))
        
        # Sort by position (top to bottom, left to right)
        pages.sort(key=lambda p: (p[1], p[0]))
        
        return pages
    
    @staticmethod
    def split_image_by_pages(image: Image.Image) -> List[Image.Image]:
        """Split multi-page image into individual pages."""
        pages_bbox = MultiPageImageHandler.detect_page_boundaries(image)
        
        if not pages_bbox:
            logger.warning("No pages detected, returning original image")
            return [image]
        
        page_images = []
        for x1, y1, x2, y2 in pages_bbox:
            page = image.crop((x1, y1, x2, y2))
            page_images.append(page)
        
        logger.info(f"Split image into {len(page_images)} pages")
        return page_images
    
    @staticmethod
    def detect_table_structure(image: Image.Image) -> List[List[Tuple[int, int, int, int]]]:
        """
        Detect table structure (rows and columns) in image.
        Returns list of rows, each containing list of cell bounding boxes.
        """
        image_array = np.array(image.convert('L'))
        
        # Apply morphological operations to detect lines
        kernel_h = cv2.getStructuringElement(cv2.MORPH_RECT, (15, 1))
        kernel_v = cv2.getStructuringElement(cv2.MORPH_RECT, (1, 15))
        
        h_lines = cv2.morphologyEx(image_array, cv2.MORPH_OPEN, kernel_h)
        v_lines = cv2.morphologyEx(image_array, cv2.MORPH_OPEN, kernel_v)
        
        # Find intersections (corners of table cells)
        combined = cv2.bitwise_or(h_lines, v_lines)
        
        # Find contours
        contours, _ = cv2.findContours(combined, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)
        
        # Group cells into rows and columns
        cells = []
        for contour in contours:
            x, y, w, h = cv2.boundingRect(contour)
            if w > 20 and h > 20:  # Filter small noise
                cells.append((x, y, x + w, y + h))
        
        # Sort by row (y-coordinate) then column (x-coordinate)
        cells.sort(key=lambda c: (c[1], c[0]))
        
        # Group into rows (cells with similar y-coordinate)
        rows = []
        current_row = []
        current_y = None
        
        for cell in cells:
            x1, y1, x2, y2 = cell
            
            if current_y is None:
                current_y = y1
            
            # If y-coordinate differs significantly, start new row
            if abs(y1 - current_y) > 20:
                if current_row:
                    rows.append(current_row)
                current_row = [cell]
                current_y = y1
            else:
                current_row.append(cell)
        
        if current_row:
            rows.append(current_row)
        
        logger.info(f"Detected {len(rows)} rows and {len(cells)} cells in table")
        return rows


class DataValidator:
    """Validates and cleans extracted bus data."""
    
    @staticmethod
    def validate_time_format(time_str: str) -> bool:
        """Validate if time is in HH:MM format with valid ranges."""
        match = re.match(r'^(\d{2}):(\d{2})$', time_str)
        if not match:
            return False
        
        hour = int(match.group(1))
        minute = int(match.group(2))
        
        # Validate hour and minute ranges
        return 0 <= hour <= 23 and 0 <= minute <= 59

    
    @staticmethod
    def validate_city_name(city: str) -> bool:
        """Validate if city name looks reasonable."""
        # City should be at least 3 characters, only letters and spaces
        return len(city) >= 3 and re.match(r'^[A-Z][A-Z\s\-]*$', city.strip(), re.IGNORECASE)
    
    @staticmethod
    def validate_bus_route(route: Dict[str, Any]) -> Tuple[bool, List[str]]:
        """Validate extracted bus route data."""
        errors = []
        
        # Check required fields
        if not route.get('origin') or not DataValidator.validate_city_name(route['origin']):
            errors.append(f"Invalid origin: {route.get('origin')}")
        
        if not route.get('destination') or not DataValidator.validate_city_name(route['destination']):
            errors.append(f"Invalid destination: {route.get('destination')}")
        
        if not route.get('departure_time') or not DataValidator.validate_time_format(route['departure_time']):
            errors.append(f"Invalid departure time: {route.get('departure_time')}")
        
        if not route.get('arrival_time') or not DataValidator.validate_time_format(route['arrival_time']):
            errors.append(f"Invalid arrival time: {route.get('arrival_time')}")
        
        # Origin and destination should be different
        if route.get('origin') == route.get('destination'):
            errors.append("Origin and destination cannot be the same")
        
        # Arrival time should be after departure time (or next day)
        if route.get('departure_time') and route.get('arrival_time'):
            dept_hour = int(route['departure_time'].split(':')[0])
            arr_hour = int(route['arrival_time'].split(':')[0])
            
            # Allow for overnight journey
            if arr_hour < dept_hour and arr_hour > 6:  # Not an overnight journey pattern
                errors.append(f"Arrival time before departure time: {route['departure_time']} -> {route['arrival_time']}")
        
        return len(errors) == 0, errors
    
    @staticmethod
    def clean_stop_data(stops: List[Dict[str, str]]) -> List[Dict[str, str]]:
        """Clean and validate stop data."""
        cleaned = []
        
        for stop in stops:
            if not stop.get('city') or not stop.get('time'):
                continue
            
            city = stop['city'].strip().upper()
            time = stop['time'].strip()
            landmark = stop.get('landmark', city).strip().upper()
            
            # Validate
            if DataValidator.validate_city_name(city) and DataValidator.validate_time_format(time):
                cleaned.append({
                    'city': city,
                    'landmark': landmark,
                    'time': time
                })
        
        return cleaned


class DataDeduplicator:
    """Detects and handles duplicate or similar bus route entries."""
    
    @staticmethod
    def generate_route_hash(route: Dict[str, Any]) -> str:
        """Generate a hash for route deduplication."""
        key_fields = f"{route.get('origin')}|{route.get('destination')}|{route.get('departure_time')}"
        return hashlib.md5(key_fields.encode()).hexdigest()
    
    @staticmethod
    def similarity_score(route1: Dict[str, Any], route2: Dict[str, Any]) -> float:
        """Calculate similarity score between two routes (0-1)."""
        score = 0.0
        matches = 0
        
        # Check origin
        if route1.get('origin') == route2.get('origin'):
            score += 0.25
            matches += 1
        
        # Check destination
        if route1.get('destination') == route2.get('destination'):
            score += 0.25
            matches += 1
        
        # Check departure time (within 30 minutes)
        if route1.get('departure_time') and route2.get('departure_time'):
            t1 = int(route1['departure_time'].split(':')[0]) * 60 + int(route1['departure_time'].split(':')[1])
            t2 = int(route2['departure_time'].split(':')[0]) * 60 + int(route2['departure_time'].split(':')[1])
            
            if abs(t1 - t2) <= 30:
                score += 0.25
                matches += 1
        
        # Check number of stops
        stops1 = len(route1.get('stops', []))
        stops2 = len(route2.get('stops', []))
        
        if abs(stops1 - stops2) <= 2:
            score += 0.25
            matches += 1
        
        return score / 4.0  # Normalize to 0-1
    
    @staticmethod
    def deduplicate_routes(routes: List[Dict[str, Any]], similarity_threshold: float = 0.85) -> List[Dict[str, Any]]:
        """Remove or merge duplicate routes."""
        if not routes:
            return []
        
        unique_routes = []
        route_hashes = defaultdict(list)
        
        # Group by hash
        for route in routes:
            hash_val = DataDeduplicator.generate_route_hash(route)
            route_hashes[hash_val].append(route)
        
        # Process each hash group
        for hash_val, group in route_hashes.items():
            if len(group) == 1:
                unique_routes.append(group[0])
            else:
                # Multiple routes with same hash - find best one (highest confidence)
                best = max(group, key=lambda r: r.get('confidence_score', 0.0))
                unique_routes.append(best)
                
                logger.info(f"Deduplicated {len(group)} similar routes to 1 (hash: {hash_val[:8]})")
        
        return unique_routes
    
    @staticmethod
    def merge_similar_routes(routes: List[Dict[str, Any]], threshold: float = 0.85) -> List[Dict[str, Any]]:
        """Merge routes that are very similar."""
        if not routes:
            return []
        
        merged = []
        processed = set()
        
        for i, route1 in enumerate(routes):
            if i in processed:
                continue
            
            merged_route = dict(route1)
            
            # Look for similar routes
            for j, route2 in enumerate(routes[i+1:], start=i+1):
                if j in processed:
                    continue
                
                similarity = DataDeduplicator.similarity_score(route1, route2)
                
                if similarity >= threshold:
                    # Merge stops
                    stops1 = set(f"{s['city']}|{s['time']}" for s in route1.get('stops', []))
                    stops2 = set(f"{s['city']}|{s['time']}" for s in route2.get('stops', []))
                    
                    all_stops = stops1 | stops2
                    merged_route['stops'] = [
                        {'city': s.split('|')[0], 'landmark': s.split('|')[0], 'time': s.split('|')[1]}
                        for s in all_stops
                    ]
                    
                    # Update confidence
                    merged_route['confidence_score'] = max(
                        route1.get('confidence_score', 0.0),
                        route2.get('confidence_score', 0.0)
                    )
                    
                    processed.add(j)
                    logger.info(f"Merged routes with {similarity:.2%} similarity")
            
            merged.append(merged_route)
            processed.add(i)
        
        return merged


class AdvancedImageProcessor:
    """Combines all advanced processing capabilities."""
    
    def __init__(self):
        self.symbol_detector = SymbolDetector()
        self.page_handler = MultiPageImageHandler()
        self.validator = DataValidator()
        self.deduplicator = DataDeduplicator()
    
    def process_complex_image(self, image: Image.Image) -> Dict[str, Any]:
        """
        Process a complex image with multiple pages or advanced elements.
        
        Returns:
            Dictionary with processed data and metadata
        """
        result = {
            'pages': [],
            'total_pages': 0,
            'symbols_detected': None,
            'tables_found': 0,
            'error': None
        }
        
        try:
            # Split into pages if necessary
            pages = self.page_handler.split_image_by_pages(image)
            result['total_pages'] = len(pages)
            
            # Detect symbols in original image
            text = pytesseract.image_to_string(image)
            symbols = self.symbol_detector.detect_symbols(image, text)
            result['symbols_detected'] = {
                'has_arrow': symbols.has_arrow,
                'arrow_type': symbols.arrow_type,
                'confidence': symbols.confidence
            }
            
            # Detect tables in each page
            for page in pages:
                page_data = {
                    'tables': self.page_handler.detect_table_structure(page),
                    'text': pytesseract.image_to_string(page),
                    'size': page.size
                }
                result['pages'].append(page_data)
                result['tables_found'] += len(page_data['tables'])
            
        except Exception as e:
            result['error'] = str(e)
            logger.error(f"Error processing complex image: {e}")
        
        return result
