#!/usr/bin/env python3

"""
Optimized Data Loader for Perundhu Local Development
Efficiently loads locations and consolidated buses data.

Usage:
    python3 fast_data_loader.py              # Load all data
    python3 fast_data_loader.py --locations  # Load only locations
    python3 fast_data_loader.py --buses      # Load only buses
"""

import json
import sys
import os
from pathlib import Path
from typing import Optional
import uuid
import mysql.connector
from mysql.connector import Error

class FastDataLoader:
    def __init__(self, host='localhost', user='root', password='root', database='perundhu', port=3306):
        self.host = host
        self.user = user
        self.password = password
        self.database = database
        self.port = port
        self.conn = None
        self.cursor = None
        self.data_dir = Path(__file__).parent.parent / 'data'
    
    def connect(self):
        try:
            self.conn = mysql.connector.connect(
                host=self.host, user=self.user, password=self.password,
                database=self.database, port=self.port,
                use_unicode=True, charset='utf8mb4'
            )
            self.cursor = self.conn.cursor()
            print(f"✅ Connected to {self.database}")
            return True
        except Error as err:
            print(f"❌ Connection failed: {err}")
            return False
    
    def disconnect(self):
        if self.cursor:
            self.cursor.close()
        if self.conn:
            self.conn.close()
            print("✅ Disconnected")
    
    def clean_data(self):
        try:
            print("\n🧹 Cleaning existing data...")
            self.cursor.execute("SET FOREIGN_KEY_CHECKS=0")
            for table in ['buses', 'stops', 'locations']:
                try:
                    self.cursor.execute(f"TRUNCATE TABLE {table}")
                    print(f"  ✓ Truncated {table}")
                except:
                    pass
            self.cursor.execute("SET FOREIGN_KEY_CHECKS=1")
            self.conn.commit()
            return True
        except Error as err:
            print(f"❌ Clean error: {err}")
            return False
    
    def load_locations(self):
        try:
            locations_file = self.data_dir / 'tamil_nadu_locations.json'
            if not locations_file.exists():
                print(f"⚠️  Locations file not found: {locations_file}")
                return False
            
            print(f"\n📍 Loading locations...")
            with open(locations_file, 'r', encoding='utf-8') as f:
                locations = json.load(f)
            
            print(f"  📊 Total: {len(locations):,}")
            
            batch_size = 500
            loaded = 0
            errors = 0
            
            for i in range(0, len(locations), batch_size):
                batch = locations[i:i+batch_size]
                for loc in batch:
                    try:
                        # id is auto_increment, so don't insert it
                        self.cursor.execute("""
                            INSERT INTO locations 
                            (name, type, latitude, longitude, osm_id, location_type)
                            VALUES (%s, %s, %s, %s, %s, %s)
                        """, (
                            loc.get('name', 'Unknown'), 
                            loc.get('type', 'unknown'),
                            float(loc.get('latitude', 0)) if loc.get('latitude') else None, 
                            float(loc.get('longitude', 0)) if loc.get('longitude') else None,
                            int(loc.get('osm_id')) if loc.get('osm_id') else None,
                            'CITY'
                        ))
                        loaded += 1
                    except Exception as e:
                        errors += 1
                
                self.conn.commit()
                if (i + batch_size) % 2000 == 0:
                    percent = min(100, (i + batch_size) / len(locations) * 100)
                    print(f"  ✓ {loaded:,} loaded, {percent:.0f}%", end='\r')
            
            print(f"\n✅ Locations loaded: {loaded:,}")
            return loaded > 0
        except Exception as e:
            print(f"❌ Error: {e}")
            self.conn.rollback()
            return False
    
    def get_location_id(self, location_name: str) -> Optional[str]:
        if not location_name:
            return None
        try:
            self.cursor.execute(
                "SELECT id FROM locations WHERE UPPER(name) LIKE UPPER(%s) LIMIT 1",
                (f"%{location_name}%",)
            )
            result = self.cursor.fetchone()
            return result[0] if result else None
        except:
            return None
    
    def load_buses(self):
        try:
            buses_file = self.data_dir / 'consolidated_buses.json'
            if not buses_file.exists():
                print(f"⚠️  Buses file not found")
                return False
            
            print(f"\n🚌 Loading buses...")
            
            # Stream process the large JSON file
            with open(buses_file, 'r', encoding='utf-8') as f:
                buses_data = json.load(f)
            
            buses = buses_data if isinstance(buses_data, list) else buses_data.get('buses', buses_data.get('routes', []))
            print(f"  📊 Total: {len(buses):,}")
            
            location_cache = {}
            loaded = 0
            skipped = 0
            
            for idx, bus in enumerate(buses):
                try:
                    origin = bus.get('origin', '')
                    destination = bus.get('destination', '')
                    
                    if origin not in location_cache:
                        location_cache[origin] = self.get_location_id(origin)
                    if destination not in location_cache:
                        location_cache[destination] = self.get_location_id(destination)
                    
                    origin_id = location_cache[origin]
                    destination_id = location_cache[destination]
                    
                    if not origin_id or not destination_id:
                        skipped += 1
                        continue
                    
                    # id is auto_increment for buses too - don't specify it
                    self.cursor.execute("""
                        INSERT INTO buses 
                        (bus_number, name, from_location_id, to_location_id,
                         departure_time, arrival_time, capacity, category, active, service_code, source)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    """, (
                        bus.get('bus_number', ''), bus.get('bus_name', ''),
                        origin_id, destination_id,
                        bus.get('departure_time', ''), bus.get('arrival_time', ''),
                        50, bus.get('bus_type', 'Standard'), 1,
                        bus.get('service_code', ''), bus.get('source', 'TNSTC')
                    ))
                    loaded += 1
                    
                    if (idx + 1) % 1000 == 0:
                        self.conn.commit()
                        pct = (idx + 1) / len(buses) * 100
                        print(f"  ✓ {loaded:,} loaded, {skipped:,} skipped ({pct:.0f}%)", end='\r')
                except Exception as e:
                    pass
            
            self.conn.commit()
            print(f"\n✅ Buses loaded: {loaded:,}, Skipped: {skipped:,}")
            return True
        except Exception as e:
            print(f"❌ Error: {e}")
            self.conn.rollback()
            return False
    
    def verify(self):
        try:
            print(f"\n🔍 Verifying data...")
            self.cursor.execute("SELECT COUNT(*) FROM locations")
            loc_count = self.cursor.fetchone()[0]
            self.cursor.execute("SELECT COUNT(*) FROM buses")
            bus_count = self.cursor.fetchone()[0]
            print(f"  ✓ Locations: {loc_count:,}")
            print(f"  ✓ Buses: {bus_count:,}")
            return True
        except Exception as e:
            print(f"❌ Error: {e}")
            return False

def main():
    print("="*70)
    print("🚀 PERUNDHU FAST DATA LOADER")
    print("="*70)
    
    loader = FastDataLoader()
    if not loader.connect():
        return 1
    
    try:
        loader.clean_data()
        loader.load_locations()
        loader.load_buses()
        loader.verify()
        print("\n✅ Data loading complete!")
        return 0
    except Exception as e:
        print(f"\n❌ Error: {e}")
        return 1
    finally:
        loader.disconnect()

if __name__ == '__main__':
    exit(main())
