#!/usr/bin/env python3
"""
Optimized cleanup: batch update all references in single queries instead of one-by-one.
This is 100-1000x faster than updating each ID individually.
"""

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

def cleanup_duplicates(db_config: dict, dry_run: bool = False):
    """Main cleanup function using batch updates"""
    print(f"🔗 Connecting to {db_config['host']}:{db_config['port']}...")
    conn = mysql.connector.connect(**db_config)
    cursor = conn.cursor()
    
    print(f"✅ Connected to database: {db_config['database']}")
    
    if dry_run:
        print("\n⚠️  DRY RUN MODE - No changes will be made\n")
    
    # Get initial count
    cursor.execute("SELECT COUNT(*) FROM locations")
    initial_count = cursor.fetchone()[0]
    print(f"📊 Initial location count: {initial_count:,}")
    
    # Get ALL duplicates to find best keeper for each group
    print("📋 Pre-loading location details for all duplicates...")
    cursor.execute("""
        SELECT id, name, district, latitude, longitude, priority, 
               (SELECT COUNT(*) FROM buses WHERE from_location_id = l.id) as from_count,
               (SELECT COUNT(*) FROM buses WHERE to_location_id = l.id) as to_count,
               (SELECT COUNT(*) FROM stops WHERE location_id = l.id) as stops_count
        FROM locations l
        WHERE (name, district) IN (
            SELECT name, district FROM locations 
            GROUP BY name, district HAVING COUNT(*) > 1
        )
        ORDER BY name, district
    """)
    
    all_dup_rows = cursor.fetchall()
    print(f"✅ Loaded {len(all_dup_rows):,} location records involved in duplicates")
    
    # Build mapping: (name, district) → list of location records
    groups = {}
    for row in all_dup_rows:
        key = (row[1], row[2])  # (name, district)
        if key not in groups:
            groups[key] = []
        groups[key].append({
            'id': row[0],
            'latitude': row[3],
            'longitude': row[4],
            'priority': row[5] or 0,
            'from_count': row[6],
            'to_count': row[7],
            'stops_count': row[8]
        })
    
    # Pick best keeper for each group and build OLD→NEW mapping
    print(f"\n🔧 Building merge mapping for {len(groups):,} duplicate groups...")
    old_to_new = {}  # old_id → new_id
    
    for idx, ((name, district), locs) in enumerate(groups.items()):
        # Sort: most used → has coordinates → higher priority → lowest ID
        locs.sort(key=lambda x: (
            -(x['from_count'] + x['to_count'] + x['stops_count']),
            -(1 if x['latitude'] and x['longitude'] else 0),
            -x['priority'],
            x['id']
        ))
        
        keeper_id = locs[0]['id']
        total_usage = sum(x['from_count'] + x['to_count'] + x['stops_count'] for x in locs)
        
        if idx < 5 or (idx + 1) % 1000 == 0:
            dups = len(locs) - 1
            print(f"  [{idx+1}/{len(groups)}] '{name}': Keep ID {keeper_id}, delete {dups} dupes (total refs: {total_usage})")
        
        # Map all duplicates to keeper
        for loc in locs[1:]:
            old_to_new[loc['id']] = keeper_id
    
    total_to_delete = len(old_to_new)
    print(f"\n📊 Will merge {total_to_delete:,} duplicate locations into their keepers")
    
    if not old_to_new:
        print("✅ No duplicates to clean up!")
        cursor.close()
        conn.close()
        return
    
    if dry_run:
        print(f"\n{'🔍 DRY RUN RESULTS'}")
        print("=" * 60)
        print(f"Duplicates to remove:   {total_to_delete:,}")
        print(f"Database will be cleaned with batch operations")
        print("=" * 60)
        cursor.close()
        conn.close()
        return
    
    # Now do BATCH updates using CASE statements
    print(f"\n🚀 Executing batch updates...")
    start = time.time()
    
    # Build CASE statement for updates (in chunks to avoid SQL too long)
    chunk_size = 1000
    old_ids = list(old_to_new.keys())
    total_updated = 0
    
    for chunk_idx in range(0, len(old_ids), chunk_size):
        chunk_ids = old_ids[chunk_idx:chunk_idx + chunk_size]
        
        # Build CASE clause
        case_clauses = " ".join(
            f"WHEN {old_id} THEN {old_to_new[old_id]}" 
            for old_id in chunk_ids
        )
        
        # Update buses.from_location_id
        query = f"""
            UPDATE buses 
            SET from_location_id = CASE from_location_id
                {case_clauses}
                ELSE from_location_id
            END 
            WHERE from_location_id IN ({','.join(str(id) for id in chunk_ids)})
        """
        cursor.execute(query)
        updated = cursor.rowcount
        if updated > 0:
            total_updated += updated
            print(f"  ✅ Updated {updated:,} buses (from_location_id) - chunk {chunk_idx // chunk_size + 1}")
        
        # Update buses.to_location_id
        query = f"""
            UPDATE buses 
            SET to_location_id = CASE to_location_id
                {case_clauses}
                ELSE to_location_id
            END 
            WHERE to_location_id IN ({','.join(str(id) for id in chunk_ids)})
        """
        cursor.execute(query)
        updated = cursor.rowcount
        if updated > 0:
            total_updated += updated
            print(f"  ✅ Updated {updated:,} buses (to_location_id) - chunk {chunk_idx // chunk_size + 1}")
        
        # Update stops.location_id
        query = f"""
            UPDATE stops 
            SET location_id = CASE location_id
                {case_clauses}
                ELSE location_id
            END 
            WHERE location_id IN ({','.join(str(id) for id in chunk_ids)})
        """
        cursor.execute(query)
        updated = cursor.rowcount
        if updated > 0:
            total_updated += updated
            print(f"  ✅ Updated {updated:,} stops - chunk {chunk_idx // chunk_size + 1}")
        
        conn.commit()
    
    # Delete all duplicates in one batch
    print(f"\n🗑️  Deleting {total_to_delete:,} duplicate location records...")
    placeholders = ','.join(str(id) for id in old_ids)
    cursor.execute(f"DELETE FROM locations WHERE id IN ({placeholders})")
    deleted = cursor.rowcount
    conn.commit()
    print(f"  ✅ Deleted {deleted:,} locations")
    
    # Final counts
    cursor.execute("SELECT COUNT(*) FROM locations")
    final_count = cursor.fetchone()[0]
    
    elapsed = time.time() - start
    
    print(f"\n🎉 CLEANUP COMPLETE")
    print("=" * 60)
    print(f"Initial locations:    {initial_count:,}")
    print(f"Final locations:      {final_count:,}")
    print(f"Duplicates removed:   {total_to_delete:,}")
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
    
    dry_run = '--dry-run' in sys.argv or '-n' in sys.argv
    
    try:
        cleanup_duplicates(db_config, dry_run)
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
