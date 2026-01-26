#!/usr/bin/env python3
"""
Setup Location Hierarchy - Parent-Child Relationships

This script establishes hierarchical relationships between locations:
- CITY level: Chennai, Madurai, Coimbatore, etc.
- TERMINAL level: CMBT, KCBT, Madhavaram (children of Chennai city)

Purpose: Enable users to search "Chennai to Madurai" and get buses from 
ALL Chennai terminals (CMBT, KCBT, Madhavaram, etc.)
"""

import mysql.connector
import os
import sys
from typing import Dict, List, Tuple, Optional
import re

# Database connection settings
DB_CONFIG = {
    'host': os.getenv('DB_HOST', '127.0.0.1'),
    'port': int(os.getenv('DB_PORT', '3306')),
    'user': os.getenv('DB_USER', 'root'),
    'password': os.getenv('DB_PASSWORD', ''),
    'database': os.getenv('DB_NAME', 'perundhu')
}

# Seed mappings for key cities (used in addition to auto-detection)
# Format: {parent_location_name: [list of child terminal patterns]}
LOCATION_HIERARCHY: Dict[str, List[str]] = {
    'Chennai': [
        'Chennai - CMBT',
        'Chennai - CMBT (Koyambedu)',
        'KCBT KILAMBAKKAM',
        'Chennai - Kilambakkam',
        'Chennai Tambaram',
        'Chennai - Tambaram',
        'Chennai Airport',
        'Chennai - Airport',
        'Chennai Kalaignar CBT',
        'Chennai - Kalaignar CBT',
        'Chennai Madhavaram',
        'Chennai - Madhavaram',
        'Chennai Poonamallee',
        'Chennai - Poonamallee',
    ],
    'Madurai': [
        'Madurai - Mattuthavani',
        'Madurai Mattuthavani',
        'Madurai - Periyar',
        'Madurai Periyar',
        'Madurai - Arapalayam',
        'Madurai Arapalayam',
        'Madurai Central Bus Stand',
    ],
    'Coimbatore': [
        'Coimbatore - Gandhipuram',
        'Gandhipuram',
        'Coimbatore - Singanallur',
        'Singanallur',
        'Coimbatore - Ukkadam',
        'Ukkadam',
        'Coimbatore - Town Bus Stand',
    ],
    'Tiruchirappalli': [
        'Trichy - Central Bus Stand',
        'Tiruchirapalli - Central Bus Stand',
        'Tiruchirappalli - Central Bus Stand',
        'Trichy - Chatram Bus Stand',
        'Tiruchirapalli - Chatram Bus Stand',
        'Tiruchirappalli - Chatram Bus Stand',
    ],
    'Salem': [
        'Salem - New Bus Stand',
        'Salem - Old Bus Stand',
        'Salem - Town Bus Stand',
    ],
    'Vellore': [
        'Vellore - New Bus Stand',
        'Vellore - Old Bus Stand',
    ],
    'Tirunelveli': [
        'Tirunelveli - New Bus Stand',
        'Tirunelveli Junction',
    ],
    'Erode': [
        'Erode - Central Bus Terminus',
        'Erode - Mofussil Bus Stand',
    ],
    'Tiruppur': [
        'Tiruppur - New Bus Stand',
        'Tiruppur - Old Bus Stand',
    ],
    'Nagercoil': [
        'Nagercoil - Vadasery Bus Stand',
        'Nagercoil - Anna Bus Stand',
    ],
    'Thanjavur': [
        'Thanjavur - New Bus Stand',
        'Thanjavur - Old Bus Stand',
    ],
    'Dindigul': [
        'Dindigul - Central Bus Stand',
    ],
}

# Common terminal keywords to detect specific stands/termini
TERMINAL_KEYWORDS = [
    'bus stand', 'bus terminus', 'terminus', 'cbs', 'central bus stand',
    'new bus stand', 'old bus stand', 'mofussil', 'cbt', 'c b t', 'depot', 'mattuthavani',
]


def get_connection():
    """Create database connection."""
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        return conn
    except mysql.connector.Error as e:
        print(f"❌ Database connection failed: {e}")
        sys.exit(1)


def find_location_id(cursor, location_name: str) -> Optional[int]:
    """Find location ID by name (exact or LIKE match)."""
    # Try exact match first
    cursor.execute("SELECT id FROM locations WHERE name = %s", (location_name,))
    result = cursor.fetchone()
    if result:
        return result[0] if not isinstance(result, dict) else result.get('id')
    
    # Try LIKE match
    cursor.execute("SELECT id FROM locations WHERE name LIKE %s", (f"%{location_name}%",))
    result = cursor.fetchone()
    if result:
        return result[0] if not isinstance(result, dict) else result.get('id')
    
    return None


def load_all_locations(cursor) -> List[Dict]:
    cursor.execute("SELECT id, name, COALESCE(location_type, '') as location_type, COALESCE(parent_id, 0) as parent_id FROM locations")
    return cursor.fetchall()


def normalize_name(name: str) -> str:
    return re.sub(r"\s+", " ", name.strip()).lower()


