#!/usr/bin/env python3
"""
Extract bus timetable data from images using Tesseract OCR.
This script processes all images in a folder and extracts:
- Origin
- Destination
- Departure time
- Arrival time
- Stops (Via) with time (if available)

Uses the existing Tesseract OCR setup (no API keys needed).
"""

import os
import sys
import json
from pathlib import Path
from datetime import datetime
import re
from typing import List, Dict, Any, Optional

# Add scripts directory to path
sys.path.insert(0, str(Path(__file__).parent / 'scripts'))

try:
    from PIL import Image, ImageEnhance, ImageFilter
    import pytesseract
    PYTESSERACT_AVAILABLE = True
except ImportError:
    PYTESSERACT_AVAILABLE = False
    print("Error: pytesseract or PIL not installed")
    print("Install using: pip install pytesseract pillow")
    print("Also install Tesseract OCR: brew install tesseract (on macOS)")
    exit(1)



def preprocess_image(image: Image.Image) -> Image.Image:
    """Enhance image for better OCR results."""
    # Convert to grayscale
    image = image.convert('L')
    
    # Increase contrast
    enhancer = ImageEnhance.Contrast(image)
    image = enhancer.enhance(2.0)
    
    # Sharpen
    image = image.filter(ImageFilter.SHARPEN)
    
    return image

def extract_text_from_image(image_path: str) -> str:
    """Extract text from image using Tesseract OCR."""
    try:
        image = Image.open(image_path)
        
        # Preprocess for better OCR
        processed = preprocess_image(image)
        
        # Try with English
        text = pytesseract.image_to_string(processed, lang='eng')
        
        return text.strip()
        
    except Exception as e:
        print(f"  Error extracting text: {str(e)}")
        return ""

def parse_timetable_text(text: str, source_file: str) -> Dict[str, Any]:
    """
    Parse extracted text to identify bus routes.
    Returns dict with routes and metadata.
    """
    lines = [line.strip() for line in text.split('\n') if line.strip()]
    
    routes = []
    
    # Pattern matching for common bus timetable formats
    time_pattern = r'\b([0-2]?\d):([0-5]\d)\b'
    route_keywords = ['CHENNAI', 'MADURAI', 'TRICHY', 'COIMBATORE', 'SALEM', 'ERODE', 
                      'BANGALORE', 'KANCHIPURAM', 'TIRUPPUR', 'DINDIGUL', 'THANJAVUR',
                      'RAMESWARAM', 'VELLORE', 'PONDICHERRY', 'KUMBAKONAM']
    
    current_route = None
    
    for i, line in enumerate(lines):
        line_upper = line.upper()
        
        # Look for route indicators (origin-destination)
        origin = None
        destination = None
        
        for keyword in route_keywords:
            if keyword in line_upper:
                # Check if it's an origin or destination
                if not origin:
                    origin = keyword
                elif keyword != origin:
                    destination = keyword
                    break
        
        # Look for times in the line
        times = re.findall(time_pattern, line)
        
        if origin or times:
            # Extract route information
            route = {
                "origin": origin or "UNKNOWN",
                "destination": destination or "UNKNOWN",
                "departure_time": f"{times[0][0]}:{times[0][1]}" if times else "UNKNOWN",
                "arrival_time": f"{times[-1][0]}:{times[-1][1]}" if len(times) > 1 else "UNKNOWN",
                "service_code": extract_service_code(line),
                "bus_type": extract_bus_type(line),
                "corporation": "TNSTC" if "TNSTC" in line_upper else "SETC" if "SETC" in line_upper else "UNKNOWN",
                "stops": extract_via_points(line, times),
                "raw_text": line,
                "source_file": source_file
            }
            
            if route["origin"] != "UNKNOWN" or route["departure_time"] != "UNKNOWN":
                routes.append(route)
    
    return {
        "routes": routes,
        "total_routes": len(routes),
        "source_file": source_file,
        "extracted_at": datetime.now().isoformat(),
        "raw_text_preview": '\n'.join(lines[:10]) if len(lines) > 10 else '\n'.join(lines)
    }

def extract_service_code(line: str) -> str:
    """Extract service/route code from line."""
    # Look for common patterns like numbers followed by AC, UD, etc.
    match = re.search(r'\b(\d{2,4})\s*(AC|UD|UC|SD|SO)\b', line, re.IGNORECASE)
    if match:
        return f"{match.group(1)}{match.group(2)}"
    
    # Look for standalone numbers
    match = re.search(r'\b(\d{3,5})\b', line)
    if match:
        return match.group(1)
    
    return "UNKNOWN"

def extract_bus_type(line: str) -> str:
    """Extract bus type from line."""
    line_upper = line.upper()
    if 'AC' in line_upper:
        if 'SLEEPER' in line_upper:
            return "AC Sleeper"
        return "AC"
    if 'SLEEPER' in line_upper:
        return "Sleeper"
    if 'EXPRESS' in line_upper:
        return "Express"
    if 'ORDINARY' in line_upper:
        return "Ordinary"
    return "UNKNOWN"

