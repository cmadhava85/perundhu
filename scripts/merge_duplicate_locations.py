#!/usr/bin/env python3
"""
Merge Duplicate Locations Script
- Finds duplicate locations in the database
- Merges them by updating foreign key references
- Keeps the most detailed/descriptive name
- Prevents future duplicates during data upload
"""

import mysql.connector
from mysql.connector import Error as MySQLError
import logging
import difflib
from typing import List, Dict, Tuple
import argparse

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


# Normalized suffixes to strip for better matching
LOCATION_SUFFIXES = [
    ' BS',
    ' B.S',
    ' B.S.',
    ' bus stand',
    ' bus stop',
    ' bus station',
    ' bus terminus',
    ' MTC terminus',
    ' MTC bus stand',
    ' TNSTC bus stand',
    ' depot'
]


def normalize_location_name(name: str) -> str:
    """Normalize location name for better matching by removing common suffixes"""
    name_lower = name.lower().strip()
    
    # Remove common suffixes
    for suffix in LOCATION_SUFFIXES:
        if name_lower.endswith(suffix.lower()):
            name_lower = name_lower[:-len(suffix)].strip()
            break
    
    # Remove extra spaces
    name_lower = ' '.join(name_lower.split())
    
    return name_lower


def find_duplicates(cursor) -> List[Tuple[Dict, Dict, float]]:
    """Find duplicate locations using normalized name matching"""
    logger.info("Fetching all locations from database...")
    
    query = "SELECT id, name, type FROM locations ORDER BY id"
    cursor.execute(query)
    locations = cursor.fetchall()
    
    logger.info(f"Found {len(locations)} total locations")
    
    duplicates = []
    checked = set()
    
    for i, loc1 in enumerate(locations):
        if loc1['id'] in checked:
            continue
        
        name1_normalized = normalize_location_name(loc1['name'])
        
        for loc2 in locations[i+1:]:
            if loc2['id'] in checked:
                continue
            
            name2_normalized = normalize_location_name(loc2['name'])
            
            # Calculate similarity on normalized names
            ratio = difflib.SequenceMatcher(None, name1_normalized, name2_normalized).ratio()
            
            # Also check if one is substring of other
            if name1_normalized in name2_normalized or name2_normalized in name1_normalized:
                ratio = max(ratio, 0.95)
            
            # Consider as duplicate if > 85% similar
            if ratio >= 0.85:
                duplicates.append((loc1, loc2, ratio))
                logger.info(f"Found duplicate: '{loc1['name']}' (ID: {loc1['id']}) <-> '{loc2['name']}' (ID: {loc2['id']}) - {ratio:.1%} match")
    
    return duplicates


def choose_primary_location(loc1: Dict, loc2: Dict) -> Tuple[Dict, Dict]:
    """Choose which location to keep (primary) and which to merge (secondary)
    
    Keep the more detailed/descriptive name
    """
    name1 = loc1['name']
    name2 = loc2['name']
    
    # Prefer longer, more descriptive names
    # E.g., "Vadapalani Bus Terminus" over "Vadapalani"
    has_suffix1 = any(suffix.lower() in name1.lower() for suffix in LOCATION_SUFFIXES)
    has_suffix2 = any(suffix.lower() in name2.lower() for suffix in LOCATION_SUFFIXES)
    
    if has_suffix1 and not has_suffix2:
        return loc1, loc2  # Keep loc1 (has suffix)
    elif has_suffix2 and not has_suffix1:
        return loc2, loc1  # Keep loc2 (has suffix)
    
    # If both have suffix or neither has suffix, prefer longer name
    if len(name1) > len(name2):
        return loc1, loc2
    else:
        return loc2, loc1


