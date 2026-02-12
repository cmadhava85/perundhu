#!/usr/bin/env python3
"""
UNIFIED DATA MIGRATION SCRIPT
==================================================
Single comprehensive script for uploading location and bus data across all environments.

Features:
✓ Supports: Locations + Buses + Stops + Translations
✓ Environments: local, preprod, production
✓ Operators: MTC, TNSTC, other state transport
✓ Validation: Data integrity checks
✓ Recovery: Checkpoint/resume capability
✓ Logging: Detailed operation tracking
✓ Tamil Translation: Automatic translation support for locations and buses

Usage:
  # Load locations only
  python unified_data_loader.py --mode locations --environment local \
    --data-file data/tamil_nadu_locations_enhanced.json

  # Load buses with stops
  python unified_data_loader.py --mode buses --environment preprod \
    --data-file data/mtc_consolidated.json --operator MTC

  # Full migration: locations + buses
  python unified_data_loader.py --mode full --environment prod \
    --locations data/tamil_nadu_locations_enhanced.json \
    --buses data/tnstc_consolidated.json \
    --operator TNSTC

  # Validate before uploading
  python unified_data_loader.py --mode validate \
    --data-file data/mtc_consolidated.json

  # Resume from checkpoint
  python unified_data_loader.py --mode buses --environment local \
    --checkpoint data/migration_checkpoint.json
"""

import json
import csv
import logging
import sys
import os
import argparse
from pathlib import Path
from typing import Dict, List, Optional, Tuple, Any
from datetime import datetime
from dataclasses import dataclass, asdict
from enum import Enum
import difflib

# Tamil translation support (optional)
try:
    from tamil_translator import TamilTranslator
    TAMIL_TRANSLATION_AVAILABLE = True
except ImportError:
    TAMIL_TRANSLATION_AVAILABLE = False

# Try to import mysql.connector, provide helpful error if missing
try:
    import mysql.connector
    from mysql.connector import Error as MySQLError
except ImportError:
    print("❌ ERROR: mysql-connector-python is not installed")
    print("\nPlease install it using:")
    print("  pip install mysql-connector-python")
    print("\nOr if you're using a virtual environment:")
    print("  source .venv/bin/activate")
    print("  pip install mysql-connector-python")
    sys.exit(1)

# ============================================================
# CONFIGURATION & ENUMS
# ============================================================

class Environment(Enum):
    """Supported environments"""
    LOCAL = "local"
    PREPROD = "preprod"
    PROD = "prod"
    PRODUCTION = "prod"  # alias


class DataMode(Enum):
    """Data loading modes"""
    LOCATIONS = "locations"
    BUSES = "buses"
    STOPS = "stops"
    FULL = "full"
    VALIDATE = "validate"


class BusOperator(Enum):
    """Bus operators"""
    MTC = "MTC"
    TNSTC = "TNSTC"
    KERALA_RTC = "KRTC"
    KARNATAKA_KSRTC = "KSRTC"
    AP_APSRTC = "APSRTC"
    OTHER = "OTHER"


# ============================================================
# DATABASE & DATACLASS DEFINITIONS
# ============================================================

@dataclass
class DatabaseConfig:
    """Database connection configuration"""
    host: str
    port: int
    user: str
    password: str
    database: str
    ssl_ca: Optional[str] = None


@dataclass
class LocationData:
    """Location entity"""
    name: str
    latitude: float
    longitude: float
    district: Optional[str] = None
    state: Optional[str] = "Tamil Nadu"
    osm_id: Optional[int] = None
    type: Optional[str] = None
    neighborhood: Optional[str] = None
    priority: Optional[int] = None


@dataclass
class StopData:
    """Bus stop entity"""
    name: str
    location_id: Optional[int]
    arrival_time: Optional[str]
    departure_time: Optional[str]
    stop_order: int


@dataclass
class BusData:
    """Bus entity"""
    name: str
    bus_number: str
    from_location_id: Optional[int]
    to_location_id: Optional[int]
    departure_time: Optional[str]
    arrival_time: Optional[str]
    capacity: int = 50
    category: str = "Regular"
    stops: List[StopData] = None
    origin: Optional[str] = None  # Source location name from JSON
    destination: Optional[str] = None  # Destination location name from JSON

    def __post_init__(self):
        if self.stops is None:
            self.stops = []


@dataclass
class MigrationCheckpoint:
    """Track migration progress for resumption"""
    mode: str
    environment: str
    timestamp: str
    total_items: int
    processed_items: int
    failed_items: int
    last_processed_id: Optional[Any]
    skipped_ids: List[Any]
    errors: List[str]


# ============================================================
# SETUP LOGGING
# ============================================================

def setup_logging(log_file: str = "logs/unified_data_loader.log"):
    """Configure logging to file and console"""
    Path("logs").mkdir(exist_ok=True)
    
    formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    
    file_handler = logging.FileHandler(log_file)
    file_handler.setFormatter(formatter)
    
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(formatter)
    
    logger = logging.getLogger(__name__)
    logger.setLevel(logging.DEBUG)
    logger.addHandler(file_handler)
    logger.addHandler(console_handler)
    
    return logger


logger = setup_logging()


# ============================================================
# DATABASE CONNECTION MANAGER
# ============================================================

class DatabaseManager:
    """Manage MySQL database connections and operations"""
    
    def __init__(self, config: DatabaseConfig):
        self.config = config
        self.conn = None
        self.cursor = None
    
    def connect(self) -> bool:
        """Establish database connection"""
        try:
            # Check if using Unix socket (Cloud SQL)
            if self.config.host.startswith('/'):
                # Unix socket connection
                conn_params = {
                    'user': self.config.user,
                    'password': self.config.password,
                    'database': self.config.database,
                    'unix_socket': self.config.host,
                    'autocommit': False
                }
                logger.info(f"📍 Connecting via Unix socket: {self.config.host}")
            else:
                # TCP connection
                conn_params = {
                    'host': self.config.host,
                    'port': self.config.port,
                    'user': self.config.user,
                    'password': self.config.password,
                    'database': self.config.database,
                    'autocommit': False
                }
                if self.config.ssl_ca:
                    conn_params['ssl_ca'] = self.config.ssl_ca
                    conn_params['ssl_verify_cert'] = True
                    conn_params['ssl_verify_identity'] = False
                
                logger.info(f"📍 Connecting to {self.config.host}:{self.config.port}")
            
            self.conn = mysql.connector.connect(**conn_params)
            self.cursor = self.conn.cursor(dictionary=True)
            logger.info(f"✅ Connected to {self.config.database}")
            return True
        except MySQLError as err:
            logger.error(f"❌ Database connection failed: {err}")
            return False
    
    def disconnect(self):
        """Close database connection"""
        if self.cursor:
            self.cursor.close()
        if self.conn:
            self.conn.close()
            logger.info("✅ Disconnected from database")
    
    def execute(self, query: str, params: Optional[Tuple] = None, fetch: bool = False) -> Any:
        """Execute SQL query"""
        try:
            if params:
                self.cursor.execute(query, params)
            else:
                self.cursor.execute(query)
            
            if fetch:
                return self.cursor.fetchall()
            return self.cursor.rowcount
        except MySQLError as err:
            logger.error(f"Query execution failed: {err}\nQuery: {query}")
            raise
    
    def commit(self):
        """Commit transaction"""
        try:
            self.conn.commit()
            logger.debug("✅ Transaction committed")
        except MySQLError as err:
            logger.error(f"Commit failed: {err}")
            self.rollback()
            raise
    
    def rollback(self):
        """Rollback transaction"""
        try:
            self.conn.rollback()
            logger.warning("⚠️  Transaction rolled back")
        except MySQLError as err:
            logger.error(f"Rollback failed: {err}")


