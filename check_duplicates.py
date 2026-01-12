#!/usr/bin/env python3
import mysql.connector

conn = mysql.connector.connect(host='127.0.0.1', user='root', password='root', database='perundhu')
cursor = conn.cursor()

# Check for Chennai duplicates
cursor.execute("""
    SELECT name, COUNT(*) as count, GROUP_CONCAT(id) as ids 
    FROM locations 
    WHERE name LIKE 'Chennai%' 
    GROUP BY name 
    HAVING COUNT(*) > 1
    ORDER BY count DESC, name
""")

print('=== Duplicate Chennai entries ===')
for row in cursor.fetchall():
    print(f'{row[0]}: {row[1]} duplicates (IDs: {row[2]})')

# Check total duplicates across all locations
cursor.execute("""
    SELECT COUNT(*) 
    FROM (
        SELECT name, COUNT(*) as count 
        FROM locations 
        GROUP BY name 
        HAVING COUNT(*) > 1
    ) as dupes
""")
total_dupes = cursor.fetchone()[0]
print(f'\nTotal location names with duplicates: {total_dupes}')

conn.close()
