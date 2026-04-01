#!/usr/bin/env python3
"""
Query production database for connecting routes test cases.

This script finds actual bus routes in production that could form
connecting routes (e.g., Chennai -> Madurai + Madurai -> Aruppukottai).

Prerequisites:
    1. Cloud SQL Proxy running on port 3307:
       ./cloud_sql_proxy -instances=perundhu-prod-001:us-central1:perundhu-production-db=tcp:3307

    2. Database credentials set via environment variables or Secret Manager
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
    except Exception as e:
        print(f"⚠️  Could not fetch password from Secret Manager: {e}")
    
    # Prompt user
    import getpass
    return getpass.getpass("Enter production database password: ")

def main():
    print("=" * 80)
    print("PRODUCTION DATABASE - CONNECTING ROUTES TEST DATA FINDER")
    print("=" * 80)
    print()
    
    config = get_db_config()
    config['password'] = get_password()
    
    try:
        print(f"🔗 Connecting to production database...")
        print(f"   Host: {config['host']}:{config['port']}")
        print(f"   Database: {config['database']}")
        print()
        
        conn = mysql.connector.connect(**config)
        cursor = conn.cursor(dictionary=True)
        
        print("✅ Connected to production database")
        print()
        
        # ==================================================================
        # STEP 1: Get overall statistics
        # ==================================================================
        print("=" * 80)
        print("STEP 1: DATABASE OVERVIEW")
        print("=" * 80)
        
        cursor.execute("SELECT COUNT(*) as count FROM bus")
        bus_count = cursor.fetchone()['count']
        
        cursor.execute("SELECT COUNT(*) as count FROM location")
        location_count = cursor.fetchone()['count']
        
        print(f"Total Buses:     {bus_count:,}")
        print(f"Total Locations: {location_count:,}")
        print()
        
        # ==================================================================
        # STEP 2: Find major cities (potential transfer hubs)
        # ==================================================================
        print("=" * 80)
        print("STEP 2: MAJOR TRANSFER HUBS (Cities with most bus connections)")
        print("=" * 80)
        
        query = """
        SELECT 
            l.id,
            l.name_english,
            l.name_tamil,
            l.location_type,
            COUNT(DISTINCT b.id) as bus_count
        FROM location l
        LEFT JOIN bus b ON (b.from_location_id = l.id OR b.to_location_id = l.id)
        GROUP BY l.id, l.name_english, l.name_tamil, l.location_type
        HAVING COUNT(DISTINCT b.id) >= 10
        ORDER BY bus_count DESC
        LIMIT 15
        """
        
        cursor.execute(query)
        hubs = cursor.fetchall()
        
        if not hubs:
            print("❌ No major hubs found (need locations with 10+ bus connections)")
            print("   Cannot form connecting routes without transfer points.")
            return
        
        print(f"Found {len(hubs)} potential transfer hubs:\n")
        for i, hub in enumerate(hubs, 1):
            print(f"{i:2}. {hub['name_english']:30} "
                  f"(ID: {hub['id']:5}) - {hub['bus_count']:3} buses")
        
        print()
        
        # ==================================================================
        # STEP 3: Find connecting route chains
        # ==================================================================
        print("=" * 80)
        print("STEP 3: FINDING CONNECTING ROUTE CHAINS")
        print("=" * 80)
        print()
        
        # Build a map of routes: from_location -> to_location -> [buses]
        print("📊 Building route graph...")
        
        query = """
        SELECT 
            b.id as bus_id,
            b.bus_number,
            b.bus_name,
            b.from_location_id,
            b.to_location_id,
            l_from.name_english as from_name,
            l_to.name_english as to_name
        FROM bus b
        JOIN location l_from ON b.from_location_id = l_from.id
        JOIN location l_to ON b.to_location_id = l_to.id
        WHERE b.from_location_id IS NOT NULL 
          AND b.to_location_id IS NOT NULL
        """
        
        cursor.execute(query)
        all_routes = cursor.fetchall()
        
        print(f"   Loaded {len(all_routes):,} routes")
        print()
        
        # Build adjacency map
        routes_from = defaultdict(list)
        for route in all_routes:
            routes_from[route['from_location_id']].append(route)
        
        # Find chains: A -> B (leg 1), B -> C (leg 2)
        found_chains = []
        
        print("🔍 Searching for 2-leg connecting routes...")
        print("   (Looking for: City A → Transfer Hub → City B)")
        print()
        
        # For each major hub, find incoming and outgoing routes
        for hub in hubs[:10]:  # Check top 10 hubs
            hub_id = hub['id']
            hub_name = hub['name_english']
            
            # Find routes ending at this hub (leg 1 candidates)
            leg1_routes = [r for r in all_routes if r['to_location_id'] == hub_id]
            
            # Find routes starting from this hub (leg 2 candidates)
            leg2_routes = routes_from.get(hub_id, [])
            
            if not leg1_routes or not leg2_routes:
                continue
            
            # Find actual chains
            for leg1 in leg1_routes[:5]:  # Sample first 5
                for leg2 in leg2_routes[:5]:  # Sample first 5
                    # Make sure leg1 origin != leg2 destination (avoid loops)
                    if leg1['from_location_id'] != leg2['to_location_id']:
                        found_chains.append({
                            'origin': leg1['from_name'],
                            'origin_id': leg1['from_location_id'],
                            'hub': hub_name,
                            'hub_id': hub_id,
                            'destination': leg2['to_name'],
                            'destination_id': leg2['to_location_id'],
                            'leg1_bus': f"{leg1['bus_number']} - {leg1['bus_name']}",
                            'leg1_bus_id': leg1['bus_id'],
                            'leg2_bus': f"{leg2['bus_number']} - {leg2['bus_name']}",
                            'leg2_bus_id': leg2['bus_id'],
                        })
        
        if not found_chains:
            print("❌ No connecting routes found")
            print("   This could mean:")
            print("   - Not enough route data in production")
            print("   - Routes are not connected (isolated networks)")
            return
        
        print(f"✅ Found {len(found_chains)} potential connecting routes!")
        print()
        
        # ==================================================================
        # STEP 4: Display test cases
        # ==================================================================
        print("=" * 80)
        print("STEP 4: SAMPLE CONNECTING ROUTE TEST CASES")
        print("=" * 80)
        print()
        
        # Show first 10 unique test cases
        seen = set()
        test_cases = []
        
        for chain in found_chains:
            key = (chain['origin_id'], chain['destination_id'])
            if key not in seen:
                seen.add(key)
                test_cases.append(chain)
                if len(test_cases) >= 10:
                    break
        
        for i, tc in enumerate(test_cases, 1):
            print(f"Test Case #{i}:")
            print(f"{'─' * 80}")
            print(f"  Route:     {tc['origin']} → {tc['destination']}")
            print(f"  Via:       {tc['hub']} (transfer hub)")
            print()
            print(f"  Leg 1:     {tc['origin']} → {tc['hub']}")
            print(f"             Bus: {tc['leg1_bus']}")
            print(f"             Bus ID: {tc['leg1_bus_id']}")
            print()
            print(f"  Leg 2:     {tc['hub']} → {tc['destination']}")
            print(f"             Bus: {tc['leg2_bus']}")
            print(f"             Bus ID: {tc['leg2_bus_id']}")
            print()
            print(f"  🧪 API Test Command:")
            print(f"     curl 'http://localhost:8080/api/v1/bus-schedules/connecting-routes"
                  f"?fromLocationId={tc['origin_id']}"
                  f"&toLocationId={tc['destination_id']}"
                  f"&maxTransfers=2' | jq")
            print()
        
        # ==================================================================
        # STEP 5: Generate test script
        # ==================================================================
        print("=" * 80)
        print("STEP 5: GENERATED TEST SCRIPT")
        print("=" * 80)
        print()
        
        if test_cases:
            script_path = "test_connecting_routes_actual_data.sh"
            with open(script_path, 'w') as f:
                f.write("#!/bin/bash\n")
                f.write("# Auto-generated test script for connecting routes\n")
                f.write("# Based on actual production data\n\n")
                f.write('BACKEND_URL="${BACKEND_URL:-http://localhost:8080}"\n\n')
                
                for i, tc in enumerate(test_cases[:5], 1):  # Top 5 test cases
                    f.write(f"echo ''\n")
                    f.write(f"echo '═══════════════════════════════════════════════════════════════════════════'\n")
                    f.write(f"echo 'TEST CASE #{i}: {tc['origin']} → {tc['destination']} via {tc['hub']}'\n")
                    f.write(f"echo '═══════════════════════════════════════════════════════════════════════════'\n")
                    f.write(f"curl -s \"$BACKEND_URL/api/v1/bus-schedules/connecting-routes"
                           f"?fromLocationId={tc['origin_id']}"
                           f"&toLocationId={tc['destination_id']}"
                           f"&maxTransfers=2\" | jq '.[] | {{origin: .fromLocation.name, destination: .toLocation.name, transfers: .transfers, legs: .legs | length}}'\n\n")
            
            os.chmod(script_path, 0o755)
            print(f"✅ Created executable test script: {script_path}")
            print(f"   Run it with: ./{script_path}")
            print()
        
        # ==================================================================
        # STEP 6: Summary & Next Steps
        # ==================================================================
        print("=" * 80)
        print("SUMMARY & RECOMMENDATIONS")
        print("=" * 80)
        print()
        print(f"✅ Production database has sufficient data for connecting routes:")
        print(f"   • {len(hubs)} major transfer hubs")
        print(f"   • {len(found_chains):,} potential connecting routes")
        print(f"   • {len(test_cases)} unique test cases identified")
        print()
        print("📋 Next Steps:")
        print("   1. Run the generated test script: ./test_connecting_routes_actual_data.sh")
        print("   2. Verify API returns valid connecting routes")
        print("   3. Check frontend displays routes correctly")
        print("   4. Test with different maxTransfers values (1, 2, 3)")
        print()
        print("💡 Tips:")
        print("   • If API returns empty [], check backend logs for errors")
        print("   • Clear cache between tests: curl -X POST $BACKEND_URL/api/admin/cache/clear")
        print("   • Try different test cases from the list above")
        print()
        
        cursor.close()
        conn.close()
        
    except mysql.connector.Error as e:
        print(f"❌ Database error: {e}")
        print()
        print("Troubleshooting:")
        print("  1. Is Cloud SQL Proxy running?")
        print("     ./cloud_sql_proxy -instances=perundhu-prod-001:us-central1:perundhu-production-db=tcp:3307")
        print("  2. Check database credentials")
        print("  3. Verify network connectivity to Cloud SQL")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == '__main__':
    main()
