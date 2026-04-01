#!/usr/bin/env python3
"""
Import production buses data into LOCAL database
Uses the exported JSON file from export_prod_buses.py
"""
import mysql.connector
import sys
import json
from pathlib import Path
from typing import Dict, List, Tuple

DB_CONFIG = {
    'host': 'localhost',
    'port': 3306,
    'user': 'root',
    'password': 'root',
    'database': 'perundhu',
    'charset': 'utf8mb4'
}


def load_exported_data():
    """Load the exported production data"""
    data_file = Path('data/prod_buses_complete.json')
    
    if not data_file.exists():
        print(f"❌ Data file not found: {data_file}")
        print("\nPlease run export first:")
        print("  python3 export_prod_buses.py")
        sys.exit(1)
    
    print(f"📂 Loading data from: {data_file}")
    with open(data_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    return data


def build_location_id_map(cursor) -> Dict[str, int]:
    """Build a map from location names to local database IDs"""
    print("\n📋 Building location ID map...")
    
    cursor.execute("SELECT id, name, district FROM locations")
    
    location_map = {}
    for loc_id, name, district in cursor.fetchall():
        key = name.strip().upper()
        location_map[key] = loc_id
        
        # Also add district-qualified key
        if district:
            qualified_key = f"{key}|{district.strip().upper()}"
            location_map[qualified_key] = loc_id
    
    print(f"✅ Loaded {len(location_map)} location mappings")
    return location_map


def resolve_location_id(location_name: str, district: str, location_map: Dict[str, int]) -> int:
    """Resolve location name to local database ID"""
    if not location_name:
        return None
    
    normalized = location_name.strip().upper()
    
    # Try exact match first
    if normalized in location_map:
        return location_map[normalized]
    
    # Try with district
    if district:
        qualified = f"{normalized}|{district.strip().upper()}"
        if qualified in location_map:
            return location_map[qualified]
    
    # Try common variations
    variations = [
        normalized.replace(" BUS STAND", ""),
        normalized.replace(" NEW BUS STAND", ""),
        normalized.replace(", ", " "),
        normalized.split(",")[0] if "," in normalized else normalized,
    ]
    
    for variation in variations:
        if variation in location_map:
            return location_map[variation]
    
    return None


def import_buses_and_stops(data: dict):
    """Import buses and stops into local database"""
    
    print("=" * 80)
    print("IMPORT PRODUCTION BUSES TO LOCAL DATABASE")
    print("=" * 80)
    print()
    
    buses_data = data['buses']
    stops_data = data['stops']
    
    print(f"Buses to import: {len(buses_data):,}")
    print(f"Stops to import: {len(stops_data):,}")
    print()
    
    try:
        # Connect to local database
        print("🔗 Connecting to local database...")
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor()
        print("✅ Connected to local MySQL\n")
        
        # Build location ID map
        location_map = build_location_id_map(cursor)
        
        # Check current counts
        cursor.execute("SELECT COUNT(*) FROM buses")
        current_buses = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(*) FROM stops")
        current_stops = cursor.fetchone()[0]
        
        print(f"\n📊 Current local database:")
        print(f"  Buses: {current_buses:,}")
        print(f"  Stops: {current_stops:,}")
        print()
        
        if current_buses > 0 or current_stops > 0:
            response = input("⚠️  Database not empty. Clear existing data? (yes/no): ")
            if response.lower() == 'yes':
                print("🗑️  Clearing existing buses and stops...")
                cursor.execute("DELETE FROM stops")
                cursor.execute("DELETE FROM buses")
                conn.commit()
                print("✅ Cleared\n")
            else:
                print("❌ Import cancelled")
                sys.exit(0)
        
        # Import buses
        print("📥 Importing buses...")
        inserted_buses = 0
        skipped_buses = 0
        id_mapping = {}  # Map production IDs to local IDs
        
        for bus in buses_data:
            # Resolve location IDs from local database
            from_loc_id = resolve_location_id(bus.get('origin_name') or bus.get('origin'), bus.get('from_district'), location_map)
            to_loc_id = resolve_location_id(bus.get('destination_name') or bus.get('destination'), bus.get('to_district'), location_map)
            
            origin_label = bus.get('origin_name') or bus.get('origin', '')
            dest_label = bus.get('destination_name') or bus.get('destination', '')

            if not from_loc_id or not to_loc_id:
                skipped_buses += 1
                if skipped_buses <= 5:  # Show first 5 examples
                    print(f"  ⚠️  Skipped: {origin_label} → {dest_label} (location not found)")
                continue
            
            cursor.execute("""
                INSERT INTO buses (
                    name, bus_number, from_location_id, to_location_id,
                    departure_time, arrival_time, capacity, category, active
                ) VALUES (
                    %s, %s, %s, %s, %s, %s, %s, %s, %s
                )
            """, (
                bus.get('name') or bus.get('bus_name'),
                bus.get('bus_number'),
                from_loc_id,
                to_loc_id,
                bus.get('departure_time'),
                bus.get('arrival_time'),
                bus.get('capacity', 50),
                bus.get('category') or bus.get('bus_type', 'Regular'),
                1 if bus.get('active', True) else 0
            ))
            
            local_bus_id = cursor.lastrowid
            id_mapping[bus['id']] = local_bus_id
            inserted_buses += 1
            
            if inserted_buses % 1000 == 0:
                print(f"  Inserted {inserted_buses:,} buses...")
                conn.commit()
        
        conn.commit()
        print(f"✅ Inserted {inserted_buses:,} buses")
        if skipped_buses > 0:
            print(f"⚠️  Skipped {skipped_buses:,} buses (locations not found)")
        
        # Import stops
        print("\n📥 Importing stops...")
        inserted_stops = 0
        skipped_stops = 0
        
        for stop in stops_data:
            # Map production bus_id to local bus_id
            local_bus_id = id_mapping.get(stop['bus_id'])
            if not local_bus_id:
                skipped_stops += 1
                continue
            
            # Resolve location ID
            location_id = resolve_location_id(stop['location_name'], stop.get('location_district'), location_map)
            if not location_id:
                skipped_stops += 1
                continue
            
            cursor.execute("""
                INSERT INTO stops (
                    name, bus_id, location_id, stop_order,
                    arrival_time, departure_time
                ) VALUES (
                    %s, %s, %s, %s, %s, %s
                )
            """, (
                stop.get('name', ''),
                local_bus_id,
                location_id,
                stop['stop_order'],
                stop['arrival_time'],
                stop['departure_time']
            ))
            
            inserted_stops += 1
            
            if inserted_stops % 1000 == 0:
                print(f"  Inserted {inserted_stops:,} stops...")
                conn.commit()
        
        conn.commit()
        print(f"✅ Inserted {inserted_stops:,} stops")
        if skipped_stops > 0:
            print(f"⚠️  Skipped {skipped_stops:,} stops (bus or location not found)")
        
        cursor.close()
        conn.close()
        
        # Summary
        print("\n" + "=" * 80)
        print("IMPORT SUMMARY")
        print("=" * 80)
        print(f"Buses imported:     {inserted_buses:,} / {len(buses_data):,}")
        print(f"Stops imported:     {inserted_stops:,} / {len(stops_data):,}")
        print(f"Buses skipped:      {skipped_buses:,}")
        print(f"Stops skipped:      {skipped_stops:,}")
        print()
        print("✅ Import complete!")
        print()
        print("🎯 Next Steps:")
        print("  1. Restart your backend:")
        print("     ./start-local.sh")
        print()
        print("  2. Test search:")
        print("     Search from சென்னை (Chennai) to மதுரை (Madurai)")
        print()
        print("=" * 80)
        
    except mysql.connector.Error as e:
        print(f"\n❌ Database Error: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


def main():
    data = load_exported_data()
    import_buses_and_stops(data)


if __name__ == '__main__':
    main()
