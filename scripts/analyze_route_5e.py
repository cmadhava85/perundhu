#!/usr/bin/env python3
"""Analyze Route 5E data from MTC scraper results"""

import json
from collections import defaultdict

# Load the data
print("Loading data...")
with open('data/mtc_bus_timings.json', 'r') as f:
    data = json.load(f)

# Filter route 5E
route_5e = [r for r in data if r.get('route_number') == '5E']

print(f'\n=== Route 5E Analysis ===')
print(f'Total 5E entries: {len(route_5e)}')
print()

# Get unique origin-destination pairs
od_pairs = defaultdict(int)
for r in route_5e:
    origin = r.get('origin_value', 'N/A')
    destination = r.get('destination_value', 'N/A')
    pair = f"{origin} → {destination}"
    od_pairs[pair] += 1

print('Unique Origin-Destination pairs for route 5E:')
for pair in sorted(od_pairs.keys()):
    print(f'  {pair}: {od_pairs[pair]} timings')

print()
print('Sample entries (first 10):')
for i, r in enumerate(route_5e[:10]):
    print(f"{i+1}. {r.get('origin_value')} → {r.get('destination_value')} at {r.get('timing')}")

print()
print('Checking if VADAPALANI B.S → BROADWAY exists...')
vadapalani_broadway = [r for r in route_5e if 
                       r.get('origin_value') == 'VADAPALANI B.S' and 
                       r.get('destination_value') == 'BROADWAY']
print(f'Found {len(vadapalani_broadway)} entries for VADAPALANI B.S → BROADWAY')

if vadapalani_broadway:
    print('\nSample VADAPALANI → BROADWAY entries:')
    for r in vadapalani_broadway[:5]:
        print(f"  {r}")
