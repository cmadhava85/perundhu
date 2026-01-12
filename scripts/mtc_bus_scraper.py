#!/usr/bin/env python3
"""
MTC Chennai Bus Timing Scraper
Scrapes bus timing data from https://mtcbus.tn.gov.in and stores in MySQL database.

API Endpoints discovered:
- Main page: https://mtcbus.tn.gov.in/Home/bustimingsearch
- Get origins by route: POST https://mtcbus.tn.gov.in/Home/getoriginbyroute/{route_id}
- Get destinations by route+origin: POST https://mtcbus.tn.gov.in/Home/getdestinationrouteorigin/{route_id}/{origin_id}
- Get timings: POST https://mtcbus.tn.gov.in/Home/bustimingsearch with params
"""

import requests
from bs4 import BeautifulSoup
import time
import re
import logging
from typing import List, Dict, Optional
from datetime import datetime
import mysql.connector
from mysql.connector import Error
import argparse
import sys
from dataclasses import dataclass
from urllib.parse import urlencode
import urllib3

# Suppress SSL warnings for government sites
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@dataclass
class BusTiming:
    """Data class for bus timing information"""
    route_number: str
    origin_name: str
    destination_name: str
    timing: str
    scraped_at: datetime


class MTCBusScraper:
    """Scraper for MTC Chennai bus timings"""
    
    BASE_URL = "https://mtcbus.tn.gov.in"
    SEARCH_URL = f"{BASE_URL}/Home/bustimingsearch"
    
    def __init__(self, db_config: Dict[str, str], delay: float = 1.0):
        """
        Initialize the scraper
        
        Args:
            db_config: MySQL database configuration
            delay: Delay between requests in seconds (default: 1.0)
        """
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Connection': 'keep-alive',
        })
        # Disable SSL verification for government site
        self.session.verify = False
        self.delay = delay
        self.db_config = db_config
        self.connection = None
        self.csrf_token = None
        
    def connect_db(self):
        """Establish database connection"""
        try:
            self.connection = mysql.connector.connect(**self.db_config)
            if self.connection.is_connected():
                logger.info(f"Connected to MySQL database: {self.db_config['database']}")
                self._create_tables()
        except Error as e:
            logger.error(f"Error connecting to MySQL: {e}")
            raise
    
    def _create_tables(self):
        """Create necessary database tables if they don't exist"""
        create_table_query = """
        CREATE TABLE IF NOT EXISTS mtc_bus_timings (
            id INT AUTO_INCREMENT PRIMARY KEY,
            route_number VARCHAR(20) NOT NULL,
            origin_name VARCHAR(255) NOT NULL,
            destination_name VARCHAR(255) NOT NULL,
            timing VARCHAR(10) NOT NULL,
            scraped_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_route (route_number),
            INDEX idx_origin (origin_name),
            INDEX idx_destination (destination_name),
            INDEX idx_timing (timing),
            UNIQUE KEY unique_timing (route_number, origin_name, destination_name, timing)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        """
        
        try:
            cursor = self.connection.cursor()
            cursor.execute(create_table_query)
            self.connection.commit()
            logger.info("Database table 'mtc_bus_timings' ready")
            cursor.close()
        except Error as e:
            logger.error(f"Error creating table: {e}")
            raise
    
    def close_db(self):
        """Close database connection"""
        if self.connection and self.connection.is_connected():
            self.connection.close()
            logger.info("MySQL connection closed")
    
    def _rate_limit(self):
        """Apply rate limiting delay"""
        time.sleep(self.delay)
    
    def get_routes(self) -> List[Dict[str, str]]:
        """
        Fetch all available bus routes from the main page
        
        Returns:
            List of route dictionaries with 'value' and 'text' keys
        """
        logger.info("Fetching available routes...")
        try:
            response = self.session.get(self.SEARCH_URL, timeout=30)
            response.raise_for_status()
            
            # Store cookies and CSRF token from initial page load
            self.csrf_token = None
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Try to find CSRF token
            csrf_input = soup.find('input', {'name': 'csrf_test_name'})
            if csrf_input:
                self.csrf_token = csrf_input.get('value')
                logger.info(f"Found CSRF token: {self.csrf_token[:20]}...")
            
            route_select = soup.find('select', {'name': 'selroute'})
            
            if not route_select:
                logger.error("Could not find route dropdown")
                return []
            
            routes = []
            for option in route_select.find_all('option'):
                value = option.get('value', '').strip()
                text = option.text.strip()
                if value and value != '':  # Skip empty/placeholder options
                    routes.append({'value': value, 'text': text})
            
            logger.info(f"Found {len(routes)} routes")
            return routes
            
        except Exception as e:
            logger.error(f"Error fetching routes: {e}")
            return []
    
    def get_origins_by_route(self, route_id: str) -> List[Dict[str, str]]:
        """
        Fetch origin points for a specific route
        
        Args:
            route_id: Route identifier (e.g., '101', '102A')
            
        Returns:
            List of origin dictionaries with 'value' and 'text' keys
        """
        url = f"{self.BASE_URL}/Home/getoriginbyroute/{route_id}"
        logger.info(f"Fetching origins for route {route_id}...")
        
        try:
            
            # Add referer and include CSRF if available
            headers = {
                'Referer': self.SEARCH_URL,
                'X-Requested-With': 'XMLHttpRequest'
            }
            
            data = {}
            if self.csrf_token:
                data['csrf_test_name'] = self.csrf_token
            
            response = self.session.post(url, headers=headers, data=data, timeout=30)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            origin_select = soup.find('select', {'name': 'selfrom'})
            
            if not origin_select:
                logger.warning(f"No origins found for route {route_id}")
                return []
            
            origins = []
            for option in origin_select.find_all('option'):
                value = option.get('value', '').strip()
                text = option.text.strip()
                if value and value != '':
                    origins.append({'value': value, 'text': text})
            
            logger.info(f"Found {len(origins)} origins for route {route_id}")
            return origins
            
        except Exception as e:
            logger.error(f"Error fetching origins for route {route_id}: {e}")
            return []
    
    def get_destinations_by_route_origin(self, route_id: str, origin_id: str) -> List[Dict[str, str]]:
        """
        Fetch destination points for a specific route and origin
        
        Args:
            
            headers = {
                'Referer': self.SEARCH_URL,
                'X-Requested-With': 'XMLHttpRequest'
            }
            
            data = {}
            if self.csrf_token:
                data['csrf_test_name'] = self.csrf_token
            
            response = self.session.post(url, headers=headers, data=data
            origin_id: Origin point identifier
            
        Returns:
            List of destination dictionaries with 'value' and 'text' keys
        """
        url = f"{self.BASE_URL}/Home/getdestinationrouteorigin/{route_id}/{origin_id}"
        logger.info(f"Fetching destinations for route {route_id}, origin {origin_id}...")
        
        try:
            self._rate_limit()
            response = self.session.post(url, timeout=30)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            dest_select = soup.find('select', {'name': 'selto'})
            
            if not dest_select:
                logger.warning(f"No destinations found for route {route_id}, origin {origin_id}")
                return []
            
            destinations = []
            for option in dest_select.find_all('option'):
                value = option.get('value', '').strip()
                text = option.text.strip()
                if value and value != '':
                    destinations.append({'value': value, 'text': text})
            
            logger.info(f"Found {len(destinations)} destinations")
            return destinations
            
        except Exception as e:
            logger.error(f"Error fetching destinations: {e}")
            return []
    
    def get_timings(self, route_id: str, origin_id: str, dest_id: str,
                   route_name: str, origin_name: str, dest_name: str) -> List[BusTiming]:
        """
        Fetch bus timings for a specific route, origin, and destination
        
        Args:
            route_id: Route identifier
            origin_id: Origin point identifier
            dest_id: Destination point identifier
            route_name: Route display name
            origin_name: Origin display name
            dest_name: Destination display name
            
        Returns:
            List of BusTiming objects
        """
        logger.info(f"Fetching timings: {route_name} from {origin_name} to {dest_name}")
        
        try:
            self._rate_limit()
            
            # The form submission requires these parameters
            data = {
                'selroute': route_id,
                'selfrom': origin_id,
                'selto': dest_id,
                'submit': ''
            }
            
            response = self.session.post(self.SEARCH_URL, data=data, timeout=30)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Find timing elements - they appear to be in divs or spans with clock icons
            timings = []
            timing_pattern = re.compile(r'\d{2}:\d{2}')
            
            # Look for timing containers (based on the screenshot structure)
            # Timings appear in multiple location sections
            sections = soup.find_all(['div', 'span'], class_=re.compile(r'timing|time|schedule', re.I))
            
            # If no class-based match, try finding all times matching HH:MM pattern
            if not sections:
                all_text = soup.get_text()
                times_found = timing_pattern.findall(all_text)
                for timing_str in times_found:
                    timings.append(BusTiming(
                        route_number=route_name,
                        origin_name=origin_name,
                        destination_name=dest_name,
                        timing=timing_str,
                        scraped_at=datetime.now()
                    ))
            else:
                for section in sections:
                    text = section.get_text()
                    times_found = timing_pattern.findall(text)
                    for timing_str in times_found:
                        timings.append(BusTiming(
                            route_number=route_name,
                            origin_name=origin_name,
                            destination_name=dest_name,
                            timing=timing_str,
                            scraped_at=datetime.now()
                        ))
            
            # Remove duplicates
            unique_timings = []
            seen = set()
            for timing in timings:
                key = (timing.route_number, timing.origin_name, timing.destination_name, timing.timing)
                if key not in seen:
                    seen.add(key)
                    unique_timings.append(timing)
            
            logger.info(f"Found {len(unique_timings)} unique timings")
            return unique_timings
            
        except Exception as e:
            logger.error(f"Error fetching timings: {e}")
            return []
    
    def save_timings(self, timings: List[BusTiming]) -> int:
        """
        Save bus timings to database
        
        Args:
            timings: List of BusTiming objects to save
            
        Returns:
            Number of records saved
        """
        if not timings:
            return 0
        
        insert_query = """
        INSERT INTO mtc_bus_timings 
        (route_number, origin_name, destination_name, timing, scraped_at)
        VALUES (%s, %s, %s, %s, %s)
        ON DUPLICATE KEY UPDATE scraped_at = VALUES(scraped_at)
        """
        
        try:
            cursor = self.connection.cursor()
            data = [
                (t.route_number, t.origin_name, t.destination_name, t.timing, t.scraped_at)
                for t in timings
            ]
            cursor.executemany(insert_query, data)
            self.connection.commit()
            saved_count = cursor.rowcount
            cursor.close()
            logger.info(f"Saved {saved_count} timing records")
            return saved_count
            
        except Error as e:
            logger.error(f"Error saving timings: {e}")
            return 0
    
    def scrape_all(self, limit_routes: Optional[int] = None):
        """
        Main scraping method - scrapes all routes, origins, destinations, and timings
        
        Args:
            limit_routes: Optional limit on number of routes to process (for testing)
        """
        logger.info("=== Starting MTC Bus Timing Scraper ===")
        
        # Connect to database
        self.connect_db()
        
        try:
            # Get all routes
            routes = self.get_routes()
            if not routes:
                logger.error("No routes found. Exiting.")
                return
            
            if limit_routes:
                routes = routes[:limit_routes]
                logger.info(f"Limited to first {limit_routes} routes")
            
            total_timings = 0
            
            # Process each route
            for route_idx, route in enumerate(routes, 1):
                route_id = route['value']
                route_name = route['text']
                
                logger.info(f"\n[{route_idx}/{len(routes)}] Processing route: {route_name}")
                
                # Get origins for this route
                origins = self.get_origins_by_route(route_id)
                if not origins:
                    logger.warning(f"No origins for route {route_name}, skipping")
                    continue
                
                # Process each origin
                for origin_idx, origin in enumerate(origins, 1):
                    origin_id = origin['value']
                    origin_name = origin['text']
                    
                    logger.info(f"  [{origin_idx}/{len(origins)}] Origin: {origin_name}")
                    
                    # Get destinations for this route+origin
                    destinations = self.get_destinations_by_route_origin(route_id, origin_id)
                    if not destinations:
                        logger.warning(f"No destinations for {route_name} from {origin_name}")
                        continue
                    
                    # Process each destination
                    for dest_idx, dest in enumerate(destinations, 1):
                        dest_id = dest['value']
                        dest_name = dest['text']
                        
                        logger.info(f"    [{dest_idx}/{len(destinations)}] Destination: {dest_name}")
                        
                        # Get and save timings
                        timings = self.get_timings(
                            route_id, origin_id, dest_id,
                            route_name, origin_name, dest_name
                        )
                        
                        if timings:
                            saved = self.save_timings(timings)
                            total_timings += saved
            
            logger.info(f"\n=== Scraping complete! Total timings saved: {total_timings} ===")
            
        finally:
            self.close_db()


