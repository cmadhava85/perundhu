#!/usr/bin/env python3
"""
Consolidate all TNSTC JSON data files into a single JSON file.
"""

import json
import os
from pathlib import Path
from collections import defaultdict

def consolidate_tnstc_data():
    """Consolidate all TNSTC JSON files into a single file."""
    
    # Base directory
    base_dir = Path(__file__).parent
    tnstc_dir = base_dir / 'data' / 'tnstc_major'
    output_file = base_dir / 'data' / 'tnstc_consolidated.json'
    
    if not tnstc_dir.exists():
        print(f"❌ Directory not found: {tnstc_dir}")
        return
    
    print(f"🔍 Scanning directory: {tnstc_dir}")
    
    # Consolidated data structure
    consolidated = {
        "metadata": {
            "total_routes": 0,
            "total_buses": 0,
            "source_files": [],
            "route_pairs": []
        },
        "routes": []
    }
    
    # Track unique service codes to avoid duplicates
    service_codes_seen = set()
    route_pairs = set()
    
    # Find all JSON files (excluding checkpoint files)
    json_files = sorted([
        f for f in tnstc_dir.glob('*.json') 
        if 'checkpoint' not in f.name and 'parallel' not in f.name
    ])
    
    print(f"📁 Found {len(json_files)} JSON files to process")
    
    processed_count = 0
    skipped_count = 0
    
    for json_file in json_files:
        try:
            with open(json_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            if not isinstance(data, list):
                print(f"⚠️  Skipping {json_file.name}: Not a list")
                skipped_count += 1
                continue
            
            # Extract route pair from filename (e.g., worker_1_CHENNAI_MADURAI.json)
            parts = json_file.stem.split('_')
            if len(parts) >= 4:
                origin = parts[2]
                destination = parts[3]
                route_pair = f"{origin}-{destination}"
                route_pairs.add(route_pair)
            
            # Add buses from this file
            for bus in data:
                if isinstance(bus, dict):
                    service_code = bus.get('service_code', '')
                    
                    # Skip duplicates based on service_code
                    if service_code and service_code in service_codes_seen:
                        continue
                    
                    if service_code:
                        service_codes_seen.add(service_code)
                    
                    # Add source file info to each bus record
                    bus['source_file'] = json_file.name
                    consolidated['routes'].append(bus)
            
            consolidated['metadata']['source_files'].append(json_file.name)
            processed_count += 1
            
            if processed_count % 100 == 0:
                print(f"  ✓ Processed {processed_count} files...")
                
        except json.JSONDecodeError as e:
            print(f"❌ Error parsing {json_file.name}: {e}")
            skipped_count += 1
        except Exception as e:
            print(f"❌ Error processing {json_file.name}: {e}")
            skipped_count += 1
    
    # Update metadata
    consolidated['metadata']['total_routes'] = len(route_pairs)
    consolidated['metadata']['total_buses'] = len(consolidated['routes'])
    consolidated['metadata']['route_pairs'] = sorted(list(route_pairs))
    
    # Write consolidated data
    print(f"\n💾 Writing consolidated data to: {output_file}")
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(consolidated, f, indent=2, ensure_ascii=False)
    
    # Print summary
    print(f"\n✅ Consolidation Complete!")
    print(f"   📊 Statistics:")
    print(f"      • Files processed: {processed_count}")
    print(f"      • Files skipped: {skipped_count}")
    print(f"      • Unique route pairs: {len(route_pairs)}")
    print(f"      • Total buses: {consolidated['metadata']['total_buses']}")
    print(f"      • Output file: {output_file.name}")
    print(f"      • File size: {output_file.stat().st_size / 1024 / 1024:.2f} MB")
    
    # Show sample route pairs
    print(f"\n   📍 Sample route pairs:")
    for route in sorted(route_pairs)[:10]:
        print(f"      • {route}")
    if len(route_pairs) > 10:
        print(f"      ... and {len(route_pairs) - 10} more")

if __name__ == '__main__':
    consolidate_tnstc_data()
