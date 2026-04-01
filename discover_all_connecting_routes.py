#!/usr/bin/env python3
"""
Discover ALL connecting routes in production database.
Finds multiple city pairs that require transfers - perfect for testing.
"""

import mysql.connector
import sys
import os
from collections import defaultdict

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
    
    import getpass
    return getpass.getpass("Enter production database password: ")

def main():
    print("=" * 100)
    print("DISCOVER ALL CONNECTING ROUTES - PRODUCTION DATABASE SCANNER")
    print("=" * 100)
    print()
    print("This script will scan your entire production database to find:")
    print("  • Major transfer hubs (cities with many connections)")
    print("  • City pairs that require transfers (no direct route)")
    print("  • Actual connecting route examples for testing")
    print()
    
    config = get_db_config()
    config['password'] = get_password()
    
    try:
        print("🔗 Connecting to production database...")
        conn = mysql.connector.connect(**config)
        cursor = conn.cursor(dictionary=True)
        print("✅ Connected\n")
        
        # ==================================================================
        # STEP 1: Database Overview
        # ==================================================================
        print("=" * 100)
        print("STEP 1: DATABASE OVERVIEW")
        print("=" * 100)
        print()
        
        cursor.execute("SELECT COUNT(*) as count FROM bus")
        bus_count = cursor.fetchone()['count']
        
        cursor.execute("SELECT COUNT(*) as count FROM location")
        location_count = cursor.fetchone()['count']
        
        cursor.execute("SELECT COUNT(DISTINCT location_type) as count FROM location")
        location_types = cursor.fetchone()['count']
        
        print(f"📊 Total Buses:       {bus_count:,}")
        print(f"📊 Total Locations:   {location_count:,}")
        print(f"📊 Location Types:    {location_types}")
        print()
        
        if bus_count < 20:
            print("⚠️  WARNING: Database has very few buses. Connecting routes may be limited.")
            print()
        
        # ==================================================================
        # STEP 2: Find Major Hubs
        # ==================================================================
        print("=" * 100)
        print("STEP 2: IDENTIFYING MAJOR TRANSFER HUBS")
        print("=" * 100)
        print()
        
        query = """
        SELECT 
            l.id,
            l.name_english,
            l.location_type,
            COUNT(DISTINCT CASE WHEN b.from_location_id = l.id THEN b.id END) as outgoing_buses,
            COUNT(DISTINCT CASE WHEN b.to_location_id = l.id THEN b.id END) as incoming_buses,
            COUNT(DISTINCT b.id) as total_connections
        FROM location l
        LEFT JOIN bus b ON (b.from_location_id = l.id OR b.to_location_id = l.id)
        GROUP BY l.id, l.name_english, l.location_type
        HAVING COUNT(DISTINCT b.id) >= 5
        ORDER BY total_connections DESC
        LIMIT 20
        """
        
        cursor.execute(query)
        hubs = cursor.fetchall()
        
        if not hubs:
            print("❌ No major hubs found (need locations with 5+ connections)")
            print("   Cannot test connecting routes without transfer hubs.")
            return
        
        print(f"Found {len(hubs)} major hubs:\n")
        print(f"{'#':<4} {'Location':<30} {'Type':<15} {'Out':<5} {'In':<5} {'Total':<6}")
        print("-" * 100)
        
        for i, hub in enumerate(hubs, 1):
            print(f"{i:<4} {hub['name_english']:<30} {hub['location_type']:<15} "
                  f"{hub['outgoing_buses']:<5} {hub['incoming_buses']:<5} {hub['total_connections']:<6}")
        
        print()
        
        # ==================================================================
        # STEP 3: Build Route Graph
        # ==================================================================
        print("=" * 100)
        print("STEP 3: BUILDING ROUTE CONNECTIVITY GRAPH")
        print("=" * 100)
        print()
        
        print("📊 Loading all routes...")
        
        query = """
        SELECT 
            b.id as bus_id,
            b.bus_number,
            b.from_location_id,
            b.to_location_id,
            l_from.name_english as from_name,
            l_to.name_english as to_name,
            l_from.location_type as from_type,
            l_to.location_type as to_type
        FROM bus b
        JOIN location l_from ON b.from_location_id = l_from.id
        JOIN location l_to ON b.to_location_id = l_to.id
        WHERE b.from_location_id IS NOT NULL 
          AND b.to_location_id IS NOT NULL
          AND b.from_location_id != b.to_location_id
        """
        
        cursor.execute(query)
        all_routes = cursor.fetchall()
        
        print(f"   Loaded {len(all_routes):,} direct routes")
        print()
        
        # Build adjacency maps
        routes_from = defaultdict(list)  # from_id -> [routes]
        routes_to = defaultdict(list)    # to_id -> [routes]
        direct_connections = set()        # (from_id, to_id)
        
        for route in all_routes:
            routes_from[route['from_location_id']].append(route)
            routes_to[route['to_location_id']].append(route)
            direct_connections.add((route['from_location_id'], route['to_location_id']))
        
        print(f"   Graph built: {len(routes_from)} origins, {len(routes_to)} destinations")
        print()
        
        # ==================================================================
        # STEP 4: Find Connecting Routes
        # ==================================================================
        print("=" * 100)
        print("STEP 4: DISCOVERING CONNECTING ROUTE OPPORTUNITIES")
        print("=" * 100)
        print()
        
        print("🔍 Searching for city pairs that require transfers...")
        print("   (Looking for: A→Hub + Hub→B exists, but A→B doesn't)")
        print()
        
        connecting_routes = []
        checked_pairs = set()
        
        # For each hub, find potential connecting routes
        for hub in hubs[:15]:  # Check top 15 hubs
            hub_id = hub['id']
            hub_name = hub['name_english']
            
            # Routes ending at this hub
            incoming = routes_to.get(hub_id, [])
            # Routes starting from this hub
            outgoing = routes_from.get(hub_id, [])
            
            if not incoming or not outgoing:
                continue
            
            # Find connecting opportunities
            for in_route in incoming:
                origin_id = in_route['from_location_id']
                origin_name = in_route['from_name']
                
                for out_route in outgoing:
                    dest_id = out_route['to_location_id']
                    dest_name = out_route['to_name']
                    
                    # Skip if it's the same location
                    if origin_id == dest_id:
                        continue
                    
                    # Skip if we already checked this pair
                    pair_key = (origin_id, dest_id)
                    if pair_key in checked_pairs:
                        continue
                    checked_pairs.add(pair_key)
                    
                    # Check if direct route exists
                    if pair_key in direct_connections:
                        continue  # Skip - has direct route
                    
                    # Found a connecting route opportunity!
                    connecting_routes.append({
                        'origin_id': origin_id,
                        'origin_name': origin_name,
                        'hub_id': hub_id,
                        'hub_name': hub_name,
                        'dest_id': dest_id,
                        'dest_name': dest_name,
                        'sample_leg1_bus': in_route['bus_number'],
                        'sample_leg2_bus': out_route['bus_number'],
                    })
        
        print(f"✅ Found {len(connecting_routes)} connecting route opportunities!")
        print()
        
        if not connecting_routes:
            print("❌ No connecting routes found in production database")
            print()
            print("Possible reasons:")
            print("  • Database has isolated route networks")
            print("  • Not enough data to form connections")
            print("  • All city pairs have direct routes")
            return
        
        # ==================================================================
        # STEP 5: Display Best Test Cases
        # ==================================================================
        print("=" * 100)
        print("STEP 5: TOP CONNECTING ROUTE TEST CASES")
        print("=" * 100)
        print()
        
        # Show top 15 unique test cases
        displayed = 0
        seen_origins = set()
        
        for conn in connecting_routes:
            # Try to show diverse origins
            if conn['origin_name'] in seen_origins and displayed > 5:
                continue
            
            seen_origins.add(conn['origin_name'])
            displayed += 1
            
            print(f"Test Case #{displayed}")
            print(f"{'─' * 100}")
            print(f"  Origin:        {conn['origin_name']} (ID: {conn['origin_id']})")
            print(f"  Destination:   {conn['dest_name']} (ID: {conn['dest_id']})")
            print(f"  Via Hub:       {conn['hub_name']} (ID: {conn['hub_id']})")
            print()
            print(f"  Sample Route:")
            print(f"    Leg 1: {conn['origin_name']} → {conn['hub_name']} (Bus {conn['sample_leg1_bus']})")
            print(f"    Leg 2: {conn['hub_name']} → {conn['dest_name']} (Bus {conn['sample_leg2_bus']})")
            print()
            print(f"  🧪 API Test:")
            print(f"     curl 'http://localhost:8080/api/v1/bus-schedules/connecting-routes"
                  f"?fromLocationId={conn['origin_id']}"
                  f"&toLocationId={conn['dest_id']}"
                  f"&maxTransfers=2' | jq")
            print()
            
            if displayed >= 15:
                break
        
        # ==================================================================
        # STEP 6: Generate Test Script
        # ==================================================================
        print("=" * 100)
        print("STEP 6: GENERATING AUTOMATED TEST SCRIPT")
        print("=" * 100)
        print()
        
        script_path = "test_all_connecting_routes.sh"
        with open(script_path, 'w') as f:
            f.write("#!/bin/bash\n")
            f.write("# Auto-generated test script for ALL connecting routes found in production\n")
            f.write("# Generated on: " + str(__import__('datetime').datetime.now()) + "\n\n")
            f.write('BACKEND_URL="${BACKEND_URL:-http://localhost:8080}"\n\n')
            f.write('echo "════════════════════════════════════════════════════════════════════════════════════════════════"\n')
            f.write('echo "  TESTING ALL CONNECTING ROUTES FROM PRODUCTION DATA"\n')
            f.write('echo "════════════════════════════════════════════════════════════════════════════════════════════════"\n')
            f.write('echo ""\n\n')
            
            test_count = 0
            for conn in connecting_routes[:10]:  # Top 10 test cases
                test_count += 1
                f.write(f'echo ""\n')
                f.write(f'echo "Test {test_count}: {conn["origin_name"]} → {conn["dest_name"]} via {conn["hub_name"]}"\n')
                f.write(f'echo "────────────────────────────────────────────────────────────────────────────────────────────────"\n')
                f.write(f'curl -s "$BACKEND_URL/api/v1/bus-schedules/connecting-routes'
                       f'?fromLocationId={conn["origin_id"]}'
                       f'&toLocationId={conn["dest_id"]}'
                       f'&maxTransfers=2" | jq -r \'.[] | "  ✓ Found route via \\(.legs | length) leg(s): \\(.fromLocation.name) → \\(.toLocation.name)"\'\n\n')
            
            f.write('echo ""\n')
            f.write('echo "════════════════════════════════════════════════════════════════════════════════════════════════"\n')
            f.write('echo "  TEST COMPLETE"\n')
            f.write('echo "════════════════════════════════════════════════════════════════════════════════════════════════"\n')
        
        os.chmod(script_path, 0o755)
        print(f"✅ Created: {script_path}")
        print(f"   Contains {test_count} test cases")
        print()
        
        # ==================================================================
        # STEP 7: Summary
        # ==================================================================
        print("=" * 100)
        print("SUMMARY & RECOMMENDATIONS")
        print("=" * 100)
        print()
        print(f"✅ Production database analysis complete!")
        print()
        print(f"📊 Statistics:")
        print(f"   • Total buses:                {bus_count:,}")
        print(f"   • Total locations:            {location_count:,}")
        print(f"   • Major transfer hubs:        {len(hubs)}")
        print(f"   • Connecting routes found:    {len(connecting_routes):,}")
        print(f"   • Unique test cases:          {displayed}")
        print()
        print(f"📁 Generated Files:")
        print(f"   • {script_path} - Automated API tests")
        print()
        print(f"🎯 Next Steps:")
        print(f"   1. Run the test script:")
        print(f"      ./{script_path}")
        print()
        print(f"   2. Test on frontend:")
        print(f"      - Pick any test case from above")
        print(f"      - Search on your app")
        print(f"      - Verify connecting routes appear correctly")
        print()
        print(f"   3. Verify response format:")
        print(f"      - Check 'transfers' count")
        print(f"      - Verify 'legs' array")
        print(f"      - Confirm location names are correct")
        print()
        
        cursor.close()
        conn.close()
        
    except mysql.connector.Error as e:
        print(f"❌ Database error: {e}")
        print()
        print("Troubleshooting:")
        print("  1. Is Cloud SQL Proxy running on port 3307?")
        print("  2. Check database credentials")
        print("  3. Verify network connectivity")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == '__main__':
    main()
