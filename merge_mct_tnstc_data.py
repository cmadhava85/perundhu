#!/usr/bin/env python3
"""
Merge MTC and TNSTC bus data into a single consolidated JSON file.
Handles location mapping and creates a unified structure for easy database import.
"""

import json
import os
from pathlib import Path
from collections import defaultdict

# ============================================================================
# LOCATION MAPPING CONFIGURATION
# ============================================================================
# Maps various location name variations to standardized database location names
LOCATION_MAPPING = {
    # KILAMBAKKAM (multiple variations normalized to standard name)
    "KILAMBAKKAM": "KCBT KILAMBAKKAM",
    "KCBT KILAMBAKKAM": "KCBT KILAMBAKKAM",
    "KILAMBAKKAM KCBT": "KCBT KILAMBAKKAM",
    "KCBT": "KCBT KILAMBAKKAM",
    
    # MADURAI (inter-state, mapped to main terminal)
    "MADURAI": "Madurai - Mattuthavani",
    "MADURAI MATTUTHAVANI": "Madurai - Mattuthavani",
    "MADURAI - MATTUTHAVANI": "Madurai - Mattuthavani",
    
    # CHENNAI (main terminal within Chennai)
    "BROADWAY": "BROADWAY",
    "BROADWAY BUS TERMINUS": "BROADWAY",
    "CHENNAI": "BROADWAY",
    "BROADWAY TERMINUS": "BROADWAY",
    
    # Other major Chennai terminals (MTC local)
    "KOYAMBEDU": "Chennai - CMBT (Koyambedu)",
    "CMBT": "Chennai - CMBT (Koyambedu)",
    "TAMBARAM": "CHENNAI TAMBARAM",
    "TIRUVANMIYUR": "CHENNAI TIRUVANMIYUR",
    "AIRPORT": "CHENNAI AIRPORT",
    "ADYAR": "ADYAR B.S",
    "ADYAR B.S": "ADYAR B.S",
    "ADYAR B.S.": "ADYAR B.S",
    "CENTRAL STATION": "Chennai Central",
    "MOFUSSIL": "Chennai Mofussil Bus Terminus",
    
    # Inter-state TNSTC cities (for reference)
    "COIMBATORE": "COIMBATORE",
    "SALEM": "SALEM",
    "ERODE": "ERODE",
    "DHARMAPURI": "DHARMAPURI",
    "KRISHNAGIRI": "KRISHNAGIRI",
    "KANYAKUMARI": "KANYAKUMARI",
    "NAGERCOIL": "NAGERCOIL",
    "TIRUNELVELI": "TIRUNELVELI",
    "VIRUDUNAGAR": "VIRUDUNAGAR",
    "THOOTHUKUDI": "THOOTHUKUDI",
    "DINDIGUL": "DINDIGUL",
    "CUDDALORE": "CUDDALORE",
    "ARIYALUR": "ARIYALUR",
    "TIRUVANNAMALAI": "TIRUVANNAMALAI",
    "PERAMBALUR": "PERAMBALUR",
    "BENGALURU": "BENGALURU",
    "HOSUR": "HOSUR",
    "KALLAKURICHI": "KALLAKURICHI",
}

def normalize_location(location_name):
    """Normalize location name using mapping."""
    if not location_name:
        return None
    
    location_name = location_name.strip().upper()
    
    # Direct mapping
    for key, value in LOCATION_MAPPING.items():
        if location_name == key.upper():
            return value
    
    # Partial match
    for key, value in LOCATION_MAPPING.items():
        if key.upper() in location_name or location_name in key.upper():
            return value
    
    return location_name


def resolve_location_from_tnstc_stop(stop_info):
    """
    Extract standardized location from TNSTC stop.
    TNSTC stops have complex city names like "CHENNAI-KILAMBAKKAM-KCBT"
    """
    if not stop_info:
        return None
    
    city = stop_info.get('city', '').strip().upper()
    landmark = stop_info.get('landmark', '').strip().upper()
    
    # Parse complex city strings
    if 'KILAMBAKKAM' in city or 'KCBT' in city:
        return "KCBT KILAMBAKKAM"
    elif 'MADURAI' in city or 'MATTUTHAVANI' in landmark:
        return "Madurai - Mattuthavani"
    elif 'BROADWAY' in city or 'KOYAMBEDU' in city:
        return "BROADWAY"
    
    return normalize_location(city)


