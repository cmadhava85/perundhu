#!/usr/bin/env python3
"""Better pagination debug - wait for JavaScript to load"""

import time
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

chrome_options = Options()
chrome_options.add_argument('--disable-blink-features=AutomationControlled')
chrome_options.add_argument('--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36')
chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
chrome_options.add_experimental_option('useAutomationExtension', False)

driver = webdriver.Chrome(options=chrome_options)
driver.implicitly_wait(10)

try:
    url = "https://www.tamilvandi.com/timings?from=Sivakasi&to=Madurai"
    print(f"Loading: {url}\n")
    driver.get(url)
    
    print("Waiting for page to load...")
    time.sleep(3)
    
    # Try to wait for content
    try:
        print("Waiting for content to appear...")
        WebDriverWait(driver, 15).until(
            lambda d: len(d.find_element(By.TAG_NAME, 'body').text) > 100
        )
        print("✓ Content loaded!")
    except:
        print("⚠ Content didn't load within 15s")
    
    body_text = driver.find_element(By.TAG_NAME, 'body').text
    print(f"\nBody text length: {len(body_text)} chars")
    print(f"First 500 chars:\n{body_text[:500]}\n")
    
    # Print full page to see structure
    if len(body_text) > 50:
        lines = body_text.split('\n')
        print(f"Total lines: {len(lines)}\n")
        print("Full page content:")
        for i, line in enumerate(lines):
            if line.strip():
                print(f"{i+1:3d}: {line}")
    
finally:
    driver.quit()
