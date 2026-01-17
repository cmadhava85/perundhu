#!/usr/bin/env python3
"""
Generic Bus Timings Data Upload Script
- Uploads scraped bus data (MTC, TNSTC, etc.) to MySQL database
- Flexible environment configuration (local, preprod, prod)
- Reads secrets from GCP Secret Manager (production) or config files
- Maps data to: locations, buses, stops, connecting_routes tables
- Prevents duplicate location insertion with fuzzy matching
- Handles transactions and rollback on errors
- Supports multiple bus operators with configurable categories
"""

import json
import logging
import sys
import os
from pathlib import Path
from typing import Dict, List, Optional
from datetime import datetime
from dataclasses import dataclass
import mysql.connector
from mysql.connector import Error as MySQLError
import difflib
import argparse

# Import Tamil translation module
sys.path.insert(0, str(Path(__file__).parent))
try:
    from tamil_translator import TamilTranslator, create_translation_entry
except ImportError:
    logger_temp = logging.getLogger(__name__)
    logger_temp.warning("tamil_translator module not found. Translation features disabled.")
    TamilTranslator = None
    create_translation_entry = None

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('logs/bus_upload.log'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)


@dataclass
class DatabaseConfig:
    """Database configuration"""
    host: str
    port: int
    user: str
    password: str
    database: str
    ssl_ca: Optional[str] = None


class SecretManager:
    """Handle secrets from GCP Secret Manager or local config"""
    
    def __init__(self, environment: str):
        self.environment = environment
        self.is_gcp = environment in ['prod', 'production']
    
    def get_secret(self, secret_name: str) -> str:
        """Get secret from GCP or local config"""
        try:
            if self.is_gcp:
                return self._get_gcp_secret(secret_name)
            else:
                return self._get_local_secret(secret_name)
        except Exception as e:
            logger.error(f"Failed to retrieve secret '{secret_name}': {e}")
            raise
    
    def _get_gcp_secret(self, secret_name: str) -> str:
        """Fetch secret from GCP Secret Manager"""
        try:
            from google.cloud import secretmanager
            
            project_id = os.getenv('GCP_PROJECT_ID', 'perundhu-project')
            client = secretmanager.SecretManagerServiceClient()
            name = f"projects/{project_id}/secrets/{secret_name}/versions/latest"
            
            response = client.access_secret_version(request={"name": name})
            return response.payload.data.decode("UTF-8")
        except ImportError:
            logger.warning("google-cloud-secret-manager not installed. Using fallback.")
            return self._get_local_secret(secret_name)
    
    def _get_local_secret(self, secret_name: str) -> str:
        """Fetch secret from local config file"""
        config_path = Path("backend/app/src/main/resources") / f"application-{self.environment}.properties"
        
        if not config_path.exists():
            raise FileNotFoundError(f"Config file not found: {config_path}")
        
        with open(config_path, 'r') as f:
            for line in f:
                if line.startswith(f"spring.datasource.{secret_name}"):
                    return line.split('=', 1)[1].strip()
        
        raise ValueError(f"Secret '{secret_name}' not found in {config_path}")


