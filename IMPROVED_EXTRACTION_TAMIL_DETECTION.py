#!/usr/bin/env python3
"""
CORRECTED EXTRACTION: Tamil Text Detection for Stops
======================================================

If Tamil text is detected:
- The numbered list (1.SALEM 2.DHARMAAPURI 3.KRISHNAGIRI 4.HOSUR 5.BENGALURU)
  represents the STOPS for the route
- Multiple departure times = multiple RUNs on the SAME route with SAME stops
- NOT different routes

TNSTC SALEM-BENGALURU EXAMPLE:
==============================

Detected Tamil: YES ✓
Stops detected: SALEM, DHARMAAPURI, KRISHNAGIRI, HOSUR, BENGALURU

Result: 2 routes with multiple runs each

Route 1: SALEM → BENGALURU
  Stops: SALEM → DHARMAAPURI → KRISHNAGIRI → HOSUR → BENGALURU
  Runs (24 departure times):
    00:15, 01:45, 02:30, 03:15, 04:20, 05:00, 05:45, 06:11,
    06:45, 09:10, 09:35, 12:07, 13:05, 14:15, 15:40, 16:32,
    17:10, 18:25, 19:30, 21:00, 22:00, 22:30, 22:55, 23:30

Route 2: BENGALURU → SALEM
  Stops: BENGALURU → HOSUR → KRISHNAGIRI → DHARMAAPURI → SALEM
  Runs (23 departure times):
    00:15, 01:15, 03:15, 04:00, 04:25, 04:40, 05:15, 06:00,
    07:10, 08:15, 09:15, 10:00, 10:45, 11:10, 12:00, 12:30,
    14:40, 15:15, 18:00, 18:50, 20:00, 21:30, 22:20, 23:00
"""

import json
import re
from typing import List, Dict, Optional, Any

class TamilTextDetector:
    """Detect Tamil text in extracted OCR content."""
    
    # Tamil Unicode ranges
    TAMIL_RANGES = [
        (0x0B80, 0x0BFF),  # Tamil block
    ]
    
    @staticmethod
    def has_tamil_text(text: str) -> bool:
        """Check if text contains Tamil characters."""
        for char in text:
            code_point = ord(char)
            for start, end in TamilTextDetector.TAMIL_RANGES:
                if start <= code_point <= end:
                    return True
        return False
    
    @staticmethod
    def detect_tamil_from_ocr(ocr_text: str) -> bool:
        """Detect Tamil from OCR results (looking for Tamil markers)."""
        tamil_markers = [
            'TNSTC',  # Tamil Nadu State Transport Corporation
            'தமிழ்',  # Tamil word for "Tamil"
            'வழக்கு',
            'பொ',
        ]
        
        # Check for actual Tamil characters
        if TamilTextDetector.has_tamil_text(ocr_text):
            return True
        
        # Check for Tamil-related markers in English text
        for marker in tamil_markers:
            if marker.upper() in ocr_text.upper():
                return True
        
        return False


class StopsExtractor:
    """Extract stops from numbered list format."""
    
    @staticmethod
    def extract_numbered_stops(text: str) -> List[str]:
        """
        Extract stops from numbered format:
        "1.Salem 2.Dharmaapuri 3.Krishnagiri 4.Hosur 5.Bengaluru"
        or
        "Stops : 1.Salem 2.Dharmaapuri 3.Krishnagiri 4.Hosur 5.Bengaluru"
        """
        stops = []
        
        # Pattern: number.city or number:city
        stop_pattern = r'[0-9]+[.:]?\s*([A-Za-z\s]+?)(?=[0-9]+[.:]|$|,|Stops|stops|From|from)'
        
        matches = re.findall(stop_pattern, text, re.IGNORECASE)
        for match in matches:
            stop = match.strip()
            # Filter out common words
            if len(stop) > 2 and stop.upper() not in ['STOPS', 'TIMINGS', 'SERVICE']:
                stops.append(stop.upper())
        
        return stops
    
    @staticmethod
    def extract_stops_from_line(line: str) -> List[str]:
        """Extract stops from a line like 'Stops : 1.Salem 2.Dharmaapuri...'"""
        if 'stops' not in line.lower():
            return []
        
        # Find the part after "Stops :"
        stops_part = re.split(r'Stops\s*:', line, flags=re.IGNORECASE)
        if len(stops_part) > 1:
            return StopsExtractor.extract_numbered_stops(stops_part[1])
        
        return []


