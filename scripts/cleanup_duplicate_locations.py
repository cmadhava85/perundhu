#!/usr/bin/env python3
"""Clean up duplicate locations while preserving foreign key references"""

import mysql.connector
import os
import sys
from typing import List, Tuple, Dict
import time

# Force unbuffered output
sys.stdout = open(sys.stdout.fileno(), mode='w', buffering=1)

def find_duplicates(cursor) -> List[Tuple]:
    """Find duplicate locations based on name and district"""
    print("🔍 Finding duplicate locations...")
    
    query = """
        SELECT name, district, COUNT(*) as count, GROUP_CONCAT(id ORDER BY id) as ids
        FROM locations
        WHERE name IS NOT NULL
        GROUP BY name, district
        HAVING count > 1
        ORDER BY count DESC
    """
    
    cursor.execute(query)
    duplicates = cursor.fetchall()
    
    print(f"✅ Found {len(duplicates)} groups of duplicates")
    return duplicates

def get_all_location_details(cursor) -> Dict[int, Dict]:
    """Pre-load all location details in bulk"""
    print("📋 Loading location details...")
    details_map = {}
    
    cursor.execute("SELECT id, latitude, longitude, priority, type, osm_id, created_at FROM locations")
    for row in cursor.fetchall():
        details_map[row[0]] = {
            'id': row[0],
            'latitude': row[1],
            'longitude': row[2],
            'priority': row[3] or 0,
            'type': row[4],
            'osm_id': row[5],
            'created_at': row[6]
        }
    
    print(f"✅ Loaded details for {len(details_map):,} locations")
    return details_map

def get_all_location_usage(cursor) -> Dict[int, Dict[str, int]]:
    """Pre-load all location usage counts in bulk"""
    print("📊 Loading location usage statistics...")
    usage_map = {}
    
    # Get all location ids
    cursor.execute("SELECT id FROM locations")
    all_ids = [row[0] for row in cursor.fetchall()]
    for loc_id in all_ids:
        usage_map[loc_id] = {'from_location': 0, 'to_location': 0, 'stops': 0, 'total': 0}
    
    # Count from_location usage
    cursor.execute("SELECT from_location_id, COUNT(*) FROM buses WHERE from_location_id IS NOT NULL GROUP BY from_location_id")
    for loc_id, count in cursor.fetchall():
        if loc_id in usage_map:
            usage_map[loc_id]['from_location'] = count
            usage_map[loc_id]['total'] += count
    
    # Count to_location usage
    cursor.execute("SELECT to_location_id, COUNT(*) FROM buses WHERE to_location_id IS NOT NULL GROUP BY to_location_id")
    for loc_id, count in cursor.fetchall():
        if loc_id in usage_map:
            usage_map[loc_id]['to_location'] = count
            usage_map[loc_id]['total'] += count
    
    # Count stops usage
    cursor.execute("SELECT location_id, COUNT(*) FROM stops WHERE location_id IS NOT NULL GROUP BY location_id")
    for loc_id, count in cursor.fetchall():
        if loc_id in usage_map:
            usage_map[loc_id]['stops'] = count
            usage_map[loc_id]['total'] += count
    
    print(f"✅ Loaded usage for {len(usage_map):,} locations")
    return usage_map

def pick_best_location(location_ids: List[int], details_map: Dict[int, Dict], usage_map: Dict[int, Dict[str, int]]) -> int:
    """Pick the best location to keep from duplicates"""
    locations = []
    
    for loc_id in location_ids:
        details = details_map.get(loc_id)
        if not details:
            continue
            
        usage = usage_map.get(loc_id, {'total': 0})
        locations.append({
            'id': details['id'],
            'latitude': details['latitude'],
            'longitude': details['longitude'],
            'priority': details['priority'],
            'type': details['type'],
            'osm_id': details['osm_id'],
            'created_at': details['created_at'],
            'usage': usage['total']
        })
    
    # Sort by: usage count (descending), then has coordinates, then priority, then lowest ID
    best = sorted(locations, key=lambda x: (
        -x['usage'],  # Most used first
        -(1 if x['latitude'] and x['longitude'] else 0),  # Has coordinates
        -x['priority'],  # Higher priority
        x['id']  # Lower ID as tiebreaker
    ))[0]
    
    return best['id']

