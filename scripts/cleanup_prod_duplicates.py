#!/usr/bin/env python3
"""
Production duplicate cleanup with optimized queries for large datasets
"""

import mysql.connector
import subprocess
import sys

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

def check_duplicates(connection):
    """Check for duplicate locations - optimized for large dataset"""
    cursor = connection.cursor(buffered=True)
    
    print("\n═══════════════════════════════════════════════════")
    print("  CHECKING DUPLICATES IN PRODUCTION")
    print("═══════════════════════════════════════════════════\n")
    
    try:
        # Step 1: Simple query to find duplicate names (fast)
        print("⏳ Step 1: Finding duplicate location names...")
        cursor.execute("""
            SELECT LOWER(TRIM(name)) as clean_name, COUNT(*) as cnt
            FROM locations
            GROUP BY LOWER(TRIM(name))
            HAVING COUNT(*) > 1
            ORDER BY COUNT(*) DESC
        """)
        
        duplicate_names = cursor.fetchall()
        
        if not duplicate_names:
            print("✅ No duplicates found!")
            cursor.close()
            return 0
        
        print(f"✅ Found {len(duplicate_names)} duplicate location names\n")
        
        # Step 2: For each duplicate, get details (separate small queries)
        print("⏳ Step 2: Getting details for duplicates (showing first 30)...")
        
        total_duplicate_entries = 0
        shown = 0
        
        for clean_name, count in duplicate_names:
            total_duplicate_entries += (count - 1)  # -1 because we keep one
            
            if shown < 30:
                # Get IDs and route counts for this specific location
                cursor.execute("""
                    SELECT id,
                        (SELECT COUNT(*) FROM buses WHERE from_location_id = l.id) +
                        (SELECT COUNT(*) FROM buses WHERE to_location_id = l.id) +
                        (SELECT COUNT(*) FROM stops WHERE location_id = l.id) as route_count
                    FROM locations l
                    WHERE LOWER(TRIM(name)) = %s
                    ORDER BY id
                """, (clean_name,))
                
                entries = cursor.fetchall()
                details = ' | '.join([f'ID:{id} ({routes} routes)' for id, routes in entries])
                
                print(f"  📍 '{clean_name}' ({count} entries)")
                print(f"     {details}\n")
                shown += 1
        
        if len(duplicate_names) > 30:
            remaining = len(duplicate_names) - 30
            print(f"  ... and {remaining} more duplicate names\n")
        
        print(f"╔═════════════════════════════════════════════════╗")
        print(f"║  TOTAL DUPLICATE ENTRIES TO REMOVE: {total_duplicate_entries:>10}  ║")
        print(f"╚═════════════════════════════════════════════════╝")
        
        cursor.close()
        return total_duplicate_entries
        
    except Exception as e:
        print(f"\n❌ Error checking duplicates: {e}")
        import traceback
        traceback.print_exc()
        cursor.close()
        return 0

def cleanup_duplicates(connection):
    """Remove duplicate locations, keeping the one with most routes"""
    cursor = connection.cursor(buffered=True)
    
    print("\n═══════════════════════════════════════════════════")
    print("  CLEANING UP DUPLICATES")
    print("═══════════════════════════════════════════════════\n")
    
    # First, get all duplicate names
    print("⏳ Step 1: Finding all duplicate location names...")
    cursor.execute("""
        SELECT LOWER(TRIM(name)) as clean_name, COUNT(*) as cnt
        FROM locations
        GROUP BY LOWER(TRIM(name))
        HAVING COUNT(*) > 1
    """)
    
    duplicate_names = [row[0] for row in cursor.fetchall()]
    print(f"   Found {len(duplicate_names)} duplicate names to process\n")
    
    total_deleted = 0
    
    # Process each duplicate name
    print("⏳ Step 2: Removing duplicates (keeping one with most routes)...")
    for i, clean_name in enumerate(duplicate_names, 1):
        if i % 10 == 0:
            print(f"   Progress: {i}/{len(duplicate_names)} processed...")
        
        # Find the ID to keep (most routes)
        cursor.execute("""
            SELECT id,
                (SELECT COUNT(*) FROM buses WHERE from_location_id = l.id) +
                (SELECT COUNT(*) FROM buses WHERE to_location_id = l.id) +
                (SELECT COUNT(*) FROM stops WHERE location_id = l.id) as route_count
            FROM locations l
            WHERE LOWER(TRIM(name)) = %s
            ORDER BY route_count DESC, id ASC
            LIMIT 1
        """, (clean_name,))
        
        result = cursor.fetchone()
        if not result:
            continue
            
        keep_id = result[0]
        
        # Delete all other IDs with this name
        cursor.execute("""
            DELETE FROM locations
            WHERE LOWER(TRIM(name)) = %s AND id != %s
        """, (clean_name, keep_id))
        
        deleted = cursor.rowcount
        total_deleted += deleted
    
    connection.commit()
    
    print(f"\n✅ Cleanup complete!")
    print(f"   Total locations deleted: {total_deleted}")
    
    cursor.close()
    return total_deleted

def main():
    print("\n╔════════════════════════════════════════════════════╗")
    print("║  PRODUCTION DUPLICATE LOCATION CLEANUP             ║")
    print("╚════════════════════════════════════════════════════╝\n")
    
    # Check if --confirm flag is provided
    skip_confirmation = '--confirm' in sys.argv
    
    print("🔑 Getting database password...")
    password = get_db_password()
    
    print("🔌 Connecting to production database...")
    connection = mysql.connector.connect(
        host='127.0.0.1',
        port=3307,
        user='perundhu_user',
        password=password,
        database='RECOVER_YOUR_DATA',
        auth_plugin='mysql_native_password',
        connection_timeout=300  # 5 minutes timeout
    )
    
    try:
        # Check duplicates first
        duplicate_count = check_duplicates(connection)
        
        if duplicate_count == 0:
            print("\n✅ No duplicates to clean!")
            return
        
        # Confirm before cleanup
        if not skip_confirmation:
            print(f"\n⚠️  WARNING: This will delete {duplicate_count} duplicate location entries.")
            print("   Only one entry per location name will be kept (the one with most routes).")
            response =input("\n   Do you want to proceed? (yes/no): ")
            
            if response.lower() != 'yes':
                print("\n❌ Cleanup cancelled by user.")
                return
        
        # Run cleanup
        deleted = cleanup_duplicates(connection)
        
        print(f"\n╔════════════════════════════════════════════════════╗")
        print(f"║  CLEANUP SUMMARY                                   ║")
        print(f"║  Total locations deleted: {deleted:>27}  ║")
        print(f"╚════════════════════════════════════════════════════╝\n")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        connection.rollback()
        raise
    finally:
        connection.close()

if __name__ == '__main__':
    main()