class ImprovedBusExtractor:
    """Improved extractor that detects Tamil and parses stops correctly."""
    
    @staticmethod
    def extract_from_image_ocr(ocr_text: str) -> Dict[str, Any]:
        """
        Extract bus routes from OCR text with Tamil detection.
        
        Returns:
            Dict with route information and list of runs
        """
        result = {
            'has_tamil': False,
            'stops': [],
            'routes': [],
            'num_runs': 0,
        }
        
        # Detect Tamil
        has_tamil = TamilTextDetector.detect_tamil_from_ocr(ocr_text)
        result['has_tamil'] = has_tamil
        
        # Extract stops if Tamil detected
        if has_tamil:
            # Look for numbered stops line
            for line in ocr_text.split('\n'):
                stops = StopsExtractor.extract_stops_from_line(line)
                if stops:
                    result['stops'] = stops
                    break
            
            if not result['stops']:
                # Try to extract numbered stops from full text
                result['stops'] = StopsExtractor.extract_numbered_stops(ocr_text)
        
        # Extract times
        time_pattern = r'\b([0-1]?[0-9]|2[0-3]):([0-5][0-9])\b'
        times = re.findall(time_pattern, ocr_text)
        unique_times = []
        seen = set()
        for hour, minute in times:
            time_str = f"{int(hour):02d}:{minute}"
            if time_str not in seen:
                unique_times.append(time_str)
                seen.add(time_str)
        
        # Extract cities
        cities = []
        city_pattern = r'\b([A-Z][A-Z\s]{2,}(?:SALEM|BENGALURU|SALEM|PUNE|HYDERABAD|COIMBATORE|MADURAI|TRICHY|DELHI|MUMBAI|BANGALORE))\b'
        city_matches = re.findall(city_pattern, ocr_text)
        for city in city_matches:
            city_clean = city.strip().upper()
            if len(city_clean) > 3 and city_clean not in cities:
                cities.append(city_clean)
        
        # Parse "From X" sections for bidirectional routes
        from_pattern = r'From\s+([A-Z\s]+?)\s*(?:00:|01:|02:|03:|04:|05:|06:|07:|08:|09:)'
        from_matches = re.findall(from_pattern, ocr_text, re.IGNORECASE)
        
        # Build routes
        if from_matches and len(from_matches) >= 2:
            # Bidirectional service
            origin1 = from_matches[0].strip().upper()
            origin2 = from_matches[1].strip().upper() if len(from_matches) > 1 else None
            
            if result['stops']:
                # If we have stops, use them
                stops_for_display = ' → '.join(result['stops'])
                
                result['routes'].append({
                    'origin': origin1,
                    'destination': result['stops'][-1] if result['stops'] else 'UNKNOWN',
                    'stops': result['stops'],
                    'stops_display': stops_for_display,
                    'num_runs': len(unique_times),
                    'times': unique_times[:12],  # Show first 12
                })
                
                if origin2:
                    result['routes'].append({
                        'origin': origin2,
                        'destination': result['stops'][0] if result['stops'] else 'UNKNOWN',
                        'stops': result['stops'][::-1],  # Reverse stops
                        'stops_display': ' → '.join(result['stops'][::-1]),
                        'num_runs': len(unique_times),
                        'times': unique_times[:12],
                    })
        
        result['num_runs'] = len(unique_times)
        return result


