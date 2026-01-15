#!/usr/bin/env python3
"""
Clean TNSTC extracted data by fixing stops array
Removes HTML metadata and headers from stops, keeping only actual stop data
"""

import json
import re
from pathlib import Path
from typing import List, Dict
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


def is_valid_stop(stop: Dict[str, str]) -> bool:
    """
    Check if a stop entry is valid (not metadata or headers)
    
    Args:
        stop: Stop dictionary with city, landmark, time fields
        
    Returns:
        True if valid stop, False if metadata/header
    """
    city = stop.get('city', '').strip()
    landmark = stop.get('landmark', '').strip()
    time_text = stop.get('time', '').strip()
    
    # Filter out invalid entries
    invalid_cities = [
        '&nbsp;', 'City', '', 
        'Service&nbsp;Details', 'Service Details',
        'Adult&nbsp;Fare&nbsp;**', 'Adult Fare **',
        'Child&nbsp;Fare&nbsp;**', 'Child Fare **'
    ]
    
    invalid_landmarks = [
        'Route&nbsp;No.&nbsp;:', 'Route No. :',
        'To&nbsp;Place&nbsp;:', 'To Place :',
        'From&nbsp;Place&nbsp;:', 'From Place :',
        'Journey&nbsp;Hours&nbsp;*:', 'Journey Hours *:',
        'Corporation&nbsp;:', 'Corporation :',
        'Adult&nbsp;Fare&nbsp;**', 'Adult Fare **',
        'Land&nbsp;Mark&nbsp;', 'Land Mark',
        ''
    ]
    
    invalid_times = [
        'Service&nbsp;Details', 'Service Details',
        'Route&nbsp;No.&nbsp;:', 'Route No. :',
        'To&nbsp;Place&nbsp;:', 'To Place :',
        'Journey&nbsp;Hours&nbsp;*:', 'Journey Hours *:',
        'Corporation&nbsp;:', 'Corporation :',
        'Adult&nbsp;Fare&nbsp;**', 'Adult Fare **',
        'Dep.&nbsp;Time&nbsp;', 'Dep. Time',
        ''
    ]
    
    # Check if city is invalid
    if city in invalid_cities:
        return False
    
    # Check if it's a service code (starts with digits followed by letters)
    if re.match(r'^\d{4}[A-Z]+', city):
        return False
    
    # Check if landmark is a metadata field
    if landmark in invalid_landmarks:
        return False
    
    # Check if time is invalid
    if time_text in invalid_times:
        return False
    
    # Valid stops must have time in HH:MM format
    if not re.match(r'^\d{1,2}:\d{2}$', time_text):
        return False
    
    # Valid stops must have non-empty city
    if not city or city == '&nbsp;':
        return False
    
    return True


def clean_route(route: Dict) -> Dict:
    """
    Clean a single route entry
    
    Args:
        route: Route dictionary
        
    Returns:
        Cleaned route dictionary
    """
    stops = route.get('stops', [])
    
    if not stops:
        return route
    
    # Filter stops to keep only valid ones
    cleaned_stops = [stop for stop in stops if is_valid_stop(stop)]
    
    # Update departure and arrival times from stops if missing
    if cleaned_stops:
        if not route.get('departure_time') or route.get('departure_time') == '':
            route['departure_time'] = cleaned_stops[0].get('time', '')
        
        if len(cleaned_stops) > 1:
            if not route.get('arrival_time') or route.get('arrival_time') == '':
                route['arrival_time'] = cleaned_stops[-1].get('time', '')
    
    route['stops'] = cleaned_stops
    
    # Extract route_number from stops if available
    # Sometimes route number appears in the metadata we're removing
    for stop in stops:
        if stop.get('landmark', '').strip() == 'Route&nbsp;No.&nbsp;:' or \
           stop.get('landmark', '').strip() == 'Route No. :':
            route_num = stop.get('time', '').strip()
            if route_num and not route.get('route_number'):
                route['route_number'] = route_num
    
    return route


def clean_file(file_path: Path, output_path: Path = None) -> bool:
    """
    Clean a TNSTC data file
    
    Args:
        file_path: Path to input JSON file
        output_path: Path to output file (default: overwrite input)
        
    Returns:
        True if successful, False otherwise
    """
    try:
        logger.info(f"Processing {file_path}")
        
        # Read file
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        if not isinstance(data, list):
            logger.warning(f"Skipping {file_path} - not a list")
            return False
        
        if not data:
            logger.info(f"Skipping {file_path} - empty list")
            return False
        
        # Count original stops
        total_original_stops = sum(len(route.get('stops', [])) for route in data)
        
        # Clean all routes
        cleaned_data = [clean_route(route) for route in data]
        
        # Count cleaned stops
        total_cleaned_stops = sum(len(route.get('stops', [])) for route in cleaned_data)
        
        logger.info(f"  Routes: {len(data)}")
        logger.info(f"  Original stops: {total_original_stops}")
        logger.info(f"  Cleaned stops: {total_cleaned_stops}")
        logger.info(f"  Removed: {total_original_stops - total_cleaned_stops} invalid entries")
        
        # Write output
        if output_path is None:
            output_path = file_path
        
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(cleaned_data, f, indent=2, ensure_ascii=False)
        
        logger.info(f"  ✓ Saved to {output_path}")
        return True
        
    except Exception as e:
        logger.error(f"Error processing {file_path}: {e}")
        return False


def main():
    """Clean all TNSTC data files"""
    # Find all JSON files in TNSTC directories
    patterns = [
        "data/tnstc_major/*.json",
        "data/tnstc_parallel/*.json",
        "data/tnstc*.json"
    ]
    
    files_to_process = []
    
    for pattern in patterns:
        files_to_process.extend(Path('.').glob(pattern))
    
    # Exclude checkpoint files
    files_to_process = [
        f for f in files_to_process 
        if 'checkpoint' not in f.name and f.stat().st_size > 10
    ]
    
    logger.info(f"Found {len(files_to_process)} TNSTC data files to clean")
    
    success_count = 0
    for file_path in sorted(files_to_process):
        if clean_file(file_path):
            success_count += 1
    
    logger.info(f"\n✓ Successfully cleaned {success_count}/{len(files_to_process)} files")


if __name__ == '__main__':
    main()
