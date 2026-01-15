#!/usr/bin/env python3
"""
Bus Timetable Extraction Corrector
===================================
Analyzes and corrects incorrectly extracted bus route data.

The issue: Current extraction doesn't properly handle:
1. Origin stated at TOP of image (like "Perundhu Nilayam - Rameshwaram")
2. "Via" format for intermediate stops
3. Garbled OCR text with character substitutions (0/O, 1/l, etc)
"""

import sys
sys.path.insert(0, '/Users/mchand69/Documents/perundhu')

from scripts.google_image_bus_scraper import OCRExtractor, OriginDestinationDetector, DataExtractor, ExtractionValidator
from PIL import Image
import json

# Load the problematic image
image_path = "/tmp/bus_image_sample.jpg"
image = Image.open(image_path)

# Extract text using OCR
print("=" * 80)
print("ANALYZING IMAGE")
print("=" * 80)
print(f"Image: {image_path}")
print(f"Size: {image.size}")

# Create OCR extractor
ocr = OCRExtractor(enable_smart_fallback=True)

# Extract with detailed strategy info
extracted_result = ocr.extract_with_smart_fallback(image)
raw_text = extracted_result['text']
strategy = extracted_result.get('strategy', 'unknown')
confidence = extracted_result.get('confidence', 0)

print(f"\nExtraction Strategy: {strategy}")
print(f"Confidence: {confidence * 100:.1f}%")

print("\n" + "=" * 80)
print("RAW EXTRACTED TEXT")
print("=" * 80)
print(raw_text[:1000])  # First 1000 chars

print("\n" + "=" * 80)
print("CURRENT PARSING")
print("=" * 80)

# Try current detection
origin, destination = OriginDestinationDetector.detect(raw_text)
print(f"Origin: {origin}")
print(f"Destination: {destination}")

# Try to extract stops
times = DataExtractor.extract_times(raw_text)
print(f"Extracted Times: {times}")

stops = DataExtractor.extract_stops(raw_text)
print(f"Extracted Stops: {len(stops)} stops")
for i, stop in enumerate(stops[:3], 1):
    print(f"  {i}. {stop.city} @ {stop.time}")

print("\n" + "=" * 80)
print("CORRECTION TEMPLATE")
print("=" * 80)
print("""
Based on the image showing "Perundhu Nilayam - Rameshwaram" at the top:

CORRECTED DATA STRUCTURE:
{
  "origin": "RAMESHWARAM",
  "origin_name": "Perundhu Nilayam",
  "destination": "[DESTINATION_CITY]",
  "departure_time": "[TIME]",
  "stops": [
    {"city": "[VIA_CITY_1]", "landmark": "[STOP_NAME]", "time": "[TIME]"},
    {"city": "[VIA_CITY_2]", "landmark": "[STOP_NAME]", "time": "[TIME]"},
    ...
  ],
  "route_type": "via",
  "notes": "Has intermediate stops marked as 'Via'"
}

INSTRUCTIONS FOR USER:
1. What is the destination city visible on the image?
2. What is the departure time from Rameshwaram?
3. What are the intermediate "Via" stops listed?
4. What times are shown for each stop?

Please provide these details so we can correct the extraction logic.
""")

print("\n" + "=" * 80)
print("ISSUES FOUND")
print("=" * 80)
print("""
1. ❌ Origin incorrectly parsed as "TIRUPPUR" instead of "RAMESHWARAM"
   - Root cause: OCR text may have "Perundhu Nilayam" at top, but parser doesn't prioritize it
   - Fix: Improve OriginDestinationDetector to check first line for origin
   
2. ❌ Stops not properly separated by "Via"
   - Root cause: Current stop extraction joins all text together
   - Fix: Parse "Via" keyword and split stops accordingly
   
3. ❌ OCR character errors (0→O, 1→l, etc) not fully corrected
   - Root cause: ExtractionValidator only partially corrects
   - Fix: Need broader character correction dictionary
   
4. ❌ Destination not clearly identified
   - Root cause: Multiple cities in text, parser can't determine which is final destination
   - Fix: Look for pattern "From X Via Y Via Z To DESTINATION"
""")

print("\n" + "=" * 80)
print("RECOMMENDED IMPROVEMENTS")
print("=" * 80)
improvements = """
1. IMPROVE OriginDestinationDetector.detect():
   - Check first 2 lines for explicit "From X" or location name
   - Look for "To" keyword to find destination (priority over "Via")
   - Parse "Via X Via Y Via Z" format to extract intermediate stops
   
2. IMPROVE DataExtractor.extract_stops():
   - Split by "Via" keyword when present
   - Extract city + time pairs properly
   - Distinguish between origin, intermediate stops, and destination
   
3. ADD Via-format parser:
   - Pattern: "Origin Via Stop1 Via Stop2 To Destination"
   - Extract all cities and associate with times shown
   - Mark stops as intermediate, not as separate "city" data
   
4. ENHANCE ExtractionValidator:
   - Add "Perundhu Nilayam" → "RAMESHWARAM" mapping
   - Expand city corrections dictionary
   - Handle multi-word city names properly
"""
print(improvements)
