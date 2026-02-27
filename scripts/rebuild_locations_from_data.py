#!/usr/bin/env python3
"""
Rebuild locations table from actual bus and stops data.
This eliminates ALL duplicates by only keeping locations actively used in buses/stops.
"""

import mysql.connector
import subprocess
import sys
from datetime import datetime

def get_db_password():
    """Get database password from Secret Manager"""
    result = subprocess.run(
        ['gcloud', 'secrets', 'versions', 'access', 'latest', 
         '--secret=db-password', '--project=perundhu-prod-001'],
        capture_output=True, text=True
    )
    if result.returncode != 0:
        raise Exception(f"Failed to get password: {result.stderr}")
    return result.stdout.strip()

def rebuild_locations(skip_confirmation=False):
    """Rebuild locations table from buses and stops data"""
    
    print("\n╔════════════════════════════════════════════════════╗")
    print("║  REBUILD LOCATIONS FROM ACTUAL DATA                ║")
    print("╚════════════════════════════════════════════════════╝\n")
    
    print("⚠️  WARNING: This will:")
    print("   1. Backup current locations table")
    print("   2. Extract unique locations from buses and stops")
    print("   3. Delete ALL duplicate locations")
    print("   4. Keep only ONE entry per unique location name\n")
    
    if not skip_confirmation:
        response = input("Type 'REBUILD' to confirm: ")
        if response.upper() != 'REBUILD':
            print("\n❌ Cancelled by user.")
            return
    
    print("\n🔑 Getting database password...")
    password = get_db_password()
    
    print("🔌 Connecting to production database...")
    connection = mysql.connector.connect(
        host='127.0.0.1',
        port=3307,
        user='perundhu_user',
        password=password,
        database='RECOVER_YOUR_DATA',
        auth_plugin='mysql_native_password',
        connection_timeout=300
    )
    
    cursor = connection.cursor(buffered=True)
    
    try:
        # Step 1: Create backup table
        backup_table = f"locations_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        print(f"\n📦 Step 1: Creating backup table '{backup_table}'...")
        cursor.execute(f"CREATE TABLE {backup_table} AS SELECT * FROM locations")
        backup_count = cursor.rowcount
        print(f"   ✅ Backed up {backup_count} locations")
        
        # Step 2: Get statistics
        print("\n📊 Step 2: Analyzing current data...")
        
        cursor.execute("SELECT COUNT(*) FROM locations")
        total_locations = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(DISTINCT LOWER(TRIM(name))) FROM locations")
        unique_names = cursor.fetchone()[0]
        
        cursor.execute("""
            SELECT COUNT(DISTINCT location_id) 
            FROM (
                SELECT from_location_id as location_id FROM buses
                UNION
                SELECT to_location_id as location_id FROM buses
                UNION
                SELECT location_id FROM stops
            ) used_locations
        """)
        used_locations = cursor.fetchone()[0]
        
        print(f"   Total locations in DB: {total_locations}")
        print(f"   Unique location names: {unique_names}")
        print(f"   Actually used in routes: {used_locations}")
        print(f"   Duplicates to remove: {total_locations - unique_names}")
        
        # Step 3: Create temporary table with deduplicated locations
        print("\n🔨 Step 3: Creating deduplicated locations...")
        
        cursor.execute("DROP TEMPORARY TABLE IF EXISTS locations_dedup")
        
        # Create temp table with one location per unique name
        # Priority: locations with coordinates > locations with most routes > lowest ID
        cursor.execute("""
            CREATE TEMPORARY TABLE locations_dedup AS
            SELECT 
                l.id,
                TRIM(l.name) as name,
                l.latitude,
                l.longitude,
                LOWER(TRIM(l.name)) as clean_name,
                (
                    COALESCE((SELECT COUNT(*) FROM buses WHERE from_location_id = l.id), 0) +
                    COALESCE((SELECT COUNT(*) FROM buses WHERE to_location_id = l.id), 0) +
                    COALESCE((SELECT COUNT(*) FROM stops WHERE location_id = l.id), 0)
                ) as route_count,
                CASE 
                    WHEN l.latitude IS NOT NULL AND l.longitude IS NOT NULL THEN 2
                    ELSE 1
                END as has_coords
            FROM locations l
            WHERE EXISTS (
                SELECT 1 FROM buses WHERE from_location_id = l.id OR to_location_id = l.id
                UNION
                SELECT 1 FROM stops WHERE location_id = l.id
            )
        """)
        
        print(f"   ✅ Created temporary dedup table")
        
        # Step 4: Find the best ID to keep for each location name
        print("\n🎯 Step 4: Selecting best location ID for each name...")
        
        cursor.execute("DROP TEMPORARY TABLE IF EXISTS locations_to_keep")
        
        cursor.execute("""
            CREATE TEMPORARY TABLE locations_to_keep AS
            SELECT 
                ld1.id,
                ld1.name,
                ld1.latitude,
                ld1.longitude
            FROM locations_dedup ld1
            WHERE ld1.id = (
                SELECT ld2.id
                FROM locations_dedup ld2
                WHERE ld2.clean_name = ld1.clean_name
                ORDER BY ld2.has_coords DESC, ld2.route_count DESC, ld2.id ASC
                LIMIT 1
            )
        """)
        
        keep_count = cursor.rowcount
        print(f"   ✅ Selected {keep_count} unique locations to keep")
        
        # Step 5: Create ID mapping for foreign key updates
        print("\n🔗 Step 5: Creating ID mapping...")
        
        cursor.execute("DROP TEMPORARY TABLE IF EXISTS location_id_mapping")
        
        cursor.execute("""
            CREATE TEMPORARY TABLE location_id_mapping AS
            SELECT 
                ld.id as old_id,
                (
                    SELECT ltk.id
                    FROM locations_to_keep ltk
                    WHERE LOWER(TRIM(ltk.name)) = ld.clean_name
                    LIMIT 1
                ) as new_id
            FROM locations_dedup ld
        """)
        
        print(f"   ✅ Created ID mapping")
        
        # Step 6: Update foreign keys in buses table
        print("\n🚍 Step 6: Updating buses table foreign keys...")
        
        cursor.execute("""
            UPDATE buses b
            JOIN location_id_mapping m1 ON b.from_location_id = m1.old_id
            SET b.from_location_id = m1.new_id
            WHERE m1.old_id != m1.new_id
        """)
        from_updated = cursor.rowcount
        
        cursor.execute("""
            UPDATE buses b
            JOIN location_id_mapping m2 ON b.to_location_id = m2.old_id
            SET b.to_location_id = m2.new_id
            WHERE m2.old_id != m2.new_id
        """)
        to_updated = cursor.rowcount
        
        print(f"   ✅ Updated from_location: {from_updated} rows")
        print(f"   ✅ Updated to_location: {to_updated} rows")
        
        # Step 7: Update foreign keys in stops table
        print("\n🛑 Step 7: Updating stops table foreign keys...")
        
        cursor.execute("""
            UPDATE stops s
            JOIN location_id_mapping m ON s.location_id = m.old_id
            SET s.location_id = m.new_id
            WHERE m.old_id != m.new_id
        """)
        stops_updated = cursor.rowcount
        print(f"   ✅ Updated stops: {stops_updated} rows")
        
        # Step 8: Delete unused locations
        print("\n🗑️  Step 8: Deleting duplicate and unused locations...")
        
        cursor.execute("""
            DELETE FROM locations
            WHERE id NOT IN (SELECT id FROM locations_to_keep)
        """)
        deleted = cursor.rowcount
        print(f"   ✅ Deleted {deleted} duplicate/unused locations")
        
        # Step 9: Verify results
        print("\n✅ Step 9: Verifying results...")
        
        cursor.execute("SELECT COUNT(*) FROM locations")
        final_count = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(DISTINCT LOWER(TRIM(name))) FROM locations")
        final_unique = cursor.fetchone()[0]
        
        print(f"   Final locations count: {final_count}")
        print(f"   Final unique names: {final_unique}")
        
        if final_count != final_unique:
            print(f"   ⚠️  WARNING: Still have {final_count - final_unique} duplicates!")
        else:
            print(f"   ✅ All duplicates removed!")
        
        # Step 10: Commit changes
        print("\n💾 Step 10: Committing changes...")
        connection.commit()
        
        print(f"\n╔════════════════════════════════════════════════════╗")
        print(f"║  REBUILD COMPLETE!                                 ║")
        print(f"║                                                    ║")
        print(f"║  Before: {total_locations:>6} locations ({unique_names:>6} unique)         ║")
        print(f"║  After:  {final_count:>6} locations ({final_unique:>6} unique)         ║")
        print(f"║  Removed: {deleted:>5} duplicates                        ║")
        print(f"║                                                    ║")
        print(f"║  Backup: {backup_table:<37} ║")
        print(f"╚════════════════════════════════════════════════════╝\n")
        
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
        print("\n⚠️  Rolling back changes...")
        connection.rollback()
        raise
    finally:
        cursor.close()
        connection.close()

if __name__ == '__main__':
    skip_confirmation = '--confirm' in sys.argv
    rebuild_locations(skip_confirmation)
