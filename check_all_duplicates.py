#!/usr/bin/env python3
import mysql.connector

conn = mysql.connector.connect(host='127.0.0.1', user='root', password='root', database='perundhu')
cursor = conn.cursor()

# Get all duplicate location names with their counts and IDs
cursor.execute("""
    SELECT name, COUNT(*) as count, GROUP_CONCAT(id ORDER BY id) as ids 
    FROM locations 
    GROUP BY name 
    HAVING COUNT(*) > 1
    ORDER BY count DESC, name
    LIMIT 50
""")

print('=== Top 50 Duplicate Location Names ===\n')
duplicates = cursor.fetchall()
for row in duplicates:
    print(f'{row[0]}: {row[1]} duplicates (IDs: {row[2]})')

print(f'\n=== Summary ===')

# Get total counts
cursor.execute("""
    SELECT COUNT(*) 
    FROM (
        SELECT name, COUNT(*) as count 
        FROM locations 
        GROUP BY name 
        HAVING COUNT(*) > 1
    ) as dupes
""")
total_duplicate_names = cursor.fetchone()[0]

cursor.execute("""
    SELECT SUM(count) - COUNT(*) as total_duplicate_rows
    FROM (
        SELECT name, COUNT(*) as count 
        FROM locations 
        GROUP BY name 
        HAVING COUNT(*) > 1
    ) as dupes
""")
total_duplicate_rows = cursor.fetchone()[0]

cursor.execute("SELECT COUNT(*) FROM locations")
total_locations = cursor.fetchone()[0]

cursor.execute("SELECT COUNT(DISTINCT name) FROM locations")
unique_names = cursor.fetchone()[0]

print(f'Total location rows: {total_locations:,}')
print(f'Unique location names: {unique_names:,}')
print(f'Location names with duplicates: {total_duplicate_names:,}')
print(f'Extra duplicate rows (can be deleted): {total_duplicate_rows:,}')

# Show which columns differ between duplicates (check a sample)
print(f'\n=== Checking if duplicates differ in other columns ===')
cursor.execute("""
    SELECT l1.id, l1.name, l1.latitude, l1.longitude, l1.type, l1.region, l1.district
    FROM locations l1
    WHERE l1.name = 'Chennai'
    ORDER BY l1.id
""")
chennai_rows = cursor.fetchall()
print(f'\nChennai entries ({len(chennai_rows)} rows):')
for row in chennai_rows:
    print(f'  ID {row[0]}: lat={row[2]}, lng={row[3]}, type={row[4]}, region={row[5]}, district={row[6]}')

conn.close()
