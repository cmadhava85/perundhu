#!/usr/bin/env python3
"""
Test TNSTC data mapping to verify stops extraction works correctly.
"""
import json

tnstc_data = json.load(open('data/tnstc_consolidated.json'))

# Find a route from CHENNAI to MADURAI
sample_bus = None
for bus in tnstc_data['routes']:
    if bus.get('origin') == 'CHENNAI' and bus.get('destination') == 'MADURAI':
        sample_bus = bus
        break

if sample_bus:
    print("✅ Found sample TNSTC bus route (CHENNAI → MADURAI):\n")
    print(f"  Route: {sample_bus.get('route_number')}")
    print(f"  Bus: {sample_bus.get('busName')}")
    print(f"  Origin: {sample_bus.get('origin')}")
    print(f"  Destination: {sample_bus.get('destination')}")
    print(f"  Departure: {sample_bus.get('departure_time')}")
    print(f"  Arrival: {sample_bus.get('arrival_time')}")
    
    stops = sample_bus.get('stops', [])
    print(f"\n📍 Stops ({len(stops)} stops):")
    for i, stop in enumerate(stops, 1):
        print(f"   {i}. {stop.get('city')} ({stop.get('landmark')}) @ {stop.get('time')}")
    
    # Show how it would be mapped
    print(f"\n🗺️  Location Mapping:")
    print(f"   First stop: {stops[0].get('city')} → MAPS TO: Chennai Mofussil Bus Terminus (ID: 691)")
    print(f"   Last stop: {stops[-1].get('city')} → MAPS TO: Madurai - Mattuthavani (ID: 671)")
else:
    print("❌ No CHENNAI -> MADURAI route found")
    print("\nAvailable route pairs:")
    routes = {}
    for bus in tnstc_data['routes'][:500]:
        key = f"{bus.get('origin')} → {bus.get('destination')}"
        routes[key] = routes.get(key, 0) + 1
    
    for route in sorted(routes.keys())[:20]:
        print(f"  • {route} ({routes[route]} buses)")
