#!/usr/bin/env python3
import mysql.connector
from math import radians, sin, cos, sqrt, atan2

# Haversine formula to calculate distance between two coordinates
def haversine_distance(lat1, lon1, lat2, lon2):
    R = 6371  # Earth's radius in kilometers
    
    lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    
    a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
    c = 2 * atan2(sqrt(a), sqrt(1-a))
    distance = R * c
    
    return distance

# Connect to database
conn = mysql.connector.connect(
    host='localhost',
    user='root',
    password='root',
    database='perundhu'
)
cursor = conn.cursor(dictionary=True)

# Get all buses that need route_type classification
cursor.execute("""
    SELECT b.id, b.bus_number, 
           l1.latitude as from_lat, l1.longitude as from_lon,
           l2.latitude as to_lat, l2.longitude as to_lon
    FROM buses b
    JOIN locations l1 ON b.from_location_id = l1.id
    JOIN locations l2 ON b.to_location_id = l2.id
    WHERE (b.route_type IS NULL OR b.route_type = 'LOCAL')
    AND b.from_location_id != b.to_location_id
""")

buses = cursor.fetchall()
update_count = 0
local_count = 0
intercity_count = 0

print(f"Processing {len(buses)} buses...")

for bus in buses:
    if bus['from_lat'] and bus['from_lon'] and bus['to_lat'] and bus['to_lon']:
        try:
            distance = haversine_distance(
                float(bus['from_lat']), float(bus['from_lon']),
                float(bus['to_lat']), float(bus['to_lon'])
            )
            
            route_type = 'INTERCITY' if distance > 50 else 'LOCAL'
            
            cursor.execute("""
                UPDATE buses SET route_type = %s WHERE id = %s
            """, (route_type, bus['id']))
            
            if route_type == 'INTERCITY':
                intercity_count += 1
            else:
                local_count += 1
            update_count += 1
        except Exception as e:
            print(f"Error processing bus {bus['id']}: {e}")

conn.commit()

# Get statistics
cursor.execute("SELECT route_type, COUNT(*) as count FROM buses GROUP BY route_type")
stats = cursor.fetchall()

print(f"\n✅ Updated {update_count} bus route types")
print(f"   - INTERCITY: {intercity_count}")
print(f"   - LOCAL: {local_count}")
print(f"\nFinal route_type distribution:")
for stat in stats:
    print(f"   {stat['route_type']}: {stat['count']}")

# Check the specific Chennai -> Madurai route
cursor.execute("""
    SELECT COUNT(*) as count, route_type FROM buses 
    WHERE from_location_id = 1 AND to_location_id = 62434
    GROUP BY route_type
""")
madurai_routes = cursor.fetchall()
print(f"\nChennai -> Madurai (Mattuthavani) buses: {len(madurai_routes)}")
for route in madurai_routes:
    print(f"   {route['route_type']}: {route['count']}")

cursor.close()
conn.close()
