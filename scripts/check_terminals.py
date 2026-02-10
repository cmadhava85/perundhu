#!/usr/bin/env python3
"""Quick check of terminal locations in database"""
import mysql.connector
import os

conn = mysql.connector.connect(
    host='127.0.0.1', 
    port=3307, 
    user='perundhu_user', 
    password=os.getenv('DB_PASSWORD_PREPROD'), 
    database='perundhu'
)
cursor = conn.cursor()

print('=== Chennai Area Terminals ===')
cursor.execute("""
    SELECT id, name FROM locations 
    WHERE name LIKE '%Koyambedu%' OR name LIKE '%CMBT%' 
       OR name LIKE '%Kilambakkam%' OR name LIKE '%Broadway%'
       OR name LIKE '%Tambaram%' OR name LIKE '%Guindy%'
    ORDER BY name LIMIT 20
""")
for row in cursor.fetchall():
    print(f'  ID={row[0]}: {row[1]}')

print('\n=== Madurai Area ===')
cursor.execute("""
    SELECT id, name FROM locations 
    WHERE name LIKE '%Madurai%' OR name LIKE '%Mattuthavani%'
    ORDER BY name LIMIT 15
""")
for row in cursor.fetchall():
    print(f'  ID={row[0]}: {row[1]}')

print('\n=== Coimbatore Area ===')
cursor.execute("""
    SELECT id, name FROM locations 
    WHERE name LIKE '%Coimbatore%' OR name LIKE '%Gandhipuram%' OR name LIKE '%Ukkadam%'
    ORDER BY name LIMIT 15
""")
for row in cursor.fetchall():
    print(f'  ID={row[0]}: {row[1]}')

conn.close()
