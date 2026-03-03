#!/usr/bin/env python3
"""Verify production database has correct coordinates."""

import mysql.connector

DB_CONFIG = {
    'host': '127.0.0.1',
    'port': 3306,
    'user': 'perundhu_user',
    'password': 'perundhu_secure_password_2026',
    'database': 'perundhu',
    'charset': 'utf8mb4'
}

try:
    conn = mysql.connector.connect(**DB_CONFIG)
    cursor = conn.cursor(dictionary=True)
    
    query = """
    SELECT name, latitude, longitude 
    FROM locations 
    WHERE name IN ('KCBT KILAMBAKKAM', 'Madurai - Mattuthavani')
    ORDER BY name
    """
    
    cursor.execute(query)
    results = cursor.fetchall()
    
    print("\n" + "="*80)
    print("PRODUCTION DATABASE COORDINATES")
    print("="*80 + "\n")
    
    for loc in results:
        print(f"Name: {loc['name']}")
        print(f"Latitude: {loc['latitude']}")
        print(f"Longitude: {loc['longitude']}")
        print("-" * 80)
        
        # Check if invalid
        if abs(loc['latitude']) < 0.01 and abs(loc['longitude']) < 0.01:
            print("❌ INVALID COORDINATES (0.0, 0.0)\n")
        else:
            print("✓ Valid coordinates\n")
    
    cursor.close()
    conn.close()
    
except Exception as e:
    print(f"\n❌ Error: {e}")
    print("\nTrying alternative approach...")
    print("Run: python3 fast_prod_upload.py --locations-only")
