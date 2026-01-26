#!/usr/bin/env python3
"""
Analyze location naming mismatches between MTC and TNSTC data.
"""

import json

# Check TNSTC unique locations
tnstc_data = json.load(open('data/tnstc_consolidated.json'))
tnstc_origins = set()
tnstc_destinations = set()

for bus in tnstc_data['routes']:
    tnstc_origins.add(bus.get('origin', ''))
    tnstc_destinations.add(bus.get('destination', ''))

# Check MTC unique locations
mtc_data = json.load(open('data/mtc_bus_timings_merged.json'))
mtc_origins = set()
mtc_destinations = set()

for bus in mtc_data:
    mtc_origins.add(bus.get('origin_name', ''))
    mtc_destinations.add(bus.get('destination_name', ''))

print("TNSTC Sample Origins (first 10):")
for loc in sorted(tnstc_origins)[:10]:
    print(f"  • {loc}")

print("\nTNSTC Sample Destinations (first 10):")
for loc in sorted(tnstc_destinations)[:10]:
    print(f"  • {loc}")

print(f"\nTNSTC Total unique origins: {len(tnstc_origins)}")
print(f"TNSTC Total unique destinations: {len(tnstc_destinations)}")

print("\n" + "="*50)
print("\nMTC Sample Origins (first 10):")
for loc in sorted(mtc_origins)[:10]:
    print(f"  • {loc}")

print("\nMTC Sample Destinations (first 10):")
for loc in sorted(mtc_destinations)[:10]:
    print(f"  • {loc}")

print(f"\nMTC Total unique origins: {len(mtc_origins)}")
print(f"MTC Total unique destinations: {len(mtc_destinations)}")

# Check Kilambakkam variations
print("\n" + "="*50)
print("\nLocation Name Variations:")
print("\nTNSTC locations containing 'KILAMBAKKAM':")
for loc in sorted(tnstc_origins | tnstc_destinations):
    if 'KILAMBAKKAM' in loc.upper():
        print(f"  • {loc}")

print("\nMTC locations containing 'KILAMBAKKAM':")
for loc in sorted(mtc_origins | mtc_destinations):
    if 'KILAMBAKKAM' in loc.upper():
        print(f"  • {loc}")

print("\nTNSTC locations containing 'MADURAI':")
for loc in sorted(tnstc_origins | tnstc_destinations):
    if 'MADURAI' in loc.upper():
        print(f"  • {loc}")

print("\nMTC locations containing 'MADURAI':")
for loc in sorted(mtc_origins | mtc_destinations):
    if 'MADURAI' in loc.upper():
        print(f"  • {loc}")

# Analyze stops in TNSTC to find variations
print("\n" + "="*50)
print("\nTNSTC Stop Locations (unique from 'stops' field):")
tnstc_stops = set()
for bus in tnstc_data['routes'][:1000]:  # Sample first 1000
    stops = bus.get('stops', [])
    for stop in stops:
        city = stop.get('city', '')
        if city:
            tnstc_stops.add(city)

print(f"Found {len(tnstc_stops)} unique stop locations in sample:")
for loc in sorted(tnstc_stops):
    if 'KILAMBAKKAM' in loc.upper() or 'MADURAI' in loc.upper() or 'BROADWAY' in loc.upper():
        print(f"  • {loc}")
