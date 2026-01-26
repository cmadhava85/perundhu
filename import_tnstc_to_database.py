#!/usr/bin/env python3
"""
Import TNSTC data into the database with proper location mapping.
This script handles the naming mismatch between MTC and TNSTC location names.
"""

import json
import os
import sys
from pathlib import Path
import mysql.connector
from mysql.connector import Error

# Location mapping: TNSTC city names -> Database location names
# Maps TNSTC city names to the primary/main bus terminal in the database
# NOTE: MTC data is ONLY within Chennai (local buses), so we use proper Chennai locations
LOCATION_MAPPING = {
    # Inter-state/Long-distance termini (TNSTC)
    
    # KILAMBAKKAM - Specific terminal in KLIA area
    "KILAMBAKKAM": "KCBT KILAMBAKKAM",          # Terminal for airport routes
    
    # MADURAI - Main TNSTC terminal in Madurai
    "MADURAI": "Madurai - Mattuthavani",         # Main TNSTC terminal
    "MADURAI MATTUTHAVANI": "Madurai - Mattuthavani",
    
    # CHENNAI - Use Chennai Mofussil Bus Terminus (main TNSTC terminal)
    # Note: MTC uses local Chennai locations (BROADWAY, M.G.R.KOYAMBEDU, etc.)
    # TNSTC uses the main inter-state terminal: Chennai Mofussil Bus Terminus (691)
    "CHENNAI": "Chennai Mofussil Bus Terminus",  # Main TNSTC inter-state terminal
    
    # Other major inter-state cities
    "COIMBATORE": "COIMBATORE",
    "SALEM": "SALEM",
    "ERODE": "ERODE",
    "DHARMAPURI": "DHARMAPURI",
    "KRISHNAGIRI": "KRISHNAGIRI",
    "KANYAKUMARI": "KANYAKUMARI",
    "NAGERCOIL": "NAGERCOIL",
    "ARIYALUR": "ARIYALUR",
    "TIRUVANNAMALAI": "TIRUVANNAMALAI",
    "CUDDALORE": "CUDDALORE",
    "DINDIGUL": "DINDIGUL",
    "TIRUNELVELI": "TIRUNELVELI",
    "VIRUDUNAGAR": "VIRUDUNAGAR",
    "THOOTHUKUDI": "THOOTHUKUDI",
    "PERAMBALUR": "PERAMBALUR",
    "BENGALURU": "BENGALURU",
    "HOSUR": "HOSUR",
    "KALLAKURICHI": "KALLAKURICHI",
}

# Special handling for complex TNSTC stop names
STOP_LOCATION_MAPPING = {
    "CHENNAI-KILAMBAKKAM-KCBT": "KCBT KILAMBAKKAM",
    "CHENNAI": "BROADWAY",
    "KILAMBAKKAM": "KCBT KILAMBAKKAM",
}


def get_db_connection():
    """Create database connection."""
    try:
        connection = mysql.connector.connect(
            host=os.getenv('DB_HOST', 'localhost'),
            user=os.getenv('DB_USER', 'root'),
            password=os.getenv('DB_PASSWORD', 'root'),
            database=os.getenv('DB_NAME', 'perundhu'),
            port=int(os.getenv('DB_PORT', '3306'))
        )
        return connection
    except Error as e:
        print(f"❌ Database connection error: {e}")
        sys.exit(1)


def get_location_id(connection, location_name):
    """
    Get location ID from database using location name.
    
    Enhanced with alias support - handles name variations automatically.
    Priority: 1) Exact name match, 2) Alias match, 3) Partial name match, 4) Partial alias match
    """
    cursor = connection.cursor()
    try:
        # First try exact match on location name
        cursor.execute(
            "SELECT id FROM locations WHERE UPPER(name) = UPPER(%s) LIMIT 1",
            (location_name,)
        )
        result = cursor.fetchone()
        if result:
            return result[0]
        
        # Try exact match on alias (handles: "BROADWAY" → "Broadway Bus Terminus")
        cursor.execute("""
            SELECT location_id FROM location_aliases 
            WHERE UPPER(alias_name) = UPPER(%s) 
            LIMIT 1
        """, (location_name,))
        result = cursor.fetchone()
        if result:
            return result[0]
        
        # Try partial match on location name if exact match fails
        cursor.execute(
            "SELECT id FROM locations WHERE UPPER(name) LIKE UPPER(%s) LIMIT 1",
            (f"%{location_name}%",)
        )
        result = cursor.fetchone()
        if result:
            return result[0]
        
        # Try partial match on alias
        cursor.execute("""
            SELECT location_id FROM location_aliases 
            WHERE UPPER(alias_name) LIKE UPPER(%s) 
            LIMIT 1
        """, (f"%{location_name}%",))
        result = cursor.fetchone()
        if result:
            return result[0]
        
        return None
    finally:
        cursor.close()


