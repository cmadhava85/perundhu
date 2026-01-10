#!/usr/bin/env python3
"""
Fetch Tamil location names from Overpass API for Tamil Nadu
Generates SQL INSERT statements for translations table
"""

import requests
import json
import time
import sys
import os
from typing import List, Dict, Tuple

# Overpass API endpoint
OVERPASS_API = "https://overpass.kumi.systems/api/interpreter"

# Tamil Nadu bounding box: [south, west, north, east]
TAMIL_NADU_BBOX = (8.0, 76.0, 13.5, 80.5)

# Timeout for API calls
TIMEOUT = 30

def build_overpass_query(bbox: Tuple[float, float, float, float]) -> str:
    """Build Overpass QL query to fetch all Tamil Nadu locations with Tamil names"""
    south, west, north, east = bbox
    return f"""[out:json][timeout:120];
(
  node["name:ta"]["place"~"city|town|village|hamlet|suburb|neighbourhood|locality"]({south},{west},{north},{east});
  way["name:ta"]["place"~"city|town|village|hamlet|suburb|neighbourhood|locality"]({south},{west},{north},{east});
  relation["name:ta"]["place"~"city|town|village|hamlet|suburb|neighbourhood|locality"]({south},{west},{north},{east});
);
out geom center;
"""

def query_overpass(query: str) -> Dict:
    """Query Overpass API and return results"""
    try:
        print(f"[INFO] Querying Overpass API...")
        response = requests.post(
            OVERPASS_API,
            data={"data": query},
            timeout=TIMEOUT,
            headers={"User-Agent": "PerundhuTamilLocationFetcher/1.0"}
        )
        try:
            response.raise_for_status()
        except requests.exceptions.HTTPError as http_err:
            print(f"[ERROR] Overpass API request failed: {http_err}")
            print(f"[ERROR] Response body: {response.text[:2000]}")
            return None
        return response.json()
    except requests.exceptions.Timeout:
        print("[ERROR] Overpass API request timed out")
        return None
    except requests.exceptions.RequestException as e:
        print(f"[ERROR] Overpass API request failed: {e}")
        return None

def extract_tamil_locations(overpass_data: Dict) -> List[Dict]:
    """Extract locations with Tamil names from Overpass response"""
    locations = []
    
    if not overpass_data or "elements" not in overpass_data:
        print("[ERROR] Invalid Overpass response")
        return locations
    
    for element in overpass_data["elements"]:
        if "tags" not in element:
            continue
        
        tags = element["tags"]
        tamil_name = tags.get("name:ta")
        english_name = tags.get("name")
        
        if not tamil_name:
            continue
        
        # Extract coordinates
        lat = element.get("lat")
        lon = element.get("lon")
        
        if lat is None or lon is None:
            # Try to get center coordinates
            if "center" in element:
                lat = element["center"].get("lat")
                lon = element["center"].get("lon")
        
        locations.append({
            "english_name": english_name or tamil_name,
            "tamil_name": tamil_name,
            "latitude": lat,
            "longitude": lon,
            "type": tags.get("place", "unknown")
        })
    
    return locations

def find_location_ids_in_db(english_names: List[str]) -> Dict[str, int]:
    """Find location IDs in database for English names via mysql.connector."""
    import mysql.connector

    location_map: Dict[str, int] = {}
    if not english_names:
        return location_map

    db_user = os.getenv("DB_USER", "root")
    db_password = os.getenv("DB_PASSWORD", "root")
    db_host = os.getenv("DB_HOST", "127.0.0.1")
    db_port = int(os.getenv("DB_PORT", "3306"))
    db_name = os.getenv("DB_NAME", "perundhu")

    def chunks(lst, size):
        for i in range(0, len(lst), size):
            yield lst[i:i + size]

    try:
        conn = mysql.connector.connect(
            host=db_host,
            port=db_port,
            user=db_user,
            password=db_password,
            database=db_name,
        )
        cursor = conn.cursor()

        for chunk in chunks(english_names, 500):
            placeholders = ",".join(["%s"] * len(chunk))
            sql = f"SELECT id, name FROM locations WHERE name IN ({placeholders})"
            cursor.execute(sql, chunk)
            for loc_id, name in cursor.fetchall():
                location_map[name] = loc_id

        cursor.close()
        conn.close()
    except Exception as e:
        print(f"[ERROR] Failed to query database via mysql.connector: {e}")

    return location_map