def update_references(cursor, old_id: int, new_id: int) -> Dict[str, int]:
    """Update all references from old_id to new_id"""
    updates = {}
    
    # Update buses.from_location_id
    cursor.execute("""
        UPDATE buses SET from_location_id = %s 
        WHERE from_location_id = %s
    """, (new_id, old_id))
    updates['buses_from'] = cursor.rowcount
    
    # Update buses.to_location_id
    cursor.execute("""
        UPDATE buses SET to_location_id = %s 
        WHERE to_location_id = %s
    """, (new_id, old_id))
    updates['buses_to'] = cursor.rowcount
    
    # Update stops.location_id
    cursor.execute("""
        UPDATE stops SET location_id = %s 
        WHERE location_id = %s
    """, (new_id, old_id))
    updates['stops'] = cursor.rowcount
    
    updates['total'] = updates['buses_from'] + updates['buses_to'] + updates['stops']
    return updates

def cleanup_duplicates(db_config: dict, dry_run: bool = False):
    """Main cleanup function"""
    print(f"🔗 Connecting to {db_config['host']}:{db_config['port']}...")
    conn = mysql.connector.connect(**db_config)
    cursor = conn.cursor()
    
    print(f"✅ Connected to database: {db_config['database']}")
    
    if dry_run:
        print("\n⚠️  DRY RUN MODE - No changes will be made\n")
    
    # Get initial counts
    cursor.execute("SELECT COUNT(*) FROM locations")
    initial_count = cursor.fetchone()[0]
    print(f"📊 Initial location count: {initial_count:,}")
    
    # Pre-load location details and usage
    details_map = get_all_location_details(cursor)
    usage_map = get_all_location_usage(cursor)
    
    # Find duplicates
    duplicates = find_duplicates(cursor)
    
    if not duplicates:
        print("✅ No duplicates found!")
        cursor.close()
        conn.close()
        return
    
    # Process each duplicate group
    total_deleted = 0
    total_updated = 0
    
    print(f"\n🔧 Processing {len(duplicates)} duplicate groups...")
    start = time.time()
    
    for idx, (name, district, count, ids_str) in enumerate(duplicates):
        location_ids = [int(id) for id in ids_str.split(',')]
        
        # Pick best location to keep
        keep_id = pick_best_location(location_ids, details_map, usage_map)
        delete_ids = [id for id in location_ids if id != keep_id]
        
        if idx < 5 or (idx + 1) % 500 == 0:  # Show first 5 and every 500th
            print(f"  [{idx+1}/{len(duplicates)}] '{name}' ({district}): Keep ID {keep_id}, delete {len(delete_ids)} duplicates")
        
        if not dry_run:
            try:
                # Update references for each duplicate
                for old_id in delete_ids:
                    updates = update_references(cursor, old_id, keep_id)
                    total_updated += updates['total']
                
                # Delete duplicates
                if delete_ids:
                    placeholders = ','.join(['%s'] * len(delete_ids))
                    cursor.execute(f"DELETE FROM locations WHERE id IN ({placeholders})", delete_ids)
                    total_deleted += len(delete_ids)
                
                # Commit every 100 groups
                if (idx + 1) % 100 == 0:
                    conn.commit()
                    elapsed = time.time() - start
                    print(f"    ✅ Committed: {idx+1}/{len(duplicates)} groups processed ({elapsed:.1f}s)")
            except Exception as e:
                print(f"    ❌ Error at group {idx+1}: {e}")
                conn.rollback()
                raise
    
    if not dry_run:
        conn.commit()
        elapsed = time.time() - start
        print(f"\n    ✅ Final commit completed in {elapsed:.1f}s")
    
    # Final counts
    cursor.execute("SELECT COUNT(*) FROM locations")
    final_count = cursor.fetchone()[0]
    
    elapsed = time.time() - start
    
    print(f"\n{'🔍 DRY RUN RESULTS' if dry_run else '🎉 CLEANUP COMPLETE'}")
    print("=" * 60)
    print(f"Initial locations:    {initial_count:,}")
    print(f"Final locations:      {final_count:,}")
    print(f"Duplicates removed:   {total_deleted:,}")
    print(f"References updated:   {total_updated:,}")
    print(f"Time taken:           {elapsed:.1f}s")
    print("=" * 60)
    
    cursor.close()
    conn.close()

if __name__ == "__main__":
    db_config = {
        'host': os.getenv('DB_HOST_PREPROD', '127.0.0.1'),
        'port': int(os.getenv('DB_PORT_PREPROD', '3307')),
        'user': os.getenv('DB_USER_PREPROD', 'perundhu_user'),
        'password': os.getenv('DB_PASSWORD_PREPROD'),
        'database': os.getenv('DB_NAME_PREPROD', 'perundhu'),
        'autocommit': False
    }
    
    if not db_config['password']:
        print("❌ Error: DB_PASSWORD_PREPROD environment variable not set")
        sys.exit(1)
    
    # Check if dry-run flag is passed
    dry_run = '--dry-run' in sys.argv or '-n' in sys.argv
    
    try:
        cleanup_duplicates(db_config, dry_run)
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
