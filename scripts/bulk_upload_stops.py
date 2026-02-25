#!/usr/bin/env python3
"""Fast bulk insert for bus stops"""

import json
import mysql.connector
import os
import sys
from typing import List, Tuple, Dict, Optional
import time

def load_location_map(cursor) -> Dict[str, int]:
    """Build fast location lookup with normalized keys"""
    print("📋 Loading location map...")
    start = time.time()
    
    cursor.execute("SELECT id, name, district FROM locations")
    
    location_map = {}
    for loc_id, name, district in cursor.fetchall():
        normalized_name = name.strip().upper()
        location_map[normalized_name] = loc_id
        
        if district:
            qualified = f"{normalized_name}|{district.strip().upper()}"
            location_map[qualified] = loc_id
    
    elapsed = time.time() - start
    print(f"✅ Loaded {len(location_map)} location mappings in {elapsed:.1f}s")
    return location_map

def load_bus_map(cursor) -> Dict[str, int]:
    """Build map of bus_number -> bus_id"""
    print("📋 Loading bus map...")
    start = time.time()
    
    cursor.execute("SELECT id, bus_number FROM buses")
    
    bus_map = {}
    for bus_id, bus_number in cursor.fetchall():
        bus_map[bus_number.strip()] = bus_id
    
    elapsed = time.time() - start
    print(f"✅ Loaded {len(bus_map)} buses in {elapsed:.1f}s")
    return bus_map

def resolve_location_id(location_name: str, location_map: Dict[str, int]) -> Optional[int]:
    """Fast location lookup"""
    if not location_name:
        return None
    
    normalized = location_name.strip().upper()
    
    if normalized in location_map:
        return location_map[normalized]
    
    # Try variations
    variations = [
        normalized.replace("CHENNAI - ", ""),
        normalized.replace("CHENNAI-", ""),
        normalized.replace(" (KOYAMBEDU)", ""),
        normalized.replace(" - ", " "),
        normalized.replace("-", " "),
    ]
    
    for variation in variations:
        if variation in location_map:
            return location_map[variation]
    
    return None

def prepare_stop_records(buses_data: List[dict], bus_map: Dict[str, int], 
                         location_map: Dict[str, int]) -> Tuple[List[Tuple], int, int]:
    """Prepare stop records for bulk insert"""
    print(f"📂 Preparing stops from bus data...")
    start = time.time()
    
    stop_records = []
    buses_processed = 0
    buses_with_stops = 0
    stops_skipped = 0
    
    for bus in buses_data:
        bus_number = bus.get('bus_number', '').strip()
        stops = bus.get('stops', [])
        
        if not stops or not bus_number:
            continue
        
        buses_with_stops += 1
        
        # Get bus_id from database
        bus_id = bus_map.get(bus_number)
        if not bus_id:
            stops_skipped += len(stops)
            continue
        
        # Process each stop
        for idx, stop in enumerate(stops):
            # Use landmark (bus stop name) instead of location (city name)
            stop_name = stop.get('landmark', stop.get('location', ''))
            if not stop_name:
                stops_skipped += 1
                continue
            
            # Resolve location
            location_id = resolve_location_id(stop_name, location_map)
            
            # Parse time
            stop_time = stop.get('time', '')
            arrival_time = stop_time if stop_time else None
            departure_time = stop_time if stop_time else None
            
            # Create stop record
            stop_record = (
                stop_name,           # name
                bus_id,              # bus_id
                location_id,         # location_id (can be NULL)
                arrival_time,        # arrival_time
                departure_time,      # departure_time
                idx + 1,             # stop_order (1-indexed)
                json.dumps(stop)     # stops_json
            )
            stop_records.append(stop_record)
        
        buses_processed += 1
    
    elapsed = time.time() - start
    print(f"✅ Prepared {len(stop_records)} stops from {buses_processed} buses in {elapsed:.1f}s")
    print(f"   Buses with stops: {buses_with_stops}")
    print(f"   Stops skipped (no location match): {stops_skipped}")
    return stop_records, buses_processed, buses_with_stops

def bulk_insert_stops(stop_records: List[Tuple], db_config: dict, batch_size: int = 1000):
    """Bulk insert stops"""
    print(f"🔗 Connecting to {db_config['host']}:{db_config['port']}...")
    conn = mysql.connector.connect(**db_config)
    cursor = conn.cursor()
    
    print(f"✅ Connected to database: {db_config['database']}")
    
    # Load maps
    location_map = load_location_map(cursor)
    bus_map = load_bus_map(cursor)
    
    # Prepare records
    stop_records_prepared, buses_processed, buses_with_stops = prepare_stop_records(
        stop_records, bus_map, location_map
    )
    
    if not stop_records_prepared:
        print("❌ No stops to upload")
        cursor.close()
        conn.close()
        return
    
    query = """
        INSERT INTO stops (name, bus_id, location_id, arrival_time, departure_time, stop_order, stops_json)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
        ON DUPLICATE KEY UPDATE
            location_id = VALUES(location_id),
            arrival_time = VALUES(arrival_time),
            departure_time = VALUES(departure_time),
            stops_json = VALUES(stops_json)
    """
    
    total = len(stop_records_prepared)
    inserted = 0
    
    print(f"🚀 Uploading {total} stops in batches of {batch_size}...")
    start = time.time()
    
    for i in range(0, total, batch_size):
        batch = stop_records_prepared[i:i+batch_size]
        cursor.executemany(query, batch)
        conn.commit()
        inserted += len(batch)
        elapsed = time.time() - start
        rate = inserted / elapsed if elapsed > 0 else 0
        print(f"✅ Progress: {inserted}/{total} stops ({inserted*100//total}%) - {rate:.1f} stops/sec")
    
    cursor.close()
    conn.close()
    
    total_time = time.time() - start
    print(f"\n🎉 Upload complete! Inserted {inserted} stops in {total_time:.1f}s ({inserted/total_time:.1f} stops/sec)")

if __name__ == "__main__":
    # Get database config from environment
    db_config = {
        'host': os.getenv('DB_HOST_PREPROD', '127.0.0.1'),
        'port': int(os.getenv('DB_PORT_PREPROD', '3307')),
        'user': os.getenv('DB_USER_PREPROD', 'perundhu_user'),
        'password': os.getenv('DB_PASSWORD_PREPROD'),
        'database': os.getenv('DB_NAME_PREPROD', 'perundhu'),
        'autocommit': False
    }
    
    if not db_config['password']:
        print("❌ Error: DB_PASSWORD_PREPROD environment variable not set")
        sys.exit(1)
    
    filepath = sys.argv[1] if len(sys.argv) > 1 else 'data/consolidated_buses.json'
    batch_size = int(sys.argv[2]) if len(sys.argv) > 2 else 1000
    
    try:
        with open(filepath, 'r') as f:
            data = json.load(f)
        
        # Extract buses array
        if isinstance(data, dict) and 'buses' in data:
            buses = data['buses']
        elif isinstance(data, list):
            buses = data
        else:
            print(f"❌ Error: Unexpected JSON structure")
            sys.exit(1)
        
        print(f"📂 Loaded {len(buses)} buses from {filepath}")
        
        # Filter to only buses with stops
        buses_with_stops = [b for b in buses if b.get('stops') and len(b['stops']) > 0]
        print(f"📂 Found {len(buses_with_stops)} buses with stop data")
        
        bulk_insert_stops(buses_with_stops, db_config, batch_size)
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
