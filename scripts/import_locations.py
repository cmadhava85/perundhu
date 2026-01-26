#!/usr/bin/env python3

"""
Import Tamil Nadu locations to database
Supports JSON, JSONL, and CSV formats
"""

import json
import csv
import sys
import mysql.connector
from pathlib import Path
from typing import List, Dict

class LocationImporter:
    """Import locations to MySQL database"""
    
    def __init__(self, host='localhost', user='perundhu_user', password=None, 
                 database='perundhu', port=3307):
        self.host = host
        self.user = user
        self.password = password
        self.database = database
        self.port = port
        self.conn = None
        self.cursor = None
    
    def connect(self):
        """Connect to database"""
        try:
            self.conn = mysql.connector.connect(
                host=self.host,
                user=self.user,
                password=self.password,
                database=self.database,
                port=self.port
            )
            self.cursor = self.conn.cursor()
            print(f"✅ Connected to {self.database} on {self.host}:{self.port}")
            return True
        except mysql.connector.Error as err:
            print(f"❌ Connection failed: {err}")
            return False
    
    def disconnect(self):
        """Disconnect from database"""
        if self.cursor:
            self.cursor.close()
        if self.conn:
            self.conn.close()
            print("✅ Disconnected from database")
    
    def import_json(self, filepath: str, batch_size: int = 1000) -> bool:
        """Import from JSON file"""
        try:
            print(f"\n📖 Reading JSON file: {filepath}")
            with open(filepath, 'r') as f:
                locations = json.load(f)
            
            return self._insert_locations(locations, batch_size)
        except Exception as err:
            print(f"❌ Error reading JSON: {err}")
            return False
    
    def import_jsonl(self, filepath: str, batch_size: int = 1000) -> bool:
        """Import from JSONL file"""
        try:
            print(f"\n📖 Reading JSONL file: {filepath}")
            locations = []
            with open(filepath, 'r') as f:
                for line in f:
                    if line.strip():
                        locations.append(json.loads(line))
            
            return self._insert_locations(locations, batch_size)
        except Exception as err:
            print(f"❌ Error reading JSONL: {err}")
            return False
    
    def import_csv(self, filepath: str, batch_size: int = 1000) -> bool:
        """Import from CSV file"""
        try:
            print(f"\n📖 Reading CSV file: {filepath}")
            locations = []
            with open(filepath, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    locations.append({
                        'name': row['name'],
                        'type': row['type'],
                        'latitude': float(row['latitude']),
                        'longitude': float(row['longitude']),
                        'osm_id': int(row['osm_id']) if row['osm_id'] else None
                    })
            
            return self._insert_locations(locations, batch_size)
        except Exception as err:
            print(f"❌ Error reading CSV: {err}")
            return False
    
    def _insert_locations(self, locations: List[Dict], batch_size: int = 1000) -> bool:
        """Insert locations in batches"""
        try:
            print(f"\n📊 Total locations to import: {len(locations):,}")
            
            # Insert in batches
            inserted = 0
            for i in range(0, len(locations), batch_size):
                batch = locations[i:i+batch_size]
                
                for loc in batch:
                    sql = """
                    INSERT INTO locations (name, type, latitude, longitude, osm_id)
                    VALUES (%s, %s, %s, %s, %s)
                    ON DUPLICATE KEY UPDATE
                        type = VALUES(type),
                        latitude = VALUES(latitude),
                        longitude = VALUES(longitude)
                    """
                    
                    self.cursor.execute(sql, (
                        loc['name'],
                        loc['type'],
                        loc['latitude'],
                        loc['longitude'],
                        loc.get('osm_id')
                    ))
                
                self.conn.commit()
                inserted += len(batch)
                percent = (inserted / len(locations)) * 100
                print(f"  ✅ {inserted:,} / {len(locations):,} ({percent:.1f}%)")
            
            print(f"\n✅ Import complete! {inserted:,} locations imported/updated")
            return True
        except mysql.connector.Error as err:
            print(f"❌ Database error: {err}")
            self.conn.rollback()
            return False
    
    def verify_import(self) -> bool:
        """Verify the import"""
        try:
            print("\n🔍 Verifying import...\n")
            
            # Total count
            self.cursor.execute("SELECT COUNT(*) as total FROM locations")
            result = self.cursor.fetchone()
            total = result[0] if result else 0
            print(f"✅ Total locations: {total:,}")
            
            # By type
            self.cursor.execute("""
                SELECT type, COUNT(*) as count 
                FROM locations 
                GROUP BY type 
                ORDER BY count DESC
            """)
            
            print(f"\n✅ Distribution by type:")
            for row in self.cursor.fetchall():
                loc_type, count = row
                print(f"   • {loc_type}: {count:,}")
            
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
                print(f"\n✅ Geographic bounds:")
                print(f"   • Latitude:  {min_lat:.4f}° to {max_lat:.4f}°N")
                print(f"   • Longitude: {min_lon:.4f}° to {max_lon:.4f}°E")
            
            # Check for invalid coordinates
            self.cursor.execute("""
                SELECT COUNT(*) as invalid 
                FROM locations 
                WHERE latitude < 8.0 OR latitude > 13.5 
                   OR longitude < 76.0 OR longitude > 80.5
            """)
            
            result = self.cursor.fetchone()
            invalid_count = result[0] if result else 0
            if invalid_count == 0:
                print(f"\n✅ Coordinate validation: All coordinates valid")
            else:
                print(f"\n⚠️  Invalid coordinates: {invalid_count}")
            
            # Sample data
            self.cursor.execute("SELECT name, type, latitude, longitude FROM locations LIMIT 5")
            print(f"\n✅ Sample data (first 5 rows):")
            for row in self.cursor.fetchall():
                print(f"   • {row[0]} ({row[1]}) - {row[2]:.4f}, {row[3]:.4f}")
            
            return True
        except mysql.connector.Error as err:
            print(f"❌ Verification error: {err}")
            return False


def main():
    """Main execution"""
    print("=" * 70)
    print("📊 TAMIL NADU LOCATIONS - DATABASE IMPORT")
    print("=" * 70)
    
    # Get file path
    if len(sys.argv) < 2:
        print("\n❌ Usage: python3 import_locations.py <json|jsonl|csv_file>")
        print("\nExamples:")
        print("  python3 import_locations.py tamil_nadu_locations.json")
        print("  python3 import_locations.py tamil_nadu_locations.jsonl")
        print("  python3 import_locations.py tamil_nadu_locations.csv")
        return 1
    
    filepath = sys.argv[1]
    
    if not Path(filepath).exists():
        print(f"\n❌ File not found: {filepath}")
        return 1
    
    # Get database credentials
    print("\n🔑 Database Configuration:")
    host = input("  Host [localhost]: ") or "localhost"
    user = input("  User [perundhu_user]: ") or "perundhu_user"
    password = input("  Password: ") or None
    database = input("  Database [perundhu]: ") or "perundhu"
    port_str = input("  Port [3307]: ") or "3307"
    port = int(port_str)
    
    # Create importer
    importer = LocationImporter(
        host=host,
        user=user,
        password=password,
        database=database,
        port=port
    )
    
    # Connect
    if not importer.connect():
        return 1
    
    # Detect file type and import
    filepath_lower = filepath.lower()
    success = False
    
    try:
        if filepath_lower.endswith('.json'):
            success = importer.import_json(filepath)
        elif filepath_lower.endswith('.jsonl'):
            success = importer.import_jsonl(filepath)
        elif filepath_lower.endswith('.csv'):
            success = importer.import_csv(filepath)
        else:
            print(f"❌ Unsupported file type: {filepath}")
            return 1
        
        # Verify
        if success:
            importer.verify_import()
    finally:
        importer.disconnect()
    
    print("\n" + "=" * 70)
    if success:
        print("✅ IMPORT SUCCESSFUL!")
        return 0
    else:
        print("❌ IMPORT FAILED!")
        return 1


if __name__ == '__main__':
    exit(main())
