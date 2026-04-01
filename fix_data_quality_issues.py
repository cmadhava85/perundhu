#!/usr/bin/env python3
"""
Fix data quality issues discovered in validation:
1. Remove locations actually in other states (Kerala, Karnataka, AP, Puducherry)
2. Standardize district names to official names
3. Fix "Unknown" districts using reverse geocoding
"""
import mysql.connector
import requests
import time
from typing import Dict, Optional

DB_CONFIG = {
    'host': 'localhost',
    'port': 3306,
    'user': 'root',
    'password': 'root',
    'database': 'perundhu',
    'charset': 'utf8mb4'
}

# Official Tamil Nadu district names (38 districts as of 2024)
DISTRICT_NORMALIZATION = {
    # Variations -> Official name
    'Trichy': 'Tiruchirappalli',
    'Kanniyakumari': 'Kanyakumari',
    'Thirupathur': 'Tirupathur',
    'Thiruvannamalai': 'Tiruvannamalai',
    'Villupuram': 'Viluppuram',
    'Nellai': 'Tirunelveli',
    'Tuticorin': 'Thoothukudi',
    'Dharmapuri': 'Dharmapuri',
}


def verify_location_state_osm(lat: float, lon: float) -> Optional[str]:
    """Verify which state a location is actually in using OSM Nominatim"""
    url = 'https://nominatim.openstreetmap.org/reverse'
    params = {
        'lat': lat,
        'lon': lon,
        'format': 'json',
        'addressdetails': 1
    }
    
    try:
        time.sleep(1.1)  # Rate limiting - 1 req/sec
        response = requests.get(url, params=params, timeout=10)
        data = response.json()
        
        if 'address' in data:
            return data['address'].get('state', '')
        return None
    except Exception as e:
        print(f"  ⚠️  Error: {e}")
        return None


def fix_district_names(dry_run=True):
    """Standardize district names to official Tamil Nadu districts"""
    print("\n" + "=" * 80)
    print("FIXING DISTRICT NAMES")
    print("=" * 80)
    
    conn = mysql.connector.connect(**DB_CONFIG)
    cursor = conn.cursor()
    
    for old_name, official_name in DISTRICT_NORMALIZATION.items():
        cursor.execute("SELECT COUNT(*) FROM locations WHERE district = %s", (old_name,))
        count = cursor.fetchone()[0]
        
        if count > 0:
            print(f"  '{old_name}' -> '{official_name}' ({count} locations)")
            
            if not dry_run:
                cursor.execute(
                    "UPDATE locations SET district = %s WHERE district = %s",
                    (official_name, old_name)
                )
    
    if not dry_run:
        conn.commit()
        print("\n  ✅ District names standardized")
    else:
        print("\n  🔍 DRY RUN - No changes made")
    
    cursor.close()
    conn.close()


def remove_non_tn_locations(dry_run=True):
    """Remove locations that are actually in other states"""
    print("\n" + "=" * 80)
    print("REMOVING NON-TAMIL NADU LOCATIONS")
    print("=" * 80)
    
    conn = mysql.connector.connect(**DB_CONFIG)
    cursor = conn.cursor()
    
    # Get all unique locations (avoid duplicates in verification)
    cursor.execute("""
        SELECT DISTINCT latitude, longitude
        FROM locations
        WHERE state = 'Tamil Nadu'
    """)
    
    unique_coords = cursor.fetchall()
    print(f"\n  Total unique coordinates to verify: {len(unique_coords)}")
    print("  ⚠️  This will take a while due to rate limiting (1 req/sec)")
    print("  💡 Press Ctrl+C to skip this step\n")
    
    non_tn_count = 0
    to_remove = []
    
    try:
        for i, (lat, lon) in enumerate(unique_coords[:100]):  # Limit to 100 samples
            if i % 10 == 0:
                print(f"  Verified {i}/{min(100, len(unique_coords))}...")
            
            state = verify_location_state_osm(lat, lon)
            
            if state and 'Tamil Nadu' not in state:
                print(f"  ❌ Found non-TN location: {state} at ({lat}, {lon})")
                to_remove.append((lat, lon))
                non_tn_count += 1
    
    except KeyboardInterrupt:
        print("\n  ⚠️  Verification interrupted by user")
    
    if to_remove and not dry_run:
        # Remove locations at these coordinates
        for lat, lon in to_remove:
            cursor.execute(
                "DELETE FROM locations WHERE latitude = %s AND longitude = %s",
                (lat, lon)
            )
        conn.commit()
        print(f"\n  ✅ Removed {len(to_remove)} non-TN locations")
    elif to_remove:
        print(f"\n  🔍 DRY RUN - Would remove {len(to_remove)} locations")
    else:
        print("\n  ✅ No non-TN locations found in sample")
    
    cursor.close()
    conn.close()


