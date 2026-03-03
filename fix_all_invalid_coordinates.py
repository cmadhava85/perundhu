#!/usr/bin/env python3
"""
Fix coordinates for ALL locations with invalid (0.0, 0.0) values.
Uses Google Maps Geocoding API to get correct coordinates.
"""

import json
import requests
import time
from typing import Dict, List, Tuple, Optional
import sys

# Read API key from command line or use None
GOOGLE_MAPS_API_KEY = sys.argv[1] if len(sys.argv) > 1 else None

# Rate limiting
REQUESTS_PER_SECOND = 50  # Google's default QPS limit
DELAY_BETWEEN_REQUESTS = 1.0 / REQUESTS_PER_SECOND  # 0.02 seconds


def geocode_location(location_name: str, api_key: str) -> Optional[Tuple[float, float]]:
    """
    Geocode a location name to get latitude and longitude.
    """
    try:
        # Add "Tamil Nadu, India" to improve accuracy
        search_query = f"{location_name}, Tamil Nadu, India"
        
        url = "https://maps.googleapis.com/maps/api/geocode/json"
        params = {
            "address": search_query,
            "key": api_key,
            "region": "in"  # Bias results to India
        }
        
        response = requests.get(url, params=params, timeout=10)
        data = response.json()
        
        if data["status"] == "OK" and len(data["results"]) > 0:
            location = data["results"][0]["geometry"]["location"]
            lat, lng = location["lat"], location["lng"]
            
            # Validate coordinates are reasonable for Tamil Nadu
            if 8.0 <= lat <= 14.0 and 76.0 <= lng <= 81.0:
                return (lat, lng)
            else:
                print(f"    ⚠️  Coordinates outside Tamil Nadu bounds: ({lat}, {lng})")
                return None
        else:
            status = data.get('status', 'Unknown')
            if status == "ZERO_RESULTS":
                print(f"    ❌ No results found")
            elif status == "OVER_QUERY_LIMIT":
                print(f"    ❌ API quota exceeded")
                return None
            else:
                print(f"    ❌ Geocoding failed: {status}")
            return None
            
    except Exception as e:
        print(f"    ❌ Error: {e}")
        return None


