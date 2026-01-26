#!/usr/bin/env python3
"""
TNSTC Consolidated Data Upload Wrapper
- Uses the main upload_tnstc_data.py script to upload consolidated JSON
- Prevents duplicate locations, buses, and stops
- Provides database verification
"""

import json
import logging
import sys
import os
from pathlib import Path
from typing import Dict, List
from datetime import datetime
import mysql.connector
from mysql.connector import Error as MySQLError
import argparse

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('logs/tnstc_consolidated_upload.log'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

# Ensure logs directory exists
Path('logs').mkdir(exist_ok=True)


class TNSTCConsolidatedUploader:
    """Upload consolidated TNSTC data without duplicates"""
    
    def __init__(self, environment: str = 'local', clear_existing: bool = False):
        self.environment = environment
        self.clear_existing = clear_existing
        self.connection = None
        self.cursor = None
        self.stats = {
            'routes_processed': 0,
            'routes_uploaded': 0,
            'buses_created': 0,
            'buses_skipped': 0,
            'stops_created': 0,
            'locations_created': 0,
            'locations_reused': 0,
        }
    
    def connect(self) -> bool:
        """Establish database connection"""
        try:
            if self.environment == 'prod':
                host = os.getenv('PROD_DB_HOST')
                user = os.getenv('PROD_DB_USER')
                password = os.getenv('PROD_DB_PASSWORD')
                database = 'perundhu'
            elif self.environment == 'preprod':
                host = os.getenv('PREPROD_DB_HOST')
                user = os.getenv('PREPROD_DB_USER', 'perundhu_user')
                password = os.getenv('PREPROD_DB_PASSWORD')
                database = 'perundhu_preprod'
            else:
                host = os.getenv('DB_HOST', 'localhost')
                user = os.getenv('DB_USER', 'root')
                password = os.getenv('DB_PASSWORD', 'root')
                database = os.getenv('DB_NAME', 'perundhu')
            
            logger.info(f"Connecting to {self.environment} database: {host}:{database}")
            
            self.connection = mysql.connector.connect(
                host=host,
                port=3306,
                user=user,
                password=password,
                database=database,
                autocommit=False
            )
            
            self.cursor = self.connection.cursor(dictionary=True)
            logger.info("✓ Database connection successful")
            return True
        
        except MySQLError as e:
            logger.error(f"✗ Connection failed: {e}")
            return False
    
    def disconnect(self):
        """Close database connection"""
        if self.cursor:
            self.cursor.close()
        if self.connection:
            self.connection.close()
            logger.info("Database connection closed")
    
    def clear_tnstc_data(self):
        """Clear existing TNSTC data"""
        try:
            logger.info("Clearing existing TNSTC data...")
            
            queries = [
                "DELETE FROM stops WHERE bus_id IN (SELECT id FROM buses WHERE category = 'TNSTC')",
                "DELETE FROM buses WHERE category = 'TNSTC'",
            ]
            
            for query in queries:
                self.cursor.execute(query)
                deleted = self.cursor.rowcount
                if deleted > 0:
                    logger.info(f"  Deleted {deleted} records")
            
            self.connection.commit()
            logger.info("✓ Existing TNSTC data cleared")
            return True
        
        except MySQLError as e:
            logger.error(f"✗ Error clearing data: {e}")
            self.connection.rollback()
            return False
    
    def load_existing_locations(self) -> int:
        """Get count of existing locations"""
        try:
            self.cursor.execute("SELECT COUNT(*) as count FROM locations")
            count = self.cursor.fetchone()['count']
            logger.info(f"Existing locations in database: {count}")
            return count
        except MySQLError as e:
            logger.error(f"Error getting location count: {e}")
            return 0
    
    def upload_consolidated_file(self, file_path: str) -> bool:
        """Upload consolidated JSON file"""
        try:
            logger.info(f"Loading consolidated file: {file_path}")
            
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            # Check file structure
            if isinstance(data, dict) and 'routes' in data:
                routes = data['routes']
            elif isinstance(data, list):
                routes = data
            else:
                logger.error("Invalid consolidated file format")
                return False
            
            logger.info(f"Found {len(routes)} routes in consolidated file")
            
            # Process all routes using direct upload (this script handles deduplication)
            self.upload_routes(routes)
            
            return True
        
        except Exception as e:
            logger.error(f"Error uploading consolidated file: {e}")
            return False
    
    def upload_routes(self, routes: List[Dict]):
        """Upload routes with deduplication"""
        location_cache = {}
        bus_cache = {}
        
        try:
            # First, load all existing locations into cache
            logger.info("Loading existing locations...")
            self.cursor.execute("SELECT id, name FROM locations")
            for row in self.cursor.fetchall():
                location_cache[row['name'].lower()] = row['id']
            logger.info(f"Loaded {len(location_cache)} existing locations")
            
            # Load existing buses to prevent duplicates
            logger.info("Loading existing TNSTC buses...")
            self.cursor.execute("""
                SELECT CONCAT(bus_number, '_', from_location_id, '_', to_location_id, '_', 
                       COALESCE(departure_time, '')) as bus_key, id
                FROM buses WHERE category = 'TNSTC'
            """)
            for row in self.cursor.fetchall():
                bus_cache[row['bus_key']] = row['id']
            logger.info(f"Loaded {len(bus_cache)} existing buses")
            
            # Process each route
            for idx, route in enumerate(routes, 1):
                if not route.get('origin') or not route.get('destination'):
                    continue
                
                self.stats['routes_processed'] += 1
                
                # Get or create locations
                origin = route['origin'].strip()
                destination = route['destination'].strip()
                
                from_loc_id = location_cache.get(origin.lower())
                if not from_loc_id:
                    self.cursor.execute(
                        "INSERT INTO locations (name, created_at, updated_at) VALUES (%s, NOW(), NOW())",
                        (origin,)
                    )
                    self.connection.commit()
                    from_loc_id = self.cursor.lastrowid
                    location_cache[origin.lower()] = from_loc_id
                    self.stats['locations_created'] += 1
                    logger.debug(f"Created location: {origin}")
                else:
                    self.stats['locations_reused'] += 1
                
                to_loc_id = location_cache.get(destination.lower())
                if not to_loc_id:
                    self.cursor.execute(
                        "INSERT INTO locations (name, created_at, updated_at) VALUES (%s, NOW(), NOW())",
                        (destination,)
                    )
                    self.connection.commit()
                    to_loc_id = self.cursor.lastrowid
                    location_cache[destination.lower()] = to_loc_id
                    self.stats['locations_created'] += 1
                    logger.debug(f"Created location: {destination}")
                else:
                    self.stats['locations_reused'] += 1
                
                # Check if bus exists
                route_number = route.get('route_number', route.get('service_code', 'UNKNOWN'))
                departure_time = route.get('departure_time', '')
                bus_key = f"{route_number}_{from_loc_id}_{to_loc_id}_{departure_time}"
                
                if bus_key in bus_cache:
                    self.stats['buses_skipped'] += 1
                    logger.debug(f"Bus already exists: {route_number}")
                    continue
                
                # Create bus
                bus_name = f"{route_number} - {origin} to {destination}"
                arrival_time = route.get('arrival_time', '')
                
                self.cursor.execute(
                    """INSERT INTO buses 
                    (name, bus_number, from_location_id, to_location_id, 
                     departure_time, arrival_time, category, active, created_at, updated_at)
                    VALUES (%s, %s, %s, %s, %s, %s, 'TNSTC', TRUE, NOW(), NOW())""",
                    (bus_name, route_number, from_loc_id, to_loc_id, departure_time, arrival_time)
                )
                self.connection.commit()
                
                bus_id = self.cursor.lastrowid
                bus_cache[bus_key] = bus_id
                self.stats['buses_created'] += 1
                logger.info(f"Created bus: {route_number} ({origin} → {destination})")
                
                # Create stops for this bus
                stops = route.get('stops', [])
                stops_created = 0
                
                for stop_idx, stop in enumerate(stops, 1):
                    city = stop.get('city', '').strip()
                    landmark = stop.get('landmark', '').strip()
                    time = stop.get('time', '').strip()
                    
                    if not city or not time:
                        continue
                    
                    # Use landmark if available, otherwise city
                    stop_location_name = landmark if landmark else city
                    
                    # Get or create location for stop
                    stop_loc_id = location_cache.get(stop_location_name.lower())
                    if not stop_loc_id:
                        self.cursor.execute(
                            "INSERT INTO locations (name, created_at, updated_at) VALUES (%s, NOW(), NOW())",
                            (stop_location_name,)
                        )
                        self.connection.commit()
                        stop_loc_id = self.cursor.lastrowid
                        location_cache[stop_location_name.lower()] = stop_loc_id
                        self.stats['locations_created'] += 1
                    else:
                        self.stats['locations_reused'] += 1
                    
                    # Create stop
                    self.cursor.execute(
                        """INSERT INTO stops 
                        (name, bus_id, location_id, arrival_time, departure_time, stop_order, created_at, updated_at)
                        VALUES (%s, %s, %s, %s, %s, %s, NOW(), NOW())""",
                        (stop_location_name, bus_id, stop_loc_id, time, time, stop_idx)
                    )
                    stops_created += 1
                
                self.connection.commit()
                self.stats['stops_created'] += stops_created
                
                if stops_created > 0:
                    logger.debug(f"Created {stops_created} stops")
                
                self.stats['routes_uploaded'] += 1
                
                if idx % 100 == 0:
                    logger.info(f"Progress: {idx}/{len(routes)} routes processed")
        
        except MySQLError as e:
            logger.error(f"Database error: {e}")
            self.connection.rollback()
            raise
    
    def verify_upload(self):
        """Verify upload results"""
        try:
            logger.info("\n" + "="*70)
            logger.info("DATABASE VERIFICATION")
            logger.info("="*70)
            
            # Count TNSTC buses
            self.cursor.execute("SELECT COUNT(*) as count FROM buses WHERE category = 'TNSTC'")
            tnstc_buses = self.cursor.fetchone()['count']
            logger.info(f"✓ TNSTC Buses in DB: {tnstc_buses:,}")
            
            # Count TNSTC stops
            self.cursor.execute("""
                SELECT COUNT(*) as count FROM stops 
                WHERE bus_id IN (SELECT id FROM buses WHERE category = 'TNSTC')
            """)
            tnstc_stops = self.cursor.fetchone()['count']
            logger.info(f"✓ TNSTC Stops in DB: {tnstc_stops:,}")
            
            # Total locations
            self.cursor.execute("SELECT COUNT(*) as count FROM locations")
            total_locations = self.cursor.fetchone()['count']
            logger.info(f"✓ Total Locations in DB: {total_locations:,}")
            
            # Sample TNSTC routes
            self.cursor.execute("""
                SELECT bus_number, COUNT(*) as count 
                FROM buses WHERE category = 'TNSTC'
                GROUP BY bus_number
                ORDER BY count DESC LIMIT 5
            """)
            logger.info("\nTop 5 TNSTC routes by frequency:")
            for row in self.cursor.fetchall():
                logger.info(f"  {row['bus_number']}: {row['count']} buses")
            
            # Check for duplicates
            self.cursor.execute("""
                SELECT bus_number, from_location_id, to_location_id, departure_time, COUNT(*) as cnt
                FROM buses WHERE category = 'TNSTC'
                GROUP BY bus_number, from_location_id, to_location_id, departure_time
                HAVING cnt > 1 LIMIT 10
            """)
            duplicates = self.cursor.fetchall()
            if duplicates:
                logger.warning(f"\n⚠️  Found {len(duplicates)} potential duplicates:")
                for dup in duplicates:
                    logger.warning(f"  Route {dup['bus_number']}: {dup['cnt']} instances")
            else:
                logger.info("\n✓ No duplicate buses detected!")
            
            logger.info("="*70)
        
        except Exception as e:
            logger.error(f"Error during verification: {e}")
    
    def print_stats(self):
        """Print upload statistics"""
        print("\n" + "="*70)
        print("TNSTC CONSOLIDATED UPLOAD STATISTICS")
        print("="*70)
        print(f"Routes processed:           {self.stats['routes_processed']:,}")
        print(f"Routes uploaded:            {self.stats['routes_uploaded']:,}")
        print(f"Buses created:              {self.stats['buses_created']:,}")
        print(f"Buses skipped (duplicate):  {self.stats['buses_skipped']:,}")
        print(f"Stops created:              {self.stats['stops_created']:,}")
        print(f"Locations created:          {self.stats['locations_created']:,}")
        print(f"Locations reused:           {self.stats['locations_reused']:,}")
        print("="*70)


def main():
    """Main execution"""
    parser = argparse.ArgumentParser(description='Upload TNSTC consolidated data')
    parser.add_argument('--file', '-f',
                       default='data/tnstc_consolidated.json',
                       help='Consolidated JSON file path')
    parser.add_argument('--environment', '-e',
                       choices=['local', 'preprod', 'prod'],
                       default='local',
                       help='Target environment')
    parser.add_argument('--clear', action='store_true',
                       help='Clear existing TNSTC data before upload')
    parser.add_argument('--verify-only', action='store_true',
                       help='Only verify database without uploading')
    
    args = parser.parse_args()
    
    logger.info(f"TNSTC Consolidated Upload - {datetime.now()}")
    logger.info(f"Environment: {args.environment}")
    logger.info(f"File: {args.file}")
    if args.clear:
        logger.info("Will clear existing TNSTC data before upload")
    
    uploader = TNSTCConsolidatedUploader(args.environment, clear_existing=args.clear)
    
    if not uploader.connect():
        logger.error("Failed to connect to database")
        return 1
    
    try:
        if args.verify_only:
            logger.info("Running verification only...")
        else:
            # Clear if requested
            if args.clear:
                if not uploader.clear_tnstc_data():
                    return 1
            
            # Get initial state
            uploader.load_existing_locations()
            
            # Upload
            if not uploader.upload_consolidated_file(args.file):
                logger.error("Upload failed")
                return 1
            
            uploader.print_stats()
        
        # Always verify
        uploader.verify_upload()
        
        return 0
    
    except Exception as e:
        logger.error(f"Fatal error: {e}")
        return 1
    
    finally:
        uploader.disconnect()


if __name__ == '__main__':
    sys.exit(main())
