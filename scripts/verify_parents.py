#!/usr/bin/env python3
"""Verify parent relationships and fix city types"""
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

# Check if parent relationships were set
cursor.execute("SELECT COUNT(*) FROM locations WHERE parent_id IS NOT NULL")
count = cursor.fetchone()[0]
print(f"Locations with parent_id set: {count}")

# Show examples
cursor.execute("""
    SELECT c.name as terminal, p.name as city 
    FROM locations c 
    JOIN locations p ON c.parent_id = p.id 
    LIMIT 10
""")
print("\nExamples of parent-child relationships:")
for row in cursor.fetchall():
    print(f"  {row[0]} → {row[1]}")

# Fix the city type update
print("\nMarking parent locations as CITY type...")
cursor.execute("""
    CREATE TEMPORARY TABLE temp_parent_ids AS 
    SELECT DISTINCT parent_id FROM locations WHERE parent_id IS NOT NULL
""")
cursor.execute("""
    UPDATE locations SET location_type = 'CITY' 
    WHERE id IN (SELECT parent_id FROM temp_parent_ids)
""")
updated = cursor.rowcount
cursor.execute("DROP TEMPORARY TABLE temp_parent_ids")
conn.commit()
print(f"Marked {updated} locations as CITY type")

conn.close()
print("\n✅ Done!")
