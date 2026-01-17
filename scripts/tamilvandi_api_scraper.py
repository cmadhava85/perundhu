#!/usr/bin/env python3
"""
Fast Tamil Vandi API-only Scraper
Uses direct API calls without browser automation for maximum speed.
Requires a valid auth token.

Usage:
    python tamilvandi_api_scraper.py --auth-token TOKEN --route-list routes.txt --output data/output
    python tamilvandi_api_scraper.py --auth-token TOKEN --from "Chennai" --to "Madurai"
"""

import requests
import json
import csv
import logging
import argparse
import time
from pathlib import Path
from datetime import datetime
from typing import List, Dict, Optional, Set
from dataclasses import dataclass, asdict

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@dataclass
class BusRoute:
    """Data class for bus route information"""
    bus_number: str
    bus_type: str
    operator_name: str
    origin: str
    destination: str
    departure_time: str
    arrival_time: str
    stops: List[str]
    scraped_at: str


class TamilVandiAPIFastScraper:
    """Fast API-only scraper for Tamil Vandi bus timings"""
    
    API_ENDPOINT = "https://www.tamilvandi.com/_api/wix-code-public-dispatcher-ng/siteview/_webMethods/backend/googleSheetFetch.jsw/getSheetDataPaginated.ajax"
    GRID_APP_ID = "ee62bd20-2f2c-4073-bdd3-3e5bb29c2a48"
    
    def __init__(self, auth_token: str, delay: float = 0.5):
        """
        Initialize the scraper.
        
        Args:
            auth_token: Wix authentication token
            delay: Delay between API calls (default 0.5s for politeness)
        """
        self.auth_token = auth_token
        self.delay = delay
        self.session = requests.Session()
        self.all_routes: List[BusRoute] = []
        self.seen_routes: Set[str] = set()
        
        # Setup headers
        self.session.headers.update({
            'accept': 'application/json, text/plain, */*',
            'accept-language': 'en-US,en;q=0.9',
            'authorization': auth_token,
            'content-type': 'application/json',
            'origin': 'https://www.tamilvandi.com',
            'referer': 'https://www.tamilvandi.com/timings',
            'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
            'x-wix-app-instance': auth_token,
        })
    
    def fetch_page(self, from_city: str, to_city: str, page_number: int, page_size: int = 50) -> Optional[Dict]:
        """
        Fetch a single page of data from the API.
        
        Args:
            from_city: Origin city
            to_city: Destination city
            page_number: Page number (0-indexed)
            page_size: Number of results per page
            
        Returns:
            API response dict or None if failed
        """
        url = f"{self.API_ENDPOINT}?gridAppId={self.GRID_APP_ID}&viewMode=site"
        payload = [page_number, page_size, from_city, to_city]
        
        try:
            response = self.session.post(url, json=payload, timeout=10)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.debug(f"API call failed: {e}")
            return None
    
    def parse_api_response(self, api_data: Dict, from_city: str, to_city: str) -> List[BusRoute]:
        """Parse API response and extract route data"""
        routes = []
        scraped_at = datetime.now().isoformat()
        
        try:
            # Handle Wix API format: {'result': {'total': 100, 'results': [...]}}
            if 'result' in api_data and isinstance(api_data['result'], dict):
                result = api_data['result']
                items = result.get('results', [])
                total = result.get('total', 0)
                logger.debug(f"Page has {len(items)} items (total: {total})")
            else:
                logger.warning("Unexpected API response format")
                return []
            
            for item in items:
                try:
                    # Extract fields from Wix format
                    operator_name = item.get('corporation') or item.get('operator') or 'N/A'
                    departure_time = item.get('dep') or item.get('departure') or ''
                    bus_type = item.get('type') or 'Unknown'
                    origin = item.get('from', from_city)
                    destination = item.get('to', to_city)
                    
                    if not (operator_name and departure_time):
                        continue
                    
                    # Create unique key for deduplication
                    route_key = f"{origin}|{destination}|{operator_name}|{departure_time}|{bus_type}"
                    if route_key in self.seen_routes:
                        continue
                    
                    self.seen_routes.add(route_key)
                    
                    route = BusRoute(
                        bus_number=str(operator_name),
                        bus_type=str(bus_type),
                        operator_name=str(operator_name),
                        origin=origin,
                        destination=destination,
                        departure_time=str(departure_time),
                        arrival_time='',
                        stops=[],
                        scraped_at=scraped_at
                    )
                    routes.append(route)
                    
                except Exception as e:
                    logger.debug(f"Error parsing item: {e}")
                    continue
            
            return routes
            
        except Exception as e:
            logger.error(f"Error parsing API response: {e}")
            return []
    
    def scrape_route(self, from_city: str, to_city: str) -> int:
        """
        Scrape all pages for a route pair.
        
        Returns:
            Number of routes collected
        """
        logger.info(f"Scraping: {from_city} → {to_city}")
        route_count = 0
        page_number = 0
        page_size = 50
        
        while True:
            # Fetch page
            api_data = self.fetch_page(from_city, to_city, page_number, page_size)
            if not api_data:
                logger.debug(f"No data on page {page_number}, stopping")
                break
            
            # Parse routes
            routes = self.parse_api_response(api_data, from_city, to_city)
            if not routes:
                logger.debug(f"No new routes on page {page_number}, stopping")
                break
            
            self.all_routes.extend(routes)
            route_count += len(routes)
            logger.info(f"  Page {page_number}: +{len(routes)} routes (total: {len(self.all_routes)})")
            
            # Check if there are more pages
            if 'result' in api_data:
                total = api_data['result'].get('total', 0)
                current_page = api_data['result'].get('page', page_number)
                per_page = api_data['result'].get('perPage', page_size)
                
                # If we've collected all available items, stop
                if (current_page + 1) * per_page >= total:
                    logger.debug(f"Reached end: page {current_page}, total {total}")
                    break
            
            page_number += 1
            time.sleep(self.delay)
        
        return route_count
    
    def scrape_routes_from_file(self, route_file: str):
        """Scrape all route pairs from a file"""
        route_file = Path(route_file)
        if not route_file.exists():
            logger.error(f"Route file not found: {route_file}")
            return
        
        # Read route pairs
        routes = []
        with open(route_file, 'r') as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith('#'):
                    continue
                
                if ',' in line:
                    parts = line.split(',')
                    if len(parts) >= 2:
                        routes.append((parts[0].strip(), parts[1].strip()))
        
        logger.info(f"Loaded {len(routes)} route pairs from {route_file}")
        
        # Scrape each route
        for i, (from_city, to_city) in enumerate(routes, 1):
            try:
                count = self.scrape_route(from_city, to_city)
                logger.info(f"[{i}/{len(routes)}] {from_city} → {to_city}: {count} routes")
            except Exception as e:
                logger.error(f"Error scraping {from_city} → {to_city}: {e}")
                continue
        
        logger.info(f"\n=== Complete! Total routes: {len(self.all_routes)} ===")
    
    def save_to_json(self, filepath: str):
        """Save routes to JSON file"""
        filepath = Path(filepath)
        filepath.parent.mkdir(parents=True, exist_ok=True)
        
        data = [asdict(route) for route in self.all_routes]
        
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        
        logger.info(f"Saved {len(data)} routes to JSON: {filepath}")
    
    def save_to_csv(self, filepath: str):
        """Save routes to CSV file"""
        filepath = Path(filepath)
        filepath.parent.mkdir(parents=True, exist_ok=True)
        
        if not self.all_routes:
            logger.warning("No routes to save")
            return
        
        with open(filepath, 'w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            writer.writerow([
                'bus_number', 'bus_type', 'operator_name', 'origin', 'destination',
                'departure_time', 'arrival_time', 'stops_json', 'scraped_at'
            ])
            
            for route in self.all_routes:
                stops_json = json.dumps(route.stops, ensure_ascii=False)
                writer.writerow([
                    route.bus_number, route.bus_type, route.operator_name,
                    route.origin, route.destination, route.departure_time,
                    route.arrival_time, stops_json, route.scraped_at
                ])
        
        logger.info(f"Saved {len(self.all_routes)} routes to CSV: {filepath}")


def main():
    parser = argparse.ArgumentParser(description='Fast Tamil Vandi API Scraper')
    parser.add_argument('--auth-token', required=True, help='Wix authentication token')
    parser.add_argument('--from', dest='from_city', help='Origin city')
    parser.add_argument('--to', dest='to_city', help='Destination city')
    parser.add_argument('--route-list', help='File with route pairs (format: from,to)')
    parser.add_argument('--output', required=True, help='Output file prefix (without extension)')
    parser.add_argument('--delay', type=float, default=0.5, help='Delay between requests (default: 0.5s)')
    
    args = parser.parse_args()
    
    # Validate inputs
    if not args.route_list and not (args.from_city and args.to_city):
        parser.error("Either --route-list or both --from and --to must be provided")
    
    # Create scraper
    scraper = TamilVandiAPIFastScraper(
        auth_token=args.auth_token,
        delay=args.delay
    )
    
    # Scrape routes
    if args.route_list:
        scraper.scrape_routes_from_file(args.route_list)
    else:
        scraper.scrape_route(args.from_city, args.to_city)
    
    # Save results
    scraper.save_to_json(f"{args.output}.json")
    scraper.save_to_csv(f"{args.output}.csv")


if __name__ == '__main__':
    main()
