#!/usr/bin/env python3
"""Check active status of Chennai → Madurai buses."""

import mysql.connector
import os

def check_bus_status():
    """Check and display bus active status."""
    conn = mysql.connector.connect(
        host='127.0.0.1',
        port=3306,
        user='root',
        password='',
        database='perundhu'
    )
    
    cursor = conn.cursor(dictionary=True)
    
    # Check active field values for Chennai → Madurai buses
    print("=" * 80)
    print("CHENNAI → MADURAI BUSES - ACTIVE STATUS")
    print("=" * 80)
    
    query = """
        SELECT id, bus_number, active, from_location_id, to_location_id, 
               departure_time, arrival_time
        FROM buses 
        WHERE from_location_id = 1 AND to_location_id = 3
        ORDER BY departure_time
        LIMIT 15
    """
    
    cursor.execute(query)
    buses = cursor.fetchall()
    
    print(f"\nFound {len(buses)} buses:\n")
    for bus in buses:
        active_status = "✓ ACTIVE" if bus['active'] else "✗ INACTIVE" if bus['active'] is not None else "NULL (treated as active)"
        print(f"ID: {bus['id']}, Bus: {bus['bus_number']}, Active: {active_status}")
        print(f"   From: {bus['from_location_id']}, To: {bus['to_location_id']}")
        print(f"   Departure: {bus['departure_time']}, Arrival: {bus['arrival_time']}")
        print()
    
    # Check active field distribution
    print("=" * 80)
    print("ACTIVE FIELD DISTRIBUTION")
    print("=" * 80)
    
    dist_query = """
        SELECT 
            active,
            COUNT(*) as count
        FROM buses 
        WHERE from_location_id = 1 AND to_location_id = 3
        GROUP BY active
    """
    
    cursor.execute(dist_query)
    distribution = cursor.fetchall()
    
    for row in distribution:
        print(f"Active={row['active']}: {row['count']} buses")
    
    # Check bus 162VUD that appears in search results
    print("\n" + "=" * 80)
    print("BUS 162VUD DETAILS (The one appearing in search)")
    print("=" * 80)
    
    bus_query = """
        SELECT id, bus_number, active, from_location_id, to_location_id, 
               departure_time, arrival_time
        FROM buses 
        WHERE bus_number = '162VUD'
    """
    
    cursor.execute(bus_query)
    buses_162 = cursor.fetchall()
    
    for bus in buses_162:
        print(f"\nID: {bus['id']}, Bus: {bus['bus_number']}")
        print(f"   Active: {bus['active']}")
        print(f"   From: {bus['from_location_id']} → To: {bus['to_location_id']}")
        print(f"   Departure: {bus['departure_time']}, Arrival: {bus['arrival_time']}")
    
    cursor.close()
    conn.close()

if __name__ == '__main__':
    try:
        check_bus_status()
    except mysql.connector.Error as e:
        print(f"MySQL Error: {e}")
    except Exception as e:
        print(f"Error: {e}")
