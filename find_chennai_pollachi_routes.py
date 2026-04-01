#!/usr/bin/env python3
"""
Find connecting routes between specific cities (Chennai <-> Pollachi)
Queries production database for actual test data.
"""

import mysql.connector
import sys
import os

def get_db_config():
    """Get production database configuration"""
    return {
        'host': os.getenv('DB_HOST_PROD', '127.0.0.1'),
        'port': int(os.getenv('DB_PORT_PROD', '3307')),
        'user': os.getenv('DB_USER_PROD', 'perundhu_user'),
        'password': os.getenv('DB_PASSWORD_PROD', ''),
        'database': os.getenv('DB_NAME_PROD', 'perundhu'),
    }

def get_password():
    """Try to get password from environment or Secret Manager"""
    pw = os.getenv('DB_PASSWORD_PROD', '').strip()
    if pw:
        return pw
    
    # Try Secret Manager
    try:
        import subprocess
        result = subprocess.run(
            ['gcloud', 'secrets', 'versions', 'access', 'latest', 
             '--secret=db-password', '--project=perundhu-prod-001'],
            capture_output=True, text=True, timeout=10
        )
        if result.returncode == 0:
            return result.stdout.strip()
    except Exception:
        pass
    
    # Prompt user
    import getpass
    return getpass.getpass("Enter production database password: ")

def find_location(cursor, name):
    """Find location ID by name (fuzzy match)"""
    query = """
    SELECT id, name_english, name_tamil, location_type
    FROM location
    WHERE name_english LIKE %s
    ORDER BY 
        CASE 
            WHEN name_english = %s THEN 1
            WHEN name_english LIKE %s THEN 2
            ELSE 3
        END
    LIMIT 5
    """
    cursor.execute(query, (f'%{name}%', name, f'{name}%'))
    return cursor.fetchall()

def find_routes_between(cursor, from_loc_id, to_loc_id):
    """Find direct routes between two locations"""
    query = """
    SELECT 
        b.id, b.bus_number, b.bus_name,
        l_from.name_english as from_name,
        l_to.name_english as to_name
    FROM bus b
    JOIN location l_from ON b.from_location_id = l_from.id
    JOIN location l_to ON b.to_location_id = l_to.id
    WHERE b.from_location_id = %s AND b.to_location_id = %s
    LIMIT 10
    """
    cursor.execute(query, (from_loc_id, to_loc_id))
    return cursor.fetchall()

def find_connecting_via(cursor, from_loc_id, to_loc_id, max_hubs=10):
    """Find connecting routes via intermediate hubs"""
    # Find potential intermediate hubs (cities with many connections)
    query = """
    SELECT DISTINCT
        intermediate.id as hub_id,
        intermediate.name_english as hub_name,
        COUNT(DISTINCT CONCAT(b1.id, '-', b2.id)) as path_count
    FROM location intermediate
    JOIN bus b1 ON (b1.to_location_id = intermediate.id)
    JOIN bus b2 ON (b2.from_location_id = intermediate.id)
    WHERE b1.from_location_id = %s
      AND b2.to_location_id = %s
      AND b1.from_location_id != b2.to_location_id
    GROUP BY intermediate.id, intermediate.name_english
    ORDER BY path_count DESC
    LIMIT %s
    """
    cursor.execute(query, (from_loc_id, to_loc_id, max_hubs))
    hubs = cursor.fetchall()
    
    results = []
    for hub in hubs:
        # Get sample leg 1 routes
        leg1_query = """
        SELECT b.id, b.bus_number, b.bus_name,
               l_from.name_english as from_name,
               l_to.name_english as to_name
        FROM bus b
        JOIN location l_from ON b.from_location_id = l_from.id
        JOIN location l_to ON b.to_location_id = l_to.id
        WHERE b.from_location_id = %s AND b.to_location_id = %s
        LIMIT 3
        """
        cursor.execute(leg1_query, (from_loc_id, hub['hub_id']))
        leg1_routes = cursor.fetchall()
        
        # Get sample leg 2 routes
        leg2_query = """
        SELECT b.id, b.bus_number, b.bus_name,
               l_from.name_english as from_name,
               l_to.name_english as to_name
        FROM bus b
        JOIN location l_from ON b.from_location_id = l_from.id
        JOIN location l_to ON b.to_location_id = l_to.id
        WHERE b.from_location_id = %s AND b.to_location_id = %s
        LIMIT 3
        """
        cursor.execute(leg2_query, (hub['hub_id'], to_loc_id))
        leg2_routes = cursor.fetchall()
        
        if leg1_routes and leg2_routes:
            results.append({
                'hub': hub,
                'leg1_routes': leg1_routes,
                'leg2_routes': leg2_routes
            })
    
    return results