def create_bus_record(bus_data, source='MTC'):
    """
    Create standardized bus record with consistent attributes.
    Both MTC and TNSTC use this structure.
    """
    return {
        "bus_number": bus_data.get('bus_number', ''),
        "bus_name": bus_data.get('bus_name', ''),
        "operator": bus_data.get('operator', source),
        "source": bus_data.get('source', source),
        "origin": bus_data.get('origin', ''),
        "destination": bus_data.get('destination', ''),
        "departure_time": bus_data.get('departure_time', ''),
        "arrival_time": bus_data.get('arrival_time', ''),
        "bus_type": bus_data.get('bus_type', 'Standard'),
        "available_seats": bus_data.get('available_seats', '0'),
        "fare": bus_data.get('fare', 'N/A'),
        "stops": bus_data.get('stops', []),
        "service_code": bus_data.get('service_code', ''),
        "journey_date": bus_data.get('journey_date', ''),
    }


def merge_mtc_data(all_buses):
    """
    Process MTC data: normalize and add to consolidated list.
    MTC is local Chennai data only - use terminal names as-is.
    """
    mtc_file = Path(__file__).parent / 'data' / 'mtc_bus_timings_merged.json'
    
    if not mtc_file.exists():
        print(f"⚠️  MTC file not found: {mtc_file}")
        return 0
    
    print(f"📖 Loading MTC data from {mtc_file.name}...")
    with open(mtc_file, 'r', encoding='utf-8') as f:
        mtc_data = json.load(f)
    
    print(f"📊 Processing {len(mtc_data)} MTC buses...")
    
    mtc_count = 0
    for idx, bus in enumerate(mtc_data):
        try:
            origin = normalize_location(bus.get('origin_name', ''))
            destination = normalize_location(bus.get('destination_name', ''))
            
            if not origin or not destination:
                continue
            
            # Create standardized record
            consolidated_bus = create_bus_record({
                "bus_number": bus.get('route_number', ''),
                "bus_name": bus.get('route_name', ''),
                "operator": "MTC",
                "source": "MTC",
                "origin": origin,
                "destination": destination,
                "departure_time": bus.get('departure_time', ''),
                "arrival_time": bus.get('arrival_time', ''),
                "stops": [],  # MTC doesn't provide detailed stops
                "service_code": f"MTC_{bus.get('route_number', '')}_{idx}",
                "bus_type": "Standard",
                "available_seats": "45",
                "fare": "N/A",
                "journey_date": bus.get('scraped_at', ''),
            }, source='MTC')
            
            all_buses.append(consolidated_bus)
            mtc_count += 1
            
            if (idx + 1) % 1000 == 0:
                print(f"  ✓ Processed {idx + 1} MTC buses...")
        
        except Exception as e:
            print(f"  ❌ Error processing MTC bus {idx}: {e}")
            continue
    
    return mtc_count


def merge_tnstc_data(all_buses):
    """
    Process TNSTC data: extract stops and normalize locations.
    TNSTC includes multi-leg journeys via stops field.
    """
    tnstc_file = Path(__file__).parent / 'data' / 'tnstc_consolidated.json'
    
    if not tnstc_file.exists():
        print(f"⚠️  TNSTC file not found: {tnstc_file}")
        return 0
    
    print(f"📖 Loading TNSTC data from {tnstc_file.name}...")
    with open(tnstc_file, 'r', encoding='utf-8') as f:
        tnstc_data = json.load(f)
    
    buses = tnstc_data.get('routes', [])
    print(f"📊 Processing {len(buses)} TNSTC buses...")
    
    tnstc_count = 0
    for idx, bus in enumerate(buses):
        try:
            stops = bus.get('stops', [])
            
            if len(stops) < 2:
                continue  # Need at least origin and destination
            
            # Get origin and destination from stops (more accurate)
            origin = resolve_location_from_tnstc_stop(stops[0])
            destination = resolve_location_from_tnstc_stop(stops[-1])
            
            if not origin or not destination:
                continue
            
            # Convert stops to standardized format
            normalized_stops = []
            for stop in stops:
                normalized_stops.append({
                    "location": resolve_location_from_tnstc_stop(stop),
                    "landmark": stop.get('landmark', ''),
                    "time": stop.get('time', ''),
                    "original_city": stop.get('city', ''),
                })
            
            # Extract seat count (format: "45 Seats Available" -> "45")
            seats_str = bus.get('available_seats', '0 Seats Available')
            seats = seats_str.split()[0] if seats_str else '0'
            
            # Create standardized record
            consolidated_bus = create_bus_record({
                "bus_number": bus.get('route_number', ''),
                "bus_name": bus.get('busName', 'TNSTC'),
                "operator": "TNSTC",
                "source": "TNSTC",
                "origin": origin,
                "destination": destination,
                "departure_time": bus.get('departure_time', ''),
                "arrival_time": bus.get('arrival_time', ''),
                "stops": normalized_stops,  # Detailed stops for multi-leg routing
                "service_code": bus.get('service_code', ''),
                "bus_type": bus.get('bus_type', 'Standard'),
                "available_seats": seats,
                "fare": bus.get('fare', 'N/A'),
                "journey_date": bus.get('journey_date', ''),
            }, source='TNSTC')
            
            all_buses.append(consolidated_bus)
            tnstc_count += 1
            
            if (idx + 1) % 1000 == 0:
                print(f"  ✓ Processed {idx + 1} TNSTC buses...")
        
        except Exception as e:
            print(f"  ❌ Error processing TNSTC bus {idx}: {e}")
            continue
    
    return tnstc_count


