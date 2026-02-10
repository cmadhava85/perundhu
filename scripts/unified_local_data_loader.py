#!/usr/bin/env python3

"""
Unified Data Loader for Perundhu Local Development
Loads locations, buses, stops, and other data into local MySQL database.

Usage:
    python3 unified_local_data_loader.py              # Load all data
    python3 unified_local_data_loader.py --locations  # Load only locations
    python3 unified_local_data_loader.py --buses      # Load only buses
    python3 unified_local_data_loader.py --clean      # Clean all data first
    python3 unified_local_data_loader.py --help       # Show help
"""

import json
import sys
import os
import argparse
import time
import re
from pathlib import Path
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass
from collections import defaultdict
import mysql.connector
from mysql.connector import Error

# Color codes for terminal output
class Colors:
    HEADER = '\033[95m'
    OKBLUE = '\033[94m'
    OKCYAN = '\033[96m'
    OKGREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'

@dataclass
class LoadStats:
    """Track loading statistics"""
    locations_loaded: int = 0
    locations_skipped: int = 0
    buses_loaded: int = 0
    buses_skipped: int = 0
    stops_loaded: int = 0
    stops_skipped: int = 0
    errors: int = 0
    
    def total_loaded(self) -> int:
        return self.locations_loaded + self.buses_loaded + self.stops_loaded
    
    def total_skipped(self) -> int:
        return self.locations_skipped + self.buses_skipped + self.stops_skipped

