#!/usr/bin/env python3
"""Check preprod database for duplicates after import"""
import subprocess
import mysql.connector

# Get password from Secret Manager (preprod project)
password = subprocess.check_output([
    'gcloud', 'secrets', 'versions', 'access', 'latest',
    '--secret=db-password',
    '--project=astute-strategy-406601'
], text=True).strip()

# Connect to preprod database
conn = mysql.connector.connect(
    host='127.0.0.1',
    port=3308,
    user='perundhu_user',
    password=password,
    database='RECOVER_YOUR_DATA'
)

cursor = conn.cursor()

print("=" * 80)
print("PREPROD DATABASE - POST-IMPORT VERIFICATION")
print("=" * 80)

# Total locations
cursor.execute("SELECT COUNT(*) FROM locations")
total = cursor.fetchone()[0]
print(f"\n✅ Total locations imported: {total:,}")

# Check for duplicate names
cursor.execute("""
    SELECT COUNT(*) as duplicate_groups, SUM(cnt-1) as total_dupes
    FROM (
        SELECT name, COUNT(*) as cnt
        FROM locations
        GROUP BY name
        HAVING cnt > 1
    ) d
""")
result = cursor.fetchone()
dup_name_groups = result[0] if result[0] else 0
total_name_dupes = result[1] if result[1] else 0
print(f"\n📊 Duplicate names:")
print(f"   Groups with duplicates: {dup_name_groups:,}")
print(f"   Total duplicate entries: {total_name_dupes:,}")

if dup_name_groups > 0:
    # Show top duplicates
    cursor.execute("""
        SELECT name, COUNT(*) as cnt
        FROM locations
        GROUP BY name
        HAVING cnt > 1
        ORDER BY cnt DESC
        LIMIT 5
    """)
    print(f"\n   Top duplicates:")
    for name, cnt in cursor.fetchall():
        print(f"      '{name}': {cnt} instances")

# Check for duplicate GPS coordinates
cursor.execute("""
    SELECT COUNT(*) as dup_groups, SUM(cnt-1) as total_dupes
    FROM (
        SELECT latitude, longitude, COUNT(*) as cnt
        FROM locations
        WHERE latitude IS NOT NULL AND longitude IS NOT NULL
        GROUP BY latitude, longitude
        HAVING cnt > 1
    ) g
""")
result = cursor.fetchone()
dup_gps_groups = result[0] if result[0] else 0
total_gps_dupes = result[1] if result[1] else 0
print(f"\n📍 Duplicate GPS coordinates:")
print(f"   Groups with duplicates: {dup_gps_groups:,}")
print(f"   Total duplicate entries: {total_gps_dupes:,}")

# Check tables exist
cursor.execute("SHOW TABLES")
tables = [t[0] for t in cursor.fetchall()]
print(f"\n📋 Tables in RECOVER_YOUR_DATA: {len(tables)}")
print(f"   {', '.join(sorted(tables))}")

# Check Tamil translations
if 'translations' in tables:
    cursor.execute("SELECT COUNT(*) FROM translations WHERE language_code = 'ta'")
    tamil = cursor.fetchone()[0]
    print(f"\n🔤 Tamil translations: {tamil:,}")

# Check active locations
if 'buses' in tables and 'stops' in tables:
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
print("\n📌 NEXT STEPS:")
if total_name_dupes > 0 or total_gps_dupes > 0:
    print("   ⚠️  Duplicates found - need to run deduplication")
    print("   1. Run: python3 deduplicate_locations.py --env preprod --confirm")
    print("   2. Run: python3 cleanup_unused_locations.py --env preprod --confirm")
    print("   3. Run: python3 populate_tamil_translations_hybrid.py --env preprod --confirm")
else:
    print("   ✅ No duplicates found!")
    print("   1. Copy tables from RECOVER_YOUR_DATA to perundhu database")
    print("   2. Run: python3 populate_tamil_translations_hybrid.py --env preprod --confirm")
print("=" * 80)

cursor.close()
conn.close()
