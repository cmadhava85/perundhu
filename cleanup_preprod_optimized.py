#!/usr/bin/env python3
"""
Optimized preprod duplicate removal with smaller batches and progress tracking.
"""
import mysql.connector
import subprocess
from datetime import datetime

def remove_duplicates_optimized():
    # Get preprod credentials
    result = subprocess.run(
        ['gcloud', 'secrets', 'versions', 'access', 'latest', '--secret=db-password'],
        capture_output=True,
        text=True,
        check=True
    )
    preprod_pwd = result.stdout.strip()
    
    conn = mysql.connector.connect(
        host='127.0.0.1',
        port=3307,
        user='perundhu_user',
        password=preprod_pwd,
        database='perundhu'
    )
    cursor = conn.cursor()
    
    print("Starting preprod duplicate cleanup...\n")
    
    # Get duplicates
    cursor.execute("""
        SELECT id, name FROM locations 
        WHERE name IN (
            SELECT name FROM locations 
            GROUP BY name HAVING COUNT(*) > 1
        )
        ORDER BY name, id
    """)
    
    all_locations = cursor.fetchall()
    
    # Build deletion list (keep first ID of each name, delete others)
    id_to_keep = {}
    ids_to_delete = []
    current_name = None
    
    for loc_id, name in all_locations:
        if name != current_name:
            id_to_keep[name] = loc_id
            current_name = name
        else:
            ids_to_delete.append(loc_id)
    
    print(f"Found {len(ids_to_delete):,} duplicate IDs to delete\n")
    
    # Step 1: Update FK references in small batches
    print("Step 1: Updating foreign key references...")
    fk_batch_size = 100
    updates_made = 0
    
    for i in range(0, len(ids_to_delete), fk_batch_size):
        batch = ids_to_delete[i:i+fk_batch_size]
        placeholders = ','.join(['%s'] * len(batch))
        
        # For each ID in batch, find what ID to map it to
        for old_id in batch:
            # Find the name of this location
            cursor.execute("SELECT name FROM locations WHERE id = %s", (old_id,))
            result = cursor.fetchone()
            if result:
                name = result[0]
                new_id = id_to_keep[name]
                
                # Update both from_location_id and to_location_id
                cursor.execute("UPDATE buses SET from_location_id = %s WHERE from_location_id = %s", (new_id, old_id))
                updates_made += cursor.rowcount
                cursor.execute("UPDATE buses SET to_location_id = %s WHERE to_location_id = %s", (new_id, old_id))
                updates_made += cursor.rowcount
        
        conn.commit()
        if (i // fk_batch_size + 1) % 50 == 0:
            print(f"  Updated FK for {i} IDs ({updates_made} references updated)...")
    
    print(f"✓ Completed FK updates ({updates_made} references changed)\n")
    
    # Step 2: Delete duplicates in small batches
    print("Step 2: Deleting duplicate location rows...")
    delete_batch_size = 500
    total_deleted = 0
    
    for i in range(0, len(ids_to_delete), delete_batch_size):
        batch = ids_to_delete[i:i+delete_batch_size]
        placeholders = ','.join(['%s'] * len(batch))
        cursor.execute(f"DELETE FROM locations WHERE id IN ({placeholders})", batch)
        deleted = cursor.rowcount
        total_deleted += deleted
        conn.commit()
        
        progress = min(i + delete_batch_size, len(ids_to_delete))
        percent = (progress * 100) // len(ids_to_delete)
        print(f"  Deleted {progress:,}/{len(ids_to_delete):,} rows ({percent}%) - {deleted} in this batch")
    
    print(f"\n✅ Successfully deleted {total_deleted:,} duplicate rows\n")
    
    # Verify
    cursor.execute("SELECT COUNT(*) FROM locations")
    total = cursor.fetchone()[0]
    cursor.execute("SELECT COUNT(DISTINCT name) FROM locations")
    unique = cursor.fetchone()[0]
    
    print("=== Final Status ===")
    print(f"Total locations remaining: {total:,}")
    print(f"Unique names: {unique:,}")
    print(f"Duplicates remaining: {total - unique}")
    
    conn.close()

if __name__ == '__main__':
    try:
        remove_duplicates_optimized()
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
