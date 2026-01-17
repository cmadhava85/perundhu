#!/usr/bin/env python3
"""Debug script to examine Tamil Vandi pagination structure"""

import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
import json

# Setup Chrome
chrome_options = Options()
chrome_options.add_argument("--headless=false")  # Show browser
chrome_options.add_argument("--disable-blink-features=AutomationControlled")

driver = webdriver.Chrome(options=chrome_options)

try:
    # Load the page
    url = "https://www.tamilvandi.com/timings?from=Sivakasi&to=Madurai"
    print(f"Loading {url}...")
    driver.get(url)
    time.sleep(5)
    
    # Scroll to bottom to see pagination
    print("\nScrolling to bottom...")
    driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
    time.sleep(2)
    
    # Get all pagination-related elements
    print("\n" + "="*60)
    print("PAGINATION ANALYSIS")
    print("="*60)
    
    # Look for any elements with "next" in text
    print("\n1. Elements containing 'next' text:")
    elements = driver.find_elements(By.XPATH, "//*[contains(translate(text(), 'NEXT', 'next'), 'next')]")
    for i, elem in enumerate(elements):
        tag = elem.tag_name
        text = elem.text[:50]
        classes = elem.get_attribute('class') or 'no-class'
        href = elem.get_attribute('href') or 'no-href'
        displayed = elem.is_displayed()
        print(f"  [{i}] <{tag}> display={displayed}, text='{text}', class='{classes}', href='{href}'")
        
        # Get parent info
        parent = elem.find_element(By.XPATH, "..")
        print(f"       Parent: <{parent.tag_name}> class='{parent.get_attribute('class') or 'no-class'}'")
    
    # Look for pagination containers
    print("\n2. Pagination containers:")
    containers = driver.find_elements(By.XPATH, "//*[contains(@class, 'page')] | //*[contains(@class, 'pagination')] | //*[contains(@class, 'pager')]")
    for i, cont in enumerate(containers[:10]):
        tag = cont.tag_name
        classes = cont.get_attribute('class') or 'no-class'
        text = cont.text[:50]
        print(f"  [{i}] <{tag}> class='{classes}', text='{text}'")
    
    # Look for links or buttons in the page
    print("\n3. All links at bottom of page:")
    links = driver.find_elements(By.TAG_NAME, "a")
    for link in links[-10:]:
        text = link.text[:50]
        href = link.get_attribute('href')
        classes = link.get_attribute('class') or 'no-class'
        displayed = link.is_displayed()
        print(f"  <a> display={displayed}, text='{text}', href='{href[:50] if href else 'N/A'}', class='{classes}'")
    
    # Check page source for "Next"
    print("\n4. Search page source for 'Next':")
    page_source = driver.page_source
    if 'Next' in page_source:
        # Find the context around "Next"
        idx = page_source.find('Next')
        context = page_source[max(0, idx-200):min(len(page_source), idx+200)]
        print(f"  Found 'Next' in HTML:\n{context}\n")
    else:
        print("  'Next' not found in page source")
    
    # Look for onclick handlers or data attributes
    print("\n5. Looking for interactive elements with 'next' in attributes:")
    xpath = "//*[contains(@onclick, 'next') or contains(@data-next, '') or contains(@data-page, 'next')]"
    elements = driver.find_elements(By.XPATH, xpath)
    if elements:
        for elem in elements:
            print(f"  Found: <{elem.tag_name}> {elem.get_attribute('onclick') or elem.get_attribute('data-next') or 'N/A'}")
    else:
        print("  None found")
    
    # Get full HTML of pagination area
    print("\n6. Full pagination area HTML:")
    pagination = driver.find_elements(By.XPATH, "//*[contains(@class, 'page-')]")
    if pagination:
        html = pagination[0].get_attribute('outerHTML')
        print(html[:500])
    
    print("\n" + "="*60)
    
finally:
    input("Press Enter to close browser...")
    driver.quit()