def merge_locations(cursor, connection, primary: Dict, secondary: Dict, dry_run: bool = True):
    """Merge secondary location into primary by updating all references"""
    primary_id = primary['id']
    secondary_id = secondary['id']
    
    logger.info(f"\n{'[DRY RUN] ' if dry_run else ''}Merging '{secondary['name']}' (ID: {secondary_id}) into '{primary['name']}' (ID: {primary_id})")
    
    try:
        # Count references before merge
        tables_to_update = [
            ('buses', 'from_location_id'),
            ('buses', 'to_location_id'),
            ('stops', 'location_id'),
            ('connecting_routes', 'from_location_id'),
            ('connecting_routes', 'to_location_id')
        ]
        
        total_updates = 0
        
        for table, column in tables_to_update:
            query = f"SELECT COUNT(*) as count FROM {table} WHERE {column} = %s"
            cursor.execute(query, (secondary_id,))
            count = cursor.fetchone()['count']
            
            if count > 0:
                logger.info(f"  - {table}.{column}: {count} rows to update")
                total_updates += count
                
                if not dry_run:
                    update_query = f"UPDATE {table} SET {column} = %s WHERE {column} = %s"
                    cursor.execute(update_query, (primary_id, secondary_id))
        
        logger.info(f"  Total rows affected: {total_updates}")
        
        # Delete secondary location
        if not dry_run and total_updates >= 0:
            delete_query = "DELETE FROM locations WHERE id = %s"
            cursor.execute(delete_query, (secondary_id,))
            logger.info(f"  ✅ Deleted location ID {secondary_id}")
        
        if not dry_run:
            connection.commit()
            logger.info(f"  ✅ Merge completed successfully")
    
    except MySQLError as e:
        if not dry_run:
            connection.rollback()
        logger.error(f"  ❌ Error merging locations: {e}")
        raise


def main():
    parser = argparse.ArgumentParser(description='Merge duplicate locations in database')
    parser.add_argument('--execute', action='store_true', help='Actually execute the merge (default is dry-run)')
    parser.add_argument('--host', default='127.0.0.1', help='Database host')
    parser.add_argument('--port', type=int, default=3307, help='Database port')
    parser.add_argument('--user', default='root', help='Database user')
    parser.add_argument('--password', default='root123', help='Database password')
    parser.add_argument('--database', default='perundhu', help='Database name')
    
    args = parser.parse_args()
    
    dry_run = not args.execute
    
    if dry_run:
        logger.info("=" * 80)
        logger.info("DRY RUN MODE - No changes will be made")
        logger.info("Use --execute flag to actually merge duplicates")
        logger.info("=" * 80)
    else:
        logger.warning("=" * 80)
        logger.warning("EXECUTE MODE - Changes will be made to the database!")
        logger.warning("=" * 80)
    
    # Connect to database
    try:
        connection = mysql.connector.connect(
            host=args.host,
            port=args.port,
            user=args.user,
            password=args.password,
            database=args.database,
            charset='utf8mb4',
            collation='utf8mb4_unicode_ci'
        )
        
        cursor = connection.cursor(dictionary=True)
        logger.info(f"✅ Connected to database: {args.database}")
        
        # Find duplicates
        duplicates = find_duplicates(cursor)
        
        if not duplicates:
            logger.info("\n✅ No duplicate locations found!")
            return
        
        logger.info(f"\n{'='*80}")
        logger.info(f"Found {len(duplicates)} duplicate pairs")
        logger.info(f"{'='*80}\n")
        
        # Process each duplicate pair
        merged_count = 0
        for loc1, loc2, ratio in duplicates:
            primary, secondary = choose_primary_location(loc1, loc2)
            merge_locations(cursor, connection, primary, secondary, dry_run)
            merged_count += 1
        
        logger.info(f"\n{'='*80}")
        logger.info(f"Summary: {'Would merge' if dry_run else 'Merged'} {merged_count} duplicate location pairs")
        logger.info(f"{'='*80}")
        
        if dry_run:
            logger.info("\n⚠️  This was a DRY RUN. Use --execute to actually merge duplicates")
        
        cursor.close()
        connection.close()
        
    except MySQLError as e:
        logger.error(f"Database error: {e}")
        return 1
    
    return 0


if __name__ == '__main__':
    exit(main())
