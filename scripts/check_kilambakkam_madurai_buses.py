#!/usr/bin/env python3
"""Check buses from Kilambakkam to Madurai in preprod database"""

import mysql.connector
import os

def main():
    # Connect to database
    conn = mysql.connector.connect(
        host=os.getenv('DB_HOST_PREPROD', '127.0.0.1'),
        port=int(os.getenv('DB_PORT_PREPROD', '3307')),
        user=os.getenv('DB_USER_PREPROD', 'perundhu_user'),
        password=os.getenv('DB_PASSWORD_PREPROD', 'PerundhuTest123456'),
        database=os.getenv('DB_NAME_PREPROD', 'perundhu')
    )
    cursor = conn.cursor(dictionary=True)

    # Find Kilambakkam locations
    cursor.execute("""
        SELECT id, name, district 
        FROM locations 
        WHERE name LIKE '%Kilambakkam%' OR name LIKE '%kilambakkam%'
    """)
    kilambakkam = cursor.fetchall()

    # Find Madurai locations
    cursor.execute("""
        SELECT id, name, district 
        FROM locations 
        WHERE name LIKE '%Madurai%' OR name LIKE '%madurai%'
    """)
    madurai = cursor.fetchall()

    print('📍 KILAMBAKKAM LOCATIONS:')
    print('=' * 80)
    for loc in kilambakkam:
        print(f"ID: {loc['id']}, Name: {loc['name']}, District: {loc['district']}")

    print('\n📍 MADURAI LOCATIONS:')
    print('=' * 80)
    for loc in madurai:
        print(f"ID: {loc['id']}, Name: {loc['name']}, District: {loc['district']}")

    if kilambakkam and madurai:
        kilam_ids = [loc['id'] for loc in kilambakkam]
        madurai_ids = [loc['id'] for loc in madurai]
        
        # Find buses
        query = f"""
            SELECT 
                b.id,
                b.name as bus_name,
                b.bus_number,
                b.category,
                fl.name as from_location,
                fl.district as from_district,
                tl.name as to_location,
                tl.district as to_district,
                b.departure_time,
                b.arrival_time,
                b.capacity,
                b.active,
                b.rating,
                b.features
            FROM buses b
            JOIN locations fl ON b.from_location_id = fl.id
            JOIN locations tl ON b.to_location_id = tl.id
            WHERE b.from_location_id IN ({','.join(map(str, kilam_ids))})
              AND b.to_location_id IN ({','.join(map(str, madurai_ids))})
            ORDER BY b.departure_time
        """
        
        cursor.execute(query)
        buses = cursor.fetchall()
        
        print(f'\n🚌 BUSES FROM KILAMBAKKAM TO MADURAI:')
        print('=' * 80)
        print(f'Found {len(buses)} buses\n')
        
        if buses:
            for bus in buses:
                print(f"Bus #{bus['id']}: {bus['bus_number']} - {bus['bus_name']}")
                print(f"  Category: {bus['category']} | Rating: {bus['rating'] or 'N/A'}")
                print(f"  From: {bus['from_location']} ({bus['from_district']})")
                print(f"  To: {bus['to_location']} ({bus['to_district']})")
                print(f"  Departure: {bus['departure_time']} | Arrival: {bus['arrival_time']}")
                print(f"  Capacity: {bus['capacity']} seats | Active: {bool(bus['active'])}")
                print(f"  Features: {bus['features'] or 'None'}")
                print('-' * 80)
        else:
            print("❌ No buses found on this route")
    else:
        if not kilambakkam:
            print("\n❌ No Kilambakkam location found in database")
        if not madurai:
            print("\n❌ No Madurai location found in database")

    conn.close()

if __name__ == '__main__':
    main()
