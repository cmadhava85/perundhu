#!/usr/bin/env python3
"""
Tamil Vandi City List Fetcher
Fetches all available cities from https://www.tamilvandi.com/timings
Saves to a JSON file for use with the main scraper.

Usage:
    python tamilvandi_get_cities.py --output data/tamilvandi_cities.json
    python tamilvandi_get_cities.py --output data/cities.json --show-browser
"""

import time
import json
import logging
import argparse
import sys
from pathlib import Path
from typing import List
import urllib.parse

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class TamilVandiCityFetcher:
    """Fetches available cities from Tamil Vandi website"""
    
    BASE_URL = "https://www.tamilvandi.com/timings"
    
    def __init__(self, headless: bool = True):
        """
        Initialize the city fetcher
        
        Args:
            headless: Run browser in headless mode
        """
        self.headless = headless
        self.driver = None
        
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
        chrome_options.add_argument('--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36')
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
    
    def _close_popups(self):
        """Close any popups or modals"""
        try:
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
    
    def fetch_cities(self) -> List[str]:
        """
        Fetch all available cities from the website
        
        Returns:
            Sorted list of unique city names
        """
        logger.info("Fetching cities from Tamil Vandi...")
        cities = set()
        
        try:
            # Load the search page
            logger.info(f"Loading {self.BASE_URL}")
            self.driver.get(self.BASE_URL)
            time.sleep(3)
            self._close_popups()
            
            # Strategy 1: Look for autocomplete input fields and trigger suggestions
            logger.info("Strategy 1: Checking autocomplete suggestions...")
            try:
                input_selectors = [
                    "input[name*='from' i]",
                    "input[name*='to' i]",
                    "input[placeholder*='from' i]",
                    "input[placeholder*='to' i]",
                    "input[placeholder*='city' i]",
                    "input[type='text']",
                    "#from, #to, #source, #destination",
                ]
                
                for selector in input_selectors:
                    try:
                        inputs = self.driver.find_elements(By.CSS_SELECTOR, selector)
                        if not inputs:
                            continue
                            
                        logger.info(f"  Found input field: {selector}")
                        
                        # Try different letters to trigger autocomplete
                        test_chars = ['a', 'b', 'c', 'd', 'e', 'm', 'p', 's', 't', 'k', 'n', 'v']
                        
                        for test_char in test_chars:
                            try:
                                input_elem = inputs[0]
                                input_elem.clear()
                                input_elem.send_keys(test_char)
                                time.sleep(1.5)
                                
                                # Look for autocomplete dropdown with multiple selectors
                                dropdown_selectors = [
                                    ".autocomplete-suggestions li",
                                    ".autocomplete-suggestions div",
                                    ".ui-autocomplete li",
                                    ".ui-menu-item",
                                    "[role='listbox'] *",
                                    ".dropdown-menu li",
                                    ".dropdown-menu a",
                                    ".suggestions *",
                                ]
                                
                                for dropdown_selector in dropdown_selectors:
                                    try:
                                        suggestions = self.driver.find_elements(By.CSS_SELECTOR, dropdown_selector)
                                        if suggestions:
                                            logger.info(f"    Found {len(suggestions)} suggestions for '{test_char}'")
                                            for sugg in suggestions:
                                                text = sugg.text.strip()
                                                if text and len(text) > 2 and not text.startswith('No'):
                                                    cities.add(text)
                                                    logger.debug(f"      Added: {text}")
                                    except:
                                        pass
                                        
                            except Exception as e:
                                logger.debug(f"    Error with char '{test_char}': {e}")
                                pass
                        
                        if cities:
                            logger.info(f"  Found {len(cities)} cities so far")
                            
                    except Exception as e:
                        logger.debug(f"  Error with selector {selector}: {e}")
                        pass
                
                if cities:
                    logger.info(f"✓ Strategy 1 successful: {len(cities)} cities from autocomplete")
                    return sorted(list(cities))
                    
            except Exception as e:
                logger.debug(f"Strategy 1 failed: {e}")
            
            # Strategy 2: Look for select/dropdown elements
            logger.info("Strategy 2: Checking select dropdowns...")
            try:
                selects = self.driver.find_elements(By.TAG_NAME, "select")
                for idx, select in enumerate(selects):
                    options = select.find_elements(By.TAG_NAME, "option")
                    logger.info(f"  Found select {idx+1} with {len(options)} options")
                    for option in options:
                        text = option.text.strip()
                        value = option.get_attribute('value')
                        if text and value and len(text) > 2 and text not in ['Select', 'Choose']:
                            cities.add(text)
                            logger.debug(f"    Added: {text}")
                
                if cities:
                    logger.info(f"✓ Strategy 2 successful: {len(cities)} cities from dropdowns")
                    return sorted(list(cities))
                    
            except Exception as e:
                logger.debug(f"Strategy 2 failed: {e}")
            
            # Strategy 3: Parse city names from page links
            logger.info("Strategy 3: Parsing links for city names...")
            try:
                links = self.driver.find_elements(By.TAG_NAME, "a")
                logger.info(f"  Found {len(links)} links on page")
                
                for link in links:
                    href = link.get_attribute('href') or ''
                    if 'from=' in href or 'to=' in href:
                        parsed = urllib.parse.urlparse(href)
                        params = urllib.parse.parse_qs(parsed.query)
                        
                        if 'from' in params:
                            city = params['from'][0].replace('+', ' ').strip()
                            if city and len(city) > 2:
                                cities.add(city)
                                logger.debug(f"    Added from link: {city}")
                        
                        if 'to' in params:
                            city = params['to'][0].replace('+', ' ').strip()
                            if city and len(city) > 2:
                                cities.add(city)
                                logger.debug(f"    Added from link: {city}")
                
                if cities:
                    logger.info(f"✓ Strategy 3 successful: {len(cities)} cities from links")
                    return sorted(list(cities))
                    
            except Exception as e:
                logger.debug(f"Strategy 3 failed: {e}")
            
            # Strategy 4: Look for any data-city or similar attributes
            logger.info("Strategy 4: Checking data attributes...")
            try:
                elements_with_data = self.driver.find_elements(By.XPATH, 
                    "//*[@data-city] | //*[@data-location] | //*[@data-place]")
                logger.info(f"  Found {len(elements_with_data)} elements with data attributes")
                
                for elem in elements_with_data:
                    for attr in ['data-city', 'data-location', 'data-place']:
                        city = elem.get_attribute(attr)
                        if city and len(city) > 2:
                            cities.add(city)
                            logger.debug(f"    Added: {city}")
                
                if cities:
                    logger.info(f"✓ Strategy 4 successful: {len(cities)} cities from data attributes")
                    return sorted(list(cities))
                    
            except Exception as e:
                logger.debug(f"Strategy 4 failed: {e}")
            
            # Fallback: Return default list of major Tamil Nadu cities
            logger.warning("⚠ All strategies failed. Returning default city list.")
            logger.info("This list contains major Tamil Nadu cities and may not be complete.")
            
            default_cities = [
                # Major Cities
                "Chennai", "Coimbatore", "Madurai", "Trichy", "Salem", 
                "Tiruppur", "Erode", "Vellore", "Thoothukudi", "Dindigul",
                
                # District Headquarters
                "Thanjavur", "Ranipet", "Sivakasi", "Karur", "Udhagamandalam",
                "Hosur", "Nagercoil", "Kumbakonam", "Tirunelveli", "Pollachi",
                "Rajapalayam", "Pudukkottai", "Cuddalore", "Kanchipuram", 
                "Tiruvannamalai", "Virudhunagar", "Namakkal", "Dharmapuri",
                
                # Other Important Towns
                "Arakkonam", "Chengalpattu", "Villupuram", "Tiruvallur",
                "Nagapattinam", "Mayiladuthurai", "Ariyalur", "Perambalur",
                "Krishnagiri", "Tiruchengode", "Gobichettipalayam", "Mettupalayam",
                "Udumalaipettai", "Palani", "Oddanchatram", "Attur",
                "Sankarankovil", "Tenkasi", "Kovilpatti", "Srivilliputhur",
                
                # TNSTC Division Names (commonly used)
                "CHENNAI", "COIMBATORE", "MADURAI", "TRICHY", "SALEM",
                "TIRUPPUR", "ERODE", "VELLORE", "VILLUPURAM", "KUMBAKONAM"
            ]
            
            # Remove duplicates and sort
            return sorted(list(set(default_cities)))
            
        except Exception as e:
            logger.error(f"Error fetching cities: {e}")
            return []
    
    def run(self) -> List[str]:
        """
        Main method to fetch cities
        
        Returns:
            List of city names
        """
        try:
            self._setup_driver()
            cities = self.fetch_cities()
            return cities
        finally:
            self._close_driver()


