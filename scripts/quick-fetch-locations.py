#!/usr/bin/env python3

"""
Quick Location Fetcher - Generates JSON output for database upload
Skips deduplication for speed, focuses on data export
"""

import json
import urllib.request
import urllib.error
import time
from pathlib import Path
from typing import List, Dict, Optional
from collections import defaultdict

class QuickLocationFetcher:
    """Quickly fetch and export locations as JSON"""
    
    TAMIL_NADU_BBOX = [8.0, 76.0, 13.5, 80.5]
    OVERPASS_API = "https://overpass-api.de/api/interpreter"
    
    COORD_BOUNDS = {
        'lat_min': 8.0, 'lat_max': 13.5,
        'lon_min': 76.0, 'lon_max': 80.5
    }
    
    def __init__(self, cache_dir: str = None, use_cache: bool = True):
        self.cache_dir = Path(cache_dir) if cache_dir else Path(__file__).parent.parent / 'data' / '.overpass_cache'
        self.use_cache = use_cache
        self.locations = []
        self.by_type = defaultdict(list)
        
        if self.use_cache:
            self.cache_dir.mkdir(parents=True, exist_ok=True)
    
    def _build_bbox_string(self) -> str:
        s, w, n, e = self.TAMIL_NADU_BBOX
        return f"{s},{w},{n},{e}"
    
    def _get_cache_file(self, query_name: str) -> Path:
        import re
        safe_name = re.sub(r'[^a-zA-Z0-9]', '_', query_name)
        return self.cache_dir / f"{safe_name}.json"
    
    def _fetch_query(self, query_name: str, overpass_query: str) -> Optional[List[Dict]]:
        cache_file = self._get_cache_file(query_name)
        
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
            data = overpass_query.encode('utf-8')
            request = urllib.request.Request(
                self.OVERPASS_API,
                data=data,
                headers={'Content-Type': 'application/osm3s'}
            )
            
            with urllib.request.urlopen(request, timeout=120) as response:
                result = json.loads(response.read().decode('utf-8'))
            
            elements = result.get('elements', [])
            print(f" ✅ Found {len(elements)} locations")
            
            if self.use_cache:
                with open(cache_file, 'w') as f:
                    json.dump(elements, f)
            
            return elements
        except urllib.error.URLError as e:
            print(f" ❌ Error: {e}")
            return None
    
    def _is_valid_coordinate(self, lat: float, lon: float) -> bool:
        """Check if coordinate is valid"""
        try:
            lat = float(lat)
            lon = float(lon)
            if lat == 0 and lon == 0:
                return False
            if not (self.COORD_BOUNDS['lat_min'] <= lat <= self.COORD_BOUNDS['lat_max']):
                return False
            if not (self.COORD_BOUNDS['lon_min'] <= lon <= self.COORD_BOUNDS['lon_max']):
                return False
            return True
        except:
            return False
    
    def _parse_element(self, element: Dict, loc_type: str) -> Optional[Dict]:
        """Parse OSM element to location"""
        try:
            name = element.get('tags', {}).get('name', '').strip()
            if not name or len(name) < 2:
                return None
            
            lat = element.get('lat')
            lon = element.get('lon')
            
            if not self._is_valid_coordinate(lat, lon):
                return None
            
            return {
                'name': name,
                'type': loc_type,
                'latitude': float(lat),
                'longitude': float(lon),
                'osm_id': element.get('id')
            }
        except:
            return None
    
    def fetch_all(self):
        """Fetch all locations"""
        print("\n🚀 QUICK FETCH - Tamil Nadu Locations from Overpass API\n")
        print("=" * 70)
        print("⚠️  NOTE: Fetching all cached data (use_cache=True)")
        print("=" * 70 + "\n")
        
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
out center;"""
        
        bus_elements = self._fetch_query("Bus Stops & Stations", bus_query)
        if bus_elements:
            for elem in bus_elements:
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
out center;"""
        
        cities_elements = self._fetch_query("Cities", cities_query)
        if cities_elements:
            for elem in cities_elements:
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
out center;"""
        
        towns_elements = self._fetch_query("Towns", towns_query)
        if towns_elements:
            for elem in towns_elements:
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
out center;"""
        
        villages_elements = self._fetch_query("Villages", villages_query)
        if villages_elements:
            for elem in villages_elements:
                loc = self._parse_element(elem, 'village')
                if loc:
                    self.locations.append(loc)
                    self.by_type['village'].append(loc)
        
        # Query 5: Neighborhoods
        print("\n📍 Fetching Neighborhoods & Localities...\n")
        neighborhoods_query = f"""[out:json];
(
  node["place"="neighborhood"]({bbox});
  way["place"="neighborhood"]({bbox});
);
out center;"""
        
        neighborhoods_elements = self._fetch_query("Neighborhoods", neighborhoods_query)
        if neighborhoods_elements:
            for elem in neighborhoods_elements:
                loc = self._parse_element(elem, 'neighborhood')
                if loc:
                    self.locations.append(loc)
                    self.by_type['neighborhood'].append(loc)
        
        # Query 6: Suburbs
        print("\n📍 Fetching Suburbs & Suburban Areas...\n")
        suburbs_query = f"""[out:json];
(
  node["place"="suburb"]({bbox});
  way["place"="suburb"]({bbox});
);
out center;"""
        
        suburbs_elements = self._fetch_query("Suburbs", suburbs_query)
        if suburbs_elements:
            for elem in suburbs_elements:
                loc = self._parse_element(elem, 'suburb')
                if loc:
                    self.locations.append(loc)
                    self.by_type['suburb'].append(loc)
        
        # Query 7: Hamlets
        print("\n📍 Fetching Hamlets & Residential Areas...\n")
        hamlets_query = f"""[out:json];
(
  node["place"="hamlet"]({bbox});
  way["place"="hamlet"]({bbox});
);
out center;"""
        
        hamlets_elements = self._fetch_query("Hamlets", hamlets_query)
        if hamlets_elements:
            for elem in hamlets_elements:
                loc = self._parse_element(elem, 'hamlet')
                if loc:
                    self.locations.append(loc)
                    self.by_type['hamlet'].append(loc)
        
        return self.locations
    
    def save_to_json(self) -> str:
        """Save locations to JSON file"""
        output_file = Path(__file__).parent.parent / 'data' / 'tamil_nadu_locations.json'
        output_file.parent.mkdir(parents=True, exist_ok=True)
        
        with open(output_file, 'w') as f:
            json.dump(self.locations, f, indent=2)
        
        return str(output_file)
    
    def save_to_jsonl(self) -> str:
        """Save locations to JSONL file (one JSON object per line)"""
        output_file = Path(__file__).parent.parent / 'data' / 'tamil_nadu_locations.jsonl'
        output_file.parent.mkdir(parents=True, exist_ok=True)
        
        with open(output_file, 'w') as f:
            for loc in self.locations:
                f.write(json.dumps(loc) + '\n')
        
        return str(output_file)
    
    def save_to_csv(self) -> str:
        """Save locations to CSV file"""
        import csv
        output_file = Path(__file__).parent.parent / 'data' / 'tamil_nadu_locations.csv'
        output_file.parent.mkdir(parents=True, exist_ok=True)
        
        with open(output_file, 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=['name', 'type', 'latitude', 'longitude', 'osm_id'])
            writer.writeheader()
            writer.writerows(self.locations)
        
        return str(output_file)
    
    def print_summary(self):
        """Print summary statistics"""
        print("\n\n" + "=" * 70)
        print("📊 SUMMARY STATISTICS")
        print("=" * 70)
        print(f"\n✅ Total Locations Fetched: {len(self.locations):,}")
        print(f"✅ Locations by Type:\n")
        
        for loc_type in sorted(self.by_type.keys()):
            count = len(self.by_type[loc_type])
            print(f"   • {loc_type.replace('_', ' ').title()}: {count:,}")
        
        print(f"\n✅ Geographic Bounds (Tamil Nadu):")
        print(f"   • Latitude:  {self.COORD_BOUNDS['lat_min']:.1f}° to {self.COORD_BOUNDS['lat_max']:.1f}°N")
        print(f"   • Longitude: {self.COORD_BOUNDS['lon_min']:.1f}° to {self.COORD_BOUNDS['lon_max']:.1f}°E")
        print("\n" + "=" * 70)


