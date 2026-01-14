#!/usr/bin/env python3
"""
MTC Chennai Bus Timing Scraper with Selenium
Scrapes bus timing data from https://mtcbus.tn.gov.in using browser automation.
Outputs to JSON and CSV files.

Usage:
    python mtc_bus_scraper_selenium.py --limit-routes 2 --output data/mtc_timings
"""

import time
import json
import csv
import logging
import argparse
import sys
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Optional, Set, Tuple
from dataclasses import dataclass, asdict

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait, Select
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service

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
    route_name: str
    origin_value: str
    origin_name: str
    destination_value: str
    destination_name: str
    timing: str
    scraped_at: str


class MTCBusScraperSelenium:
    """Selenium-based scraper for MTC Chennai bus timings"""
    
    URL = "https://mtcbus.tn.gov.in/Home/bustimingsearch"
    
    def __init__(
        self,
        delay: float = 2.0,
        headless: bool = True,
        checkpoint_path: Optional[Path] = None,
        processed_pairs: Optional[Set[Tuple[str, str, str]]] = None,
        existing_timings: Optional[List[BusTiming]] = None,
    ):
        """
        Initialize the Selenium scraper
        
        Args:
            delay: Delay between operations in seconds
            headless: Run browser in headless mode
        """
        self.delay = delay
        self.headless = headless
        self.driver = None
        self.all_timings: List[BusTiming] = existing_timings or []
        self.checkpoint_path = checkpoint_path
        self.processed_pairs: Set[Tuple[str, str, str]] = processed_pairs or set()
        
    def _setup_driver(self):
        """Setup Chrome WebDriver"""
        logger.info("Setting up Chrome WebDriver...")
        
        chrome_options = Options()
        if self.headless:
            chrome_options.add_argument('--headless')
        chrome_options.add_argument('--no-sandbox')
        chrome_options.add_argument('--disable-dev-shm-usage')
        chrome_options.add_argument('--disable-gpu')
        chrome_options.add_argument('--ignore-certificate-errors')
        chrome_options.add_argument('--disable-blink-features=AutomationControlled')
        chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
        chrome_options.add_experimental_option('useAutomationExtension', False)
        
        self.driver = webdriver.Chrome(options=chrome_options)
        self.driver.set_page_load_timeout(120)  # 2 minutes for very slow MTC site
        self.driver.implicitly_wait(10)  # Wait up to 10s for elements to appear
        logger.info("WebDriver ready")
    
    def _close_driver(self):
        """Close the WebDriver"""
        if self.driver:
            self.driver.quit()
            logger.info("WebDriver closed")
    
    def _wait_for_element(self, by: By, value: str, timeout: int = 10):
        """Wait for an element to be present"""
        return WebDriverWait(self.driver, timeout).until(
            EC.presence_of_element_located((by, value))
        )
    
    def _wait_for_dropdown_options(self, select_id: str, min_options: int = 2, timeout: int = 10):
        """Wait for dropdown to have more than placeholder option"""
        end_time = time.time() + timeout
        while time.time() < end_time:
            try:
                select_element = Select(self.driver.find_element(By.ID, select_id))
                options = select_element.options
                # Check if we have more than just the placeholder
                valid_options = [opt for opt in options if opt.get_attribute('value') not in ['', None]]
                if len(valid_options) >= min_options:
                    return True
                time.sleep(0.5)
            except:
                time.sleep(0.5)
        return False
    
    def get_all_routes(self) -> List[Dict[str, str]]:
        """Get all available routes from the dropdown"""
        logger.info("Loading page and fetching routes...")
        
        try:
            self.driver.get(self.URL)
            time.sleep(3)  # Let page load completely
            
            # Wait longer for route select element
            route_select = Select(self._wait_for_element(By.ID, 'selroute', timeout=30))
            
            routes = []
            for option in route_select.options:
                value = option.get_attribute('value')
                text = option.text.strip()
                if value and value != '':
                    routes.append({'value': value, 'text': text})
            
            logger.info(f"Found {len(routes)} routes")
            return routes
            
        except Exception as e:
            logger.error(f"Error fetching routes: {e}")
            return []
    
    def get_origins_for_route(self, route_value: str) -> List[Dict[str, str]]:
        """Get all origins for a specific route"""
        try:
            # Select the route
            route_select = Select(self.driver.find_element(By.ID, 'selroute'))
            route_select.select_by_value(route_value)
            
            # Wait for origins to load
            time.sleep(self.delay)
            
            # Check if origins loaded
            if not self._wait_for_dropdown_options('selfrom', min_options=1, timeout=5):
                logger.warning(f"No origins loaded for route {route_value}")
                return []
            
            # Get origin options
            origin_select = Select(self.driver.find_element(By.ID, 'selfrom'))
            origins = []
            
            for option in origin_select.options:
                value = option.get_attribute('value')
                text = option.text.strip()
                if value and value != '' and text not in ['--Origin--', '--Select--']:
                    origins.append({'value': value, 'text': text})
            
            logger.info(f"  Found {len(origins)} origins")
            return origins
            
        except Exception as e:
            logger.error(f"Error getting origins for route {route_value}: {e}")
            return []
    
    def get_destinations_for_origin(self, origin_value: str) -> List[Dict[str, str]]:
        """Get all destinations for current route and origin"""
        try:
            # Select the origin
            origin_select = Select(self.driver.find_element(By.ID, 'selfrom'))
            origin_select.select_by_value(origin_value)
            
            # Wait for destinations to load
            time.sleep(self.delay)
            
            # Check if destinations loaded
            if not self._wait_for_dropdown_options('selto', min_options=1, timeout=5):
                logger.warning(f"No destinations loaded for origin {origin_value}")
                return []
            
            # Get destination options
            dest_select = Select(self.driver.find_element(By.ID, 'selto'))
            destinations = []
            
            for option in dest_select.options:
                value = option.get_attribute('value')
                text = option.text.strip()
                if value and value != '' and text not in ['--Destination--', '--Select--']:
                    destinations.append({'value': value, 'text': text})
            
            logger.info(f"    Found {len(destinations)} destinations")
            return destinations
            
        except Exception as e:
            logger.error(f"Error getting destinations for origin {origin_value}: {e}")
            return []
    
    def get_timings(self, route: Dict, origin: Dict, destination: Dict) -> List[BusTiming]:
        """Get timings for specific route, origin, and destination"""
        try:
            # Select destination
            dest_select = Select(self.driver.find_element(By.ID, 'selto'))
            dest_select.select_by_value(destination['value'])
            
            # Submit the form (look for submit button or trigger search)
            time.sleep(self.delay)
            
            try:
                # Try to find and click submit button
                submit_btn = self.driver.find_element(By.CSS_SELECTOR, 'button[type="submit"], input[type="submit"]')
                submit_btn.click()
            except:
                # If no submit button, the search might be triggered automatically
                pass
            
            # Wait for results to load
            time.sleep(self.delay)
            
            # Find timing elements - they appear in the "Found Timings" section
            timings = []
            scraped_at = datetime.now().isoformat()
            
            # Look for timing patterns (HH:MM format)
            try:
                import re
                
                # Wait a bit more for results to fully load
                time.sleep(1)
                
                # Try to find timing containers
                result_container = self.driver.find_element(By.ID, 'bustimingresult')
                
                # Get both HTML and text content
                result_html = result_container.get_attribute('innerHTML')
                result_text = result_container.text
                
                found_times = set()
                
                # Pattern to match time in HH:MM format (more permissive)
                # Matches: 5:42, 05:42, 19:50, 20:12, etc.
                time_pattern = re.compile(r'\b(\d{1,2}):(\d{2})\b')
                
                # First try: search in the full text (which is what user sees)
                text_matches = time_pattern.findall(result_text)
                for hour, minute in text_matches:
                    h = int(hour)
                    m = int(minute)
                    # Validate time
                    if 0 <= h <= 23 and 0 <= m <= 59:
                        timing_str = f"{h:02d}:{m:02d}"
                        found_times.add(timing_str)
                
                # Second try: search in HTML if text didn't work
                if not found_times:
                    html_matches = time_pattern.findall(result_html)
                    for hour, minute in html_matches:
                        h = int(hour)
                        m = int(minute)
                        if 0 <= h <= 23 and 0 <= m <= 59:
                            timing_str = f"{h:02d}:{m:02d}"
                            found_times.add(timing_str)
                
                # Third try: look for specific timing elements (divs/spans with clock icons)
                if not found_times:
                    timing_elements = result_container.find_elements(By.XPATH, 
                        ".//*[contains(@class, 'btn') or contains(text(), ':')]")
                    for elem in timing_elements:
                        text = elem.text.strip()
                        matches = time_pattern.findall(text)
                        for hour, minute in matches:
                            h = int(hour)
                            m = int(minute)
                            if 0 <= h <= 23 and 0 <= m <= 59:
                                timing_str = f"{h:02d}:{m:02d}"
                                found_times.add(timing_str)
                
                # Create BusTiming objects
                for timing_str in sorted(found_times):
                    timings.append(BusTiming(
                        route_number=route['value'],
                        route_name=route['text'],
                        origin_value=origin['value'],
                        origin_name=origin['text'],
                        destination_value=destination['value'],
                        destination_name=destination['text'],
                        timing=timing_str,
                        scraped_at=scraped_at
                    ))
                
                logger.info(f"      Found {len(timings)} timings")
                
            except NoSuchElementException:
                logger.warning(f"      No timing results found")
            
            return timings
            
        except Exception as e:
            logger.error(f"Error getting timings: {e}")
            return []

    def _save_checkpoint(self):
        """Persist progress so scraper can resume after interruption"""
        if not self.checkpoint_path:
            return
        try:
            data = {
                "processed": [list(p) for p in sorted(self.processed_pairs)],
                "timings": [asdict(t) for t in self.all_timings],
                "saved_at": datetime.now().isoformat(),
            }
            self.checkpoint_path.parent.mkdir(parents=True, exist_ok=True)
            with open(self.checkpoint_path, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
            logger.info(f"Checkpoint saved to {self.checkpoint_path} (processed {len(self.processed_pairs)} pairs)")
        except Exception as e:
            logger.warning(f"Unable to save checkpoint: {e}")
    
    def scrape_all(self, limit_routes: Optional[int] = None):
        """
        Main scraping method
        
        Args:
            limit_routes: Optional limit on number of routes to process
        """
        logger.info("=== Starting MTC Bus Timing Scraper (Selenium) ===")
        
        try:
            # Setup driver
            self._setup_driver()
            
            # Get all routes
            routes = self.get_all_routes()
            if not routes:
                logger.error("No routes found. Exiting.")
                return
            
            if limit_routes:
                routes = routes[:limit_routes]
                logger.info(f"Limited to first {limit_routes} routes")
            
            # Find last processed route to resume from there
            last_processed_route = None
            if self.processed_pairs:
                # Get all unique processed routes and find the highest one
                processed_routes = sorted(set(p[0] for p in self.processed_pairs))
                last_processed_route = processed_routes[-1]
                
                # Find if the last route is fully processed (all pairs done)
                # Count how many pairs exist for this route
                pairs_for_last_route = [p for p in self.processed_pairs if p[0] == last_processed_route]
                
                resume_idx = next((i for i, r in enumerate(routes) if r['value'] == last_processed_route), None)
                if resume_idx is not None:
                    # Check if we should resume from this route or skip to next
                    # For now, resume from this route (individual pairs will be skipped if already processed)
                    logger.info(f"Resuming from route {routes[resume_idx]['text']} ({len(pairs_for_last_route)} pairs already processed)")
                    logger.info(f"Already completed routes: {', '.join(processed_routes[:-1]) if len(processed_routes) > 1 else 'None'}")
                    routes = routes[resume_idx:]
            
            # Process each route
            for route_idx, route in enumerate(routes, 1 if last_processed_route is None else 0):
                logger.info(f"\n[{route_idx}/{len(routes)}] Processing route: {route['text']}")

                # Load fresh page once per route
                self.driver.get(self.URL)
                time.sleep(2)

                # Get origins for this route
                origins = self.get_origins_for_route(route['value'])
                if not origins:
                    logger.warning(f"No origins for route {route['text']}, skipping")
                    continue
                
                # Process each origin
                for origin_idx, origin in enumerate(origins, 1):
                    logger.info(f"  [{origin_idx}/{len(origins)}] Origin: {origin['text']}")

                    # Reselect route without reloading the page
                    route_select = Select(self.driver.find_element(By.ID, 'selroute'))
                    route_select.select_by_value(route['value'])
                    time.sleep(self.delay)
                    
                    # Get destinations
                    destinations = self.get_destinations_for_origin(origin['value'])
                    if not destinations:
                        logger.warning(f"No destinations for origin {origin['text']}")
                        continue
                    
                    # Process each destination
                    for dest_idx, dest in enumerate(destinations, 1):
                        logger.info(f"    [{dest_idx}/{len(destinations)}] Destination: {dest['text']}")
                        key = (route['value'], origin['value'], dest['value'])
                        if key in self.processed_pairs:
                            logger.info("    Skipping (already processed in checkpoint)")
                            continue
                        
                        # Get timings
                        timings = self.get_timings(route, origin, dest)
                        self.all_timings.extend(timings)
                        self.processed_pairs.add(key)
                        self._save_checkpoint()
            
            logger.info(f"\n=== Scraping complete! Total timings collected: {len(self.all_timings)} ===")
            
        finally:
            self._close_driver()
    
    def save_to_json(self, filepath: str):
        """Save timings to JSON file"""
        filepath = Path(filepath)
        filepath.parent.mkdir(parents=True, exist_ok=True)
        
        data = [asdict(timing) for timing in self.all_timings]
        
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        
        logger.info(f"Saved {len(data)} records to JSON: {filepath}")
    
    def save_to_csv(self, filepath: str):
        """Save timings to CSV file"""
        filepath = Path(filepath)
        filepath.parent.mkdir(parents=True, exist_ok=True)
        
        if not self.all_timings:
            logger.warning("No timings to save")
            return
        
        with open(filepath, 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=[
                'route_number', 'route_name', 'origin_value', 'origin_name',
                'destination_value', 'destination_name', 'timing', 'scraped_at'
            ])
            writer.writeheader()
            
            for timing in self.all_timings:
                writer.writerow(asdict(timing))
        
        logger.info(f"Saved {len(self.all_timings)} records to CSV: {filepath}")


def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(
        description='Scrape MTC Chennai bus timings using Selenium and save to JSON/CSV'
    )
    parser.add_argument(
        '--output',
        default='data/mtc_bus_timings',
        help='Output file path (without extension, default: data/mtc_bus_timings)'
    )
    parser.add_argument(
        '--delay',
        type=float,
        default=2.0,
        help='Delay between operations in seconds (default: 2.0)'
    )
    parser.add_argument(
        '--limit-routes',
        type=int,
        help='Limit number of routes to process (for testing)'
    )
    parser.add_argument(
        '--headless',
        action='store_true',
        default=True,
        help='Run browser in headless mode (default: True)'
    )
    parser.add_argument(
        '--show-browser',
        action='store_true',
        help='Show browser window (opposite of headless)'
    )
    parser.add_argument(
        '--verbose',
        action='store_true',
        help='Enable verbose logging'
    )
    
    args = parser.parse_args()
    
    if args.verbose:
        logger.setLevel(logging.DEBUG)
    
    # Handle headless mode
    headless = args.headless and not args.show_browser
    
    def load_checkpoint(path: Path):
        processed: Set[Tuple[str, str, str]] = set()
        timings: List[BusTiming] = []
        if path.exists():
            try:
                with open(path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                processed = {tuple(p) for p in data.get('processed', []) if len(p) == 3}
                for item in data.get('timings', []):
                    timings.append(BusTiming(**item))
                logger.info(f"Loaded checkpoint from {path}: {len(processed)} pairs, {len(timings)} timings")
            except Exception as e:
                logger.warning(f"Could not load checkpoint {path}: {e}")
        return processed, timings

    checkpoint_path = Path(f"{args.output}.checkpoint.json")
    processed_pairs, existing_timings = load_checkpoint(checkpoint_path)

    # Create scraper and run
    scraper = MTCBusScraperSelenium(
        delay=args.delay,
        headless=headless,
        checkpoint_path=checkpoint_path,
        processed_pairs=processed_pairs,
        existing_timings=existing_timings,
    )
    
    try:
        scraper.scrape_all(limit_routes=args.limit_routes)
        
        # Final save (also acts as final checkpoint)
        scraper.save_to_json(f"{args.output}.json")
        scraper.save_to_csv(f"{args.output}.csv")
        scraper._save_checkpoint()
        
    except KeyboardInterrupt:
        logger.info("\nScraping interrupted by user")
        sys.exit(1)
    except Exception as e:
        logger.error(f"Fatal error: {e}", exc_info=True)
        sys.exit(1)


if __name__ == '__main__':
    main()