def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(
        description='Fetch all available cities from Tamil Vandi website',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Fetch cities and save to JSON
  python tamilvandi_get_cities.py --output data/tamilvandi_cities.json

  # Show browser window while fetching
  python tamilvandi_get_cities.py --output data/cities.json --show-browser

  # Verbose logging
  python tamilvandi_get_cities.py --output data/cities.json --verbose
        """
    )
    
    parser.add_argument(
        '--output',
        default='data/tamilvandi_cities.json',
        help='Output JSON file path (default: data/tamilvandi_cities.json)'
    )
    parser.add_argument(
        '--show-browser',
        action='store_true',
        help='Show browser window (not headless)'
    )
    parser.add_argument(
        '--verbose',
        action='store_true',
        help='Enable verbose logging'
    )
    
    args = parser.parse_args()
    
    if args.verbose:
        logger.setLevel(logging.DEBUG)
    
    headless = not args.show_browser
    
    logger.info("=== Tamil Vandi City List Fetcher ===")
    
    try:
        # Create fetcher and run
        fetcher = TamilVandiCityFetcher(headless=headless)
        cities = fetcher.run()
        
        if not cities:
            logger.error("No cities found!")
            sys.exit(1)
        
        # Save to file
        output_path = Path(args.output)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        
        data = {
            "cities": cities,
            "count": len(cities),
            "fetched_at": time.strftime("%Y-%m-%d %H:%M:%S"),
            "source": "https://www.tamilvandi.com/timings"
        }
        
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        
        logger.info(f"\n✅ Successfully fetched {len(cities)} cities")
        logger.info(f"📁 Saved to: {output_path}")
        
        # Print cities for verification
        logger.info("\n📍 Cities found:")
        for i, city in enumerate(cities, 1):
            print(f"  {i:3d}. {city}")
        
        # Also save as simple text file (one city per line)
        text_output = output_path.with_suffix('.txt')
        with open(text_output, 'w', encoding='utf-8') as f:
            f.write('\n'.join(cities))
        
        logger.info(f"\n📄 Also saved as text: {text_output}")
        logger.info("\nUse these cities with the main scraper to avoid errors!")
        
    except KeyboardInterrupt:
        logger.info("\nInterrupted by user")
        sys.exit(1)
    except Exception as e:
        logger.error(f"Fatal error: {e}", exc_info=True)
        sys.exit(1)


if __name__ == '__main__':
    main()
