#!/usr/bin/env python3
"""
Export buses and stops data from PRODUCTION database
Downloads all production bus route data to local JSON file
"""
import mysql.connector
import subprocess
import sys
import json
from datetime import datetime
from pathlib import Path

def get_db_credentials():
    """Retrieve database credentials from Secret Manager"""
    print("🔐 Retrieving credentials from Secret Manager...")
    try:
        username = subprocess.check_output([
            'gcloud', 'secrets', 'versions', 'access', 'latest',
            '--secret=db-username',
            '--project=perundhu-prod-001'
        ], text=True).strip()
        
        password = subprocess.check_output([
            'gcloud', 'secrets', 'versions', 'access', 'latest',
            '--secret=db-password',
            '--project=perundhu-prod-001'
        ], text=True).strip()
        
        print("✅ Credentials retrieved\n")
        return username, password
    except subprocess.CalledProcessError as e:
        print(f"❌ Error retrieving credentials: {e}")
        sys.exit(1)


def export_production_buses():
    """Export buses and stops from production database"""
    
    print("=" * 80)
    print("EXPORT PRODUCTION BUSES TO LOCAL")
    print("=" * 80)
    print()
    
    # Get credentials
    db_user, db_password = get_db_credentials()
    
    # Connect to production database via Cloud SQL Proxy
    print("🔗 Connecting to production database via Cloud SQL Proxy...")
    print("   Host: 127.0.0.1:3307")
    print("   Database: perundhu")
    print()
    
    try:
        conn = mysql.connector.connect(
            host='127.0.0.1',
            port=3307,
            user=db_user,
            password=db_password,
            database='perundhu',
            charset='utf8mb4'
        )
        
        cursor = conn.cursor(dictionary=True)
        print("✅ Connected to production database\n")
        
        # Get total counts
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
        
        # Export buses with all fields
        print("📥 Exporting buses from production...")
        cursor.execute("""
            SELECT 
                b.id,
                b.bus_name,
                b.bus_number,
                b.from_location_id,
                b.to_location_id,
                b.departure_time,
                b.arrival_time,
                b.bus_type,
                b.via_route,
                b.frequency,
                b.operator,
                b.distance_km,
                b.duration_minutes,
                b.fare,
                b.is_ac,
                b.is_sleeper,
                b.is_seater,
                b.amenities,
                b.status,
                b.data_source,
                b.verified,
                b.created_at,
                b.updated_at,
                from_loc.name as origin,
                from_loc.district as from_district,
                to_loc.name as destination,
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
                'bus_name': row['bus_name'],
                'bus_number': row['bus_number'],
                'from_location_id': row['from_location_id'],
                'to_location_id': row['to_location_id'],
                'origin': row['origin'],
                'destination': row['destination'],
                'from_district': row['from_district'],
                'to_district': row['to_district'],
                'departure_time': row['departure_time'] if row['departure_time'] else None,
                'arrival_time': row['arrival_time'] if row['arrival_time'] else None,
                'bus_type': row['bus_type'],
                'via_route': row['via_route'],
                'frequency': row['frequency'],
                'operator': row['operator'],
                'distance_km': float(row['distance_km']) if row['distance_km'] else None,
                'duration_minutes': row['duration_minutes'],
                'fare': float(row['fare']) if row['fare'] else None,
                'is_ac': bool(row['is_ac']) if row['is_ac'] is not None else False,
                'is_sleeper': bool(row['is_sleeper']) if row['is_sleeper'] is not None else False,
                'is_seater': bool(row['is_seater']) if row['is_seater'] is not None else True,
                'amenities': row['amenities'],
                'status': row['status'],
                'data_source': row['data_source'],
                'verified': bool(row['verified']) if row['verified'] is not None else False,
                'created_at': row['created_at'].isoformat() if row['created_at'] else None,
                'updated_at': row['updated_at'].isoformat() if row['updated_at'] else None,
            }
            buses.append(bus)
        
        print(f"✅ Exported {len(buses):,} buses")
        
        # Export stops
        print("\n📥 Exporting stops from production...")
        cursor.execute("""
            SELECT 
                s.id,
                s.bus_id,
                s.location_id,
                s.stop_order,
                s.arrival_time,
                s.departure_time,
                s.platform_number,
                s.wait_time_minutes,
                s.distance_from_start_km,
                s.fare_from_origin,
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
                'bus_id': row['bus_id'],
                'location_id': row['location_id'],
                'location_name': row['location_name'],
                'location_district': row['location_district'],
                'stop_order': row['stop_order'],
                'arrival_time': row['arrival_time'] if row['arrival_time'] else None,
                'departure_time': row['departure_time'] if row['departure_time'] else None,
                'platform_number': row['platform_number'],
                'wait_time_minutes': row['wait_time_minutes'],
                'distance_from_start_km': float(row['distance_from_start_km']) if row['distance_from_start_km'] else None,
                'fare_from_origin': float(row['fare_from_origin']) if row['fare_from_origin'] else None,
                'created_at': row['created_at'].isoformat() if row['created_at'] else None,
                'updated_at': row['updated_at'].isoformat() if row['updated_at'] else None,
            }
            stops.append(stop)
        
        print(f"✅ Exported {len(stops):,} stops")
        
        cursor.close()
        conn.close()
        
        # Save to file
        output_dir = Path('data')
        output_dir.mkdir(exist_ok=True)
        
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        
        buses_file = output_dir / f'prod_buses_{timestamp}.json'
        stops_file = output_dir / f'prod_stops_{timestamp}.json'
        combined_file = output_dir / 'prod_buses_complete.json'
        
        print("\n💾 Saving data to files...")
        
        # Save buses
        with open(buses_file, 'w', encoding='utf-8') as f:
            json.dump(buses, f, indent=2, ensure_ascii=False)
        print(f"✅ Saved buses to: {buses_file}")
        
        # Save stops
        with open(stops_file, 'w', encoding='utf-8') as f:
            json.dump(stops, f, indent=2, ensure_ascii=False)
        print(f"✅ Saved stops to: {stops_file}")
        
        # Save combined format (for bulk upload script)
        combined_data = {
            'exported_at': datetime.now().isoformat(),
            'source': 'production',
            'counts': {
                'buses': len(buses),
                'stops': len(stops),
                'locations': location_count
            },
            'buses': buses,
            'stops': stops
        }
        
        with open(combined_file, 'w', encoding='utf-8') as f:
            json.dump(combined_data, f, indent=2, ensure_ascii=False)
        print(f"✅ Saved combined to: {combined_file}")
        
        # Summary
        print("\n" + "=" * 80)
        print("EXPORT SUMMARY")
        print("=" * 80)
        print(f"Buses exported:     {len(buses):,}")
        print(f"Stops exported:     {len(stops):,}")
        print(f"Files created:      3")
        print()
        print("📁 Files:")
        print(f"  - {buses_file}")
        print(f"  - {stops_file}")
        print(f"  - {combined_file}")
        print()
        print("🎯 Next Steps:")
        print("  1. Stop Cloud SQL Proxy:")
        print("     pkill -f cloud_sql_proxy")
        print()
        print("  2. Import to local database:")
        print("     python3 import_prod_buses_to_local.py")
        print()
        print("=" * 80)
        
    except mysql.connector.Error as e:
        print(f"\n❌ Database Error: {e}")
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


def main():
    import argparse
    
    parser = argparse.ArgumentParser(
        description='Export production buses to local files',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Prerequisites:
  1. Cloud SQL Proxy must be running on port 3307:
     ./cloud_sql_proxy -instances=perundhu-prod-001:us-central1:perundhu-production-mysql-us=tcp:3307 &
  
  2. Authenticated with gcloud:
     gcloud auth application-default login --project perundhu-prod-001

Example:
  python3 export_prod_buses.py
        """
    )
    
    args = parser.parse_args()
    export_production_buses()


if __name__ == '__main__':
    main()