def create_consolidated_file(all_buses):
    """Create final consolidated JSON file."""
    output_file = Path(__file__).parent / 'data' / 'consolidated_buses.json'
    
    # Group by route for statistics
    routes_by_operator = defaultdict(lambda: defaultdict(int))
    location_pairs = set()
    
    for bus in all_buses:
        operator = bus['operator']
        route = bus['bus_number']
        routes_by_operator[operator][route] += 1
        
        origin_dest = f"{bus['origin']} -> {bus['destination']}"
        location_pairs.add(origin_dest)
    
    consolidated_data = {
        "metadata": {
            "total_buses": len(all_buses),
            "mtc_buses": sum(len(routes) for op, routes in routes_by_operator.items() if op == 'MTC'),
            "tnstc_buses": sum(len(routes) for op, routes in routes_by_operator.items() if op == 'TNSTC'),
            "unique_routes_mtc": len(routes_by_operator.get('MTC', {})),
            "unique_routes_tnstc": len(routes_by_operator.get('TNSTC', {})),
            "unique_location_pairs": len(location_pairs),
            "operators": list(routes_by_operator.keys()),
        },
        "buses": all_buses,
    }
    
    print(f"\n💾 Writing consolidated data to {output_file.name}...")
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(consolidated_data, f, indent=2, ensure_ascii=False)
    
    print(f"✅ Consolidated file created!")
    print(f"\n📊 Statistics:")
    print(f"   Total buses: {len(all_buses)}")
    print(f"   MTC buses: {consolidated_data['metadata']['mtc_buses']}")
    print(f"   TNSTC buses: {consolidated_data['metadata']['tnstc_buses']}")
    print(f"   Unique MTC routes: {consolidated_data['metadata']['unique_routes_mtc']}")
    print(f"   Unique TNSTC routes: {consolidated_data['metadata']['unique_routes_tnstc']}")
    print(f"   Unique location pairs: {consolidated_data['metadata']['unique_location_pairs']}")
    print(f"   File size: {output_file.stat().st_size / 1024 / 1024:.2f} MB")
    
    return output_file


def generate_mapping_report(all_buses):
    """Generate report of location mappings used."""
    locations_used = set()
    
    for bus in all_buses:
        locations_used.add(bus['origin'])
        locations_used.add(bus['destination'])
        for stop in bus.get('stops', []):
            locations_used.add(stop['location'])
    
    print("\n" + "="*70)
    print("Location Mapping Report")
    print("="*70)
    print(f"Unique locations in consolidated data: {len(locations_used)}")
    print("\nLocations used:")
    for loc in sorted(locations_used):
        print(f"  • {loc}")
    
    return locations_used


if __name__ == '__main__':
    print("🚀 Merging MTC and TNSTC Bus Data")
    print("="*70)
    
    all_buses = []
    
    # Process both datasets
    mtc_count = merge_mtc_data(all_buses)
    tnstc_count = merge_tnstc_data(all_buses)
    
    print(f"\n✓ Merged {mtc_count} MTC buses")
    print(f"✓ Merged {tnstc_count} TNSTC buses")
    print(f"✓ Total: {len(all_buses)} buses")
    
    # Create consolidated file
    output_file = create_consolidated_file(all_buses)
    
    # Generate mapping report
    locations_used = generate_mapping_report(all_buses)
    
    print("\n✅ Merge Complete!")
    print(f"Output file: {output_file}")
