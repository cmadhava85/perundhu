#!/usr/bin/env python3
"""Test table extraction on Sivakasi bus image."""

from scripts.table_extraction_enhancer import TableExtractor
from PIL import Image
import requests
from io import BytesIO
import logging

logging.basicConfig(level=logging.INFO, format='%(message)s')

# Download the image
url = 'https://c1.staticflickr.com/1/334/18871722824_061f8a85f9_b.jpg'
response = requests.get(url)
image = Image.open(BytesIO(response.content))

print(f"Image size: {image.size}")

# Extract table
extractor = TableExtractor(debug=True)
rows = extractor.extract_table_from_image(image)

if rows:
    routes = extractor.parse_bus_routes_from_table(rows)
    print(f'\n✅ Extracted {len(routes)} routes from table\n')
    for i, route in enumerate(routes, 1):
        print(f'Route {i}:')
        print(f'  Dept: {route["departure_time"]} → Arr: {route["arrival_time"]}')
        print(f'  Cities: {route["cities"]}')
        print()
else:
    print('❌ Could not extract table structure')
