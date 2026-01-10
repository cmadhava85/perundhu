#!/usr/bin/env python3
"""
Fast Location Deduplication - Optimized version
Merges duplicate locations using batch operations
"""

import mysql.connector
import sys
from getpass import getpass
from collections import defaultdict

def connect_to_db(password):
    """Connect to database via Cloud SQL Proxy"""
    try:
        conn = mysql.connector.connect(
            host='127.0.0.1',
            port=3307,
            user='root',
            password=password,
            database='perundhu'
        )
        return conn
    except Exception as e:
        print(f"❌ Connection failed: {e}")
        return None

def find_duplicates(cursor):
    """Find all duplicate location names"""
    query = """
        SELECT 
            LOWER(name) as lower_name,
            COUNT(*) as count,
            GROUP_CONCAT(id ORDER BY id) as ids,
            MIN(name) as display_name
        FROM locations
        GROUP BY LOWER(name)
        HAVING COUNT(*) > 1
        ORDER BY COUNT(*) DESC
    """
    cursor.execute(query)
    return cursor.fetchall()

def create_merge_map(duplicates):
    """Create a map of duplicate IDs to keep IDs"""
    merge_map = {}  # old_id -> new_id
    stats = {'duplicate_names': 0, 'total_duplicates': 0}
    
    for dup in duplicates:
        ids = [int(x) for x in dup[2].split(',')]
        keep_id = ids[0]
        
        for dup_id in ids[1:]:
            merge_map[dup_id] = keep_id
        
        stats['duplicate_names'] += 1
        stats['total_duplicates'] += len(ids) - 1
    
    return merge_map, stats

def batch_update_fks(cursor, merge_map, table, column, batch_size=500):
    """Update foreign keys in batches using CASE statements"""
    print(f"   Updating {table}.{column}...")
    
    # Split into batches
    items = list(merge_map.items())
    for i in range(0, len(items), batch_size):
        batch = items[i:i+batch_size]
        old_ids = [str(old) for old, _ in batch]
        
        # Build CASE statement
        cases = [f"WHEN {old} THEN {new}" for old, new in batch]
        case_sql = f"""
            UPDATE {table}
            SET {column} = CASE {column}
                {' '.join(cases)}
            END
            WHERE {column} IN ({','.join(old_ids)})
        """
        cursor.execute(case_sql)

def batch_delete(cursor, ids_to_delete, batch_size=1000):
    """Delete locations in batches"""
    print(f"   Deleting {len(ids_to_delete)} duplicate locations...")
    
    id_list = list(ids_to_delete)
    for i in range(0, len(id_list), batch_size):
        batch = id_list[i:i+batch_size]
        cursor.execute(f"DELETE FROM locations WHERE id IN ({','.join(map(str, batch))})")

def main():
    print("=" * 60)
    print("Fast Location Deduplication (Optimized)")
    print("=" * 60)
    print()
    
    # Get password
    password = getpass("Enter database password: ")
    print()
    
    # Connect
    print("Connecting to database via Cloud SQL Proxy...")
    conn = connect_to_db(password)
    if not conn:
        sys.exit(1)
    
    cursor = conn.cursor()
    print("✅ Connected!")
    print()
    
    # Find duplicates
    print("📊 Finding duplicate locations...")
    duplicates = find_duplicates(cursor)
    
    print(f"✅ Found {len(duplicates)} location names with duplicates")
    
    # Create merge map
    merge_map, stats = create_merge_map(duplicates)
    print(f"   Total extra records to remove: {stats['total_duplicates']}")
    print()
    
    # Show top duplicates
    print("Top 10 duplicates:")
    for i, dup in enumerate(duplicates[:10], 1):
        ids = [int(x) for x in dup[2].split(',')]
        print(f"   {i}. {dup[3]}: {dup[1]}x (keeping ID {ids[0]})")
    print()
    
    # Confirm execution
    response = input("Execute deduplication now? (yes/no): ").strip().lower()
    if response != 'yes':
        print("\n⏭️  Cancelled.")
        cursor.close()
        conn.close()
        return
    
    print("\n🔄 Executing deduplication (optimized batch mode)...")
    print("="*60)
    
    try:
        # Update foreign keys in all tables (batched)
        fk_tables = [
            ('buses', 'from_location_id'),
            ('buses', 'to_location_id'),
            ('connecting_routes', 'connection_point_id'),
            ('stops', 'location_id'),
        ]
        
        for table, column in fk_tables:
            batch_update_fks(cursor, merge_map, table, column)
        
        # Update translations (with entity_type filter)
        print(f"   Updating translations.entity_id...")
        items = list(merge_map.items())
        for i in range(0, len(items), 500):
            batch = items[i:i+500]
            old_ids = [str(old) for old, _ in batch]
            cases = [f"WHEN {old} THEN {new}" for old, new in batch]
            sql = f"""
                UPDATE translations
                SET entity_id = CASE entity_id
                    {' '.join(cases)}
                END
                WHERE entity_type = 'LOCATION' 
                AND entity_id IN ({','.join(old_ids)})
            """
            cursor.execute(sql)
        
        # Delete duplicate locations (batched)
        batch_delete(cursor, merge_map.keys())
        
        # Commit transaction
        conn.commit()
        
        print(f"\n✅ SUCCESS! Deduplication completed!")
        print(f"   - Updated foreign key references across all tables")
        print(f"   - Deleted {stats['duplicate_names']} duplicate location names")
        print(f"   - Removed {stats['total_duplicates']} extra records")
        
        # Verify results
        cursor.execute("SELECT COUNT(*) FROM locations")
        final_count = cursor.fetchone()[0]
        print(f"\n📊 Final location count: {final_count:,}")
        
    except Exception as e:
        print(f"\n❌ ERROR during execution: {e}")
        conn.rollback()
        print("   Transaction rolled back. No changes made.")
        cursor.close()
        conn.close()
        sys.exit(1)
    
    cursor.close()
    conn.close()
    print("\n✅ Done!")

if __name__ == "__main__":
    main()
