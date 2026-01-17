#!/usr/bin/env python3
"""Debug Tamil Vandi website structure"""

import time
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By

chrome_options = Options()
chrome_options.add_argument('--headless')
chrome_options.add_argument('--disable-blink-features=AutomationControlled')
chrome_options.add_argument('--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36')
chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
chrome_options.add_experimental_option('useAutomationExtension', False)

driver = webdriver.Chrome(options=chrome_options)

try:
    url = "https://www.tamilvandi.com/timings?from=Arakkonam&to=Ariyalur"
    print(f"Loading: {url}")
    driver.get(url)
    time.sleep(5)
    
    # Get page content
    body_text = driver.find_element(By.TAG_NAME, 'body').text
    page_html = driver.find_element(By.TAG_NAME, 'body').get_attribute('innerHTML')[:2000]
    
    print("\n" + "="*70)
    print("PAGE TEXT (first 100 lines):")
    print("="*70)
    lines = body_text.split('\n')
    for i, line in enumerate(lines[:100]):
        print(f"{i+1:3d}: {line[:100]}")
    
    print("\n" + "="*70)
    print("PAGE HTML STRUCTURE (first 2000 chars):")
    print("="*70)
    print(page_html)
    
    print("\n" + "="*70)
    print("LOOKING FOR BUS/ROUTE ELEMENTS:")
    print("="*70)
    
    # Try different selectors
    selectors = [
        ("//div[contains(@class, 'bus')]", "bus div"),
        ("//tr[contains(@class, 'bus')]", "bus tr"),
        ("//div[contains(@class, 'route')]", "route div"),
        ("//div[contains(., '🚌')]", "emoji bus"),
        ("//div[contains(., '🕒')]", "emoji time"),
        ("//*[contains(text(), 'Sivakasi')]", "text search"),
        ("//button", "buttons"),
        ("//a", "links"),
        ("//img", "images"),
        ("//h1 | //h2 | //h3", "headings"),
    ]
    
    for selector, name in selectors:
        try:
            elements = driver.find_elements(By.XPATH, selector)
            print(f"\n{name} ({selector}): {len(elements)} found")
            if elements and len(elements) < 10:
                for elem in elements[:5]:
                    text = elem.text[:60] if elem.text else "(empty)"
                    print(f"  - {text}")
        except:
            print(f"\n{name}: Error")
    
    print("\n" + "="*70)
    print("PAGE URL:", driver.current_url)
    print("="*70)
    
finally:
    driver.quit()
