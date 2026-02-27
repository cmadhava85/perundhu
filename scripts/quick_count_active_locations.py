#!/usr/bin/env python3
"""Quick count of active locations needing Tamil translation"""

import subprocess
import mysql.connector

# Get password
password = subprocess.check_output([
    'gcloud', 'secrets', 'versions', 'access', 'latest',
    '--secret=db-password', '--project=perundhu-prod-001'
], text=True).strip()

# Connect
conn = mysql.connector.connect(
    host='127.0.0.1',
    port=3307,
    user='perundhu_user',
    password=password,
    database='RECOVER_YOUR_DATA'
)
cursor = conn.cursor()

print("="*70)
print("QUICK COUNT: Active Locations Needing Tamil Translation")
print("="*70)

# Total locations
cursor.execute("SELECT COUNT(*) FROM locations")
total_locations = cursor.fetchone()[0]
print(f"\nTotal locations in database: {total_locations:,}")

# Locations with Tamil translation
cursor.execute("""
    SELECT COUNT(DISTINCT entity_id) 
    FROM translations 
    WHERE entity_type = 'location' AND language_code = 'ta'
""")
with_tamil = cursor.fetchone()[0]
print(f"Already have Tamil translation: {with_tamil:,}")

# Active locations (used in buses/stops)
cursor.execute("""
    SELECT COUNT(DISTINCT l.id)
    FROM locations l
    WHERE EXISTS (SELECT 1 FROM buses WHERE from_location_id = l.id OR to_location_id = l.id)
       OR EXISTS (SELECT 1 FROM stops WHERE location_id = l.id)
""")
active_locations = cursor.fetchone()[0]
print(f"Active locations (used in routes): {active_locations:,}")

# Active locations WITHOUT Tamil translation
cursor.execute("""
    SELECT COUNT(DISTINCT l.id)
    FROM locations l
    LEFT JOIN translations t 
        ON t.entity_type = 'location' 
        AND t.entity_id = l.id 
        AND t.language_code = 'ta'
    WHERE t.id IS NULL
    AND (
        EXISTS (SELECT 1 FROM buses WHERE from_location_id = l.id OR to_location_id = l.id)
        OR EXISTS (SELECT 1 FROM stops WHERE location_id = l.id)
    )
""")
need_translation = cursor.fetchone()[0]
print(f"\n✅ ACTIVE locations needing Tamil: {need_translation:,}")
print(f"   (These are the ones we'll translate)")

# Sample of locations to translate
print(f"\n📍 Sample locations that need translation:")
cursor.execute("""
    SELECT l.id, l.name
    FROM locations l
    LEFT JOIN translations t 
        ON t.entity_type = 'location' 
        AND t.entity_id = l.id 
        AND t.language_code = 'ta'
    WHERE t.id IS NULL
    AND (
        EXISTS (SELECT 1 FROM buses WHERE from_location_id = l.id OR to_location_id = l.id)
        OR EXISTS (SELECT 1 FROM stops WHERE location_id = l.id)
    )
    LIMIT 10
""")
for row in cursor.fetchall():
    print(f"   • ID {row[0]}: {row[1]}")

print(f"\n💰 Estimated cost (OSM free, Google ~$1-2):")
print(f"   • If OSM covers 70%: {int(need_translation * 0.3)} locations × $0.0006 = ${need_translation * 0.3 * 0.0006:.2f}")
print(f"   • If OSM covers 50%: {int(need_translation * 0.5)} locations × $0.0006 = ${need_translation * 0.5 * 0.0006:.2f}")

cursor.close()
conn.close()

print("\n" + "="*70)
print("✅ To proceed with translation:")
print("   python3 populate_tamil_translations_hybrid.py --confirm")
print("="*70)
