#!/usr/bin/env python3
"""Check coordinates for specific locations in production database."""

import mysql.connector
import os

# Production database config (via Cloud SQL Proxy)
DB_CONFIG = {
    'host': '127.0.0.1',
    'port': 3306,
    'user': 'perundhu_user',
    'password': 'perundhu_secure_password_2026',
    'database': 'perundhu',
    'charset': 'utf8mb4'
}

def check_locations():
    """Check coordinates for KCBT Kilambakkam and Madurai Mattuthavani."""
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor(dictionary=True)
        
        # Search for the locations
        query = """
        SELECT id, name, latitude, longitude 
        FROM locations 
        WHERE name LIKE %s OR name LIKE %s
        ORDER BY name
        """
        
        cursor.execute(query, ('%KCBT%KILAMBAKKAM%', '%Madurai%Mattuthavani%'))
        results = cursor.fetchall()
        
        print("\n" + "="*80)
        print("LOCATION COORDINATES CHECK")
        print("="*80)
        
        if not results:
            print("\n❌ No locations found matching the criteria")
        else:
            print(f"\n✓ Found {len(results)} location(s):\n")
            
            for loc in results:
                print(f"ID: {loc['id']}")
                print(f"Name: {loc['name']}")
                print(f"Latitude: {loc['latitude']}")
                print(f"Longitude: {loc['longitude']}")
                print("-" * 80)
        
        # If we found exactly 2 locations, calculate distance
        if len(results) == 2:
            from math import radians, sin, cos, sqrt, atan2
            
            lat1, lon1 = results[0]['latitude'], results[0]['longitude']
            lat2, lon2 = results[1]['latitude'], results[1]['longitude']
            
            # Haversine formula
            R = 6371  # Earth radius in km
            
            lat1_rad = radians(lat1)
            lat2_rad = radians(lat2)
            dlat = radians(lat2 - lat1)
            dlon = radians(lon2 - lon1)
            
            a = sin(dlat/2)**2 + cos(lat1_rad) * cos(lat2_rad) * sin(dlon/2)**2
            c = 2 * atan2(sqrt(a), sqrt(1-a))
            distance = R * c
            
            print(f"\n📏 Distance between locations: {distance:.2f} km ({distance*1000:.0f} meters)")
            
            if distance < 0.5:
                print(f"⚠️  ERROR: Distance is less than 500m - coordinates are likely INCORRECT!")
            else:
                print(f"✓ Distance is reasonable for these two cities")
        
        cursor.close()
        conn.close()
        
    except mysql.connector.Error as err:
        print(f"\n❌ Database error: {err}")
    except Exception as e:
        print(f"\n❌ Error: {e}")

if __name__ == '__main__':
    check_locations()
