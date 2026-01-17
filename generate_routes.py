#!/usr/bin/env python3
import json

# Load cities
with open('data/tamilvandi_cities.json', 'r') as f:
    data = json.load(f)
    cities = data['cities']

# Normalize cities (remove duplicates with different cases)
normalized = {}
for city in cities:
    key = city.upper()
    if key not in normalized:
        normalized[key] = city

unique_cities = list(normalized.values())
unique_cities.sort()

print(f"Total unique cities: {len(unique_cities)}")

# Generate all combinations (both directions)
route_pairs = []
for from_city in unique_cities:
    for to_city in unique_cities:
        if from_city != to_city:
            route_pairs.append(f"{from_city},{to_city}")

print(f"Total route pairs: {len(route_pairs)}")

# Save to file
with open('tamilvandi_all_routes.txt', 'w') as f:
    f.write("# Tamil Vandi All Route Pairs (Auto-generated)\n")
    f.write(f"# Generated from {len(unique_cities)} unique cities\n")
    f.write(f"# Total pairs: {len(route_pairs)}\n\n")
    for pair in route_pairs:
        f.write(f"{pair}\n")

print(f"\n✅ Saved to tamilvandi_all_routes.txt")
print(f"\nFirst 10 route pairs:")
for i, pair in enumerate(route_pairs[:10], 1):
    print(f"  {i}. {pair}")
