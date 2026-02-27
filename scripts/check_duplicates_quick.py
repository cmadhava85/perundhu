#!/usr/bin/env python3
import subprocess
import mysql.connector

# Get password from Secret Manager
password = subprocess.check_output([
    'gcloud', 'secrets', 'versions', 'access', 'latest',
    '--secret=db-password',
    '--project=perundhu-prod-001'
], text=True).strip()

# Connect to production database
conn = mysql.connector.connect(
    host='127.0.0.1',
    port=3307,
    user='perundhu_user',
    password=password,
    database='RECOVER_YOUR_DATA'
)

cursor = conn.cursor()

print("=" * 80)
print("PRODUCTION DATABASE - DUPLICATE CHECK")
print("=" * 80)

# Total locations
cursor.execute("SELECT COUNT(*) FROM locations")
total = cursor.fetchone()[0]
print(f"\n✅ Total locations: {total:,}")

# Check for duplicate names
cursor.execute("""
    SELECT COUNT(*) as duplicate_groups
    FROM (
        SELECT name
        FROM locations
        GROUP BY name
        HAVING COUNT(*) > 1
    ) d
""")
dup_groups = cursor.fetchone()[0]
print(f"\n📊 Location groups with duplicate names: {dup_groups:,}")

# Top duplicate names
cursor.execute("""
    SELECT name, COUNT(*) as cnt
    FROM locations
    GROUP BY name
    HAVING cnt > 1
    ORDER BY cnt DESC
    LIMIT 10
""")
dupes = cursor.fetchall()
if dupes:
    print("\nTop duplicate names:")
    for name, cnt in dupes:
        print(f"   '{name}': {cnt} instances")

# Duplicate GPS coordinates
cursor.execute("""
    SELECT COUNT(*) as gps_dupes
    FROM (
        SELECT latitude, longitude
        FROM locations
        WHERE latitude IS NOT NULL AND longitude IS NOT NULL
        GROUP BY latitude, longitude
        HAVING COUNT(*) > 1
    ) g
""")
gps_dup_groups = cursor.fetchone()[0]
print(f"\n📍 Location groups with duplicate GPS: {gps_dup_groups:,}")

# Tamil translations
cursor.execute("SELECT COUNT(*) FROM translations WHERE language_code = 'ta'")
tamil = cursor.fetchone()[0]
print(f"\n🔤 Tamil translations: {tamil:,}")

# Active locations
cursor.execute("""
    SELECT COUNT(DISTINCT loc_id) FROM (
        SELECT from_location_id as loc_id FROM buses
        UNION
        SELECT to_location_id as loc_id FROM buses
        UNION
        SELECT location_id as loc_id FROM stops
    ) active
""")
active = cursor.fetchone()[0]
print(f"📍 Active locations (used in routes): {active:,}")

print("\n" + "=" * 80)

cursor.close()
conn.close()
