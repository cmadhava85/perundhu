#!/usr/bin/env python3
"""
Check translation coverage for locations
"""
import mysql.connector
import subprocess

def get_db_password():
    result = subprocess.run(
        ['gcloud', 'secrets', 'versions', 'access', 'latest', 
         '--secret=db-password', '--project=perundhu-prod-001'],
        capture_output=True, text=True, timeout=10
    )
    return result.stdout.strip()

print("\n" + "="*70)
print("PRODUCTION DATABASE STATUS - DATA COVERAGE ANALYSIS")
print("="*70)

password = get_db_password()
conn = mysql.connector.connect(
    host='127.0.0.1', port=3307, user='perundhu_user',
    password=password, database='RECOVER_YOUR_DATA',
    auth_plugin='mysql_native_password'
)

cursor = conn.cursor()

# 1. Locations Table
print("\n📍 LOCATIONS TABLE:")
cursor.execute("SELECT COUNT(*) FROM locations")
total_locations = cursor.fetchone()[0]
print(f"   Total locations: {total_locations:,}")

cursor.execute("SELECT COUNT(DISTINCT LOWER(TRIM(name))) FROM locations")
unique_names = cursor.fetchone()[0]
print(f"   Unique names: {unique_names:,}")
print(f"   Duplicates: {total_locations - unique_names:,}")

# 2. Buses Table
print("\n🚌 BUSES TABLE:")
cursor.execute("SELECT COUNT(*) FROM buses")
total_buses = cursor.fetchone()[0]
print(f"   Total bus routes: {total_buses:,}")

cursor.execute("SELECT COUNT(DISTINCT bus_number) FROM buses")
unique_buses = cursor.fetchone()[0]
print(f"   Unique bus numbers: {unique_buses:,}")

# 3. Stops Table
print("\n🛑 STOPS TABLE:")
cursor.execute("SELECT COUNT(*) FROM stops")
total_stops = cursor.fetchone()[0]
print(f"   Total stops: {total_stops:,}")

# 4. Translations Table - CRITICAL!
print("\n🌍 TRANSLATIONS TABLE (for Tamil support):")
cursor.execute("SELECT COUNT(*) FROM translations")
total_translations = cursor.fetchone()[0]
print(f"   Total translations: {total_translations:,}")

cursor.execute("""
    SELECT language_code, COUNT(*) 
    FROM translations 
    GROUP BY language_code
""")
lang_breakdown = cursor.fetchall()
if lang_breakdown:
    print("   Breakdown by language:")
    for lang, count in lang_breakdown:
        print(f"      {lang}: {count:,} entries")
else:
    print("   ⚠️  NO TRANSLATIONS FOUND!")

cursor.execute("""
    SELECT COUNT(DISTINCT entity_id) 
    FROM translations 
    WHERE entity_type = 'location' AND language_code = 'ta'
""")
tamil_locations = cursor.fetchone()[0]
print(f"\n   Locations with Tamil translations: {tamil_locations:,}")

if total_locations > 0:
    tamil_coverage = (tamil_locations / total_locations) * 100
    print(f"   Tamil coverage: {tamil_coverage:.2f}%")

# 5. Sample Tamil translations
print("\n📝 SAMPLE TAMIL TRANSLATIONS (if any):")
cursor.execute("""
    SELECT l.name, t.translated_value 
    FROM locations l
    JOIN translations t ON t.entity_id = l.id AND t.entity_type = 'location'
    WHERE t.language_code = 'ta' AND t.field_name = 'name'
    LIMIT 5
""")
samples = cursor.fetchall()
if samples:
    for en_name, ta_name in samples:
        print(f"   {en_name} → {ta_name}")
else:
    print("   ❌ No Tamil translations found")

# Summary
print("\n" + "="*70)
print("SUMMARY & RECOMMENDATIONS:")
print("="*70)

if total_locations - unique_names > 0:
    print(f"⚠️  ACTION NEEDED: Remove {total_locations - unique_names:,} duplicate locations")
    print("   → Run: rebuild_locations_from_data.py --confirm")

if tamil_locations == 0:
    print(f"\n❌ CRITICAL: NO Tamil translations for {total_locations:,} locations!")
    print("   Impact: Tamil users CANNOT search for locations")
    print("   → Need to populate translations table with Tamil location names")
elif tamil_coverage < 50:
    print(f"\n⚠️  WARNING: Only {tamil_coverage:.1f}% Tamil coverage")
    print(f"   Missing translations for {total_locations - tamil_locations:,} locations")

if total_buses == 0:
    print(f"\n⚠️  WARNING: No bus routes in database")
    print("   → Need to load bus data")

print("\n" + "="*70 + "\n")

conn.close()