def main():
    print("=" * 80)
    print("FIND CONNECTING ROUTES: CHENNAI ↔ POLLACHI")
    print("=" * 80)
    print()
    
    config = get_db_config()
    config['password'] = get_password()
    
    try:
        print("🔗 Connecting to production database...")
        conn = mysql.connector.connect(**config)
        cursor = conn.cursor(dictionary=True)
        print("✅ Connected\n")
        
        # ==================================================================
        # STEP 1: Find locations
        # ==================================================================
        print("=" * 80)
        print("STEP 1: FINDING LOCATIONS")
        print("=" * 80)
        print()
        
        print("🔍 Searching for 'Chennai'...")
        chennai_results = find_location(cursor, 'Chennai')
        
        if not chennai_results:
            print("❌ No locations found matching 'Chennai'")
            return
        
        print(f"Found {len(chennai_results)} location(s):")
        for i, loc in enumerate(chennai_results, 1):
            print(f"  {i}. {loc['name_english']:40} (ID: {loc['id']:5}) - {loc['location_type']}")
        
        chennai_id = chennai_results[0]['id']
        chennai_name = chennai_results[0]['name_english']
        print(f"\n✓ Using: {chennai_name} (ID: {chennai_id})")
        print()
        
        print("🔍 Searching for 'Pollachi'...")
        pollachi_results = find_location(cursor, 'Pollachi')
        
        if not pollachi_results:
            print("❌ No locations found matching 'Pollachi'")
            return
        
        print(f"Found {len(pollachi_results)} location(s):")
        for i, loc in enumerate(pollachi_results, 1):
            print(f"  {i}. {loc['name_english']:40} (ID: {loc['id']:5}) - {loc['location_type']}")
        
        pollachi_id = pollachi_results[0]['id']
        pollachi_name = pollachi_results[0]['name_english']
        print(f"\n✓ Using: {pollachi_name} (ID: {pollachi_id})")
        print()
        
        # ==================================================================
        # STEP 2: Check for direct routes
        # ==================================================================
        print("=" * 80)
        print("STEP 2: CHECKING FOR DIRECT ROUTES")
        print("=" * 80)
        print()
        
        print(f"🔍 Chennai → Pollachi (direct)...")
        direct_fwd = find_routes_between(cursor, chennai_id, pollachi_id)
        if direct_fwd:
            print(f"   Found {len(direct_fwd)} direct route(s):")
            for route in direct_fwd:
                print(f"   • {route['bus_number']} - {route['bus_name']}")
        else:
            print("   ✗ No direct routes")
        print()
        
        print(f"🔍 Pollachi → Chennai (direct)...")
        direct_rev = find_routes_between(cursor, pollachi_id, chennai_id)
        if direct_rev:
            print(f"   Found {len(direct_rev)} direct route(s):")
            for route in direct_rev:
                print(f"   • {route['bus_number']} - {route['bus_name']}")
        else:
            print("   ✗ No direct routes")
        print()
        
        # ==================================================================
        # STEP 3: Find connecting routes
        # ==================================================================
        print("=" * 80)
        print("STEP 3: FINDING CONNECTING ROUTES")
        print("=" * 80)
        print()
        
        print(f"🔍 Chennai → Pollachi (via transfer hubs)...")
        connecting_fwd = find_connecting_via(cursor, chennai_id, pollachi_id)
        
        if not connecting_fwd:
            print("   ❌ No connecting routes found")
        else:
            print(f"   ✅ Found connecting routes via {len(connecting_fwd)} hub(s)\n")
            
            for i, conn in enumerate(connecting_fwd, 1):
                print(f"{'─' * 80}")
                print(f"Option {i}: Via {conn['hub']['hub_name']} ({conn['hub']['path_count']} possible combinations)")
                print(f"{'─' * 80}")
                
                # Show sample leg 1
                print(f"\nLeg 1: {chennai_name} → {conn['hub']['hub_name']}")
                for route in conn['leg1_routes'][:2]:  # Show first 2
                    print(f"  • Bus {route['bus_number']} - {route['bus_name']}")
                    print(f"    (ID: {route['id']})")
                
                # Show sample leg 2
                print(f"\nLeg 2: {conn['hub']['hub_name']} → {pollachi_name}")
                for route in conn['leg2_routes'][:2]:  # Show first 2
                    print(f"  • Bus {route['bus_number']} - {route['bus_name']}")
                    print(f"    (ID: {route['id']})")
                
                print()
                
                # Generate API test command
                sample_leg1 = conn['leg1_routes'][0]
                sample_leg2 = conn['leg2_routes'][0]
                
                print(f"🧪 Test this connecting route:")
                print(f"curl 'http://localhost:8080/api/v1/bus-schedules/connecting-routes"
                      f"?fromLocationId={chennai_id}"
                      f"&toLocationId={pollachi_id}"
                      f"&maxTransfers=2' | jq")
                print()
        
        print()
        print(f"🔍 Pollachi → Chennai (via transfer hubs)...")
        connecting_rev = find_connecting_via(cursor, pollachi_id, chennai_id)
        
        if not connecting_rev:
            print("   ❌ No connecting routes found")
        else:
            print(f"   ✅ Found connecting routes via {len(connecting_rev)} hub(s)")
            print(f"\n   (Similar structure to forward direction)")
        
        print()
        
        # ==================================================================
        # SUMMARY
        # ==================================================================
        print("=" * 80)
        print("SUMMARY")
        print("=" * 80)
        print()
        print(f"Route: {chennai_name} (ID: {chennai_id}) ↔ {pollachi_name} (ID: {pollachi_id})")
        print()
        print(f"Direct routes found:")
        print(f"  • Chennai → Pollachi: {len(direct_fwd)} route(s)")
        print(f"  • Pollachi → Chennai: {len(direct_rev)} route(s)")
        print()
        print(f"Connecting routes found:")
        print(f"  • Chennai → Pollachi: {len(connecting_fwd)} transfer hub(s)")
        print(f"  • Pollachi → Chennai: {len(connecting_rev)} transfer hub(s)")
        print()
        
        if connecting_fwd or connecting_rev:
            print("✅ This is a GOOD test case for connecting routes!")
            print()
            print("Recommended test:")
            print(f"  1. Search Chennai → Pollachi on frontend")
            print(f"  2. Expect to see connecting routes (no direct)")
            print(f"  3. Verify transfer details are displayed correctly")
        else:
            print("⚠️  No connecting routes found - may need different cities")
        
        print()
        
        cursor.close()
        conn.close()
        
    except mysql.connector.Error as e:
        print(f"❌ Database error: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == '__main__':
    main()
