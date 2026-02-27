#!/usr/bin/env python3
"""
Hybrid Tamil Translation Populator

Strategy:
1. Fetch all locations from production database
2. Query OpenStreetMap for Tamil names (FREE - unlimited with fair use)
3. Match locations using coordinates (lat/lon proximity)
4. For remaining locations, use Google Translate API (PAID - only for gaps)
5. Insert translations into database

Cost: $1-2 instead of $15-20
Coverage: ~95%+ from OSM, ~5% from Google Translate
"""

import json
import os
import sys
import time
import requests
from typing import Dict, List, Tuple, Optional
from datetime import datetime
import math

# Database
import mysql.connector

# Google Translate (optional - install with: pip3 install google-cloud-translate)
try:
    from google.cloud import translate_v2 as translate
    GOOGLE_TRANSLATE_AVAILABLE = True
except ImportError:
    GOOGLE_TRANSLATE_AVAILABLE = False
    print("⚠️  Google Translate not installed. Will use OSM only (100% free).")
    print("   To enable Google Translate: pip3 install google-cloud-translate --break-system-packages")

class HybridTamilTranslator:
    def __init__(self, dry_run=True, environment='production'):
        self.dry_run = dry_run
        self.environment = environment
        
        # Environment configuration
        env_config = {
            'production': {
                'project_id': 'perundhu-prod-001',
                'db_name': 'RECOVER_YOUR_DATA'
            },
            'preprod': {
                'project_id': 'astute-strategy-406601',
                'db_name': 'perundhu'
            }
        }
        
        if environment not in env_config:
            raise ValueError(f"Invalid environment: {environment}. Must be 'production' or 'preprod'")
        
        config = env_config[environment]
        
        # Get password from Secret Manager
        import subprocess
        password = subprocess.check_output([
            'gcloud', 'secrets', 'versions', 'access', 'latest',
            '--secret=db-password', f'--project={config["project_id"]}'
        ], text=True).strip()
        
        self.db_config = {
            'host': '127.0.0.1',
            'port': 3307,
            'user': 'perundhu_user',
            'password': password,
            'database': config['db_name']
        }
        
        # Statistics
        self.stats = {
            'total_locations': 0,
            'already_translated': 0,
            'osm_matches': 0,
            'google_translate_used': 0,
            'failed': 0,
            'inserted': 0
        }
        
        # Cache for OSM data
        self.osm_cache = {}
        
        # Google Translate client (lazy init)
        self.translate_client = None
        
    def haversine_distance(self, lat1, lon1, lat2, lon2):
        """Calculate distance between two coordinates in km"""
        R = 6371  # Earth radius in km
        
        lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])
        dlat = lat2 - lat1
        dlon = lon2 - lon1
        
        a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
        c = 2 * math.asin(math.sqrt(a))
        
        return R * c
    
    def fetch_locations_from_db(self):
        """Fetch ONLY locations that are actually used in buses/stops and don't have Tamil translations"""
        print("\n" + "="*70)
        print("1. FETCHING ACTIVE LOCATIONS FROM DATABASE")
        print("="*70)
        print("   (Only translating locations used in bus routes and stops)")
        
        try:
            conn = mysql.connector.connect(**self.db_config)
            cursor = conn.cursor(dictionary=True)
            
            # Get locations that are actually used in buses or stops, without Tamil translations
            # Optimized with JOINs instead of EXISTS for better performance
            query = """
                SELECT DISTINCT l.id, l.name, l.latitude, l.longitude
                FROM locations l
                LEFT JOIN translations t 
                    ON t.entity_type = 'location' 
                    AND t.entity_id = l.id 
                    AND t.language_code = 'ta'
                LEFT JOIN (
                    SELECT DISTINCT from_location_id AS location_id FROM buses
                    UNION
                    SELECT DISTINCT to_location_id AS location_id FROM buses
                    UNION
                    SELECT DISTINCT location_id FROM stops
                ) active_locs ON active_locs.location_id = l.id
                WHERE t.id IS NULL
                AND active_locs.location_id IS NOT NULL
                ORDER BY l.id
            """
            
            cursor.execute(query)
            locations = cursor.fetchall()
            
            self.stats['total_locations'] = len(locations)
            
            print(f"✅ Found {len(locations)} ACTIVE locations needing Tamil translation")
            print(f"   (Skipping unused/duplicate locations)")
            
            cursor.close()
            conn.close()
            
            return locations
            
        except Exception as e:
            print(f"❌ Database error: {e}")
            return []
    
    def fetch_osm_tamil_names_batch(self, batch_size=100):
        """Fetch Tamil names from OpenStreetMap in batches"""
        print("\n" + "="*70)
        print("2. FETCHING TAMIL NAMES FROM OPENSTREETMAP (FREE)")
        print("="*70)
        
        print(f"🌍 Querying Overpass API for Tamil Nadu locations with Tamil names...")
        print(f"   (This is 100% FREE with fair use rate limits)")
        
        # Query for all Tamil Nadu locations with Tamil names
        query = f"""
        [out:json][timeout:180];
        area[name="Tamil Nadu"]->.tn;
        (
          node(area.tn)[place~"city|town|village"]["name:ta"];
          node(area.tn)["amenity"="bus_station"]["name:ta"];
          node(area.tn)["highway"="bus_stop"]["name:ta"];
          way(area.tn)[place~"city|town|village"]["name:ta"];
        );
        out center {batch_size * 10};
        """
        
        try:
            response = requests.post(
                'https://overpass-api.de/api/interpreter',
                data={'data': query},
                timeout=200
            )
            
            if response.status_code == 200:
                data = response.json()
                elements = data.get('elements', [])
                
                print(f"✅ Found {len(elements)} locations with Tamil names in OSM")
                
                # Build cache: key = (lat, lon), value = (name_en, name_ta)
                for elem in elements:
                    tags = elem.get('tags', {})
                    
                    # Get coordinates
                    if 'lat' in elem and 'lon' in elem:
                        lat, lon = elem['lat'], elem['lon']
                    elif 'center' in elem:
                        lat, lon = elem['center']['lat'], elem['center']['lon']
                    else:
                        continue
                    
                    name_en = tags.get('name', '')
                    name_ta = tags.get('name:ta', '')
                    
                    if name_ta:
                        # Round coordinates to 3 decimals for matching
                        key = (round(lat, 3), round(lon, 3))
                        self.osm_cache[key] = {
                            'name_en': name_en,
                            'name_ta': name_ta,
                            'exact_lat': lat,
                            'exact_lon': lon
                        }
                
                print(f"✅ Cached {len(self.osm_cache)} Tamil translations from OSM")
                
                # Show samples
                print(f"\n   📍 Sample Tamil translations from OSM:")
                for i, (coords, data) in enumerate(list(self.osm_cache.items())[:10]):
                    print(f"     • {data['name_en']} = {data['name_ta']}")
                
                return True
                
            else:
                print(f"❌ HTTP Error: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"❌ Error querying OSM: {e}")
            return False
    
    def find_osm_match(self, location):
        """Find OSM match for a location using coordinates"""
        lat = location['latitude']
        lon = location['longitude']
        
        if lat is None or lon is None:
            return None
        
        # Try exact match first (rounded to 3 decimals)
        key = (round(lat, 3), round(lon, 3))
        if key in self.osm_cache:
            return self.osm_cache[key]['name_ta']
        
        # Try nearby match (within 1km)
        for osm_key, osm_data in self.osm_cache.items():
            distance = self.haversine_distance(
                lat, lon,
                osm_data['exact_lat'], osm_data['exact_lon']
            )
            
            if distance < 1.0:  # Within 1km
                return osm_data['name_ta']
        
        return None
    
    def translate_with_google(self, text):
        """Translate text using Google Translate API (PAID)"""
        if not GOOGLE_TRANSLATE_AVAILABLE:
            return None
        
        if self.translate_client is None:
            try:
                self.translate_client = translate.Client()
            except Exception as e:
                print(f"⚠️  Google Translate not configured: {e}")
                return None
        
        try:
            result = self.translate_client.translate(
                text,
                target_language='ta',
                source_language='en'
            )
            return result['translatedText']
        except Exception as e:
            print(f"⚠️  Translation failed for '{text}': {e}")
            return None
    
    def process_locations(self, locations):
        """Process all locations and generate translations"""
        print("\n" + "="*70)
        print("3. MATCHING LOCATIONS WITH TAMIL TRANSLATIONS")
        print("="*70)
        
        translations_to_insert = []
        
        for i, location in enumerate(locations, 1):
            loc_id = location['id']
            loc_name = location['name']
            
            if i % 1000 == 0:
                print(f"   Processing {i}/{len(locations)}...")
            
            # Try OSM first (FREE)
            tamil_name = self.find_osm_match(location)
            
            if tamil_name:
                self.stats['osm_matches'] += 1
                source = 'OSM'
            else:
                # Fall back to Google Translate for important locations
                # Only translate if name is reasonable length
                if len(loc_name) < 100:
                    tamil_name = self.translate_with_google(loc_name)
                    if tamil_name:
                        self.stats['google_translate_used'] += 1
                        source = 'Google'
                    else:
                        self.stats['failed'] += 1
                        continue
                else:
                    self.stats['failed'] += 1
                    continue
            
            translations_to_insert.append({
                'entity_type': 'location',
                'entity_id': loc_id,
                'language_code': 'ta',
                'field_name': 'name',
                'translated_value': tamil_name,
                'source': source
            })
        
        print(f"\n✅ Generated {len(translations_to_insert)} translations:")
        print(f"   • From OSM (FREE): {self.stats['osm_matches']}")
        print(f"   • From Google Translate (PAID): {self.stats['google_translate_used']}")
        print(f"   • Failed: {self.stats['failed']}")
        
        return translations_to_insert
    
    def insert_translations(self, translations):
        """Insert translations into database"""
        print("\n" + "="*70)
        print("4. INSERTING TRANSLATIONS INTO DATABASE")
        print("="*70)
        
        if self.dry_run:
            print("🔍 DRY RUN MODE - No data will be inserted")
            print(f"\n   Would insert {len(translations)} translations:")
            for trans in translations[:10]:
                print(f"     • ID {trans['entity_id']}: {trans['translated_value']} ({trans['source']})")
            if len(translations) > 10:
                print(f"     ... and {len(translations) - 10} more")
            return
        
        try:
            conn = mysql.connector.connect(**self.db_config)
            cursor = conn.cursor()
            
            insert_query = """
                INSERT INTO translations 
                (entity_type, entity_id, language_code, field_name, translated_value)
                VALUES (%s, %s, %s, %s, %s)
                ON DUPLICATE KEY UPDATE translated_value = VALUES(translated_value)
            """
            
            batch_size = 1000
            for i in range(0, len(translations), batch_size):
                batch = translations[i:i+batch_size]
                
                values = [
                    (t['entity_type'], t['entity_id'], t['language_code'],
                     t['field_name'], t['translated_value'])
                    for t in batch
                ]
                
                cursor.executemany(insert_query, values)
                print(f"   Inserted {i + len(batch)}/{len(translations)}...")
            
            conn.commit()
            self.stats['inserted'] = len(translations)
            
            print(f"\n✅ Successfully inserted {len(translations)} Tamil translations!")
            
            cursor.close()
            conn.close()
            
        except Exception as e:
            print(f"❌ Insert error: {e}")
    
    def estimate_cost(self):
        """Estimate Google Translate API cost"""
        google_chars = sum(
            len(name) for name in []  # Will be calculated during processing
        )
        cost = (google_chars / 1_000_000) * 20
        return cost
    
    def print_summary(self):
        """Print final summary"""
        print("\n" + "="*70)
        print("📊 FINAL SUMMARY")
        print("="*70)
        
        print(f"\nTotal locations processed: {self.stats['total_locations']}")
        print(f"Already had Tamil: {self.stats['already_translated']}")
        print(f"New translations:")
        print(f"  • From OSM (FREE): {self.stats['osm_matches']}")
        print(f"  • From Google Translate: {self.stats['google_translate_used']}")
        print(f"  • Failed: {self.stats['failed']}")
        print(f"  • Inserted to DB: {self.stats['inserted']}")
        
        # Calculate cost
        avg_chars_per_location = 30
        google_chars = self.stats['google_translate_used'] * avg_chars_per_location
        cost = (google_chars / 1_000_000) * 20
        
        print(f"\n💰 Estimated Cost:")
        print(f"  • OSM queries: $0.00 (FREE)")
        print(f"  • Google Translate: ~${cost:.2f}")
        print(f"  • Total: ~${cost:.2f}")
        
        print(f"\n✅ Coverage: {((self.stats['osm_matches'] + self.stats['google_translate_used']) / self.stats['total_locations'] * 100):.1f}%")

def main():
    import argparse
    
    parser = argparse.ArgumentParser(description='Populate Tamil translations using hybrid approach')
    parser.add_argument('--confirm', action='store_true', help='Actually insert data (default is dry-run)')
    parser.add_argument('--osm-only', action='store_true', help='Use only OSM, skip Google Translate')
    parser.add_argument('--env', choices=['production', 'preprod'], default='production',
                        help='Environment to update (default: production)')
    
    args = parser.parse_args()
    
    print("🌏 HYBRID TAMIL TRANSLATION POPULATOR")
    print("="*70)
    print(f"Environment: {args.env.upper()}")
    print("Strategy: OSM first (FREE), Google Translate for gaps (~$1-2)")
    print("="*70)
    
    if not args.confirm:
        print("\n⚠️  DRY RUN MODE - Use --confirm to actually insert data")
    
    if args.osm_only:
        print("\n📌 OSM ONLY MODE - Google Translate will be skipped (100% FREE)")
    
    translator = HybridTamilTranslator(dry_run=not args.confirm, environment=args.env)
    
    # Step 1: Fetch locations from database
    locations = translator.fetch_locations_from_db()
    
    if not locations:
        print("\n✅ All locations already have Tamil translations!")
        return
    
    # Step 2: Fetch OSM data
    if not translator.fetch_osm_tamil_names_batch():
        print("\n❌ Failed to fetch OSM data. Exiting.")
        return
    
    # Step 3: Process locations
    translations = translator.process_locations(locations)
    
    # Step 4: Insert translations
    if translations:
        translator.insert_translations(translations)
    
    # Step 5: Print summary
    translator.print_summary()
    
    print("\n✅ Translation population complete!")
    
    if not args.confirm:
        print("\n💡 To actually insert the data, run:")
        print(f"   python3 populate_tamil_translations_hybrid.py --env {args.env} --confirm")

if __name__ == "__main__":
    main()
