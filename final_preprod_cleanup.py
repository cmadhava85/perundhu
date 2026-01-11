import mysql.connector, subprocess

result = subprocess.run(['gcloud', 'secrets', 'versions', 'access', 'latest', '--secret=db-password'], capture_output=True, text=True, check=True)
pwd = result.stdout.strip()

conn = mysql.connector.connect(host='127.0.0.1', port=3307, user='perundhu_user', password=pwd, database='perundhu')
cursor = conn.cursor()

# Get the remaining duplicates and their keep IDs
cursor.execute("""
    SELECT name, GROUP_CONCAT(id ORDER BY id) as ids
    FROM locations
    WHERE name IN (
        SELECT name FROM locations GROUP BY name HAVING COUNT(*) > 1
    )
    GROUP BY name
""")

duplicates = cursor.fetchall()
print(f"Found {len(duplicates)} location(s) with duplicates\n")

for name, ids_str in duplicates:
    ids = [int(x) for x in ids_str.split(',')]
    keep_id = ids[0]
    delete_ids = ids[1:]
    
    print(f"Fixing: {name}")
    print(f"  Keep ID {keep_id}, delete {delete_ids}")
    
    for old_id in delete_ids:
        cursor.execute("UPDATE buses SET from_location_id = %s WHERE from_location_id = %s", (keep_id, old_id))
        updated1 = cursor.rowcount
        cursor.execute("UPDATE buses SET to_location_id = %s WHERE to_location_id = %s", (keep_id, old_id))
        updated2 = cursor.rowcount
        conn.commit()
        print(f"    Updated FK for ID {old_id} ({updated1 + updated2} rows)")

# Get IDs to keep
cursor.execute("""
    SELECT id FROM locations
    WHERE id = (SELECT MIN(id) FROM locations l2 WHERE l2.name = locations.name)
""")
keep_ids = [row[0] for row in cursor.fetchall()]

# Delete everything that's not in keep_ids
cursor.execute(f"DELETE FROM locations WHERE id NOT IN ({','.join(map(str, keep_ids))})")

deleted = cursor.rowcount
conn.commit()
print(f"\n✅ Deleted {deleted} duplicate location(s)")

# Verify
cursor.execute("SELECT COUNT(*) FROM locations")
total = cursor.fetchone()[0]
cursor.execute("SELECT COUNT(DISTINCT name) FROM locations")
unique = cursor.fetchone()[0]

print(f"\n=== PREPROD Database - Final Status ===")
print(f"Total locations: {total:,}")
print(f"Unique names: {unique:,}")
print(f"Duplicates remaining: {total - unique}")

if total == unique:
    print("\n✅ PREPROD DATABASE CLEANUP COMPLETE - NO DUPLICATES!")

conn.close()
