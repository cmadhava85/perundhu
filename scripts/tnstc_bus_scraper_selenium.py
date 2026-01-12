#!/usr/bin/env python3
"""
TNSTC Bus Booking Scraper with Selenium
Scrapes bus booking data from https://www.tnstc.in/OTRSOnline/ using browser automation.
Extracts route details: origin, destination, departure time, and intermediate stops with times.
Outputs to JSON and CSV files.

Usage:
    python tnstc_bus_scraper_selenium.py --source "MADURAI" --dest "CHENNAI" --limit-routes 5 --output data/tnstc_routes
    python tnstc_bus_scraper_selenium.py --source-list sources.txt --dest-list destinations.txt --output data/tnstc_all_routes
"""

import time
import json
import csv
import logging
import argparse
import sys
from datetime import datetime, timedelta
from pathlib import Path
from typing import List, Dict, Optional, Tuple
from dataclasses import dataclass, asdict, field
import re

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait, Select
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException, StaleElementReferenceException
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.common.keys import Keys

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@dataclass
class BusRoute:
    """Data class for bus route information"""
    service_code: str
    route_number: str
    corporation: str
    origin: str
    destination: str
    departure_time: str
    duration: str
    arrival_time: str
    available_seats: str
    bus_type: str
    fare: str
    journey_date: str
    stops: List[Dict[str, str]] = field(default_factory=list)  # [{"city": "...", "landmark": "...", "time": "..."}, ...]
    scraped_at: str = ""


