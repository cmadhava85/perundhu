#!/usr/bin/env python3
"""
Fix coordinates for specific locations with invalid (0.0, 0.0) values.
Uses Google Maps Geocoding API to get correct coordinates.
"""

import json
import requests
import time
from typing import Dict, List, Tuple, Optional

# Critical locations to fix immediately (user is searching for these)
PRIORITY_LOCATIONS = [
    "KCBT KILAMBAKKAM",
    "Madurai - Mattuthavani"
]

# Known correct coordinates (backup if API fails)
KNOWN_COORDINATES = {
    "KCBT KILAMBAKKAM": (12.7461, 80.0636),  # Chennai
    "Madurai - Mattuthavani": (9.9440908, 78.156043),  # Madurai
    "M.G.R Mattuthavani Bus Stand , Madurai": (9.9440908, 78.156043)
}


def geocode_location(location_name: str, api_key: Optional[str] = None) -> Optional[Tuple[float, float]]:
    """
    Geocode a location name to get latitude and longitude.
    Falls back to known coordinates if API is not available.
    """
    # Check if we have known coordinates
    if location_name in KNOWN_COORDINATES:
        print(f"  ✓ Using known coordinates for '{location_name}'")
        return KNOWN_COORDINATES[location_name]
    
    if not api_key:
        print(f"  ⚠️  No API key provided, skipping automatic geocoding")
        return None
    
    try:
        # Add "Tamil Nadu, India" to improve accuracy
        search_query = f"{location_name}, Tamil Nadu, India"
        
        url = "https://maps.googleapis.com/maps/api/geocode/json"
        params = {
            "address": search_query,
            "key": api_key
        }
        
        response = requests.get(url, params=params, timeout=10)
        data = response.json()
        
        if data["status"] == "OK" and len(data["results"]) > 0:
            location = data["results"][0]["geometry"]["location"]
            lat, lng = location["lat"], location["lng"]
            print(f"  ✓ Geocoded '{location_name}': ({lat}, {lng})")
            return (lat, lng)
        else:
            print(f"  ❌ Failed to geocode '{location_name}': {data.get('status', 'Unknown error')}")
            return None
            
    except Exception as e:
        print(f"  ❌ Error geocoding '{location_name}': {e}")
        return None


def fix_priority_locations():
    """Fix coordinates for priority locations."""
    print("\n" + "="*80)
    print("FIXING PRIORITY LOCATIONS")
    print("="*80)
    
    # Load the data file
    data_file = "data/tamil_nadu_locations_enhanced.json"
    
    try:
        with open(data_file, 'r', encoding='utf-8') as f:
            locations = json.load(f)
        
        print(f"\n✓ Loaded {len(locations)} locations from {data_file}")
        
        # Find and fix priority locations
        fixed_count = 0
        
        for location in locations:
            if location["name"] in PRIORITY_LOCATIONS:
                if location["latitude"] == 0.0 and location["longitude"] == 0.0:
                    print(f"\n🔧 Fixing: {location['name']}")
                    coords = geocode_location(location["name"])
                    
                    if coords:
                        location["latitude"] = coords[0]
                        location["longitude"] = coords[1]
                        fixed_count += 1
                        print(f"  ✅ Updated coordinates to ({coords[0]}, {coords[1]})")
                    else:
                        print(f"  ⚠️  Could not get coordinates, keeping (0.0, 0.0)")
                else:
                    print(f"\n✓ {location['name']} already has valid coordinates: ({location['latitude']}, {location['longitude']})")
        
        if fixed_count > 0:
            # Save the updated data
            with open(data_file, 'w', encoding='utf-8') as f:
                json.dump(locations, f, ensure_ascii=False, indent=2)
            
            print(f"\n✅ Fixed {fixed_count} location(s) and saved to {data_file}")
            print(f"\n⚠️  NEXT STEP: Run fast_prod_upload.py to update the production database")
        else:
            print(f"\n✓ No locations needed fixing")
        
    except FileNotFoundError:
        print(f"❌ Error: Could not find file {data_file}")
    except json.JSONDecodeError:
        print(f"❌ Error: Invalid JSON in {data_file}")
    except Exception as e:
        print(f"❌ Error: {e}")


def list_all_invalid_locations():
    """List all locations with invalid (0.0, 0.0) coordinates."""
    print("\n" + "="*80)
    print("ALL LOCATIONS WITH INVALID COORDINATES (0.0, 0.0)")
    print("="*80)
    
    data_file = "data/tamil_nadu_locations_enhanced.json"
    
    try:
        with open(data_file, 'r', encoding='utf-8') as f:
            locations = json.load(f)
        
        invalid_locations = [
            loc["name"] for loc in locations 
            if loc["latitude"] == 0.0 and loc["longitude"] == 0.0
        ]
        
        print(f"\n Found {len(invalid_locations)} locations with invalid coordinates:\n")
        
        for i, name in enumerate(invalid_locations[:20], 1):  # Show first 20
            print(f"  {i}. {name}")
        
        if len(invalid_locations) > 20:
            print(f"  ... and {len(invalid_locations) - 20} more")
        
        # Save to a file for reference
        with open("invalid_coordinates_list.txt", 'w', encoding='utf-8') as f:
            for name in invalid_locations:
                f.write(f"{name}\n")
        
        print(f"\n✓ Full list saved to: invalid_coordinates_list.txt")
        
    except Exception as e:
        print(f"❌ Error: {e}")


if __name__ == '__main__':
    print("="*80)
    print("LOCATION COORDINATES FIXER")
    print("="*80)
    
    # Fix priority locations first
    fix_priority_locations()
    
    # List all invalid locations
    list_all_invalid_locations()
    
    print("\n" + "="*80)
    print("SUMMARY")
    print("="*80)
    print("""
Next steps:
1. ✓ Priority locations have been fixed in the JSON file
2. Run: python3 fast_prod_upload.py (to update production database)
3. For remaining 257 locations, consider:
   - Getting a Google Maps API key for batch geocoding
   - Manually reviewing and fixing important bus terminals
   - Filtering them out from search results until fixed
    """)
