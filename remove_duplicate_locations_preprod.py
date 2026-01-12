#!/usr/bin/env python3
"""
Remove duplicate location entries from PREPROD database.
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
    except Exception as e:
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
    total_to_delete = 0
    deleted_ids = []
    
    print(f"{'DRY RUN - ' if dry_run else ''}Found {len(duplicates):,} location names with duplicates in PREPROD\n")
    
    for name, ids_str, count in duplicates:
        ids = [int(x) for x in ids_str.split(',')]
        keep_id = ids[0]  # Keep the first (lowest) ID
        delete_ids = ids[1:]  # Delete all others
        
        total_to_delete += len(delete_ids)
        deleted_ids.extend(delete_ids)
        
        if dry_run and len(deleted_ids) <= 10:  # Show first 10 examples
            print(f"  '{name}': Keep ID {keep_id}, delete {len(delete_ids)} duplicate(s): {delete_ids[:5]}" + 
                  (f"... +{len(delete_ids)-5} more" if len(delete_ids) > 5 else ""))
    
    print(f"\n{'Would delete' if dry_run else 'Deleting'} {total_to_delete:,} duplicate rows from PREPROD...")
    
    if not dry_run:
        # Create backup file
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        backup_file = f'preprod_deleted_duplicates_{timestamp}.txt'
        with open(backup_file, 'w') as f:
            f.write(f"Deleted duplicate location IDs from PREPROD on {datetime.now()}\n")
            f.write(f"Total deleted: {total_to_delete}\n\n")
            for name, ids_str, count in duplicates:
                ids = [int(x) for x in ids_str.split(',')]
                delete_ids = ids[1:]
                f.write(f"{name}: kept ID {ids[0]}, deleted {delete_ids}\n")
        
        print(f"Backup saved to: {backup_file}")
        
        # First, update foreign key references in dependent tables (in batches)
        print("\nUpdating foreign key references in batches...")
        batch_num = 0
        for i in range(0, len(duplicates), 100):
            batch = duplicates[i:i+100]
            batch_num += 1
            
            for name, ids_str, count in batch:
                ids = [int(x) for x in ids_str.split(',')]
                keep_id = ids[0]
                delete_ids = ids[1:]
                
                # Update buses table - from_location_id
                placeholders = ','.join(['%s'] * len(delete_ids))
                cursor.execute(
                    f"UPDATE buses SET from_location_id = %s WHERE from_location_id IN ({placeholders})",
                    [keep_id] + delete_ids
                )
                
                # Update buses table - to_location_id
                cursor.execute(
                    f"UPDATE buses SET to_location_id = %s WHERE to_location_id IN ({placeholders})",
                    [keep_id] + delete_ids
                )
            
            conn.commit()  # Commit after each batch of 100 names
            if batch_num % 50 == 0:
                print(f"  Updated FK batch {batch_num}/{(len(duplicates)-1)//100 + 1}")
        
        print(f"✓ Foreign key references updated ({batch_num} batches)")
        
        # Delete duplicates in batches
        batch_size = 1000
        for i in range(0, len(deleted_ids), batch_size):
            batch = deleted_ids[i:i+batch_size]
            placeholders = ','.join(['%s'] * len(batch))
            cursor.execute(f"DELETE FROM locations WHERE id IN ({placeholders})", batch)
            print(f"  Deleted batch {i//batch_size + 1}/{(len(deleted_ids)-1)//batch_size + 1}")
        
        conn.commit()
        print(f"\n✅ Successfully deleted {total_to_delete:,} duplicate rows from PREPROD")
        
        # Verify
        cursor.execute("SELECT COUNT(*) FROM locations")
        remaining = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(DISTINCT name) FROM locations")
        unique = cursor.fetchone()[0]
        print(f"   Remaining locations: {remaining:,}")
        print(f"   Unique names: {unique:,}")
        print(f"   Duplicates remaining: {remaining - unique}")
    
    conn.close()
    return total_to_delete

if __name__ == '__main__':
    if len(sys.argv) > 1 and sys.argv[1] == '--apply':
        print("⚠️  REMOVING DUPLICATES FROM PREPROD DATABASE ⚠️\n")
        remove_duplicates(dry_run=False)
    else:
        print("=== DRY RUN MODE (use --apply to actually delete) ===\n")
        remove_duplicates(dry_run=True)
