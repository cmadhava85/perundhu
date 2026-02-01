#!/usr/bin/env python3
"""Clean up buses with NULL location IDs"""

import mysql.connector
import os

def main():
    conn = mysql.connector.connect(
        host=os.getenv('DB_HOST_PREPROD', '127.0.0.1'),
        port=int(os.getenv('DB_PORT_PREPROD', '3307')),
        user=os.getenv('DB_USER_PREPROD', 'perundhu_user'),
        password=os.getenv('DB_PASSWORD_PREPROD', 'PerundhuTest123456'),
        database=os.getenv('DB_NAME_PREPROD', 'perundhu')
    )
    cursor = conn.cursor()

    # Check current state
    cursor.execute('SELECT COUNT(*) FROM buses WHERE from_location_id IS NULL OR to_location_id IS NULL')
    count_before = cursor.fetchone()[0]
    
    print(f'🔍 Found {count_before:,} buses with NULL location IDs')
    
    if count_before == 0:
        print('✅ Database is already clean!')
        conn.close()
        return
    
    # Show breakdown
    cursor.execute('SELECT COUNT(*) FROM buses WHERE from_location_id IS NULL')
    null_from = cursor.fetchone()[0]
    cursor.execute('SELECT COUNT(*) FROM buses WHERE to_location_id IS NULL')
    null_to = cursor.fetchone()[0]
    
    print(f'   - NULL from_location_id: {null_from:,}')
    print(f'   - NULL to_location_id: {null_to:,}')
    
    # Get list of bus IDs to delete (faster than subquery)
    cursor.execute('SELECT id FROM buses WHERE from_location_id IS NULL OR to_location_id IS NULL')
    bus_ids_to_delete = [row[0] for row in cursor.fetchall()]
    
    if bus_ids_to_delete:
        print(f'\n🗑️  Step 1: Deleting {len(bus_ids_to_delete):,} referenced stops...')
        
        # Delete stops in batches for better performance
        batch_size = 1000
        stops_deleted = 0
        for i in range(0, len(bus_ids_to_delete), batch_size):
            batch = bus_ids_to_delete[i:i+batch_size]
            placeholders = ','.join(['%s'] * len(batch))
            cursor.execute(f'DELETE FROM stops WHERE bus_id IN ({placeholders})', batch)
            stops_deleted += cursor.rowcount
            conn.commit()
            print(f'   Progress: {i+len(batch)}/{len(bus_ids_to_delete)} buses processed, {stops_deleted:,} stops deleted')
        
        print(f'✅ Deleted {stops_deleted:,} stops')
        
        # Now delete buses with NULL locations
        print(f'\n🗑️  Step 2: Deleting {len(bus_ids_to_delete):,} buses with NULL location IDs...')
        for i in range(0, len(bus_ids_to_delete), batch_size):
            batch = bus_ids_to_delete[i:i+batch_size]
            placeholders = ','.join(['%s'] * len(batch))
            cursor.execute(f'DELETE FROM buses WHERE id IN ({placeholders})', batch)
            conn.commit()
        
        deleted = len(bus_ids_to_delete)
        print(f'✅ Deleted {deleted:,} buses with NULL location IDs')
    else:
        print('✅ No buses to delete')
    
    # Verify cleanup
    cursor.execute('SELECT COUNT(*) FROM buses WHERE from_location_id IS NULL OR to_location_id IS NULL')
    count_after = cursor.fetchone()[0]
    
    cursor.execute('SELECT COUNT(*) FROM buses')
    total_remaining = cursor.fetchone()[0]
    
    print(f'\n📊 CLEANUP SUMMARY:')
    print(f'=' * 60)
    print(f'Before:    {count_before + total_remaining:,} total buses')
    print(f'Deleted:   {deleted:,} buses with NULL locations')
    print(f'After:     {total_remaining:,} buses remain')
    print(f'Remaining NULL locations: {count_after:,}')
    print(f'=' * 60)
    
    if count_after == 0:
        print('🎉 All buses now have valid location IDs!')
    else:
        print('⚠️  Warning: Some NULL locations still remain')
    
    conn.close()

if __name__ == '__main__':
    main()
