#!/usr/bin/env python3
"""Fast bulk insert for locations using executemany"""

import json
import mysql.connector
import os
import sys
from typing import List, Tuple

def load_locations(filepath: str) -> List[Tuple]:
    """Load locations from JSON file and convert to tuples"""
    print(f"📂 Loading locations from {filepath}...")
    with open(filepath, 'r') as f:
        data = json.load(f)
    
    records = []
    for loc in data:
        record = (
            loc.get('name'),
            loc.get('latitude'),
            loc.get('longitude'),
            loc.get('district'),
            loc.get('state', 'Tamil Nadu'),
            loc.get('osm_id'),
            loc.get('type'),
            loc.get('neighborhood'),
            loc.get('priority', 0)
        )
        records.append(record)
    
    print(f"✅ Loaded {len(records)} locations")
    return records

def bulk_insert(records: List[Tuple], db_config: dict, batch_size: int = 5000):
    """Bulk insert with executemany"""
    print(f"🔗 Connecting to {db_config['host']}:{db_config['port']}...")
    conn = mysql.connector.connect(**db_config)
    cursor = conn.cursor()
    
    print(f"✅ Connected to database: {db_config['database']}")
    
    query = """
        INSERT INTO locations (name, latitude, longitude, district, state, osm_id, type, neighborhood, priority)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        ON DUPLICATE KEY UPDATE
            district = VALUES(district),
            latitude = VALUES(latitude),
            longitude = VALUES(longitude),
            updated_at = NOW()
    """
    
    total = len(records)
    inserted = 0
    
    print(f"🚀 Uploading {total} locations in batches of {batch_size}...")
    
    for i in range(0, total, batch_size):
        batch = records[i:i+batch_size]
        cursor.executemany(query, batch)
        conn.commit()
        inserted += len(batch)
        print(f"✅ Progress: {inserted}/{total} locations ({inserted*100//total}%)")
    
    cursor.close()
    conn.close()
    
    print(f"\n🎉 Upload complete! Inserted {inserted} locations")

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
    
    filepath = sys.argv[1] if len(sys.argv) > 1 else 'data/tamil_nadu_locations_enhanced.json'
    batch_size = int(sys.argv[2]) if len(sys.argv) > 2 else 5000
    
    try:
        records = load_locations(filepath)
        bulk_insert(records, db_config, batch_size)
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
