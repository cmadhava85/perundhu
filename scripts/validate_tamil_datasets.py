#!/usr/bin/env python3
"""
Validate Tamil Location Datasets from Multiple Sources

This script helps validate and compare Tamil location data from:
1. Existing JSON files in repository (tamil_nadu_locations.json)
2. OpenStreetMap Overpass AP I (live query)
3. Tamil Nadu Government Transport datasets (if available)
4. Count and match with production database
"""

import json
import os
import sys
import requests
from typing import Dict, List, Set

# Database connection
import mysql.connector

class TamilDatasetValidator:
    def __init__(self):
        self.db_config = {
            'host': '127.0.0.1',
            'port': 3307,
            'user': 'perundhu_user',
            'password': 'perundhucloud123',
            'database': 'RECOVER_YOUR_DATA'
        }
        self.results = {}
        
    def validate_existing_json(self):
        """Check tamil_nadu_locations.json file"""
        print("\n" + "="*70)
        print("1. VALIDATING EXISTING JSON FILES")
        print("="*70)
        
        json_files = [
            '../data/tamil_nadu_locations.json',
            '../data/tamil_nadu_locations_enhanced.json'
        ]
        
        for filepath in json_files:
            if not os.path.exists(filepath):
                print(f"❌ File not found: {filepath}")
                continue
                
            print(f"\n📄 Analyzing: {filepath}")
            
            try:
                with open(filepath, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                
                total = len(data)
                
                # Count Tamil script entries
                tamil_count = sum(
                    1 for loc in data 
                    if any('\u0b80' <= c <= '\u0bff' for c in loc.get('name', ''))
                )
                
                english_count = total - tamil_count
                
                # Extract Tamil names
                tamil_names = []
                english_names = []
                
                for loc in data:
                    name = loc.get('name', '')
                    if any('\u0b80' <= c <= '\u0bff' for c in name):
                        tamil_names.append(name)
                    else:
                        english_names.append(name)
                
                print(f"   Total entries: {total}")
                print(f"   ✅ With Tamil script: {tamil_count} ({tamil_count/total*100:.1f}%)")
                print(f"   ⚠️  English only: {english_count} ({english_count/total*100:.1f}%)")
                
                # Show sample Tamil entries
                print(f"\n   📍 Sample Tamil entries:")
                for name in tamil_names[:10]:
                    coords = next((loc for loc in data if loc['name'] == name), {})
                    lat = coords.get('latitude', 'N/A')
                    lon = coords.get('longitude', 'N/A')
                    print(f"     • {name} (lat: {lat}, lon: {lon})")
                
                self.results[filepath] = {
                    'total': total,
                    'tamil_count': tamil_count,
                    'english_count': english_count,
                    'tamil_names': tamil_names,
                    'english_names': english_names
                }
                
            except Exception as e:
                print(f"   ❌ Error: {e}")
                
    def query_openstreetmap(self, sample_limit=20):
        """Query OpenStreetMap Overpass API for Tamil Nadu locations with Tamil names"""
        print("\n" + "="*70)
        print("2. QUERYING OPENSTREETMAP (OVERPASS API)")
        print("="*70)
        
        # Simplified query for Tamil Nadu with Tamil names
        query = """
        [out:json][timeout:30];
        area[name="Tamil Nadu"]->.tn;
        (
          node(area.tn)[place~"city|town|village"]["name:ta"];
        );
        out center {};
        """.format(sample_limit)
        
        print(f"\n🌍 Querying OSM for {sample_limit} locations with Tamil names...")
        print(f"   (This may take 10-30 seconds)")
        
        try:
            response = requests.post(
                'https://overpass-api.de/api/interpreter',
                data={'data': query},
                timeout=60
            )
            
            if response.status_code == 200:
                data = response.json()
                elements = data.get('elements', [])
                
                print(f"\n✅ Found {len(elements)} locations with Tamil names in OSM")
                
                print(f"\n   📍 Sample entries:")
                for elem in elements[:10]:
                    tags = elem.get('tags', {})
                    name_en = tags.get('name', 'N/A')
                    name_ta = tags.get('name:ta', 'N/A')
                    place_type = tags.get('place', 'unknown')
                    lat = elem.get('lat', 'N/A')
                    lon = elem.get('lon', 'N/A')
                    
                    print(f"     • {name_en} = {name_ta}")
                    print(f"       Type: {place_type}, Coords: ({lat}, {lon})")
                
                self.results['openstreetmap'] = {
                    'total': len(elements),
                    'sample': elements
                }
                
                return elements
            else:
                print(f"   ❌ HTTP Error: {response.status_code}")
                return []
                
        except Exception as e:
            print(f"   ❌ Error querying OSM: {e}")
            return []
    
    def check_production_database(self):
        """Check what exists in production database"""
        print("\n" + "="*70)
        print("3. CHECKING PRODUCTION DATABASE")
        print("="*70)
        
        try:
            conn = mysql.connector.connect(**self.db_config)
            cursor = conn.cursor(dictionary=True)
            
            # Get location count
            cursor.execute("SELECT COUNT(*) as total FROM locations")
            location_count = cursor.fetchone()['total']
            
            # Get translation count
            cursor.execute("""
                SELECT COUNT(*) as total 
                FROM translations 
                WHERE entity_type = 'location' AND language_code = 'ta'
            """)
            tamil_translation_count = cursor.fetchone()['total']
            
            # Get sample locations WITHOUT Tamil translations
            cursor.execute("""
                SELECT l.id, l.name 
                FROM locations l
                LEFT JOIN translations t 
                    ON t.entity_type = 'location' 
                    AND t.entity_id = l.id 
                    AND t.language_code = 'ta'
                WHERE t.id IS NULL
                LIMIT 20
            """)
            untranslated = cursor.fetchall()
            
            print(f"\n📊 Database Status:")
            print(f"   Total locations: {location_count}")
            print(f"   Tamil translations: {tamil_translation_count}")
            print(f"   Missing Tamil: {location_count - tamil_translation_count}")
            print(f"   Coverage: {tamil_translation_count/location_count*100:.2f}%")
            
            print(f"\n   🔍 Sample locations WITHOUT Tamil translation:")
            for loc in untranslated[:10]:
                print(f"     • ID {loc['id']}: {loc['name']}")
            
            self.results['database'] = {
                'total_locations': location_count,
                'tamil_translations': tamil_translation_count,
                'missing': location_count - tamil_translation_count,
                'untranslated_sample': untranslated
            }
            
            cursor.close()
            conn.close()
            
        except Exception as e:
            print(f"   ❌ Database error: {e}")
            print(f"   Make sure Cloud SQL Proxy is running on port 3307")
    
    def generate_validation_report(self):
        """Generate final validation report"""
        print("\n" + "="*70)
        print("📊 VALIDATION SUMMARY & RECOMMENDATIONS")
        print("="*70)
        
        print("\n✅ FREE TAMIL DATA SOURCES FOUND:")
        
        # Check JSON files
        json_results = [k for k in self.results.keys() if k.endswith('.json')]
        if json_results:
            for filepath in json_results:
                data = self.results[filepath]
                print(f"\n   1. {filepath}")
                print(f"      • {data['tamil_count']} Tamil entries available")
                print(f"      • Can be imported into translations table FOR FREE")
        
        # Check OSM
        if 'openstreetmap' in self.results:
            osm = self.results['openstreetmap']
            print(f"\n   2. OpenStreetMap (Overpass API)")
            print(f"      • {osm['total']} locations with Tamil names found (sample)")
            print(f"      • Can query for MORE locations FOR FREE")
            print(f"      • API is free with rate limits (reasonable usage)")
        
        # Database status
        if 'database' in self.results:
            db = self.results['database']
            print(f"\n📂 PRODUCTION DATABASE:")
            print(f"   • Total locations: {db['total_locations']}")
            print(f"   • Need Tamil for: {db['missing']} locations")
        
        print("\n" + "="*70)
        print("💡 RECOMMENDED VALIDATION STRATEGY")
        print("="*70)
        
        print("""
1. ✅ USE EXISTING JSON FILES (FREE):
   - Import Tamil names from tamil_nadu_locations.json
   - Match by coordinates or fuzzy name matching
   - Estimated coverage: Will need to check matches

2. ✅ USE OPENSTREETMAP API (FREE):
   - Query for all Tamil Nadu locations with 'name:ta' tag
   - Match with database locations by coordinates
   - Rate limit: ~10K queries/day (sufficient with batching)
   - Command:
     curl -X POST https://overpass-api.de/api/interpreter \\
       --data "data=[out:json][timeout:60];area[name='Tamil Nadu'];(node(area)[place][\"name:ta\"]);out;"

3. ⚠️  GOOGLE TRANSLATE API (PAID - ~$15-20):
   - Only use for locations NOT found in OSM/JSON
   - Recommended as LAST RESORT

4. ✅ HYBRID APPROACH (RECOMMENDED):
   Step 1: Match with JSON files (FREE)
   Step 2: Query OSM for remaining (FREE)
   Step 3: Manual for top 100 cities/towns  
   Step 4: Google Translate for final ~1000 (cost ~$1-2)
   
   Total cost: $1-2 instead of $15-20!
""")

def main():
    print("🔍 TAMIL LOCATION DATASET VALIDATION TOOL")
    print("="*70)
    print("Checking availability of FREE Tamil location datasets...")
    
    validator = TamilDatasetValidator()
    
    # Run validations
    validator.validate_existing_json()
    validator.query_openstreetmap(sample_limit=20)
    validator.check_production_database()
    validator.generate_validation_report()
    
    print("\n✅ Validation complete!")
    print("\nNext steps:")
    print("  1. Review the sources above")
    print("  2. Decide on hybrid vs. single source approach")
    print("  3. Run import script to populate translations table")

if __name__ == "__main__":
    main()