def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(
        description='Scrape MTC Chennai bus timings and store in MySQL database'
    )
    parser.add_argument(
        '--host', 
        default='localhost',
        help='MySQL host (default: localhost)'
    )
    parser.add_argument(
        '--port',
        type=int,
        default=3306,
        help='MySQL port (default: 3306)'
    )
    parser.add_argument(
        '--database',
        default='perundhu',
        help='MySQL database name (default: perundhu)'
    )
    parser.add_argument(
        '--user',
        default='root',
        help='MySQL username (default: root)'
    )
    parser.add_argument(
        '--password',
        default='root',
        help='MySQL password (default: root)'
    )
    parser.add_argument(
        '--delay',
        type=float,
        default=1.0,
        help='Delay between requests in seconds (default: 1.0)'
    )
    parser.add_argument(
        '--limit-routes',
        type=int,
        help='Limit number of routes to process (for testing)'
    )
    parser.add_argument(
        '--verbose',
        action='store_true',
        help='Enable verbose logging'
    )
    
    args = parser.parse_args()
    
    if args.verbose:
        logger.setLevel(logging.DEBUG)
    
    # Database configuration
    db_config = {
        'host': args.host,
        'port': args.port,
        'database': args.database,
        'user': args.user,
        'password': args.password,
        'charset': 'utf8mb4',
        'use_unicode': True,
        'autocommit': False
    }
    
    # Create scraper and run
    scraper = MTCBusScraper(db_config, delay=args.delay)
    
    try:
        scraper.scrape_all(limit_routes=args.limit_routes)
    except KeyboardInterrupt:
        logger.info("\nScraping interrupted by user")
        sys.exit(1)
    except Exception as e:
        logger.error(f"Fatal error: {e}", exc_info=True)
        sys.exit(1)


if __name__ == '__main__':
    main()