def generate_sql_inserts(tamil_locations: List[Dict], location_ids: Dict[str, int]) -> str:
    """Generate SQL INSERT statements for translations"""
    sql_statements = []
    matched = 0
    unmatched = 0
    
    for loc in tamil_locations:
        english_name = loc["english_name"]
        tamil_name = loc["tamil_name"]
        
        # Try to find matching location in database
        location_id = location_ids.get(english_name)
        
        if location_id:
            matched += 1
            sql = f"""INSERT IGNORE INTO translations 
            (entity_type, entity_id, language_code, field_name, translated_value) 
            VALUES ('location', {location_id}, 'ta', 'name', '{tamil_name.replace("'", "''")}');"""
            sql_statements.append(sql)
        else:
            unmatched += 1
    
    print(f"\n[SUMMARY] Found {matched} matching locations in database")
    print(f"[SUMMARY] {unmatched} Tamil locations not found in database")
    
    return "\n".join(sql_statements)

def main():
    print("=" * 60)
    print("Overpass Tamil Location Fetcher for Perundhu")
    print("=" * 60)
    
    # Step 1: Build and execute Overpass query
    print("\n[STEP 1] Building Overpass QL query...")
    query = build_overpass_query(TAMIL_NADU_BBOX)
    
    print("[STEP 2] Querying Overpass API (this may take 1-2 minutes)...")
    overpass_data = query_overpass(query)
    
    if not overpass_data:
        print("[ERROR] Failed to get data from Overpass API")
        sys.exit(1)
    
    # Step 3: Extract Tamil locations
    print(f"\n[STEP 3] Extracting Tamil location names...")
    tamil_locations = extract_tamil_locations(overpass_data)
    print(f"[INFO] Found {len(tamil_locations)} locations with Tamil names in Overpass")
    
    if len(tamil_locations) == 0:
        print("[WARNING] No Tamil location names found in Overpass!")
        print("[INFO] OpenStreetMap data for Tamil Nadu may have limited Tamil translations")
        sys.exit(0)
    
    # Sample output
    print("\n[SAMPLE] First 10 Tamil locations found:")
    for loc in tamil_locations[:10]:
        print(f"  - {loc['english_name']} → {loc['tamil_name']}")
    
    # Step 4: Find matching locations in database
    print(f"\n[STEP 4] Matching with database locations...")
    english_names = list(set([loc["english_name"] for loc in tamil_locations]))
    location_ids = find_location_ids_in_db(english_names)
    
    # Step 5: Generate SQL
    print(f"\n[STEP 5] Generating SQL INSERT statements...")
    sql_inserts = generate_sql_inserts(tamil_locations, location_ids)
    
    # Step 6: Save to file
    output_file = f"tamil_translations_{int(time.time())}.sql"
    with open(output_file, "w", encoding="utf-8") as f:
        f.write("-- Tamil location translations from Overpass API\n")
        f.write(f"-- Generated at {time.strftime('%Y-%m-%d %H:%M:%S')}\n")
        f.write(f"-- Total translations: {len(tamil_locations)}\n\n")
        f.write(sql_inserts)
    
    print(f"\n[SUCCESS] SQL file generated: {output_file}")
    print(f"[INFO] Total INSERT statements: {sql_inserts.count('INSERT')}")
    
    # Step 7: Option to import
    print(f"\n[NEXT STEP] To import into database, run:")
    print(f"  mysql -u root -proot perundhu < {output_file}")
    
    return 0

if __name__ == "__main__":
    sys.exit(main())
