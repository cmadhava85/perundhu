#!/usr/bin/env python3
import pymysql

conn = pymysql.connect(
    host='127.0.0.1',
    port=3307,
    user='perundhu_user',
    password='PerundhuTest123456',
    database='perundhu'
)
cur = conn.cursor()

print('🔍 Finding buses with NULL to_location_id...')
cur.execute('SELECT id FROM buses WHERE to_location_id IS NULL LIMIT 5')
samples = cur.fetchall()
print(f'Sample IDs: {[r[0] for r in samples]}')

print('🗑️  Deleting stops for these buses using JOIN...')
cur.execute('''
    DELETE s FROM stops s
    INNER JOIN buses b ON s.bus_id = b.id
    WHERE b.to_location_id IS NULL
''')
deleted_stops = cur.rowcount
print(f'✅ Deleted {deleted_stops} stops')

print('🗑️  Deleting buses with NULL to_location_id...')
cur.execute('DELETE FROM buses WHERE to_location_id IS NULL')
deleted_buses = cur.rowcount
print(f'✅ Deleted {deleted_buses} buses')

conn.commit()
conn.close()

print('✅ Cleanup complete!')
