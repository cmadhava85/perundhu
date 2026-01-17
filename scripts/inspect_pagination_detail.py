#!/usr/bin/env python3
"""
Detailed inspection script to find the exact HTML structure of the Next button
"""

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import logging
import json
import time

logging.basicConfig(level=logging.INFO, format='%(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Set up Chrome WebDriver
options = webdriver.ChromeOptions()
options.add_argument("--headless")
options.add_argument("--no-sandbox")
options.add_argument("--disable-dev-shm-usage")
options.add_argument("--disable-blink-features=AutomationControlled")
options.add_argument("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")

driver = webdriver.Chrome(options=options)

try:
    # Load the page
    url = "https://www.tamilvandi.com/timings?from=Sivakasi&to=Madurai"
    logger.info(f"Loading: {url}")
    driver.get(url)
    
    # Wait for results
    wait = WebDriverWait(driver, 20)
    try:
        wait.until(EC.presence_of_all_elements_located((By.XPATH, "//a[contains(@class, 'bus-item')]")))
        logger.info("✓ Results loaded")
    except Exception as e:
        logger.warning(f"Could not wait for results: {e}")
    
    time.sleep(5)  # Give the page extra time to load
    
    # Scroll to bottom
    logger.info("Scrolling to bottom...")
    driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
    time.sleep(1)
    
    # Find all clickable elements (buttons and links) in the page
    logger.info("\n=== Searching for pagination elements ===")
    
    # Look for any element with "next" in text, aria-label, or classes
    next_elements = driver.find_elements(By.XPATH, "//*[contains(translate(., 'NEXT', 'next'), 'next')]")
    logger.info(f"✓ Found {len(next_elements)} elements containing 'next' (case-insensitive)")
    
    for idx, elem in enumerate(next_elements[:10]):  # Limit to first 10
        try:
            tag = elem.tag_name
            text = elem.text or "(no text)"
            classes = elem.get_attribute('class') or "(no class)"
            aria_label = elem.get_attribute('aria-label') or "(no aria-label)"
            aria_disabled = elem.get_attribute('aria-disabled') or "(no aria-disabled)"
            is_displayed = elem.is_displayed()
            is_enabled = elem.is_enabled()
            role = elem.get_attribute('role') or "(no role)"
            data_qa = elem.get_attribute('data-qa') or "(no data-qa)"
            
            logger.info(f"\n  [{idx}] <{tag}> (displayed={is_displayed}, enabled={is_enabled})")
            logger.info(f"      text: {text}")
            logger.info(f"      class: {classes}")
            logger.info(f"      aria-label: {aria_label}")
            logger.info(f"      aria-disabled: {aria_disabled}")
            logger.info(f"      role: {role}")
            logger.info(f"      data-qa: {data_qa}")
            
            # Get the parent elements to understand context
            parent_html = elem.get_attribute('outerHTML')
            if len(parent_html) > 200:
                logger.info(f"      HTML (first 200 chars): {parent_html[:200]}...")
            else:
                logger.info(f"      HTML: {parent_html}")
        except Exception as e:
            logger.warning(f"  [{idx}] Error inspecting element: {e}")
    
    # Look for pagination container
    logger.info("\n=== Searching for pagination containers ===")
    pagination_containers = driver.find_elements(By.XPATH, "//*[contains(@class, 'paginat')] | //*[contains(@class, 'page-') and not(contains(@class, 'page-content'))]")
    logger.info(f"✓ Found {len(pagination_containers)} pagination containers")
    
    for idx, container in enumerate(pagination_containers[:3]):
        try:
            logger.info(f"\n  [Container {idx}]")
            html = container.get_attribute('outerHTML')
            if len(html) > 300:
                logger.info(f"    {html[:300]}...")
            else:
                logger.info(f"    {html}")
        except Exception as e:
            logger.warning(f"  [Container {idx}] Error: {e}")
    
    # Look for any buttons/links at the bottom of the page
    logger.info("\n=== All buttons and links at bottom 50% of page ===")
    all_buttons_links = driver.find_elements(By.XPATH, "//button | //a[not(contains(@class, 'bus-item'))]")
    logger.info(f"✓ Found {len(all_buttons_links)} buttons/links total")
    
    # Filter to ones that might be pagination
    pagination_candidates = []
    for elem in all_buttons_links:
        try:
            text = elem.text.lower()
            if any(keyword in text for keyword in ['next', 'page', 'previous', '>']):
                is_displayed = elem.is_displayed()
                if is_displayed:  # Only show visible ones
                    pagination_candidates.append((elem, text))
        except:
            pass
    
    logger.info(f"\n✓ Found {len(pagination_candidates)} pagination candidates")
    for idx, (elem, text) in enumerate(pagination_candidates):
        try:
            tag = elem.tag_name
            classes = elem.get_attribute('class') or "(no class)"
            aria_label = elem.get_attribute('aria-label') or "(no aria-label)"
            href = elem.get_attribute('href') or "(no href)"
            
            logger.info(f"\n  [Candidate {idx}] <{tag}>")
            logger.info(f"      text: {text}")
            logger.info(f"      class: {classes}")
            logger.info(f"      aria-label: {aria_label}")
            logger.info(f"      href: {href}")
        except Exception as e:
            logger.warning(f"  [Candidate {idx}] Error: {e}")
    
    # Save full page HTML for inspection
    full_html = driver.page_source
    with open('pagination_debug.html', 'w', encoding='utf-8') as f:
        f.write(full_html)
    logger.info("\n✓ Full page HTML saved to pagination_debug.html")
    
    # Search the HTML for "next" text patterns
    logger.info("\n=== Searching HTML for 'next' keyword ===")
    html_lower = full_html.lower()
    
    # Find positions of "next" in HTML
    import re
    next_matches = [(m.start(), m.end()) for m in re.finditer(r'next', html_lower)]
    logger.info(f"✓ Found 'next' {len(next_matches)} times in HTML")
    
    # Show context around each "next"
    for idx, (start, end) in enumerate(next_matches[:5]):
        context_start = max(0, start - 100)
        context_end = min(len(full_html), end + 100)
        context = full_html[context_start:context_end]
        logger.info(f"\n  [Match {idx}] ...{context}...")

finally:
    driver.quit()
    logger.info("\n✓ Browser closed")