def normalize_location_name(tnstc_name):
    """Normalize TNSTC location name to database format."""
    if not tnstc_name:
        return None
    
    tnstc_name = tnstc_name.strip().upper()
    
    # Check direct mapping
    for tnstc_key, db_name in LOCATION_MAPPING.items():
        if tnstc_name == tnstc_key.upper():
            return db_name
    
    # Check if it contains any mapped key
    for tnstc_key, db_name in LOCATION_MAPPING.items():
        if tnstc_key.upper() in tnstc_name:
            return db_name
    
    # If no mapping found, return original (uppercase)
    return tnstc_name


def resolve_location_from_stop(stop_info):
    """
    Extract location from TNSTC stop information.
    This is MORE ACCURATE than using origin/destination city names
    because TNSTC stops contain detailed terminal information.
    
    IMPORTANT: MTC data is ONLY for Chennai local buses.
    TNSTC data is for inter-state routes with detailed stops.
    
    Example: stop_info = {
        "city": "CHENNAI-KILAMBAKKAM-KCBT",
        "landmark": "KCBT",
        "time": "14:40"
    }
    """
    if not stop_info:
        return None
    
    city = stop_info.get('city', '').strip().upper()
    landmark = stop_info.get('landmark', '').strip().upper()
    
    # Extract location from complex city names like "CHENNAI-KILAMBAKKAM-KCBT"
    # These contain the actual terminal name
    
    if 'KILAMBAKKAM' in city:
        return "KCBT KILAMBAKKAM"
    elif 'MADURAI' in city:
        # Check landmark to determine which Madurai terminal
        if 'MATTUTHAVANI' in landmark or 'MATTUTHAVANI' in city:
            return "Madurai - Mattuthavani"
        elif 'ARAPALAYAM' in landmark or 'ARAPPALAYAM' in landmark:
            return "Madurai - Arappalayam"
        else:
            return "Madurai - Mattuthavani"  # Default to main terminal
    elif 'BROADWAY' in city or 'KOYAMBEDU' in city or 'CBEE' in city or 'MOFUSSIL' in city or 'CMBT' in city:
        # For Chennai stops, use the main TNSTC terminal (Chennai Mofussil Bus Terminus)
        # not local MTC terminals like BROADWAY
        return "Chennai Mofussil Bus Terminus"
    elif 'ARIYALUR' in city:
        return "ARIYALUR"
    elif 'COIMBATORE' in city:
        return "COIMBATORE"
    elif 'SALEM' in city:
        return "SALEM"
    elif 'ERODE' in city:
        return "ERODE"
    elif 'DHARMAPURI' in city:
        return "DHARMAPURI"
    elif 'KRISHNAGIRI' in city:
        return "KRISHNAGIRI"
    elif 'KANYAKUMARI' in city:
        return "KANYAKUMARI"
    elif 'NAGERCOIL' in city:
        return "NAGERCOIL"
    elif 'TIRUVANNAMALAI' in city:
        return "TIRUVANNAMALAI"
    elif 'CUDDALORE' in city:
        return "CUDDALORE"
    elif 'DINDIGUL' in city:
        return "DINDIGUL"
    elif 'TIRUNELVELI' in city:
        return "TIRUNELVELI"
    elif 'VIRUDUNAGAR' in city:
        return "VIRUDUNAGAR"
    elif 'THOOTHUKUDI' in city:
        return "THOOTHUKUDI"
    elif 'PERAMBALUR' in city:
        return "PERAMBALUR"
    elif 'BENGALURU' in city:
        return "BENGALURU"
    elif 'HOSUR' in city:
        return "HOSUR"
    elif 'KALLAKURICHI' in city:
        return "KALLAKURICHI"
    
    # If no specific terminal found, try generic city name mapping
    return normalize_location_name(city)


