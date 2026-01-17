#!/usr/bin/env python3
"""Debug script to find exact Next button selector"""

import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
import json

# Setup Chrome
chrome_options = Options()
chrome_options.add_argument("--headless=false")

driver = webdriver.Chrome(options=chrome_options)

try:
    # Load the page
    url = "https://www.tamilvandi.com/timings?from=Sivakasi&to=Madurai"
    print(f"Loading {url}...")
    driver.get(url)
    time.sleep(5)
    
    # Scroll to bottom
    print("\nScrolling to bottom...")
    driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
    time.sleep(2)
    
    print("\n" + "="*70)
    print("FINDING NEXT BUTTON")
    print("="*70)
    
    # Look for wixui-button
    print("\n1. Looking for wixui-button elements:")
    buttons = driver.find_elements(By.XPATH, "//button[contains(@class, 'wixui-button')]")
    print(f"   Found {len(buttons)} wixui-button elements")
    for i, btn in enumerate(buttons[-5:]):  # Last 5
        text = btn.text[:100] if btn.text else "NO TEXT"
        classes = btn.get_attribute('class')[:100]
        displayed = btn.is_displayed()
        print(f"   [{i}] display={displayed}, text='{text}', classes='{classes}'")
    
    # Look for any element containing "Next"
    print("\n2. Looking for elements with 'Next' text:")
    next_elems = driver.find_elements(By.XPATH, "//*[contains(text(), 'Next')]")
    print(f"   Found {len(next_elems)} elements with 'Next'")
    for i, elem in enumerate(next_elems):
        tag = elem.tag_name
        text = elem.text[:50]
        classes = elem.get_attribute('class') or 'no-class'
        parent = elem.find_element(By.XPATH, "..")
        parent_tag = parent.tag_name
        parent_class = parent.get_attribute('class') or 'no-class'
        print(f"   [{i}] <{tag}> text='{text}', class='{classes}'")
        print(f"        Parent <{parent_tag}> class='{parent_class[:80]}'")
        
        # Get grandparent
        try:
            grandparent = parent.find_element(By.XPATH, "..")
            grandparent_tag = grandparent.tag_name
            print(f"        Grandparent <{grandparent_tag}>")
        except:
            pass
    
    # Try clicking each one
    print("\n3. Trying to click 'Next' button:")
    for elem in next_elems:
        try:
            if elem.is_displayed() and elem.is_enabled():
                print(f"   Found clickable 'Next': {elem.tag_name} with class={elem.get_attribute('class')[:80]}")
                
                # Try to find the actual button
                try:
                    button = elem.find_element(By.XPATH, "ancestor::button")
                    print(f"   Found parent button: {button.get_attribute('class')[:80]}")
                except:
                    print(f"   No parent button, trying direct click...")
                    
        except:
            pass
    
    # Save HTML snippet of pagination area
    print("\n4. Pagination area HTML (last 1500 chars of page):")
    html = driver.find_element(By.TAG_NAME, 'body').get_attribute('outerHTML')
    print(html[-1500:])
    
    print("\n" + "="*70)
    
finally:
    driver.quit()
    print("\nBrowser closed.")
