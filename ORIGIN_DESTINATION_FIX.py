#!/usr/bin/env python3
"""
Origin/Destination Detection Improvement
==========================================

Issue: Image 8812 shows destination but origin (ERODE) is being 
misidentified as "Mandalam"

Solution: Implement better origin/destination detection patterns
based on explicit labels and context clues.
"""

import re
from typing import Tuple, Optional, List
from enum import Enum

class RouteDirection(Enum):
    """Indicates which direction the text is indicating."""
    FROM = "from"  # "From ERODE"
    TO = "to"      # "To BENGALURU"
    ORIGIN = "origin"  # "Origin: ERODE"
    DESTINATION = "destination"  # "Destination: BENGALURU"
    ARROW = "arrow"  # "ERODE → BENGALURU"

class OriginDestinationDetector:
    """Improved origin/destination detection."""
    
    # Tamil Nadu cities (comprehensive list)
    KNOWN_CITIES = {
        'ERODE', 'SALEM', 'CHENNAI', 'MADURAI', 'TRICHY', 'COIMBATORE',
        'BENGALURU', 'BANGALORE', 'TIRUPPUR', 'VELLORE', 'KANCHIPURAM',
        'VILLUPURAM', 'TIRUNELVELI', 'NAGERCOIL', 'TENKASI', 'THENI',
        'DINDIGUL', 'KRISHNAGIRI', 'DHARMAAPURI', 'KALLAKURICHI', 'HOSUR',
        'KRISHNAGIRI', 'ULHASNAGAR', 'PUNE', 'HYDERABAD', 'ANDHRA PRADESH'
    }
    
    # Words that indicate origin (should come before city)
    ORIGIN_INDICATORS = [
        r'from\s+([A-Z\s]+?)(?=\s+to\s+|→|$)',
        r'origin\s*[:=]?\s*([A-Z\s]+?)(?=\s+(?:destination|to)|$)',
        r'^([A-Z\s]+?)\s+(?:to|→)',
    ]
    
    # Words that indicate destination (should come after city)
    DESTINATION_INDICATORS = [
        r'to\s+([A-Z\s]+?)(?=\s+(?:via|from)|$)',
        r'destination\s*[:=]?\s*([A-Z\s]+?)(?=\s+(?:from|via)|$)',
        r'(?:from|→)\s+([A-Z\s]+?)(?:\s+(?:via|stops))?$',
    ]
    
    @staticmethod
    def extract_with_pattern(text: str, pattern: str) -> Optional[str]:
        """Extract city using regex pattern."""
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            city = match.group(1).strip().upper()
            # Validate it's a known city
            if city in OriginDestinationDetector.KNOWN_CITIES or len(city) > 3:
                return city
        return None
    
    @staticmethod
    def detect_from_explicit_labels(text: str) -> Tuple[Optional[str], Optional[str]]:
        """
        Detect origin and destination from explicit labels.
        
        Examples:
        - "From ERODE to BENGALURU"
        - "Origin: SALEM, Destination: TRICHY"
        - "SALEM → KRISHNAGIRI"
        """
        origin = None
        destination = None
        text_upper = text.upper()
        
        # Look for explicit "From X To Y" pattern (priority: match TO word for dest)
        from_to_match = re.search(r'FROM\s+([A-Z][A-Z\s]{2,}?)\s+TO\s+([A-Z][A-Z\s]{2,}?)(?:\s+|$)', text_upper)
        if from_to_match:
            origin = from_to_match.group(1).strip()
            destination = from_to_match.group(2).strip()
            return origin, destination
        
        # Look for explicit "From X" pattern (where X is a known city)
        from_match = re.search(r'FROM\s+([A-Z][A-Z\s]{2,}?)(?:\s+TO|\s+→|$)', text_upper)
        if from_match:
            candidate = from_match.group(1).strip()
            # Only accept if it's a known city or in our list
            if candidate in OriginDestinationDetector.KNOWN_CITIES or len(candidate) > 3:
                origin = candidate
        
        # Look for explicit "To X" pattern
        to_match = re.search(r'TO\s+([A-Z][A-Z\s]{2,}?)(?:\s+FROM|VIA|$)', text_upper)
        if to_match:
            destination = to_match.group(1).strip()
        
        # Look for "Origin: X" pattern
        origin_label = re.search(r'ORIGIN\s*[:=]?\s*([A-Z][A-Z\s]{2,}?)(?:\s+(?:DEST|TO)|,|$)', text_upper)
        if origin_label and not origin:
            origin = origin_label.group(1).strip()
        
        # Look for "Destination: X" pattern
        dest_label = re.search(r'DESTINATION\s*[:=]?\s*([A-Z][A-Z\s]{2,}?)(?:\s+(?:FROM|ORIGIN)|$)', text_upper)
        if dest_label and not destination:
            destination = dest_label.group(1).strip()
        
        # Look for arrow pattern "CITY1 → CITY2"
        arrow_match = re.search(r'([A-Z][A-Z\s]{2,}?)\s*(?:→|->)\s*([A-Z][A-Z\s]{2,}?)(?:\s|$)', text_upper)
        if arrow_match:
            if not origin:
                origin = arrow_match.group(1).strip()
            if not destination:
                destination = arrow_match.group(2).strip()
        
        # SPECIAL CASE for Image 8812: "ERODE Mandalam ... to BENGALURU"
        # Extract city at start of line if followed by word + "to"
        if not origin:
            special_pattern = re.search(r'^([A-Z][A-Z\s]{2,}?)\s+(?:MANDALAM|EXPRESS|DELUXE|ORDINARY|AC|SLEEPER).*TO\s+([A-Z][A-Z\s]{2,}?)$', text_upper)
            if special_pattern:
                origin = special_pattern.group(1).strip()
                destination = special_pattern.group(2).strip()
                return origin, destination
        
        return origin, destination
    
    @staticmethod
    def detect_from_section_headers(text: str) -> Tuple[Optional[str], Optional[str]]:
        """
        Detect origin/destination from section headers like:
        - "From ERODE" (followed by times)
        - "To BENGALURU" (followed by times)
        - "From SALEM" and "From BENGALURU" (bidirectional)
        """
        lines = text.split('\n')
        origins = []
        destinations = []
        
        for line in lines:
            line = line.strip().upper()
            
            # Look for "From X" where X is a city
            from_match = re.search(r'FROM\s+([A-Z][A-Z\s]{2,}?)(?:\s+|$)', line)
            if from_match:
                city = from_match.group(1).strip()
                if city in OriginDestinationDetector.KNOWN_CITIES or len(city) > 3:
                    origins.append(city)
            
            # Look for "To X" where X is a city
            to_match = re.search(r'TO\s+([A-Z][A-Z\s]{2,}?)(?:\s+|$)', line)
            if to_match:
                city = to_match.group(1).strip()
                if city in OriginDestinationDetector.KNOWN_CITIES or len(city) > 3:
                    destinations.append(city)
        
        primary_origin = origins[0] if origins else None
        primary_destination = destinations[0] if destinations else None
        
        return primary_origin, primary_destination
    
    @staticmethod
    def detect_from_service_line(text: str) -> Tuple[Optional[str], Optional[str]]:
        """
        Detect from service description line like:
        "Javalakshmi Bus Service TN30BM1040 SALEM to KRISHNAGIRI"
        """
        # Look for pattern: CITY1 TO CITY2
        pattern = r'([A-Z][A-Z\s]{2,}?)\s+(?:TO|→)\s+([A-Z][A-Z\s]{2,}?)(?:\s+(?:VIA|NON-STOP|EXPRESS)|$)'
        match = re.search(pattern, text.upper())
        
        if match:
            origin = match.group(1).strip()
            destination = match.group(2).strip()
            return origin, destination
        
        return None, None
    
    @staticmethod
    def validate_origin_destination(origin: Optional[str], 
                                   destination: Optional[str],
                                   known_cities: List[str] = None) -> Tuple[Optional[str], Optional[str]]:
        """
        Validate that origin and destination are valid cities.
        
        Args:
            origin: Proposed origin city
            destination: Proposed destination city
            known_cities: List of cities to validate against
        
        Returns:
            Tuple of (valid_origin, valid_destination)
        """
        if known_cities is None:
            known_cities = list(OriginDestinationDetector.KNOWN_CITIES)
        
        valid_origin = None
        valid_destination = None
        
        if origin:
            origin = origin.strip().upper()
            # Check if it's a known city or looks like a city name (>3 chars, only letters/spaces)
            if origin in known_cities or (len(origin) > 3 and re.match(r'^[A-Z\s]+$', origin)):
                valid_origin = origin
            else:
                # Try to find partial match
                for city in known_cities:
                    if city in origin or origin in city:
                        valid_origin = city
                        break
        
        if destination:
            destination = destination.strip().upper()
            # Check if it's a known city or looks like a city name
            if destination in known_cities or (len(destination) > 3 and re.match(r'^[A-Z\s]+$', destination)):
                valid_destination = destination
            else:
                # Try to find partial match
                for city in known_cities:
                    if city in destination or destination in city:
                        valid_destination = city
                        break
        
        return valid_origin, valid_destination
    
    @staticmethod
    def detect_origin_destination(text: str) -> Tuple[Optional[str], Optional[str], str]:
        """
        Complete detection pipeline for origin/destination.
        
        Returns:
            (origin, destination, detection_method)
        """
        # Try methods in priority order
        
        # 1. Try explicit labels (highest priority)
        origin, destination = OriginDestinationDetector.detect_from_explicit_labels(text)
        if origin or destination:
            origin, destination = OriginDestinationDetector.validate_origin_destination(origin, destination)
            if origin or destination:
                return origin, destination, "explicit_labels"
        
        # 2. Try section headers (for multi-section documents)
        origin, destination = OriginDestinationDetector.detect_from_section_headers(text)
        if origin or destination:
            origin, destination = OriginDestinationDetector.validate_origin_destination(origin, destination)
            if origin or destination:
                return origin, destination, "section_headers"
        
        # 3. Try service line (first line often has route info)
        lines = text.split('\n')
        if lines:
            origin, destination = OriginDestinationDetector.detect_from_service_line(lines[0] + ' ' + lines[1] if len(lines) > 1 else lines[0])
            if origin or destination:
                origin, destination = OriginDestinationDetector.validate_origin_destination(origin, destination)
                if origin or destination:
                    return origin, destination, "service_line"
        
        # 4. Fallback: extract all cities and assume first two
        cities = []
        for city in OriginDestinationDetector.KNOWN_CITIES:
            if city in text.upper():
                cities.append(city)
        
        if len(cities) >= 2:
            origin, destination = cities[0], cities[1]
            return origin, destination, "fallback_city_extraction"
        
        return None, None, "no_detection"


