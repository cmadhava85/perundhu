#!/usr/bin/env python3
"""
Fast preprod duplicate cleanup - delete only unused duplicates
"""
import mysql.connector
import subprocess

def fast_cleanup():
    result = subprocess.run(
        ['gcloud', 'secrets', 'versions', 'access', 'latest', '--secret=db-password'],
        capture_output=True, text=True, check=True
    )
    pwd = result.stdout.strip()
    
    conn = mysql.connector.connect(
        host='127.0.0.1', port=3307, user='perundhu_user',
        password=pwd, database='perundhu'
    )
    cursor = conn.cursor()
    
    print("Fast preprod duplicate cleanup\n")
    
    # Step 1: Get all duplicate IDs
    cursor.execute("""
        SELECT id FROM locations
        WHERE name IN (
            SELECT name FROM locations GROUP BY name HAVING COUNT(*) > 1
        )
        AND id NOT IN (
            SELECT MIN(id) FROM locations GROUP BY name HAVING COUNT(*) > 1
        )
        ORDER BY id
    """)
    
    all_dup_ids = [row[0] for row in cursor.fetchall()]
    print(f"Found {len(all_dup_ids):,} duplicate IDs to delete\n")
    
    # Step 2: Find which duplicates are NOT used in buses table
    print("Checking which duplicates are safe to delete...")
    used_ids = set()
    
    placeholders = ','.join(['%s'] * min(len(all_dup_ids), 10000))
    batch_size = 10000
    
    for i in range(0, len(all_dup_ids), batch_size):
        batch = all_dup_ids[i:i+batch_size]
        placeholders = ','.join(['%s'] * len(batch))
        
        cursor.execute(f"SELECT DISTINCT from_location_id FROM buses WHERE from_location_id IN ({placeholders})", batch)
        used_ids.update(row[0] for row in cursor.fetchall())
        
        cursor.execute(f"SELECT DISTINCT to_location_id FROM buses WHERE to_location_id IN ({placeholders})", batch)
        used_ids.update(row[0] for row in cursor.fetchall())
        
        print(f"  Checked {min(i+batch_size, len(all_dup_ids))}/{len(all_dup_ids)} IDs...")
    
    safe_to_delete = [id for id in all_dup_ids if id not in used_ids]
    print(f"\n✓ Found {len(safe_to_delete):,} safe duplicates to delete immediately")
    print(f"⚠️  Found {len(used_ids & set(all_dup_ids)):,} duplicates referenced in buses table (need FK updates)\n")
    
    # Step 3: Delete safe duplicates
    if safe_to_delete:
        print("Deleting safe duplicates...")
        delete_batch = 1000
        for i in range(0, len(safe_to_delete), delete_batch):
            batch = safe_to_delete[i:i+delete_batch]
            placeholders = ','.join(['%s'] * len(batch))
            cursor.execute(f"DELETE FROM locations WHERE id IN ({placeholders})", batch)
            conn.commit()
            
            progress = min(i + delete_batch, len(safe_to_delete))
            print(f"  Deleted {progress:,}/{len(safe_to_delete):,} safe duplicates...")
    
    # Verify
    cursor.execute("SELECT COUNT(*) FROM locations")
    total = cursor.fetchone()[0]
    cursor.execute("SELECT COUNT(DISTINCT name) FROM locations")
    unique = cursor.fetchone()[0]
    
    print(f"\n=== Progress ===")
    print(f"Deleted: {len(safe_to_delete):,} safe duplicates")
    print(f"Remaining: {total:,} total locations")
    print(f"Unique: {unique:,} unique names")
    print(f"Still have duplicates: {total - unique}")
    
    if len(used_ids & set(all_dup_ids)) > 0:
        print(f"\n⚠️  Next step: Update {len(used_ids & set(all_dup_ids)):,} FK references in buses table")
        print("Then delete the remaining duplicates")
    
    conn.close()

if __name__ == '__main__':
    try:
        fast_cleanup()
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
