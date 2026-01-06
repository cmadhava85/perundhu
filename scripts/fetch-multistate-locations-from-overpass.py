#!/usr/bin/env python3
"""
Fetch locations from Tamil Nadu and neighboring states (Kerala, Karnataka, Andhra Pradesh)
from Overpass API for bus route coverage expansion.

States included:
- Tamil Nadu: Routes within state
- Kerala: Southern routes from Tamil Nadu
- Karnataka: Western and northwestern routes
- Andhra Pradesh: Northern routes

Generates SQL INSERT statements for locations table
"""

import requests
import json
import time
import sys
from typing import List, Dict, Tuple
from datetime import datetime

# Overpass API endpoint
OVERPASS_API = "https://overpass-api.de/api/interpreter"

# State bounding boxes: [south, west, north, east]
STATES = {
    "tamil_nadu": {
        "bbox": (8.0, 76.0, 13.5, 80.5),
        "description": "Tamil Nadu",
        "priority": 1
    },
    "kerala": {
        "bbox": (8.0, 76.0, 12.5, 77.5),  # Southern Kerala bordering TN
        "description": "Kerala (Southern border with TN)",
        "priority": 2
    },
    "karnataka": {
        "bbox": (13.0, 74.0, 18.0, 78.5),  # Karnataka western and northwestern
        "description": "Karnataka (routes to Bangalore, Mysore, etc.)",
        "priority": 2
    },
    "andhra_pradesh": {
        "bbox": (13.5, 77.0, 19.5, 84.5),  # Andhra Pradesh northern
        "description": "Andhra Pradesh (Tirupati, Nellore, etc.)",
        "priority": 2
    }
}

# Timeout for API calls (in seconds)
TIMEOUT = 60

# Delay between state queries (to respect API limits)
DELAY_BETWEEN_STATES = 5

def build_overpass_query(bbox: Tuple[float, float, float, float], priority: int = 1) -> str:
    """
    Build Overpass QL query to fetch all locations from a region.
    
    Queries for:
    - Cities, towns, villages, hamlets
    - Bus stations and transit stations
    - Named places that could be bus route destinations
    
    @param bbox: (south, west, north, east) coordinates
    @param priority: Query priority (1=high, 2=normal)
    """
    south, west, north, east = bbox
    
    # Higher timeout for priority 1 (more comprehensive)
    timeout = "[timeout:90]" if priority == 1 else "[timeout:60]"
    
    return f"""{timeout}[bbox:{south},{west},{north},{east}];
(
  node[name][place~"city|town|village|hamlet|suburb|neighbourhood|locality|neighbourhood"];
  node[name][amenity~"bus_station|bus_stop|transit_station"];
  way[name][place~"city|town|village|hamlet|suburb|neighbourhood|locality|neighbourhood"];
  relation[name][place~"city|town|village|hamlet|suburb|neighbourhood|locality|neighbourhood"];
);
out geom center;
"""

def query_overpass(query: str, state: str) -> Dict:
    """Query Overpass API and return results with error handling"""
    try:
        print(f"  [INFO] Querying Overpass API for {state}...")
        response = requests.post(
            OVERPASS_API,
            data={"data": query},
            timeout=TIMEOUT,
            headers={"User-Agent": "PerundhuMultiStateLocationFetcher/1.0"}
        )
        
        if response.status_code == 429:
            print(f"  [WARN] Rate limited by Overpass API. Waiting 60s...")
            time.sleep(60)
            # Retry once
            response = requests.post(
                OVERPASS_API,
                data={"data": query},
                timeout=TIMEOUT
            )
        
        response.raise_for_status()
        return response.json()
    except requests.exceptions.Timeout:
        print(f"  [ERROR] Overpass API request timed out for {state}")
        return None
    except requests.exceptions.RequestException as e:
        print(f"  [ERROR] Overpass API request failed for {state}: {e}")
        return None

def extract_locations(overpass_data: Dict, state: str, priority: int = 1) -> List[Dict]:
    """
    Extract locations from Overpass response.
    
    Returns:
    - Location name (English)
    - Coordinates (latitude, longitude)
    - Type (city, town, village, bus_station, etc.)
    - State it belongs to
    """
    locations = []
    
    if not overpass_data or "elements" not in overpass_data:
        print(f"  [ERROR] Invalid Overpass response for {state}")
        return locations
    
    print(f"  [INFO] Processing {len(overpass_data['elements'])} elements from {state}...")
    
    for element in overpass_data["elements"]:
        if "tags" not in element:
            continue
        
        tags = element["tags"]
        name = tags.get("name")
        
        if not name or len(name) < 2:
            continue
        
        # Skip certain unwanted names
        if any(skip in name.lower() for skip in ["unnamed", "no name", "tbd"]):
            continue
        
        # Extract coordinates
        lat = element.get("lat")
        lon = element.get("lon")
        
        if lat is None or lon is None:
            # Try to get center coordinates for ways/relations
            if "center" in element:
                lat = element["center"].get("lat")
                lon = element["center"].get("lon")
        
        if lat is None or lon is None:
            continue
        
        location_type = tags.get("place", tags.get("amenity", "unknown"))
        
        locations.append({
            "name": name.strip(),
            "latitude": round(lat, 6),
            "longitude": round(lon, 6),
            "type": location_type,
            "state": state,
            "district": tags.get("district", ""),
            "osm_id": element.get("id"),
            "osm_type": element.get("type", "unknown"),
            "priority": priority
        })
    
    # Remove duplicates by name and coordinates
    unique_locations = {}
    for loc in locations:
        key = (loc["name"], round(loc["latitude"], 3), round(loc["longitude"], 3))
        if key not in unique_locations:
            unique_locations[key] = loc
    
    print(f"  [INFO] Extracted {len(unique_locations)} unique locations from {state}")
    return list(unique_locations.values())

