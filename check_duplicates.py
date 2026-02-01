#!/usr/bin/env python3
import mysql.connector
import os

db_config = {
    'host': os.getenv('DB_HOST_PREPROD', '127.0.0.1'),
    'port': int(os.getenv('DB_PORT_PREPROD', '3307')),
    'user': os.getenv('DB_USER_PREPROD', 'perundhu_user'),
    'password': os.getenv('DB_PASSWORD_PREPROD'),
    'database': os.getenv('DB_NAME_PREPROD', 'perundhu')
}

conn = mysql.connector.connect(**db_config)
cursor = conn.cursor()

# Get counts
cursor.execute("SELECT COUNT(*) FROM locations")
loc_count = cursor.fetchone()[0]

cursor.execute("""
    SELECT COUNT(*) FROM (
        SELECT name, district FROM locations 
        GROUP BY name, district HAVING COUNT(*) > 1
    ) t
""")
dup_groups = cursor.fetchone()[0]

print("=" * 60)
print("LOCATIONS TABLE STATUS")
print("=" * 60)
print(f"Total locations:        {loc_count:,}")
print(f"Duplicate groups:       {dup_groups:,}")
print("=" * 60)

conn.close()
