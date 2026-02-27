#!/usr/bin/env python3
import mysql.connector
import subprocess

password = subprocess.run(['gcloud', 'secrets', 'versions', 'access', 'latest', '--secret=db-password', '--project=perundhu-prod-001'], capture_output=True, text=True, timeout=10).stdout.strip()

conn = mysql.connector.connect(host='127.0.0.1', port=3307, user='perundhu_user', password=password, database='RECOVER_YOUR_DATA', auth_plugin='mysql_native_password')
cursor = conn.cursor()

# Check current state
cursor.execute("SELECT COUNT(*) FROM locations")
total = cursor.fetchone()[0]

cursor.execute("SELECT COUNT(DISTINCT LOWER(TRIM(name))) FROM locations")
unique = cursor.fetchone()[0]

# Check for backup tables
cursor.execute("SHOW TABLES LIKE 'locations_backup_%'")
backups = [row[0] for row in cursor.fetchall()]

print(f"Total locations: {total:,}")
print(f"Unique names: {unique:,}")
print(f"Duplicates: {total - unique:,}")
print(f"\nBackup tables: {len(backups)}")
for b in backups:
    cursor.execute(f"SELECT COUNT(*) FROM {b}")
    print(f"  {b}: {cursor.fetchone()[0]:,} rows")

if total == unique:
    print(f"\n✅ YES - All duplicates removed and committed!")
else:
    print(f"\n❌ NO - Still have {total - unique:,} duplicates")

conn.close()
