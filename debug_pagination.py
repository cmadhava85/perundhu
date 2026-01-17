#!/usr/bin/env python3
"""Debug pagination on Tamil Vandi website"""

import time
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

chrome_options = Options()
chrome_options.add_argument('--headless')
chrome_options.add_argument('--disable-blink-features=AutomationControlled')
chrome_options.add_argument('--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36')
chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
chrome_options.add_experimental_option('useAutomationExtension', False)

driver = webdriver.Chrome(options=chrome_options)

try:
    url = "https://www.tamilvandi.com/timings?from=Sivakasi&to=Madurai"
    print(f"Loading: {url}\n")
    driver.get(url)
    time.sleep(5)
    
    print("="*70)
    print("PAGE 1 - Checking for results:")
    print("="*70)
    
    body_text = driver.find_element(By.TAG_NAME, 'body').text
    
    # Count buses on page
    bus_count = body_text.count('🚌')
    time_count = body_text.count('🕒')
    print(f"Emoji counts: 🚌={bus_count}, 🕒={time_count}")
    print(f"Body text length: {len(body_text)} chars")
    
    # Show first 150 lines
    lines = body_text.split('\n')
    print(f"Total lines: {len(lines)}\n")
    print("First 100 lines:")
    for i, line in enumerate(lines[:100]):
        if line.strip():
            print(f"{i+1:3d}: {line[:90]}")
    
    print("\n" + "="*70)
    print("PAGINATION ELEMENTS:")
    print("="*70)
    
    # Look for pagination
    pagination_selectors = [
        ("//button[contains(., 'Next')]", "Next button (text)"),
        ("//button[@class*='page']", "Pagination button class"),
        ("//*[contains(text(), 'Next')]", "Any Next text"),
        ("//nav", "Nav element"),
        ("//div[contains(@class, 'pagina')]", "Pagination div"),
        ("//*[@aria-label*='next' or @aria-label*='Next']", "Aria next"),
    ]
    
    for selector, name in pagination_selectors:
        try:
            elements = driver.find_elements(By.XPATH, selector)
            if elements:
                print(f"\n✓ Found {len(elements)} for: {name}")
                for elem in elements[:3]:
                    text = elem.text[:50] if elem.text else elem.get_attribute('aria-label') or "(no text)"
                    visible = elem.is_displayed()
                    print(f"  - {text} [visible: {visible}]")
        except:
            pass
    
    # Check if there's a next page by scrolling
    print("\n" + "="*70)
    print("SCROLLING TO BOTTOM:")
    print("="*70)
    
    driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
    time.sleep(2)
    
    body_text_after = driver.find_element(By.TAG_NAME, 'body').text
    print(f"After scroll - body text length: {len(body_text_after)} chars")
    print(f"Content changed: {body_text != body_text_after}")
    
    # Look for next page link at bottom
    print("\nLooking for next/pagination at bottom...")
    links = driver.find_elements(By.TAG_NAME, 'a')
    print(f"Total links on page: {len(links)}")
    
    for link in links:
        text = link.text.strip()
        href = link.get_attribute('href') or ''
        if 'next' in text.lower() or 'page' in href.lower():
            print(f"  - {text}: {href[:60]}")
    
    # Try clicking on any visible next button
    print("\n" + "="*70)
    print("ATTEMPTING TO CLICK NEXT:")
    print("="*70)
    
    next_buttons = driver.find_elements(By.XPATH, 
        "//button[contains(., 'Next')] | //*[contains(text(), 'Next')]")
    
    if next_buttons:
        for btn in next_buttons:
            if btn.is_displayed():
                print(f"Found visible next button: {btn.text}")
                try:
                    driver.execute_script("arguments[0].scrollIntoView({behavior: 'smooth', block: 'center'});", btn)
                    time.sleep(1)
                    btn.click()
                    print("Clicked! Waiting for page load...")
                    time.sleep(3)
                    
                    new_body = driver.find_element(By.TAG_NAME, 'body').text
                    new_bus_count = new_body.count('🚌')
                    print(f"Page 2 loaded - bus count: {new_bus_count}")
                    break
                except Exception as e:
                    print(f"Click failed: {e}")
    else:
        print("No next button found")
    
finally:
    driver.quit()
