#!/usr/bin/env python3
"""
Location Alignment Script
Reconciles locations between consolidated_buses.json and tamil_nadu_locations_enhanced.json
Identifies missing locations and location name mismatches.
"""

import json
import difflib
from pathlib import Path
from collections import defaultdict
from typing import Dict, Set, Tuple, List

def load_locations_from_json(filepath: str) -> Dict[str, dict]:
    """Load locations from tamil_nadu_locations_enhanced.json into a dict by name"""
    locations = {}
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    for loc in data:
        name = loc.get('name', '').strip().upper()
        if name:
            locations[name] = loc
    
    return locations

def build_location_index(known_locations: Dict[str, dict]) -> Dict[str, Set[str]]:
    """Build a fast index for location prefix matching"""
    index = defaultdict(set)
    
    for loc_name in known_locations.keys():
        # Index by first 3 chars
        if len(loc_name) >= 3:
            prefix = loc_name[:3]
            index[prefix].add(loc_name)
    
    return index

def load_bus_locations(filepath: str) -> Set[str]:
    """Extract all unique origin and destination locations from consolidated_buses.json"""
    bus_locations = set()
    
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    buses = data.get('buses', []) if isinstance(data, dict) else data
    
    for bus in buses:
        origin = bus.get('origin', '').strip()
        destination = bus.get('destination', '').strip()
        
        if origin:
            bus_locations.add(origin)
        if destination:
            bus_locations.add(destination)
    
    return bus_locations

def find_best_match(bus_location: str, known_locations: Dict[str, dict], 
                   index: Dict[str, Set[str]], threshold: float = 0.7) -> Tuple[str, float]:
    """Find best matching location using indexed search"""
    bus_loc_upper = bus_location.upper()
    
    # Get candidates from index
    prefix = bus_loc_upper[:3] if len(bus_loc_upper) >= 3 else bus_loc_upper
    candidates = index.get(prefix, set())
    
    if not candidates:
        return None, 0.0
    
    # Check candidates
    for known_loc in candidates:
        if bus_loc_upper in known_loc or known_loc in bus_loc_upper:
            score = difflib.SequenceMatcher(None, bus_loc_upper, known_loc).ratio()
            if score >= threshold:
                return known_loc, score
    
    return None, 0.0

def align_locations(locations_file: str = "data/tamil_nadu_locations_enhanced.json",
                   buses_file: str = "data/consolidated_buses.json",
                   output_file: str = "location_alignment_report.json"):
    """Generate location alignment report"""
    
    print("📂 Loading locations...")
    known_locations = load_locations_from_json(locations_file)
    print(f"   ✅ Loaded {len(known_locations)} unique locations")
    
    print("📇 Building location index...")
    location_index = build_location_index(known_locations)
    print(f"   ✅ Index built with {len(location_index)} prefixes")
    
    print("\n📂 Loading bus locations...")
    bus_locations = load_bus_locations(buses_file)
    print(f"   ✅ Found {len(bus_locations)} unique locations in buses data")
    
    # Categorize locations
    exact_matches = {}
    fuzzy_matches = {}
    missing_locations = []
    
    print("\n🔍 Matching locations...")
    for idx, bus_loc in enumerate(sorted(bus_locations)):
        if (idx + 1) % 50 == 0:
            print(f"   Progress: {idx + 1}/{len(bus_locations)}")
        
        bus_loc_upper = bus_loc.upper()
        
        # Check for exact match
        if bus_loc_upper in known_locations:
            exact_matches[bus_loc] = known_locations[bus_loc_upper]
        else:
            # Try fuzzy matching
            match, score = find_best_match(bus_loc, known_locations, location_index)
            if match:
                fuzzy_matches[bus_loc] = {
                    'matched_to': match,
                    'score': round(score, 2),
                    'location_data': known_locations[match]
                }
            else:
                missing_locations.append(bus_loc)
    
    # Generate report
    report = {
        'summary': {
            'total_bus_locations': len(bus_locations),
            'exact_matches': len(exact_matches),
            'fuzzy_matches': len(fuzzy_matches),
            'missing_locations': len(missing_locations),
            'match_percentage': round((len(exact_matches) + len(fuzzy_matches)) / len(bus_locations) * 100, 2) if bus_locations else 0
        },
        'exact_matches': exact_matches,
        'fuzzy_matches': fuzzy_matches,
        'missing_locations': missing_locations,
        'recommendations': []
    }
    
    # Add recommendations
    if missing_locations:
        report['recommendations'].append(f"⚠️  {len(missing_locations)} locations from buses are missing in tamil_nadu_locations_enhanced.json")
        report['recommendations'].append("   These need to be added manually:")
        for loc in missing_locations[:10]:  # Show first 10
            report['recommendations'].append(f"   - {loc}")
        if len(missing_locations) > 10:
            report['recommendations'].append(f"   ... and {len(missing_locations) - 10} more")
    
    if fuzzy_matches:
        low_confidence = [loc for loc, data in fuzzy_matches.items() if data['score'] < 0.75]
        if low_confidence:
            report['recommendations'].append(f"⚠️  {len(low_confidence)} locations have low confidence fuzzy matches (< 75%)")
            report['recommendations'].append("   Please review these manually:")
            for loc in low_confidence[:5]:
                match_data = fuzzy_matches[loc]
                report['recommendations'].append(f"   - '{loc}' → '{match_data['matched_to']}' (confidence: {match_data['score']})")
    
    # Print report
    print("\n" + "="*70)
    print("LOCATION ALIGNMENT REPORT")
    print("="*70)
    print(f"\n📊 Summary:")
    print(f"   Total bus locations: {report['summary']['total_bus_locations']}")
    print(f"   Exact matches: {report['summary']['exact_matches']}")
    print(f"   Fuzzy matches: {report['summary']['fuzzy_matches']}")
    print(f"   Missing locations: {report['summary']['missing_locations']}")
    print(f"   Overall match rate: {report['summary']['match_percentage']}%")
    
    if report['recommendations']:
        print(f"\n⚠️  Recommendations:")
        for rec in report['recommendations']:
            print(f"   {rec}")
    
    if not report['missing_locations'] and len([m for m in fuzzy_matches.values() if m['score'] < 0.75]) == 0:
        print("\n✅ All bus locations are properly aligned!")
    
    # Save report
    print(f"\n💾 Saving detailed report to {output_file}...")
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(report, f, indent=2, ensure_ascii=False)
    
    print(f"   ✅ Report saved!")
    
    return report

if __name__ == "__main__":
    import sys
    
    locations_file = sys.argv[1] if len(sys.argv) > 1 else "data/tamil_nadu_locations_enhanced.json"
    buses_file = sys.argv[2] if len(sys.argv) > 2 else "data/consolidated_buses.json"
    output_file = sys.argv[3] if len(sys.argv) > 3 else "location_alignment_report.json"
    
    align_locations(locations_file, buses_file, output_file)
