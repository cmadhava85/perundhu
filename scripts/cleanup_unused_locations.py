#!/usr/bin/env python3
"""
Clean up unused location entries.
Keeps only locations that are referenced in bus_schedules table and removes all others.
This prevents confusing users with duplicate/similar location names that have no routes.
"""

import mysql.connector
import sys
import argparse

def get_db_password(project_id):
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

def cleanup_unused_locations(skip_confirmation=False, environment='production'):
    """Remove locations that have no bus routes"""
    
    # Environment configuration
    env_config = {
        'production': {
            'project_id': 'perundhu-prod-001',
            'db_name': 'RECOVER_YOUR_DATA'
        },
        'preprod': {
            'project_id': 'astute-strategy-406601',
            'db_name': 'perundhu'
        }
    }
    
    if environment not in env_config:
        raise ValueError(f"Invalid environment: {environment}. Must be 'production' or 'preprod'")
    
    config = env_config[environment]
    
    print(f"🔍 Analyzing unused locations in {environment} database...")
    
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
        # Get total location count
        print("\n📊 Analyzing database...")
        cursor.execute("SELECT COUNT(*) FROM locations")
        total_locations = cursor.fetchone()[0]
        print(f"   Total locations: {total_locations}")
        
        # Find locations that are actually used in buses and stops (optimized query)
        print("\n🔍 Finding locations with bus routes...")
        cursor.execute("""
            CREATE TEMPORARY TABLE used_locations AS
            SELECT DISTINCT from_location_id AS id FROM buses WHERE from_location_id IS NOT NULL
            UNION
            SELECT DISTINCT to_location_id FROM buses WHERE to_location_id IS NOT NULL
            UNION
            SELECT DISTINCT location_id FROM stops WHERE location_id IS NOT NULL
        """)
        
        cursor.execute("SELECT COUNT(*) FROM used_locations")
        used_count = cursor.fetchone()[0]
        print(f"   Locations with routes: {used_count}")
        
        # Find unused locations count
        cursor.execute("""
            SELECT COUNT(*)
            FROM locations l
            WHERE NOT EXISTS (SELECT 1 FROM used_locations u WHERE u.id = l.id)
        """)
        unused_count = cursor.fetchone()[0]
        print(f"   Unused locations (to be deleted): {unused_count}")
        
        if unused_count == 0:
            print("\n✅ No unused locations found! All locations have bus routes.")
            cursor.execute("DROP TEMPORARY TABLE IF EXISTS used_locations")
            return True
        
        # Show some examples
        print("\n📋 Sample unused locations (first 20):")
        cursor.execute("""
            SELECT l.id, l.name
            FROM locations l
            WHERE NOT EXISTS (SELECT 1 FROM used_locations u WHERE u.id = l.id)
            ORDER BY l.id
            LIMIT 20
        """)
        sample_unused = cursor.fetchall()
        for loc_id, name in sample_unused:
            print(f"   ID {loc_id}: {name}")
        
        if unused_count > 20:
            print(f"   ... and {unused_count - 20} more")
        
        if not skip_confirmation:
            print(f"\n⚠️  WARNING: This will delete {unused_count} locations!")
            print(f"   Keeping {used_count} locations that have bus routes")
            response = input(f"\nProceed with cleanup? (yes/no): ")
            if response.lower() != 'yes':
                print("❌ Cleanup cancelled")
                cursor.execute("DROP TEMPORARY TABLE IF EXISTS used_locations")
                return False
        else:
            print(f"\n✅ Auto-confirmed (--confirm flag used)")
        
        print("\n🗑️  Starting cleanup...")
        
        # Delete unused locations in one query using NOT EXISTS
        cursor.execute("""
            DELETE FROM locations
            WHERE NOT EXISTS (SELECT 1 FROM used_locations u WHERE u.id = locations.id)
        """)
        
        total_deleted = cursor.rowcount
        print(f"   Deleted {total_deleted} locations")
        
        # Clean up temporary table
        cursor.execute("DROP TEMPORARY TABLE IF EXISTS used_locations")
        
        # Commit the changes
        connection.commit()
        print(f"\n✅ Cleanup complete!")
        print(f"   Deleted {total_deleted} unused locations")
        
        # Show final counts
        print("\n📊 Final database counts:")
        cursor.execute("SELECT COUNT(*) FROM locations")
        final_count = cursor.fetchone()[0]
        print(f"   Locations: {final_count} (was {total_locations})")
        
        cursor.execute("SELECT COUNT(*) FROM buses")
        print(f"   Buses: {cursor.fetchone()[0]}")
        
        cursor.execute("SELECT COUNT(*) FROM stops")
        print(f"   Stops: {cursor.fetchone()[0]}")
        
        # Verify all remaining locations have routes
        cursor.execute("""
            SELECT COUNT(*)
            FROM locations
            WHERE id NOT IN (
                SELECT DISTINCT from_location_id FROM buses WHERE from_location_id IS NOT NULL
                UNION
                SELECT DISTINCT to_location_id FROM buses WHERE to_location_id IS NOT NULL
                UNION
                SELECT DISTINCT location_id FROM stops WHERE location_id IS NOT NULL
            )
        """)
        remaining_unused = cursor.fetchone()[0]
        
        if remaining_unused > 0:
            print(f"\n⚠️  Warning: {remaining_unused} unused locations still remain")
        else:
            print(f"\n✅ All remaining locations have bus routes!")
        
        return True
        
    except Exception as e:
        connection.rollback()
        print(f"\n❌ Error during cleanup: {e}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        cursor.close()
        connection.close()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Clean up unused locations from database")
    parser.add_argument("--confirm", action="store_true", help="Skip confirmation prompt")
    parser.add_argument("--env", choices=['production', 'preprod'], default='production', 
                       help="Target environment (default: production)")
    args = parser.parse_args()
    
    success = cleanup_unused_locations(skip_confirmation=args.confirm, environment=args.env)
    sys.exit(0 if success else 1)
