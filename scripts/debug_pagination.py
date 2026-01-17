#!/usr/bin/env python3
"""
Debug script to inspect TamilVandi pagination HTML structure
"""

import time
import logging
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By

logging.basicConfig(level=logging.INFO, format='%(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def inspect_pagination():
    """Load page and inspect pagination structure"""
    
    chrome_options = Options()
    chrome_options.add_argument('--headless')
    chrome_options.add_argument('--no-sandbox')
    chrome_options.add_argument('--disable-dev-shm-usage')
    chrome_options.add_argument('--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36')
    
    driver = webdriver.Chrome(options=chrome_options)
    
    try:
        logger.info("Loading Sivakasi -> Madurai page...")
        driver.get("https://www.tamilvandi.com/timings?from=Sivakasi&to=Madurai")
        
        # Wait for page load
        time.sleep(3)
        
        logger.info("\n=== Inspecting pagination elements ===\n")
        
        # Check various pagination patterns
        patterns = [
            ("//*[contains(text(), 'Next')]", "Direct 'Next' text"),
            ("//a[contains(@class, 'next')]", "Anchor with 'next' class"),
            ("//button[contains(@class, 'next')]", "Button with 'next' class"),
            ("//li/a", "List item links (pagination)"),
            ("//*[@class='pagination'] | //*[@class='pager']", "Pagination container"),
            ("//a[@rel='next']", "Link with rel='next'"),
            ("//*[contains(text(), 'page')]", "Elements containing 'page'"),
        ]
        
        for pattern, description in patterns:
            try:
                elements = driver.find_elements(By.XPATH, pattern)
                if elements:
                    logger.info(f"✓ Found {len(elements)} element(s) for: {description}")
                    for i, elem in enumerate(elements[:3]):  # Show first 3
                        text = elem.text[:50] if elem.text else elem.get_attribute('href')
                        classes = elem.get_attribute('class')
                        logger.info(f"    [{i+1}] Text: '{text}' | Class: '{classes}'")
            except:
                pass
        
        # Scroll to bottom and check
        logger.info("\n=== Scrolling to bottom and re-checking ===\n")
        driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
        time.sleep(1)
        
        # Check for Next button at bottom
        try:
            next_links = driver.find_elements(By.XPATH, "//*[contains(text(), 'Next') and (self::a or self::button)]")
            logger.info(f"Found {len(next_links)} 'Next' links after scroll")
            for link in next_links:
                logger.info(f"  - Text: '{link.text}', Class: '{link.get_attribute('class')}'")
                logger.info(f"    Displayed: {link.is_displayed()}, Enabled: {link.is_enabled()}")
        except Exception as e:
            logger.info(f"Error checking Next links: {e}")
        
        # Get page HTML for manual inspection (save to file)
        html = driver.page_source
        with open('debug_page.html', 'w') as f:
            f.write(html)
        logger.info("\nPage HTML saved to: debug_page.html")
        
        # Look for pagination div
        logger.info("\n=== Looking for pagination container ===\n")
        try:
            pagination = driver.find_element(By.XPATH, "//*[contains(@class, 'pagination')]")
            logger.info(f"Found pagination container: {pagination.get_attribute('outerHTML')[:200]}")
        except:
            logger.info("No pagination container found with 'pagination' class")
        
    finally:
        driver.quit()

if __name__ == '__main__':
    inspect_pagination()
