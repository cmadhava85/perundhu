#!/usr/bin/env python3
"""
Normalize Locations Script
1. Deduplicate redundant location names (same place, different naming)
2. Set parent-child relationships for cities and their terminals
3. Update bus routes to use canonical location IDs
"""

import os
import re
import mysql.connector
from collections import defaultdict

# Major cities in Tamil Nadu with their known terminals
# Format: 'City Name': { 'terminals': [...], 'variations': [...] }
CITY_TERMINALS = {
    'Chennai': {
        'terminals': ['CMBT', 'Koyambedu', 'Kilambakkam', 'Broadway', 'Tambaram', 'Guindy', 'KCBT', 'Mofussil'],
        'patterns': ['M.G.R Koyambedu', 'MGR']
    },
    'Madurai': {
        'terminals': ['Mattuthavani', 'Periyar', 'Arapalayam'],
        'patterns': ['M.G.R Mattuthavani']
    },
    'Coimbatore': {
        'terminals': ['Gandhipuram', 'Ukkadam', 'Singanallur', 'Town Hall'],
        'patterns': []
    },
    'Trichy': {
        'terminals': ['Central', 'Chatram', 'Srirangam'],
        'patterns': ['Tiruchirappalli']
    },
    'Salem': {
        'terminals': ['New Bus Stand', 'Old Bus Stand', 'Town Bus Stand'],
        'patterns': ['Dr. MGR Central']
    },
    'Tirunelveli': {
        'terminals': ['New Bus Stand', 'Old Bus Stand', 'Junction'],
        'patterns': []
    },
    'Erode': {
        'terminals': ['New Bus Stand', 'Old Bus Stand', 'Perundurai'],
        'patterns': []
    },
    'Vellore': {
        'terminals': ['New Bus Stand', 'Old Bus Stand', 'CMC'],
        'patterns': []
    },
    'Tiruppur': {
        'terminals': ['New Bus Stand', 'Old Bus Stand'],
        'patterns': []
    },
    'Dindigul': {
        'terminals': ['New Bus Stand', 'Old Bus Stand'],
        'patterns': []
    },
    'Thanjavur': {
        'terminals': ['New Bus Stand', 'Old Bus Stand'],
        'patterns': []
    },
    'Cuddalore': {
        'terminals': ['New Bus Stand', 'Old Bus Stand'],
        'patterns': []
    },
    'Villupuram': {
        'terminals': ['New Bus Stand', 'Old Bus Stand'],
        'patterns': []
    },
    'Kumbakonam': {
        'terminals': ['New Bus Stand', 'Old Bus Stand'],
        'patterns': []
    },
    'Nagercoil': {
        'terminals': ['New Bus Stand', 'Old Bus Stand'],
        'patterns': []
    },
    'Thoothukudi': {
        'terminals': ['New Bus Stand', 'Old Bus Stand'],
        'patterns': []
    }
}

# Explicit terminal to city ID mappings (for terminals without city name in their name)
# These are terminals that don't follow the "City - Terminal" pattern
EXPLICIT_TERMINAL_MAPPINGS = {
    1: [  # Chennai
        (865, 'Broadway Bus Terminus'),
        (473, 'Guindy Bus Stand'),
        (94343, 'Guindy Bus Stand'),
        (731, 'Koyambedu Mofussil Bus Terminal'),
        (94590, 'Koyambedu Mofussil Bus Terminal'),
        (1448, 'Koyambedu Omni Bus Station'),
        (251, 'Tambaram'),
        (94036, 'Tambaram'),
        (165672, 'KCBT KILAMBAKKAM'),
        (165605, 'BROADWAY'),
        (94134, 'Chennai - Broadway'),
        (165620, 'Chennai - CMBT (Koyambedu)'),
        (94131, 'Chennai - Tambaram'),
    ],
    3: [  # Madurai
        (852, 'Madurai - Mattuthavani'),
        (165720, 'Madurai - Mattuthavani'),
        (853, 'Madurai - Periyar'),
        (94139, 'Madurai - Arapalayam'),
    ],
    125070: [  # Coimbatore
        (1143, 'Gandhipuram Central Bus Stand'),
        (881, 'Gandhipuram Town Bus Stand'),
        (94135, 'Coimbatore - Gandhipuram'),
        (94136, 'Coimbatore - Ukkadam'),
        (839, 'Ukkadam Bus Stand'),
        (94692, 'Ukkadam Bus Stand'),
    ]
}

