#!/usr/bin/env python3
"""
TNSTC Bus Data Upload Script
- Uploads TNSTC scraped data to MySQL database
- Handles TNSTC-specific data structure (city, landmark, time)
- Supports preprod and prod environments
- Maps landmarks to location names for standardization
- Prevents duplicate locations with fuzzy matching
- Creates stops with landmark information
- Generates Tamil translations for location names
"""

import json
import logging
import sys
import os
from pathlib import Path
from typing import Dict, List, Optional, Tuple
from datetime import datetime
import mysql.connector
from mysql.connector import Error as MySQLError
import difflib
import argparse

try:
    from deep_translator import GoogleTranslator
    TRANSLATOR_AVAILABLE = True
except ImportError:
    TRANSLATOR_AVAILABLE = False
    logging.warning("deep-translator not installed. Tamil translations will be skipped. Install with: pip install deep-translator")

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('logs/tnstc_upload.log'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

# Ensure logs directory exists
Path('logs').mkdir(exist_ok=True)


class TNSTCDataUploader:
    """Upload TNSTC bus data to database with landmark support"""
    
    LOCATION_SIMILARITY_THRESHOLD = 0.85  # 85% match for duplicate detection
    
    def __init__(self, environment: str, enable_translations: bool = True):
        self.environment = environment
        self.enable_translations = enable_translations and TRANSLATOR_AVAILABLE
        self.connection = None
        self.cursor = None
        self.location_cache = {}
        self.translation_cache = {}  # Cache translations to avoid repeated API calls
        
        if self.enable_translations:
            self.translator = GoogleTranslator(source='en', target='ta')
            logger.info("Tamil translation enabled")
        else:
            self.translator = None
            if enable_translations:
                logger.warning("Tamil translation requested but deep-translator not available")
        
        self.stats = {
            'files_processed': 0,
            'routes_uploaded': 0,
            'locations_created': 0,
            'locations_reused': 0,
            'translations_created': 0,
            'buses_created': 0,
            'stops_created': 0,
            'errors': 0,
            'skipped': 0
        }
        
    def connect(self) -> bool:
        """Establish database connection"""
        try:
            if self.environment == 'prod':
                # Production - use Secret Manager
                host = os.getenv('PROD_DB_HOST')
                user = os.getenv('PROD_DB_USER')
                password = os.getenv('PROD_DB_PASSWORD')
                database = 'perundhu'
            elif self.environment == 'preprod':
                # Preprod - use environment variables
                host = os.getenv('PREPROD_DB_HOST')
                user = os.getenv('PREPROD_DB_USER', 'perundhu_user')
                password = os.getenv('PREPROD_DB_PASSWORD')
                database = 'perundhu_preprod'
            else:
                # Local
                host = 'localhost'
                user = os.getenv('LOCAL_DB_USER', 'perundhu_user')
                password = os.getenv('LOCAL_DB_PASSWORD')
                database = 'perundhu'
            
            logger.info(f"Connecting to {self.environment} database at {host}")
            
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
    
    def _normalize_location_name(self, city: str, landmark: str = None) -> Tuple[str, str]:
        """
        Normalize location name using TNSTC standards
        
        Args:
            city: City name from TNSTC data (often a route identifier)
            landmark: Landmark/bus stand name (the actual stop location)
            
        Returns:
            Tuple of (location_name, landmark)
        """
        # For TNSTC, the landmark is the actual stop name we want to use
        if landmark and landmark.strip():
            landmark = landmark.strip()
            return landmark, landmark
        
        # Fallback to city if no landmark provided
        city = city.strip().upper()
        return city, city
    
    def _find_similar_location(self, location_name: str) -> Optional[int]:
        """Find existing location with similar name"""
        try:
            # First try exact match
            query = "SELECT id FROM locations WHERE name = %s"
            self.cursor.execute(query, (location_name,))
            result = self.cursor.fetchone()
            self.cursor.fetchall()  # Consume any remaining results
            if result:
                logger.debug(f"Exact match found for '{location_name}'")
                return result['id']
            
            # Try fuzzy match
            query = "SELECT id, name FROM locations WHERE name LIKE %s"
            self.cursor.execute(query, (f"%{location_name[:15]}%",))
            results = self.cursor.fetchall()
            
            for result in results:
                similarity = difflib.SequenceMatcher(
                    None, 
                    location_name.lower(), 
                    result['name'].lower()
                ).ratio()
                
                if similarity >= self.LOCATION_SIMILARITY_THRESHOLD:
                    logger.debug(f"Fuzzy match: '{result['name']}' (~{similarity*100:.0f}%)")
                    return result['id']
            
            return None
        
        except Exception as e:
            logger.error(f"Error finding similar location: {e}")
            return None
    
    def get_or_create_location(self, city: str, landmark: str = None) -> Tuple[int, str]:
        """
        Get existing location ID or create new one
        
        Returns:
            Tuple of (location_id, final_location_name)
        """
        location_name, display_landmark = self._normalize_location_name(city, landmark)
        
        # Check cache
        cache_key = location_name.lower()
        if cache_key in self.location_cache:
            return self.location_cache[cache_key], location_name
        
        # Check for existing similar location
        similar_id = self._find_similar_location(location_name)
        if similar_id:
            self.location_cache[cache_key] = similar_id
            self.stats['locations_reused'] += 1
            logger.debug(f"Reusing location: {location_name} (ID: {similar_id})")
            return similar_id, location_name
        
        # Create new location
        try:
            insert_query = """
                INSERT INTO locations (name, created_at, updated_at)
                VALUES (%s, NOW(), NOW())
            """
            self.cursor.execute(insert_query, (location_name,))
            self.connection.commit()
            
            location_id = self.cursor.lastrowid
            self.location_cache[cache_key] = location_id
            self.stats['locations_created'] += 1
            logger.info(f"Created location: {location_name} (ID: {location_id})")
            
            # Create Tamil translation if enabled
            if self.enable_translations:
                self.create_translation(location_id, location_name)
            
            return location_id, location_name
        
        except MySQLError as e:
            logger.error(f"Error creating location '{location_name}': {e}")
            self.connection.rollback()
            raise
    
    def translate_to_tamil(self, text: str) -> Optional[str]:
        """Translate English text to Tamil using Google Translate"""
        if not self.translator:
            return None
        
        # Check cache first
        cache_key = text.lower()
        if cache_key in self.translation_cache:
            return self.translation_cache[cache_key]
        
        try:
            # Translate the text
            tamil_text = self.translator.translate(text)
            self.translation_cache[cache_key] = tamil_text
            logger.debug(f"Translated: '{text}' → '{tamil_text}'")
            return tamil_text
        except Exception as e:
            logger.warning(f"Translation failed for '{text}': {e}")
            return None
    
    def create_translation(self, location_id: int, location_name: str):
        """Create Tamil translation for a location"""
        try:
            # Check if translation already exists
            check_query = """
                SELECT id FROM translations 
                WHERE entity_type = 'location' 
                  AND entity_id = %s 
                  AND language_code = 'ta' 
                  AND field_name = 'name'
            """
            self.cursor.execute(check_query, (location_id,))
            existing = self.cursor.fetchone()
            self.cursor.fetchall()  # Consume any remaining results
            
            if existing:
                logger.debug(f"Translation already exists for location {location_id}")
                return
            
            # Get Tamil translation
            tamil_name = self.translate_to_tamil(location_name)
            if not tamil_name:
                return
            
            # Insert translation
            insert_query = """
                INSERT INTO translations 
                (entity_type, entity_id, language_code, field_name, translated_value, created_at, updated_at)
                VALUES ('location', %s, 'ta', 'name', %s, NOW(), NOW())
            """
            self.cursor.execute(insert_query, (location_id, tamil_name))
            self.connection.commit()
            
            self.stats['translations_created'] += 1
            logger.info(f"Created translation: {location_name} → {tamil_name}")
            
        except MySQLError as e:
            logger.error(f"Error creating translation for location {location_id}: {e}")
            self.connection.rollback()
    
    def create_bus(self, route_data: Dict) -> Optional[int]:
        """Create bus route record"""
        try:
            service_code = route_data.get('service_code', 'UNKNOWN')
            route_number = route_data.get('route_number', service_code)
            origin = route_data.get('origin')
            destination = route_data.get('destination')
            departure_time = route_data.get('departure_time')
            arrival_time = route_data.get('arrival_time')
            corporation = route_data.get('corporation', 'TNSTC')
            
            # Create descriptive bus name
            bus_name = f"{route_number} - {origin} to {destination}"
            
            # Get location IDs
            from_location_id, _ = self.get_or_create_location(origin)
            to_location_id, _ = self.get_or_create_location(destination)
            
            # Check if bus already exists
            check_query = """
                SELECT id FROM buses 
                WHERE bus_number = %s 
                  AND from_location_id = %s 
                  AND to_location_id = %s
                  AND category = 'TNSTC'
            """
            self.cursor.execute(check_query, (route_number, from_location_id, to_location_id))
            existing = self.cursor.fetchone()
            self.cursor.fetchall()  # Consume any remaining results
            
            if existing:
                logger.debug(f"Bus already exists: {route_number} (ID: {existing['id']})")
                return existing['id']
            
            # Create new bus
            insert_query = """
                INSERT INTO buses 
                (name, bus_number, from_location_id, to_location_id, 
                 departure_time, arrival_time, category, active, 
                 created_at, updated_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, TRUE, NOW(), NOW())
            """
            self.cursor.execute(insert_query, 
                (bus_name, route_number, from_location_id, to_location_id,
                 departure_time, arrival_time, 'TNSTC'))
            self.connection.commit()
            
            bus_id = self.cursor.lastrowid
            self.stats['buses_created'] += 1
            logger.info(f"Created bus: {route_number} - {origin} → {destination} (ID: {bus_id})")
            
            return bus_id
        
        except MySQLError as e:
            logger.error(f"Error creating bus: {e}")
            self.connection.rollback()
            return None
    
    def create_stops(self, bus_id: int, stops_data: List[Dict]) -> int:
        """Create stop records with landmark information"""
        created_count = 0
        
        try:
            # Check if stops already exist for this bus
            check_query = "SELECT COUNT(*) as count FROM stops WHERE bus_id = %s"
            self.cursor.execute(check_query, (bus_id,))
            result = self.cursor.fetchone()
            self.cursor.fetchall()  # Consume any remaining results
            
            if result and result['count'] > 0:
                logger.debug(f"Stops already exist for bus {bus_id}, skipping")
                return 0
            
            for idx, stop in enumerate(stops_data, 1):
                city = stop.get('city', '')
                landmark = stop.get('landmark', '')
                time = stop.get('time', '')
                
                if not city or not time:
                    continue
                
                # Get or create location with landmark
                location_id, location_name = self.get_or_create_location(city, landmark)
                
                # Create stop
                insert_query = """
                    INSERT INTO stops 
                    (name, bus_id, location_id, arrival_time, departure_time, 
                     stop_order, created_at, updated_at)
                    VALUES (%s, %s, %s, %s, %s, %s, NOW(), NOW())
                """
                self.cursor.execute(insert_query,
                    (location_name, bus_id, location_id, time, time, idx))
                
                created_count += 1
            
            self.connection.commit()
            self.stats['stops_created'] += created_count
            logger.debug(f"Created {created_count} stops for bus {bus_id}")
            
            return created_count
        
        except MySQLError as e:
            logger.error(f"Error creating stops: {e}")
            self.connection.rollback()
            return created_count
    
    def upload_route(self, route_data: Dict) -> bool:
        """Upload a single route with all stops"""
        try:
            # Validate required fields
            if not route_data.get('origin') or not route_data.get('destination'):
                logger.warning(f"Skipping route without origin/destination")
                self.stats['skipped'] += 1
                return False
            
            # Create bus
            bus_id = self.create_bus(route_data)
            if not bus_id:
                self.stats['errors'] += 1
                return False
            
            # Create stops
            stops = route_data.get('stops', [])
            if stops:
                self.create_stops(bus_id, stops)
            
            self.stats['routes_uploaded'] += 1
            return True
        
        except Exception as e:
            logger.error(f"Error uploading route: {e}")
            self.stats['errors'] += 1
            return False
    
    def upload_file(self, file_path: Path) -> bool:
        """Upload routes from a single JSON file"""
        try:
            logger.info(f"Processing: {file_path.name}")
            
            with open(file_path, 'r', encoding='utf-8') as f:
                routes = json.load(f)
            
            if not isinstance(routes, list):
                logger.warning(f"Invalid file format: {file_path}")
                return False
            
            for route in routes:
                self.upload_route(route)
            
            self.stats['files_processed'] += 1
            return True
        
        except Exception as e:
            logger.error(f"Error processing file {file_path}: {e}")
            return False
    
    def upload_directory(self, directory: str, pattern: str = "*.json") -> bool:
        """Upload all matching files from directory"""
        dir_path = Path(directory)
        
        if not dir_path.exists():
            logger.error(f"Directory not found: {directory}")
            return False
        
        # Find all JSON files
        files = list(dir_path.glob(pattern))
        # Exclude checkpoint files
        files = [f for f in files if 'checkpoint' not in f.name]
        
        logger.info(f"Found {len(files)} files to process in {directory}")
        
        for file_path in sorted(files):
            self.upload_file(file_path)
        
        return True
    
    def print_stats(self):
        """Print upload statistics"""
        print("\n" + "="*60)
        print("TNSTC DATA UPLOAD STATISTICS")
        print("="*60)
        print(f"Files processed:      {self.stats['files_processed']:,}")
        print(f"Routes uploaded:      {self.stats['routes_uploaded']:,}")
        print(f"Buses created:        {self.stats['buses_created']:,}")
        print(f"Stops created:        {self.stats['stops_created']:,}")
        print(f"Locations created:    {self.stats['locations_created']:,}")
        print(f"Locations reused:     {self.stats['locations_reused']:,}")
        if self.enable_translations:
            print(f"Translations created: {self.stats['translations_created']:,}")
        print(f"Errors:               {self.stats['errors']:,}")
        print(f"Skipped:              {self.stats['skipped']:,}")
        print("="*60)


def main():
    """Main execution"""
    parser = argparse.ArgumentParser(description='Upload TNSTC data to database')
    parser.add_argument('--environment', '-e', 
                       choices=['local', 'preprod', 'prod'],
                       default='local',
                       help='Target environment')
    parser.add_argument('--directory', '-d',
                       default='data/tnstc_major',
                       help='Directory containing TNSTC JSON files')
    parser.add_argument('--pattern', '-p',
                       default='*.json',
                       help='File pattern to match')
    parser.add_argument('--dry-run',
                       action='store_true',
                       help='Test connection without uploading')
    parser.add_argument('--no-translations',
                       action='store_true',
                       help='Disable Tamil translations (faster upload)')
    
    args = parser.parse_args()
    
    logger.info(f"Starting TNSTC upload to {args.environment}")
    
    uploader = TNSTCDataUploader(args.environment, enable_translations=not args.no_translations)
    
    # Connect to database
    if not uploader.connect():
        logger.error("Failed to connect to database")
        return 1
    
    if args.dry_run:
        logger.info("DRY RUN - Connection successful, exiting")
        uploader.disconnect()
        return 0
    
    try:
        # Upload data
        uploader.upload_directory(args.directory, args.pattern)
        
        # Print statistics
        uploader.print_stats()
        
        return 0
    
    except Exception as e:
        logger.error(f"Upload failed: {e}")
        return 1
    
    finally:
        uploader.disconnect()


if __name__ == '__main__':
    sys.exit(main())
