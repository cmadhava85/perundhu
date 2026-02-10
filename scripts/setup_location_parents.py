#!/usr/bin/env python3
"""
Setup parent-child relationships for locations.
Links bus stands (like "Madurai - Mattuthavani") to their parent cities (like "Madurai").

This enables hierarchical search - when user searches for "Madurai",
all bus stands within Madurai will be included in results.
"""

import os
import re
import mysql.connector
from collections import defaultdict

def get_db_connection():
    """Get database connection"""
    return mysql.connector.connect(
        host=os.getenv('DB_HOST_PREPROD', '127.0.0.1'),
        port=int(os.getenv('DB_PORT_PREPROD', '3307')),
        user=os.getenv('DB_USER_PREPROD', 'perundhu_user'),
        password=os.getenv('DB_PASSWORD_PREPROD'),
        database=os.getenv('DB_NAME_PREPROD', 'perundhu')
    )

def extract_city_name(location_name):
    """
    Extract the main city name from a bus stand name.
    Examples:
    - "Madurai - Mattuthavani" -> "Madurai"
    - "Chennai - Koyambedu" -> "Chennai"
    - "Coimbatore Gandhipuram" -> "Coimbatore"
    - "Salem New Bus Stand" -> "Salem"
    """
    name = location_name.strip()
    
    # Pattern 1: "City - Stand Name" (e.g., "Madurai - Mattuthavani")
    if ' - ' in name:
        return name.split(' - ')[0].strip()
    
    # Pattern 2: "City Stand Name" with common suffixes
    suffixes = [
        'Bus Stand', 'Bus Station', 'New Bus Stand', 'Old Bus Stand',
        'Central Bus Stand', 'Town Bus Stand', 'Mofussil Bus Stand',
        'CMBT', 'Junction', 'Depot', 'Terminus', 'Terminal'
    ]
    for suffix in suffixes:
        if name.lower().endswith(suffix.lower()):
            return name[:-len(suffix)].strip()
    
    # Pattern 3: Common area names within cities
    # If location has two words and second is a known area, first might be city
    words = name.split()
    if len(words) >= 2:
        # Check if it looks like "City Area" format
        known_areas = [
            'Gandhipuram', 'Ukkadam', 'Mattuthavani', 'Arapalayam',
            'Periyar', 'Koyambedu', 'Broadway', 'Tambaram', 'Egmore',
            'Central', 'Fort', 'Beach', 'Nagar', 'Pettai', 'Bazaar'
        ]
        if words[-1] in known_areas or any(area.lower() in words[-1].lower() for area in known_areas):
            return ' '.join(words[:-1]).strip()
    
    return None

def setup_parent_relationships(dry_run=True):
    """Set up parent-child relationships for locations"""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    print("🔗 Setting up location parent relationships...")
    print(f"   Mode: {'DRY RUN' if dry_run else 'LIVE UPDATE'}")
    
    # Get all locations
    cursor.execute("""
        SELECT id, name, location_type, parent_id, district, state
        FROM locations
        ORDER BY name
    """)
    locations = cursor.fetchall()
    print(f"   Found {len(locations)} locations")
    
    # Build city lookup (city name -> location with shortest name)
    cities = {}
    for loc in locations:
        name = loc['name']
        # Consider as a city if name doesn't contain separators
        if ' - ' not in name and not any(
            suffix.lower() in name.lower() 
            for suffix in ['Bus Stand', 'Bus Station', 'Junction', 'Depot']
        ):
            # Keep the simplest/shortest version of each city
            city_key = name.upper().split()[0] if name else None
            if city_key:
                if city_key not in cities or len(name) < len(cities[city_key]['name']):
                    cities[city_key] = loc
    
    print(f"   Identified {len(cities)} potential parent cities")
    
    # Find children for each city
    updates = []
    for loc in locations:
        if loc['parent_id']:
            continue  # Already has parent
        
        city_name = extract_city_name(loc['name'])
        if not city_name:
            continue
        
        # Find matching parent city
        city_key = city_name.upper().split()[0] if city_name else None
        if city_key and city_key in cities:
            parent = cities[city_key]
            # Don't set self as parent
            if parent['id'] != loc['id']:
                updates.append({
                    'child_id': loc['id'],
                    'child_name': loc['name'],
                    'parent_id': parent['id'],
                    'parent_name': parent['name']
                })
    
    print(f"\n📊 Found {len(updates)} parent-child relationships to create:")
    
    # Group by parent for display
    by_parent = defaultdict(list)
    for u in updates:
        by_parent[u['parent_name']].append(u['child_name'])
    
    for parent, children in sorted(by_parent.items(), key=lambda x: -len(x[1]))[:20]:
        print(f"\n   {parent} ({len(children)} children):")
        for child in children[:5]:
            print(f"      └─ {child}")
        if len(children) > 5:
            print(f"      └─ ... and {len(children) - 5} more")
    
    if len(by_parent) > 20:
        print(f"\n   ... and {len(by_parent) - 20} more parent cities")
    
    if not dry_run and updates:
        print("\n🔄 Applying updates...")
        update_query = "UPDATE locations SET parent_id = %s WHERE id = %s"
        for u in updates:
            cursor.execute(update_query, (u['parent_id'], u['child_id']))
        conn.commit()
        print(f"✅ Updated {len(updates)} locations with parent relationships")
    elif dry_run:
        print("\n💡 Run with dry_run=False to apply these changes")
    
    conn.close()
    return updates

def show_hierarchy_examples():
    """Show some example hierarchies after setup"""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    print("\n📊 Current hierarchy examples:")
    
    for city in ['Madurai', 'Chennai', 'Coimbatore', 'Salem', 'Trichy']:
        cursor.execute("""
            SELECT c.name as child_name, p.name as parent_name
            FROM locations c
            JOIN locations p ON c.parent_id = p.id
            WHERE p.name = %s OR c.name LIKE %s
            LIMIT 10
        """, (city, f"{city}%"))
        
        results = cursor.fetchall()
        if results:
            print(f"\n   {city}:")
            for r in results:
                print(f"      └─ {r['child_name']}")
    
    conn.close()

if __name__ == '__main__':
    import sys
    
    dry_run = '--apply' not in sys.argv
    
    if dry_run:
        print("=" * 60)
        print("DRY RUN MODE - No changes will be made")
        print("Run with --apply to make actual changes")
        print("=" * 60)
    
    setup_parent_relationships(dry_run=dry_run)
    
    if not dry_run:
        show_hierarchy_examples()