def main():
    """Main execution"""
    fetcher = QuickLocationFetcher(use_cache=True)
    
    # Fetch all data
    print("\n⏳ Fetching locations (this may take a few seconds)...\n")
    locations = fetcher.fetch_all()
    
    if not locations:
        print("\n❌ No locations fetched!")
        return 1
    
    # Print summary
    fetcher.print_summary()
    
    # Save in multiple formats
    print("\n📁 Saving locations in multiple formats...\n")
    
    json_file = fetcher.save_to_json()
    print(f"✅ JSON file: {json_file}")
    print(f"   Format: One JSON array with all {len(locations):,} locations")
    
    jsonl_file = fetcher.save_to_jsonl()
    print(f"\n✅ JSONL file: {jsonl_file}")
    print(f"   Format: One JSON object per line (newline-delimited)")
    
    csv_file = fetcher.save_to_csv()
    print(f"\n✅ CSV file: {csv_file}")
    print(f"   Format: Comma-separated values for spreadsheets/database tools")
    
    print("\n" + "=" * 70)
    print("📝 FORMATS AVAILABLE FOR DATABASE UPLOAD:")
    print("=" * 70)
    print("""
1. JSON (.json) - Single file with array of all locations
   - Best for: Direct database import, API consumption
   - Size: Compact, efficient
   - Usage: mongoimport, database loaders

2. JSONL (.jsonl) - One JSON object per line
   - Best for: Streaming data, large datasets
   - Size: Same as JSON, line-based
   - Usage: Kafka, streaming pipelines

3. CSV (.csv) - Spreadsheet format
   - Best for: Excel, Google Sheets, quick review
   - Size: Readable, human-friendly
   - Usage: SQL INSERT, batch tools

📊 Data includes: name, type, latitude, longitude, osm_id
""")
    
    return 0


if __name__ == '__main__':
    exit(main())
