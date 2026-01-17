#!/usr/bin/env python3
"""Analyze Tamil Vandi scraper status"""

import json
import glob
from pathlib import Path
from collections import defaultdict

# Analyze all Tamil Vandi scrapes
data_dir = Path('data/tamilvandi_all')
json_files = sorted(glob.glob(str(data_dir / '*.json')))

routes_with_data = []
routes_empty = []
routes_error = []
total_buses = 0

for f in json_files:
    try:
        with open(f) as jf:
            data = json.load(jf)
            
            route_name = Path(f).stem
            
            if isinstance(data, dict) and 'routes' in data:
                route_count = len(data.get('routes', []))
                total_buses += route_count
                if route_count > 0:
                    routes_with_data.append((route_name, route_count))
                else:
                    routes_empty.append(route_name)
            else:
                routes_error.append(route_name)
    except Exception as e:
        routes_error.append(f"{Path(f).stem}")

print("=" * 70)
print("TAMIL VANDI SCRAPER STATUS REPORT")
print("=" * 70)
print()

print(f"📊 Total routes attempted: {len(json_files)}")
print(f"✅ Routes with bus data: {len(routes_with_data)}")
print(f"⚠️  Routes with NO data: {len(routes_empty)}")
print(f"❌ Routes with errors: {len(routes_error)}")
print(f"🚌 Total buses collected: {total_buses}")
print()

if routes_with_data:
    print("✅ SUCCESSFUL ROUTES (showing first 15):")
    for route, count in routes_with_data[:15]:
        print(f"   • {route}: {count:3d} buses")
    if len(routes_with_data) > 15:
        print(f"   ... and {len(routes_with_data) - 15} more successful routes")
print()

if routes_empty:
    print(f"⚠️  ROUTES NEEDING RETRY (NO BUSES FOUND):")
    for route in routes_empty[:20]:
        print(f"   • {route}")
    if len(routes_empty) > 20:
        print(f"   ... and {len(routes_empty) - 20} more")
print()

print("=" * 70)
print("NEXT STEPS:")
print("=" * 70)
print(f"1. Retry {len(routes_empty)} empty routes with different approaches")
print(f"2. Verify {total_buses} buses collected are valid")
print(f"3. Consolidate all scraped data into single database/file")
print()
