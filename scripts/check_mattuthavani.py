#!/usr/bin/env python3
import mysql.connector
import subprocess

# Get password
result = subprocess.run(
    ['gcloud', 'secrets', 'versions', 'access', 'latest', 
     '--secret=db-password', '--project=perundhu-prod-001'],
    capture_output=True, text=True
)
password = result.stdout.strip()

# Connect
conn = mysql.connector.connect(
    host='127.0.0.1',
    port=3307,
    user='perundhu_user',
    password=password,
    database='RECOVER_YOUR_DATA',
    auth_plugin='mysql_native_password'
)
cursor = conn.cursor()

# Search for this specific location
cursor.execute("""
    SELECT 
        id,
        name,
        (SELECT COUNT(*) FROM buses b WHERE b.from_location_id = l.id) as from_routes,
        (SELECT COUNT(*) FROM buses b WHERE b.to_location_id = l.id) as to_routes,
        (SELECT COUNT(*) FROM buses b WHERE b.from_location_id = l.id OR b.to_location_id = l.id) as total_routes
    FROM locations l
    WHERE name LIKE '%Mattuthavani%Madurai%' OR name LIKE '%Madurai%Mattuthavani%'
    ORDER BY total_routes DESC, id
""")

results = cursor.fetchall()

print("\n" + "="*100)
print(f"LOCATIONS MATCHING 'Mattuthavani' + 'Madurai'")
print("="*100)
print(f"\nTotal found: {len(results)}")
print("\nDetails:")
print("-"*100)

for id, name, from_routes, to_routes, total_routes in results:
    print(f"\nID: {id}")
    print(f"Name: {name}")
    print(f"Routes FROM this location: {from_routes}")
    print(f"Routes TO this location: {to_routes}")
    print(f"Total routes using this location: {total_routes}")
    print("-"*100)

print(f"\n✅ Found {len(results)} duplicate/similar locations for Mattuthavani, Madurai")

cursor.close()
conn.close()
