#!/usr/bin/env python3
"""
Quick test to inspect TNSTC website structure
"""

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
import time
import json

chrome_options = Options()
chrome_options.add_argument('--headless')
chrome_options.add_argument('--no-sandbox')
chrome_options.add_argument('--disable-dev-shm-usage')

driver = webdriver.Chrome(options=chrome_options)

try:
    print("Opening TNSTC website...")
    driver.get("https://www.tnstc.in/OTRSOnline/")
    time.sleep(5)
    
    print("\n=== PAGE TITLE ===")
    print(driver.title)
    
    print("\n=== INPUT FIELDS (first 20) ===")
    inputs = driver.find_elements(By.TAG_NAME, "input")
    for i, inp in enumerate(inputs[:20]):
        print(f"{i}: type={inp.get_attribute('type'):15} id={inp.get_attribute('id'):30} name={inp.get_attribute('name'):20} placeholder={inp.get_attribute('placeholder')}")
    
    print(f"\n=== FOUND {len(inputs)} INPUT FIELDS TOTAL ===")
    
    print("\n=== BUTTONS (first 10) ===")
    buttons = driver.find_elements(By.TAG_NAME, "button")
    for i, btn in enumerate(buttons[:10]):
        print(f"{i}: text={btn.text[:40]:40} id={btn.get_attribute('id'):20} class={btn.get_attribute('class')}")
    
    print(f"\n=== FOUND {len(buttons)} BUTTONS TOTAL ===")
    
    print("\n=== SELECT/DROPDOWN FIELDS ===")
    selects = driver.find_elements(By.TAG_NAME, "select")
    for i, sel in enumerate(selects):
        print(f"{i}: id={sel.get_attribute('id'):20} name={sel.get_attribute('name')}")
    
    print(f"\n=== FOUND {len(selects)} SELECT FIELDS ===")
    
    print("\n=== PAGE SOURCE (first 5000 chars) ===")
    source = driver.page_source
    print(source[:5000])
    
    # Save full page source for inspection
    with open('tnstc_page_source.html', 'w') as f:
        f.write(source)
    print("\nFull page source saved to: tnstc_page_source.html")
    
finally:
    driver.quit()
