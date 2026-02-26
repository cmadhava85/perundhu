#!/usr/bin/env python3
"""Check which location pairs have bus routes."""

import mysql.connector
import subprocess
import sys

def get_db_password():
    """Get database password from gcloud secrets."""
    result = subprocess.run(
        ['gcloud', 'secrets', 'versions', 'access', 'latest', '--secret=db-password'],
        capture_output=True,
        text=True
    )
    return result.stdout.strip()

def main():
    password = get_db_password()
    
    conn = mysql.connector.connect(
        host='127.0.0.1',
        port=3307,
        user='perundhu_user',
        password=password,
        database='perundhu'
    )
    cursor = conn.cursor()
    
    # Check if requested locations exist
    print("=" * 80)
    print("CHECKING REQUESTED LOCATIONS (104730 and 3)")
    print("=" * 80)
    cursor.execute("SELECT id, name FROM locations WHERE id IN (104730, 3)")
    results = cursor.fetchall()
    if results:
        for row in results:
            print(f"✓ ID {row[0]}: {row[1]}")
    else:
        print("✗ Neither location ID exists in database")
    
    print()
    
    # Find top 10 routes with most buses
    print("=" * 80)
    print("TOP 10 ROUTES WITH MOST BUSES")
    print("=" * 80)
    cursor.execute('''
        SELECT 
            l1.id as from_id, 
            l1.name as from_name, 
            l2.id as to_id, 
            l2.name as to_name,
            COUNT(DISTINCT b.id) as bus_count
        FROM buses b
        JOIN locations l1 ON b.start_location_id = l1.id
        JOIN locations l2 ON b.end_location_id = l2.id
        WHERE b.is_active = true
        GROUP BY l1.id, l1.name, l2.id, l2.name
        HAVING bus_count > 0
        ORDER BY bus_count DESC
        LIMIT 10
    ''')
    
    print(f"{'From ID':<8} {'From Location':<35} {'To ID':<8} {'To Location':<35} {'Buses':<6}")
    print("-" * 100)
    for row in cursor.fetchall():
        from_id, from_name, to_id, to_name, count = row
        print(f"{from_id:<8} {from_name:<35} {to_id:<8} {to_name:<35} {count:<6}")
    
    print()
    
    # Sample working search URLs
    print("=" * 80)
    print("SAMPLE WORKING SEARCH URLS")
    print("=" * 80)
    cursor.execute('''
        SELECT 
            l1.id as from_id, 
            l1.name as from_name, 
            l2.id as to_id, 
            l2.name as to_name
        FROM buses b
        JOIN locations l1 ON b.start_location_id = l1.id
        JOIN locations l2 ON b.end_location_id = l2.id
        WHERE b.is_active = true
        GROUP BY l1.id, l1.name, l2.id, l2.name
        LIMIT 3
    ''')
    
    for row in cursor.fetchall():
        from_id, from_name, to_id, to_name = row
        url = f"https://www.perundhu.com/api/v1/bus-schedules/search?fromLocationId={from_id}&toLocationId={to_id}&includeContinuing=true&page=0&size=20"
        print(f"\n{from_name} → {to_name}")
        print(f"curl '{url}' \\")
        print(f"  -H 'accept: application/json' \\")
        print(f"  -H 'user-agent: Mozilla/5.0' \\")
        print(f"  -H 'referer: https://www.perundhu.com/' \\")
        print(f"  -H 'origin: https://www.perundhu.com'")
    
    cursor.close()
    conn.close()

if __name__ == '__main__':
    main()