def generate_sql_inserts(all_locations: Dict[str, List[Dict]]) -> str:
    """Generate SQL INSERT statements for locations table"""
    sql_statements = []
    total_locations = 0
    
    print("\n[GENERATING SQL]")
    print("=" * 80)
    
    for state, locations in all_locations.items():
        print(f"\n-- {state.upper()} ({len(locations)} locations)")
        
        for loc in locations:
            total_locations += 1
            
            # Escape single quotes in names
            name = loc["name"].replace("'", "''")
            district = loc.get("district", "").replace("'", "''")
            
            sql = f"""INSERT INTO locations (name, latitude, longitude, district) 
VALUES ('{name}', {loc['latitude']}, {loc['longitude']}, '{district}')
ON DUPLICATE KEY UPDATE 
  latitude=VALUES(latitude), 
  longitude=VALUES(longitude), 
  district=VALUES(district);"""
            
            sql_statements.append(sql)
    
    print(f"\n[SUMMARY] Total locations to insert: {total_locations}")
    return "\n".join(sql_statements)

def fetch_all_states():
    """Fetch locations from all configured states"""
    all_locations = {}
    
    print("[STARTING MULTI-STATE LOCATION FETCH]")
    print("=" * 80)
    print(f"Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("\nFetching from states:")
    for state, config in STATES.items():
        print(f"  • {config['description']}")
    print("\n" + "=" * 80)
    
    for state, config in sorted(STATES.items(), key=lambda x: x[1]["priority"]):
        print(f"\n[{state.upper()}] {config['description']}")
        print("-" * 80)
        
        try:
            # Build and execute query
            query = build_overpass_query(config["bbox"], config["priority"])
            overpass_data = query_overpass(query, state)
            
            if overpass_data:
                locations = extract_locations(overpass_data, state, config["priority"])
                all_locations[state] = locations
                print(f"✓ Successfully fetched {len(locations)} locations from {state}")
            else:
                print(f"✗ Failed to fetch locations from {state}")
                all_locations[state] = []
            
            # Rate limiting: delay between state queries
            if state != list(STATES.keys())[-1]:  # Don't delay after last state
                print(f"  [RATE LIMITING] Waiting {DELAY_BETWEEN_STATES}s before next state...")
                time.sleep(DELAY_BETWEEN_STATES)
        
        except Exception as e:
            print(f"✗ Error processing {state}: {e}")
            all_locations[state] = []
    
    return all_locations

def main():
    """Main execution"""
    print("\n" + "=" * 80)
    print("MULTI-STATE BUS ROUTE LOCATION FETCHER")
    print("Tamil Nadu + Neighboring States (Kerala, Karnataka, Andhra Pradesh)")
    print("=" * 80 + "\n")
    
    # Fetch locations from all states
    all_locations = fetch_all_states()
    
    # Generate SQL
    sql_output = generate_sql_inserts(all_locations)
    
    # Output results
    output_file = "multistate_locations.sql"
    with open(output_file, "w") as f:
        f.write("-- Multi-State Location Data for Bus Routes\n")
        f.write(f"-- Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        f.write("-- Source: Overpass API (OpenStreetMap)\n\n")
        f.write(sql_output)
    
    print(f"\n✓ SQL file generated: {output_file}")
    
    # Summary statistics
    total_locations = sum(len(locs) for locs in all_locations.values())
    print(f"\n[FINAL SUMMARY]")
    print(f"Total locations fetched: {total_locations}")
    for state, locations in all_locations.items():
        print(f"  • {state:20s}: {len(locations):5d} locations")
    
    print("\n[NEXT STEPS]")
    print("1. Review the generated SQL file: multistate_locations.sql")
    print("2. Execute SQL in database:")
    print(f"   mysql -u root -p perundhu < {output_file}")
    print("3. Commit SQL file as new Flyway migration (V57__add_multistate_locations.sql)")
    
    return 0

if __name__ == "__main__":
    sys.exit(main())
