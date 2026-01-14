#!/usr/bin/env python3
"""Inspect Bing Images page source to find actual image URLs."""

from selenium import webdriver
from selenium.webdriver.common.by import By
import json
import time
import re

# Setup browser
options = webdriver.ChromeOptions()
options.add_argument('--headless')
options.add_argument('--no-sandbox')
options.add_argument('--disable-dev-shm-usage')

driver = webdriver.Chrome(options=options)

try:
    # Navigate to Bing Images
    url = "https://www.bing.com/images/search?q=bus+schedule"
    driver.get(url)
    
    print(f"[*] Loaded: {url}")
    time.sleep(3)
    
    # Get page source
    page_source = driver.page_source
    
    # Look for image data in JavaScript
    
    # Pattern 1: Look for JSON data with image URLs
    json_pattern = r'"murl":"([^"]+)"'
    matches = re.findall(json_pattern, page_source)
    print(f"\n[*] Pattern 'murl': Found {len(matches)} URLs")
    if matches:
        for i, url in enumerate(matches[:3]):
            print(f"  {i+1}: {url}")
    
    # Pattern 2: Look for image.mediaurl
    json_pattern2 = r'"mediaurl":"([^"]+)"'
    matches2 = re.findall(json_pattern2, page_source)
    print(f"\n[*] Pattern 'mediaurl': Found {len(matches2)} URLs")
    if matches2:
        for i, url in enumerate(matches2[:3]):
            print(f"  {i+1}: {url}")
    
    # Pattern 3: Look for Pinterest style "pinimg"
    json_pattern3 = r'pinimg\.com[^"]*'
    matches3 = re.findall(json_pattern3, page_source)
    print(f"\n[*] Pattern 'pinimg': Found {len(matches3)} URLs")
    if matches3:
        for i, url in enumerate(matches3[:3]):
            print(f"  {i+1}: {url}")
    
    # Pattern 4: Extract from <img> elements data attributes
    print(f"\n[*] Checking for rendered image elements...")
    img_elements = driver.find_elements(By.CSS_SELECTOR, "img.mimg")
    print(f"  Found {len(img_elements)} elements with class 'mimg'")
    
    # Pattern 5: Check for lazy-loaded data
    print(f"\n[*] Looking for JavaScript data structures...")
    
    # Search for 'data-alt' or 'data-src' in any element
    all_images = driver.find_elements(By.TAG_NAME, "img")
    print(f"  Total img tags: {len(all_images)}")
    
    for i, img in enumerate(all_images[:5]):
        src = img.get_attribute("src")
        data_src = img.get_attribute("data-src")
        data_url = img.get_attribute("data-url")
        alt = img.get_attribute("alt")
        
        print(f"\n  Image {i+1}:")
        print(f"    src: {src[:80] if src else 'None'}")
        print(f"    data-src: {data_src[:80] if data_src else 'None'}")
        print(f"    data-url: {data_url[:80] if data_url else 'None'}")
        print(f"    alt: {alt[:80] if alt else 'None'}")
    
    # Pattern 6: Check HTML structure for image containers
    print(f"\n[*] Checking for image container divs...")
    
    # Look for .iusc (Bing's image universal search container)
    iusc_elements = driver.find_elements(By.CLASS_NAME, "iusc")
    print(f"  Found {len(iusc_elements)} elements with class 'iusc'")
    
    if iusc_elements:
        for i, elem in enumerate(iusc_elements[:2]):
            # Extract m attribute
            m_attr = elem.get_attribute("m")
            print(f"\n  IUSC {i+1} 'm' attribute: {m_attr[:200] if m_attr else 'None'}")
            
            # Try to parse as JSON
            if m_attr:
                try:
                    data = json.loads(m_attr)
                    print(f"    Parsed JSON successfully")
                    if 'murl' in data:
                        print(f"    murl: {data['murl'][:100]}")
                    if 'purl' in data:
                        print(f"    purl: {data['purl'][:100]}")
                except:
                    print(f"    Failed to parse as JSON")
    
    # Pattern 7: Search for click handlers
    print(f"\n[*] Checking for href attributes in links...")
    all_links = driver.find_elements(By.TAG_NAME, "a")
    print(f"  Total links: {len(all_links)}")
    
    for i, link in enumerate(all_links[:5]):
        href = link.get_attribute("href")
        if href and 'pinterest' in href.lower():
            print(f"    Link {i+1}: {href[:100]}")

finally:
    driver.quit()
    print("\n[*] Done")