# Patterns to identify bus stand variants
BUS_STAND_PATTERNS = [
    r'^(.+?)\s*[-–]\s*(.+)$',          # "City - Terminal"
    r'^(.+?)\s+(?:BS|B\.S\.?)$',        # "Terminal BS"
    r'^(.+?)\s+Bus\s*Stand',            # "Terminal Bus Stand"
    r'^M\.?G\.?R\.?\s+(.+)$',            # "M.G.R Terminal"
    r'^(.+?)\s+New\s+Bus\s+Stand',      # "City New Bus Stand"
    r'^(.+?)\s+Old\s+Bus\s+Stand',      # "City Old Bus Stand"
]


def get_db_connection(environment='preprod'):
    """Get database connection for specified environment"""
    env_suffix = environment.upper()
    defaults = {
        'PREPROD': {'host': '127.0.0.1', 'port': '3307'},
        'PROD': {'host': '127.0.0.1', 'port': '3308'}
    }
    return mysql.connector.connect(
        host=os.getenv(f'DB_HOST_{env_suffix}', defaults.get(env_suffix, defaults['PREPROD'])['host']),
        port=int(os.getenv(f'DB_PORT_{env_suffix}', defaults.get(env_suffix, defaults['PREPROD'])['port'])),
        user=os.getenv(f'DB_USER_{env_suffix}', 'perundhu_user'),
        password=os.getenv(f'DB_PASSWORD_{env_suffix}'),
        database=os.getenv(f'DB_NAME_{env_suffix}', 'perundhu')
    )


def normalize_name(name):
    """Normalize location name for comparison"""
    # Remove common suffixes and normalize
    normalized = name.upper().strip()
    normalized = re.sub(r'\s+', ' ', normalized)
    normalized = re.sub(r'[-–]', ' ', normalized)
    normalized = re.sub(r'\s*(BS|B\.S\.?|BUS\s*STAND)\s*$', '', normalized, flags=re.IGNORECASE)
    normalized = re.sub(r'^M\.?G\.?R\.?\s*', '', normalized)
    return normalized.strip()


def find_duplicates(cursor):
    """Find potential duplicate locations"""
    cursor.execute("""
        SELECT id, name, latitude, longitude, district, location_type, parent_id
        FROM locations
        ORDER BY name
    """)
    
    locations = cursor.fetchall()
    print(f"📍 Total locations: {len(locations)}")
    
    # Group by normalized name
    groups = defaultdict(list)
    for loc in locations:
        loc_id, name, lat, lng, district, loc_type, parent_id = loc
        normalized = normalize_name(name)
        groups[normalized].append({
            'id': loc_id,
            'name': name,
            'lat': lat,
            'lng': lng,
            'district': district,
            'type': loc_type,
            'parent_id': parent_id
        })
    
    # Find groups with duplicates
    duplicates = {k: v for k, v in groups.items() if len(v) > 1}
    print(f"🔄 Found {len(duplicates)} groups with potential duplicates")
    
    return duplicates


