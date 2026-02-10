#!/usr/bin/env python3
"""
Script to identify and clean up duplicate location entries in the database.
Removes locations with 0 bus routes when there's a similar location with routes.

Usage:
    python cleanup_duplicate_locations.py --dry-run    # Preview what will be deleted
    python cleanup_duplicate_locations.py --execute    # Actually delete duplicates
"""

import mysql.connector
import re
import argparse
from datetime import datetime
from typing import List, Dict, Tuple

# Database configuration
DB_CONFIG = {
    'host': '127.0.0.1',
    'port': 3307,
    'user': 'root',
    'password': 'Root@1234',
    'database': 'perundhu_db'
}

def normalize_name(name: str) -> str:
    """Normalize location name for comparison"""
    # Remove special characters, extra spaces, and convert to lowercase
    normalized = re.sub(r'[^a-zA-Z\s]', '', name)
    normalized = re.sub(r'\s+', ' ', normalized)
    return normalized.lower().strip()

def get_location_route_counts(cursor) -> List[Dict]:
    """Get all locations with their route counts"""
    query = """
        SELECT 
            l.id,
            l.name,
            l.district,
            COALESCE(origin_count, 0) + COALESCE(dest_count, 0) + COALESCE(stop_count, 0) as total_routes
        FROM locations l
        LEFT JOIN (
            SELECT from_location_id, COUNT(*) as origin_count 
            FROM buses 
            WHERE active = 1 OR active IS NULL 
            GROUP BY from_location_id
        ) origins ON l.id = origins.from_location_id
        LEFT JOIN (
            SELECT to_location_id, COUNT(*) as dest_count 
            FROM buses 
            WHERE active = 1 OR active IS NULL 
            GROUP BY to_location_id
        ) dests ON l.id = dests.to_location_id
        LEFT JOIN (
            SELECT location_id, COUNT(DISTINCT bus_id) as stop_count 
            FROM stops 
            GROUP BY location_id
        ) stops ON l.id = stops.location_id
        ORDER BY l.name
    """
    
    cursor.execute(query)
    locations = []
    for row in cursor.fetchall():
        locations.append({
            'id': row[0],
            'name': row[1],
            'district': row[2],
            'route_count': row[3],
            'normalized_name': normalize_name(row[1])
        })
    return locations

def find_duplicates(locations: List[Dict]) -> List[Tuple[Dict, Dict]]:
    """Find duplicate locations where one has routes and one doesn't"""
    duplicates = []
    
    # Group by normalized name
    name_groups = {}
    for loc in locations:
        norm_name = loc['normalized_name']
        if norm_name not in name_groups:
            name_groups[norm_name] = []
        name_groups[norm_name].append(loc)
    
    # Find groups where one has routes and one doesn't
    for norm_name, group in name_groups.items():
        if len(group) < 2:
            continue
            
        # Sort by route count descending
        group.sort(key=lambda x: x['route_count'], reverse=True)
        
        # If the top one has routes and others don't, mark others as duplicates
        if group[0]['route_count'] > 0:
            for duplicate in group[1:]:
                if duplicate['route_count'] == 0:
                    duplicates.append((duplicate, group[0]))
    
    return duplicates

def backup_locations(cursor, conn):
    """Create backup table before deletion"""
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    backup_table = f'locations_backup_{timestamp}'
    
    print(f"\n📦 Creating backup table: {backup_table}")
    cursor.execute(f"CREATE TABLE {backup_table} AS SELECT * FROM locations")
    conn.commit()
    
    cursor.execute(f"SELECT COUNT(*) FROM {backup_table}")
    count = cursor.fetchone()[0]
    print(f"✅ Backed up {count} locations to {backup_table}")
    
    return backup_table

def delete_duplicates(cursor, conn, duplicate_ids: List[int]):
    """Delete duplicate locations"""
    if not duplicate_ids:
        print("\n✨ No duplicates to delete!")
        return
    
    placeholders = ','.join(['%s'] * len(duplicate_ids))
    query = f"DELETE FROM locations WHERE id IN ({placeholders})"
    
    cursor.execute(query, duplicate_ids)
    conn.commit()
    
    print(f"\n✅ Deleted {len(duplicate_ids)} duplicate locations")

def main():
    parser = argparse.ArgumentParser(description='Clean up duplicate locations in database')
    parser.add_argument('--execute', action='store_true', help='Actually delete duplicates (default is dry-run)')
    parser.add_argument('--dry-run', action='store_true', help='Preview what will be deleted without making changes')
    args = parser.parse_args()
    
    # Default to dry-run if neither flag is specified
    execute = args.execute and not args.dry_run
    
    print("🔍 Connecting to database...")
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor()
        
        print("📊 Analyzing locations...")
        locations = get_location_route_counts(cursor)
        print(f"Found {len(locations)} total locations")
        
        print("\n🔎 Finding duplicates...")
        duplicates = find_duplicates(locations)
        
        if not duplicates:
            print("\n✨ No duplicate locations found!")
            return
        
        print(f"\n📋 Found {len(duplicates)} duplicate locations to remove:\n")
        print(f"{'ID':<8} {'Duplicate Name':<50} {'Routes':<8} {'Keep ID':<8} {'Keep Name':<50} {'Keep Routes':<12}")
        print("=" * 140)
        
        duplicate_ids = []
        for duplicate, keep in duplicates:
            print(f"{duplicate['id']:<8} {duplicate['name']:<50} {duplicate['route_count']:<8} "
                  f"{keep['id']:<8} {keep['name']:<50} {keep['route_count']:<12}")
            duplicate_ids.append(duplicate['id'])
        
        if execute:
            print("\n⚠️  EXECUTING DELETION - This will modify the database!")
            response = input("Are you sure you want to continue? (yes/no): ")
            
            if response.lower() != 'yes':
                print("❌ Deletion cancelled")
                return
            
            # Create backup
            backup_table = backup_locations(cursor, conn)
            
            # Delete duplicates
            delete_duplicates(cursor, conn, duplicate_ids)
            
            print(f"\n✅ Cleanup complete!")
            print(f"💾 Backup table: {backup_table}")
            print(f"🗑️  Deleted: {len(duplicate_ids)} locations")
            
        else:
            print("\n🔍 DRY RUN MODE - No changes made")
            print(f"\n   To actually delete these {len(duplicate_ids)} duplicates, run:")
            print("   python cleanup_duplicate_locations.py --execute")
        
    except mysql.connector.Error as e:
        print(f"\n❌ Database error: {e}")
        return 1
    
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'conn' in locals():
            conn.close()
    
    return 0

if __name__ == '__main__':
    exit(main())
