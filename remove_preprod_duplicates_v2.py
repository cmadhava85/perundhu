#!/usr/bin/env python3
"""
Remove duplicate location entries from PREPROD database - Simple approach
"""
import mysql.connector
import sys
import subprocess
from datetime import datetime

def remove_duplicates(dry_run=True):
    # Get preprod credentials from Secret Manager
    try:
        result = subprocess.run(
            ['gcloud', 'secrets', 'versions', 'access', 'latest', '--secret=db-password'],
            capture_output=True,
            text=True,
            check=True
        )
        preprod_pwd = result.stdout.strip()
        preprod_user = 'perundhu_user'
        print(f"✓ Retrieved password from Secret Manager")
    except Exception as e:
        print(f"❌ Failed to get password from Secret Manager: {e}")
        return 0
    
    try:
        conn = mysql.connector.connect(
            host='127.0.0.1',
            port=3307,
            user=preprod_user,
            password=preprod_pwd,
            database='perundhu'
        )
        print(f"✓ Connected to preprod database")
    except mysql.connector.Error as e:
        print(f"❌ Failed to connect to preprod database: {e}")
        print("Make sure Cloud SQL Proxy is running on port 3307")
        return 0
    
    cursor = conn.cursor()
    
    # Get all duplicate location names with their IDs
    cursor.execute("""
        SELECT name, GROUP_CONCAT(id ORDER BY id) as ids, COUNT(*) as count
        FROM locations 
        GROUP BY name 
        HAVING COUNT(*) > 1
        ORDER BY count DESC
    """)
    
    duplicates = cursor.fetchall()
    
    # Build mapping of old IDs to keep IDs
    id_mapping = {}
    deleted_ids = []
    
    for name, ids_str, count in duplicates:
        ids = [int(x) for x in ids_str.split(',')]
        keep_id = ids[0]
        delete_ids = ids[1:]
        
        for old_id in delete_ids:
            id_mapping[old_id] = keep_id
            deleted_ids.append(old_id)
    
    print(f"{'DRY RUN - ' if dry_run else ''}Found {len(duplicates):,} location names with duplicates in PREPROD")
    print(f"{'Would delete' if dry_run else 'Deleting'} {len(deleted_ids):,} duplicate rows from PREPROD...")
    
    if not dry_run:
        # Create backup file
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        backup_file = f'preprod_deleted_duplicates_{timestamp}.txt'
        with open(backup_file, 'w') as f:
            f.write(f"Deleted duplicate location IDs from PREPROD on {datetime.now()}\n")
            f.write(f"Total deleted: {len(deleted_ids)}\n\n")
            for name, ids_str, count in duplicates:
                ids = [int(x) for x in ids_str.split(',')]
                delete_ids = ids[1:]
                f.write(f"{name}: kept ID {ids[0]}, deleted {delete_ids}\n")
        print(f"Backup saved to: {backup_file}\n")
        
        # Step 1: Update foreign key references
        print("Step 1: Updating foreign key references...")
        updates_count = 0
        for old_id, new_id in id_mapping.items():
            cursor.execute("UPDATE buses SET from_location_id = %s WHERE from_location_id = %s", (new_id, old_id))
            updates_count += cursor.rowcount
            cursor.execute("UPDATE buses SET to_location_id = %s WHERE to_location_id = %s", (new_id, old_id))
            updates_count += cursor.rowcount
            
            if updates_count > 0 and updates_count % 100 == 0:
                print(f"  Updated {updates_count} foreign key references...")
                conn.commit()
        
        conn.commit()
        print(f"✓ Updated {updates_count} foreign key references\n")
        
        # Step 2: Delete duplicates
        print("Step 2: Deleting duplicate location rows...")
        batch_size = 500
        deleted_count = 0
        for i in range(0, len(deleted_ids), batch_size):
            batch = deleted_ids[i:i+batch_size]
            placeholders = ','.join(['%s'] * len(batch))
            cursor.execute(f"DELETE FROM locations WHERE id IN ({placeholders})", batch)
            deleted_count += cursor.rowcount
            conn.commit()
            print(f"  Deleted {deleted_count}/{len(deleted_ids)} rows...")
        
        print(f"\n✅ Successfully deleted {deleted_count:,} duplicate rows from PREPROD")
        
        # Verify
        cursor.execute("SELECT COUNT(*) FROM locations")
        remaining = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(DISTINCT name) FROM locations")
        unique = cursor.fetchone()[0]
        print(f"   Remaining locations: {remaining:,}")
        print(f"   Unique names: {unique:,}")
        print(f"   Duplicates remaining: {remaining - unique}")
    
    conn.close()
    return len(deleted_ids)

if __name__ == '__main__':
    if len(sys.argv) > 1 and sys.argv[1] == '--apply':
        print("⚠️  REMOVING DUPLICATES FROM PREPROD DATABASE ⚠️\n")
        remove_duplicates(dry_run=False)
    else:
        print("=== DRY RUN MODE (use --apply to actually delete) ===\n")
        remove_duplicates(dry_run=True)
