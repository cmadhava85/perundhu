#!/usr/bin/env python3
"""Fetch TNSTC available city list from dropdown using Selenium."""
import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options

URL = "https://www.tnstc.in/OTRSOnline/"

def main():
    opts = Options()
    opts.add_argument('--headless')
    opts.add_argument('--no-sandbox')
    opts.add_argument('--disable-dev-shm-usage')
    opts.add_argument('--disable-gpu')
    opts.add_argument('--ignore-certificate-errors')
    opts.add_argument('--disable-blink-features=AutomationControlled')
    opts.add_argument('--user-agent=Mozilla/5.0')

    driver = webdriver.Chrome(options=opts)
    try:
        driver.set_page_load_timeout(60)
        driver.get(URL)
        time.sleep(3)
        source_input = WebDriverWait(driver, 20).until(
            EC.presence_of_element_located((By.ID, 'sourceAuto'))
        )
        source_input.click()
        time.sleep(1)
        items = driver.find_elements(By.CLASS_NAME, 'ui-menu-item')
        cities = []
        for item in items:
            text = item.text.strip()
            if text:
                cities.append(text)
        for c in cities:
            print(c)
    finally:
        driver.quit()

if __name__ == "__main__":
    main()
