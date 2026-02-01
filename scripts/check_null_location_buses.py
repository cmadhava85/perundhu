#!/usr/bin/env python3
"""Check for buses with NULL location IDs"""

import mysql.connector
import os

conn = mysql.connector.connect(
    host=os.getenv('DB_HOST_PREPROD', '127.0.0.1'),
    port=int(os.getenv('DB_PORT_PREPROD', '3307')),
    user=os.getenv('DB_USER_PREPROD', 'perundhu_user'),
    password=os.getenv('DB_PASSWORD_PREPROD', 'PerundhuTest123456'),
    database=os.getenv('DB_NAME_PREPROD', 'perundhu')
)

cursor = conn.cursor()

# Count buses with NULL location IDs
cursor.execute('SELECT COUNT(*) FROM buses WHERE from_location_id IS NULL OR to_location_id IS NULL')
count = cursor.fetchone()[0]

print(f'🚨 BUSES WITH NULL LOCATION IDs: {count:,}')

if count > 0:
    cursor.execute('''
        SELECT id, name, bus_number, from_location_id, to_location_id 
        FROM buses 
        WHERE from_location_id IS NULL OR to_location_id IS NULL 
        LIMIT 10
    ''')
    buses = cursor.fetchall()
    print('\nSample buses with NULL locations:')
    print('=' * 80)
    for bus in buses:
        print(f'Bus #{bus[0]}: {bus[2]} - {bus[1]}')
        print(f'  from_location_id: {bus[3]} | to_location_id: {bus[4]}')
        print('-' * 80)

conn.close()