def fix_all_invalid_locations():
    """Fix coordinates for all locations with (0.0, 0.0)."""
    
    if not GOOGLE_MAPS_API_KEY:
        print("\n" + "="*80)
        print("ERROR: Google Maps API Key Required")
        print("="*80)
        print("\nUsage: python3 fix_all_invalid_coordinates.py YOUR_API_KEY")
        print("\nTo get an API key:")
        print("1. Go to: https://console.cloud.google.com/google/maps-apis")
        print("2. Enable 'Geocoding API'")
        print("3. Create credentials (API Key)")
        print("4. Run: python3 fix_all_invalid_coordinates.py YOUR_API_KEY")
        print("\nNote: First 200 requests/month are free, then $5 per 1000 requests")
        return
    
    print("\n" + "="*80)
    print("FIXING ALL INVALID LOCATION COORDINATES")
    print("="*80)
    
    data_file = "data/tamil_nadu_locations_enhanced.json"
    backup_file = "data/tamil_nadu_locations_enhanced.backup.json"
    
    try:
        # Load the data file
        with open(data_file, 'r', encoding='utf-8') as f:
            locations = json.load(f)
        
        print(f"\n✓ Loaded {len(locations)} locations from {data_file}")
        
        # Create backup
        with open(backup_file, 'w', encoding='utf-8') as f:
            json.dump(locations, f, ensure_ascii=False, indent=2)
        print(f"✓ Backup created: {backup_file}")
        
        # Find all invalid locations
        invalid_locations = [
            (i, loc) for i, loc in enumerate(locations)
            if abs(loc["latitude"]) < 0.01 and abs(loc["longitude"]) < 0.01
        ]
        
        total_invalid = len(invalid_locations)
        print(f"\n📍 Found {total_invalid} locations with invalid coordinates")
        print(f"⏱️  Estimated time: ~{total_invalid * DELAY_BETWEEN_REQUESTS:.1f} seconds")
        
        if total_invalid == 0:
            print("\n✓ All locations already have valid coordinates!")
            return
        
        # Ask for confirmation
        print(f"\n⚠️  This will use ~{total_invalid} API calls (Cost: ~${total_invalid * 0.005:.2f})")
        response = input("\nProceed? (yes/no): ").strip().lower()
        
        if response not in ['yes', 'y']:
            print("\n❌ Cancelled by user")
            return
        
        print("\n" + "="*80)
        print("GEOCODING LOCATIONS")
        print("="*80)
        
        fixed_count = 0
        failed_count = 0
        skipped_count = 0
        
        for idx, (i, location) in enumerate(invalid_locations, 1):
            name = location["name"]
            print(f"\n[{idx}/{total_invalid}] Processing: {name}")
            
            # Skip if it already has valid coordinates (might have been fixed in previous run)
            if not (abs(location["latitude"]) < 0.01 and abs(location["longitude"]) < 0.01):
                print(f"  ✓ Already fixed: ({location['latitude']}, {location['longitude']})")
                skipped_count += 1
                continue
            
            coords = geocode_location(name, GOOGLE_MAPS_API_KEY)
            
            if coords:
                locations[i]["latitude"] = coords[0]
                locations[i]["longitude"] = coords[1]
                fixed_count += 1
                print(f"  ✅ Fixed: ({coords[0]:.6f}, {coords[1]:.6f})")
                
                # Save progress every 10 locations
                if fixed_count % 10 == 0:
                    with open(data_file, 'w', encoding='utf-8') as f:
                        json.dump(locations, f, ensure_ascii=False, indent=2)
                    print(f"  💾 Progress saved ({fixed_count} fixed so far)")
            else:
                failed_count += 1
                print(f"  ❌ Failed to geocode")
            
            # Rate limiting
            if idx < total_invalid:  # Don't sleep after last request
                time.sleep(DELAY_BETWEEN_REQUESTS)
        
        # Final save
        with open(data_file, 'w', encoding='utf-8') as f:
            json.dump(locations, f, ensure_ascii=False, indent=2)
        
        print("\n" + "="*80)
        print("SUMMARY")
        print("="*80)
        print(f"\n  ✅ Fixed:   {fixed_count}")
        print(f"  ❌ Failed:  {failed_count}")
        print(f"  ⏭️  Skipped: {skipped_count}")
        print(f"  📁 Saved:   {data_file}")
        print(f"  💾 Backup:  {backup_file}")
        
        if fixed_count > 0:
            print("\n" + "="*80)
            print("NEXT STEPS")
            print("="*80)
            print("""
1. Review the changes:
   git diff data/tamil_nadu_locations_enhanced.json

2. Update production database:
   python3 fast_prod_upload.py --locations-only

3. Commit the changes:
   git add data/tamil_nadu_locations_enhanced.json
   git commit -m "fix: geocode all 257 locations with invalid coordinates"
   git push origin master
            """)
        
        # Save failed locations for manual review
        if failed_count > 0:
            failed_file = "failed_geocoding.txt"
            with open(failed_file, 'w', encoding='utf-8') as f:
                for i, loc in enumerate(locations):
                    if abs(loc["latitude"]) < 0.01 and abs(loc["longitude"]) < 0.01:
                        f.write(f"{loc['name']}\n")
            print(f"\n⚠️  Failed locations saved to: {failed_file}")
            print("   Consider fixing these manually or using a different search query")
        
    except FileNotFoundError:
        print(f"❌ Error: Could not find file {data_file}")
    except json.JSONDecodeError:
        print(f"❌ Error: Invalid JSON in {data_file}")
    except KeyboardInterrupt:
        print("\n\n❌ Interrupted by user")
        print(f"⚠️  Progress has been saved. You can re-run to continue from where you stopped.")
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()


if __name__ == '__main__':
    fix_all_invalid_locations()