def find_city_terminal_candidates(cursor):
    """Find city -> terminal relationships"""
    relationships = []
    seen_children = set()  # Avoid duplicates
    
    # First, add explicit terminal mappings (these are known stations)
    print("\n--- Adding explicit terminal mappings ---")
    for city_id, terminals in EXPLICIT_TERMINAL_MAPPINGS.items():
        # Get city name
        cursor.execute("SELECT name FROM locations WHERE id = %s", (city_id,))
        city_row = cursor.fetchone()
        if not city_row:
            print(f"⚠️  City ID {city_id} not found")
            continue
        city_name = city_row[0]
        print(f"\n🏙️  {city_name} (ID: {city_id})")
        
        for term_id, term_name in terminals:
            # Check if terminal exists and doesn't already have this parent
            cursor.execute("SELECT parent_id FROM locations WHERE id = %s", (term_id,))
            term_row = cursor.fetchone()
            if not term_row:
                print(f"  ⚠️  Terminal ID {term_id} not found: {term_name}")
                continue
            
            if term_id not in seen_children:
                seen_children.add(term_id)
                relationships.append({
                    'child_id': term_id,
                    'child_name': term_name,
                    'parent_id': city_id,
                    'parent_name': city_name,
                    'current_parent': term_row[0]
                })
                print(f"  📌 {term_name} (ID: {term_id}) → child of {city_name}")
    
    # Then, find additional terminals by pattern matching
    print("\n--- Finding additional terminals by pattern ---")
    for city, config in CITY_TERMINALS.items():
        terminals = config['terminals']
        patterns = config.get('patterns', [])
        
        # Find the city location - must be exact match or simple city name
        cursor.execute("""
            SELECT id, name, location_type FROM locations 
            WHERE (UPPER(name) = %s OR name = %s)
            AND (location_type = 'CITY' OR location_type IS NULL)
            AND parent_id IS NULL
            ORDER BY 
                CASE WHEN UPPER(name) = %s THEN 0 ELSE 1 END,
                id ASC
            LIMIT 1
        """, (city.upper(), city, city.upper()))
        
        city_row = cursor.fetchone()
        if not city_row:
            # Try broader search for the city
            cursor.execute("""
                SELECT id, name, location_type FROM locations 
                WHERE name = %s
                ORDER BY id ASC
                LIMIT 1
            """, (city,))
            city_row = cursor.fetchone()
        
        if not city_row:
            continue
        
        city_id, city_name, city_type = city_row
        
        # Find terminal locations that contain city name + terminal name
        all_patterns = terminals + patterns
        for terminal in all_patterns:
            # Must contain BOTH city name AND terminal name (or be "City - Terminal" format)
            cursor.execute("""
                SELECT id, name, parent_id FROM locations 
                WHERE (
                    (LOWER(name) LIKE %s AND LOWER(name) LIKE %s)
                    OR LOWER(name) LIKE %s
                    OR LOWER(name) LIKE %s
                )
                AND id != %s
                AND parent_id IS NULL
            """, (
                f"%{city.lower()}%", 
                f"%{terminal.lower()}%",
                f"{city.lower()} - {terminal.lower()}%",
                f"{city.lower()} {terminal.lower()}%",
                city_id
            ))
            
            for row in cursor.fetchall():
                term_id, term_name, parent_id = row
                
                # Skip if already processed or if name is just the city
                if term_id in seen_children:
                    continue
                if term_name.upper() == city.upper():
                    continue
                    
                seen_children.add(term_id)
                relationships.append({
                    'child_id': term_id,
                    'child_name': term_name,
                    'parent_id': city_id,
                    'parent_name': city_name,
                    'current_parent': parent_id
                })
                print(f"  📌 {term_name} (ID: {term_id}) → child of {city_name}")
        
        # Also find locations with format "City - Something" or "City Something BS"
        cursor.execute("""
            SELECT id, name, parent_id FROM locations 
            WHERE (
                name LIKE %s 
                OR name LIKE %s
                OR name LIKE %s
            )
            AND id != %s
            AND parent_id IS NULL
            AND name NOT LIKE %s
        """, (
            f"{city} - %",
            f"{city} %Bus Stand%",
            f"% {city}",  # "Something , City" format
            city_id,
            f"%TNSTC%"  # Exclude depot names
        ))
        
        for row in cursor.fetchall():
            term_id, term_name, parent_id = row
            if term_id not in seen_children and term_name.upper() != city.upper():
                seen_children.add(term_id)
                relationships.append({
                    'child_id': term_id,
                    'child_name': term_name,
                    'parent_id': city_id,
                    'parent_name': city_name,
                    'current_parent': parent_id
                })
                print(f"  📌 {term_name} (ID: {term_id}) → child of {city_name}")
    
    return relationships


def merge_duplicates(cursor, conn, duplicates, dry_run=True):
    """Merge duplicate locations"""
    merged_count = 0
    
    for normalized, locs in duplicates.items():
        if len(locs) < 2:
            continue
        
        # Choose canonical: prefer longer name, or one with coordinates
        canonical = max(locs, key=lambda x: (
            x['lat'] is not None,  # Prefer with coordinates
            len(x['name']),        # Prefer longer name
            -x['id']               # Prefer lower ID (older)
        ))
        
        duplicates_to_merge = [l for l in locs if l['id'] != canonical['id']]
        
        if not duplicates_to_merge:
            continue
            
        print(f"\n🔀 Merge group: {normalized}")
        print(f"   Canonical: {canonical['name']} (ID: {canonical['id']})")
        
        for dup in duplicates_to_merge:
            print(f"   Duplicate: {dup['name']} (ID: {dup['id']}) → merge into {canonical['id']}")
            
            if not dry_run:
                # Update bus routes to use canonical location
                cursor.execute("""
                    UPDATE buses SET from_location_id = %s 
                    WHERE from_location_id = %s
                """, (canonical['id'], dup['id']))
                
                cursor.execute("""
                    UPDATE buses SET to_location_id = %s 
                    WHERE to_location_id = %s
                """, (canonical['id'], dup['id']))
                
                # Update stops
                cursor.execute("""
                    UPDATE stops SET location_id = %s 
                    WHERE location_id = %s
                """, (canonical['id'], dup['id']))
                
                # Delete duplicate location
                cursor.execute("DELETE FROM locations WHERE id = %s", (dup['id'],))
                
                merged_count += 1
        
        if not dry_run:
            conn.commit()
    
    return merged_count


