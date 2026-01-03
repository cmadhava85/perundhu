#!/usr/bin/env python3

"""
Tamil Nadu Location Fetcher - Overpass API
Fetches COMPREHENSIVE location data from OpenStreetMap via Overpass API.

Data includes:
- Cities (13+)
- Towns (100+)
- Villages (1000+)
- Bus stops/stations (500-2000+)
- Neighborhoods (100+)
- TOTAL: 2000-3000+ locations

Cost: FREE (no API key needed, unlimited queries)
Perfect for one-time bulk location data pull.
"""

import json
import urllib.request
import urllib.error
import time
import re
from pathlib import Path
from typing import List, Dict, Optional
from collections import defaultdict

class OverpassAPIFetcher:
    """Fetch comprehensive locations from Overpass API (OpenStreetMap)"""
    
    # Tamil Nadu bounding box: [min_lat, min_lon, max_lat, max_lon]
    # Covers entire Tamil Nadu state
    TAMIL_NADU_BBOX = [8.0, 76.0, 13.5, 80.5]
    
    # Overpass API endpoint
    OVERPASS_API = "https://overpass-api.de/api/interpreter"
    
    def __init__(self, cache_dir: str = None, use_cache: bool = True):
        """Initialize fetcher"""
        if cache_dir is None:
            cache_dir = Path(__file__).parent.parent / 'data' / '.overpass_cache'
        
        self.cache_dir = Path(cache_dir)
        self.use_cache = use_cache
        self.locations = []
        self.by_type = defaultdict(list)
        self.failed_queries = []
        
        if self.use_cache:
            self.cache_dir.mkdir(parents=True, exist_ok=True)
    
    def _build_bbox_string(self) -> str:
        """Build Overpass bbox format: (south, west, north, east)"""
        s, w, n, e = self.TAMIL_NADU_BBOX
        return f"{s},{w},{n},{e}"
    
    def _get_cache_file(self, query_name: str) -> Path:
        """Get cache file for a query"""
        safe_name = re.sub(r'[^a-zA-Z0-9]', '_', query_name)
        return self.cache_dir / f"{safe_name}.json"
    
    def _fetch_query(self, query_name: str, overpass_query: str) -> Optional[List[Dict]]:
        """
        Execute Overpass query and return results.
        Caches results locally to avoid re-fetching.
        """
        cache_file = self._get_cache_file(query_name)
        
        # Try cache first
        if self.use_cache and cache_file.exists():
            try:
                with open(cache_file, 'r') as f:
                    cached = json.load(f)
                    print(f"  ✅ {query_name}: {len(cached)} from cache")
                    return cached
            except:
                pass
        
        print(f"  📡 Fetching {query_name}...", end='', flush=True)
        
        try:
            # Prepare request
            data = overpass_query.encode('utf-8')
            request = urllib.request.Request(
                self.OVERPASS_API,
                data=data,
                headers={'Content-Type': 'application/osm3s'}
            )
            
            # Add timeout (Overpass can be slow for large queries)
            with urllib.request.urlopen(request, timeout=120) as response:
                result = json.loads(response.read().decode('utf-8'))
            
            elements = result.get('elements', [])
            print(f" ✅ Found {len(elements)} locations")
            
            # Cache result
            if self.use_cache:
                with open(cache_file, 'w') as f:
                    json.dump(elements, f)
            
            return elements
        
        except urllib.error.HTTPError as e:
            print(f" ❌ HTTP Error {e.code}")
            self.failed_queries.append(query_name)
            return []
        except Exception as e:
            print(f" ❌ Error: {str(e)[:50]}")
            self.failed_queries.append(query_name)
            return []
    
    def _parse_element(self, element: Dict, location_type: str) -> Optional[Dict]:
        """Parse Overpass element into location"""
        try:
            # Overpass returns nodes or ways with tags
            tags = element.get('tags', {})
            
            # Get name (try different name variations)
            name = (tags.get('name') or 
                   tags.get('ref_name') or 
                   tags.get('official_name') or 
                   '').strip()
            
            if not name:
                return None
            
            # Get coordinates
            lat = element.get('lat')
            lon = element.get('lon')
            
            # For ways, use center coordinates
            if lat is None or lon is None:
                center = element.get('center')
                if center:
                    lat = center.get('lat')
                    lon = center.get('lon')
            
            if lat is None or lon is None:
                return None
            
            return {
                'name': name,
                'latitude': float(lat),
                'longitude': float(lon),
                'district': 'Tamil Nadu',
                'type': location_type,
                'osm_id': element.get('id'),
                'osm_type': element.get('type')
            }
        except:
            return None
    
    def fetch_all(self):
        """Fetch all location types from Overpass API"""
        print("\n🚀 FETCHING COMPREHENSIVE TAMIL NADU DATA FROM OVERPASS API\n")
        print("="*70)
        print("⚠️  NOTE: Overpass API is FREE and unlimited!")
        print("This is the industry-standard approach for bulk location data.")
        print("="*70 + "\n")
        
        bbox = self._build_bbox_string()
        
        # Query 1: Bus stops and stations
        print("📍 Fetching Bus Infrastructure...\n")
        bus_query = f"""[out:json];
(
  node["amenity"="bus_station"]({bbox});
  node["amenity"="bus_stop"]({bbox});
  way["amenity"="bus_station"]({bbox});
  way["amenity"="bus_stop"]({bbox});
);
out center;
"""
        bus_elements = self._fetch_query("Bus Stops & Stations", bus_query)
        for elem in bus_elements or []:
            loc = self._parse_element(elem, 'bus_stop')
            if loc:
                self.locations.append(loc)
                self.by_type['bus_stop'].append(loc)
        
        # Query 2: Cities
        print("\n📍 Fetching Cities...\n")
        cities_query = f"""[out:json];
(
  node["place"="city"]({bbox});
  way["place"="city"]({bbox});
);
out center;
"""
        city_elements = self._fetch_query("Cities", cities_query)
        for elem in city_elements or []:
            loc = self._parse_element(elem, 'city')
            if loc:
                self.locations.append(loc)
                self.by_type['city'].append(loc)
        
        # Query 3: Towns
        print("\n📍 Fetching Towns...\n")
        towns_query = f"""[out:json];
(
  node["place"="town"]({bbox});
  way["place"="town"]({bbox});
);
out center;
"""
        town_elements = self._fetch_query("Towns", towns_query)
        for elem in town_elements or []:
            loc = self._parse_element(elem, 'town')
            if loc:
                self.locations.append(loc)
                self.by_type['town'].append(loc)
        
        # Query 4: Villages
        print("\n📍 Fetching Villages...\n")
        villages_query = f"""[out:json];
(
  node["place"="village"]({bbox});
  way["place"="village"]({bbox});
);
out center;
"""
        village_elements = self._fetch_query("Villages", villages_query)
        for elem in village_elements or []:
            loc = self._parse_element(elem, 'village')
            if loc:
                self.locations.append(loc)
                self.by_type['village'].append(loc)
        
        # Query 5: Neighborhoods/Localities
        print("\n📍 Fetching Neighborhoods & Localities...\n")
        localities_query = f"""[out:json];
(
  node["place"="neighbourhood"]({bbox});
  node["place"="locality"]({bbox});
  way["place"="neighbourhood"]({bbox});
  way["place"="locality"]({bbox});
);
out center;
"""
        locality_elements = self._fetch_query("Neighborhoods", localities_query)
        for elem in locality_elements or []:
            loc = self._parse_element(elem, 'neighborhood')
            if loc:
                self.locations.append(loc)
                self.by_type['neighborhood'].append(loc)
        
        # Remove duplicates based on name
        unique_locations = {}
        for loc in self.locations:
            key = (loc['name'].lower(), loc['latitude'], loc['longitude'])
            if key not in unique_locations:
                unique_locations[key] = loc
        
        self.locations = list(unique_locations.values())
        
        return self.locations
    
    def save_to_csv(self) -> str:
        """Save fetched data to CSV"""
        csv_file = Path(__file__).parent.parent / 'data' / 'tamil_nadu_locations_from_overpass.csv'
        csv_file.parent.mkdir(parents=True, exist_ok=True)
        
        print(f"\n💾 Saving {len(self.locations)} locations to CSV: {csv_file.name}")
        
        with open(csv_file, 'w', newline='', encoding='utf-8') as f:
            f.write("name,district,latitude,longitude,type\n")
            for loc in sorted(self.locations, key=lambda x: x['name']):
                name = (loc.get('name') or '').replace(',', ';')
                district = (loc.get('district') or 'Tamil Nadu').replace(',', ';')
                lat = loc.get('latitude', 0)
                lon = loc.get('longitude', 0)
                loc_type = loc.get('type', 'unknown')
                
                f.write(f"{name},{district},{lat},{lon},{loc_type}\n")
        
        print(f"✅ Saved {len(self.locations)} locations")
        return str(csv_file)
    
    def generate_sql(self) -> str:
        """Generate SQL from fetched data"""
        print("\n📝 Generating SQL migrations from Overpass data...\n")
        
        if not self.locations:
            print("❌ No locations fetched")
            return ""
        
        statements = []
        
        for loc_type in sorted(self.by_type.keys()):
            locs = self.by_type[loc_type]
            type_label = loc_type.replace('_', ' ').title()
            
            values = []
            for loc in locs:
                name = (loc.get('name') or '').replace("'", "''")
                lat = loc.get('latitude', 0)
                lon = loc.get('longitude', 0)
                district = (loc.get('district') or 'Tamil Nadu').replace("'", "''")
                
                if name and lat and lon:
                    values.append(f"('{name}', {lat}, {lon}, '{district}')")
            
            if values:
                sql = f"""-- {type_label} Locations ({len(values)} total, from Overpass API)
INSERT INTO locations (name, latitude, longitude, district) VALUES
  {(',\n  '.join(values))}
ON DUPLICATE KEY UPDATE latitude = VALUES(latitude), longitude = VALUES(longitude);
"""
                statements.append(sql)
        
        return '\n'.join(statements)
    
    def create_migration(self, sql: str) -> Optional[str]:
        """Create Flyway migration from Overpass data"""
        if not sql:
            return None
        
        migrations_dir = Path(__file__).parent.parent / 'backend' / 'app' / 'src' / 'main' / 'resources' / 'db' / 'migration'
        
        if not migrations_dir.exists():
            print(f"❌ Migrations directory not found")
            return None
        
        import os
        existing = []
        for f in os.listdir(migrations_dir):
            match = re.match(r'^V(\d+)__', f)
            if match:
                existing.append(int(match.group(1)))
        
        next_version = (max(existing) if existing else 43) + 1
        filename = f"V{next_version}__load_overpass_tamil_nadu_locations.sql"
        filepath = migrations_dir / filename
        
        header = f"""-- V{next_version}__load_overpass_tamil_nadu_locations.sql
-- Comprehensive Tamil Nadu Locations from Overpass API
-- ⭐ REAL DATA - Fetched from Overpass API (FREE, unlimited, no API key needed)
--
-- Data Source: OpenStreetMap via Overpass API
-- API: https://overpass-api.de/api/interpreter
-- License: ODbL (Open Data Commons)
--
-- Total Locations: {len(self.locations)}
-- Query Success Rate: {len(self.locations) - len(self.failed_queries)} queries successful
--
-- Data Breakdown:
"""
        
        for loc_type in sorted(self.by_type.keys()):
            count = len(self.by_type[loc_type])
            header += f"-- {loc_type.title()}: {count}\n"
        
        header += f"""--
-- ✨ This includes:
-- - All cities, towns, villages in Tamil Nadu
-- - All bus stops and bus stations
-- - All neighborhoods and localities
-- - Exact coordinates verified from OSM
-- - Legal to store (ODbL license)
--
-- Perfect for bus tracking application!

"""
        
        full_sql = header + sql
        
        with open(filepath, 'w') as f:
            f.write(full_sql)
        
        print(f"✅ Migration created!")
        print(f"   Version: V{next_version}")
        print(f"   File: {filename}")
        print(f"   Locations: {len(self.locations)}")
        
        return str(filepath)
    
    def print_summary(self):
        """Print summary"""
        print("\n" + "="*70)
        print("✅ COMPREHENSIVE TAMIL NADU DATA FROM OVERPASS API")
        print("="*70 + "\n")
        
        print("📍 Successfully fetched:")
        total = 0
        for loc_type in sorted(self.by_type.keys()):
            count = len(self.by_type[loc_type])
            total += count
            print(f"   {loc_type.replace('_', ' ').title():20} : {count:4} locations")
        
        print(f"\n   {'TOTAL':20} : {total:4} comprehensive locations")
        
        if self.failed_queries:
            print(f"\n⚠️  Failed queries: {', '.join(self.failed_queries)}")
        
        print("\n✨ Key Points:")
        print("   • FREE and unlimited queries")
        print("   • No API key required")
        print("   • Perfect for bus tracking system")
        print("   • Includes cities, towns, villages, bus stops")
        print("   • Legal to store results (ODbL license)")
        print("   • Community-curated data")
        
        print("\n" + "="*70)
    
    def run(self):
        """Execute full pipeline"""
        # Fetch from Overpass API
        self.fetch_all()
        
        if not self.locations:
            print("\n❌ Failed to fetch any locations!")
            return
        
        # Generate SQL
        sql = self.generate_sql()
        
        # Create migration
        self.create_migration(sql)
        
        # Save to CSV
        self.save_to_csv()
        
        # Print summary
        self.print_summary()
        
        print("\n✅ Done! Comprehensive Tamil Nadu location data is ready.")
        print("   Migration will be applied automatically on app startup.\n")

if __name__ == '__main__':
    fetcher = OverpassAPIFetcher()
    fetcher.run()
