#!/usr/bin/env python3
"""
Quick check for production duplicates - saves to file
"""

import mysql.connector
import subprocess

def get_db_password():
    """Get database password from Secret Manager"""
    result = subprocess.run(
        ['gcloud', 'secrets', 'versions', 'access', 'latest', 
         '--secret=db-password', '--project=perundhu-prod-001'],
        capture_output=True, text=True
    )
    if result.returncode != 0:
        raise Exception(f"Failed to get password: {result.stderr}")
    return result.stdout.strip()

print("🔑 Getting database password...")
password = get_db_password()

print("🔌 Connecting to production database...")
connection = mysql.connector.connect(
    host='127.0.0.1',
    port=3307,
    user='perundhu_user',
    password=password,
    database='RECOVER_YOUR_DATA',
    auth_plugin='mysql_native_password',
    connection_timeout=300
)

cursor = connection.cursor(buffered=True)

print("⏳ Finding duplicate location names...")
cursor.execute("""
    SELECT LOWER(TRIM(name)) as clean_name, COUNT(*) as cnt
    FROM locations
    GROUP BY LOWER(TRIM(name))
    HAVING COUNT(*) > 1
    ORDER BY COUNT(*) DESC
""")

duplicate_names = cursor.fetchall()

print(f"\n✅ Found {len(duplicate_names)} duplicate location names")
print(f"   Writing details to production_duplicates.txt...\n")

total_to_delete = 0

with open('/Users/mchand69/Documents/project/perundhu/scripts/production_duplicates.txt', 'w') as f:
    f.write(f"PRODUCTION DUPLICATES REPORT\n")
    f.write(f"{'='*80}\n\n")
    f.write(f"Total duplicate location names: {len(duplicate_names)}\n\n")
    
    for i, (clean_name, count) in enumerate(duplicate_names[:50], 1):  # First 50 detailed
        total_to_delete += (count - 1)
        
        cursor.execute("""
            SELECT id,
                (SELECT COUNT(*) FROM buses WHERE from_location_id = l.id) +
                (SELECT COUNT(*) FROM buses WHERE to_location_id = l.id) +
                (SELECT COUNT(*) FROM stops WHERE location_id = l.id) as route_count
            FROM locations l
            WHERE LOWER(TRIM(name)) = %s
            ORDER BY id
        """, (clean_name,))
        
        entries = cursor.fetchall()
        details = ' | '.join([f'ID:{id} ({routes} routes)' for id, routes in entries])
        
        f.write(f"{i}. '{clean_name}' ({count} entries)\n")
        f.write(f"   {details}\n\n")
        
        if i % 10 == 0:
            print(f"   Progress: {i}/50...")
    
    # Count the rest without details
    for _, count in duplicate_names[50:]:
        total_to_delete += (count - 1)
    
    if len(duplicate_names) > 50:
        f.write(f"\n... and {len(duplicate_names) - 50} more duplicate names (not shown in detail)\n")
    
    f.write(f"\n{'='*80}\n")
    f.write(f"SUMMARY:\n")
    f.write(f"  Total duplicate location names: {len(duplicate_names)}\n")
    f.write(f"  Total duplicate entries to delete: {total_to_delete}\n")
    f.write(f"  (Keeping 1 per location name, deleting {total_to_delete} duplicates)\n")
    f.write(f"{'='*80}\n")

cursor.close()
connection.close()

print(f"\n╔{'='*60}╗")
print(f"║  SUMMARY{'':53}║")
print(f"║  Total duplicate names: {len(duplicate_names):<38} ║")
print(f"║  Total entries to delete: {total_to_delete:<35} ║")
print(f"║  Report saved to: production_duplicates.txt{'':21}  ║")
print(f"╚{'='*60}╝\n")