def guess_parent_from_name(name: str, all_names_set: set) -> Optional[str]:
    # Case 1: "City - Something"
    m = re.match(r"^\s*([^\-]+?)\s*-\s*(.+)$", name, flags=re.IGNORECASE)
    if m:
        candidate = m.group(1).strip()
        # Try direct presence
        if normalize_name(candidate) in all_names_set:
            return candidate
    
    # Case 2: "City Central Bus Stand" (no hyphen)
    lower = name.lower()
    if any(k in lower for k in TERMINAL_KEYWORDS):
        # Try progressive token shrink from left
        tokens = name.split()
        for i in range(len(tokens), 0, -1):
            candidate = " ".join(tokens[:i]).strip()
            if normalize_name(candidate) in all_names_set:
                return candidate
        # Try first token only (common for single-word cities)
        if tokens:
            cand = tokens[0].strip()
            if normalize_name(cand) in all_names_set:
                return cand
    return None


def auto_link_hierarchy(conn):
    """Auto-detect and link terminals to parent cities across all locations."""
    cursor = conn.cursor(dictionary=True, buffered=True)
    locations = load_all_locations(cursor)
    name_to_id: Dict[str, int] = {normalize_name(row['name']): row['id'] for row in locations}
    all_names_set = set(name_to_id.keys())

    updated_links = 0
    parent_marked = set()

    for row in locations:
        loc_id = row['id']
        name = row['name']
        lower = name.lower()

        # Skip if already linked
        if row['parent_id']:
            continue

        # Only attempt if looks like a terminal
        if ' - ' in name or any(k in lower for k in TERMINAL_KEYWORDS):
            parent_name = guess_parent_from_name(name, all_names_set)
            if parent_name:
                parent_id = name_to_id.get(normalize_name(parent_name))
                if parent_id and parent_id != loc_id:
                    # Mark parent as CITY
                    cursor.execute("UPDATE locations SET location_type = 'CITY' WHERE id = %s", (parent_id,))
                    parent_marked.add(parent_id)
                    # Link child
                    cursor.execute(
                        "UPDATE locations SET parent_id = %s, location_type = 'TERMINAL' WHERE id = %s",
                        (parent_id, loc_id)
                    )
                    updated_links += 1

    conn.commit()
    print(f"\n🤖 Auto-linked {updated_links} terminals to their parent cities across all locations")
    print(f"   Marked {len(parent_marked)} parent cities with location_type='CITY'")
    cursor.close()


def setup_hierarchy(conn, enable_auto: bool = True):
    """Set up parent-child relationships for locations."""
    cursor = conn.cursor(dictionary=True, buffered=True)
    
    print("=" * 80)
    print("SETTING UP LOCATION HIERARCHY")
    print("=" * 80)
    
    total_relationships = 0
    
    for parent_name, child_patterns in LOCATION_HIERARCHY.items():
        print(f"\n📍 Processing {parent_name}...")
        
        # Find parent location ID
        parent_id = find_location_id(cursor, parent_name)
        if not parent_id:
            print(f"   ⚠️  Parent location '{parent_name}' not found, skipping...")
            continue
        
        print(f"   ✓ Parent ID: {parent_id}")
        
        # Update parent location type to CITY
        cursor.execute(
            "UPDATE locations SET location_type = 'CITY' WHERE id = %s",
            (parent_id,)
        )
        
        # Process each child terminal
        for child_pattern in child_patterns:
            child_id = find_location_id(cursor, child_pattern)
            if not child_id:
                print(f"   ⚠️  Child terminal '{child_pattern}' not found")
                continue
            
            # Set parent_id and location_type
            cursor.execute(
                """
                UPDATE locations 
                SET parent_id = %s, location_type = 'TERMINAL' 
                WHERE id = %s
                """,
                (parent_id, child_id)
            )
            
            print(f"   ✓ Linked: {child_pattern} (ID {child_id}) -> {parent_name} (ID {parent_id})")
            total_relationships += 1
    
    conn.commit()
    print(f"\n{'=' * 80}")
    print(f"✅ Seeded {total_relationships} parent-child relationships from curated mappings")
    print(f"{'=' * 80}")

    # Auto-detect additional terminals for all other cities
    if enable_auto:
        auto_link_hierarchy(conn)

    cursor.close()


def verify_hierarchy(conn):
    """Verify the hierarchy setup."""
    cursor = conn.cursor(dictionary=True)
    
    print("\n" + "=" * 80)
    print("VERIFYING LOCATION HIERARCHY")
    print("=" * 80)
    
    # Get all parent locations with their children
    cursor.execute("""
        SELECT 
            p.id as parent_id,
            p.name as parent_name,
            p.location_type as parent_type,
            COUNT(c.id) as child_count
        FROM locations p
        LEFT JOIN locations c ON c.parent_id = p.id
        WHERE p.location_type = 'CITY'
        GROUP BY p.id, p.name, p.location_type
        HAVING child_count > 0
        ORDER BY child_count DESC
    """)
    
    parents = cursor.fetchall()
    
    for parent in parents:
        print(f"\n🏙️  {parent['parent_name']} (ID {parent['parent_id']}) - {parent['child_count']} terminals:")
        
        # Get children
        cursor.execute("""
            SELECT id, name, location_type
            FROM locations
            WHERE parent_id = %s
            ORDER BY name
        """, (parent['parent_id'],))
        
        children = cursor.fetchall()
        for child in children:
            print(f"   ├─ {child['name']} (ID {child['id']}) [{child['location_type']}]")
    
    cursor.close()


