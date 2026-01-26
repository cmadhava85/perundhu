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
from typing import Dict, List, Optional, Tuple
from datetime import datetime
from dataclasses import dataclass
import mysql.connector
from mysql.connector import Error as MySQLError
import difflib
import argparse

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('logs/mtc_upload.log'),
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
        self.stats = {
            'locations_created': 0,
            'locations_skipped': 0,
            'buses_created': 0,
            'stops_created': 0,
            'connecting_routes_created': 0,
            'errors': 0
        }
        
        logger.info(f"Initialized uploader for {self.operator_config['display_name']}")
    
    def _load_config(self) -> DatabaseConfig:
        """Load database configuration based on environment"""
        logger.info(f"Loading configuration for environment: {self.environment}")
        
        secret_manager = SecretManager(self.environment)
        
        if self.environment in ['prod', 'production']:
            return DatabaseConfig(
                host=secret_manager.get_secret("production-db-url").split("://")[1].split(":")[0],
                port=int(os.getenv('DB_PORT', '3306')),
                user=secret_manager.get_secret("production-db-username"),
                password=secret_manager.get_secret("production-db-password"),
                database="perundhu",
                ssl_ca=os.getenv('DB_SSL_CA')
            )
        elif self.environment == 'preprod':
            return DatabaseConfig(
                host=os.getenv('PREPROD_DB_HOST', 'preprod-db.example.com'),
                port=int(os.getenv('PREPROD_DB_PORT', '3306')),
                user=os.getenv('PREPROD_DB_USER', 'perundhu_user'),
                password=os.getenv('PREPROD_DB_PASSWORD', 'perundhu_password'),
                database="perundhu_preprod"
            )
        else:  # local
            return DatabaseConfig(
                host=os.getenv('LOCAL_DB_HOST', 'localhost'),
                port=int(os.getenv('LOCAL_DB_PORT', '3306')),
                user=os.getenv('LOCAL_DB_USER', 'perundhu_user'),
                password=os.getenv('LOCAL_DB_PASSWORD', 'perundhu_password'),
                database="perundhu"
            )
    
    def connect(self) -> bool:
        """Establish database connection"""
        try:
            logger.info(f"Connecting to {self.environment} database at {self.config.host}:{self.config.port}")
            
            self.connection = mysql.connector.connect(
                host=self.config.host,
                port=self.config.port,
                user=self.config.user,
                password=self.config.password,
                database=self.config.database,
                autocommit=False,
                ssl_disabled=(self.config.ssl_ca is None)
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
    
    def _find_similar_location(self, location_name: str) -> Optional[int]:
        """Find existing location with similar name (fuzzy matching + alias support)"""
        try:
            # 1. Try exact match on location name
            query = "SELECT id FROM locations WHERE UPPER(name) = UPPER(%s)"
            self.cursor.execute(query, (location_name,))
            result = self.cursor.fetchone()
            if result:
                return result['id']
            
            # 2. Try exact match on alias (handles: BROADWAY → Broadway Bus Terminus)
            query = "SELECT location_id FROM location_aliases WHERE UPPER(alias_name) = UPPER(%s)"
            self.cursor.execute(query, (location_name,))
            result = self.cursor.fetchone()
            if result:
                return result['location_id']
            
            # 3. Try fuzzy match on location names
            query = "SELECT id, name FROM locations WHERE name LIKE %s"
            self.cursor.execute(query, (f"%{location_name[:20]}%",))
            results = self.cursor.fetchall()
            
            for result in results:
                similarity = difflib.SequenceMatcher(None, 
                    location_name.lower(), 
                    result['name'].lower()
                ).ratio()
                
                if similarity >= self.LOCATION_SIMILARITY_THRESHOLD:
                    logger.debug(f"Found similar location: '{result['name']}' (~{similarity*100:.0f}%)")
                    return result['id']
            
            # 4. Try fuzzy match on aliases
            query = "SELECT location_id, alias_name FROM location_aliases WHERE alias_name LIKE %s"
            self.cursor.execute(query, (f"%{location_name[:20]}%",))
            results = self.cursor.fetchall()
            
            for result in results:
                similarity = difflib.SequenceMatcher(None, 
                    location_name.lower(), 
                    result['alias_name'].lower()
                ).ratio()
                
                if similarity >= self.LOCATION_SIMILARITY_THRESHOLD:
                    logger.debug(f"Found via alias: '{result['alias_name']}' (~{similarity*100:.0f}%)")
                    return result['location_id']
            
            return None
        
        except Exception as e:
            logger.error(f"Error finding similar location for '{location_name}': {e}")
            return None
    
    def get_or_create_location(self, name: str, latitude: Optional[float] = None, 
                              longitude: Optional[float] = None) -> int:
        """Get existing location ID or create new one"""
        
        # Check cache first
        if name in self.location_cache:
            return self.location_cache[name]
        
        # Check for similar location
        similar_id = self._find_similar_location(name)
        if similar_id:
            logger.info(f"Using existin
                   departure_time: Optional[str] = None, 
                   arrival_time: Optional[str] = None) -> int:
        """Create or get bus record"""
        try:
            category = self.operator_config['category']
            
            # Check if bus already exists (including category in check)
            check_query = """
                SELECT id FROM buses 
                WHERE bus_number = %s 
                  AND from_location_id = %s 
                  AND to_location_id = %s
                  AND category = %s
            """
            self.cursor.execute(check_query, (route_number, from_location_id, to_location_id, category))
            result = self.cursor.fetchone()
            
            if result:
                logger.debug(f"Bus route {route_number} ({category}) already exists (ID: {result['id']})")
                return result['id']
            
            # Create new bus with timing information
            insert_query = """
                INSERT INTO buses 
                (bus_number, from_location_id, to_location_id, departure_time, arrival_time, 
                 category, active, created_at, updated_at)
                VALUES (%s, %s, %s, %s, %s, %s, TRUE, NOW(), NOW())
            """
            self.cursor.execute(insert_query, 
                (route_number, from_location_id, to_location_id, 
                 departure_time, arrival_time, category))
            self.connection.commit()
            
            bus_id = self.cursor.lastrowid
            self.stats['buses_created'] += 1
            logger.debug(f"Created {category}d"""
        try:
            # Check if bus already exists
            check_query = """
                SELECT id FROM buses 
                WHERE bus_number = %s AND from_location_id = %s AND to_location_id = %s
            """
            self.cursor.execute(check_query, (route_number, from_location_id, to_location_id))
            result = self.cursor.fetchone()
            
            if result:
                return result['id']
            
            # Create new bus with timing information
            insert_query = """
                INSERT INTO buses 
                (bus_number, from_location_id, to_location_id, departure_time, arrival_time, 
                 category, active, created_at, updated_at)
                VALUES (%s, %s, %s, %s, %s, %s, TRUE, NOW(), NOW())
            """
            self.cursor.execute(insert_query, 
                (route_number, from_location_id, to_location_id, 
                 departure_time, arrival_time, category))
            self.connection.commit()
            
            bus_id = self.cursor.lastrowid
            self.stats['buses_created'] += 1
            logger.debug(f"Created bus route {route_number} with timing {departure_time}-{arrival_time} (ID: {bus_id})")
            
            return bus_id
        
        except MySQLError as e:
            logger.error(f"Error creating bus: {e}")
            self.connection.rollback()
            raise
    
    def create_stops(self, bus_id: int, stops_list: List[Dict]) -> List[int]:
        """Create stop records for a bus"""
        stop_ids = []
        
        try:
            for idx, stop in enumerate(stops_list, 1):
                location_id = self.get_or_create_location(
                    stop.get('name', f'Stop {idx}'),
                    stop.get('latitude'),
                    stop.get('longitude')
                )
                
                insert_query = """
                    INSERT INTO stops 
                    (name, bus_id, location_id, arrival_time, departure_time, 
                     stop_order, created_at, updated_at)
                    VALUES (%s, %s, %s, %s, %s, %s, NOW(), NOW())
                """
                self.cursor.execute(insert_query, 
                    (stop.get('name', f'Stop {idx}'), bus_id, location_id, 
                     stop.get('arrival_time'), stop.get('departure_time'), idx))
                
                stop_ids.append(self.cursor.lastrowid)
            
            self.connection.commit()
            self.stats['stops_created'] += len(stop_ids)
            logger.debug(f"Created {len(stop_ids)} stops for bus {bus_id}")
            
            return stop_ids
        
        except MySQLError as e:
            logger.error(f"Error creating stops: {e}")
            self.connection.rollback()
            raise
    
    def generate_connecting_routes(self, operator_specific: bool = False) -> bool:
        """
        Analyze uploaded buses and generate connecting routes.
        Finds locations where one bus ends and another bus starts.
        
        Args:
            operator_specific: If True, only creates connections within same operator
        
        Example:
        - Bus 1: Tambaram → Koyambedu (to_location_id = Koyambedu)
        - Bus 2: Koyambedu → Manali (from_location_id = Koyambedu)
        - Creates: connecting_route (Bus 1 → Bus 2 at Koyambedu)
        """
        logger.info(
            f"Analyzing buses for connecting routes "
            if operator_specific:
                category = self.operator_config['category']
                query = """
                    SELECT 
                        b1.id as first_bus_id,
                        b1.bus_number as first_bus_number,
                        b1.category as first_bus_category,
                        b2.id as second_bus_id,
                        b2.bus_number as second_bus_number,
                        b2.category as second_bus_category,
                        b1.to_location_id as connection_point_id,
                        l.name as connection_point_name
                    FROM buses b1
                    JOIN buses b2 ON b1.to_location_id = b2.from_location_id
                    JOIN locations l ON b1.to_location_id = l.id
                    WHERE b1.id != b2.id
                      AND b2.active = TRUE
                      AND b1.category = %s
                      AND b2.category = %s
                """
                self.cursor.execute(query, (category, category))
            else:
                query = """
                    SELECT 
                        b1.id as first_bus_id,
                        b1.bus_number as first_bus_number,
                        b1.category as first_bus_category,
                        b2.id as second_bus_id,
                        b2.bus_number as second_bus_number,
                        b2.category as second_bus_category,
                        b1.to_location_id as connection_point_id,
                        l.name as connection_point_name
                    FROM buses b1
                    JOIN buses b2 ON b1.to_location_id = b2.from_location_id
                    JOIN locations l ON b1.to_location_id = l.id
                    WHERE b1.id != b2.id
                      AND b1.active = TRUE
                      AND b2.active = TRUE
                """
                self.cursor.execute(query) FROM buses b1
                JOIN buses b2 ON b1.to_location_id = b2.from_location_id
                JOIN locations l ON b1.to_location_id = l.id
                WHERE b1.id != b2.id
                  AND b1.active = TRUE
                  AND b2.active = TRUE
            """
            
            self.cursor.execute(query)
            potential_connections = self.cursor.fetchall()
            
            logger.info(f"Found {len(potential_connections)} potential connecting routes")
            
            # Insert connecting routes (avoid duplicates)
            inserted = 0
            for conn in potential_connections:
                try:
                    # Check if already exists
                    check_query = """
                        SELECT id FROM connect{conn.get('first_bus_category', 'N/A')} "
                        f"Bus {conn['first_bus_number']} → "
                        f"{conn.get('second_bus_category', 'N/A')}
                        WHERE first_bus_id = %s 
                          AND second_bus_id = %s 
                          AND connection_point_id = %s
                    """
                    self.cursor.execute(check_query, (
                        conn['first_bus_id'],
                        conn['second_bus_id'],
                        conn['connection_point_id']
                    ))
                    
                    if self.cursor.fetchone():
                        continue  # Already exists
                    
                    # Insert new connecting route
                    insert_query = """
                        INSERT INTO connecting_routes 
                        (first_bus_id, second_bus_id, connection_point_id, 
                         wait_time_minutes, created_at, updated_at)
                        VALUES (%s, %s, %s, %s, NOW(), NOW())
                    """
                    # Default wait time: 15 minutes (can be updated later)
                    self.cursor.execute(insert_query, (
                        conn['first_bus_id'],
                        conn['second_bus_id'],
                        conn['connection_point_id'],
                        15  # Default wait time
                    ))
                    
                    inserted += 1
                    logger.debug(
                        f"Created connection: Bus {conn['first_bus_number']} → "
                        f"Bus {conn['second_bus_number']} at {conn['connection_point_name']}"
                    )
                    
                except MySQLError as e:
                    logger.error(f"Error creating connecting route: {e}")
                    continue
            
            self.connection.commit()
            self.stats['connecting_routes_created'] = inserted
            logger.info(f"✓ Created {inserted} connecting routes")
            
            return True
            
        except MySbus timing data to database"""
        
        logger.info(
            f"Starting upload of {len(timings_data)} {self.operator} timing records"
        
            return False
    
    def upload_timings(self, timings_data: List[Dict]) -> bool:
        """Upload MTC timing data to database"""
        
        logger.info(f"Starting upload of {len(timings_data)} timing records")
        
        try:
            for timing in timings_data:
                try:
                    route_number = timing.get('route_number', 'UNKNOWN')
                    origin = timing.get('origin_value')
                    destination = timing.get('destination_value')
                    timing_str = timing.get('timing', '')
                    
                    if not origin or not destination:
                        logger.warning(f"Skipping timing without origin/destination: {timing}")
                        continue
                    
                    # Parse timing if available (e.g., "06:00-23:00")
                    departure_time = None
                    arrival_time = None
                    if timing_str and '-' in timing_str:
                        times = timing_str.split('-')
                        if len(times) == 2:
                            departure_time = times[0].strip()
                            arrival_time = times[1].strip()
                    
                    # Get or create locations
                    from_location_id = self.get_or_create_location(origin)
                    to_location_id = self.get_or_create_location(destination)
                    
                    # Create bus route with timing
                    bus_id = self.create_bus(route_number, from_location_id, to_location_id,
                                            departure_time=departure_time, arrival_time=arrival_time)
                    
                    # Create stops for origin and destination (minimum required)
                    stops_data = [
                        {'name': origin, 'arrival_time': departure_time, 'departure_time': departure_time},
                        {'name': destination, 'arrival_time': arrival_time, 'departure_time': arrival_time}
                    ]
                    self.create_stops(bus_id, stops_data)
                    
                except Exception as e:
                    logger.error(f"Error processing timing {timing}: {e}")
                    self.stats['errors'] += 1
                    continue
            
            logger.info("✓ Timing data upload complete")
            return True
        , custom_checkpoint: Optional[str] = None) -> List[Dict]:
        """
        Load timing data from checkpoint file
        
        Args:
            custom_checkpoint: Optional path to custom checkpoint file
        
        Returns:
            List of timing records
        """
        if custom_checkpoint:
            checkpoint_file = Path(custom_checkpoint)
        else:
            checkpoint_file = Path(self.operator_config['checkpoint_file'])
        
        if not checkpoint_file.exists():
            logger.error(f"Checkpoint file not found: {checkpoint_file}")
            logger.info(f"Expected file at: {checkpoint_file.absolute()}")
            return []
        
        try:
            with open(checkpoint_file, 'r') as f:
                data = json.load(f)
            
            # Get data using operator-specific key
            data_key = self.operator_config['data_key']
            timings = data.get(data_key, []), 
            operator_specific_connections: bool = False,
            custom_checkpoint: Optional[str] = None) -> bool:
        """
        Execute the upload process
        
        Args:
            generate_connections: Whether to generate connecting routes
            operator_specific_connections: Only create connections within same operator
            custom_checkpoint: Optional path to custom checkpoint file
        """
        try:
            if not self.connect():
                return False
            
            # Load checkpoint data
            timings_data = self.load_checkpoint_data(custom_checkpoint)
            if not timings_data:
                logger.error("No timing data to upload")
                return False
            
            # Upload data
            success = self.upload_timings(timings_data)
            
            if not success:
                return False
            
            # Generate connecting routes after upload
            if generate_connections:
                logger.info("\nPhase 2: Generating connecting routes...")
                self.generate_connecting_routes(operator_specific_connections
        logger.info("\n" + "="*60)
        logger.info("UPLOAD STATISTICS")
        logger.info("="*60)
        logger.info(f"Locations created: {self.stats['locations_created']}")
        logger.info(f"Locations skipped (duplicates): {self.stats['locations_skipped']}")
        logger.info(fGeneric bus data upload script (supports MTC, TNSTC, etc.)',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Upload MTC data to local database
  python scripts/upload_mtc_data.py --operator MTC --environment local

  # Upload TNSTC data to preprod
  python scripts/upload_mtc_data.py --operator TNSTC --environment preprod

  # Upload with custom checkpoint file
  python scripts/upload_mtc_data.py --operator MTC --checkpoint data/custom_data.json

  # Upload to production with operator-specific connections only
  python scripts/upload_mtc_data.py --operator MTC --environment prod --operator-connections

  # Skip connection generation
  python scripts/upload_mtc_data.py --operator TNSTC --skip-connections
        """
    )
    
    parser.add_argument('--operator', '-o',
                       choices=['MTC', 'TNSTC', 'mtc', 'tnstc'],
                       default='MTC',
                       help='Bus operator (default: MTC)')
    
    parser.add_argument('--environment', '-e',
                       choices=['local', 'preprod', 'prod', 'production'],
                       default='local',
                       help='Target environment (default: local)')
    
    parser.add_argument('--checkpoint', '-c',
                       type=str,
                       help='Path to custom checkpoint file (overrides default)')
    
    parser.add_argument('--skip-connections', 
                       action='store_true',
                       help='Skip automatic generation of connecting routes')
    
    parser.add_argument('--operator-connections',
                       action='store_true',
                       help='Generate connections only within same operator (e.g., MTC to MTC only)')
    
    parser.add_argument('--verbose', '-v', 
                       action='store_true',
                       help='Enable verbose logging')
    
    args = parser.parse_args()
    
    if args.verbose:
        logger.setLevel(logging.DEBUG)
    
    # Display configuration
    logger.info("="*60)
    logger.info("BUS DATA UPLOAD CONFIGURATION")
    logger.info("="*60)
    logger.info(f"Operator: {args.operator.upper()}")
    logger.info(f"Environment: {args.environment}")
    logger.info(f"Custom checkpoint: {args.checkpoint or 'No (using default)'}")
    logger.info(f"Generate connections: {'No' if args.skip_connections else 'Yes'}")
    logger.info(f"Connection scope: {'Operator-specific' if args.operator_connections else 'Cross-operator'}")
    logger.info("="*60 + "\n")
    
    # Run upload
    try:
        uploader = BusDataUploader(args.environment, args.operator)
        success = uploader.run(
            generate_connections=not args.skip_connections,
            operator_specific_connections=args.operator_connections,
            custom_checkpoint=args.checkpoint
        )
        
        sys.exit(0 if success else 1)
    
    except ValueError as e:
        logger.error(f"Configuration error: {e}")
        sys.exit(1)
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        sys.exit(
        finally:
            self.disconnect()


def main():
    parser = argparse.ArgumentParser(
        description='Upload MTC scraped data to MySQL database',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Upload to local database
  python scripts/upload_mtc_data.py --environment local

  # Upload to preprod
  python scripts/upload_mtc_data.py --environment preprod

  # Upload to production
  python scripts/upload_mtc_data.py --environment prod
        """
    )
    parser.add_argument('--skip-connections', 
                       action='store_true',
                       help='Skip automatic generation of connecting routes')
    
    parser.add_argument('--environment', 
                       choices=['local', 'preprod', 'prod', 'production'],
                       default='local',
                       help='Target environment (default: local)')
    parser.add_argument('--verbose', '-v', 
                       action='store_true',
                       help='Enable verbose logging')
    
    args = parser.parse_args()
    
    if args.verbose:
        logger.setLevel(logging.DEBUG)
    
    # Run upload
    uploader = MTCDataUploader(args.environment)
    success = uploader.run(generate_connections=not args.skip_connections)
    
    sys.exit(0 if success else 1)


if __name__ == '__main__':
    main()