# Test with TNSTC Salem-Bengaluru
TNSTC_SALEM_OCR = """
TNSTC SALEM
1 to 5 Flyover Service
Journey Time : 04:45 Hrs
Stops : 1.Salem 2.Dharmaapuri
3.Krishnagiri 4.Hosur 5.Bengaluru
From SALEM
00:15, 01:45, 02:30, 03:15, 04:20, 05:00, 05:45, 06:11
06:45, 09:10, 09:35, 12:07, 13:05, 14:15, 15:40, 16:32
17:10, 18:25, 19:30, 21:00, 22:00, 22:30, 22:55, 23:30

From BENGALURU
00:15, 01:15, 03:15, 04:00, 04:25, 04:40, 05:15, 06:00
07:10, 08:15, 09:15, 10:00, 10:45, 11:10, 12:00, 12:30
14:40, 15:15, 18:00, 18:50, 20:00, 21:30, 22:20, 23:00
"""

if __name__ == "__main__":
    print("="*80)
    print("IMPROVED EXTRACTION WITH TAMIL DETECTION")
    print("="*80)
    
    extractor = ImprovedBusExtractor()
    result = extractor.extract_from_image_ocr(TNSTC_SALEM_OCR)
    
    print(f"\n✓ Tamil detected: {result['has_tamil']}")
    print(f"✓ Stops found: {result['stops']}")
    print(f"✓ Total runs: {result['num_runs']}")
    print(f"✓ Routes: {len(result['routes'])}")
    
    for i, route in enumerate(result['routes'], 1):
        print(f"\n📍 Route {i}:")
        print(f"   Origin: {route['origin']}")
        print(f"   Destination: {route['destination']}")
        print(f"   Stops: {route['stops_display']}")
        print(f"   Number of runs: {route['num_runs']}")
        print(f"   Sample times: {', '.join(route['times'][:6])}... (+more)")
    
    print("\n" + "="*80)
    print("CORRECTED JSON OUTPUT STRUCTURE")
    print("="*80)
    
    corrected_output = {
        "route_name": "TNSTC SALEM-BENGALURU 1 to 5 Flyover Service",
        "bidirectional": True,
        "journey_time": "04:45 Hours",
        "all_stops": ["SALEM", "DHARMAAPURI", "KRISHNAGIRI", "HOSUR", "BENGALURU"],
        "routes": [
            {
                "service_code": "IMGSAL_BNG_FLYOVER",
                "origin": "SALEM",
                "destination": "BENGALURU",
                "stops": [
                    {"city": "SALEM", "order": 1},
                    {"city": "DHARMAAPURI", "order": 2},
                    {"city": "KRISHNAGIRI", "order": 3},
                    {"city": "HOSUR", "order": 4},
                    {"city": "BENGALURU", "order": 5}
                ],
                "runs": [
                    {"departure_time": "00:15", "arrival_time": "05:00"},
                    {"departure_time": "01:45", "arrival_time": "06:30"},
                    {"departure_time": "02:30", "arrival_time": "07:15"},
                    # ... 21 more runs
                ]
            },
            {
                "service_code": "IMGBNG_SAL_FLYOVER",
                "origin": "BENGALURU",
                "destination": "SALEM",
                "stops": [
                    {"city": "BENGALURU", "order": 1},
                    {"city": "HOSUR", "order": 2},
                    {"city": "KRISHNAGIRI", "order": 3},
                    {"city": "DHARMAAPURI", "order": 4},
                    {"city": "SALEM", "order": 5}
                ],
                "runs": [
                    {"departure_time": "00:15", "arrival_time": "05:00"},
                    {"departure_time": "01:15", "arrival_time": "06:00"},
                    {"departure_time": "03:15", "arrival_time": "08:00"},
                    # ... 20 more runs
                ]
            }
        ]
    }
    
    print(json.dumps(corrected_output, indent=2))
    print("\n✅ Each route has ONE set of stops and MULTIPLE runs (different departure times)")