class PerundhuDataLoader:
    """Unified data loader for Perundhu local development"""
    
    def __init__(self, 
                 host: str = 'localhost',
                 user: str = 'root',
                 password: str = 'root',
                 database: str = 'perundhu',
                 port: int = 3306):
        self.host = host
        self.user = user
        self.password = password
        self.database = database
        self.port = port
        self.conn = None
        self.cursor = None
        self.stats = LoadStats()
        self.data_dir = Path(__file__).parent.parent / 'data'
        self.location_index = None
        self.location_cache = {}
        
    def connect(self) -> bool:
        """Connect to database"""
        try:
            self.conn = mysql.connector.connect(
                host=self.host,
                user=self.user,
                password=self.password,
                database=self.database,
                port=self.port,
                use_unicode=True,
                charset='utf8mb4',
                collation='utf8mb4_unicode_ci'
            )
            self.cursor = self.conn.cursor()
            print(f"{Colors.OKGREEN}✅ Connected to {self.database} on {self.host}:{self.port}{Colors.ENDC}")
            return True
        except Error as err:
            print(f"{Colors.FAIL}❌ Connection failed: {err}{Colors.ENDC}")
            return False
    
    def disconnect(self):
        """Disconnect from database"""
        if self.cursor:
            self.cursor.close()
        if self.conn:
            self.conn.close()
            print(f"{Colors.OKGREEN}✅ Disconnected from database{Colors.ENDC}")
    
    def clean_data(self) -> bool:
        """Clean existing data from tables"""
        try:
            print(f"\n{Colors.WARNING}🧹 Cleaning existing data...{Colors.ENDC}")
            
            # Disable foreign key checks
            self.cursor.execute("SET FOREIGN_KEY_CHECKS=0")
            
            tables = ['buses', 'stops', 'locations', 'location_aliases', 'translations']
            for table in tables:
                try:
                    self.cursor.execute(f"TRUNCATE TABLE {table}")
                    print(f"  ✓ Truncated {table}")
                except Error as e:
                    print(f"  ⚠️  {table}: {e}")
            
            # Re-enable foreign key checks
            self.cursor.execute("SET FOREIGN_KEY_CHECKS=1")
            self.conn.commit()
            
            print(f"{Colors.OKGREEN}✅ Data cleaned{Colors.ENDC}")
            return True
        except Error as err:
            print(f"{Colors.FAIL}❌ Clean error: {err}{Colors.ENDC}")
            return False
    
    def load_locations(self) -> bool:
        """Load locations from JSON file"""
        try:
            locations_file = self.data_dir / 'tamil_nadu_locations.json'
            
            if not locations_file.exists():
                print(f"{Colors.WARNING}⚠️  Locations file not found: {locations_file}{Colors.ENDC}")
                return False
            
            print(f"\n{Colors.OKBLUE}📍 Loading locations...{Colors.ENDC}")
            with open(locations_file, 'r', encoding='utf-8') as f:
                locations = json.load(f)
            
            print(f"  📊 Total locations to import: {len(locations):,}")
            
            batch_size = 500
            for i in range(0, len(locations), batch_size):
                batch = locations[i:i+batch_size]
                
                for loc in batch:
                    try:
                        # Check if location already exists
                        self.cursor.execute(
                            "SELECT id FROM locations WHERE name = %s AND latitude = %s AND longitude = %s LIMIT 1",
                            (loc.get('name'), loc.get('latitude'), loc.get('longitude'))
                        )
                        
                        if self.cursor.fetchone():
                            self.stats.locations_skipped += 1
                            continue
                        
                        # id is auto_increment, so don't insert it
                        self.cursor.execute("""
                            INSERT INTO locations 
                            (name, type, latitude, longitude, osm_id, created_at, updated_at)
                            VALUES (%s, %s, %s, %s, %s, NOW(), NOW())
                        """, (
                            loc.get('name'),
                            loc.get('type', 'unknown'),
                            float(loc.get('latitude', 0)),
                            float(loc.get('longitude', 0)),
                            int(loc.get('osm_id')) if loc.get('osm_id') else None
                        ))
                        
                        self.stats.locations_loaded += 1
                        
                    except Exception as e:
                        self.stats.errors += 1
                        # print(f"    ❌ Error loading location: {e}")
                
                self.conn.commit()
                percent = min(100, (i + len(batch)) / len(locations) * 100)
                print(f"  ✓ {self.stats.locations_loaded:,} / {len(locations):,} ({percent:.1f}%)")
            
            print(f"{Colors.OKGREEN}✅ Locations loaded: {self.stats.locations_loaded:,}{Colors.ENDC}")
            return True
            
        except Exception as err:
            print(f"{Colors.FAIL}❌ Load locations error: {err}{Colors.ENDC}")
            self.conn.rollback()
            return False
    
    def normalize_location_name(self, name: str) -> str:
        """Normalize location names for matching"""
        if not name:
            return ""
        normalized = re.sub(r"[^A-Za-z0-9]+", " ", name.upper()).strip()
        normalized = re.sub(r"\s+", " ", normalized)
        return normalized

    def location_key_candidates(self, name: str) -> List[str]:
        normalized = self.normalize_location_name(name)
        if not normalized:
            return []

        candidates = [normalized]
        tokens = normalized.split()
        tokens_no_single = [token for token in tokens if len(token) > 1]
        if tokens_no_single:
            candidate = " ".join(tokens_no_single)
            if candidate not in candidates:
                candidates.append(candidate)

        suffixes = {
            "BUS",
            "STAND",
            "BUSSTAND",
            "BUSTAND",
            "STOP",
            "TERMINUS",
            "TERMINAL",
            "JUNCTION",
            "JCT",
            "JN",
            "STN",
        }
        tokens_trimmed = [token for token in tokens_no_single if token not in suffixes]
        if tokens_trimmed:
            candidate = " ".join(tokens_trimmed)
            if candidate not in candidates:
                candidates.append(candidate)

        return candidates

    def build_location_index(self) -> Dict[str, int]:
        """Build in-memory index of locations and aliases for fast matching"""
        index: Dict[str, int] = {}
        self.cursor.execute("SELECT id, name FROM locations")
        for location_id, name in self.cursor.fetchall():
            key = self.normalize_location_name(name)
            if key and key not in index:
                index[key] = location_id

        try:
            self.cursor.execute("SELECT location_id, alias FROM location_aliases")
            for location_id, alias in self.cursor.fetchall():
                key = self.normalize_location_name(alias)
                if key and key not in index:
                    index[key] = location_id
        except Error:
            pass

        return index

    def get_location_id(self, location_name: str) -> Optional[int]:
        """Get location ID by name or alias using normalized index"""
        if not location_name:
            return None

        if self.location_index is None:
            self.location_index = self.build_location_index()

        if location_name in self.location_cache:
            return self.location_cache[location_name]

        for candidate in self.location_key_candidates(location_name):
            if candidate in self.location_index:
                self.location_cache[location_name] = self.location_index[candidate]
                return self.location_cache[location_name]

        # Create a placeholder location when no match is found
        self.cursor.execute(
            """
            INSERT INTO locations (name, location_type, type, created_at, updated_at)
            VALUES (%s, %s, %s, NOW(), NOW())
            """,
            (location_name.strip(), "CITY", "unknown")
        )
        location_id = self.cursor.lastrowid
        normalized_key = self.normalize_location_name(location_name)
        if normalized_key:
            self.location_index[normalized_key] = location_id
        self.location_cache[location_name] = location_id
        return location_id
    
    def load_buses(self) -> bool:
        """Load buses from JSON file"""
        try:
            # Try consolidated_buses.json first, fall back to test_buses_small.json
            buses_file = self.data_dir / 'consolidated_buses.json'
            if not buses_file.exists():
                buses_file = self.data_dir / 'test_buses_small.json'
            
            if not buses_file.exists():
                print(f"{Colors.WARNING}⚠️  Buses file not found{Colors.ENDC}")
                return False
            
            print(f"\n{Colors.OKBLUE}🚌 Loading buses...{Colors.ENDC}")
            with open(buses_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            buses = data.get('buses', [])
            print(f"  📊 Total buses to import: {len(buses):,}")
            
            self.location_index = self.build_location_index()
            self.location_cache = {}

            def normalize_time(value: Optional[str]) -> Optional[str]:
                if not value:
                    return None
                value = value.strip()
                return value if value else None

            def parse_capacity(value: Optional[str]) -> int:
                if not value:
                    return 50
                digits = "".join(ch for ch in value if ch.isdigit())
                return int(digits) if digits else 50
            
            for idx, bus in enumerate(buses):
                try:
                    # Get or resolve location IDs
                    origin = bus.get('origin', '')
                    destination = bus.get('destination', '')
                    
                    # Use cache or look up
                    origin_id = self.get_location_id(origin)
                    destination_id = self.get_location_id(destination)
                    
                    if not origin_id or not destination_id:
                        self.stats.buses_skipped += 1
                        continue
                    
                    # id is auto_increment, so don't insert it
                    self.cursor.execute("""
                        INSERT INTO buses 
                        (bus_number, name, from_location_id, to_location_id,
                         departure_time, arrival_time, capacity, category,
                         active, features, created_at, updated_at)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW(), NOW())
                    """, (
                        bus.get('bus_number', ''),
                        bus.get('bus_name', 'Unknown'),
                        origin_id,
                        destination_id,
                        normalize_time(bus.get('departure_time')),
                        normalize_time(bus.get('arrival_time')),
                        parse_capacity(bus.get('available_seats')),
                        bus.get('bus_type', 'Standard'),
                        1,  # active
                        bus.get('operator') or bus.get('source')
                    ))

                    bus_id = self.cursor.lastrowid
                    
                    # Store stops if available
                    stops_data = bus.get('stops', [])
                    for stop_idx, stop in enumerate(stops_data):
                        stop_location_name = (
                            stop.get('landmark')
                            or stop.get('location')
                            or stop.get('original_city')
                            or ''
                        )
                        stop_location_id = self.get_location_id(stop_location_name)
                        
                        if stop_location_id:
                            self.cursor.execute("""
                                INSERT INTO stops
                                (name, bus_id, location_id, arrival_time, departure_time,
                                 stop_order, stops_json, created_at, updated_at)
                                VALUES (%s, %s, %s, %s, %s, %s, %s, NOW(), NOW())
                            """, (
                                stop_location_name or 'Stop',
                                bus_id,
                                stop_location_id,
                                normalize_time(stop.get('time')),
                                normalize_time(stop.get('time')),
                                stop_idx,
                                json.dumps(stop, ensure_ascii=True)
                            ))
                            self.stats.stops_loaded += 1
                        else:
                            self.stats.stops_skipped += 1
                    
                    self.stats.buses_loaded += 1
                    
                    if (idx + 1) % 100 == 0:
                        self.conn.commit()
                        print(f"  ✓ {self.stats.buses_loaded:,} / {len(buses):,} buses")
                    
                except Exception as e:
                    self.stats.errors += 1
                    # print(f"    ❌ Error loading bus: {e}")
            
            self.conn.commit()
            
            print(f"{Colors.OKGREEN}✅ Buses loaded: {self.stats.buses_loaded:,}{Colors.ENDC}")
            if self.stats.stops_loaded > 0:
                print(f"{Colors.OKGREEN}✅ Stops loaded: {self.stats.stops_loaded:,}{Colors.ENDC}")
            
            return True
            
        except Exception as err:
            print(f"{Colors.FAIL}❌ Load buses error: {err}{Colors.ENDC}")
            self.conn.rollback()
            return False
    
    def verify_data(self) -> bool:
        """Verify loaded data"""
        try:
            print(f"\n{Colors.OKBLUE}🔍 Verifying loaded data...{Colors.ENDC}")
            
            # Count by table
            tables = {
                'locations': 'SELECT COUNT(*) FROM locations',
                'buses': 'SELECT COUNT(*) FROM buses',
                'stops': 'SELECT COUNT(*) FROM stops',
            }
            
            for table_name, query in tables.items():
                self.cursor.execute(query)
                count = self.cursor.fetchone()[0]
                print(f"  ✓ {table_name}: {count:,}")
            
            # Show location types
            self.cursor.execute("""
                SELECT type, COUNT(*) as count 
                FROM locations 
                GROUP BY type 
                ORDER BY count DESC 
                LIMIT 10
            """)
            
            print(f"\n  📊 Top location types:")
            for row in self.cursor.fetchall():
                loc_type, count = row
                print(f"     • {loc_type}: {count:,}")
            
            # Show bus sources
            self.cursor.execute("""
                SELECT source, COUNT(*) as count 
                FROM buses 
                GROUP BY source 
                ORDER BY count DESC
            """)
            
            print(f"\n  📊 Buses by source:")
            for row in self.cursor.fetchall():
                source, count = row
                print(f"     • {source}: {count:,}")
            
            # Geographic bounds
            self.cursor.execute("""
                SELECT 
                  MIN(latitude) as min_lat,
                  MAX(latitude) as max_lat,
                  MIN(longitude) as min_lon,
                  MAX(longitude) as max_lon
                FROM locations
            """)
            
            result = self.cursor.fetchone()
            if result:
                min_lat, max_lat, min_lon, max_lon = result
                print(f"\n  📍 Geographic bounds:")
                print(f"     • Latitude:  {min_lat:.4f}° to {max_lat:.4f}°N")
                print(f"     • Longitude: {min_lon:.4f}° to {max_lon:.4f}°E")
            
            print(f"{Colors.OKGREEN}✅ Verification complete{Colors.ENDC}")
            return True
            
        except Exception as err:
            print(f"{Colors.FAIL}❌ Verification error: {err}{Colors.ENDC}")
            return False
    
    def print_summary(self):
        """Print loading summary"""
        print(f"\n{'='*70}")
        print(f"{Colors.BOLD}📊 DATA LOAD SUMMARY{Colors.ENDC}")
        print(f"{'='*70}")
        
        print(f"\n{Colors.OKGREEN}✅ Loaded:{Colors.ENDC}")
        print(f"   • Locations: {self.stats.locations_loaded:,}")
        print(f"   • Buses:     {self.stats.buses_loaded:,}")
        print(f"   • Stops:     {self.stats.stops_loaded:,}")
        print(f"   • Total:     {self.stats.total_loaded():,}")
        
        if self.stats.total_skipped() > 0:
            print(f"\n{Colors.WARNING}⚠️  Skipped:{Colors.ENDC}")
            print(f"   • Locations: {self.stats.locations_skipped:,}")
            print(f"   • Buses:     {self.stats.buses_skipped:,}")
            print(f"   • Stops:     {self.stats.stops_skipped:,}")
            print(f"   • Total:     {self.stats.total_skipped():,}")
        
        if self.stats.errors > 0:
            print(f"\n{Colors.FAIL}❌ Errors: {self.stats.errors:,}{Colors.ENDC}")
        
        print(f"\n{'='*70}\n")

def main():
    """Main execution"""
    parser = argparse.ArgumentParser(
        description='Unified Data Loader for Perundhu Local Development'
    )
    parser.add_argument('--locations', action='store_true', 
                       help='Load only locations')
    parser.add_argument('--buses', action='store_true',
                       help='Load only buses')
    parser.add_argument('--clean', action='store_true',
                       help='Clean existing data before loading')
    parser.add_argument('--host', default='localhost',
                       help='Database host (default: localhost)')
    parser.add_argument('--user', default='root',
                       help='Database user (default: root)')
    parser.add_argument('--password', default='root',
                       help='Database password (default: root)')
    parser.add_argument('--database', default='perundhu',
                       help='Database name (default: perundhu)')
    parser.add_argument('--port', type=int, default=3306,
                       help='Database port (default: 3306)')
    parser.add_argument('--verify', action='store_true',
                       help='Verify data after loading (default: true)')
    
    args = parser.parse_args()
    
    # Print header
    print(f"{'='*70}")
    print(f"{Colors.BOLD}{Colors.HEADER}🚀 PERUNDHU DATA LOADER - LOCAL DEVELOPMENT{Colors.ENDC}")
    print(f"{'='*70}\n")
    
    # Create loader
    loader = PerundhuDataLoader(
        host=args.host,
        user=args.user,
        password=args.password,
        database=args.database,
        port=args.port
    )
    
    # Connect
    if not loader.connect():
        return 1
    
    try:
        start_time = time.time()
        
        # Clean if requested
        if args.clean:
            if not loader.clean_data():
                return 1
        
        # Determine what to load
        load_locations = not args.buses  # Load locations by default unless only buses requested
        load_buses = not args.locations  # Load buses by default unless only locations requested
        
        if args.locations:
            load_buses = False
        if args.buses:
            load_locations = False
        
        # Load data
        success = True
        
        if load_locations:
            if not loader.load_locations():
                success = False
        
        if load_buses:
            if not loader.load_buses():
                success = False
        
        # Verify
        if args.verify:
            loader.verify_data()
        
        # Print summary
        elapsed_time = time.time() - start_time
        loader.print_summary()
        print(f"⏱️  Time elapsed: {elapsed_time:.1f} seconds\n")
        
        return 0 if success else 1
        
    finally:
        loader.disconnect()


if __name__ == '__main__':
    exit(main())
