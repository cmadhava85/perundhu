#!/usr/bin/env python3
"""
Fast production data upload using optimized batch SQL inserts
Uploads ~40K locations in under 2 minutes
"""
import json
import mysql.connector
import os
from datetime import datetime

def fast_upload_production():
    """Upload data to production using optimized batch inserts"""
    
    print("=" * 70)
    print("FAST PRODUCTION DATA UPLOAD")
    print("=" * 70)
    print()
    
    # Get credentials
    db_config = {
        'host': '127.0.0.1',
        'port': 3307,
        'user': 'perundhu_user',
        'password': os.popen('gcloud secrets versions access latest --secret=db-password --project=perundhu-prod-001 2>/dev/null').read().strip(),
        'database': 'perundhu',
        'autocommit': False
    }
    
    print(f"📊 Loading data files...")
    
    # Load locations
    with open('data/tamil_nadu_locations_enhanced.json', 'r', encoding='utf-8') as f:
        locations = json.load(f)
    print(f"   ✓ Locations: {len(locations):,}")
    
    # Load buses
    with open('data/consolidated_buses.json', 'r', encoding='utf-8') as f:
        buses_data = json.load(f)
    buses = buses_data.get('buses', [])
    print(f"   ✓ Buses: {len(buses):,}")
    
    conn = None
    try:
        print(f"\n🔌 Connecting to production database...")
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()
        
        print(f"   ✓ Connected to {db_config['database']} @ {db_config['host']}:{db_config['port']}")
        
        # Upload locations in large batches
        print(f"\n📍 Uploading {len(locations):,} locations...")
        batch_size = 500
        location_id_map = {}
        inserted = 0
        
        location_batches = [locations[i:i + batch_size] for i in range(0, len(locations), batch_size)]
        
        for batch_num, batch in enumerate(location_batches, 1):
            values = []
            for loc in batch:
                name = loc.get('name', '').strip().replace("'", "''").replace("\\", "\\\\")
                lat = loc.get('latitude', 0.0)
                lng = loc.get('longitude', 0.0)
                district = loc.get('district', '').replace("'", "''").replace("\\", "\\\\")
                state = loc.get('state', 'Tamil Nadu').replace("'", "''")
                osm_id = loc.get('osm_id')
                loc_type = loc.get('type', 'City').replace("'", "''")
                
                values.append(f"('{name}', {lat}, {lng}, '{district}', '{state}', {osm_id or 'NULL'}, '{loc_type}')")
            
            sql = f"""
                INSERT INTO locations (name, latitude, longitude, district, state, osm_id, type)
                VALUES {','.join(values)}
                ON DUPLICATE KEY UPDATE 
                    latitude = VALUES(latitude),
                    longitude = VALUES(longitude),
                    district = VALUES(district)
            """
            
            cursor.execute(sql)
            inserted += len(batch)
            
            if batch_num % 10 == 0:
                conn.commit()
                print(f"   Progress: {inserted:,}/{len(locations):,} ({inserted*100//len(locations)}%)")
        
        conn.commit()
        print(f"   ✅ Inserted {inserted:,} locations")
        
        # Get location IDs for mapping
        print(f"\n🔍 Building location ID map...")
        cursor.execute("SELECT id, name FROM locations")
        for loc_id, loc_name in cursor.fetchall():
            location_id_map[loc_name.lower()] = loc_id
        print(f"   ✓ Mapped {len(location_id_map):,} locations")
        
        # Upload buses in batches
        print(f"\n🚌 Uploading {len(buses):,} buses...")
        bus_batch_size = 200
        bus_batches = [buses[i:i + bus_batch_size] for i in range(0, len(buses), bus_batch_size)]
        bus_id_map = {}
        buses_inserted = 0
        
        for batch_num, batch in enumerate(bus_batches, 1):
            values = []
            for bus in batch:
                name = bus.get('bus_name', bus.get('name', '')).strip().replace("'", "''").replace("\\", "\\\\")
                bus_number = bus.get('bus_number', '').strip().replace("'", "''").replace("\\", "\\\\")
                from_loc = bus.get('origin', bus.get('from_location', '')).strip().lower()
                to_loc = bus.get('destination', bus.get('to_location', '')).strip().lower()
                from_id = location_id_map.get(from_loc, 'NULL')
                to_id = location_id_map.get(to_loc, 'NULL')
                dep_time = bus.get('departure_time', 'NULL')
                arr_time = bus.get('arrival_time', 'NULL')
                capacity = bus.get('capacity', 50)
                category = bus.get('category', 'Regular').replace("'", "''")
                
                if from_id == 'NULL' or to_id == 'NULL':
                    continue
                
                dep_str = f"'{dep_time}'" if dep_time != 'NULL' else 'NULL'
                arr_str = f"'{arr_time}'" if arr_time != 'NULL' else 'NULL'
                
                values.append(f"('{name}', '{bus_number}', {from_id}, {to_id}, {dep_str}, {arr_str}, {capacity}, '{category}', 1)")
            
            if not values:
                continue
                
            sql = f"""
                INSERT INTO buses (name, bus_number, from_location_id, to_location_id, departure_time, arrival_time, capacity, category, active)
                VALUES {','.join(values)}
                ON DUPLICATE KEY UPDATE
                    name = VALUES(name),
                    capacity = VALUES(capacity),
                    category = VALUES(category)
            """
            
            try:
                cursor.execute(sql)
                buses_inserted += len(values)
                
                if batch_num % 5 == 0:
                    conn.commit()
                    print(f"   Progress: {buses_inserted:,}/{len(buses):,} ({buses_inserted*100//max(len(buses),1)}%)")
            except mysql.connector.Error as e:
                if e.errno == 1062:  # Duplicate entry
                    # Skip duplicates and continue
                    print(f"   ⚠️  Skipped {len(values)} duplicate entries in batch {batch_num}")
                    continue
                else:
                    raise
        
        conn.commit()
        print(f"   ✅ Inserted {buses_inserted:,} buses")
        
        # Upload stops (stops are stored per-bus in JSON, not as a top-level key)
        stops_inserted = 0
        buses_with_stops = sum(1 for b in buses if b.get('stops'))
        if buses_with_stops > 0:
            print(f"\n🛑 Uploading stops ({buses_with_stops:,} buses have stop data)...")
            # Get bus IDs
            cursor.execute("SELECT id, bus_number FROM buses")
            for bus_id, bus_num in cursor.fetchall():
                bus_id_map[bus_num] = bus_id
            
            all_stops = []
            for bus in buses:
                stops = bus.get('stops', [])
                bus_num = bus.get('bus_number', '')
                bus_db_id = bus_id_map.get(bus_num)
                
                if not bus_db_id:
                    continue
                
                for stop_order, stop in enumerate(stops):
                    # JSON uses 'location' (or fallback 'landmark'/'name') as the stop identifier
                    raw_name = (stop.get('location') or stop.get('landmark') or stop.get('name') or '').strip().lower()
                    stop_loc_id = location_id_map.get(raw_name, 'NULL')
                    if stop_loc_id == 'NULL':
                        continue
                    
                    # JSON may use a single 'time' or separate arrival/departure fields
                    t = stop.get('time') or stop.get('arrival_time')
                    all_stops.append({
                        'bus_id': bus_db_id,
                        'location_id': stop_loc_id,
                        'stop_order': stop.get('stop_order', stop_order),
                        'arrival_time': t,
                        'departure_time': stop.get('departure_time', t)
                    })
            
            if all_stops:
                stop_batches = [all_stops[i:i + 500] for i in range(0, len(all_stops), 500)]
                for batch in stop_batches:
                    values = []
                    for stop in batch:
                        arr = f"'{stop['arrival_time']}'" if stop['arrival_time'] else 'NULL'
                        dep = f"'{stop['departure_time']}'" if stop['departure_time'] else 'NULL'
                        values.append(f"({stop['bus_id']}, {stop['location_id']}, {stop['stop_order']}, {arr}, {dep})")
                    
                    sql = f"""
                        INSERT INTO stops (bus_id, location_id, stop_order, arrival_time, departure_time)
                        VALUES {','.join(values)}
                    """
                    cursor.execute(sql)
                    stops_inserted += len(values)
                
                conn.commit()
                print(f"   ✅ Inserted {stops_inserted:,} stops")
        
        print(f"\n" + "=" * 70)
        print(f"✅ UPLOAD COMPLETE!")
        print(f"=" * 70)
        print(f"   Locations: {inserted:,}")
        print(f"   Buses:     {buses_inserted:,}")
        print(f"   Stops:     {stops_inserted:,}")
        print()
        
        return True
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        if conn:
            conn.rollback()
        return False
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()

if __name__ == "__main__":
    import sys
    success = fast_upload_production()
    sys.exit(0 if success else 1)