def show_bus_impact(conn):
    """Show how many buses will be affected by the hierarchy."""
    cursor = conn.cursor(dictionary=True)
    
    print("\n" + "=" * 80)
    print("BUS SEARCH IMPACT ANALYSIS")
    print("=" * 80)
    
    # For each parent city, show buses from its terminals
    cursor.execute("""
        SELECT 
            p.id as city_id,
            p.name as city_name,
            COUNT(DISTINCT b.id) as total_buses_from_terminals
        FROM locations p
        JOIN locations c ON c.parent_id = p.id
        JOIN buses b ON b.from_location_id = c.id
        WHERE p.location_type = 'CITY'
        GROUP BY p.id, p.name
        ORDER BY total_buses_from_terminals DESC
    """)
    
    results = cursor.fetchall()
    
    print("\nSearching from CITY will now return buses from ALL terminals:")
    print(f"\n{'City':<20} {'Buses from Terminals':<25}")
    print("-" * 50)
    
    for row in results:
        print(f"{row['city_name']:<20} {row['total_buses_from_terminals']:<25}")
    
    # Example: Chennai to Madurai
    print("\n" + "=" * 80)
    print("EXAMPLE: Chennai → Madurai Search")
    print("=" * 80)
    
    cursor.execute("""
        SELECT 
            l.name as terminal,
            l.id as terminal_id,
            COUNT(b.id) as bus_count
        FROM locations l
        JOIN buses b ON b.from_location_id = l.id
        WHERE l.parent_id = (SELECT id FROM locations WHERE name = 'Chennai' LIMIT 1)
          AND b.to_location_id = (SELECT id FROM locations WHERE name = 'Madurai' LIMIT 1)
        GROUP BY l.id, l.name
        ORDER BY bus_count DESC
    """)
    
    chennai_terminals = cursor.fetchall()
    
    if chennai_terminals:
        print("\nBuses from Chennai terminals to Madurai:")
        total = 0
        for terminal in chennai_terminals:
            print(f"  • {terminal['terminal']}: {terminal['bus_count']} buses")
            total += terminal['bus_count']
        print(f"\n  📊 Total: {total} buses (will all appear in 'Chennai → Madurai' search)")
    else:
        print("\n  ℹ️  No direct buses found. Will check after restoring terminal locations.")
    
    cursor.close()


def main():
    """Main execution function."""
    print("\n" + "=" * 80)
    print("LOCATION HIERARCHY SETUP")
    print("=" * 80)
    print("\nThis script will:")
    print("1. Add parent-child relationships between cities and their terminals")
    print("2. Mark cities as 'CITY' and terminals as 'TERMINAL'")
    print("3. Enable hierarchical location searches")
    print("\nNote: Run the SQL migration (001_add_location_hierarchy.sql) first!")
    print("=" * 80)
    
    response = input("\nProceed with hierarchy setup for ALL cities (auto + curated)? (yes/no): ")
    if response.lower() not in ['yes', 'y']:
        print("❌ Cancelled.")
        sys.exit(0)
    
    conn = get_connection()
    
    try:
        # Check if parent_id column exists
        cursor = conn.cursor()
        cursor.execute("""
            SELECT COUNT(*) 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = 'perundhu' 
              AND TABLE_NAME = 'locations' 
              AND COLUMN_NAME = 'parent_id'
        """)
        
        if cursor.fetchone()[0] == 0:
            print("\n❌ Error: parent_id column not found!")
            print("   Please run the SQL migration first:")
            print("   mysql -u root -h 127.0.0.1 -D perundhu < scripts/migrations/001_add_location_hierarchy.sql")
            cursor.close()
            conn.close()
            sys.exit(1)
        
        cursor.close()
        
        # Setup hierarchy
        setup_hierarchy(conn)
        
        # Verify the setup
        verify_hierarchy(conn)
        
        # Show impact on bus searches
        show_bus_impact(conn)
        
        print("\n" + "=" * 80)
        print("✅ HIERARCHY SETUP COMPLETE!")
        print("=" * 80)
        print("\nNext steps:")
        print("1. Update backend code to search hierarchically")
        print("2. Restore buses to their original terminal locations")
        print("3. Test search API with 'Chennai → Madurai'")
        
    except mysql.connector.Error as e:
        print(f"\n❌ Database error: {e}")
        conn.rollback()
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        conn.rollback()
        sys.exit(1)
    finally:
        conn.close()


if __name__ == '__main__':
    main()