def extract_via_points(line: str, times: List) -> List[Dict[str, str]]:
    """Extract via/intermediate stops."""
    via_points = []
    
    # Look for 'VIA' keyword
    if 'VIA' in line.upper():
        via_text = line.upper().split('VIA')[1] if 'VIA' in line.upper() else ""
        # Extract city names after VIA
        cities = [city.strip() for city in re.split(r'[,\-]', via_text) if city.strip()]
        
        for i, city in enumerate(cities):
            via_points.append({
                "name": city,
                "time": f"{times[i+1][0]}:{times[i+1][1]}" if i+1 < len(times) else "UNKNOWN"
            })
    
    return via_points

def analyze_image_with_tesseract(image_path: str) -> Dict[str, Any]:
    """
    Analyze bus timetable image using Tesseract OCR.
    
    Args:
        image_path: Path to the image file
        
    Returns:
        Dictionary containing extracted bus timetable data
    """
    try:
        # Extract text using OCR
        text = extract_text_from_image(image_path)
        
        if not text:
            return {
                "routes": [],
                "image_quality": "unreadable",
                "notes": "No text could be extracted from image",
                "source_file": os.path.basename(image_path),
                "extracted_at": datetime.now().isoformat()
            }
        
        # Parse the extracted text
        result = parse_timetable_text(text, os.path.basename(image_path))
        result["image_quality"] = "good" if len(result["routes"]) > 0 else "poor"
        result["notes"] = f"Extracted {len(result['routes'])} routes using Tesseract OCR"
        
        return result
        
    except Exception as e:
        print(f"  Error analyzing {image_path}: {str(e)}")
        return {
            "routes": [],
            "image_quality": "error",
            "notes": f"Error: {str(e)}",
            "source_file": os.path.basename(image_path),
            "extracted_at": datetime.now().isoformat()
        }

def process_images_folder(folder_path: str, output_file: str = None):
    """
    Process all images in a folder and extract bus timetable data.
    
    Args:
        folder_path: Path to folder containing images
        output_file: Path to save results (default: extracted_timetables.json)
    """
    folder = Path(folder_path)
    if not folder.exists():
        print(f"Error: Folder {folder_path} does not exist")
        return
    
    # Get all image files
    image_extensions = {'.jpg', '.jpeg', '.png', '.gif', '.webp'}
    image_files = [f for f in folder.iterdir() 
                   if f.suffix.lower() in image_extensions and f.is_file()]
    
    print(f"Found {len(image_files)} images to process")
    
    # Process each image
    all_results = []
    total_routes = 0
    
    for idx, image_file in enumerate(image_files, 1):
        print(f"\n[{idx}/{len(image_files)}] Processing: {image_file.name}")
        
        result = analyze_image_with_tesseract(str(image_file))
        all_results.append(result)
        
        routes_count = len(result.get('routes', []))
        total_routes += routes_count
        print(f"  → Extracted {routes_count} route(s)")
        print(f"  → Quality: {result.get('image_quality', 'unknown')}")
        
        # Small delay for politeness (not strictly necessary for local OCR)
        import time
        time.sleep(0.1)
    
    # Save results
    if output_file is None:
        output_file = folder.parent / 'extracted_timetables.json'
    else:
        output_file = Path(output_file)
    
    output_data = {
        "extraction_date": datetime.now().isoformat(),
        "total_images_processed": len(image_files),
        "total_routes_extracted": total_routes,
        "images": all_results
    }
    
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(output_data, f, indent=2, ensure_ascii=False)
    
    print(f"\n{'='*60}")
    print(f"Extraction complete!")
    print(f"Total images processed: {len(image_files)}")
    print(f"Total routes extracted: {total_routes}")
    print(f"Results saved to: {output_file}")
    print(f"{'='*60}")
    
    # Also create a flattened routes file for easier access
    all_routes = []
    for img_result in all_results:
        for route in img_result.get('routes', []):
            route['source_file'] = img_result['source_file']
            route['extracted_at'] = img_result['extracted_at']
            all_routes.append(route)
    
    routes_file = output_file.parent / 'extracted_routes_flat.json'
    with open(routes_file, 'w', encoding='utf-8') as f:
        json.dump(all_routes, f, indent=2, ensure_ascii=False)
    
    print(f"Flattened routes saved to: {routes_file}")

if __name__ == "__main__":
    import sys
    
    # Get folder path from command line or use default
    if len(sys.argv) > 1:
        folder_path = sys.argv[1]
    else:
        folder_path = "/Users/mchand69/Downloads/tnstc bus time table - Google Search"
    
    # Get output file from command line (optional)
    output_file = sys.argv[2] if len(sys.argv) > 2 else None
    
    process_images_folder(folder_path, output_file)