class TNSTCBusScraperSelenium:
    """Selenium-based scraper for TNSTC bus bookings"""
    
    URL = "https://www.tnstc.in/OTRSOnline/"
    
    def __init__(self, delay: float = 2.0, headless: bool = True, rate_limit: float = 1.0):
        """
        Initialize the Selenium scraper
        
        Args:
            delay: Delay between operations in seconds
            headless: Run browser in headless mode
            rate_limit: Minimum delay between requests (seconds) to avoid hammering the server
        """
        self.delay = delay
        self.headless = headless
        self.rate_limit = rate_limit
        self.driver = None
        self.all_routes: List[BusRoute] = []
        self.last_request_time = 0
        
    def _rate_limit(self):
        """Apply rate limiting"""
        elapsed = time.time() - self.last_request_time
        if elapsed < self.rate_limit:
            sleep_time = self.rate_limit - elapsed
            logger.debug(f"Rate limiting: sleeping {sleep_time:.2f}s")
            time.sleep(sleep_time)
        self.last_request_time = time.time()
    
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
        chrome_options.add_argument('--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')
        chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
        chrome_options.add_experimental_option('useAutomationExtension', False)
        
        self.driver = webdriver.Chrome(options=chrome_options)
        self.driver.set_page_load_timeout(30)
        logger.info("WebDriver ready")
    
    def _close_driver(self):
        """Close the WebDriver"""
        if self.driver:
            self.driver.quit()
            logger.info("WebDriver closed")
    
    def _wait_for_element(self, by: By, value: str, timeout: int = 15):
        """Wait for an element to be present"""
        return WebDriverWait(self.driver, timeout).until(
            EC.presence_of_element_located((by, value))
        )
    
    def _wait_for_clickable(self, by: By, value: str, timeout: int = 15):
        """Wait for an element to be clickable"""
        return WebDriverWait(self.driver, timeout).until(
            EC.element_to_be_clickable((by, value))
        )
    
    def _scroll_to_element(self, element):
        """Scroll element into view"""
        self.driver.execute_script("arguments[0].scrollIntoView(true);", element)
        time.sleep(0.5)

    def _close_popups(self):
        """Close any visible popup or modal on the homepage before interacting."""
        possible_close_selectors = [
            "//*[@id='popup-close']",
            "//button[contains(@class,'close')]",
            "//span[contains(@class,'close')]",
            "//div[contains(@class,'modal')]//button[text()='×']",
            "//button[@aria-label='Close']",
        ]
        for selector in possible_close_selectors:
            try:
                close_btn = WebDriverWait(self.driver, 3).until(
                    EC.element_to_be_clickable((By.XPATH, selector))
                )
                close_btn.click()
                logger.info(f"Closed popup using selector: {selector}")
                time.sleep(1)
                break
            except Exception:
                continue
    
    def open_page(self):
        """Open the TNSTC booking page"""
        logger.info(f"Opening {self.URL}")
        self._rate_limit()
        self.driver.get(self.URL)
        time.sleep(3)  # Let page load completely
        self._close_popups()
    
    def get_available_cities(self) -> List[str]:
        """Get all available cities from source dropdown"""
        try:
            logger.info("Fetching available cities...")
            
            # Wait for source dropdown to be present
            source_input = self._wait_for_element(By.ID, 'sourceAuto', timeout=10)
            
            # Click to open dropdown
            source_input.click()
            time.sleep(1)
            
            # Get dropdown options
            cities = []
            dropdown_items = self.driver.find_elements(By.CLASS_NAME, 'ui-menu-item')
            
            for item in dropdown_items:
                text = item.text.strip()
                if text:
                    cities.append(text)
            
            logger.info(f"Found {len(cities)} cities in dropdown")
            return cities
            
        except Exception as e:
            logger.error(f"Error fetching cities: {e}")
            return []
    
    def search_buses(self, source: str, destination: str, journey_date: str) -> bool:
        """
        Search for buses with given parameters
        
        Args:
            source: Source city
            destination: Destination city
            journey_date: Journey date in DD/MM/YYYY format
            
        Returns:
            True if search successful, False otherwise
        """
        try:
            logger.info(f"Searching: {source} -> {destination} on {journey_date}")
            self._rate_limit()
            
            # Helper to call backend autocomplete API
            def fetch_place(term: str, is_source: bool) -> Optional[Tuple[str, str, str]]:
                """Call backend autocomplete endpoint to resolve place id/code/name."""
                action = "LoadFromPlaceList" if is_source else "LoadTOPlaceList"
                param = "matchStartPlace" if is_source else "matchEndPlace"
                script = """
                const actionName = arguments[0];
                const paramName = arguments[1];
                const value = arguments[2];
                const done = arguments[3];
                fetch('https://www.tnstc.in/OTRSOnline/jqreq.do?', {
                  method: 'POST',
                  headers: {'Content-Type': 'application/x-www-form-urlencoded'},
                  body: `hiddenAction=${actionName}&${paramName}=${encodeURIComponent(value)}`
                }).then(r => r.text()).then(txt => done(txt)).catch(err => done(`ERROR:${err}`));
                """
                response = self.driver.execute_async_script(script, action, param, term)
                if isinstance(response, str) and response.startswith("ERROR"):
                    logger.error(f"Place lookup failed for {term}: {response}")
                    return None
                candidates = []
                for entry in str(response).split('^'):
                    parts = entry.split(':')
                    if len(parts) >= 3:
                        place_id, place_code, name = parts[0], parts[1], parts[2]
                        candidates.append((name.strip(), place_id.strip(), place_code.strip()))
                for name, pid, code in candidates:
                    if term.upper() in name.upper():
                        return name, pid, code
                return candidates[0] if candidates else None

            def set_place_fields(name: str, place_id: str, place_code: str, is_source: bool):
                """Populate visible and hidden fields plus global vars used by validation."""
                js = """
                const name = arguments[0];
                const pid = arguments[1];
                const code = arguments[2];
                const isSource = arguments[3];
                const form = document.forms[0];
                if (isSource) {
                  document.getElementById('matchStartPlace').value = name;
                  form.matchStartPlace.value = name;
                  form.selectStartPlace.value = code;
                  form.hiddenStartPlaceID.value = pid;
                  form.txtStartPlaceCode.value = code;
                  form.hiddenStartPlaceName.value = name;
                  window.fromPlaceID = pid;
                  window.fromPlaceCode = code;
                } else {
                  document.getElementById('matchEndPlace').value = name;
                  form.matchEndPlace.value = name;
                  form.selectEndPlace.value = code;
                  form.hiddenEndPlaceID.value = pid;
                  form.txtEndPlaceCode.value = code;
                  form.hiddenEndPlaceName.value = name;
                  window.toPlaceID = pid;
                  window.toPlaceCode = code;
                }
                """
                self.driver.execute_script(js, name, place_id, place_code, is_source)

            # Resolve source and destination via backend API
            source_info = fetch_place(source, True)
            dest_info = fetch_place(destination, False)
            if not source_info:
                logger.error(f"Could not resolve source place: {source}")
                return False
            if not dest_info:
                logger.error(f"Could not resolve destination place: {destination}")
                return False
            
            logger.debug(f"Source resolved: {source_info[0]}")
            logger.debug(f"Destination resolved: {dest_info[0]}")
            
            set_place_fields(*source_info, True)
            set_place_fields(*dest_info, False)

            # Set date (field is readonly when datepicker is attached)
            try:
                date_input = self.driver.find_element(By.ID, 'txtdeptDateOtrip')
                self.driver.execute_script(
                    "arguments[0].removeAttribute('readonly'); arguments[0].value = arguments[1];", 
                    date_input, journey_date
                )
                self.driver.execute_script(
                    "document.forms[0].txtJourneyDate.value=arguments[0]; document.forms[0].hiddenOnwardJourneyDate.value=arguments[0];",
                    journey_date
                )
                logger.debug(f"Date set: {journey_date}")
            except Exception as e:
                logger.warning(f"Could not set journey date: {e}")

            # Click search button
            try:
                search_btn = self.driver.find_element(By.ID, 'searchButton')
            except Exception:
                logger.error("Could not find search button")
                return False

            search_btn.click()
            logger.info("Search submitted, waiting for results...")
            time.sleep(5)
            return True
            
        except Exception as e:
            logger.error(f"Error during search: {e}")
            import traceback
            traceback.print_exc()
            return False
    
    def extract_stop_details(self) -> List[Dict[str, str]]:
        """
        Extract stop details from the popup modal
        
        Returns:
            List of stops with city, landmark, and time
        """
        try:
            stops = []
            
            # Wait for modal to be visible
            modal = WebDriverWait(self.driver, 10).until(
                EC.visibility_of_element_located((By.CLASS_NAME, 'modal-content'))
            )
            
            # Find stop rows in the modal
            # Look for table rows in Service Details modal
            stop_rows = self.driver.find_elements(By.XPATH, "//table//tr[position() > 1]")
            
            for row in stop_rows:
                try:
                    cells = row.find_elements(By.TAG_NAME, 'td')
                    if len(cells) >= 4:
                        # Structure: Sl. No | City | Land Mark | Dep. Time
                        city = cells[1].text.strip()
                        landmark = cells[2].text.strip()
                        time_text = cells[3].text.strip()
                        
                        if city and time_text:
                            stops.append({
                                'city': city,
                                'landmark': landmark,
                                'time': time_text
                            })
                except Exception as e:
                    logger.debug(f"Error parsing stop row: {e}")
                    continue
            
            logger.debug(f"Extracted {len(stops)} stops from modal")
            return stops
            
        except Exception as e:
            logger.error(f"Error extracting stop details: {e}")
            return []
    
    def click_route_link(self, service_code: str) -> Dict:
        """
        Click on a route link and extract popup details
        
        Args:
            service_code: Service code (e.g., '1415SHEAVANS')
            
        Returns:
            Dictionary with extracted details
        """
        try:
            # Find and click the link
            link = WebDriverWait(self.driver, 10).until(
                EC.presence_of_element_located((By.LINK_TEXT, service_code))
            )
            
            self._scroll_to_element(link)
            
            # Use ActionChains to avoid element interception
            actions = ActionChains(self.driver)
            actions.click(link).perform()
            time.sleep(2)
            
            # Extract stop details from popup
            stops = self.extract_stop_details()
            
            # Close modal by clicking X or pressing Escape
            try:
                close_btn = self.driver.find_element(By.XPATH, "//button[@class='close'] | //span[@aria-label='Close']")
                close_btn.click()
            except:
                self.driver.find_element(By.TAG_NAME, 'body').send_keys('\uffff')  # Press Escape
            
            time.sleep(1)
            
            return {'service_code': service_code, 'stops': stops}
            
        except Exception as e:
            logger.warning(f"Error clicking route {service_code}: {e}")
            return {'service_code': service_code, 'stops': []}
    
    def parse_search_results(self) -> List[BusRoute]:
        """
        Parse bus results from search results page
        
        Returns:
            List of BusRoute objects
        """
        routes = []
        scraped_at = datetime.now().isoformat()
        
        try:
            # Wait for results container
            results_container = WebDriverWait(self.driver, 15).until(
                EC.presence_of_element_located((By.CLASS_NAME, 'bus-details'))
            )
            logger.info("Results container found")
            
        except:
            logger.warning("Could not find standard results container, trying alternative selectors")
        
        try:
            # Try multiple selectors for bus elements
            bus_elements = []
            
            selectors = [
                "//div[contains(@class, 'bus-details')]",
                "//div[contains(@class, 'bus')]",
                "//tr[contains(@class, 'bus')]",
                "//div[@class='row'][contains(.,'Depart')]",
            ]
            
            for selector in selectors:
                try:
                    bus_elements = self.driver.find_elements(By.XPATH, selector)
                    if bus_elements:
                        logger.info(f"Found {len(bus_elements)} buses using selector: {selector}")
                        break
                except:
                    continue
            
            if not bus_elements:
                # Log page content for debugging
                page_source = self.driver.page_source
                logger.warning(f"No buses found in results. Page has {len(page_source)} characters")
                if "no result" in page_source.lower() or "not found" in page_source.lower():
                    logger.info("Page shows 'no results' message - no buses available for this route")
                return routes
            
            for bus_elem in bus_elements:
                try:
                    # Extract basic information from the bus card
                    route_data = {}
                    
                    # Service Code (clickable link)
                    try:
                        service_elem = bus_elem.find_element(By.XPATH, ".//a[@href]")
                        service_code = service_elem.text.strip()
                        route_data['service_code'] = service_code
                    except:
                        logger.debug("Could not find service code, skipping bus")
                        continue
                    
                    # Corporation
                    try:
                        corp_elem = bus_elem.find_element(By.XPATH, ".//*[contains(@class, 'corporation')]")
                        route_data['corporation'] = corp_elem.text.strip()
                    except:
                        route_data['corporation'] = "SETC"
                    
                    # Bus Type
                    try:
                        type_elem = bus_elem.find_element(By.XPATH, ".//*[contains(@class, 'bus-type')]")
                        route_data['bus_type'] = type_elem.text.strip()
                    except:
                        route_data['bus_type'] = "Standard"
                    
                    # Departure Time
                    try:
                        dept_elem = bus_elem.find_element(By.XPATH, ".//*[contains(text(), ':') and contains(@class, 'time')]")
                        dept_text = dept_elem.text.strip()
                        # Extract time in HH:MM format
                        time_match = re.search(r'(\d{1,2}):(\d{2})', dept_text)
                        if time_match:
                            route_data['departure_time'] = f"{int(time_match.group(1)):02d}:{time_match.group(2)}"
                    except:
                        route_data['departure_time'] = ""
                    
                    # Arrival Time
                    try:
                        # Usually displayed as "Via-XXX" or time format
                        arrival_elems = bus_elem.find_elements(By.XPATH, ".//*[contains(@class, 'arrival')]")
                        if arrival_elems:
                            route_data['arrival_time'] = arrival_elems[-1].text.strip()
                    except:
                        route_data['arrival_time'] = ""
                    
                    # Duration
                    try:
                        dur_elem = bus_elem.find_element(By.XPATH, ".//*[contains(text(), 'Hrs')]")
                        route_data['duration'] = dur_elem.text.strip()
                    except:
                        route_data['duration'] = ""
                    
                    # Available Seats
                    try:
                        seats_elem = bus_elem.find_element(By.XPATH, ".//*[contains(text(), 'Seats Available')]")
                        seats_text = seats_elem.text.strip()
                        route_data['available_seats'] = seats_text
                    except:
                        route_data['available_seats'] = ""
                    
                    # Fare
                    try:
                        fare_elem = bus_elem.find_element(By.XPATH, ".//*[contains(text(), 'Rs')]")
                        route_data['fare'] = fare_elem.text.strip()
                    except:
                        route_data['fare'] = ""
                    
                    # Click to get stop details
                    stops = []
                    if 'service_code' in route_data:
                        stop_info = self.click_route_link(route_data['service_code'])
                        stops = stop_info.get('stops', [])
                    
                    # Create BusRoute object (we'll fill origin/destination/date later)
                    bus_route = BusRoute(
                        service_code=route_data.get('service_code', ''),
                        route_number=route_data.get('service_code', '').split('/')[0] if '/' in route_data.get('service_code', '') else '',
                        corporation=route_data.get('corporation', ''),
                        origin='',  # Will be set in main method
                        destination='',  # Will be set in main method
                        departure_time=route_data.get('departure_time', ''),
                        arrival_time=route_data.get('arrival_time', ''),
                        duration=route_data.get('duration', ''),
                        available_seats=route_data.get('available_seats', ''),
                        bus_type=route_data.get('bus_type', ''),
                        fare=route_data.get('fare', ''),
                        journey_date='',  # Will be set in main method
                        stops=stops,
                        scraped_at=scraped_at
                    )
                    
                    routes.append(bus_route)
                    
                except StaleElementReferenceException:
                    logger.warning("Stale element reference, skipping bus")
                    continue
                except Exception as e:
                    logger.debug(f"Error parsing bus element: {e}")
                    continue
            
            logger.info(f"Successfully parsed {len(routes)} bus routes")
            return routes
            
        except Exception as e:
            logger.error(f"Error parsing search results: {e}")
            return []
    
    def scrape_route_pair(self, source: str, destination: str, journey_date: str = None) -> List[BusRoute]:
        """
        Scrape buses for a specific source-destination pair
        
        Args:
            source: Source city
            destination: Destination city
            journey_date: Date in DD/MM/YYYY format (default: 3 days from today)
            
        Returns:
            List of BusRoute objects
        """
        if journey_date is None:
            # Default to 3 days from today
            date_obj = datetime.now() + timedelta(days=3)
            journey_date = date_obj.strftime("%d/%m/%Y")
        
        logger.info(f"\n=== Scraping {source} -> {destination} on {journey_date} ===")
        
        # Open fresh page
        self.open_page()
        
        # Perform search
        if not self.search_buses(source, destination, journey_date):
            logger.warning(f"Search failed for {source} -> {destination}")
            return []
        
        # Parse results
        routes = self.parse_search_results()
        
        # Update origin, destination, and date
        for route in routes:
            route.origin = source
            route.destination = destination
            route.journey_date = journey_date
        
        self.all_routes.extend(routes)
        logger.info(f"Collected {len(routes)} routes for {source} -> {destination}")
        
        return routes
    
    def scrape_multiple_pairs(self, route_pairs: List[Tuple[str, str]], limit: int = None):
        """
        Scrape multiple source-destination pairs
        
        Args:
            route_pairs: List of (source, destination) tuples
            limit: Limit number of pairs to scrape
        """
        logger.info("=== Starting TNSTC Bus Scraper (Selenium) ===")
        
        try:
            self._setup_driver()
            
            if limit:
                route_pairs = route_pairs[:limit]
            
            for idx, (source, destination) in enumerate(route_pairs, 1):
                logger.info(f"\n[{idx}/{len(route_pairs)}] Processing: {source} -> {destination}")
                
                try:
                    self.scrape_route_pair(source, destination)
                except Exception as e:
                    logger.error(f"Error scraping {source} -> {destination}: {e}")
                    continue
                
                # Rate limiting between requests
                time.sleep(self.rate_limit * 2)
            
            logger.info(f"\n=== Scraping complete! Total routes collected: {len(self.all_routes)} ===")
            
        finally:
            self._close_driver()
    
    def save_to_json(self, filepath: str):
        """Save routes to JSON file"""
        filepath = Path(filepath)
        filepath.parent.mkdir(parents=True, exist_ok=True)
        
        data = [asdict(route) for route in self.all_routes]
        
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        
        logger.info(f"Saved {len(data)} records to JSON: {filepath}")
    
    def save_to_csv(self, filepath: str):
        """Save routes to CSV file"""
        filepath = Path(filepath)
        filepath.parent.mkdir(parents=True, exist_ok=True)
        
        if not self.all_routes:
            logger.warning("No routes to save")
            return
        
        with open(filepath, 'w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            
            # Header
            writer.writerow([
                'service_code', 'route_number', 'corporation', 'origin', 'destination',
                'departure_time', 'arrival_time', 'duration', 'available_seats',
                'bus_type', 'fare', 'journey_date', 'stops_json', 'scraped_at'
            ])
            
            # Data rows
            for route in self.all_routes:
                stops_json = json.dumps(route.stops, ensure_ascii=False)
                writer.writerow([
                    route.service_code,
                    route.route_number,
                    route.corporation,
                    route.origin,
                    route.destination,
                    route.departure_time,
                    route.arrival_time,
                    route.duration,
                    route.available_seats,
                    route.bus_type,
                    route.fare,
                    route.journey_date,
                    stops_json,
                    route.scraped_at
                ])
        
        logger.info(f"Saved {len(self.all_routes)} records to CSV: {filepath}")


def load_city_list(filepath: str) -> List[str]:
    """Load city list from file (one city per line)"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            cities = [line.strip() for line in f if line.strip()]
        logger.info(f"Loaded {len(cities)} cities from {filepath}")
        return cities
    except FileNotFoundError:
        logger.error(f"File not found: {filepath}")
        return []


def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(
        description='Scrape TNSTC bus routes using Selenium and save to JSON/CSV',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Single route pair
  python tnstc_bus_scraper_selenium.py --source MADURAI --dest CHENNAI

  # Multiple routes from lists
  python tnstc_bus_scraper_selenium.py --source-list sources.txt --dest-list destinations.txt

  # With custom date and output
  python tnstc_bus_scraper_selenium.py --source MADURAI --dest CHENNAI --date 20/01/2026 --output data/jan_20
        """
    )
    
    parser.add_argument(
        '--source',
        help='Source city'
    )
    parser.add_argument(
        '--dest',
        help='Destination city'
    )
    parser.add_argument(
        '--source-list',
        help='File with list of source cities (one per line)'
    )
    parser.add_argument(
        '--dest-list',
        help='File with list of destination cities (one per line)'
    )
    parser.add_argument(
        '--date',
        help='Journey date in DD/MM/YYYY format (default: 3 days from today)'
    )
    parser.add_argument(
        '--output',
        default='data/tnstc_bus_routes',
        help='Output file path (without extension, default: data/tnstc_bus_routes)'
    )
    parser.add_argument(
        '--delay',
        type=float,
        default=2.0,
        help='Delay between operations in seconds (default: 2.0)'
    )
    parser.add_argument(
        '--rate-limit',
        type=float,
        default=1.5,
        help='Minimum delay between requests to server (default: 1.5)'
    )
    parser.add_argument(
        '--limit-routes',
        type=int,
        help='Limit number of route pairs to scrape (for testing)'
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
    
    # Validate arguments
    if not args.source and not args.source_list:
        parser.error("Either --source or --source-list must be provided")
    
    if not args.dest and not args.dest_list:
        parser.error("Either --dest or --dest-list must be provided")
    
    # Build route pairs
    route_pairs = []
    
    if args.source and args.dest:
        route_pairs = [(args.source, args.dest)]
    else:
        sources = load_city_list(args.source_list) if args.source_list else []
        destinations = load_city_list(args.dest_list) if args.dest_list else []
        
        # Create all combinations
        for source in sources:
            for dest in destinations:
                if source.upper() != dest.upper():  # Skip same city
                    route_pairs.append((source, dest))
    
    if not route_pairs:
        logger.error("No valid route pairs to scrape")
        sys.exit(1)
    
    logger.info(f"Will scrape {len(route_pairs)} route pairs")
    
    # Handle headless mode
    headless = args.headless and not args.show_browser
    
    # Create scraper and run
    scraper = TNSTCBusScraperSelenium(
        delay=args.delay,
        headless=headless,
        rate_limit=args.rate_limit
    )
    
    try:
        scraper.scrape_multiple_pairs(route_pairs, limit=args.limit_routes)
        
        # Save to files
        scraper.save_to_json(f"{args.output}.json")
        scraper.save_to_csv(f"{args.output}.csv")
        
        logger.info(f"\n✅ Successfully scraped {len(scraper.all_routes)} bus routes")
        logger.info(f"📁 Saved to: {args.output}.json and {args.output}.csv")
        
    except KeyboardInterrupt:
        logger.info("\nScraping interrupted by user")
        sys.exit(1)
    except Exception as e:
        logger.error(f"Fatal error: {e}", exc_info=True)
        sys.exit(1)


if __name__ == '__main__':
    main()
