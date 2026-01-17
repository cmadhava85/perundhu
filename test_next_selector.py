#!/usr/bin/env python3
"""Test Wix Next button selector"""

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
import time

options = Options()
options.add_argument('--headless=false')
driver = webdriver.Chrome(options=options)

try:
    print("Loading page...")
    driver.get('https://www.tamilvandi.com/timings?from=Sivakasi&to=Madurai')
    time.sleep(3)
    
    print("Scrolling to bottom...")
    driver.execute_script('window.scrollTo(0, document.body.scrollHeight);')
    time.sleep(1)
    
    # Test selector
    selector = "//button[contains(@class, 'wixui-button') and contains(., 'Next')]"
    print(f"\nTesting selector: {selector}")
    buttons = driver.find_elements(By.XPATH, selector)
    print(f"Found {len(buttons)} buttons")
    
    if buttons:
        btn = buttons[0]
        print(f"✓ Button found!")
        print(f"  - Displayed: {btn.is_displayed()}")
        print(f"  - Enabled: {btn.is_enabled()}")
        print(f"  - Text: '{btn.text}'")
        print(f"  - Classes: {btn.get_attribute('class')[:100]}")
        
        # Try to click
        print(f"\nAttempting to click...")
        try:
            btn.click()
            print(f"✓ Click successful!")
            time.sleep(3)
            print(f"Page title: {driver.title}")
        except Exception as e:
            print(f"✗ Click failed: {e}")
            # Try JS click
            print(f"Trying JS click...")
            driver.execute_script("arguments[0].click();", btn)
            time.sleep(3)
            print(f"✓ JS click done")
    else:
        print("✗ No buttons found with selector")
        
        # Debug alternatives
        print("\nTrying alternative selectors:")
        
        alts = [
            "//button[contains(@class, 'wixui-button')]",
            "//button[.//span[contains(., 'Next')]]",
            "//*[contains(., 'Next') and contains(@class, 'wixui')]",
        ]
        
        for alt in alts:
            try:
                elems = driver.find_elements(By.XPATH, alt)
                print(f"  {alt}: {len(elems)} found")
            except:
                print(f"  {alt}: ERROR")

finally:
    print("\nClosing browser...")
    driver.quit()
