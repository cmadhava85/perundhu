#!/usr/bin/env python3
"""
Cleanup Interstate Locations Script
Removes unnecessary locations from other states while keeping major interstate destinations
"""
import mysql.connector
import sys
from datetime import datetime

# Database connection config
DB_CONFIG = {
    'host': 'localhost',
    'port': 3306,
    'user': 'root',
    'password': 'root',
    'database': 'perundhu',
    'charset': 'utf8mb4'
}

# Major interstate destinations to KEEP (commonly served by TNSTC/MTC buses)
KEEP_INTERSTATE_CITIES = {
    # Kerala - Major cities with regular interstate service
    'Kochi', 'Cochin', 'Ernakulam',
    'Thiruvananthapuram', 'Trivandrum',
    'Kozhikode', 'Calicut',
    'Thrissur', 'Trichur',
    'Kannur', 'Palakkad', 'Palghat',
    'Kollam',
    
    # Karnataka - Major cities with interstate service
    'Bangalore', 'Bengaluru',
    'Mysore', 'Mysuru',
    'Hosur',  # Border town, important
    'Mandya',
    
    # Andhra Pradesh - Pilgrimage and border towns
    'Tirupati', 'Tirupathi',
    'Nellore',
    'Chittoor',
    'Vijayawada',
    'Visakhapatnam', 'Vizag',
    
    # Puducherry - Enclave within TN, important
    'Puducherry', 'Pondicherry',
    'Karaikal',
    'Mahe', 'Yanam',
    
    # Other important interstate destinations
    'Hyderabad',
    'Mumbai',
}

# Keywords that indicate KSRTC bus stands (keep if in border areas)
BUS_STAND_KEYWORDS = [
    'bus stand', 'bus station', 'ksrtc', 'transport corporation',
    'depot', 'terminus', 'bus terminal'
]


def is_major_interstate_city(name: str) -> bool:
    """Check if location is a major interstate city we want to keep"""
    name_upper = name.upper()
    for city in KEEP_INTERSTATE_CITIES:
        if city.upper() in name_upper:
            return True
    return False


def is_bus_stand(name: str) -> bool:
    """Check if location is a bus stand (might be important for connections)"""
    name_lower = name.lower()
    return any(keyword in name_lower for keyword in BUS_STAND_KEYWORDS)


def analyze_locations(cursor):
    """Analyze locations to identify what should be kept vs removed"""
    print("\n" + "=" * 80)
    print("ANALYZING INTERSTATE LOCATIONS")
    print("=" * 80 + "\n")
    
    # Get all non-Tamil Nadu locations
    cursor.execute("""
        SELECT id, name, state, district, latitude, longitude
        FROM locations
        WHERE state != 'Tamil Nadu' OR state IS NULL
        ORDER BY name
    """)
    
    all_non_tn = cursor.fetchall()
    
    # Get locations that might be from other states (by name pattern)
    cursor.execute("""
        SELECT id, name, state, district, latitude, longitude
        FROM locations
        WHERE (
            name LIKE '%Kerala%' OR 
            name LIKE '%Karnataka%' OR 
            name LIKE '%Andhra%' OR
            name LIKE '%KSRTC%' OR
            name LIKE '%Kochi%' OR
            name LIKE '%Bangalore%' OR
            name LIKE '%Bengaluru%' OR
            name LIKE '%Mysore%' OR
            name LIKE '%Hyderabad%' OR
            name LIKE '%Tirupati%'
        )
        AND state = 'Tamil Nadu'
        ORDER BY name
    """)
    
    suspected_other_states = cursor.fetchall()
    
    # Categorize locations
    to_keep = []
    to_remove = []
    uncertain = []
    
    for loc in suspected_other_states:
        loc_id, name, state, district, lat, lon = loc
        
        if is_major_interstate_city(name):
            to_keep.append(loc)
        elif is_bus_stand(name) and any(kw in name.lower() for kw in ['kerala', 'ksrtc', 'karnataka']):
            # Keep interstate bus stands (connection points)
            to_keep.append(loc)
        else:
            # Small locations with state names - likely incorrectly labeled
            to_remove.append(loc)
    
    # Print analysis
    print(f"📊 Total locations in database: {cursor.rowcount}")
    print(f"📊 Suspected interstate locations: {len(suspected_other_states)}")
    print(f"✅ To KEEP (major cities/bus stands): {len(to_keep)}")
    print(f"❌ To REMOVE (small/irrelevant): {len(to_remove)}")
    print()
    
    # Show what will be kept
    if to_keep:
        print("\n✅ LOCATIONS TO KEEP (Major interstate destinations):")
        print("-" * 80)
        for loc in to_keep:
            loc_id, name, state, district, lat, lon = loc
            print(f"  ID {loc_id:6d} | {name:60s} | {district or 'Unknown'}")
    
    # Show what will be removed
    if to_remove:
        print("\n❌ LOCATIONS TO REMOVE:")
        print("-" * 80)
        for loc in to_remove:
            loc_id, name, state, district, lat, lon = loc
            print(f"  ID {loc_id:6d} | {name:60s} | {district or 'Unknown'}")
    
    return to_keep, to_remove


