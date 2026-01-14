#!/usr/bin/env python3
"""
Enhanced Multi-Row Bus Schedule Extractor
==========================================
Extracts multiple routes from bus schedule images without requiring table grid detection.
Works with various layouts: tabular, list-based, or mixed formats.
"""

import re
import logging
from typing import List, Dict, Tuple, Optional, Any
import pytesseract
import numpy as np
from PIL import Image
from dataclasses import dataclass

logging.basicConfig(level=logging.INFO, format='%(message)s')
logger = logging.getLogger(__name__)


@dataclass
class ExtractedRoute:
    """Represents an extracted bus route."""
    departure_time: str
    arrival_time: str
    origin: str
    destination: str
    via_stops: List[str]
    raw_text: str
    confidence: float
    route_number: Optional[str] = None


class MultiRowBusExtractor:
    """Extract multiple routes from bus schedule images without grid detection."""
    
    # Common city names in Tamil Nadu
    TAMIL_NADU_CITIES = {
        'CHENNAI': ['MADRAS', 'CHE'],
        'MADURAI': ['MDU', 'MAD'],
        'TRICHY': ['TRICHINOPOLY', 'TRY', 'TRICHY'],
        'COIMBATORE': ['CBE', 'COIM'],
        'SALEM': ['SLM'],
        'TIRUPPUR': ['TPP', 'TIRUPUR'],
        'ERODE': ['ERD'],
        'KANCHIPURAM': ['KANCHI', 'KNC'],
        'VILLUPURAM': ['VILLUP'],
        'VELLORE': ['VEL'],
        'DINDIGUL': ['DDL', 'DGL'],
        'THENI': ['THN'],
        'TENKASI': ['TEN'],
        'NAGERCOIL': ['NAGI', 'NGC'],
        'TIRUNELVELI': ['TN'],
    }
    
    def __init__(self):
        self.time_pattern = re.compile(r'\b([0-1]?[0-9]|2[0-3]):([0-5][0-9])\b')
    
    def get_detailed_ocr_lines(self, image: Image.Image) -> List[Dict[str, Any]]:
        """
        Get OCR output grouped by lines with positional data.
        
        Returns:
            List of line dictionaries with text and position info
        """
        try:
            data = pytesseract.image_to_data(image, output_type=pytesseract.Output.DICT)
            
            lines = []
            current_line = {
                'text_parts': [],
                'y': None,
                'x_start': None,
                'confidences': [],
            }
            
            for i, text in enumerate(data['text']):
                if not text.strip():
                    continue
                
                y = data['top'][i]
                x = data['left'][i]
                conf = float(data['conf'][i]) / 100.0
                
                # Start new line if y-coordinate changes significantly
                if current_line['y'] is None or abs(y - current_line['y']) > 15:
                    if current_line['text_parts']:
                        lines.append({
                            'text': ' '.join(current_line['text_parts']),
                            'y': current_line['y'],
                            'x_start': current_line['x_start'],
                            'confidence': np.mean(current_line['confidences']) if current_line['confidences'] else 0.0
                        })
                    
                    current_line = {
                        'text_parts': [text],
                        'y': y,
                        'x_start': x,
                        'confidences': [conf],
                    }
                else:
                    current_line['text_parts'].append(text)
                    current_line['confidences'].append(conf)
            
            # Add last line
            if current_line['text_parts']:
                lines.append({
                    'text': ' '.join(current_line['text_parts']),
                    'y': current_line['y'],
                    'x_start': current_line['x_start'],
                    'confidence': np.mean(current_line['confidences']) if current_line['confidences'] else 0.0
                })
            
            return lines
        
        except Exception as e:
            logger.error(f"Error extracting lines: {e}")
            return []
    
    def extract_times(self, text: str) -> List[str]:
        """Extract all times from text in HH:MM format."""
        times = []
        for match in self.time_pattern.finditer(text):
            hour = int(match.group(1))
            minute = int(match.group(2))
            
            # Validate
            if hour <= 23 and minute <= 59:
                times.append(f"{hour:02d}:{minute:02d}")
        
        return times
    
    def extract_city_names(self, text: str) -> List[str]:
        """Extract city names from text."""
        cities = []
        text_upper = text.upper()
        
        for city, aliases in self.TAMIL_NADU_CITIES.items():
            # Check for exact city name
            if city in text_upper:
                if city not in cities:
                    cities.append(city)
            # Check for aliases
            for alias in aliases:
                if alias in text_upper:
                    if city not in cities:
                        cities.append(city)
                    break
        
        return cities
    
    def extract_routes_from_lines(self, lines: List[Dict[str, Any]]) -> List[ExtractedRoute]:
        """
        Extract routes from OCR lines.
        
        Strategy:
        1. Find lines with times (likely route lines)
        2. Extract times, cities, and connect them
        3. Group consecutive lines with related information
        """
        routes = []
        route_candidates = []
        
        # Filter lines that contain route information
        for i, line in enumerate(lines):
            times = self.extract_times(line['text'])
            cities = self.extract_city_names(line['text'])
            
            # A route line should have at least one time and one city
            if times or cities:
                route_candidates.append({
                    'line_idx': i,
                    'text': line['text'],
                    'y': line['y'],
                    'confidence': line['confidence'],
                    'times': times,
                    'cities': cities,
                })
        
        logger.info(f"Found {len(route_candidates)} potential route lines")
        
        # Group consecutive candidates into routes
        current_route = []
        for i, candidate in enumerate(route_candidates):
            current_route.append(candidate)
            
            # Check if this is likely the end of a route
            # (next line is far away or is last line)
            is_last = (i == len(route_candidates) - 1)
            is_separated = False
            
            if not is_last:
                next_y = route_candidates[i + 1]['y']
                curr_y = candidate['y']
                is_separated = (next_y - curr_y) > 30  # Large gap indicates new route
            
            if is_last or is_separated:
                # Parse accumulated route data
                route = self._parse_route_from_candidates(current_route)
                if route:
                    routes.append(route)
                
                current_route = []
        
        return routes
    
    def _parse_route_from_candidates(self, candidates: List[Dict[str, Any]]) -> Optional[ExtractedRoute]:
        """Parse a single route from candidate lines."""
        try:
            if not candidates:
                return None
            
            # Collect all times and cities from all lines
            all_times = []
            all_cities = []
            all_text = []
            confidence_sum = 0.0
            
            for cand in candidates:
                all_times.extend(cand['times'])
                all_cities.extend(cand['cities'])
                all_text.append(cand['text'])
                confidence_sum += cand['confidence']
            
            # Remove duplicates while preserving order
            seen_cities = set()
            unique_cities = []
            for city in all_cities:
                if city not in seen_cities:
                    unique_cities.append(city)
                    seen_cities.add(city)
            
            # Need at least times and origin/destination
            if not all_times or len(unique_cities) < 1:
                return None
            
            # Extract route information
            dept_time = all_times[0] if all_times else "00:00"
            arr_time = all_times[1] if len(all_times) > 1 else "00:00"
            origin = unique_cities[0] if unique_cities else "UNKNOWN"
            destination = unique_cities[1] if len(unique_cities) > 1 else unique_cities[0] if unique_cities else "UNKNOWN"
            via_stops = unique_cities[2:] if len(unique_cities) > 2 else []
            
            avg_confidence = confidence_sum / len(candidates) if candidates else 0.0
            raw_text = " | ".join(all_text)
            
            return ExtractedRoute(
                departure_time=dept_time,
                arrival_time=arr_time,
                origin=origin,
                destination=destination,
                via_stops=via_stops,
                raw_text=raw_text,
                confidence=avg_confidence,
            )
        
        except Exception as e:
            logger.error(f"Error parsing route: {e}")
            return None
    
    def extract_all_routes(self, image: Image.Image) -> List[ExtractedRoute]:
        """Complete pipeline to extract all routes from image."""
        try:
            logger.info("Starting multi-row extraction...")
            
            # Step 1: Get OCR lines
            lines = self.get_detailed_ocr_lines(image)
            logger.info(f"Extracted {len(lines)} OCR lines")
            
            if not lines:
                logger.warning("No OCR lines extracted")
                return []
            
            # Step 2: Extract routes
            routes = self.extract_routes_from_lines(lines)
            logger.info(f"Extracted {len(routes)} routes")
            
            return routes
        
        except Exception as e:
            logger.error(f"Error in extraction pipeline: {e}")
            return []


# Test on the Sivakasi image
if __name__ == "__main__":
    from io import BytesIO
    import requests
    
    # Download image
    url = 'https://c1.staticflickr.com/1/334/18871722824_061f8a85f9_b.jpg'
    logger.info(f"Downloading image from: {url}")
    response = requests.get(url)
    image = Image.open(BytesIO(response.content))
    
    # Extract
    extractor = MultiRowBusExtractor()
    routes = extractor.extract_all_routes(image)
    
    # Print results
    print("\n" + "="*70)
    print("MULTI-ROW BUS SCHEDULE EXTRACTION RESULTS")
    print("="*70)
    print(f"Total routes extracted: {len(routes)}\n")
    
    for i, route in enumerate(routes, 1):
        print(f"Route {i}:")
        print(f"  Departure: {route.departure_time}")
        print(f"  Arrival: {route.arrival_time}")
        print(f"  Origin → Destination: {route.origin} → {route.destination}")
        if route.via_stops:
            print(f"  Via: {', '.join(route.via_stops)}")
        print(f"  Confidence: {route.confidence:.2%}")
        print(f"  Raw: {route.raw_text[:80]}...\n")
    
    print("="*70)
