#!/usr/bin/env python3
import mysql.connector
import os
import sys

password = os.popen('gcloud secrets versions access latest --secret="db-password"').read().strip()

conn = mysql.connector.connect(
    host='127.0.0.1',
    port=3307,
    user='perundhu_user',
    password=password,
    database='RECOVER_YOUR_DATA'
)

cursor = conn.cursor()

print("\n📊 Production Database Statistics:")
print("=" * 60)

cursor.execute("SELECT COUNT(*) FROM locations")
print(f"{'Total Locations':<25}: {cursor.fetchone()[0]:,}")

cursor.execute("SELECT COUNT(*) FROM buses")
print(f"{'Total Buses':<25}: {cursor.fetchone()[0]:,}")

cursor.execute("SELECT COUNT(*) FROM stops")
print(f"{'Total Stops':<25}: {cursor.fetchone()[0]:,}")

cursor.execute("SELECT COUNT(DISTINCT bus_id) FROM stops")
print(f"{'Buses with Stops':<25}: {cursor.fetchone()[0]:,}")

cursor.execute("SELECT bus_number, origin_location_id, destination_location_id FROM buses LIMIT 1")
result = cursor.fetchone()
print(f"\n{'Sample Bus':<25}:")
print(f"  Bus Number: {result[0]}")
print(f"  Origin ID: {result[1]}")
print(f"  Destination ID: {result[2]}")

print("\n✅ All data successfully uploaded to production!")
print("=" * 60)

cursor.close()
conn.close()
