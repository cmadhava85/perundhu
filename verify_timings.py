#!/usr/bin/env python3
import mysql.connector

config = {
    'host': 'localhost',
    'user': 'root',
    'password': 'root123',
    'database': 'bus_tracker_db'
}

conn = mysql.connector.connect(**config)
cursor = conn.cursor()

# Check route 5E with timing data
cursor.execute("""
    SELECT bus_number, departure_time, COUNT(*) as count
    FROM buses
    WHERE bus_number = '5E'
    GROUP BY bus_number, departure_time
    ORDER BY departure_time
    LIMIT 30
""")

print("Route 5E with timing data:")
count = 0
for row in cursor.fetchall():
    print(f"  Departure: {row[1]}")
    count += 1

# Check total count
cursor.execute("SELECT COUNT(*) FROM buses WHERE bus_number = '5E'")
total_5e = cursor.fetchone()[0]
print(f"\nTotal route 5E records: {total_5e}")

# Check total buses
cursor.execute("SELECT COUNT(*) FROM buses")
total = cursor.fetchone()[0]
print(f"Total buses in database: {total}")

cursor.close()
conn.close()
