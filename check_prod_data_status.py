#!/usr/bin/env python3
"""
Quick script to check production database data status
"""
import mysql.connector
import sys
import os

def check_production_database():
    """Check production database for locations, buses, stops, and translations"""
    
    print("=" * 60)
    print("PRODUCTION DATABASE DATA STATUS CHECK")
    print("=" * 60)
    
    # Production database config
    # Using Cloud SQL Proxy connection
    config = {
        'host': os.getenv('DB_HOST_PROD', '127.0.0.1'),
        'port': int(os.getenv('DB_PORT_PROD', '3307')),
        'user': os.getenv('DB_USER_PROD', 'perundhu_user'),
        'password': os.getenv('DB_PASSWORD_PROD', 'perundhu_password'),
        'database': os.getenv('DB_NAME_PROD', 'perundhu'),
    }
    
    try:
        print(f"\n🔌 Connecting to production database...")
        print(f"   Host: {config['host']}:{config['port']}")
        print(f"   Database: {config['database']}")
        print(f"   User: {config['user']}")
        
        conn = mysql.connector.connect(**config)
        cursor = conn.cursor()
        
        print("✅ Connected successfully!\n")
        
        # Check locations
        cursor.execute("SELECT COUNT(*) FROM locations")
        location_count = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM locations WHERE tamil_name IS NOT NULL AND tamil_name != ''")
        locations_with_tamil = cursor.fetchone()[0]
        
        # Check buses
        cursor.execute("SELECT COUNT(*) FROM buses")
        bus_count = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM buses WHERE tamil_name IS NOT NULL AND tamil_name != ''")
        buses_with_tamil = cursor.fetchone()[0]
        
        # Check stops
        cursor.execute("SELECT COUNT(*) FROM stops")
        stop_count = cursor.fetchone()[0]
        
        # Sample data
        cursor.execute("SELECT name, district, latitude, longitude FROM locations LIMIT 5")
        sample_locations = cursor.fetchall()
        
        cursor.execute("SELECT name, bus_number, operator FROM buses LIMIT 5")
        sample_buses = cursor.fetchall()
        
        # Print results
        print("📊 DATA SUMMARY")
        print("-" * 60)
        print(f"Locations:              {location_count:,}")
        print(f"  └─ With Tamil names:  {locations_with_tamil:,} ({locations_with_tamil*100//max(location_count,1)}%)")
        print(f"Buses:                  {bus_count:,}")
        print(f"  └─ With Tamil names:  {buses_with_tamil:,} ({buses_with_tamil*100//max(bus_count,1)}%)")
        print(f"Stops:                  {stop_count:,}")
        
        # Sample data
        if sample_locations:
            print("\n📍 SAMPLE LOCATIONS:")
            for loc in sample_locations:
                print(f"  • {loc[0]} ({loc[1]}) - {loc[2]}, {loc[3]}")
        
        if sample_buses:
            print("\n🚌 SAMPLE BUSES:")
            for bus in sample_buses:
                print(f"  • {bus[0]} ({bus[1]}) - {bus[2]}")
        
        # Conclusion
        print("\n" + "=" * 60)
        data_exists = location_count > 0 or bus_count > 0
        
        if data_exists:
            print("✅ STATUS: Data exists in production database")
            if locations_with_tamil < location_count * 0.5 or buses_with_tamil < bus_count * 0.5:
                print("⚠️  WARNING: Tamil translations are incomplete (<50% coverage)")
                return False
            print("✅ Tamil translations look good (>50% coverage)")
            return True
        else:
            print("❌ STATUS: No data found in production database")
            print("📦 Action needed: Upload data using bulk_upload_full.py")
            return False
            
    except mysql.connector.Error as e:
        print(f"\n❌ Database error: {e}")
        print("\n💡 TIP: Make sure Cloud SQL Proxy is running:")
        print("   cloud-sql-proxy perundhu-prod-001:us-central1:perundhu-production-mysql-us --port 3307")
        return False
    except Exception as e:
        print(f"\n❌ Error: {e}")
        return False
    finally:
        if 'conn' in locals() and conn.is_connected():
            cursor.close()
            conn.close()

if __name__ == "__main__":
    has_data = check_production_database()
    sys.exit(0 if has_data else 1)