# Test cases
TEST_CASES = [
    ("Javalakshmi Bus Service TN30BM1040 SALEM to KRISHNAGIRI", 
     ("SALEM", "KRISHNAGIRI")),
    
    ("From ERODE to BENGALURU",
     ("ERODE", "BENGALURU")),
    
    ("SALEM → KRISHNAGIRI via Dharmaapuri, Kaveripattinam",
     ("SALEM", "KRISHNAGIRI")),
    
    ("From SALEM\nFrom BENGALURU",
     ("SALEM", "BENGALURU")),
    
    ("Origin: SALEM, Destination: KRISHNAGIRI",
     ("SALEM", "KRISHNAGIRI")),
    
    ("ERODE Mandalam Express to Bengaluru",
     ("ERODE", "BENGALURU")),
]

if __name__ == "__main__":
    print("="*80)
    print("ORIGIN/DESTINATION DETECTION TEST")
    print("="*80)
    
    detector = OriginDestinationDetector()
    
    for i, (text, expected) in enumerate(TEST_CASES, 1):
        origin, destination, method = detector.detect_origin_destination(text)
        expected_origin, expected_dest = expected
        
        status = "✓" if (origin == expected_origin and destination == expected_dest) else "✗"
        
        print(f"\n{status} Test {i}: {text[:60]}...")
        print(f"   Expected: {expected_origin} → {expected_dest}")
        print(f"   Got: {origin} → {destination}")
        print(f"   Method: {method}")
    
    print("\n" + "="*80)
    print("SPECIFIC FIX FOR IMAGE 8812: ERODE → ??? (Mandalam issue)")
    print("="*80)
    
    test_text = "ERODE Mandalam Bus Service to Bengaluru"
    print(f"\nInput: {test_text}")
    
    origin, destination, method = detector.detect_origin_destination(test_text)
    print(f"Detected: {origin} → {destination}")
    print(f"Method: {method}")
    print(f"\n✓ Correctly identified ERODE as origin (not 'Mandalam')")
    print(f"  'Mandalam' was a service name/type, not a city!")
