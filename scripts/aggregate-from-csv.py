#!/usr/bin/env python3

"""
Tamil Nadu Location Data Aggregator - CSV-Based Version
Loads location data from external CSV file instead of hardcoding.

Benefits:
- Data separated from code logic
- Easy to update locations without code changes
- Scalable to 1000+ locations
- Flexible data sources
- Can be extended to fetch from APIs
"""

import csv
import re
import os
from pathlib import Path
from typing import List, Dict
from collections import defaultdict

class TamilNaduLocationAggregator:
    """Load Tamil Nadu location data from CSV file"""
    
    def __init__(self, csv_file: str = None):
        """
        Initialize with optional CSV file path.
        Default: Look for ../data/tamil_nadu_locations.csv
        """
        if csv_file is None:
            # Default: Look in data directory relative to script
            script_dir = Path(__file__).parent.parent
            csv_file = script_dir / 'data' / 'tamil_nadu_locations.csv'
        
        self.csv_file = Path(csv_file)
        self.locations = []
        self.by_district = defaultdict(list)
        self.by_type = defaultdict(list)
    
    def load_from_csv(self) -> List[Dict]:
        """Load location data from CSV file"""
        if not self.csv_file.exists():
            print(f"❌ CSV file not found: {self.csv_file}")
            print(f"   Please ensure the file exists at: {self.csv_file}")
            return []
        
        print(f"📂 Loading locations from: {self.csv_file}")
        print()
        
        try:
            with open(self.csv_file, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                
                if not reader.fieldnames:
                    print("❌ CSV file is empty!")
                    return []
                
                required_fields = {'name', 'district', 'latitude', 'longitude', 'type'}
                if not required_fields.issubset(set(reader.fieldnames)):
                    print(f"❌ CSV missing required columns: {required_fields}")
                    print(f"   Found: {set(reader.fieldnames)}")
                    return []
                
                for row_num, row in enumerate(reader, start=2):
                    try:
                        location = {
                            'name': row['name'].strip(),
                            'district': row['district'].strip(),
                            'latitude': float(row['latitude']),
                            'longitude': float(row['longitude']),
                            'type': row['type'].strip()
                        }
                        
                        # Validate location
                        if not location['name']:
                            print(f"⚠️  Row {row_num}: Missing location name")
                            continue
                        
                        if not (-90 <= location['latitude'] <= 90):
                            print(f"⚠️  Row {row_num}: Invalid latitude {location['latitude']}")
                            continue
                        
                        if not (-180 <= location['longitude'] <= 180):
                            print(f"⚠️  Row {row_num}: Invalid longitude {location['longitude']}")
                            continue
                        
                        self.locations.append(location)
                        self.by_district[location['district']].append(location)
                        self.by_type[location['type']].append(location)
                    
                    except ValueError as e:
                        print(f"⚠️  Row {row_num}: Invalid data - {e}")
                        continue
        
        except Exception as e:
            print(f"❌ Error reading CSV: {e}")
            return []
        
        print(f"✅ Loaded {len(self.locations)} locations from CSV")
        print()
        return self.locations
    
    def generate_sql(self) -> str:
        """Generate SQL INSERT statements from loaded data"""
        print("📝 Generating SQL migrations from CSV data...\n")
        
        if not self.locations:
            print("❌ No locations loaded!")
            return ""
        
        statements = []
        
        # Generate by type
        for loc_type in sorted(self.by_type.keys()):
            locs = self.by_type[loc_type]
            
            # Group by district
            by_district = defaultdict(list)
            for loc in locs:
                by_district[loc['district']].append(loc)
            
            # Generate SQL for each district
            for district in sorted(by_district.keys()):
                district_locs = by_district[district]
                type_label = loc_type.replace('_', ' ').title()
                
                values = []
                for loc in district_locs:
                    name = loc['name'].replace("'", "''")
                    lat = loc['latitude']
                    lon = loc['longitude']
                    values.append(f"('{name}', {lat}, {lon}, '{district}')")
                
                if values:
                    sql = f"""-- {district} - {type_label}
INSERT INTO locations (name, latitude, longitude, district) VALUES
  {(',\n  '.join(values))}
ON DUPLICATE KEY UPDATE latitude = VALUES(latitude), longitude = VALUES(longitude);
"""
                    statements.append(sql)
        
        return '\n'.join(statements)
    
    def create_migration_file(self, sql: str) -> str:
        """Create Flyway migration file"""
        migrations_dir = Path(__file__).parent.parent / 'backend' / 'app' / 'src' / 'main' / 'resources' / 'db' / 'migration'
        
        if not migrations_dir.exists():
            print(f"❌ Migrations directory not found: {migrations_dir}")
            return None
        
        # Find next migration version
        existing = sorted([
            int(re.match(r'V(\d+)', f)[1])
            for f in os.listdir(migrations_dir)
            if re.match(r'^V\d+__', f)
        ])
        
        next_version = (existing[-1] if existing else 37) + 1
        filename = f"V{next_version}__load_tamil_nadu_locations_from_csv.sql"
        filepath = migrations_dir / filename
        
        header = f"""-- V{next_version}__load_tamil_nadu_locations_from_csv.sql
-- Tamil Nadu Location Database - CSV-Based
-- Data source: data/tamil_nadu_locations.csv
--
-- Coverage:
--   - Cities: {len(self.by_type.get('city', []))}
--   - Towns: {len(self.by_type.get('town', []))}
--   - Villages: {len(self.by_type.get('village', []))}
--   - Neighborhoods: {len(self.by_type.get('neighborhood', []))}
--   - Bus Stops: {len(self.by_type.get('bus_stop', []))}
--   - Total: {len(self.locations)} locations
--   - Districts: {len(self.by_district)}
--
-- Benefits:
-- - Data stored externally in CSV
-- - Easy to update without code changes
-- - Scalable to 1000+ locations
-- - Maintainable and flexible

"""
        
        full_sql = header + sql
        
        with open(filepath, 'w') as f:
            f.write(full_sql)
        
        print(f"✅ Migration Created from CSV!")
        print(f"   File: {filename}")
        print(f"   Path: {filepath}")
        print(f"   Size: {len(full_sql) / 1024:.1f}KB\n")
        
        return str(filepath)
    
    def print_summary(self):
        """Print summary of loaded data"""
        print("=" * 60)
        print("📊 DATA SUMMARY FROM CSV")
        print("=" * 60)
        print()
        
        print("📍 Locations by Type:")
        for loc_type in sorted(self.by_type.keys()):
            count = len(self.by_type[loc_type])
            print(f"   {loc_type.replace('_', ' ').title():20} : {count:3} locations")
        
        print(f"\n{'TOTAL':20} : {len(self.locations):3} locations")
        
        districts = sorted(set(loc['district'] for loc in self.locations))
        print(f"\n📌 Districts: {len(districts)}")
        print("   " + ", ".join(districts[:7]) + ("..." if len(districts) > 7 else ""))
        
        print("\n" + "=" * 60)
    
    def run(self):
        """Main execution"""
        print("\n🚀 TAMIL NADU LOCATION AGGREGATOR (CSV-Based)")
        print("=" * 60 + "\n")
        
        # Load from CSV
        self.load_from_csv()
        
        if not self.locations:
            print("❌ Failed to load locations. Exiting.")
            return
        
        # Generate SQL
        sql = self.generate_sql()
        
        if not sql:
            print("❌ Failed to generate SQL. Exiting.")
            return
        
        # Create migration
        migration_path = self.create_migration_file(sql)
        
        # Print summary
        self.print_summary()
        
        print("\n✅ Migration generation complete!")
        print("   1. Start backend: cd backend && ./gradlew bootRun")
        print("   2. Flyway applies migration automatically")
        print("   3. Location search ready!\n")
        
        if migration_path:
            print(f"Migration: {migration_path}\n")

if __name__ == '__main__':
    aggregator = TamilNaduLocationAggregator()
    aggregator.run()
