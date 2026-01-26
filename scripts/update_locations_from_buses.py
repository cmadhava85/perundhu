#!/usr/bin/env python3
"""
Update tamil_nadu_locations_enhanced.json with missing locations from consolidated_buses.json
Uses bus data locations and best-guess district assignment.
"""

import json
from pathlib import Path
from collections import defaultdict
from typing import Dict, Set, List

def extract_district_from_bus_location(bus_location: str) -> str:
    """Extract district name from bus location if possible"""
    location_upper = bus_location.upper()
    
    # Common district indicators
    district_map = {
        'CHENNAI': 'Chennai',
        'MADURAI': 'Madurai',
        'TRICHY': 'Trichy',
        'COIMBATORE': 'Coimbatore',
        'SALEM': 'Salem',
        'ERODE': 'Erode',
        'VELLORE': 'Vellore',
        'TIRUPPUR': 'Tiruppur',
        'VILLUPURAM': 'Villupuram',
        'CUDDALORE': 'Cuddalore',
        'DINDIGUL': 'Dindigul',
        'KARUR': 'Karur',
        'KRISHNAGIRI': 'Krishnagiri',
        'KANCHIPURAM': 'Kanchipuram',
        'TENKASI': 'Tenkasi',
        'TIRUNELVELI': 'Tirunelveli',
        'VIRUDHUNAGAR': 'Virudhunagar',
        'SIVAGANGA': 'Sivaganga',
        'RAMNAD': 'Ramanathapuram',
        'THANJAVUR': 'Thanjavur',
        'NAGAPATTINAM': 'Nagapattinam',
        'THIRUVARUR': 'Thiruvarur',
        'NAMAKKAL': 'Namakkal',
        'PUDUCHERRY': 'Puducherry',
        'NILGIRIS': 'Nilgiris',
        'NILGIRI': 'Nilgiris',
        'DHARMAPURI': 'Dharmapuri',
    }
    
    for key, district in district_map.items():
        if key in location_upper:
            return district
    
    return 'Unknown'

def load_missing_locations(report_file: str = "location_alignment_report.json") -> List[str]:
    """Load missing locations from alignment report"""
    with open(report_file, 'r') as f:
        report = json.load(f)
    
    return report['missing_locations']

def update_locations_file(locations_file: str = "data/tamil_nadu_locations_enhanced.json",
                         buses_file: str = "data/consolidated_buses.json",
                         report_file: str = "location_alignment_report.json"):
    """Add missing locations to tamil_nadu_locations_enhanced.json"""
    
    print("📂 Loading current locations...")
    with open(locations_file, 'r') as f:
        locations = json.load(f)
    
    print("📊 Getting missing locations from report...")
    missing_locs = load_missing_locations(report_file)
    print(f"   ✅ Found {len(missing_locs)} missing locations")
    
    print("\n📝 Creating new location entries...")
    new_locations = []
    
    for loc_name in missing_locs:
        # Guess district
        district = extract_district_from_bus_location(loc_name)
        
        new_location = {
            "name": loc_name.strip(),
            "type": "bus_stop",
            "latitude": 0.0,  # Will need manual geocoding
            "longitude": 0.0,
            "osm_id": None,
            "state": "Tamil Nadu",
            "district": district
        }
        new_locations.append(new_location)
    
    print(f"   ✅ Created {len(new_locations)} new location entries")
    
    # Group by district for visibility
    by_district = defaultdict(list)
    for loc in new_locations:
        by_district[loc['district']].append(loc['name'])
    
    print("\n📍 Locations by district:")
    for district in sorted(by_district.keys()):
        print(f"   {district}: {len(by_district[district])} locations")
    
    # Add new locations to the list
    locations.extend(new_locations)
    
    # Save updated file
    print(f"\n💾 Saving updated locations file...")
    with open(locations_file, 'w') as f:
        json.dump(locations, f, ensure_ascii=False, indent=2)
    
    print(f"   ✅ Updated! Total locations: {len(locations)}")
    print(f"\n⚠️  IMPORTANT:")
    print(f"   - {len(new_locations)} new locations added with latitude/longitude = 0.0")
    print(f"   - These need to be geocoded using OpenStreetMap or other geocoding service")
    print(f"   - Mark these locations for manual geocoding verification")
    print(f"\n✨ To geocode these locations, use:")
    print(f"   python3 scripts/geocode_locations.py --missing-only")
    
    return new_locations

if __name__ == "__main__":
    import sys
    
    locations_file = sys.argv[1] if len(sys.argv) > 1 else "data/tamil_nadu_locations_enhanced.json"
    buses_file = sys.argv[2] if len(sys.argv) > 2 else "data/consolidated_buses.json"
    report_file = sys.argv[3] if len(sys.argv) > 3 else "location_alignment_report.json"
    
    update_locations_file(locations_file, buses_file, report_file)
