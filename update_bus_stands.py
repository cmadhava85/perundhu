#!/usr/bin/env python3
import mysql.connector

conn = mysql.connector.connect(
    host='127.0.0.1',
    user='root',
    password='root',
    database='perundhu'
)
cursor = conn.cursor()

# Bus stands that need City - Stand formatting
bus_stands = [
    ('Dharapuram Main Bus Stand', 'Dharapuram - Main'),
    ('Dasarapalle Bus Stop', 'Dasarapalle - Central'),
    ('Parappil Bus Stand', 'Parappil - Central'),
]

print("Updating major bus stands to City - Stand Name format:\n")

for old_name, new_name in bus_stands:
    cursor.execute("UPDATE locations SET name = %s WHERE name = %s", (new_name, old_name))
    updated = cursor.rowcount
    print(f"  {old_name} → {new_name} ({updated} entries)")

conn.commit()

# Show all bus stands with City - Stand format
cursor.execute("""
    SELECT DISTINCT name FROM locations 
    WHERE name LIKE '% - %' AND (name LIKE '%Bus%' OR name LIKE '%Stand%' OR name LIKE '%Terminus%' OR name LIKE '%Terminal%')
    ORDER BY name
""")

print("\n=== All Bus Stands (City - Stand Format) ===")
for row in cursor.fetchall():
    print(f"  {row[0]}")

conn.close()
