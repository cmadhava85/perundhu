#!/usr/bin/env python3
"""
Remove duplicate location entries, keeping only the first occurrence (lowest ID).
This will clean up 36,101 duplicate rows.
"""
import mysql.connector
import sys
from datetime import datetime

def remove_duplicates(dry_run=True):
    conn = mysql.connector.connect(host='127.0.0.1', user='root', password='root', database='perundhu')
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
    
    print(f"{'DRY RUN - ' if dry_run else ''}Found {len(duplicates):,} location names with duplicates\n")
    
    for name, ids_str, count in duplicates:
        ids = [int(x) for x in ids_str.split(',')]
        keep_id = ids[0]  # Keep the first (lowest) ID
        delete_ids = ids[1:]  # Delete all others
        
        total_to_delete += len(delete_ids)
        deleted_ids.extend(delete_ids)
        
        if dry_run and len(deleted_ids) <= 10:  # Show first 10 examples
            print(f"  '{name}': Keep ID {keep_id}, delete {len(delete_ids)} duplicate(s): {delete_ids[:5]}" + 
                  (f"... +{len(delete_ids)-5} more" if len(delete_ids) > 5 else ""))
    
    print(f"\n{'Would delete' if dry_run else 'Deleting'} {total_to_delete:,} duplicate rows...")
    
    if not dry_run:
        # Create backup file
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        backup_file = f'deleted_duplicates_{timestamp}.txt'
        with open(backup_file, 'w') as f:
            f.write(f"Deleted duplicate location IDs on {datetime.now()}\n")
            f.write(f"Total deleted: {total_to_delete}\n\n")
            for name, ids_str, count in duplicates:
                ids = [int(x) for x in ids_str.split(',')]
                delete_ids = ids[1:]
                f.write(f"{name}: kept ID {ids[0]}, deleted {delete_ids}\n")
        
        print(f"Backup saved to: {backup_file}")
        
        # Delete duplicates in batches
        batch_size = 1000
        for i in range(0, len(deleted_ids), batch_size):
            batch = deleted_ids[i:i+batch_size]
            placeholders = ','.join(['%s'] * len(batch))
            cursor.execute(f"DELETE FROM locations WHERE id IN ({placeholders})", batch)
            print(f"  Deleted batch {i//batch_size + 1}/{(len(deleted_ids)-1)//batch_size + 1}")
        
        conn.commit()
        print(f"\n✅ Successfully deleted {total_to_delete:,} duplicate rows")
        
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
        print("⚠️  REMOVING DUPLICATES FROM DATABASE ⚠️\n")
        remove_duplicates(dry_run=False)
    else:
        print("=== DRY RUN MODE (use --apply to actually delete) ===\n")
        remove_duplicates(dry_run=True)
