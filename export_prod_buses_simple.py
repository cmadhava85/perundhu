#!/usr/bin/env python3
"""
Export buses and stops from production database to JSON files for local import.
"""

import json
import sys
import os
from datetime import datetime
from google.cloud import secretmanager
import mysql.connector

def main():
    print("=" * 80)
    print("EXPORT PRODUCTION BUSES TO LOCAL")
    print("=" * 80)
    print()
    
    try:
        # Get credentials from Secret Manager
        print("🔐 Retrieving credentials from Secret Manager...")
        client = secretmanager.SecretManagerServiceClient()
        
        db_user = client.access_secret_version(
            name="projects/perundhu-prod-001/secrets/db-username/versions/latest"
        ).payload.data.decode("UTF-8")
        
        db_pass = client.access_secret_version(
            name="projects/perundhu-prod-001/secrets/db-password/versions/latest"
        ).payload.data.decode("UTF-8")
        
        print("✅ Credentials retrieved")
        print()
        
        # Connect to production database via Cloud SQL Proxy
        print("🔗 Connecting to production database via Cloud SQL Proxy...")
        print("   Host: 127.0.0.1:3307")
        print("   Database: perundhu")
        print()
        
        conn = mysql.connector.connect(
            host="127.0.0.1",
            port=3307,
            user=db_user,
            password=db_pass,
            database="perundhu"
        )
        
        cursor = conn.cursor(dictionary=True)
        print("✅ Connected to production database")
        print()
        
        print("=" * 80)
        print("PRODUCTION DATABASE COUNTS")
        print("=" * 80)
        
        cursor.execute("SELECT COUNT(*) as count FROM buses")
        bus_count = cursor.fetchone()['count']
        print(f"Buses:  {bus_count:,}")
        
        cursor.execute("SELECT COUNT(*) as count FROM stops")
        stop_count = cursor.fetchone()['count']
        print(f"Stops:  {stop_count:,}")
        
        cursor.execute("SELECT COUNT(*) as count FROM locations")
        location_count = cursor.fetchone()['count']
        print(f"Locations: {location_count:,}")
        print()
        
        # Export buses
        print("📥 Exporting buses from production...")
        cursor.execute("""
            SELECT 
                b.id,
                b.name,
                b.bus_number,
                b.from_location_id,
                b.to_location_id,
                b.departure_time,
                b.arrival_time,
                b.capacity,
                b.category,
                b.active,
                from_loc.name as origin_name,
                from_loc.district as from_district,
                to_loc.name as destination_name,
                to_loc.district as to_district
            FROM buses b
            LEFT JOIN locations from_loc ON b.from_location_id = from_loc.id
            LEFT JOIN locations to_loc ON b.to_location_id = to_loc.id
            ORDER BY b.id
        """)
        
        buses = []
        for row in cursor:
            bus = {
                'id': row['id'],
                'name': row['name'],
                'bus_number': row['bus_number'],
                'from_location_id': row['from_location_id'],
                'to_location_id': row['to_location_id'],
                'origin_name': row['origin_name'],
                'destination_name': row['destination_name'],
                'from_district': row['from_district'],
                'to_district': row['to_district'],
                'departure_time': str(row['departure_time']) if row['departure_time'] else None,
                'arrival_time': str(row['arrival_time']) if row['arrival_time'] else None,
                'capacity': row['capacity'],
                'category': row['category'],
                'active': bool(row['active']) if row['active'] is not None else True,
            }
            buses.append(bus)
        
        print(f"✅ Exported {len(buses):,} buses")
        print()
        
        # Export stops
        print("📥 Exporting stops from production...")
        cursor.execute("""
            SELECT 
                s.id,
                s.name,
                s.arrival_time,
                s.departure_time,
                s.stop_order,
                s.bus_id,
                s.location_id,
                s.created_at,
                s.updated_at,
                l.name as location_name,
                l.district as location_district
            FROM stops s
            LEFT JOIN locations l ON s.location_id = l.id
            ORDER BY s.bus_id, s.stop_order
        """)
        
        stops = []
        for row in cursor:
            stop = {
                'id': row['id'],
                'name': row['name'],
                'bus_id': row['bus_id'],
                'location_id': row['location_id'],
                'location_name': row['location_name'],
                'location_district': row['location_district'],
                'arrival_time': str(row['arrival_time']) if row['arrival_time'] else None,
                'departure_time': str(row['departure_time']) if row['departure_time'] else None,
                'stop_order': row['stop_order'],
                'created_at': row['created_at'].isoformat() if row['created_at'] else None,
                'updated_at': row['updated_at'].isoformat() if row['updated_at'] else None,
            }
            stops.append(stop)
        
        print(f"✅ Exported {len(stops):,} stops")
        print()
        
        # Close database connection
        cursor.close()
        conn.close()
        
        # Save files
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        data_dir = "data"
        os.makedirs(data_dir, exist_ok=True)
        
        # Save individual files
        buses_file = os.path.join(data_dir, f"prod_buses_{timestamp}.json")
        stops_file = os.path.join(data_dir, f"prod_stops_{timestamp}.json")
        combined_file = os.path.join(data_dir, "prod_buses_complete.json")
        
        print("💾 Saving data files...")
        
        with open(buses_file, 'w', encoding='utf-8') as f:
            json.dump(buses, f, indent=2, ensure_ascii=False)
        print(f"   - {buses_file}")
        
        with open(stops_file, 'w', encoding='utf-8') as f:
            json.dump(stops, f, indent=2, ensure_ascii=False)
        print(f"   - {stops_file}")
        
        # Save combined file for import
        combined_data = {
            'buses': buses,
            'stops': stops,
            'export_timestamp': datetime.now().isoformat(),
            'stats': {
                'buses_count': len(buses),
                'stops_count': len(stops),
                'locations_count': location_count
            }
        }
        
        with open(combined_file, 'w', encoding='utf-8') as f:
            json.dump(combined_data, f, indent=2, ensure_ascii=False)
        print(f"   - {combined_file}")
        print()
        
        print("=" * 80)
        print("✅ EXPORT COMPLETED SUCCESSFULLY")
        print("=" * 80)
        print(f"Buses:  {len(buses):,}")
        print(f"Stops:  {len(stops):,}")
        print()
        print("📋 Next step:")
        print("   python3 import_prod_buses_to_local.py")
        print()
        
    except mysql.connector.Error as err:
        print(f"\n❌ Database Error: {err}")
        print("\nTroubleshooting:")
        print("  1. Ensure Cloud SQL Proxy is running:")
        print("     ./cloud_sql_proxy -instances=perundhu-prod-001:us-central1:perundhu-production-mysql-us=tcp:3307 &")
        print("  2. Check gcloud authentication:")
        print("     gcloud auth application-default login --project perundhu-prod-001")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()