def fix_unknown_districts(dry_run=True, limit=100):
    """Fix locations with district='Unknown' using reverse geocoding"""
    print("\n" + "=" * 80)
    print(f"FIXING UNKNOWN DISTRICTS (Limit: {limit})")
    print("=" * 80)
    
    conn = mysql.connector.connect(**DB_CONFIG)
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT id, name, latitude, longitude
        FROM locations
        WHERE (district IS NULL OR district = 'Unknown')
        AND state = 'Tamil Nadu'
        LIMIT %s
    """, (limit,))
    
    unknown_locations = cursor.fetchall()
    print(f"\n  Found {len(unknown_locations)} locations with unknown districts")
    
    if not unknown_locations:
        print("  ✅ No unknown districts to fix!")
        cursor.close()
        conn.close()
        return
    
    print("  💡 This will take time due to rate limiting...\n")
    
    fixed_count = 0
    
    try:
        for i, (loc_id, name, lat, lon) in enumerate(unknown_locations):
            if i % 10 == 0:
                print(f"  Processed {i}/{len(unknown_locations)}...")
            
            # Get district from OSM
            url = 'https://nominatim.openstreetmap.org/reverse'
            params = {
                'lat': lat,
                'lon': lon,
                'format': 'json',
                'addressdetails': 1
            }
            
            time.sleep(1.1)  # Rate limiting
            
            try:
                response = requests.get(url, params=params, timeout=10)
                data = response.json()
                
                if 'address' in data:
                    district = data['address'].get('county', '') or data['address'].get('state_district', '')
                    
                    # Clean district name
                    if district:
                        district = district.replace(' district', '').replace(' District', '').strip()
                        
                        # Normalize if needed
                        district = DISTRICT_NORMALIZATION.get(district, district)
                        
                        if district and not dry_run:
                            cursor.execute(
                                "UPDATE locations SET district = %s WHERE id = %s",
                                (district, loc_id)
                            )
                            fixed_count += 1
                        elif district:
                            print(f"  Would update: {name} -> {district}")
                            fixed_count += 1
            
            except Exception as e:
                print(f"  ⚠️  Error for {name}: {e}")
                continue
    
    except KeyboardInterrupt:
        print("\n  ⚠️  Process interrupted by user")
    
    if not dry_run and fixed_count > 0:
        conn.commit()
        print(f"\n  ✅ Fixed {fixed_count} unknown districts")
    elif fixed_count > 0:
        print(f"\n  🔍 DRY RUN - Would fix {fixed_count} districts")
    
    cursor.close()
    conn.close()


def main():
    import argparse
    
    parser = argparse.ArgumentParser(description='Fix data quality issues')
    parser.add_argument('--execute', action='store_true', help='Execute fixes (default is dry-run)')
    parser.add_argument('--districts-only', action='store_true', help='Only fix district names')
    parser.add_argument('--limit', type=int, default=100, help='Limit for unknown district fixes')
    
    args = parser.parse_args()
    
    print("=" * 80)
    print(f"DATA QUALITY FIX - {'EXECUTING' if args.execute else 'DRY RUN'}")
    print("=" * 80)
    
    # Step 1: Fix district names (fast, no API calls)
    fix_district_names(dry_run=not args.execute)
    
    if not args.districts_only:
        # Step 2: Remove non-TN locations (slow, requires API)
        # remove_non_tn_locations(dry_run=not args.execute)
        
        # Step 3: Fix unknown districts (slow, requires API)
        fix_unknown_districts(dry_run=not args.execute, limit=args.limit)
    
    print("\n" + "=" * 80)
    print("COMPLETE")
    print("=" * 80)


if __name__ == '__main__':
    main()