def set_parent_relationships(cursor, conn, relationships, dry_run=True):
    """Set parent-child relationships"""
    updated_count = 0
    
    for rel in relationships:
        print(f"🔗 {rel['child_name']} → parent: {rel['parent_name']}")
        
        if not dry_run:
            cursor.execute("""
                UPDATE locations 
                SET parent_id = %s, location_type = 'TERMINAL'
                WHERE id = %s
            """, (rel['parent_id'], rel['child_id']))
            updated_count += 1
    
    if not dry_run:
        # Ensure parent cities are marked as CITY type
        # MySQL doesn't allow UPDATE with subquery on same table, so use temp table approach
        cursor.execute("""
            CREATE TEMPORARY TABLE temp_parent_ids AS 
            SELECT DISTINCT parent_id FROM locations WHERE parent_id IS NOT NULL
        """)
        cursor.execute("""
            UPDATE locations SET location_type = 'CITY' 
            WHERE id IN (SELECT parent_id FROM temp_parent_ids)
        """)
        cursor.execute("DROP TEMPORARY TABLE temp_parent_ids")
        conn.commit()
    
    return updated_count


def main():
    import argparse
    parser = argparse.ArgumentParser(description='Normalize locations')
    parser.add_argument('--environment', '-e', choices=['preprod', 'prod'], default='preprod',
                        help='Target environment (default: preprod)')
    parser.add_argument('--dry-run', action='store_true', default=True,
                        help='Show what would be done without making changes')
    parser.add_argument('--execute', action='store_true',
                        help='Actually execute changes')
    parser.add_argument('--skip-merge', action='store_true',
                        help='Skip merging duplicates')
    parser.add_argument('--skip-parents', action='store_true',
                        help='Skip setting parent relationships')
    args = parser.parse_args()
    
    dry_run = not args.execute
    
    print(f"🎯 Target Environment: {args.environment.upper()}")
    
    if dry_run:
        print("=" * 60)
        print("🔍 DRY RUN MODE - No changes will be made")
        print("   Run with --execute to apply changes")
        print("=" * 60)
    else:
        print("=" * 60)
        print("⚠️  EXECUTE MODE - Changes will be applied!")
        print("=" * 60)
    
    conn = get_db_connection(args.environment)
    cursor = conn.cursor()
    print(f"✅ Connected to {args.environment.upper()} database")
    
    try:
        # Step 1: Find and merge duplicates
        if not args.skip_merge:
            print("\n" + "=" * 60)
            print("STEP 1: Finding duplicate locations...")
            print("=" * 60)
            duplicates = find_duplicates(cursor)
            
            # Show sample duplicates
            sample_count = 0
            for norm, locs in list(duplicates.items())[:10]:
                print(f"\n  {norm}:")
                for loc in locs:
                    print(f"    - {loc['name']} (ID: {loc['id']}, Type: {loc['type']})")
                sample_count += 1
            
            if len(duplicates) > 10:
                print(f"\n  ... and {len(duplicates) - 10} more groups")
        
        # Step 2: Set parent relationships
        if not args.skip_parents:
            print("\n" + "=" * 60)
            print("STEP 2: Finding city-terminal relationships...")
            print("=" * 60)
            relationships = find_city_terminal_candidates(cursor)
            
            print(f"\n📊 Found {len(relationships)} potential parent-child relationships")
            
            if not dry_run:
                updated = set_parent_relationships(cursor, conn, relationships, dry_run=False)
                print(f"\n✅ Updated {updated} parent-child relationships")
        
        # Step 3: Apply duplicate merges (careful - this modifies data)
        if not args.skip_merge and not dry_run:
            print("\n" + "=" * 60)
            print("STEP 3: Merging duplicates...")
            print("=" * 60)
            # Only merge if explicitly confirmed
            confirm = input("⚠️  This will merge duplicate locations. Type 'yes' to confirm: ")
            if confirm.lower() == 'yes':
                merged = merge_duplicates(cursor, conn, duplicates, dry_run=False)
                print(f"\n✅ Merged {merged} duplicate locations")
            else:
                print("❌ Merge cancelled")
        
        print("\n" + "=" * 60)
        print("Done!")
        print("=" * 60)
        
    finally:
        cursor.close()
        conn.close()


if __name__ == '__main__':
    main()
