#!/usr/bin/env python3
import json
from collections import defaultdict

with open('/Users/mchand69/Documents/perundhu/data/tamil_nadu_locations_enhanced.json', 'r') as f:
    locations = json.load(f)

districts = defaultdict(int)
for loc in locations:
    districts[loc.get('district', 'Unknown')] += 1

print("=" * 70)
print("📊 DISTRICT DISTRIBUTION - 41,116 Locations Enhanced")
print("=" * 70)
print()

for district, count in sorted(districts.items(), key=lambda x: x[1], reverse=True):
    pct = (count / len(locations)) * 100
    print(f"{district:20} {count:6,}  ({pct:5.1f}%)")

print()
print(f"Total: {len(locations):,} locations across {len(districts)} districts/states")