def import_tnstc_to_database(connection, limit=None):
    """Import TNSTC data to database with location mapping from stops field."""
    
    # Load TNSTC consolidated data
    tnstc_file = Path(__file__).parent / 'data' / 'tnstc_consolidated.json'
    
    if not tnstc_file.exists():
        print(f"❌ TNSTC file not found: {tnstc_file}")
        return
    
    print(f"📖 Loading TNSTC data from {tnstc_file.name}...")
    with open(tnstc_file, 'r', encoding='utf-8') as f:
        tnstc_data = json.load(f)
    
    buses = tnstc_data['routes']
    if limit:
        buses = buses[:limit]
    
    print(f"📊 Total TNSTC buses to import: {len(buses)}")
    
    # Statistics
    imported = 0
    skipped = 0
    failed = 0
    location_mapping_failures = []
    
    cursor = connection.cursor()
    
    try:
        for idx, bus in enumerate(buses):
            try:
                # Get stops from TNSTC data (more accurate than origin/destination)
                stops = bus.get('stops', [])
                
                if len(stops) < 2:
                    # Need at least origin and destination stops
                    skipped += 1
                    continue
                
                # Use first stop as origin, last stop as destination
                origin_stop = stops[0]
                destination_stop = stops[-1]
                
                # Resolve actual location names from stops
                origin_name = resolve_location_from_stop(origin_stop)
                destination_name = resolve_location_from_stop(destination_stop)
                
                # Get location IDs from database
                origin_id = get_location_id(connection, origin_name)
                destination_id = get_location_id(connection, destination_name)
                
                if not origin_id or not destination_id:
                    location_mapping_failures.append({
                        'bus': bus.get('route_number'),
                        'origin_stop': origin_stop,
                        'origin_name': origin_name,
                        'origin_id': origin_id,
                        'destination_stop': destination_stop,
                        'destination_name': destination_name,
                        'destination_id': destination_id,
                    })
                    skipped += 1
                    continue
                
                # Check if bus already exists (by service_code or route combination)
                service_code = bus.get('service_code', '')
                cursor.execute(
                    "SELECT id FROM buses WHERE service_code = %s LIMIT 1",
                    (service_code,) if service_code else (None,)
                )
                
                if cursor.fetchone():
                    skipped += 1
                    continue
                
                # Insert bus record
                cursor.execute("""
                    INSERT INTO buses (
                        bus_number, name, from_location_id, to_location_id,
                        departure_time, arrival_time, capacity, category,
                        active, service_code, source
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, (
                    bus.get('route_number', ''),
                    bus.get('busName', 'TNSTC'),
                    origin_id,
                    destination_id,
                    bus.get('departure_time', ''),
                    bus.get('arrival_time', ''),
                    int(bus.get('available_seats', '0').split()[0]) if bus.get('available_seats') else 0,
                    bus.get('bus_type', 'Standard'),
                    1,  # active
                    service_code,
                    'TNSTC'
                ))
                
                imported += 1
                
                if (idx + 1) % 100 == 0:
                    print(f"  ✓ Processed {idx + 1}/{len(buses)} buses...")
                    connection.commit()
                
            except Exception as e:
                print(f"  ❌ Error importing bus {idx}: {e}")
                failed += 1
        
        # Final commit
        connection.commit()
        print(f"\n✅ Import Complete!")
        print(f"   📊 Statistics:")
        print(f"      • Imported: {imported}")
        print(f"      • Skipped (duplicate): {skipped}")
        print(f"      • Failed: {failed}")
        
        if location_mapping_failures:
            print(f"\n⚠️  Location Mapping Failures ({len(location_mapping_failures)}):")
            for failure in location_mapping_failures[:10]:
                print(f"      • {failure['bus']}: {failure['origin_name']} -> {failure['destination_name']}")
            if len(location_mapping_failures) > 10:
                print(f"      ... and {len(location_mapping_failures) - 10} more")
        
    finally:
        cursor.close()


def create_location_mapping_report(connection):
    """Generate a report of which locations are missing from the database."""
    
    tnstc_file = Path(__file__).parent / 'data' / 'tnstc_consolidated.json'
    with open(tnstc_file, 'r', encoding='utf-8') as f:
        tnstc_data = json.load(f)
    
    tnstc_locations = set()
    for bus in tnstc_data['routes']:
        tnstc_locations.add(bus.get('origin', ''))
        tnstc_locations.add(bus.get('destination', ''))
    
    print("\n" + "="*60)
    print("Location Mapping Report")
    print("="*60)
    
    cursor = connection.cursor()
    
    for tnstc_loc in sorted(tnstc_locations):
        normalized = normalize_location_name(tnstc_loc)
        location_id = get_location_id(connection, normalized)
        
        status = "✅" if location_id else "❌"
        print(f"{status} TNSTC: {tnstc_loc:30} -> DB: {normalized:30} (ID: {location_id})")
    
    cursor.close()


if __name__ == '__main__':
    print("🚀 TNSTC Data Import with Location Mapping")
    print("="*60)
    
    connection = get_db_connection()
    
    try:
        # Generate mapping report first
        create_location_mapping_report(connection)
        
        # Then import the data
        print("\n" + "="*60)
        print("Starting Data Import...")
        print("="*60)
        import_tnstc_to_database(connection, limit=None)
        
    finally:
        connection.close()