class BusDataUploader:
    """Upload bus scraped data (MTC, TNSTC, etc.) to MySQL database"""
    
    LOCATION_SIMILARITY_THRESHOLD = 0.80  # 80% match for duplicate detection
    
    # Supported operators and their configurations
    OPERATOR_CONFIGS = {
        'MTC': {
            'category': 'MTC',
            'checkpoint_file': 'data/mtc_bus_timings.checkpoint.json',
            'data_key': 'all_timings',
            'display_name': 'Metropolitan Transport Corporation (MTC)'
        },
        'TNSTC': {
            'category': 'TNSTC',
            'checkpoint_file': 'data/tnstc_bus_timings.checkpoint.json',
            'data_key': 'all_timings',
            'display_name': 'Tamil Nadu State Transport Corporation (TNSTC)'
        }
    }
    
    def __init__(self, environment: str, operator: str = 'MTC'):
        self.environment = environment
        self.operator = operator.upper()
        
        if self.operator not in self.OPERATOR_CONFIGS:
            raise ValueError(
                f"Unsupported operator: {operator}. "
                f"Supported: {', '.join(self.OPERATOR_CONFIGS.keys())}"
            )
        
        self.operator_config = self.OPERATOR_CONFIGS[self.operator]
        self.config = self._load_config()
        self.connection = None
        self.cursor = None
        self.location_cache = {}  # Cache for location lookups
        self.translation_cache = {}  # Cache for Tamil translations
        
        # Initialize Tamil translator
        self.translator = None
        if TamilTranslator:
            try:
                self.translator = TamilTranslator(use_api=False)  # Use offline dictionary
                logger.info("Tamil translation enabled")
            except Exception as e:
                logger.warning(f"Failed to initialize Tamil translator: {e}")
        
        self.stats = {
            'locations_created': 0,
            'locations_skipped': 0,
            'buses_created': 0,
            'stops_created': 0,
            'connecting_routes_created': 0,
            'translations_created': 0,
            'errors': 0
        }
        
        logger.info(f"Initialized uploader for {self.operator_config['display_name']}")
    
    def _load_config(self) -> DatabaseConfig:
        """Load database configuration from secrets"""
        try:
            secret_mgr = SecretManager(self.environment)
            
            if self.environment in ['prod', 'production']:
                host = secret_mgr.get_secret('db-host')
                port = int(secret_mgr.get_secret('db-port'))
                user = secret_mgr.get_secret('db-user')
                password = secret_mgr.get_secret('db-password')
                database = secret_mgr.get_secret('db-name')
                ssl_ca = secret_mgr.get_secret('db-ssl-ca')
            else:
                # For local/preprod, use simplified config
                host = secret_mgr.get_secret('url').split('//')[1].split(':')[0] if '//' in secret_mgr.get_secret('url') else 'localhost'
                port = 3306
                user = secret_mgr.get_secret('username')
                password = secret_mgr.get_secret('password')
                database = secret_mgr.get_secret('url').split('/')[-1].split('?')[0] if '/' in secret_mgr.get_secret('url') else 'perundhu'
                ssl_ca = None
            
            return DatabaseConfig(
                host=host,
                port=port,
                user=user,
                password=password,
                database=database,
                ssl_ca=ssl_ca
            )
        except Exception as e:
            logger.error(f"Failed to load database config: {e}")
            raise
    
    def connect(self):
        """Establish database connection"""
        try:
            connection_params = {
                'host': self.config.host,
                'port': self.config.port,
                'user': self.config.user,
                'password': self.config.password,
                'database': self.config.database
            }
            
            if self.config.ssl_ca:
                connection_params['ssl_ca'] = self.config.ssl_ca
                connection_params['ssl_verify_cert'] = True
            
            self.connection = mysql.connector.connect(**connection_params)
            self.cursor = self.connection.cursor(dictionary=True)
            logger.info(f"Connected to database: {self.config.database}")
        except MySQLError as e:
            logger.error(f"Database connection failed: {e}")
            raise
    
    def disconnect(self):
        """Close database connection"""
        if self.cursor:
            self.cursor.close()
        if self.connection:
            self.connection.close()
        logger.info("Database connection closed")
    
    def create_translation(self, entity_type: str, entity_id: int, field_name: str, english_text: str, tamil_text: str):
        """Create translation entry in database"""
        try:
            query = """
                INSERT INTO translations 
                (entity_type, entity_id, language_code, field_name, translated_value, created_at, updated_at)
                VALUES (%s, %s, %s, %s, %s, NOW(), NOW())
                ON DUPLICATE KEY UPDATE
                translated_value = VALUES(translated_value),
                updated_at = NOW()
            """
            self.cursor.execute(query, (
                entity_type,
                entity_id,
                'ta',  # Tamil language code
                field_name,
                tamil_text
            ))
            self.stats['translations_created'] += 1
            logger.debug(f"Created translation: {entity_type}({entity_id}).{field_name} = {tamil_text}")
        except MySQLError as e:
            logger.warning(f"Failed to create translation: {e}")
    
    def translate_and_store(self, text: str, entity_type: str, entity_id: int, field_name: str = 'name') -> Optional[str]:
        """Translate text to Tamil and store in database"""
        if not text or not self.translator:
            return None
        
        # Check cache first
        cache_key = f"{entity_type}:{entity_id}:{field_name}"
        if cache_key in self.translation_cache:
            return self.translation_cache[cache_key]
        
        # Translate
        tamil_text = self.translator.translate_location(text)
        
        if tamil_text:
            # Store in database
            self.create_translation(entity_type, entity_id, field_name, text, tamil_text)
            self.translation_cache[cache_key] = tamil_text
            return tamil_text
        
        return None
    
    def _find_similar_location(self, name: str) -> Optional[int]:
        """Find similar location using fuzzy matching to prevent duplicates"""
        name_lower = name.lower().strip()
        
        # Check exact cache match first
        if name_lower in self.location_cache:
            return self.location_cache[name_lower]
        
        # Query existing locations
        query = "SELECT id, name FROM locations WHERE category = %s"
        self.cursor.execute(query, (self.operator_config['category'],))
        locations = self.cursor.fetchall()
        
        # Find best match using difflib
        best_match = None
        best_ratio = 0.0
        
        for loc in locations:
            ratio = difflib.SequenceMatcher(None, name_lower, loc['name'].lower().strip()).ratio()
            if ratio > best_ratio:
                best_ratio = ratio
                best_match = loc
        
        # Return match if above threshold
        if best_match and best_ratio >= self.LOCATION_SIMILARITY_THRESHOLD:
            logger.debug(f"Found similar location: '{name}' -> '{best_match['name']}' (match: {best_ratio:.2%})")
            self.location_cache[name_lower] = best_match['id']
            return best_match['id']
        
        return None
    
    def get_or_create_location(self, name: str, location_type: str = 'bus_stop') -> int:
        """Get existing location or create new one with duplicate prevention"""
        # Check for similar location first
        location_id = self._find_similar_location(name)
        if location_id:
            self.stats['locations_skipped'] += 1
            return location_id
        
        # Create new location
        try:
            query = """
                INSERT INTO locations (name, category, type, latitude, longitude, created_at, updated_at)
                VALUES (%s, %s, %s, %s, %s, NOW(), NOW())
            """
            self.cursor.execute(query, (
                name.strip(),
                self.operator_config['category'],
                location_type,
                None,  # Latitude (to be added later)
                None   # Longitude (to be added later)
            ))
            location_id = self.cursor.lastrowid
            
            # Translate location name to Tamil and store
            if self.translator:
                tamil_name = self.translator.translate_location(name)
                if tamil_name:
                    self.create_translation('location', location_id, 'name', name, tamil_name)
            
            # Update cache
            self.location_cache[name.lower().strip()] = location_id
            self.stats['locations_created'] += 1
            logger.info(f"Created location: {name} (ID: {location_id})")
            
            return location_id
        except MySQLError as e:
            logger.error(f"Failed to create location '{name}': {e}")
            raise
    
    def create_bus(self, route_data: Dict) -> int:
        """Create bus entry in database"""
        try:
            # Extract bus details
            route_number = route_data.get('route_number', '').strip()
            origin = route_data.get('origin', '').strip()
            destination = route_data.get('destination', '').strip()
            
            if not all([route_number, origin, destination]):
                raise ValueError(f"Missing required bus data: {route_data}")
            
            # Get or create origin and destination locations
            origin_location_id = self.get_or_create_location(origin, 'bus_terminal')
            destination_location_id = self.get_or_create_location(destination, 'bus_terminal')
            
            # Create bus entry
            query = """
                INSERT INTO buses (route_number, origin_location_id, destination_location_id, 
                                   operator, created_at, updated_at)
                VALUES (%s, %s, %s, %s, NOW(), NOW())
            """
            self.cursor.execute(query, (
                route_number,
                origin_location_id,
                destination_location_id,
                self.operator_config['category']
            ))
            bus_id = self.cursor.lastrowid
            self.stats['buses_created'] += 1
            
            logger.info(f"Created bus: {route_number} ({origin} → {destination}) [ID: {bus_id}]")
            return bus_id
        except MySQLError as e:
            logger.error(f"Failed to create bus: {e}")
            raise
    
    def create_stops(self, bus_id: int, stops_data: List[Dict]):
        """Create stops for a bus route"""
        try:
            for stop_info in stops_data:
                stop_name = stop_info.get('name', '').strip()
                stop_order = stop_info.get('order', 0)
                arrival_time = stop_info.get('arrival_time')
                
                if not stop_name:
                    continue
                
                # Get or create stop location
                location_id = self.get_or_create_location(stop_name, 'bus_stop')
                
                # Create stop entry
                query = """
                    INSERT INTO stops (bus_id, location_id, stop_order, arrival_time, 
                                       created_at, updated_at)
                    VALUES (%s, %s, %s, %s, NOW(), NOW())
                """
                self.cursor.execute(query, (bus_id, location_id, stop_order, arrival_time))
                self.stats['stops_created'] += 1
            
            logger.debug(f"Created {len(stops_data)} stops for bus ID {bus_id}")
        except MySQLError as e:
            logger.error(f"Failed to create stops: {e}")
            raise
    
    def generate_connecting_routes(self, bus_id: int, stops_data: List[Dict]):
        """Generate connecting routes between consecutive stops"""
        try:
            for i in range(len(stops_data) - 1):
                from_stop = stops_data[i]
                to_stop = stops_data[i + 1]
                
                from_location_id = self.get_or_create_location(from_stop.get('name', ''), 'bus_stop')
                to_location_id = self.get_or_create_location(to_stop.get('name', ''), 'bus_stop')
                
                # Calculate travel time if arrival times are available
                travel_time_minutes = None
                if from_stop.get('arrival_time') and to_stop.get('arrival_time'):
                    try:
                        from_time = datetime.strptime(from_stop['arrival_time'], '%H:%M')
                        to_time = datetime.strptime(to_stop['arrival_time'], '%H:%M')
                        travel_time_minutes = int((to_time - from_time).total_seconds() / 60)
                    except ValueError:
                        pass
                
                # Insert connecting route
                query = """
                    INSERT INTO connecting_routes 
                    (from_location_id, to_location_id, bus_id, travel_time_minutes, 
                     created_at, updated_at)
                    VALUES (%s, %s, %s, %s, NOW(), NOW())
                """
                self.cursor.execute(query, (
                    from_location_id,
                    to_location_id,
                    bus_id,
                    travel_time_minutes
                ))
                self.stats['connecting_routes_created'] += 1
            
            logger.debug(f"Created {len(stops_data) - 1} connecting routes for bus ID {bus_id}")
        except MySQLError as e:
            logger.error(f"Failed to create connecting routes: {e}")
            raise
    
    def upload_timings(self, timings_data: List[Dict]):
        """Upload all bus timings data with transaction support"""
        if not timings_data:
            logger.warning("No timings data to upload")
            return
        
        logger.info(f"Starting upload of {len(timings_data)} routes...")
        
        try:
            # Start transaction
            self.connection.start_transaction()
            
            for idx, route_data in enumerate(timings_data, 1):
                try:
                    # Create bus entry
                    bus_id = self.create_bus(route_data)
                    
                    # Create stops
                    stops_data = route_data.get('stops', [])
                    if stops_data:
                        self.create_stops(bus_id, stops_data)
                        
                        # Generate connecting routes
                        self.generate_connecting_routes(bus_id, stops_data)
                    
                    if idx % 100 == 0:
                        logger.info(f"Progress: {idx}/{len(timings_data)} routes processed")
                
                except Exception as e:
                    logger.error(f"Error processing route {idx}: {e}")
                    self.stats['errors'] += 1
                    continue
            
            # Commit transaction
            self.connection.commit()
            logger.info("Transaction committed successfully")
        
        except Exception as e:
            logger.error(f"Critical error during upload: {e}")
            if self.connection:
                self.connection.rollback()
                logger.warning("Transaction rolled back")
            raise
    
    def load_checkpoint_data(self) -> List[Dict]:
        """Load data from checkpoint JSON file"""
        checkpoint_file = Path(self.operator_config['checkpoint_file'])
        
        if not checkpoint_file.exists():
            raise FileNotFoundError(f"Checkpoint file not found: {checkpoint_file}")
        
        logger.info(f"Loading data from: {checkpoint_file}")
        
        with open(checkpoint_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        timings_data = data.get(self.operator_config['data_key'], [])
        logger.info(f"Loaded {len(timings_data)} routes from checkpoint")
        
        return timings_data
    
    def print_stats(self):
        """Print upload statistics"""
        logger.info("=" * 60)
        logger.info("Upload Statistics:")
        logger.info(f"  Operator: {self.operator_config['display_name']}")
        logger.info(f"  Locations Created: {self.stats['locations_created']}")
        logger.info(f"  Locations Skipped (duplicates): {self.stats['locations_skipped']}")
        logger.info(f"  Buses Created: {self.stats['buses_created']}")
        logger.info(f"  Stops Created: {self.stats['stops_created']}")
        logger.info(f"  Connecting Routes Created: {self.stats['connecting_routes_created']}")
        logger.info(f"  Tamil Translations Created: {self.stats['translations_created']}")
        logger.info(f"  Errors: {self.stats['errors']}")
        logger.info("=" * 60)
    
    def run(self):
        """Main execution flow"""
        try:
            # Load data
            timings_data = self.load_checkpoint_data()
            
            # Connect to database
            self.connect()
            
            # Upload data
            self.upload_timings(timings_data)
            
            # Print statistics
            self.print_stats()
            
            logger.info(f"✅ Upload completed successfully for {self.operator}")
        
        except Exception as e:
            logger.error(f"Upload failed: {e}")
            self.stats['errors'] += 1
            raise
        
        finally:
            self.disconnect()


def main():
    """CLI entry point"""
    parser = argparse.ArgumentParser(
        description='Generic Bus Timings Data Upload Script',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python scripts/upload_bus_data.py --operator MTC --environment local
  python scripts/upload_bus_data.py --operator TNSTC --environment preprod
  python scripts/upload_bus_data.py --operator MTC --environment prod
        """
    )
    
    parser.add_argument(
        '--operator',
        type=str,
        default='MTC',
        choices=list(BusDataUploader.OPERATOR_CONFIGS.keys()),
        help='Bus operator (default: MTC)'
    )
    
    parser.add_argument(
        '--environment',
        type=str,
        default='local',
        choices=['local', 'preprod', 'prod', 'production'],
        help='Environment (default: local)'
    )
    
    parser.add_argument(
        '--dry-run',
        action='store_true',
        help='Validate data without uploading to database'
    )
    
    parser.add_argument(
        '--enable-translation',
        action='store_true',
        help='Enable Tamil language translation for locations'
    )
    
    args = parser.parse_args()
    
    try:
        logger.info(f"Starting {args.operator} data upload to {args.environment} environment")
        
        if args.dry_run:
            logger.info("DRY RUN MODE - No data will be uploaded")
            # TODO: Implement dry-run validation
            return
        
        uploader = BusDataUploader(environment=args.environment, operator=args.operator)
        
        # Disable translator if not enabled
        if not args.enable_translation:
            uploader.translator = None
            logger.info("Tamil translation disabled (use --enable-translation to enable)")
        
        uploader.run()
        
        sys.exit(0)
    
    except Exception as e:
        logger.error(f"Fatal error: {e}")
        sys.exit(1)


if __name__ == '__main__':
    main()
