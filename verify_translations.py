#!/usr/bin/env python3
"""Verify Tamil translations were added correctly"""
import mysql.connector

conn = mysql.connector.connect(
    host='localhost',
    port=3306,
    user='root',
    password='root',
    database='perundhu'
)

cursor = conn.cursor(dictionary=True)

# Show sample translations
print("\n✅ Sample Tamil Translations Added:\n" + "=" * 80)
cursor.execute("""
    SELECT l.id, l.name, t.translated_value as tamil_name
    FROM locations l
    INNER JOIN translations t ON t.entity_id = l.id 
        AND t.entity_type = 'location' 
        AND t.language_code = 'ta'
    ORDER BY l.name
    LIMIT 20
""")

for row in cursor.fetchall():
    print(f"ID {row['id']:5d} | {row['name']:35s} → {row['tamil_name']}")

# Count statistics
cursor.execute("""
    SELECT 
        COUNT(DISTINCT l.id) as total_locations,
        COUNT(DISTINCT t.entity_id) as translated_locations
    FROM locations l
    LEFT JOIN translations t ON t.entity_id = l.id 
        AND t.entity_type = 'location' 
        AND t.language_code = 'ta'
""")
stats = cursor.fetchone()

print("\n" + "=" * 80)
print(f"Total locations:      {stats['total_locations']:,}")
print(f"With Tamil translation: {stats['translated_locations']:,}")
print(f"Translation coverage:  {stats['translated_locations']*100//stats['total_locations']}%")
print("=" * 80)

cursor.close()
conn.close()
