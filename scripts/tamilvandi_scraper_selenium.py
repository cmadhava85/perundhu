#!/usr/bin/env python3
"""
Tamil Vandi Bus Timing Scraper with Selenium
Scrapes bus timing data from https://www.tamilvandi.com/timings using browser automation.
Extracts route details: origin, destination, departure time, arrival time, and intermediate stops.
Handles pagination to get all results.
Outputs to JSON and CSV files.

Usage:
    python tamilvandi_scraper_selenium.py --from "Sivakasi" --to "Madurai" --output data/tamilvandi_routes
    python tamilvandi_scraper_selenium.py --route-list routes.txt --output data/tamilvandi_all
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
from dataclasses import dataclass, asdict, field
import re

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException, StaleElementReferenceException
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.action_chains import ActionChains

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
    bus_type: str  # Moffusil Bus / Private Bus
    operator_name: str  # e.g., STAR, RSR, 503, etc.
    origin: str
    destination: str
    departure_time: str
    arrival_time: str = ""
    stops: List[Dict[str, str]] = field(default_factory=list)  # [{"stop_name": "...", "time": "..."}, ...]
    scraped_at: str = ""


class TamilVandiScraperSelenium:
    """Selenium-based scraper for Tamil Vandi bus timings"""
    
    BASE_URL = "https://www.tamilvandi.com/timings"
    
    def __init__(
        self,
        delay: float = 1.5,
        headless: bool = True,
        checkpoint_path: Optional[Path] = None,
        processed_pairs: Optional[Set[Tuple[str, str]]] = None,
        existing_routes: Optional[List[BusRoute]] = None,
    ):
        """
        Initialize the Selenium scraper
        
        Args:
            delay: Delay between operations in seconds
            headless: Run browser in headless mode
            checkpoint_path: Path to checkpoint file for resuming
            processed_pairs: Set of already processed (from, to) pairs
            existing_routes: List of routes already scraped
        """
        self.delay = delay
        self.headless = headless
        self.driver = None
        self.all_routes: List[BusRoute] = existing_routes or []
        self.checkpoint_path = checkpoint_path
        self.processed_pairs: Set[Tuple[str, str]] = processed_pairs or set()
        
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
        self.driver.set_page_load_timeout(60)
        self.driver.implicitly_wait(5)
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
        self.driver.execute_script("arguments[0].scrollIntoView({behavior: 'smooth', block: 'center'});", element)
        time.sleep(0.5)
    
    def _close_popups(self):
        """Close any popups or modals"""
        try:
            # Close popup if exists
            close_btns = self.driver.find_elements(By.XPATH, 
                "//button[contains(@class, 'close')] | //div[contains(@class, 'modal')]//button")
            for btn in close_btns:
                try:
                    if btn.is_displayed():
                        btn.click()
                        time.sleep(1)
                except:
                    pass
        except:
            pass
    
    def fetch_all_cities(self) -> List[str]:
        """
        Fetch all available cities from the website's search form
        
        Returns:
            List of city names
        """
        logger.info("Fetching all available cities...")
        cities = set()
        
        try:
            # Load the search page
            logger.info(f"Loading {self.BASE_URL}")
            self.driver.get(self.BASE_URL)
            time.sleep(3)
            self._close_popups()
            
            # Strategy 1: Look for autocomplete input fields
            try:
                # Try to find input fields for from/to
                input_selectors = [
                    "input[name*='from']",
                    "input[name*='to']",
                    "input[placeholder*='from']",
                    "input[placeholder*='to']",
                    "input[type='text']",
                    "#from",
                    "#to",
                    ".search-input",
                ]
                
                for selector in input_selectors:
                    try:
                        inputs = self.driver.find_elements(By.CSS_SELECTOR, selector)
                        if inputs:
                            logger.info(f"Found input field with selector: {selector}")
                            
                            # Try to trigger autocomplete by typing a common letter
                            for test_char in ['a', 'c', 'm', 's', 't']:
                                try:
                                    input_elem = inputs[0]
                                    input_elem.clear()
                                    input_elem.send_keys(test_char)
                                    time.sleep(1)
                                    
                                    # Look for autocomplete dropdown
                                    dropdown_selectors = [
                                        ".autocomplete-suggestions",
                                        ".ui-autocomplete",
                                        "[role='listbox']",
                                        ".dropdown-menu",
                                        ".suggestions",
                                    ]
                                    
                                    for dropdown_selector in dropdown_selectors:
                                        try:
                                            suggestions = self.driver.find_elements(By.CSS_SELECTOR, 
                                                f"{dropdown_selector} li, {dropdown_selector} div, {dropdown_selector} a")
                                            if suggestions:
                                                for sugg in suggestions:
                                                    text = sugg.text.strip()
                                                    if text and len(text) > 2:
                                                        cities.add(text)
                                        except:
                                            pass
                                except:
                                    pass
                            
                            if cities:
                                break
                    except:
                        pass
                
                if cities:
                    logger.info(f"Found {len(cities)} cities from autocomplete")
                    return sorted(list(cities))
                    
            except Exception as e:
                logger.debug(f"Autocomplete strategy failed: {e}")
            
            # Strategy 2: Look for dropdown/select elements
            try:
                selects = self.driver.find_elements(By.TAG_NAME, "select")
                for select in selects:
                    options = select.find_elements(By.TAG_NAME, "option")
                    for option in options:
                        text = option.text.strip()
                        value = option.get_attribute('value')
                        if text and value and len(text) > 2:
                            cities.add(text)
                
                if cities:
                    logger.info(f"Found {len(cities)} cities from select dropdowns")
                    return sorted(list(cities))
                    
            except Exception as e:
                logger.debug(f"Select dropdown strategy failed: {e}")
            
            # Strategy 3: Parse from page content (look for city links or lists)
            try:
                # Look for links that might be city names
                links = self.driver.find_elements(By.TAG_NAME, "a")
                for link in links:
                    href = link.get_attribute('href') or ''
                    if 'from=' in href or 'to=' in href:
                        # Extract city names from URL
                        import urllib.parse
                        parsed = urllib.parse.urlparse(href)
                        params = urllib.parse.parse_qs(parsed.query)
                        if 'from' in params:
                            cities.add(params['from'][0])
                        if 'to' in params:
                            cities.add(params['to'][0])
                
                if cities:
                    logger.info(f"Found {len(cities)} cities from page links")
                    return sorted(list(cities))
                    
            except Exception as e:
                logger.debug(f"Link parsing strategy failed: {e}")
            
            # Strategy 4: If all else fails, return a curated list of major Tamil Nadu cities
            logger.warning("Could not extract cities from website, returning default list")
            default_cities = [
                "Chennai", "Coimbatore", "Madurai", "Trichy", "Salem", "Tiruppur",
                "Erode", "Vellore", "Thoothukudi", "Dindigul", "Thanjavur", 
                "Ranipet", "Sivakasi", "Karur", "Udhagamandalam", "Hosur",
                "Nagercoil", "Kumbakonam", "Tirunelveli", "Pollachi", "Rajapalayam",
                "Pudukkottai", "Cuddalore", "Kanchipuram", "Tiruvannamalai"
            ]
            return sorted(default_cities)
            
        except Exception as e:
            logger.error(f"Error fetching cities: {e}")
            return []
    
    def _save_checkpoint(self):
        """Save progress checkpoint"""
        if not self.checkpoint_path:
            return
        try:
            data = {
                "processed": sorted(list(self.processed_pairs)),
                "routes": [asdict(r) for r in self.all_routes],
                "saved_at": datetime.now().isoformat(),
            }
            self.checkpoint_path.parent.mkdir(parents=True, exist_ok=True)
            with open(self.checkpoint_path, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
            logger.info(f"Checkpoint saved: {len(self.processed_pairs)} pairs, {len(self.all_routes)} routes")
        except Exception as e:
            logger.warning(f"Unable to save checkpoint: {e}")
    
    def search_buses(self, from_city: str, to_city: str) -> bool:
        """
        Navigate to search results page
        
        Args:
            from_city: Origin city
            to_city: Destination city
            
        Returns:
            True if successful, False otherwise
        """
        try:
            url = f"{self.BASE_URL}?from={from_city.replace(' ', '+')}&to={to_city.replace(' ', '+')}"
            logger.info(f"Loading: {url}")
            
            self.driver.get(url)
            time.sleep(self.delay * 2)
            
            # Close any popups
            self._close_popups()
            
            # Wait for results to load
            try:
                # Check if results are present
                results = self.driver.find_elements(By.XPATH, "//div[contains(@class, 'bus')] | //tr[contains(@class, 'bus')]")
                if not results:
                    # Try alternative - wait for any time elements
                    results = self.driver.find_elements(By.XPATH, "//*[contains(text(), '🕒')]")
                
                if not results:
                    logger.warning("No results found on page")
                    return False
                    
                logger.info(f"Found results on page")
                return True
                
            except TimeoutException:
                logger.warning("Timeout waiting for results")
                return False
                
        except Exception as e:
            logger.error(f"Error loading search page: {e}")
            return False
    
    def extract_bus_details(self, bus_element) -> Optional[Dict]:
        """
        Extract details from a single bus listing element
        
        Args:
            bus_element: Selenium WebElement containing bus information
            
        Returns:
            Dictionary with bus details or None if extraction fails
        """
        try:
            bus_data = {}
            
            # Get the full text content
            full_text = bus_element.text
            
            # Extract bus number/operator name (first line, bold text)
            # Usually appears as "503" or "STAR" or "RSR" etc.
            try:
                # Look for prominent text elements (h2, h3, or large text)
                operator_elems = bus_element.find_elements(By.XPATH, ".//h2 | .//h3 | .//*[contains(@style, 'font-size')]")
                if operator_elems:
                    operator_name = operator_elems[0].text.strip()
                    if operator_name and operator_name not in ['🚌', '🕒']:
                        bus_data['operator_name'] = operator_name
            except:
                pass
            
            # If operator name not found, try to extract from full text
            if 'operator_name' not in bus_data:
                # First non-emoji line is usually the operator
                lines = [line.strip() for line in full_text.split('\n') if line.strip()]
                for line in lines:
                    if line and not line.startswith('🚌') and not line.startswith('🕒'):
                        bus_data['operator_name'] = line
                        break
            
            # Extract bus type (Moffusil Bus / Private Bus)
            if '🚌 Moffusil Bus' in full_text or 'Moffusil Bus' in full_text:
                bus_data['bus_type'] = 'Moffusil Bus'
            elif '🚌 Private Bus' in full_text or 'Private Bus' in full_text:
                bus_data['bus_type'] = 'Private Bus'
            else:
                bus_data['bus_type'] = 'Unknown'
            
            # Extract origin and destination
            # Look for text before arrow (→) and after
            try:
                origin_elem = bus_element.find_element(By.XPATH, ".//*[contains(text(), 'SIVAKASI') or contains(text(), 'MADURAI')]")
                if origin_elem:
                    # Context text usually shows: ORIGIN → DESTINATION
                    context_text = bus_element.text
                    # Look for pattern with city names
                    pass
            except:
                pass
            
            # Extract time (🕒 HH:MM format)
            time_pattern = re.compile(r'🕒\s*(\d{1,2}):(\d{2})')
            time_match = time_pattern.search(full_text)
            if time_match:
                hour = int(time_match.group(1))
                minute = time_match.group(2)
                bus_data['departure_time'] = f"{hour:02d}:{minute}"
            else:
                # Try without emoji
                time_pattern = re.compile(r'\b(\d{1,2}):(\d{2})\b')
                time_match = time_pattern.search(full_text)
                if time_match:
                    hour = int(time_match.group(1))
                    minute = time_match.group(2)
                    bus_data['departure_time'] = f"{hour:02d}:{minute}"
            
            return bus_data if bus_data else None
            
        except Exception as e:
            logger.debug(f"Error extracting bus details: {e}")
            return None
    
    def parse_page_results(self, from_city: str, to_city: str) -> List[BusRoute]:
        """
        Parse all bus results from current page
        
        Args:
            from_city: Origin city
            to_city: Destination city
            
        Returns:
            List of BusRoute objects
        """
        routes = []
        scraped_at = datetime.now().isoformat()
        
        try:
            # Wait a bit for dynamic content to load
            time.sleep(2)
            
            # Find all bus listings - try multiple strategies
            bus_elements = []
            
            # Strategy 1: Look for divs/sections containing bus info
            selectors = [
                "//div[contains(., '🚌') and contains(., '🕒')]",
                "//*[contains(@class, 'bus')]",
                "//section[contains(., '🚌')]",
                "//article[contains(., '🚌')]",
            ]
            
            for selector in selectors:
                try:
                    elements = self.driver.find_elements(By.XPATH, selector)
                    if elements:
                        bus_elements = elements
                        logger.debug(f"Found {len(elements)} buses using selector: {selector}")
                        break
                except:
                    continue
            
            # If no structured elements found, parse from page content
            if not bus_elements:
                logger.info("Using alternative parsing method...")
                page_text = self.driver.find_element(By.TAG_NAME, 'body').text
                return self._parse_from_text(page_text, from_city, to_city, scraped_at)
            
            # Extract data from each bus element
            for bus_elem in bus_elements:
                try:
                    bus_data = self.extract_bus_details(bus_elem)
                    if not bus_data:
                        continue
                    
                    # Check if we have minimum required fields
                    if 'operator_name' not in bus_data and 'departure_time' not in bus_data:
                        continue
                    
                    route = BusRoute(
                        bus_number=bus_data.get('operator_name', 'N/A'),
                        bus_type=bus_data.get('bus_type', 'Unknown'),
                        operator_name=bus_data.get('operator_name', 'N/A'),
                        origin=from_city,
                        destination=to_city,
                        departure_time=bus_data.get('departure_time', ''),
                        arrival_time=bus_data.get('arrival_time', ''),
                        stops=[],  # Tamil Vandi doesn't show stops in listing
                        scraped_at=scraped_at
                    )
                    
                    routes.append(route)
                    
                except Exception as e:
                    logger.debug(f"Error processing bus element: {e}")
                    continue
            
            logger.info(f"Parsed {len(routes)} routes from page")
            return routes
            
        except Exception as e:
            logger.error(f"Error parsing page results: {e}")
            return []
    
    def _parse_from_text(self, page_text: str, from_city: str, to_city: str, scraped_at: str) -> List[BusRoute]:
        """
        Parse bus data directly from page text (fallback method)
        
        Args:
            page_text: Full text content of the page
            from_city: Origin city
            to_city: Destination city
            scraped_at: Timestamp
            
        Returns:
            List of BusRoute objects
        """
        routes = []
        
        # Split text into lines
        lines = [line.strip() for line in page_text.split('\n') if line.strip()]
        
        current_bus = {}
        
        for i, line in enumerate(lines):
            # Check if line is a bus number/operator
            # Usually appears before bus type and time
            if '🚌 Moffusil Bus' in line or '🚌 Private Bus' in line:
                # Previous line might be the operator name
                if i > 0 and lines[i-1] and not lines[i-1].startswith('🚌') and not lines[i-1].startswith('🕒'):
                    current_bus['operator_name'] = lines[i-1]
                    current_bus['bus_type'] = 'Moffusil Bus' if 'Moffusil' in line else 'Private Bus'
            
            # Extract time
            elif '🕒' in line:
                time_pattern = re.compile(r'(\d{1,2}):(\d{2})')
                time_match = time_pattern.search(line)
                if time_match and current_bus:
                    hour = int(time_match.group(1))
                    minute = time_match.group(2)
                    current_bus['departure_time'] = f"{hour:02d}:{minute}"
                    
                    # Save this bus and start new one
                    if 'operator_name' in current_bus and 'departure_time' in current_bus:
                        route = BusRoute(
                            bus_number=current_bus['operator_name'],
                            bus_type=current_bus.get('bus_type', 'Unknown'),
                            operator_name=current_bus['operator_name'],
                            origin=from_city,
                            destination=to_city,
                            departure_time=current_bus['departure_time'],
                            arrival_time='',
                            stops=[],
                            scraped_at=scraped_at
                        )
                        routes.append(route)
                    
                    current_bus = {}
        
        logger.info(f"Parsed {len(routes)} routes from text")
        return routes
    
    def has_next_page(self) -> bool:
        """
        Check if there's a next page of results
        
        Returns:
            True if next page exists, False otherwise
        """
        try:
            # Strategy 1: Look for "Next" button or link (case-insensitive)
            next_selectors = [
                "//a[contains(translate(text(), 'NEXT', 'next'), 'next')]",
                "//button[contains(translate(text(), 'NEXT', 'next'), 'next')]",
                "//a[contains(@class, 'next')]",
                "//button[contains(@class, 'next')]",
                "//a[@rel='next']",
                "//*[@data-page='next']",
                "//a[contains(@href, 'page=')]",
            ]
            
            for selector in next_selectors:
                try:
                    links = self.driver.find_elements(By.XPATH, selector)
                    for link in links:
                        if link.is_displayed() and link.is_enabled():
                            # Check if not disabled
                            classes = link.get_attribute('class') or ''
                            aria_disabled = link.get_attribute('aria-disabled') or ''
                            
                            if 'disabled' not in classes.lower() and aria_disabled.lower() != 'true':
                                logger.debug(f"Found next page button: {selector}")
                                return True
                except:
                    continue
            
            # Strategy 2: Check for pagination numbers
            try:
                pagination_links = self.driver.find_elements(By.XPATH, 
                    "//a[contains(@class, 'page')] | //button[contains(@class, 'page')]")
                
                if pagination_links:
                    # Check if there's a higher page number available
                    current_page_elem = self.driver.find_elements(By.XPATH, 
                        "//*[contains(@class, 'active') or contains(@class, 'current')]")
                    if current_page_elem:
                        logger.debug("Found pagination with active page")
                        # If there's an active page indicator, check for next
                        return True
            except:
                pass
            
            return False
            
        except Exception as e:
            logger.debug(f"Error checking for next page: {e}")
            return False
    
    def go_to_next_page(self) -> bool:
        """
        Navigate to next page of results
        
        Returns:
            True if successful, False otherwise
        """
        try:
            # Strategy 1: Click "Next" button or link
            next_selectors = [
                "//a[contains(translate(text(), 'NEXT', 'next'), 'next') and not(contains(@class, 'disabled'))]",
                "//button[contains(translate(text(), 'NEXT', 'next'), 'next') and not(contains(@class, 'disabled'))]",
                "//a[contains(@class, 'next') and not(contains(@class, 'disabled'))]",
                "//button[contains(@class, 'next') and not(contains(@class, 'disabled'))]",
                "//a[@rel='next']",
            ]
            
            for selector in next_selectors:
                try:
                    links = self.driver.find_elements(By.XPATH, selector)
                    for link in links:
                        if link.is_displayed() and link.is_enabled():
                            classes = link.get_attribute('class') or ''
                            aria_disabled = link.get_attribute('aria-disabled') or ''
                            
                            if 'disabled' not in classes.lower() and aria_disabled.lower() != 'true':
                                logger.info(f"    Clicking next page button")
                                self._scroll_to_element(link)
                                time.sleep(0.5)
                                
                                # Get current URL to verify page change
                                current_url = self.driver.current_url
                                
                                # Try clicking
                                try:
                                    link.click()
                                except:
                                    # Try JavaScript click if regular click fails
                                    self.driver.execute_script("arguments[0].click();", link)
                                
                                # Wait for page to load
                                time.sleep(self.delay * 2)
                                
                                # Verify page changed
                                new_url = self.driver.current_url
                                if new_url != current_url:
                                    logger.info(f"    Successfully navigated to next page")
                                    return True
                                else:
                                    # Even if URL didn't change, check if content changed
                                    logger.debug("    URL unchanged but checking for new content...")
                                    return True
                except Exception as e:
                    logger.debug(f"Error with selector {selector}: {e}")
                    continue
            
            # Strategy 2: Look for numbered pagination and click next number
            try:
                # Find current page number
                current_page_elems = self.driver.find_elements(By.XPATH,
                    "//*[contains(@class, 'active') or contains(@class, 'current')]//text()")
                
                if current_page_elems:
                    try:
                        current_page = int(current_page_elems[0].get_attribute('textContent'))
                        next_page = current_page + 1
                        
                        # Find and click next page number
                        next_page_link = self.driver.find_element(By.XPATH, 
                            f"//a[text()='{next_page}'] | //button[text()='{next_page}']")
                        
                        if next_page_link.is_displayed():
                            self._scroll_to_element(next_page_link)
                            next_page_link.click()
                            time.sleep(self.delay * 2)
                            logger.info(f"    Clicked page number {next_page}")
                            return True
                    except:
                        pass
            except:
                pass
            
            logger.debug("    Could not find or click next page button")
            return False
            
        except Exception as e:
            logger.error(f"Error going to next page: {e}")
            return False
    
    def scrape_route_pair(self, from_city: str, to_city: str) -> List[BusRoute]:
        """
        Scrape all buses for a specific origin-destination pair (all pages)
        
        Args:
            from_city: Origin city
            to_city: Destination city
            
        Returns:
            List of BusRoute objects
        """
        logger.info(f"\n=== Scraping {from_city} -> {to_city} ===")
        
        all_routes = []
        seen_buses = set()  # Track unique buses to detect duplicates
        max_pages = 50  # Safety limit to prevent infinite loops
        consecutive_empty_pages = 0  # Track empty pages
        max_empty_pages = 3  # Stop after 3 consecutive empty pages
        
        # Load first page
        if not self.search_buses(from_city, to_city):
            logger.warning(f"Could not load search results for {from_city} -> {to_city}")
            return []
        
        page_num = 1
        
        # Parse results from all pages
        while page_num <= max_pages:
            logger.info(f"  📄 Page {page_num}...")
            
            routes = self.parse_page_results(from_city, to_city)
            
            if not routes:
                consecutive_empty_pages += 1
                logger.warning(f"    ⚠️  No routes found on page {page_num} (empty page {consecutive_empty_pages}/{max_empty_pages})")
                
                if consecutive_empty_pages >= max_empty_pages:
                    logger.info(f"    🛑 Stopping: {consecutive_empty_pages} consecutive empty pages")
                    break
            else:
                consecutive_empty_pages = 0  # Reset counter on successful page
                
                # Filter duplicates
                new_routes = []
                for route in routes:
                    # Create unique key from operator name and departure time
                    key = (route.operator_name, route.departure_time)
                    if key not in seen_buses:
                        seen_buses.add(key)
                        new_routes.append(route)
                        all_routes.append(route)
                    else:
                        logger.debug(f"    Skipping duplicate: {route.operator_name} at {route.departure_time}")
                
                logger.info(f"    ✓ Found {len(new_routes)} new routes ({len(routes) - len(new_routes)} duplicates)")
            
            # Check for next page
            if self.has_next_page():
                logger.info("    ➡️  Next page available")
                if self.go_to_next_page():
                    page_num += 1
                    time.sleep(self.delay)
                else:
                    logger.warning("    ⚠️  Could not navigate to next page")
                    break
            else:
                logger.info("    ℹ️  No more pages")
                break
        
        if page_num >= max_pages:
            logger.warning(f"  ⚠️  Reached maximum page limit ({max_pages})")
        
        logger.info(f"  ✅ Total unique routes collected: {len(all_routes)} (across {page_num} pages)")
        self.all_routes.extend(all_routes)
        
        return all_routes
    
    def scrape_multiple_pairs(self, route_pairs: List[Tuple[str, str]], limit: int = None):
        """
        Scrape multiple origin-destination pairs
        
        Args:
            route_pairs: List of (from, to) tuples
            limit: Limit number of pairs to scrape
        """
        logger.info("=== Starting Tamil Vandi Bus Scraper (Selenium) ===")
        
        try:
            self._setup_driver()
            
            if limit:
                route_pairs = route_pairs[:limit]
            
            # Find last processed pair to resume
            last_processed_idx = None
            if self.processed_pairs:
                last_pair = max(self.processed_pairs, 
                    key=lambda p: route_pairs.index(p) if p in route_pairs else -1)
                last_processed_idx = next((i for i, p in enumerate(route_pairs) if p == last_pair), None)
                if last_processed_idx is not None:
                    logger.info(f"Resuming from pair {last_processed_idx + 1}/{len(route_pairs)}: "
                               f"{last_pair[0]} -> {last_pair[1]}")
                    route_pairs = route_pairs[last_processed_idx:]
            
            for idx, (from_city, to_city) in enumerate(route_pairs, 
                    1 if last_processed_idx is None else last_processed_idx + 1):
                pair = (from_city, to_city)
                
                if pair in self.processed_pairs:
                    logger.info(f"[{idx}/{len(route_pairs)}] Skipping {from_city} -> {to_city} (already processed)")
                    continue
                
                logger.info(f"\n[{idx}/{len(route_pairs)}] Processing: {from_city} -> {to_city}")
                
                try:
                    self.scrape_route_pair(from_city, to_city)
                    self.processed_pairs.add(pair)
                    self._save_checkpoint()
                except Exception as e:
                    logger.error(f"Error scraping {from_city} -> {to_city}: {e}")
                    continue
                
                # Rate limiting between requests
                time.sleep(self.delay)
            
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
                'bus_number', 'bus_type', 'operator_name', 'origin', 'destination',
                'departure_time', 'arrival_time', 'stops_json', 'scraped_at'
            ])
            
            # Data rows
            for route in self.all_routes:
                stops_json = json.dumps(route.stops, ensure_ascii=False)
                writer.writerow([
                    route.bus_number,
                    route.bus_type,
                    route.operator_name,
                    route.origin,
                    route.destination,
                    route.departure_time,
                    route.arrival_time,
                    stops_json,
                    route.scraped_at
                ])
        
        logger.info(f"Saved {len(self.all_routes)} records to CSV: {filepath}")


def load_route_pairs(filepath: str) -> List[Tuple[str, str]]:
    """
    Load route pairs from file
    Expected format: FROM,TO (one per line)
    
    Args:
        filepath: Path to file
        
    Returns:
        List of (from, to) tuples
    """
    try:
        pairs = []
        with open(filepath, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#'):
                    parts = [p.strip() for p in line.split(',')]
                    if len(parts) >= 2:
                        pairs.append((parts[0], parts[1]))
        logger.info(f"Loaded {len(pairs)} route pairs from {filepath}")
        return pairs
    except FileNotFoundError:
        logger.error(f"File not found: {filepath}")
        return []


def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(
        description='Scrape Tamil Vandi bus timings using Selenium and save to JSON/CSV',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Single route
  python tamilvandi_scraper_selenium.py --from "Sivakasi" --to "Madurai"

  # Multiple routes from file (format: FROM,TO per line)
  python tamilvandi_scraper_selenium.py --route-list routes.txt

  # With custom output
  python tamilvandi_scraper_selenium.py --from "Chennai" --to "Coimbatore" --output data/chennai_coimbatore
        """
    )
    
    parser.add_argument(
        '--from',
        dest='from_city',
        help='Origin city'
    )
    parser.add_argument(
        '--to',
        dest='to_city',
        help='Destination city'
    )
    parser.add_argument(
        '--route-list',
        help='File with route pairs in format: FROM,TO (one per line)'
    )
    parser.add_argument(
        '--output',
        default='data/tamilvandi_routes',
        help='Output file path (without extension, default: data/tamilvandi_routes)'
    )
    parser.add_argument(
        '--delay',
        type=float,
        default=1.5,
        help='Delay between operations in seconds (default: 1.5)'
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
    if not args.from_city and not args.route_list:
        parser.error("Either --from/--to or --route-list must be provided")
    
    if args.from_city and not args.to_city:
        parser.error("--to is required when using --from")
    
    # Build route pairs
    route_pairs = []
    
    if args.from_city and args.to_city:
        route_pairs = [(args.from_city, args.to_city)]
    elif args.route_list:
        route_pairs = load_route_pairs(args.route_list)
    
    if not route_pairs:
        logger.error("No valid route pairs to scrape")
        sys.exit(1)
    
    logger.info(f"Will scrape {len(route_pairs)} route pairs")
    
    # Handle headless mode
    headless = args.headless and not args.show_browser
    
    # Load checkpoint
    checkpoint_path = Path(f"{args.output}.checkpoint.json")
    processed_pairs: Set[Tuple[str, str]] = set()
    existing_routes: List[BusRoute] = []
    
    if checkpoint_path.exists():
        try:
            with open(checkpoint_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            processed_pairs = {tuple(p) for p in data.get('processed', [])}
            for item in data.get('routes', []):
                existing_routes.append(BusRoute(**item))
            logger.info(f"Loaded checkpoint: {len(processed_pairs)} pairs, {len(existing_routes)} routes")
        except Exception as e:
            logger.warning(f"Could not load checkpoint: {e}")
    
    # Create scraper and run
    scraper = TamilVandiScraperSelenium(
        delay=args.delay,
        headless=headless,
        checkpoint_path=checkpoint_path,
        processed_pairs=processed_pairs,
        existing_routes=existing_routes
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
        scraper._save_checkpoint()
        sys.exit(1)
    except Exception as e:
        logger.error(f"Fatal error: {e}", exc_info=True)
        sys.exit(1)


if __name__ == '__main__':
    main()
