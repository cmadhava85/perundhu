#!/usr/bin/env python3
"""Quick status check for locations table"""
import mysql.connector
import subprocess

def get_db_password():
    result = subprocess.run(
        ['gcloud', 'secrets', 'versions', 'access', 'latest', 
         '--secret=db-password', '--project=perundhu-prod-001'],
        capture_output=True, text=True
    )
    return result.stdout.strip()

print("🔑 Getting password...")
password = get_db_password()

print("🔌 Connecting...")
conn = mysql.connector.connect(
    host='127.0.0.1', port=3307, user='perundhu_user',
    password=password, database='RECOVER_YOUR_DATA',
    auth_plugin='mysql_native_password'
)

cursor = conn.cursor()

print("\n" + "="*60)
print("PRODUCTION LOCATIONS STATUS")
print("="*60)

cursor.execute("SELECT COUNT(*) FROM locations")
total = cursor.fetchone()[0]

cursor.execute("SELECT COUNT(DISTINCT LOWER(TRIM(name))) FROM locations")
unique = cursor.fetchone()[0]

cursor.execute("""
    SELECT COUNT(DISTINCT location_id) FROM (
        SELECT from_location_id as location_id FROM buses
        UNION SELECT to_location_id FROM buses
        UNION SELECT location_id FROM stops
    ) used
""")
used = cursor.fetchone()[0]

duplicates = total - unique

print(f"\nTotal locations:     {total:,}")
print(f"Unique names:        {unique:,}")
print(f"Used in routes:      {used:,}")
print(f"Duplicates:          {duplicates:,}")

if duplicates == 0:
    print("\n✅ NO DUPLICATES - Locations table is clean!")
else:
    print(f"\n⚠️  Still have {duplicates:,} duplicate entries")

# Check for backup tables
cursor.execute("SHOW TABLES LIKE 'locations_backup_%'")
backups = cursor.fetchall()
if backups:
    print(f"\n📦 Found {len(backups)} backup table(s):")
    for (table,) in backups:
        cursor.execute(f"SELECT COUNT(*) FROM {table}")
        count = cursor.fetchone()[0]
        print(f"   - {table}: {count:,} rows")

print("="*60 + "\n")

conn.close()
