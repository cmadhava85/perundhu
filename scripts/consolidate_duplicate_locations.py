#!/usr/bin/env python3
"""
Consolidate duplicate locations in the database.

Strategy:
1. Find all location groups with duplicate names (case-insensitive)
2. For each group, keep the location with ID closest to the first original (to maintain existing references)
3. Redirect all buses, stops, and other references to the primary location
4. Delete duplicate location records
"""

import mysql.connector
import os
import sys

DB_CONFIG = {
    'host': os.getenv('DB_HOST', '127.0.0.1'),
    'port': int(os.getenv('DB_PORT', '3306')),
    'user': os.getenv('DB_USER', 'root'),
    'password': os.getenv('DB_PASSWORD', ''),
    'database': os.getenv('DB_NAME', 'perundhu')
}

def get_connection():
    """Create database connection."""
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        return conn
    except mysql.connector.Error as e:
        print(f"❌ Database connection failed: {e}")
        sys.exit(1)

def find_duplicate_groups(cursor):
    """Find all location groups with duplicate names."""
    cursor.execute("""
        SELECT 
            LOWER(TRIM(name)) as normalized_name,
            COUNT(*) as count,
            GROUP_CONCAT(id ORDER BY id) as ids,
            GROUP_CONCAT(name SEPARATOR ' | ') as names
        FROM locations
        GROUP BY LOWER(TRIM(name))
        HAVING count > 1
        ORDER BY count DESC
    """)
    return cursor.fetchall()

def consolidate_group(conn, cursor, normalized_name, ids_str):
    """Consolidate a group of duplicate locations."""
    ids = [int(x) for x in ids_str.split(',')]
    primary_id = ids[0]  # Keep the first (lowest) ID as primary
    duplicate_ids = ids[1:]
    
    print(f"\n  Consolidating {len(ids)} '{normalized_name}' duplicates:")
    print(f"    Primary: {primary_id}")
    print(f"    Duplicates: {duplicate_ids}")
    
    try:
        # Update buses with duplicate location IDs
        for dup_id in duplicate_ids:
            cursor.execute(
                "UPDATE buses SET from_location_id = %s WHERE from_location_id = %s",
                (primary_id, dup_id)
            )
            buses_from = cursor.rowcount
            
            cursor.execute(
                "UPDATE buses SET to_location_id = %s WHERE to_location_id = %s",
                (primary_id, dup_id)
            )
            buses_to = cursor.rowcount
            
            # Update stops
            cursor.execute(
                "UPDATE stops SET location_id = %s WHERE location_id = %s",
                (primary_id, dup_id)
            )
            stops_updated = cursor.rowcount
            
            # Update translations
            cursor.execute(
                "UPDATE translations SET entity_id = %s WHERE entity_id = %s AND entity_type = 'location'",
                (primary_id, dup_id)
            )
            trans_updated = cursor.rowcount
            
            # Update location hierarchy (parent_id references)
            # If any duplicate is a parent of other locations, update those to point to primary
            cursor.execute(
                "UPDATE locations SET parent_id = %s WHERE parent_id = %s",
                (primary_id, dup_id)
            )
            parent_refs_updated = cursor.rowcount
            
            # Delete the duplicate location
            cursor.execute("DELETE FROM locations WHERE id = %s", (dup_id,))
            
            if buses_from > 0 or buses_to > 0 or stops_updated > 0 or trans_updated > 0 or parent_refs_updated > 0:
                print(f"    ✓ Merged ID {dup_id}: buses({buses_from}+{buses_to}) stops({stops_updated}) translations({trans_updated}) parent_refs({parent_refs_updated})")
        
        conn.commit()
        return True
    except mysql.connector.Error as e:
        print(f"    ❌ Error consolidating: {e}")
        conn.rollback()
        return False

def main():
    """Main execution function."""
    print("\n" + "=" * 80)
    print("LOCATION CONSOLIDATION - Remove Duplicate Locations")
    print("=" * 80)
    
    conn = get_connection()
    cursor = conn.cursor(dictionary=True, buffered=True)
    
    try:
        # Get all duplicate groups
        duplicate_groups = find_duplicate_groups(cursor)
        total_groups = len(duplicate_groups)
        
        if total_groups == 0:
            print("\n✅ No duplicate locations found!")
            cursor.close()
            conn.close()
            return
        
        print(f"\n🔍 Found {total_groups} groups of duplicate locations")
        
        total_consolidated = 0
        total_removed = 0
        
        # Get confirmation
        response = input(f"\nProceed with consolidation? (yes/no): ")
        if response.lower() not in ['yes', 'y']:
            print("❌ Cancelled.")
            sys.exit(0)
        
        # Consolidate each group
        for idx, group in enumerate(duplicate_groups, 1):
            normalized_name = group['normalized_name']
            count = group['count']
            ids_str = group['ids']
            
            print(f"\n[{idx}/{total_groups}] Processing '{normalized_name}' ({count} duplicates)")
            
            if consolidate_group(conn, cursor, normalized_name, ids_str):
                total_consolidated += 1
                total_removed += (count - 1)
        
        print("\n" + "=" * 80)
        print(f"✅ CONSOLIDATION COMPLETE!")
        print(f"   Groups consolidated: {total_consolidated}")
        print(f"   Locations removed: {total_removed}")
        print("=" * 80)
        
        # Verify results
        cursor.execute("""
            SELECT COUNT(*) as duplicate_groups
            FROM (
                SELECT 1
                FROM locations
                GROUP BY LOWER(TRIM(name))
                HAVING COUNT(*) > 1
            ) t
        """)
        remaining = cursor.fetchone()['duplicate_groups'] or 0
        print(f"\nRemaining duplicate groups: {remaining}")
        
        if remaining == 0:
            print("✅ All duplicates successfully consolidated!")
        
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        conn.rollback()
        sys.exit(1)
    finally:
        cursor.close()
        conn.close()

if __name__ == '__main__':
    main()