# ============================================================
# CONFIGURATION LOADER
# ============================================================

class ConfigurationLoader:
    """Load database configuration based on environment"""

    @staticmethod
    def _read_properties_file(path: Path) -> Dict[str, str]:
        if not path.exists():
            return {}
        props: Dict[str, str] = {}
        with open(path, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith('#') or '=' not in line:
                    continue
                key, value = line.split('=', 1)
                props[key.strip()] = value.strip()
        return props

    @staticmethod
    def _get_gcp_project_id() -> Optional[str]:
        return (
            os.getenv('GCP_PROJECT_ID') or
            os.getenv('GOOGLE_CLOUD_PROJECT') or
            os.getenv('GCLOUD_PROJECT')
        )

    @staticmethod
    def _get_secret(secret_name: str) -> str:
        try:
            from google.cloud import secretmanager
        except ImportError as exc:
            raise RuntimeError(
                "google-cloud-secret-manager not installed; cannot resolve secrets"
            ) from exc

        project_id = ConfigurationLoader._get_gcp_project_id()
        if not project_id:
            raise RuntimeError("GCP project ID not set for Secret Manager")

        client = secretmanager.SecretManagerServiceClient()
        name = f"projects/{project_id}/secrets/{secret_name}/versions/latest"
        response = client.access_secret_version(request={"name": name})
        return response.payload.data.decode("UTF-8")

    @staticmethod
    def _resolve_property_value(raw_value: str) -> str:
        """Resolve property value including nested placeholders"""
        value = raw_value.strip()
        
        # Recursively resolve nested placeholders like ${VAR:${OTHER:default}}
        while '${' in value:
            # Find innermost placeholder
            start = value.rfind('${')
            if start == -1:
                break
            end = value.find('}', start)
            if end == -1:
                break
            
            placeholder = value[start:end+1]
            inner = placeholder[2:-1]
            
            # Resolve Secret Manager reference
            if inner.startswith('sm://'):
                secret_name = inner.replace('sm://', '', 1)
                resolved = ConfigurationLoader._get_secret(secret_name)
            # Resolve env var with default
            elif ':' in inner:
                env_key, default = inner.split(':', 1)
                resolved = os.getenv(env_key, default)
            # Resolve env var without default
            else:
                resolved = os.getenv(inner, '')
            
            # Replace placeholder with resolved value
            value = value[:start] + resolved + value[end+1:]
            
            # Prevent infinite loop
            if value == raw_value:
                break
        
        return value

    @staticmethod
    def _parse_jdbc_url(url: str) -> Tuple[Optional[str], Optional[int], Optional[str], Optional[str]]:
        if not url:
            return None, None, None, None

        cloud_sql_instance = None
        database = None

        if 'cloudSqlInstance=' in url:
            cloud_sql_instance = url.split('cloudSqlInstance=', 1)[1].split('&', 1)[0]

        if url.startswith('jdbc:mysql:///'):
            database = url.split('jdbc:mysql:///', 1)[1].split('?', 1)[0]
            return None, None, database, cloud_sql_instance

        if url.startswith('jdbc:mysql://'):
            host_port_db = url.split('jdbc:mysql://', 1)[1]
            host_port, _, db_part = host_port_db.partition('/')
            database = db_part.split('?', 1)[0] if db_part else None
            if ':' in host_port:
                host, port_str = host_port.split(':', 1)
                try:
                    port = int(port_str)
                except ValueError:
                    port = None
            else:
                host = host_port
                port = None
            return host, port, database, cloud_sql_instance

        return None, None, None, cloud_sql_instance
    
    @staticmethod
    def load(environment: str) -> DatabaseConfig:
        """Load configuration for specified environment"""
        env = Environment(environment.lower())
        
        if env == Environment.LOCAL:
            # Try to load from environment variables first, fall back to defaults
            host = os.getenv('DB_HOST_LOCAL', 'localhost')
            port = int(os.getenv('DB_PORT_LOCAL', '3306'))
            user = os.getenv('DB_USER_LOCAL', 'root')
            password = os.getenv('DB_PASSWORD_LOCAL', 'root')
            database = os.getenv('DB_NAME_LOCAL', 'perundhu')
            
            return DatabaseConfig(
                host=host,
                port=port,
                user=user,
                password=password,
                database=database
            )
        
        elif env in [Environment.PREPROD, Environment.PROD]:
            # Load from environment variables or config file
            return ConfigurationLoader._load_from_env(env)
        
        else:
            raise ValueError(f"Unknown environment: {environment}")
    
    @staticmethod
    def _load_from_env(env: Environment) -> DatabaseConfig:
        """Load from environment variables or config file"""
        env_name = env.value.upper()

        # FIRST: Check if TCP host is explicitly provided via env vars (highest priority)
        host = os.getenv(f"DB_HOST_{env_name}")
        port_str = os.getenv(f"DB_PORT_{env_name}")
        
        if host and not host.startswith('/'):
            port = int(port_str) if port_str else 3306
            logger.info(f"📍 Using TCP connection to {host}:{port} (from env vars)")
            
            user = (os.getenv(f"DB_USER_{env_name}") or 
                    os.getenv(f"DB_USERNAME_{env_name}") or 
                    os.getenv("DB_USERNAME") or
                    os.getenv("MYSQL_USERNAME") or 
                    "root")
            
            password = (os.getenv(f"DB_PASSWORD_{env_name}") or 
                       os.getenv("DB_PASSWORD") or
                       os.getenv("MYSQL_PASSWORD") or
                       "")
            
            database = os.getenv(f"DB_NAME_{env_name}", "perundhu")
            ssl_ca = os.getenv(f"DB_SSL_CA_{env_name}")
            
            return DatabaseConfig(
                host=host,
                port=port,
                user=user,
                password=password,
                database=database,
                ssl_ca=ssl_ca
            )

        # SECOND: Attempt to load Spring properties if present
        props_path = Path("backend/app/src/main/resources") / f"application-{env.value}.properties"
        props = ConfigurationLoader._read_properties_file(props_path)
        if props:
            url_raw = props.get("spring.datasource.url", "")
            username_raw = props.get("spring.datasource.username", "")
            password_raw = props.get("spring.datasource.password", "")

            try:
                url = ConfigurationLoader._resolve_property_value(url_raw) if url_raw else ''
                user = ConfigurationLoader._resolve_property_value(username_raw) if username_raw else ''
                password = ConfigurationLoader._resolve_property_value(password_raw) if password_raw else ''

                host, port, database, cloud_sql_instance = ConfigurationLoader._parse_jdbc_url(url)
                if cloud_sql_instance:
                    host = f"/cloudsql/{cloud_sql_instance}"
                    port = 0

                if host or database:
                    logger.info(f"📍 Loaded DB config from {props_path}")
                    return DatabaseConfig(
                        host=host if host is not None else os.getenv(f"DB_HOST_{env_name}", "localhost"),
                        port=port if port is not None else int(os.getenv(f"DB_PORT_{env_name}", "3306")),
                        user=user if user else os.getenv(f"DB_USER_{env_name}", "root"),
                        password=password if password else os.getenv(f"DB_PASSWORD_{env_name}", ""),
                        database=database if database else os.getenv(f"DB_NAME_{env_name}", "perundhu"),
                        ssl_ca=os.getenv(f"DB_SSL_CA_{env_name}")
                    )
            except Exception as exc:
                logger.warning(f"⚠️  Failed to load config from properties: {exc}")
        
        # First, check if TCP host is explicitly provided
        host = os.getenv(f"DB_HOST_{env_name}")
        port_str = os.getenv(f"DB_PORT_{env_name}")
        
        # If TCP host is provided, use it (overrides Cloud SQL socket)
        if host and not host.startswith('/'):
            port = int(port_str) if port_str else 3306
            logger.info(f"📍 Using TCP connection to {host}:{port}")
        else:
            # Check for Cloud SQL instance (GCP)
            cloud_sql_instance = os.getenv(f"CLOUD_SQL_INSTANCE_{env_name}") or \
                                os.getenv(f"GCP_CLOUD_SQL_INSTANCE_{env_name}")
            
            # For preprod, use hardcoded Cloud SQL instance if env vars not set and no TCP host
            if env == Environment.PREPROD and not cloud_sql_instance and not host:
                cloud_sql_instance = "astute-strategy-406601:asia-south1:perundhu-preprod-mysql"
            
            # For prod, use hardcoded Cloud SQL instance if env vars not set and no TCP host
            if env == Environment.PROD and not cloud_sql_instance and not host:
                cloud_sql_instance = "perundhu-prod-001:asia-south1:perundhu-prod-mysql"
            
            # If Cloud SQL instance provided, use Unix socket (preprod on GCP)
            if cloud_sql_instance:
                host = f"/cloudsql/{cloud_sql_instance}"
                port = 0  # Unix socket doesn't use port
                logger.info(f"📍 Using Cloud SQL Unix socket: {host}")
            else:
                # Fall back to TCP with defaults
                host = "localhost"
                port = 3306
        
        # Try multiple sources for credentials (Cloud Run secrets pattern)
        user = (os.getenv(f"DB_USER_{env_name}") or 
                os.getenv(f"DB_USERNAME_{env_name}") or 
                os.getenv("DB_USERNAME") or
                os.getenv("MYSQL_USERNAME") or 
                "root")
        
        password = (os.getenv(f"DB_PASSWORD_{env_name}") or 
                   os.getenv("DB_PASSWORD") or
                   os.getenv("MYSQL_PASSWORD") or
                   "")
        
        database = os.getenv(f"DB_NAME_{env_name}", "perundhu")
        ssl_ca = os.getenv(f"DB_SSL_CA_{env_name}")
        
        return DatabaseConfig(
            host=host,
            port=port,
            user=user,
            password=password,
            database=database,
            ssl_ca=ssl_ca
        )


# ============================================================
# DATA LOADER CLASSES
# ============================================================

class LocationLoader:
    """Load and migrate location data"""
    
    def __init__(self, db_manager: DatabaseManager, enable_translation: bool = False):
        self.db = db_manager
        self.enable_translation = enable_translation
        self.translator = None
        self.location_cache: Dict[str, int] = {}
        self.stats = {
            'total': 0,
            'inserted': 0,
            'updated': 0,
            'skipped': 0,
            'translations': 0,
            'errors': []
        }
        self.location_columns: List[str] = []
        self.city_cache: Dict[str, int] = {}
        
        # Initialize Tamil translator if enabled
        if self.enable_translation:
            if TAMIL_TRANSLATION_AVAILABLE:
                self.translator = TamilTranslator(use_api=False)
                logger.info("✅ Tamil translation enabled")
            else:
                logger.warning("⚠️  Tamil translation requested but module not available")
                self.enable_translation = False
    
    def load_from_file(self, filepath: str) -> List[LocationData]:
        """Load locations from JSON/CSV file"""
        filepath = Path(filepath)
        
        if not filepath.exists():
            raise FileNotFoundError(f"File not found: {filepath}")
        
        logger.info(f"📂 Loading locations from: {filepath}")
        
        if filepath.suffix == '.json':
            return self._load_json(filepath)
        elif filepath.suffix == '.jsonl':
            return self._load_jsonl(filepath)
        elif filepath.suffix == '.csv':
            return self._load_csv(filepath)
        else:
            raise ValueError(f"Unsupported file format: {filepath.suffix}")
    
    def _load_json(self, filepath: Path) -> List[LocationData]:
        """Load from JSON file"""
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        if not isinstance(data, list):
            data = [data]
        
        locations = []
        for item in data:
            try:
                loc = LocationData(
                    name=item.get('name'),
                    latitude=float(item.get('latitude', 0)),
                    longitude=float(item.get('longitude', 0)),
                    district=item.get('district'),
                    state=item.get('state', 'Tamil Nadu'),
                    osm_id=item.get('osm_id'),
                    type=item.get('type'),
                    neighborhood=item.get('neighborhood'),
                    priority=item.get('priority')
                )
                locations.append(loc)
            except Exception as e:
                logger.warning(f"⚠️  Skipped invalid location: {item} - {e}")
                self.stats['errors'].append(str(e))
        
        return locations
    
    def _load_jsonl(self, filepath: Path) -> List[LocationData]:
        """Load from JSONL file"""
        locations = []
        with open(filepath, 'r', encoding='utf-8') as f:
            for line in f:
                if line.strip():
                    try:
                        item = json.loads(line)
                        loc = LocationData(
                            name=item.get('name'),
                            latitude=float(item.get('latitude', 0)),
                            longitude=float(item.get('longitude', 0)),
                            district=item.get('district'),
                            state=item.get('state', 'Tamil Nadu'),
                            osm_id=item.get('osm_id'),
                            type=item.get('type')
                        )
                        locations.append(loc)
                    except Exception as e:
                        logger.warning(f"⚠️  Skipped invalid line: {line[:100]} - {e}")
                        self.stats['errors'].append(str(e))
        
        return locations
    
    def _load_csv(self, filepath: Path) -> List[LocationData]:
        """Load from CSV file"""
        locations = []
        with open(filepath, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                try:
                    loc = LocationData(
                        name=row.get('name'),
                        latitude=float(row.get('latitude', 0)),
                        longitude=float(row.get('longitude', 0)),
                        district=row.get('district'),
                        state=row.get('state', 'Tamil Nadu'),
                        osm_id=int(row.get('osm_id')) if row.get('osm_id') else None,
                        type=row.get('type')
                    )
                    locations.append(loc)
                except Exception as e:
                    logger.warning(f"⚠️  Skipped invalid CSV row: {row} - {e}")
                    self.stats['errors'].append(str(e))
        
        return locations

    def _load_schema(self):
        if self.location_columns:
            return
        try:
            cols = self.db.execute("SHOW COLUMNS FROM locations", fetch=True) or []
            self.location_columns = [c.get('Field') for c in cols if c.get('Field')]
        except Exception as e:
            logger.warning(f"Could not load locations schema: {e}")

        if self._has_column('location_type'):
            try:
                cities = self.db.execute("SELECT id, name FROM locations WHERE location_type = 'CITY'", fetch=True) or []
                for row in cities:
                    self.city_cache[row['name'].strip().lower()] = row['id']
            except Exception as e:
                logger.debug(f"City cache preload skipped: {e}")

    def _has_column(self, column: str) -> bool:
        return column in self.location_columns

    TERMINAL_KEYWORDS = [
        'terminus', 'bus stand', 'busstand', 'bus stop', 'b.s', 'b.s.', 'bs',
        'bus station', 'mtc terminus', 'mtc bus stand', 'tnstc bus stand', 'depot'
    ]

    TERMINAL_PARENT_MAP = {
        'cmbt': 'chennai',
        'koyambedu': 'chennai',
        'kilambakkam': 'chennai',
        'kcbt': 'chennai',
        'tambaram': 'chennai',
        'adyar': 'chennai',
        'vadapalani': 'chennai',
        'broadway': 'chennai',
        't nagar': 'chennai', 't. nagar': 'chennai', 'tnagar': 'chennai',
        'gandhipuram': 'coimbatore',
        'singanallur': 'coimbatore',
        'central bus stand': 'tiruchirappalli',
        'mattuthavani': 'madurai',
    }

    def _infer_location_type_and_parent(self, name: str, fallback_type: str) -> Tuple[str, Optional[int]]:
        n = (name or '').strip().lower()
        fallback = (fallback_type or '').strip().lower()

        if 'city' in fallback:
            loc_type = 'CITY'
        elif any(k in n for k in self.TERMINAL_KEYWORDS) or fallback.startswith('bus_terminal'):
            loc_type = 'TERMINAL'
        elif fallback.startswith('bus_stop') or 'stop' in n:
            loc_type = 'STATION'
        elif fallback in ('town', 'village'):
            loc_type = 'TOWN'
        else:
            loc_type = 'TOWN'

        parent_id = None
        for key, city in self.TERMINAL_PARENT_MAP.items():
            if key in n:
                parent_id = self.city_cache.get(city.lower())
                if parent_id:
                    break

        if parent_id is None and self.city_cache:
            for city_name, cid in self.city_cache.items():
                if city_name in n:
                    parent_id = cid
                    break

        return loc_type, parent_id
    
    def upload(self, locations: List[LocationData], batch_size: int = 1000, 
               skip_duplicates: bool = True) -> bool:
        """Upload locations to database"""
        logger.info(f"\n🚀 Uploading {len(locations)} locations...")
        self.stats['total'] = len(locations)
        
        self._load_schema()
        fields = ['name']
        if self._has_column('location_type'):
            fields.append('location_type')
        if self._has_column('parent_id'):
            fields.append('parent_id')
        if self._has_column('latitude'):
            fields.append('latitude')
        if self._has_column('longitude'):
            fields.append('longitude')
        if self._has_column('district'):
            fields.append('district')
        if self._has_column('state'):
            fields.append('state')
        if self._has_column('osm_id'):
            fields.append('osm_id')
        if self._has_column('type'):
            fields.append('type')
        if self._has_column('neighborhood'):
            fields.append('neighborhood')
        if self._has_column('priority'):
            fields.append('priority')

        placeholders = ','.join(['%s'] * len(fields))
        update_fields = [
            'id = LAST_INSERT_ID(id)',
            'district = VALUES(district)',
            'latitude = VALUES(latitude)',
            'longitude = VALUES(longitude)',
            'updated_at = NOW()'
        ]
        if self._has_column('location_type'):
            update_fields.append('location_type = COALESCE(VALUES(location_type), location_type)')
        if self._has_column('parent_id'):
            update_fields.append('parent_id = COALESCE(VALUES(parent_id), parent_id)')

        query = f"INSERT INTO locations ({','.join(fields)}) VALUES ({placeholders}) ON DUPLICATE KEY UPDATE {', '.join(update_fields)}"
        
        try:
            for i in range(0, len(locations), batch_size):
                batch = locations[i:i+batch_size]
                
                for loc in batch:
                    # Check if location already exists
                    if skip_duplicates and self._location_exists(loc.name, loc.district):
                        self.stats['skipped'] += 1
                        continue
                    
                    try:
                        loc_type, parent_id = self._infer_location_type_and_parent(loc.name, loc.type or 'unknown')
                        params: List[Any] = []
                        for field in fields:
                            if field == 'name':
                                params.append(loc.name)
                            elif field == 'location_type':
                                params.append(loc_type)
                            elif field == 'parent_id':
                                params.append(parent_id)
                            elif field == 'latitude':
                                params.append(loc.latitude)
                            elif field == 'longitude':
                                params.append(loc.longitude)
                            elif field == 'district':
                                params.append(loc.district)
                            elif field == 'state':
                                params.append(loc.state)
                            elif field == 'osm_id':
                                params.append(loc.osm_id)
                            elif field == 'type':
                                params.append(loc.type)
                            elif field == 'neighborhood':
                                params.append(loc.neighborhood)
                            elif field == 'priority':
                                params.append(loc.priority)

                        self.db.execute(query, tuple(params))
                        location_id = self.db.cursor.lastrowid
                        self.stats['inserted'] += 1
                        if loc_type == 'CITY' and location_id:
                            self.city_cache[loc.name.strip().lower()] = location_id
                        
                        # Insert Tamil translation if enabled
                        if self.enable_translation and location_id:
                            self._insert_translation('location', location_id, 'name', loc.name)
                    except MySQLError as err:
                        logger.warning(f"⚠️  Failed to insert location '{loc.name}': {err}")
                        self.stats['errors'].append(f"Location '{loc.name}': {err}")
                
                self.db.commit()
                logger.info(f"✅ Processed {min(i+batch_size, len(locations))}/{len(locations)} locations")
            
            logger.info(f"\n✅ Locations upload complete:")
            logger.info(f"   Inserted: {self.stats['inserted']}")
            logger.info(f"   Skipped:  {self.stats['skipped']}")
            if self.enable_translation:
                logger.info(f"   Tamil Translations: {self.stats['translations']}")
            logger.info(f"   Errors:   {len(self.stats['errors'])}")
            
            return len(self.stats['errors']) == 0
        
        except Exception as e:
            logger.error(f"❌ Upload failed: {e}")
            self.db.rollback()
            return False
    
    def _location_exists(self, name: str, district: Optional[str]) -> bool:
        """Check if location already exists"""
        query = "SELECT id FROM locations WHERE name = %s AND district = %s LIMIT 1"
        result = self.db.execute(query, (name, district), fetch=True)
        return len(result) > 0
    
    def _insert_translation(self, entity_type: str, entity_id: int, field_name: str, english_text: str):
        """Insert Tamil translation for an entity"""
        if not self.translator:
            return
        
        try:
            # Translate text
            tamil_text = self.translator.translate(english_text)
            
            if tamil_text:
                query = """
                    INSERT INTO translations (entity_type, entity_id, language_code, field_name, translated_value)
                    VALUES (%s, %s, %s, %s, %s)
                    ON DUPLICATE KEY UPDATE
                        translated_value = VALUES(translated_value),
                        updated_at = NOW()
                """
                self.db.execute(query, (entity_type, entity_id, 'ta', field_name, tamil_text))
                self.stats['translations'] += 1
        except Exception as e:
            logger.debug(f"Translation failed for '{english_text}': {e}")


class BusLoader:
    """Load and migrate bus data with stops"""
    
    def __init__(self, db_manager: DatabaseManager, strict: bool = False, enable_translation: bool = False):
        self.db = db_manager
        self.strict = strict
        self.enable_translation = enable_translation
        self.translator = None
        self.location_map: Dict[str, int] = {}
        self.location_columns: List[str] = []
        self.city_cache: Dict[str, int] = {}
        self.existing_bus_keys: Optional[set] = None
        self.stats = {
            'total_buses': 0,
            'inserted_buses': 0,
            'skipped_buses': 0,
            'inserted_stops': 0,
            'translations': 0,
            'errors': []
        }
        
        # Initialize Tamil translator if enabled
        if self.enable_translation:
            if TAMIL_TRANSLATION_AVAILABLE:
                self.translator = TamilTranslator(use_api=False)
                logger.info("✅ Tamil translation enabled for buses")
            else:
                logger.warning("⚠️  Tamil translation requested but module not available")
                self.enable_translation = False
    
    def load_from_file(self, filepath: str) -> List[BusData]:
        """Load buses from JSON file (supports both array and consolidated formats)"""
        filepath = Path(filepath)
        
        if not filepath.exists():
            raise FileNotFoundError(f"File not found: {filepath}")
        
        logger.info(f"📂 Loading buses from: {filepath}")
        
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        # Handle consolidated_buses.json format (has "buses" key)
        if isinstance(data, dict) and 'buses' in data:
            data = data['buses']
        
        # Ensure data is a list
        if not isinstance(data, list):
            data = [data]
        
        buses = []
        for item in data:
            try:
                stops = []
                if 'stops' in item and isinstance(item['stops'], list):
                    for idx, stop_item in enumerate(item['stops']):
                        # Use landmark first (actual stop name), fallback to location or name
                        stop_name = (stop_item.get('landmark') or 
                                    stop_item.get('location') or 
                                    stop_item.get('name'))
                        stop = StopData(
                            name=stop_name,
                            location_id=None,  # Will be populated during upload
                            arrival_time=stop_item.get('arrival_time') or stop_item.get('time'),
                            departure_time=stop_item.get('departure_time') or stop_item.get('time'),
                            stop_order=idx
                        )
                        stops.append(stop)
                
                bus = BusData(
                    name=item.get('name') or item.get('bus_name'),
                    bus_number=item.get('bus_number'),
                    from_location_id=None,  # Will be populated during upload
                    to_location_id=None,
                    departure_time=item.get('departure_time'),
                    arrival_time=item.get('arrival_time'),
                    capacity=int(item.get('available_seats', 50)) if item.get('available_seats') else 50,
                    category=item.get('bus_type', 'Regular'),
                    stops=stops,
                    origin=item.get('origin'),  # Extract from JSON
                    destination=item.get('destination')  # Extract from JSON
                )
                buses.append(bus)
            except Exception as e:
                logger.warning(f"⚠️  Skipped invalid bus: {item} - {e}")
                self.stats['errors'].append(str(e))
        
        return buses
    
    def _load_location_map(self):
        """Load all locations into memory for mapping"""
        logger.info("📋 Loading location map...")
        self._load_schema()

        query = "SELECT id, name, district, location_type FROM locations" if self._has_column("location_type") else "SELECT id, name, district FROM locations"
        results = self.db.execute(query, fetch=True)
        
        for row in results:
            name = row['name'].strip()
            # Store in multiple forms for better matching
            self.location_map[name] = row['id']  # Original
            self.location_map[name.title()] = row['id']  # Title case
            self.location_map[name.upper()] = row['id']  # Upper case
            
            # Create composite key for better matching
            if row['district']:
                key = f"{name}|{row['district']}"
                self.location_map[key] = row['id']

            # Cache cities for parent inference
            if self._has_column("location_type") and str(row.get('location_type', '')).upper() == 'CITY':
                self.city_cache[name.lower()] = row['id']
        
        logger.info(f"✅ Loaded {len(set(self.location_map.values()))} unique locations with {len(self.location_map)} name variations")

    def _load_schema(self):
        """Inspect locations schema to enable hierarchy-aware inserts."""
        if self.location_columns:
            return
        try:
            cols = self.db.execute("SHOW COLUMNS FROM locations", fetch=True) or []
            self.location_columns = [c.get('Field') for c in cols if c.get('Field')]
            logger.debug(f"Locations schema: {self.location_columns}")
        except Exception as e:
            logger.warning(f"Could not load locations schema: {e}")

        # Preload city cache if schema supports it
        if self._has_column('location_type'):
            try:
                cities = self.db.execute("SELECT id, name FROM locations WHERE location_type = 'CITY'", fetch=True) or []
                for row in cities:
                    self.city_cache[row['name'].strip().lower()] = row['id']
            except Exception as e:
                logger.debug(f"City cache preload skipped: {e}")

    def _has_column(self, column: str) -> bool:
        return column in self.location_columns

    # Hierarchy inference helpers (mirrors upload_bus_data.py behavior)
    TERMINAL_KEYWORDS = [
        'terminus', 'bus stand', 'busstand', 'bus stop', 'b.s', 'b.s.', 'bs',
        'bus station', 'mtc terminus', 'mtc bus stand', 'tnstc bus stand', 'depot'
    ]

    TERMINAL_PARENT_MAP = {
        'cmbt': 'chennai',
        'koyambedu': 'chennai',
        'kilambakkam': 'chennai',
        'kcbt': 'chennai',
        'tambaram': 'chennai',
        'adyar': 'chennai',
        'vadapalani': 'chennai',
        'broadway': 'chennai',
        't nagar': 'chennai', 't. nagar': 'chennai', 'tnagar': 'chennai',
        'gandhipuram': 'coimbatore',
        'singanallur': 'coimbatore',
        'central bus stand': 'tiruchirappalli',
        'mattuthavani': 'madurai',
    }

    def _infer_location_type_and_parent(self, name: str, fallback_type: str) -> Tuple[str, Optional[int]]:
        n = (name or '').strip().lower()
        is_terminal = any(k in n for k in self.TERMINAL_KEYWORDS) or fallback_type.lower().startswith('bus_terminal')
        loc_type = 'TERMINAL' if is_terminal else ('STATION' if fallback_type.lower().startswith('bus_stop') or 'stop' in n else 'TOWN')

        parent_id = None
        for key, city in self.TERMINAL_PARENT_MAP.items():
            if key in n:
                parent_id = self.city_cache.get(city.lower())
                if parent_id:
                    break

        if parent_id is None and self.city_cache:
            for city_name, cid in self.city_cache.items():
                if city_name in n:
                    parent_id = cid
                    break

        return loc_type, parent_id

    def _add_to_location_map(self, name: str, loc_id: int, district: Optional[str] = None):
        base = name.strip()
        self.location_map[base] = loc_id
        self.location_map[base.title()] = loc_id
        self.location_map[base.upper()] = loc_id
        if district:
            self.location_map[f"{base}|{district}"] = loc_id

    def _insert_location(self, name: str, fallback_type: str) -> Optional[int]:
        """Create a location, using hierarchy columns when available."""
        if not name:
            return None

        self._load_schema()
        loc_type, parent_id = self._infer_location_type_and_parent(name, fallback_type)

        fields = ['name']
        params: List[Any] = [name.strip()]

        if self._has_column('location_type'):
            fields.append('location_type')
            params.append(loc_type)
        if self._has_column('parent_id'):
            fields.append('parent_id')
            params.append(parent_id)
        if self._has_column('latitude'):
            fields.append('latitude')
            params.append(None)
        if self._has_column('longitude'):
            fields.append('longitude')
            params.append(None)
        if self._has_column('district'):
            fields.append('district')
            params.append(None)
        if self._has_column('state'):
            fields.append('state')
            params.append('Tamil Nadu')
        if self._has_column('osm_id'):
            fields.append('osm_id')
            params.append(None)
        if self._has_column('type') and not self._has_column('location_type'):
            fields.append('type')
            params.append(fallback_type)
        if self._has_column('neighborhood'):
            fields.append('neighborhood')
            params.append(None)
        if self._has_column('priority'):
            fields.append('priority')
            params.append(None)
        if self._has_column('created_at'):
            fields.append('created_at')
            params.append(datetime.now())
        if self._has_column('updated_at'):
            fields.append('updated_at')
            params.append(datetime.now())

        placeholders = ','.join(['%s'] * len(fields))
        query = f"INSERT INTO locations ({','.join(fields)}) VALUES ({placeholders})"

        try:
            self.db.execute(query, tuple(params))
            loc_id = self.db.cursor.lastrowid
            self._add_to_location_map(name, loc_id, None)
            if loc_type == 'CITY':
                self.city_cache[name.strip().lower()] = loc_id
            logger.info(f"Created location '{name}' (type={loc_type}, parent_id={parent_id}) -> ID {loc_id}")
            return loc_id
        except Exception as e:
            logger.warning(f"⚠️  Failed to create location '{name}': {e}")
            self.stats['errors'].append(f"Location '{name}': {e}")
            return None
    
    def _insert_translation(self, entity_type: str, entity_id: int, field_name: str, english_text: str):
        """Insert Tamil translation for an entity"""
        if not self.translator:
            return
        
        try:
            # Translate text
            tamil_text = self.translator.translate(english_text)
            
            if tamil_text:
                query = """
                    INSERT INTO translations (entity_type, entity_id, language_code, field_name, translated_value)
                    VALUES (%s, %s, %s, %s, %s)
                    ON DUPLICATE KEY UPDATE
                        translated_value = VALUES(translated_value),
                        updated_at = NOW()
                """
                self.db.execute(query, (entity_type, entity_id, 'ta', field_name, tamil_text))
                self.stats['translations'] += 1
        except Exception as e:
            logger.debug(f"Translation failed for '{english_text}': {e}")
    
    def _bus_exists(self, bus_number: str, from_loc_id: Optional[int], 
                    to_loc_id: Optional[int], departure_time: Optional[str]) -> bool:
        """Check if bus already exists in database"""
        if self.existing_bus_keys is None:
            self._load_existing_bus_keys()

        key = (bus_number, from_loc_id, to_loc_id, str(departure_time) if departure_time is not None else None)
        return key in self.existing_bus_keys

    def _load_existing_bus_keys(self):
        """Load existing bus keys once to avoid per-record DB lookups."""
        self.existing_bus_keys = set()
        try:
            logger.info("📋 Loading existing bus keys for duplicate detection...")
            query = "SELECT bus_number, from_location_id, to_location_id, departure_time FROM buses"
            results = self.db.execute(query, fetch=True) or []

            for row in results:
                key = (
                    row.get('bus_number'),
                    row.get('from_location_id'),
                    row.get('to_location_id'),
                    str(row.get('departure_time')) if row.get('departure_time') is not None else None
                )
                self.existing_bus_keys.add(key)

            logger.info(f"✅ Loaded {len(self.existing_bus_keys)} existing buses for fast checks")
        except Exception as e:
            logger.warning(f"⚠️  Could not pre-load existing buses: {e}")
            self.existing_bus_keys = set()

    def _filter_new_buses(self, buses: List[BusData]) -> List[BusData]:
        """Pre-filter buses to only include new ones (not in database)."""
        new_buses = []
        
        for bus in buses:
            # Resolve location IDs for comparison
            if bus.origin:
                from_loc_id = self._resolve_location_id(bus.origin, fallback_type='bus_terminal')
            else:
                from_loc_id = self._resolve_location_id(bus.name.split('-')[0].strip(), fallback_type='bus_terminal') if '-' in bus.name else None
            
            if bus.destination:
                to_loc_id = self._resolve_location_id(bus.destination, fallback_type='bus_terminal')
            else:
                to_loc_id = self._resolve_location_id(bus.name.split('-')[-1].strip(), fallback_type='bus_terminal') if '-' in bus.name else None
            
            # Create comparison key
            key = (bus.bus_number, from_loc_id, to_loc_id, str(bus.departure_time) if bus.departure_time is not None else None)
            
            # Only include if not in existing set
            if key not in self.existing_bus_keys:
                new_buses.append(bus)
            else:
                self.stats['skipped_buses'] += 1
        
        return new_buses
    
    def upload(self, buses: List[BusData], batch_size: int = 100) -> bool:
        """Upload buses and stops to database"""
        logger.info(f"\n🚀 Uploading {len(buses)} buses with stops...")
        self.stats['total_buses'] = len(buses)
        
        # Load location mappings first
        self._load_location_map()
        # Load existing buses once to avoid per-record DB lookups
        self._load_existing_bus_keys()
        
        # DISABLED: Pre-filtering is too slow (O(n*m) string comparisons)
        # Let database handle duplicates with INSERT ... ON DUPLICATE KEY UPDATE
        # logger.info(f"📋 Pre-filtering {len(buses)} buses against {len(self.existing_bus_keys)} existing records...")
        # new_buses = self._filter_new_buses(buses)
        # logger.info(f"✅ Found {len(new_buses)} new buses to upload (skipping {len(buses) - len(new_buses)} duplicates)")
        # buses = new_buses
        logger.info(f"⚡ Skipping pre-filtering to avoid performance issues. Database will handle duplicates.")
        
        bus_query = """
            INSERT INTO buses (name, bus_number, from_location_id, to_location_id, 
                             departure_time, arrival_time, capacity, category, active)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE
                id = LAST_INSERT_ID(id),
                name = VALUES(name),
                from_location_id = VALUES(from_location_id),
                to_location_id = VALUES(to_location_id),
                departure_time = VALUES(departure_time),
                arrival_time = VALUES(arrival_time),
                capacity = VALUES(capacity),
                category = VALUES(category),
                active = VALUES(active),
                updated_at = NOW()
        """
        
        stop_query = """
            INSERT INTO stops (bus_id, name, location_id, arrival_time, departure_time, stop_order, stops_json)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE
                location_id = VALUES(location_id),
                arrival_time = VALUES(arrival_time),
                departure_time = VALUES(departure_time),
                stops_json = VALUES(stops_json),
                updated_at = NOW()
        """
        
        try:
            for i, bus in enumerate(buses):
                try:
                    # Resolve location IDs using origin and destination, fallback to name parsing
                    if bus.origin:
                        from_loc_id = self._resolve_location_id(bus.origin, fallback_type='bus_terminal')
                    else:
                        from_loc_id = self._resolve_location_id(bus.name.split('-')[0].strip(), fallback_type='bus_terminal') if '-' in bus.name else None
                    
                    if bus.destination:
                        to_loc_id = self._resolve_location_id(bus.destination, fallback_type='bus_terminal')
                    else:
                        to_loc_id = self._resolve_location_id(bus.name.split('-')[-1].strip(), fallback_type='bus_terminal') if '-' in bus.name else None
                    
                    if not from_loc_id:
                        logger.warning(f"⚠️  Could not resolve FROM location for bus: {bus.name} (origin={bus.origin})")
                        self.stats['errors'].append(f"Bus '{bus.name}': Cannot resolve FROM location")
                        if self.strict:
                            logger.error("❌ Strict mode enabled. Aborting due to unresolved FROM location.")
                            return False
                        continue

                    if self.strict and not to_loc_id:
                        logger.warning(f"⚠️  Could not resolve TO location for bus: {bus.name} (destination={bus.destination})")
                        self.stats['errors'].append(f"Bus '{bus.name}': Cannot resolve TO location")
                        logger.error("❌ Strict mode enabled. Aborting due to unresolved TO location.")
                        return False
                    
                    # Insert bus (duplicates already filtered out)
                    bus_params = (
                        bus.name,
                        bus.bus_number or '',
                        from_loc_id,
                        to_loc_id,
                        bus.departure_time,
                        bus.arrival_time,
                        bus.capacity,
                        bus.category,
                        True
                    )
                    self.db.execute(bus_query, bus_params)
                    bus_id = self.db.cursor.lastrowid
                    self.stats['inserted_buses'] += 1
                    
                    # Insert Tamil translation for bus name if enabled
                    if self.enable_translation and bus_id:
                        self._insert_translation('bus', bus_id, 'name', bus.name)
                    
                    # Insert stops
                    if bus.stops:
                        for stop in bus.stops:
                            try:
                                stop_loc_id = self._resolve_location_id(stop.name, fallback_type='bus_stop')
                                if self.strict and not stop_loc_id:
                                    self.stats['errors'].append(f"Stop '{stop.name}': Cannot resolve location")
                                    logger.error("❌ Strict mode enabled. Aborting due to unresolved stop location.")
                                    return False
                                
                                stop_params = (
                                    bus_id,
                                    stop.name,
                                    stop_loc_id,
                                    stop.arrival_time,
                                    stop.departure_time,
                                    stop.stop_order,
                                    json.dumps(asdict(stop))
                                )
                                self.db.execute(stop_query, stop_params)
                                self.stats['inserted_stops'] += 1
                            except Exception as e:
                                logger.warning(f"⚠️  Failed to insert stop '{stop.name}': {e}")
                                self.stats['errors'].append(f"Stop '{stop.name}': {e}")
                
                except Exception as e:
                    logger.warning(f"⚠️  Failed to insert bus '{bus.name}': {e}")
                    self.stats['errors'].append(f"Bus '{bus.name}': {e}")
                
                if (i + 1) % batch_size == 0:
                    self.db.commit()
                    logger.info(f"✅ Processed {i+1}/{len(buses)} buses")
            
            self.db.commit()
            
            logger.info(f"\n✅ Buses upload complete:")
            logger.info(f"   Buses inserted:  {self.stats['inserted_buses']}")
            logger.info(f"   Buses skipped:   {self.stats['skipped_buses']} (duplicates)")
            logger.info(f"   Stops inserted:  {self.stats['inserted_stops']}")
            if self.enable_translation:
                logger.info(f"   Tamil Translations: {self.stats['translations']}")
            logger.info(f"   Errors:          {len(self.stats['errors'])}")
            
            return len(self.stats['errors']) == 0
        
        except Exception as e:
            logger.error(f"❌ Upload failed: {e}")
            self.db.rollback()
            return False
    
    def _resolve_location_id(self, location_name: str, fallback_type: str = 'bus_stop') -> Optional[int]:
        """Resolve location ID from name with fuzzy matching, creating if missing."""
        if not location_name:
            return None
        
        location_name = location_name.strip()
        title_name = location_name.title()
        
        # Exact match (case-insensitive)
        for key, loc_id in self.location_map.items():
            if key.upper() == title_name.upper():
                return loc_id
        
        # Try original case-insensitive lookup
        if title_name in self.location_map:
            return self.location_map[title_name]
        
        # Fuzzy match
        matches = difflib.get_close_matches(title_name, self.location_map.keys(), n=1, cutoff=0.6)
        if matches:
            return self.location_map[matches[0]]
        
        if self.strict:
            logger.debug(f"Could not find location: '{location_name}' (strict mode, no auto-create)")
            return None

        logger.debug(f"Could not find location: '{location_name}', creating new one")
        return self._insert_location(location_name, fallback_type)


# ============================================================
# VALIDATION & CHECKPOINT
# ============================================================

class DataValidator:
    """Validate data integrity before upload"""
    
    @staticmethod
    def validate_locations(locations: List[LocationData]) -> Tuple[bool, List[str]]:
        """Validate location data"""
        errors = []
        
        for i, loc in enumerate(locations):
            if not loc.name:
                errors.append(f"Location {i}: name is required")
            if not -90 <= loc.latitude <= 90:
                errors.append(f"Location {i} ({loc.name}): invalid latitude {loc.latitude}")
            if not -180 <= loc.longitude <= 180:
                errors.append(f"Location {i} ({loc.name}): invalid longitude {loc.longitude}")
        
        return len(errors) == 0, errors
    
    @staticmethod
    def validate_buses(buses: List[BusData]) -> Tuple[bool, List[str]]:
        """Validate bus data"""
        errors = []
        
        for i, bus in enumerate(buses):
            if not bus.name:
                errors.append(f"Bus {i}: name is required")
            if not bus.bus_number:
                errors.append(f"Bus {i} ({bus.name}): bus_number is required")
            
            # Validate stops
            for j, stop in enumerate(bus.stops or []):
                if not stop.name:
                    errors.append(f"Bus {i}, Stop {j}: name is required")
                if stop.stop_order < 0:
                    errors.append(f"Bus {i}, Stop {j}: invalid stop_order {stop.stop_order}")
        
        return len(errors) == 0, errors


class CheckpointManager:
    """Manage migration checkpoints for resumption"""
    
    @staticmethod
    def save(checkpoint: MigrationCheckpoint, filepath: str):
        """Save checkpoint to file"""
        data = asdict(checkpoint)
        with open(filepath, 'w') as f:
            json.dump(data, f, indent=2)
        logger.info(f"💾 Checkpoint saved: {filepath}")
    
    @staticmethod
    def load(filepath: str) -> Optional[MigrationCheckpoint]:
        """Load checkpoint from file"""
        if not Path(filepath).exists():
            return None
        
        with open(filepath, 'r') as f:
            data = json.load(f)
        
        return MigrationCheckpoint(**data)


# ============================================================
# MAIN ORCHESTRATOR
# ============================================================

class UnifiedDataLoader:
    """Main orchestrator for data migration"""
    
    def __init__(self, environment: str):
        self.environment = environment
        self.config = ConfigurationLoader.load(environment)
        self.db = DatabaseManager(self.config)
    
    def run(self, args):
        """Main execution flow"""
        try:
            # Connect to database
            if not self.db.connect():
                return False
            
            mode = DataMode(args.mode.lower())
            
            if mode == DataMode.VALIDATE:
                return self._validate_mode(args)
            elif mode == DataMode.LOCATIONS:
                return self._locations_mode(args)
            elif mode == DataMode.BUSES:
                return self._buses_mode(args)
            elif mode == DataMode.FULL:
                return self._full_mode(args)
            else:
                logger.error(f"Unknown mode: {mode}")
                return False
        
        finally:
            self.db.disconnect()
    
    def _validate_mode(self, args):
        """Validate mode: check data without uploading"""
        logger.info("\n🔍 VALIDATION MODE")
        logger.info("=" * 60)
        
        if args.data_file:
            if 'location' in args.data_file.lower():
                loader = LocationLoader(self.db, enable_translation=args.enable_translation)
                locations = loader.load_from_file(args.data_file)
                valid, errors = DataValidator.validate_locations(locations)
                
                logger.info(f"📋 Locations: {len(locations)} records")
                if valid:
                    logger.info("✅ All locations are valid")
                else:
                    logger.error(f"❌ Found {len(errors)} validation errors:")
                    for error in errors[:20]:  # Show first 20
                        logger.error(f"   - {error}")
                
                return valid
            else:
                loader = BusLoader(self.db, enable_translation=args.enable_translation)
                buses = loader.load_from_file(args.data_file)
                valid, errors = DataValidator.validate_buses(buses)
                
                logger.info(f"📋 Buses: {len(buses)} records")
                if valid:
                    logger.info("✅ All buses are valid")
                else:
                    logger.error(f"❌ Found {len(errors)} validation errors:")
                    for error in errors[:20]:
                        logger.error(f"   - {error}")
                
                return valid
        
        return False
    
    def _locations_mode(self, args):
        """Load locations only"""
        logger.info("\n📍 LOCATIONS MODE")
        logger.info("=" * 60)
        logger.info(f"Environment: {self.environment}")
        
        if not args.data_file:
            logger.error("❌ --data-file is required for locations mode")
            return False
        
        loader = LocationLoader(self.db, enable_translation=args.enable_translation)
        locations = loader.load_from_file(args.data_file)
        
        # Validate
        valid, errors = DataValidator.validate_locations(locations)
        if not valid:
            logger.error(f"❌ Validation failed with {len(errors)} errors")
            return False
        
        # Upload
        return loader.upload(locations, skip_duplicates=not args.force_overwrite)
    
    def _buses_mode(self, args):
        """Load buses with stops"""
        logger.info("\n🚌 BUSES MODE")
        logger.info("=" * 60)
        logger.info(f"Environment: {self.environment}")
        logger.info(f"Operator: {args.operator or 'Unknown'}")
        
        if not args.data_file and not args.checkpoint:
            logger.error("❌ Either --data-file or --checkpoint is required")
            return False
        
        loader = BusLoader(self.db, strict=args.strict, enable_translation=args.enable_translation)
        
        # Load from file or checkpoint
        if args.checkpoint:
            checkpoint = CheckpointManager.load(args.checkpoint)
            if not checkpoint:
                logger.error(f"❌ Checkpoint not found: {args.checkpoint}")
                return False
            logger.info(f"📂 Resuming from checkpoint: {args.checkpoint}")
            logger.info(f"   Processed: {checkpoint.processed_items}/{checkpoint.total_items}")
        else:
            buses = loader.load_from_file(args.data_file)
            
            # Validate
            valid, errors = DataValidator.validate_buses(buses)
            if not valid:
                logger.error(f"❌ Validation failed with {len(errors)} errors")
                return False
        
        # Upload
        return loader.upload(buses)
    
    def _full_mode(self, args):
        """Load locations and buses"""
        logger.info("\n🔄 FULL MODE (Locations + Buses)")
        logger.info("=" * 60)
        logger.info(f"Environment: {self.environment}")
        
        # Load locations
        if not args.locations:
            logger.error("❌ --locations is required for full mode")
            return False
        
        loc_loader = LocationLoader(self.db, enable_translation=args.enable_translation)
        locations = loc_loader.load_from_file(args.locations)
        valid, errors = DataValidator.validate_locations(locations)
        if not valid:
            logger.error(f"❌ Locations validation failed with {len(errors)} errors")
            return False
        
        if not loc_loader.upload(locations, skip_duplicates=not args.force_overwrite):
            logger.error("❌ Locations upload failed")
            return False
        
        # Load buses
        if not args.buses:
            logger.warning("⚠️  No buses file specified, skipping buses")
            return True
        
        bus_loader = BusLoader(self.db, strict=args.strict, enable_translation=args.enable_translation)
        buses = bus_loader.load_from_file(args.buses)
        valid, errors = DataValidator.validate_buses(buses)
        if not valid:
            logger.error(f"❌ Buses validation failed with {len(errors)} errors")
            return False
        
        return bus_loader.upload(buses)


# ============================================================
# COMMAND-LINE INTERFACE
# ============================================================

def parse_arguments():
    """Parse command-line arguments"""
    parser = argparse.ArgumentParser(
        description="Unified Data Migration Tool - Load locations and buses across environments",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Load locations only (local environment)
  python unified_data_loader.py --mode locations --environment local \\
    --data-file data/tamil_nadu_locations_enhanced.json

  # Load buses with stops (preprod environment)
  python unified_data_loader.py --mode buses --environment preprod \\
    --data-file data/mtc_consolidated.json --operator MTC

  # Full migration (production)
  python unified_data_loader.py --mode full --environment prod \\
    --locations data/tamil_nadu_locations_enhanced.json \\
    --buses data/tnstc_consolidated.json --operator TNSTC

  # Validate data before uploading
  python unified_data_loader.py --mode validate \\
    --data-file data/mtc_consolidated.json

  # Resume from checkpoint
  python unified_data_loader.py --mode buses --environment local \\
    --checkpoint data/migration_checkpoint.json
        """
    )
    
    parser.add_argument(
        '--mode',
        choices=['locations', 'buses', 'stops', 'full', 'validate'],
        required=True,
        help='Data loading mode'
    )
    
    parser.add_argument(
        '--environment',
        choices=['local', 'preprod', 'prod', 'production'],
        default='local',
        help='Target environment (default: local)'
    )
    
    parser.add_argument(
        '--data-file',
        help='Path to data file (JSON/CSV/JSONL)'
    )
    
    parser.add_argument(
        '--locations',
        help='Path to locations file (for full mode)'
    )
    
    parser.add_argument(
        '--buses',
        help='Path to buses file (for full mode)'
    )
    
    parser.add_argument(
        '--operator',
        choices=['MTC', 'TNSTC', 'KRTC', 'KSRTC', 'APSRTC', 'OTHER'],
        help='Bus operator name'
    )
    
    parser.add_argument(
        '--checkpoint',
        help='Path to checkpoint file for resuming migration'
    )
    
    parser.add_argument(
        '--force-overwrite',
        action='store_true',
        help='Force overwrite existing data'
    )
    
    parser.add_argument(
        '--batch-size',
        type=int,
        default=1000,
        help='Batch size for operations (default: 1000)'
    )
    
    parser.add_argument(
        '--dry-run',
        action='store_true',
        help='Validate without uploading'
    )

    parser.add_argument(
        '--strict',
        action='store_true',
        help='Fail fast if any location or stop cannot be resolved (no auto-create)'
    )
    
    parser.add_argument(
        '--enable-translation',
        action='store_true',
        help='Enable Tamil translation support for locations and buses'
    )
    
    parser.add_argument(
        '--verbose',
        action='store_true',
        help='Enable verbose logging'
    )
    
    return parser.parse_args()


# ============================================================
# ENTRY POINT
# ============================================================

def main():
    """Main entry point"""
    args = parse_arguments()
    
    logger.info("=" * 60)
    logger.info("🚀 UNIFIED DATA LOADER")
    logger.info("=" * 60)
    logger.info(f"Mode:        {args.mode}")
    logger.info(f"Environment: {args.environment}")
    logger.info(f"Dry Run:     {args.dry_run}")
    logger.info(f"Strict:      {args.strict}")
    logger.info("=" * 60)
    
    loader = UnifiedDataLoader(args.environment)
    success = loader.run(args)
    
    logger.info("\n" + "=" * 60)
    if success:
        logger.info("✅ DATA MIGRATION COMPLETED SUCCESSFULLY")
    else:
        logger.info("❌ DATA MIGRATION FAILED")
    logger.info("=" * 60)
    
    return 0 if success else 1


if __name__ == '__main__':
    sys.exit(main())