def cleanup_locations(dry_run=True):
    """Cleanup interstate locations"""
    
    print("\n" + "=" * 80)
    print(f"INTERSTATE LOCATIONS CLEANUP - {'DRY RUN' if dry_run else 'EXECUTING'}")
    print("=" * 80)
    print()
    
    try:
        # Connect to database
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor()
        
        # Analyze locations
        to_keep, to_remove = analyze_locations(cursor)
        
        if not to_remove:
            print("\n✅ No locations to remove - database is clean!")
            cursor.close()
            conn.close()
            return
        
        print("\n" + "=" * 80)
        print("SUMMARY")
        print("=" * 80)
        print(f"Locations to keep:   {len(to_keep)}")
        print(f"Locations to remove: {len(to_remove)}")
        print()
        
        if dry_run:
            print("🔍 DRY RUN MODE - No changes will be made")
            print("    Run with --execute flag to apply changes")
            print()
        else:
            print("⚠️  EXECUTING - This will DELETE locations from the database!")
            print()
            response = input("Are you sure you want to proceed? (yes/no): ")
            if response.lower() != 'yes':
                print("\n❌ Aborted - No changes made")
                cursor.close()
                conn.close()
                return
            
            # Delete locations
            print("\n🗑️  Deleting locations...")
            deleted_count = 0
            
            for loc in to_remove:
                loc_id, name, _, _, _, _ = loc
                
                # Check if location is used by any routes/stops
                cursor.execute("SELECT COUNT(*) FROM stops WHERE location_id = %s", (loc_id,))
                stop_count = cursor.fetchone()[0]
                
                if stop_count > 0:
                    print(f"⚠️  Skipping {name} - used by {stop_count} stops")
                    continue
                
                # Also delete any translations for this location
                cursor.execute("DELETE FROM translations WHERE entity_type = 'location' AND entity_id = %s", (loc_id,))
                
                # Delete the location
                cursor.execute("DELETE FROM locations WHERE id = %s", (loc_id,))
                deleted_count += 1
                print(f"✅ Deleted: {name}")
            
            # Commit changes
            conn.commit()
            
            print("\n" + "=" * 80)
            print(f"✅ Cleanup complete! Deleted {deleted_count} locations")
            print("=" * 80)
        
        cursor.close()
        conn.close()
        
    except mysql.connector.Error as e:
        print(f"\n❌ Database Error: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


def main():
    import argparse
    
    parser = argparse.ArgumentParser(
        description='Cleanup interstate locations from database',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Preview what will be removed (safe - no changes)
  python3 cleanup_interstate_locations.py
  
  # Execute the cleanup (will prompt for confirmation)
  python3 cleanup_interstate_locations.py --execute
        """
    )
    
    parser.add_argument('--execute', action='store_true',
                        help='Execute cleanup (default is dry-run)')
    
    args = parser.parse_args()
    
    cleanup_locations(dry_run=not args.execute)


if __name__ == '__main__':
    main()
