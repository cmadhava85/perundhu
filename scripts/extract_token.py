#!/usr/bin/env python3
"""
Tamil Vandi Token Extractor
Extracts a fresh auth token from the website using Selenium.

Usage:
    python extract_token.py
"""

import time
import logging
from selenium import webdriver
from selenium.webdriver.chrome.options import Options

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def extract_token() -> str:
    """Extract fresh auth token from Tamil Vandi website"""
    
    chrome_options = Options()
    chrome_options.add_argument('--headless=new')
    chrome_options.add_argument('--no-sandbox')
    chrome_options.add_argument('--disable-dev-shm-usage')
    chrome_options.set_capability('goog:loggingPrefs', {'performance': 'ALL'})
    chrome_options.add_experimental_option('perfLoggingPrefs', {
        'enableNetwork': True,
        'enablePage': False
    })
    
    driver = None
    try:
        driver = webdriver.Chrome(options=chrome_options)
        
        logger.info("Loading Tamil Vandi website...")
        driver.get('https://www.tamilvandi.com/timings')
        time.sleep(5)  # Wait for page to load and make API calls
        
        # Extract token from network logs
        logs = driver.get_log('performance')
        
        for log in logs:
            import json
            message = json.loads(log['message'])
            
            if 'message' not in message:
                continue
            
            msg = message['message']
            
            # Look for request headers
            if msg.get('method') == 'Network.requestWillBeSent':
                request = msg.get('params', {}).get('request', {})
                headers = request.get('headers', {})
                
                # Check if this request has the wixcode-pub token
                auth = headers.get('authorization', '')
                if auth.startswith('wixcode-pub.'):
                    logger.info(f"✅ Found token: {auth[:50]}...")
                    return auth
        
        logger.error("❌ Could not find token in network logs")
        return None
        
    finally:
        if driver:
            driver.quit()


if __name__ == '__main__':
    token = extract_token()
    if token:
        print(f"\n{'='*80}")
        print("TOKEN EXTRACTED SUCCESSFULLY!")
        print(f"{'='*80}")
        print(f"\n{token}\n")
        print(f"{'='*80}")
        print("\nSave this to a file:")
        print("  echo 'TOKEN=\"{token}\"' > token.env")
        print("\nOr use directly:")
        print(f"  export TOKEN='{token}'")
        print(f"{'='*80}")
    else:
        print("\n❌ Failed to extract token")
        exit(1)
