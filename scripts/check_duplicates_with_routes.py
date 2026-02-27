#!/usr/bin/env python3
"""Check for duplicate location names that both have routes"""
import mysql.connector
import subprocess

# Get password
result = subprocess.run(
    ['gcloud', 'secrets', 'versions', 'access', 'latest', 
     '--secret=db-password', '--project=perundhu-prod-001'],
    capture_output=True, text=True
)
password = result.stdout.strip()

# Connect to database
conn = mysql.connector.connect(
    host='127.0.0.1',
    port=3307,
    user='perundhu_user',
    password=password,
    database='RECOVER_YOUR_DATA',
    auth_plugin='mysql_native_password'
)
cursor = conn.cursor()

# Find duplicate location names with their route counts
cursor.execute("""
    SELECT 
        name,
        COUNT(*) as duplicate_count,
        GROUP_CONCAT(
            CONCAT(
                'ID:', id, 
                ' Routes:', 
                (SELECT COUNT(*) FROM buses b 
                 WHERE b.from_location_id = l.id OR b.to_location_id = l.id)
            ) 
            ORDER BY id 
            SEPARATOR ' | '
        ) as details
    FROM locations l
    GROUP BY LOWER(TRIM(name))
    HAVING COUNT(*) > 1
    ORDER BY duplicate_count DESC
    LIMIT 30
""")

print("\n" + "="*100)
print("DUPLICATE LOCATIONS WITH ROUTE COUNTS")
print("="*100)

results = cursor.fetchall()
total_duplicates = 0

for name, dup_count, details in results:
    total_duplicates += dup_count - 1  # -1 because one should be kept
    print(f"\n📍 {name}")
    print(f"   Duplicates: {dup_count}")
    print(f"   Details: {details}")

print("\n" + "="*100)
print(f"Total locations shown: {len(results)}")
print(f"Total duplicate entries to clean: {total_duplicates}")
print("="*100)

cursor.close()
conn.close()
