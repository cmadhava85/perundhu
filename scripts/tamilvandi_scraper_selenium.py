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
import requests

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
    API_URL = "https://www.tamilvandi.com/_api/wix-code-public-dispatcher-ng/siteview/_webMethods/backend/googleSheetFetch.jsw/getSheetDataPaginated.ajax?gridAppId=ee62bd20-2f2c-4073-bdd3-3e5bb29c2a48&viewMode=site"
    
    def __init__(
        self,
        delay: float = 1.5,
        headless: bool = True,
        checkpoint_path: Optional[Path] = None,
        processed_pairs: Optional[Set[Tuple[str, str]]] = None,
        existing_routes: Optional[List[BusRoute]] = None,
        auth_token: Optional[str] = None,
    ):
        """
        Initialize the Selenium scraper
        
        Args:
            delay: Delay between operations in seconds
            headless: Run browser in headless mode
            checkpoint_path: Path to checkpoint file for resuming
            processed_pairs: Set of already processed (from, to) pairs
            existing_routes: List of routes already scraped
            auth_token: Optional pre-provided Wix authorization token for API pagination
        """
        self.delay = delay
        self.headless = headless
        self.driver = None
        self.all_routes: List[BusRoute] = existing_routes or []
        self.checkpoint_path = checkpoint_path
        self.processed_pairs: Set[Tuple[str, str]] = processed_pairs or set()
        self.session = requests.Session()
        self.auth_token = auth_token  # Can be provided externally
        self.xsrf_token = None
        
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
        
        # Enable performance logging to capture network requests
        chrome_options.set_capability('goog:loggingPrefs', {'performance': 'ALL'})
        
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
    
    def _capture_token_from_network_logs(self):
        """Capture auth token from browser network logs"""
        try:
            logs = self.driver.get_log('performance')
            for entry in logs:
                try:
                    log = json.loads(entry['message'])['message']
                    
                    # Look for network requests
                    if log.get('method') == 'Network.requestWillBeSent':
                        request = log.get('params', {}).get('request', {})
                        headers = request.get('headers', {})
                        
                        # Check for authorization header
                        auth_header = headers.get('authorization') or headers.get('Authorization')
                        if auth_header and 'wixcode-pub' in auth_header:
                            self.auth_token = auth_header
                            logger.info(f"✓ Captured auth token from network: {auth_header[:60]}...")
                            return True
                        
                        # Check for x-wix-app-instance
                        app_instance = headers.get('x-wix-app-instance')
                        if app_instance and 'wixcode-pub' in app_instance:
                            self.auth_token = app_instance
                            logger.info(f"✓ Captured auth token from x-wix-app-instance: {app_instance[:60]}...")
                            return True
                        
                        # Check URL for embedded tokens
                        url = request.get('url', '')
                        if 'wix-code-public-dispatcher' in url and 'wixcode-pub' in str(headers):
                            # Token might be in any header
                            for header_val in headers.values():
                                if isinstance(header_val, str) and 'wixcode-pub' in header_val and len(header_val) > 100:
                                    self.auth_token = header_val
                                    logger.info(f"✓ Found token in headers: {header_val[:60]}...")
                                    return True
                                    
                except Exception as e:
                    continue
                    
            return False
        except Exception as e:
            logger.debug(f"Error capturing from network logs: {e}")
            return False
    
    def _extract_auth_tokens(self):
        """Extract authorization and XSRF tokens from page"""
        try:
            # Strategy 0: Check if token already provided
            if self.auth_token:
                logger.info(f"✓ Using pre-provided auth token")
                return True
            
            # Strategy 1: Try to capture from network logs first
            if self._capture_token_from_network_logs():
                return True
            
            # Strategy 2: Try to get from JavaScript execution context
            try:
                # Execute JavaScript to fetch from various sources
                js_script = """
                return (function() {
                    // Try window objects
                    if (window.wixBiSession && window.wixBiSession.viewerSessionId) {
                        return window.wixBiSession.viewerSessionId;
                    }
                    // Try from config objects
                    if (window.rendererModel && window.rendererModel.clientSpecMap) {
                        var config = JSON.stringify(window.rendererModel);
                        var match = config.match(/wixcode-pub\\.[a-f0-9]{30,}\\.[A-Za-z0-9_-]{100,}/);
                        if (match) return match[0];
                    }
                    // Try localStorage/sessionStorage
                    try {
                        var storage = JSON.stringify(localStorage) + JSON.stringify(sessionStorage);
                        var match = storage.match(/wixcode-pub\\.[a-f0-9]{30,}\\.[A-Za-z0-9_-]{100,}/);
                        if (match) return match[0];
                    } catch(e) {}
                    return null;
                })();
                """
                result = self.driver.execute_script(js_script)
                if result and 'wixcode-pub' in str(result):
                    self.auth_token = str(result)
                    logger.info(f"✓ Found auth token via JavaScript: {self.auth_token[:60]}...")
                    
            except Exception as e:
                logger.debug(f"JS extraction failed: {e}")
            
            # Strategy 2: Extract from page source
            if not self.auth_token:
                page_source = self.driver.page_source
                
                # Look for authorization token - try multiple strategies
                auth_patterns = [
                    # In JSON objects
                    r'"authorization"\s*:\s*"(wixcode-pub\.[^"]+)"',
                    r"'authorization'\s*:\s*'(wixcode-pub\.[^']+)'",
                    # In x-wix-app-instance
                    r'"x-wix-app-instance"\s*:\s*"(wixcode-pub\.[^"]+)"',
                    r"'x-wix-app-instance'\s*:\s*'(wixcode-pub\.[^']+)'",
                    # Direct token pattern
                    r'(wixcode-pub\.[a-f0-9]{32,64}\.[A-Za-z0-9_-]{100,})',
                    # In URL-encoded format
                    r'authorization[=:]([^&\s"\']+wixcode-pub[^&\s"\']+)',
                ]
                
                for pattern in auth_patterns:
                    matches = re.findall(pattern, page_source)
                    if matches:
                        for token in matches:
                            if 'wixcode-pub' in token and len(token) > 100:
                                self.auth_token = token
                                logger.info(f"✓ Found auth token: {token[:60]}...")
                                break
                    if self.auth_token:
                        break
            
            # Look for XSRF token in cookies or page
            try:
                cookies = self.driver.get_cookies()
                for cookie in cookies:
                    if 'XSRF' in cookie.get('name', '').upper():
                        self.xsrf_token = cookie.get('value')
                        logger.debug(f"Found XSRF token from cookie")
                        break
            except:
                pass
            
            # Fallback: extract from page content
            if not self.xsrf_token:
                xsrf_patterns = [
                    r'["\']?x-xsrf-token["\']?\s*:\s*["\']([^"\',]+)',
                    r'xsrfToken["\']?\s*:\s*["\']([^"\',]+)',
                ]
                for pattern in xsrf_patterns:
                    xsrf_match = re.search(pattern, page_source)
                    if xsrf_match:
                        self.xsrf_token = xsrf_match.group(1)
                        logger.debug(f"Found XSRF token from page")
                        break
            
            if self.auth_token:
                logger.info(f"✓ Auth tokens extracted successfully")
            else:
                logger.warning(f"⚠️  Could not extract auth token from page")
            
            return bool(self.auth_token)
            
        except Exception as e:
            logger.debug(f"Error extracting auth tokens: {e}")
            return False
    
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
            
            # Wait for JavaScript to fully load and inject tokens
            logger.debug("Waiting for dynamic content to load...")
            time.sleep(3)  # Give extra time for Wix scripts to execute
            
            # Try to trigger network activity by scrolling to load more content
            try:
                self.driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
                time.sleep(2)
                
                # Try to find and monitor Next button to capture API calls
                if not self.auth_token:
                    logger.debug("Looking for Next button to capture API token...")
                    next_button_selectors = [
                        "//button[contains(., 'Next') or contains(., 'next')]",
                        "//button[contains(@class, 'wixui-button')]//span[contains(text(), 'Next')]/..",
                        "//*[@role='button' and contains(., 'Next')]"
                    ]
                    
                    for selector in next_button_selectors:
                        try:
                            buttons = self.driver.find_elements(By.XPATH, selector)
                            for btn in buttons:
                                if btn.is_displayed() and btn.is_enabled():
                                    # Scroll to button
                                    self.driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", btn)
                                    time.sleep(1)
                                    
                                    # Click to trigger API call
                                    logger.debug("  Clicking Next button to trigger API call...")
                                    btn.click()
                                    time.sleep(2)
                                    
                                    # Now check network logs for the token
                                    if self._capture_token_from_network_logs():
                                        logger.info("✓ Successfully captured token from Next button click!")
                                        # Navigate back to first page
                                        self.driver.back()
                                        time.sleep(2)
                                        break
                                    break
                            if self.auth_token:
                                break
                        except Exception as e:
                            logger.debug(f"Could not click Next button: {e}")
                            continue
            except Exception as e:
                logger.debug(f"Error during button interaction: {e}")
            
            # Extract auth tokens for API calls (will check network logs)
            if not self._extract_auth_tokens():
                # Save page source for debugging
                logger.debug("Saving page source for token debugging...")
                try:
                    debug_file = Path("data/tamilvandi_debug_page.html")
                    debug_file.parent.mkdir(parents=True, exist_ok=True)
                    with open(debug_file, 'w', encoding='utf-8') as f:
                        f.write(self.driver.page_source)
                    logger.info(f"📄 Page source saved to: {debug_file}")
                except Exception as e:
                    logger.debug(f"Could not save debug page: {e}")
            
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
    
    def fetch_paginated_data_via_api(self, from_city: str, to_city: str, page_number: int, page_size: int = 50) -> Optional[List[Dict]]:
        """
        Fetch paginated bus data via Wix API
        
        Args:
            from_city: Origin city
            to_city: Destination city
            page_number: Page number (0 for first page, 1 for second page, etc.)
            page_size: Number of results per page
            
        Returns:
            List of bus data dictionaries or None if request fails
        """
        if not self.auth_token:
            logger.warning("No auth token available, cannot use API")
            return None
        
        try:
            headers = {
                'accept': 'application/json, text/plain, */*',
                'accept-language': 'en-US,en;q=0.9',
                'authorization': self.auth_token,
                'content-type': 'application/json',
                'origin': 'https://www.tamilvandi.com',
                'referer': f'https://www.tamilvandi.com/timings?from={from_city}&to={to_city}',
                'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36',
                'x-wix-brand': 'wix',
                'x-wix-app-instance': self.auth_token,
            }
            
            if self.xsrf_token:
                headers['x-xsrf-token'] = self.xsrf_token
            
            # Build request body: [page_number, page_size, origin, destination]
            # Example: [4, 9, "SIVakasi", "madurai"] means page 4 with 9 results per page
            payload = [page_number, page_size, from_city, to_city]
            
            logger.debug(f"API call: page={page_number}, size={page_size}, from={from_city}, to={to_city}")
            
            response = self.session.post(
                self.API_URL,
                headers=headers,
                json=payload,
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                logger.debug(f"API response type: {type(data)}")
                return data
            else:
                logger.warning(f"API request failed: {response.status_code}")
                return None
                
        except Exception as e:
            logger.debug(f"Error fetching paginated data via API: {e}")
            return None
    
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
    
    def _parse_api_response(self, api_data, from_city: str, to_city: str) -> List[BusRoute]:
        """
        Parse bus data from API response
        
        Args:
            api_data: API response data (structure varies)
            from_city: Origin city
            to_city: Destination city
            
        Returns:
            List of BusRoute objects
        """
        routes = []
        scraped_at = datetime.now().isoformat()
        
        try:
            # API response could be a list or dict, need to handle both
            if isinstance(api_data, list):
                items = api_data
            elif isinstance(api_data, dict):
                # Check if response has 'result' wrapper (Wix API format)
                if 'result' in api_data and isinstance(api_data['result'], dict):
                    result = api_data['result']
                    items = result.get('results', [])
                    logger.debug(f"API returned {result.get('total', 0)} total, page {result.get('page', 0)}, {len(items)} items")
                else:
                    # Try common keys for data
                    items = api_data.get('items', api_data.get('data', api_data.get('results', [])))
            else:
                logger.warning(f"Unexpected API response type: {type(api_data)}")
                return []
            
            if not items:
                return []
            
            for item in items:
                try:
                    # Parse item based on structure
                    if isinstance(item, dict):
                        # Wix API format: {'_id': '54194', 'from': 'SIVAKASI', 'to': 'MADURAI', 
                        #                  'dep': '01:10', 'type': 'Moffusil Bus', 'corporation': '503'}
                        operator_name = (
                            item.get('corporation') or 
                            item.get('operator') or 
                            item.get('bus_number') or 
                            item.get('name') or 
                            'N/A'
                        )
                        departure_time = (
                            item.get('dep') or 
                            item.get('departure') or 
                            item.get('time') or 
                            item.get('departure_time') or 
                            ''
                        )
                        bus_type = item.get('type') or item.get('bus_type') or 'Unknown'
                        
                        # Use API-provided origin/destination if available
                        origin = item.get('from', from_city)
                        destination = item.get('to', to_city)
                        
                        # Clean time format
                        if departure_time:
                            time_match = re.search(r'(\d{1,2}):(\d{2})', str(departure_time))
                            if time_match:
                                hour = int(time_match.group(1))
                                minute = time_match.group(2)
                                departure_time = f"{hour:02d}:{minute}"
                        
                        if operator_name and departure_time:
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
                    elif isinstance(item, (list, tuple)):
                        # Handle array format: [operator, type, time, ...]
                        if len(item) >= 3:
                            operator_name = str(item[0]) if item[0] else 'N/A'
                            bus_type = str(item[1]) if len(item) > 1 and item[1] else 'Unknown'
                            departure_time = str(item[2]) if len(item) > 2 and item[2] else ''
                            
                            # Clean time format
                            if departure_time:
                                time_match = re.search(r'(\d{1,2}):(\d{2})', departure_time)
                                if time_match:
                                    hour = int(time_match.group(1))
                                    minute = time_match.group(2)
                                    departure_time = f"{hour:02d}:{minute}"
                            
                            if operator_name and departure_time:
                                route = BusRoute(
                                    bus_number=operator_name,
                                    bus_type=bus_type,
                                    operator_name=operator_name,
                                    origin=from_city,
                                    destination=to_city,
                                    departure_time=departure_time,
                                    arrival_time='',
                                    stops=[],
                                    scraped_at=scraped_at
                                )
                                routes.append(route)
                except Exception as e:
                    logger.debug(f"Error parsing API item: {e}")
                    continue
            
            return routes
            
        except Exception as e:
            logger.error(f"Error parsing API response: {e}")
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
        page_size = 50  # Results per API call
        
        # Load first page to extract auth tokens
        if not self.search_buses(from_city, to_city):
            logger.warning(f"Could not load search results for {from_city} -> {to_city}")
            return []
        
        # Parse first page from HTML
        logger.info(f"  📄 Page 1 (from HTML)...")
        routes = self.parse_page_results(from_city, to_city)
        
        if routes:
            for route in routes:
                key = (route.operator_name, route.departure_time)
                if key not in seen_buses:
                    seen_buses.add(key)
                    all_routes.append(route)
            logger.info(f"    ✓ Found {len(routes)} routes from first page")
        else:
            logger.warning(f"    ⚠️  No routes found on first page")
            return []
        
        # Use API for subsequent pages if auth token is available
        if self.auth_token:
            logger.info("  🔑 Using API pagination (Wix endpoint)")
            page_num = 2
            # Page number is 0-indexed in API: page 1 (HTML) = index 0, page 2 = index 1, etc.
            page_index = 1  # Start from second page (index 1)
            
            while page_num <= max_pages:
                logger.info(f"  📄 Page {page_num} (via API, page_index={page_index})...")
                
                api_data = self.fetch_paginated_data_via_api(from_city, to_city, page_index, page_size)
                
                if api_data is None:
                    logger.warning(f"    ⚠️  API call failed")
                    consecutive_empty_pages += 1
                    if consecutive_empty_pages >= max_empty_pages:
                        break
                    page_index += 1
                    page_num += 1
                    continue
                
                # Parse API response
                routes = self._parse_api_response(api_data, from_city, to_city)
                
                if not routes:
                    consecutive_empty_pages += 1
                    logger.info(f"    ℹ️  No more routes (empty page {consecutive_empty_pages}/{max_empty_pages})")
                    if consecutive_empty_pages >= max_empty_pages:
                        logger.info(f"    🛑 Stopping: {consecutive_empty_pages} consecutive empty pages")
                        break
                else:
                    consecutive_empty_pages = 0
                    
                    # Filter duplicates
                    new_routes = []
                    for route in routes:
                        key = (route.operator_name, route.departure_time)
                        if key not in seen_buses:
                            seen_buses.add(key)
                            new_routes.append(route)
                            all_routes.append(route)
                    
                    logger.info(f"    ✓ Found {len(new_routes)} new routes ({len(routes) - len(new_routes)} duplicates)")
                
                page_index += 1  # Increment page number (not offset)
                page_num += 1
                time.sleep(self.delay * 0.5)  # Shorter delay for API calls
            
            if page_num >= max_pages:
                logger.warning(f"  ⚠️  Reached maximum page limit ({max_pages})")
        else:
            logger.warning("  ⚠️  No auth token, cannot use API pagination (only first page scraped)")
        
        logger.info(f"  ✅ Total unique routes collected: {len(all_routes)}")
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
    parser.add_argument(
        '--auth-token',
        help='Wix authorization token for API pagination (optional, for advanced usage)'
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
        existing_routes=existing_routes,
        auth_token=args.auth_token
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
