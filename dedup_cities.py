#!/usr/bin/env python3
"""Deduplicate TNSTC city list by extracting base city names"""

# Load current list
with open("scripts/tnstc_sources.txt", "r") as f:
    cities = [line.strip() for line in f if line.strip()]

# Extract base city names (first word or before hyphen/space)
base_cities = set()
for city in cities:
    # Take first word or everything before hyphen
    base = city.split()[0].split('-')[0].strip()
    if base and base not in ["BR", "BS", "X", "A"]:  # filter out garbage
        base_cities.add(base)

dedup_sorted = sorted(base_cities)
print(f"Original: {len(cities)}, Deduplicated: {len(dedup_sorted)}")
print("\nDeduplicated base cities (first 30):")
for city in dedup_sorted[:30]:
    print(city)

# Save to new file
with open("scripts/tnstc_sources_dedup.txt", "w") as f:
    f.write("\n".join(dedup_sorted))

with open("scripts/tnstc_destinations_dedup.txt", "w") as f:
    f.write("\n".join(dedup_sorted))

print(f"\nSaved {len(dedup_sorted)} cities to tnstc_sources_dedup.txt and tnstc_destinations_dedup.txt")
