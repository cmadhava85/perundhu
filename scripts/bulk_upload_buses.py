#!/usr/bin/env python3
"""Fast bulk insert for buses - optimized for performance"""

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
    
    cursor.execute("""
        SELECT id, name, district
        FROM locations
    """)
    
    location_map = {}
    for loc_id, name, district in cursor.fetchall():
        # Create multiple lookup keys for fast matching
        normalized_name = name.strip().upper()
        location_map[normalized_name] = loc_id
        
        # Also add district-qualified version
        if district:
            qualified = f"{normalized_name}|{district.strip().upper()}"
            location_map[qualified] = loc_id
    
    elapsed = time.time() - start
    print(f"✅ Loaded {len(location_map)} location mappings in {elapsed:.1f}s")
    return location_map

def resolve_location_id(location_name: str, location_map: Dict[str, int]) -> Optional[int]:
    """Fast location lookup with normalized keys"""
    if not location_name:
        return None
    
    normalized = location_name.strip().upper()
    
    # Direct lookup (fastest)
    if normalized in location_map:
        return location_map[normalized]
    
    # Try common variations
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

def prepare_bus_records(buses_data: List[dict], location_map: Dict[str, int]) -> Tuple[List[Tuple], List[Tuple]]:
    """Prepare bus and stop records for bulk insert"""
    print(f"📂 Preparing {len(buses_data)} buses...")
    start = time.time()
    
    bus_records = []
    stop_records = []
    skipped_no_origin = 0
    skipped_no_destination = 0
    skipped_examples = []
    
    for bus in buses_data:
        # Resolve locations
        origin = bus.get('origin')
        destination = bus.get('destination')
        
        from_loc_id = resolve_location_id(origin, location_map)
        to_loc_id = resolve_location_id(destination, location_map)
        
        # Skip if EITHER location cannot be resolved
        if not from_loc_id:
            skipped_no_origin += 1
            if len(skipped_examples) < 5:
                skipped_examples.append(f"Origin: '{origin}'")
            continue
        
        if not to_loc_id:
            skipped_no_destination += 1
            if len(skipped_examples) < 5:
                skipped_examples.append(f"Destination: '{destination}' (from '{origin}')")
            continue
        
        # Prepare bus record - both locations validated!
        bus_record = (
            bus.get('bus_name', bus.get('bus_number')),  # name
            bus.get('bus_number'),
            from_loc_id,
            to_loc_id,
            bus.get('departure_time'),
            bus.get('arrival_time'),
            int(bus.get('available_seats', 45)) if bus.get('available_seats') != 'N/A' else 45,
            bus.get('bus_type', 'Standard'),
            True  # active
        )
        bus_records.append(bus_record)
        
        # Note: We'll need the auto-increment bus_id, so stops need to be inserted after buses
        # For now, we'll skip stops in bulk insert and do them separately
    
    elapsed = time.time() - start
    total_skipped = skipped_no_origin + skipped_no_destination
    print(f"✅ Prepared {len(bus_records)} buses in {elapsed:.1f}s")
    print(f"⚠️  Skipped {total_skipped} buses: {skipped_no_origin} missing origin, {skipped_no_destination} missing destination")
    if skipped_examples:
        print(f"   Examples of skipped:")
        for example in skipped_examples:
            print(f"   - {example}")
    return bus_records, stop_records

def bulk_insert_buses(bus_records: List[Tuple], db_config: dict, batch_size: int = 1000):
    """Bulk insert buses with executemany"""
    print(f"🔗 Connecting to {db_config['host']}:{db_config['port']}...")
    conn = mysql.connector.connect(**db_config)
    cursor = conn.cursor()
    
    print(f"✅ Connected to database: {db_config['database']}")
    
    # Load location map
    location_map = load_location_map(cursor)
    
    # Prepare records
    bus_records_prepared, _ = prepare_bus_records(bus_records, location_map)
    
    query = """
        INSERT INTO buses (name, bus_number, from_location_id, to_location_id, 
                          departure_time, arrival_time, capacity, category, active)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        ON DUPLICATE KEY UPDATE
            from_location_id = VALUES(from_location_id),
            to_location_id = VALUES(to_location_id),
            departure_time = VALUES(departure_time),
            arrival_time = VALUES(arrival_time),
            capacity = VALUES(capacity),
            category = VALUES(category)
    """
    
    total = len(bus_records_prepared)
    inserted = 0
    
    print(f"🚀 Uploading {total} buses in batches of {batch_size}...")
    start = time.time()
    
    for i in range(0, total, batch_size):
        batch = bus_records_prepared[i:i+batch_size]
        cursor.executemany(query, batch)
        conn.commit()
        inserted += len(batch)
        elapsed = time.time() - start
        rate = inserted / elapsed if elapsed > 0 else 0
        print(f"✅ Progress: {inserted}/{total} buses ({inserted*100//total}%) - {rate:.1f} buses/sec")
    
    cursor.close()
    conn.close()
    
    total_time = time.time() - start
    print(f"\n🎉 Upload complete! Inserted {inserted} buses in {total_time:.1f}s ({inserted/total_time:.1f} buses/sec)")

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
        
        # Extract buses array from JSON structure
        if isinstance(data, dict) and 'buses' in data:
            buses = data['buses']
        elif isinstance(data, list):
            buses = data
        else:
            print(f"❌ Error: Unexpected JSON structure")
            sys.exit(1)
        
        print(f"📂 Loaded {len(buses)} buses from {filepath}")
        bulk_insert_buses(buses, db_config, batch_size)
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
