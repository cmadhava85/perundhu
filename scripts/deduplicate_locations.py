#!/usr/bin/env python3
"""
Deduplicate location entries in production database.
Keeps the first occurrence of each unique location name (case-insensitive)
and updates all foreign key references.
"""

import mysql.connector
import sys
import argparse
from collections import defaultdict

def get_db_password(project_id='astute-strategy-406601'):
    """Get database password from Secret Manager"""
    import subprocess
    result = subprocess.run(
        ['gcloud', 'secrets', 'versions', 'access', 'latest', '--secret=db-password', f'--project={project_id}'],
        capture_output=True,
        text=True
    )
    if result.returncode != 0:
        raise Exception(f"Failed to get password: {result.stderr}")
    return result.stdout.strip()

def deduplicate_locations(skip_confirmation=False, environment='production'):
    """Find and remove duplicate locations, updating all references"""
    
    # Environment configuration
    env_config = {
        'production': {
            'project_id': 'perundhu-prod-001',
            'db_name': 'perundhu'
        },
        'preprod': {
            'project_id': 'astute-strategy-406601',
            'db_name': 'perundhu'
        }
    }
    
    if environment not in env_config:
        raise ValueError(f"Invalid environment: {environment}. Must be 'production' or 'preprod'")
    
    config = env_config[environment]
    
    print(f"🔍 Analyzing location duplicates in {environment} database...")
    
    print("\n🔑 Getting database password from Secret Manager...")
    password = get_db_password(config['project_id'])
    
    print(f"🔌 Connecting to {environment} database...")
    connection = mysql.connector.connect(
        host='127.0.0.1',
        port=3307,
        user='perundhu_user',
        password=password,
        database=config['db_name'],
        auth_plugin='mysql_native_password'
    )
    
    cursor = connection.cursor()
    
    try:
        # Get all locations with their normalized names
        print("\n📊 Loading all locations...")
        cursor.execute("""
            SELECT id, name, district, latitude, longitude
            FROM locations
            ORDER BY id ASC
        """)
        
        all_locations = cursor.fetchall()
        print(f"   Found {len(all_locations)} total locations")
        
        # Group by normalized name (case-insensitive, trimmed)
        location_groups = defaultdict(list)
        for loc_id, name, district, lat, lon in all_locations:
            normalized_name = name.strip().upper()
            location_groups[normalized_name].append({
                'id': loc_id,
                'name': name,
                'district': district,
                'latitude': lat,
                'longitude': lon
            })
        
        # Find duplicates
        duplicates = {name: locs for name, locs in location_groups.items() if len(locs) > 1}
        
        if not duplicates:
            print("\n✅ No duplicates found! All location names are unique.")
            return True
        
        print(f"\n🔍 Found {len(duplicates)} location names with duplicates:")
        print(f"   Total duplicate entries to remove: {sum(len(locs) - 1 for locs in duplicates.values())}")
        
        # Show top duplicates
        sorted_duplicates = sorted(duplicates.items(), key=lambda x: len(x[1]), reverse=True)
        print("\n📋 Top 10 duplicates:")
        for i, (name, locs) in enumerate(sorted_duplicates[:10], 1):
            print(f"   {i}. {name}: {len(locs)} entries (IDs: {', '.join(str(l['id']) for l in locs[:5])}{'...' if len(locs) > 5 else ''})")
        
        if not skip_confirmation:
            response = input(f"\n⚠️  Proceed with deduplication? This will remove {sum(len(locs) - 1 for locs in duplicates.values())} duplicate entries. (yes/no): ")
            if response.lower() != 'yes':
                print("❌ Deduplication cancelled")
                return False
        else:
            print(f"\n✅ Auto-confirmed (--confirm flag used)")
        
        print("\n🔧 Starting deduplication...")
        
        # Disable foreign key checks temporarily
        cursor.execute("SET FOREIGN_KEY_CHECKS = 0")
        
        total_merged = 0
        total_deleted = 0
        
        for normalized_name, locs in duplicates.items():
            # Keep the first entry (lowest ID, likely the original)
            primary = locs[0]
            duplicates_to_remove = locs[1:]
            
            duplicate_ids = [loc['id'] for loc in duplicates_to_remove]
            duplicate_ids_str = ','.join(map(str, duplicate_ids))
            
            print(f"\n   Merging: {primary['name']} (keeping ID {primary['id']})")
            print(f"   Removing IDs: {duplicate_ids_str}")
            
            # Update foreign key references in related tables
            tables_to_update = [
                ('buses', 'from_location_id'),
                ('buses', 'to_location_id'),
                ('stops', 'location_id'),
                ('translations', 'entity_id')  # Where entity_type = 'LOCATION'
            ]
            
            for table, column in tables_to_update:
                if table == 'translations':
                    # Special handling for translations table
                    cursor.execute(f"""
                        UPDATE {table}
                        SET {column} = %s
                        WHERE {column} IN ({duplicate_ids_str})
                        AND entity_type = 'LOCATION'
                    """, (primary['id'],))
                else:
                    cursor.execute(f"""
                        UPDATE {table}
                        SET {column} = %s
                        WHERE {column} IN ({duplicate_ids_str})
                    """, (primary['id'],))
                
                if cursor.rowcount > 0:
                    print(f"      Updated {cursor.rowcount} rows in {table}.{column}")
            
            # Delete duplicate location entries
            cursor.execute(f"""
                DELETE FROM locations
                WHERE id IN ({duplicate_ids_str})
            """)
            deleted = cursor.rowcount
            total_deleted += deleted
            print(f"      Deleted {deleted} duplicate location entries")
            total_merged += 1
        
        # Re-enable foreign key checks
        cursor.execute("SET FOREIGN_KEY_CHECKS = 1")
        
        # Commit the changes
        connection.commit()
        print(f"\n✅ Deduplication complete!")
        print(f"   Merged {total_merged} location groups")
        print(f"   Removed {total_deleted} duplicate entries")
        
        # Show final counts
        print("\n📊 Final database counts:")
        cursor.execute("SELECT COUNT(*) FROM locations")
        print(f"   Locations: {cursor.fetchone()[0]}")
        cursor.execute("SELECT COUNT(*) FROM buses")
        print(f"   Buses: {cursor.fetchone()[0]}")
        cursor.execute("SELECT COUNT(*) FROM stops")
        print(f"   Stops: {cursor.fetchone()[0]}")
        
        # Verify no duplicates remain
        cursor.execute("""
            SELECT UPPER(name) as normalized_name, COUNT(*) as count
            FROM locations
            GROUP BY UPPER(name)
            HAVING COUNT(*) > 1
        """)
        remaining = cursor.fetchall()
        if remaining:
            print(f"\n⚠️  Warning: {len(remaining)} duplicates still remain (may need manual review)")
            for name, count in remaining[:5]:
                print(f"      {name}: {count}")
        else:
            print(f"\n✅ All location names are now unique!")
        
        return True
        
    except Exception as e:
        connection.rollback()
        print(f"\n❌ Error during deduplication: {e}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        cursor.close()
        connection.close()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Deduplicate location entries in database")
    parser.add_argument("--confirm", action="store_true", help="Skip confirmation prompt")
    parser.add_argument("--env", choices=['production', 'preprod'], default='production', 
                       help="Target environment (default: production)")
    args = parser.parse_args()
    
    success = deduplicate_locations(skip_confirmation=args.confirm, environment=args.env)
    sys.exit(0 if success else 1)
