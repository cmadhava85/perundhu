#!/usr/bin/env python3
"""Prepare MTC data for upload by creating checkpoint file"""

import json
from pathlib import Path

def main():
    # Read MTC data
    mtc_file = Path('data/mtc_bus_timings_merged.json')
    print(f"Reading MTC data from: {mtc_file}")
    
    with open(mtc_file, 'r') as f:
        data = json.load(f)
    
    print(f"Loaded {len(data)} records")
    
    # Create checkpoint file with deduplicated routes
    checkpoint = {
        'all_timings': [],
        'operator': 'MTC',
        'total_routes': 0
    }
    
    # Deduplicate by (route_number, origin, destination)
    seen = set()
    for record in data:
        route_number = record.get('route_number', '').strip()
        origin = record.get('origin_name', '').strip()
        destination = record.get('destination_name', '').strip()
        
        if not all([route_number, origin, destination]):
            continue
        
        key = (route_number, origin, destination)
        if key not in seen:
            seen.add(key)
            checkpoint['all_timings'].append({
                'route_number': route_number,
                'origin': origin,
                'destination': destination,
                'stops': record.get('stops', [])
            })
    
    checkpoint['total_routes'] = len(checkpoint['all_timings'])
    
    # Save checkpoint
    checkpoint_file = Path('data/mtc_bus_timings.checkpoint.json')
    with open(checkpoint_file, 'w') as f:
        json.dump(checkpoint, f, indent=2)
    
    print(f"\n✅ Created checkpoint file: {checkpoint_file}")
    print(f"   Original records: {len(data)}")
    print(f"   Unique routes: {len(checkpoint['all_timings'])}")
    print(f"\n📋 Sample routes:")
    for route in checkpoint['all_timings'][:5]:
        print(f"   {route['route_number']}: {route['origin']} → {route['destination']}")

if __name__ == '__main__':
    main()
