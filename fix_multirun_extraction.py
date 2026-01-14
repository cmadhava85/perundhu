#!/usr/bin/env python3
"""
Fix: Extract multiple bus runs (not stops) from table rows
========================================================
Each row in the table is a SEPARATE bus service at a different time,
not stops on a single route.
"""

import json
from typing import List, Dict, Any
from dataclasses import dataclass, asdict

@dataclass
class BusRun:
    """Single bus service/run at a specific time."""
    service_code: str
    origin: str
    destination: str
    departure_time: str
    arrival_time: str
    route_info: str  # Via/Route details
    confidence: float
    source: str


def parse_sivakasi_table_correctly(json_file: str):
    """
    Parse the extracted data correctly as multiple RUNS, not stops.
    """
    with open(json_file, 'r') as f:
        data = json.load(f)
    
    print("=" * 80)
    print("CORRECTED EXTRACTION: Multiple Bus Runs (NOT Stops)")
    print("=" * 80)
    
    for route_data in data:
        print(f"\nOrigin → Destination: {route_data['origin']} → {route_data['destination']}")
        print(f"Source: {route_data['image_source'][:60]}...\n")
        
        # Treat each "stop" as a separate bus run
        if route_data['stops']:
            print(f"Found {len(route_data['stops'])} separate bus runs/services:\n")
            
            for i, stop in enumerate(route_data['stops'], 1):
                # The "time" field is actually the departure time for this run
                dept_time = stop['time']
                
                # Extract route info from landmark
                route_info = stop['landmark']
                
                print(f"Run {i}:")
                print(f"  Departure: {dept_time}")
                print(f"  Destination: {route_data['destination']}")
                print(f"  Route Info: {route_info}")
                print()


def regenerate_correct_format(json_file: str, output_file: str):
    """
    Regenerate the JSON with correct format: multiple runs instead of stops.
    """
    with open(json_file, 'r') as f:
        data = json.load(f)
    
    correct_runs = []
    
    for route_data in data:
        origin = route_data['origin']
        destination = route_data['destination']
        image_source = route_data['image_source']
        base_confidence = route_data['confidence_score']
        
        # Each "stop" is actually a separate run
        for idx, stop in enumerate(route_data['stops']):
            dept_time = stop['time']
            route_info = stop['landmark']
            
            # Generate unique service code for this run
            service_code = f"IMG{origin[:3]}{destination[:3]}{dept_time.replace(':', '')}_RUN{idx+1}"
            
            run = {
                'service_code': service_code,
                'route_number': route_data['route_number'],
                'corporation': route_data['corporation'],
                'origin': origin,
                'destination': destination,
                'departure_time': dept_time,
                'arrival_time': route_data.get('arrival_time', 'UNKNOWN'),
                'duration': route_data['duration'],
                'available_seats': route_data['available_seats'],
                'bus_type': route_data['bus_type'],
                'fare': route_data['fare'],
                'journey_date': route_data['journey_date'],
                'stops': [],  # No stops - this IS the service info
                'route_info': route_info,
                'extracted_at': route_data['extracted_at'],
                'source': route_data['source'],
                'image_source': image_source,
                'confidence_score': base_confidence,
                'bidirectional': route_data['bidirectional']
            }
            
            correct_runs.append(run)
    
    # Save corrected format
    with open(output_file, 'w') as f:
        json.dump(correct_runs, f, indent=2)
    
    print(f"\n✅ Saved {len(correct_runs)} individual bus runs to: {output_file}")
    
    return correct_runs


if __name__ == "__main__":
    import sys
    
    json_file = '/Users/mchand69/Documents/perundhu/data/sivakasi_buses.json/extracted_buses.json'
    output_file = '/Users/mchand69/Documents/perundhu/data/sivakasi_buses.json/extracted_buses_corrected.json'
    
    # Show current (incorrect) interpretation
    print("\nCURRENT (INCORRECT) - Treating as stops:\n")
    parse_sivakasi_table_correctly(json_file)
    
    # Generate corrected format
    print("\n" + "=" * 80)
    print("REGENERATING IN CORRECT FORMAT...")
    print("=" * 80)
    runs = regenerate_correct_format(json_file, output_file)
    
    # Show sample of corrected data
    print("\n📋 Sample of corrected data:\n")
    for i, run in enumerate(runs[:3]):
        print(f"Run {i+1}: {run['origin']} → {run['destination']} @ {run['departure_time']}")
        print(f"  Route Info: {run['route_info'][:60]}...\n")
