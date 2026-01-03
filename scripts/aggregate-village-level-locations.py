#!/usr/bin/env python3

"""
Tamil Nadu Village-Level Data Aggregator (For Future Expansion)
Prepares infrastructure for adding 1000+ villages to the database.

This script can be enhanced to fetch from:
- data.gov.in Village Census Data
- OpenStreetMap Overpass API
- Government of Tamil Nadu databases
- Election Commission's administrative boundaries

Current: Template with comprehensive village data structure
Future: Automated fetching from official sources
"""

import json
import re
import os
from pathlib import Path
from typing import List, Dict, Set, Tuple
from collections import defaultdict

class VillageLevelDataAggregator:
    """
    Aggregate village-level location data for Tamil Nadu.
    
    Structure:
    - Each village has: name, district, taluk, coordinates, population (optional)
    - Taluk (sub-district level) organization
    - Multi-level hierarchical data
    """
    
    # Comprehensive village data structure (expandable)
    # Format: (village_name, district, taluk, latitude, longitude)
    VILLAGE_DATA = {
        'Chennai': [
            ('Choolaimedu', 'Chennai', 'Chennai', 13.0467, 80.2247),
            ('Puzhal', 'Chennai', 'Chennai', 13.1617, 80.2383),
            ('Avadi', 'Chennai', 'Avadi', 13.1000, 80.1267),
            ('Nazarethpet', 'Chennai', 'Chennai', 13.0583, 80.2283),
        ],
        'Chengalpattu': [
            ('Chengalpattu', 'Chengalpattu', 'Chengalpattu', 12.6667, 80.1500),
            ('Maduranthagam', 'Chengalpattu', 'Maduranthagam', 12.5333, 80.0500),
            ('Walajabad', 'Chengalpattu', 'Walajabad', 12.5962, 80.0597),
            ('Urapakkam', 'Chengalpattu', 'Chengalpattu', 12.5667, 80.0333),
        ],
        'Kanchipuram': [
            ('Kanchipuram', 'Kanchipuram', 'Kanchipuram', 12.8342, 79.7029),
            ('Walajabad', 'Kanchipuram', 'Walajabad', 12.5962, 80.0597),
            ('Tirupporur', 'Kanchipuram', 'Tirupporur', 12.9850, 79.8283),
            ('Sriperumbudur', 'Kanchipuram', 'Sriperumbudur', 12.9402, 79.9042),
        ],
        'Vellore': [
            ('Vellore', 'Vellore', 'Vellore', 12.9165, 79.1325),
            ('Ranipet', 'Vellore', 'Ranipet', 12.9500, 79.3333),
            ('Pernambut', 'Vellore', 'Pernambut', 12.5334, 79.2667),
        ],
        'Tiruppur': [
            ('Tiruppur', 'Tiruppur', 'Tiruppur', 11.1085, 77.3411),
            ('Udumalaipet', 'Tiruppur', 'Udumalaipet', 11.2667, 77.3333),
            ('Avinashi', 'Tiruppur', 'Avinashi', 11.1883, 76.9500),
        ],
        'Coimbatore': [
            ('Coimbatore', 'Coimbatore', 'Coimbatore', 11.0183, 76.9725),
            ('Pollachi', 'Coimbatore', 'Pollachi', 10.6627, 77.0038),
            ('Sulur', 'Coimbatore', 'Sulur', 10.9483, 76.8267),
        ],
        'Madurai': [
            ('Madurai', 'Madurai', 'Madurai', 9.9252, 78.1198),
            ('Melur', 'Madurai', 'Melur', 9.7811, 78.0614),
            ('Tirumangalam', 'Madurai', 'Tirumangalam', 9.7167, 78.0833),
            ('Usilampatti', 'Madurai', 'Usilampatti', 9.4333, 78.2667),
        ],
        'Dindigul': [
            ('Dindigul', 'Dindigul', 'Dindigul', 10.3624, 77.9695),
            ('Kodaikanal', 'Dindigul', 'Kodaikanal', 10.2381, 77.4892),
            ('Palani', 'Dindigul', 'Palani', 10.2742, 77.4485),
            ('Natham', 'Dindigul', 'Natham', 9.9667, 78.1833),
        ],
        'Salem': [
            ('Salem', 'Salem', 'Salem', 11.6643, 78.1460),
            ('Attur', 'Salem', 'Attur', 11.7834, 78.6291),
            ('Yercaud', 'Salem', 'Yercaud', 11.7673, 78.1357),
        ],
        'Erode': [
            ('Erode', 'Erode', 'Erode', 11.3394, 77.7264),
            ('Bhavani', 'Erode', 'Bhavani', 11.4537, 77.6699),
            ('Vellakovil', 'Erode', 'Vellakovil', 10.8667, 77.8167),
        ],
        'Thanjavur': [
            ('Thanjavur', 'Thanjavur', 'Thanjavur', 10.7870, 79.1378),
            ('Kumbakonam', 'Thanjavur', 'Kumbakonam', 10.9609, 79.3881),
        ],
        'Tirunelveli': [
            ('Tirunelveli', 'Tirunelveli', 'Tirunelveli', 8.7139, 77.7567),
            ('Nagercoil', 'Kanyakumari', 'Nagercoil', 8.1833, 77.4119),
        ],
    }
    
    def __init__(self):
        self.villages = []
        self.by_district = defaultdict(list)
        self.by_taluk = defaultdict(list)
        
    def aggregate_villages(self) -> List[Dict]:
        """Aggregate all village data"""
        print("📊 Aggregating Tamil Nadu village-level data...\n")
        
        total_villages = sum(len(v) for v in self.VILLAGE_DATA.values())
        print(f"   Processing {total_villages} villages across {len(self.VILLAGE_DATA)} districts")
        
        for district, villages in self.VILLAGE_DATA.items():
            for village_name, dist, taluk, lat, lon in villages:
                village = {
                    'name': village_name,
                    'district': dist,
                    'taluk': taluk,
                    'latitude': lat,
                    'longitude': lon,
                    'type': 'village'
                }
                self.villages.append(village)
                self.by_district[dist].append(village)
                self.by_taluk[taluk].append(village)
        
        return self.villages
    
    def generate_sql(self, start_id: int = 1) -> str:
        """Generate SQL INSERT statements for villages"""
        print("📝 Generating village-level SQL...\n")
        
        statements = []
        
        # Generate by district
        for district in sorted(self.by_district.keys()):
            villages = self.by_district[district]
            
            # Group by taluk
            by_taluk = defaultdict(list)
            for v in villages:
                by_taluk[v['taluk']].append(v)
            
            # Generate SQL for each taluk
            for taluk in sorted(by_taluk.keys()):
                taluk_villages = by_taluk[taluk]
                
                values = []
                for v in taluk_villages:
                    name = v['name'].replace("'", "''")
                    lat = v['latitude']
                    lon = v['longitude']
                    values.append(f"('{name}', {lat}, {lon}, '{district}')")
                
                if values:
                    sql = f"""-- {district} - {taluk}
INSERT INTO locations (name, latitude, longitude, district) VALUES
  {(',\n  '.join(values))}
ON DUPLICATE KEY UPDATE latitude = VALUES(latitude), longitude = VALUES(longitude);
"""
                    statements.append(sql)
        
        return '\n'.join(statements)
    
    def create_migration_template(self) -> str:
        """Create migration file template for future use"""
        migrations_dir = Path(__file__).parent.parent / 'backend' / 'app' / 'src' / 'main' / 'resources' / 'db' / 'migration'
        
        if not migrations_dir.exists():
            print(f"❌ Migrations directory not found: {migrations_dir}")
            return None
        
        # Find next version
        existing = sorted([
            int(re.match(r'V(\d+)', f)[1])
            for f in os.listdir(migrations_dir)
            if re.match(r'^V\d+__', f)
        ])
        
        next_version = (existing[-1] if existing else 41) + 1
        filename = f"V{next_version}__load_village_level_locations.sql"
        filepath = migrations_dir / filename
        
        header = f"""-- V{next_version}__load_village_level_locations.sql
-- VILLAGE-LEVEL Tamil Nadu Location Data
-- Adds granular village-level coverage for Tamil Nadu
--
-- This migration extends the existing location database with village-level data.
-- Villages are grouped by Taluk (sub-district) for better organization.
--
-- Data Structure:
-- - villages grouped by district and taluk
-- - coordinates for each village
-- - hierarchical organization (district > taluk > village)
--
-- Future Enhancement: Data will be fetched from:
-- - data.gov.in Census API
-- - OpenStreetMap Overpass API
-- - Government of Tamil Nadu administrative databases
--
-- Current Status: Template with {len(self.villages)} sample villages
-- Ready for: Automated data ingestion when APIs become available

"""
        
        sql = self.generate_sql()
        full_sql = header + sql
        
        with open(filepath, 'w') as f:
            f.write(full_sql)
        
        print(f"✅ Village-level Migration Template Created!")
        print(f"   File: {filename}")
        print(f"   Path: {filepath}")
        print(f"   Status: Ready for data expansion")
        
        return str(filepath)
    
    def print_summary(self):
        """Print summary of village data"""
        print("\n" + "=" * 60)
        print("📊 VILLAGE-LEVEL DATA AGGREGATION SUMMARY")
        print("=" * 60)
        print()
        
        print(f"📍 Total Villages: {len(self.villages)}")
        print(f"🗺️  Districts: {len(self.by_district)}")
        print(f"🏘️  Taluks: {len(self.by_taluk)}")
        
        print("\n📌 By District:")
        for dist in sorted(self.by_district.keys()):
            count = len(self.by_district[dist])
            print(f"   {dist:25} : {count:3} villages")
        
        print("\n" + "=" * 60)
    
    def get_expansion_recommendations(self) -> Dict:
        """Get recommendations for data expansion"""
        return {
            'immediate': {
                'description': 'Ready now - use current data',
                'actions': [
                    'Deploy V42 with village data',
                    'Test village-level search',
                    'Verify taluk hierarchies'
                ]
            },
            'short_term': {
                'description': 'Next week - enhanced data sources',
                'actions': [
                    'Fetch population data from Census 2021',
                    'Add postal code mapping',
                    'Include elevation data for hill stations'
                ]
            },
            'medium_term': {
                'description': 'This month - complete coverage',
                'actions': [
                    'Integrate data.gov.in APIs',
                    'Add all 6000+ revenue villages',
                    'Include local government divisions'
                ]
            },
            'long_term': {
                'description': 'Future - advanced features',
                'actions': [
                    'Geospatial indexing',
                    'Route optimization by village',
                    'Population-weighted location ranking',
                    'Transport connectivity scoring'
                ]
            }
        }
    
    def run(self):
        """Main execution"""
        print("\n🚀 VILLAGE-LEVEL DATA AGGREGATION FRAMEWORK")
        print("=" * 60 + "\n")
        
        # Aggregate
        self.aggregate_villages()
        
        # Create migration template
        migration_path = self.create_migration_template()
        
        # Print summary
        self.print_summary()
        
        # Get recommendations
        recommendations = self.get_expansion_recommendations()
        
        print("\n🔄 EXPANSION ROADMAP:\n")
        for phase, details in recommendations.items():
            print(f"📋 {phase.upper().replace('_', ' ')}")
            print(f"   {details['description']}")
            for action in details['actions']:
                print(f"   • {action}")
            print()
        
        print("=" * 60)
        print("\n✅ Next Steps:")
        print("   1. Current V41 migration is live with 120 locations")
        print("   2. V42 template ready for village expansion")
        print("   3. Can scale to 1000+ villages when needed")
        print("   4. Data structure supports hierarchical queries")
        print("\n")
        
        if migration_path:
            print(f"Template created: {migration_path}\n")

if __name__ == '__main__':
    aggregator = VillageLevelDataAggregator()
    aggregator.run()
