#!/usr/bin/env python3
"""
Ad-hoc probe to inspect TNSTC search results structure.
"""
import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

SOURCE = "MADURAI"
DEST = "TRICHY"
DATE = "15/01/2026"

options = Options()
options.add_argument('--no-sandbox')
options.add_argument('--disable-dev-shm-usage')
options.add_argument('--disable-gpu')
# Comment next line to show browser
# options.add_argument('--headless')

driver = webdriver.Chrome(options=options)
try:
    driver.get("https://www.tnstc.in/OTRSOnline/")
    WebDriverWait(driver, 10).until(EC.presence_of_element_located((By.ID, "matchStartPlace")))
    print("Page loaded")
    try:
        close_btn = WebDriverWait(driver, 3).until(EC.element_to_be_clickable((By.ID, "popup-close")))
        close_btn.click()
        print("Popup closed")
        time.sleep(1)
    except Exception:
        print("No popup to close")

    # Use backend API to resolve places
    def fetch_place(term, is_source):
        action = "LoadFromPlaceList" if is_source else "LoadTOPlaceList"
        param = "matchStartPlace" if is_source else "matchEndPlace"
        script = """
        const done = arguments[3];
        fetch('https://www.tnstc.in/OTRSOnline/jqreq.do?', {
          method: 'POST',
          headers: {'Content-Type': 'application/x-www-form-urlencoded'},
          body: `hiddenAction=${arguments[0]}&${arguments[1]}=${encodeURIComponent(arguments[2])}`
        }).then(r => r.text()).then(txt => done(txt)).catch(err => done(`ERROR:${err}`));
        """
        response = driver.execute_async_script(script, action, param, term)
        if isinstance(response, str) and response.startswith("ERROR"):
            return None
        for entry in str(response).split('^'):
            parts = entry.split(':')
            if len(parts) >= 3:
                name, pid, code = parts[2].strip(), parts[0].strip(), parts[1].strip()
                if term.upper() in name.upper():
                    return name, pid, code
        return None

    source_info = fetch_place(SOURCE, True)
    dest_info = fetch_place(DEST, False)
    print(f"Source: {source_info}")
    print(f"Dest: {dest_info}")

    if source_info and dest_info:
        js = """
        const form = document.forms[0];
        // Set visible input fields
        document.getElementById('matchStartPlace').value = arguments[0];
        document.getElementById('matchEndPlace').value = arguments[3];
        // Set form hidden fields
        form.matchStartPlace.value = arguments[0];
        form.selectStartPlace.value = arguments[2];
        form.hiddenStartPlaceID.value = arguments[1];
        form.txtStartPlaceCode.value = arguments[2];
        form.hiddenStartPlaceName.value = arguments[0];
        window.fromPlaceID = arguments[1];
        window.fromPlaceCode = arguments[2];
        form.matchEndPlace.value = arguments[3];
        form.selectEndPlace.value = arguments[5];
        form.hiddenEndPlaceID.value = arguments[4];
        form.txtEndPlaceCode.value = arguments[5];
        form.hiddenEndPlaceName.value = arguments[3];
        window.toPlaceID = arguments[4];
        window.toPlaceCode = arguments[5];
        const dateField = document.getElementById('txtdeptDateOtrip');
        dateField.removeAttribute('readonly');
        dateField.value = arguments[6];
        form.txtJourneyDate.value = arguments[6];
        form.hiddenOnwardJourneyDate.value = arguments[6];
        """
        driver.execute_script(js, *source_info, *dest_info, DATE)
        driver.find_element(By.ID, 'searchButton').click()
        print("Search clicked")

        time.sleep(8)
        print("URL after search:", driver.current_url)

        # Try to find results
        try:
            result_div = driver.find_element(By.ID, 'SearchResult')
            html = result_div.get_attribute('innerHTML')
            with open('search_result.html', 'w') as f:
                f.write(html)
            print("Saved SearchResult innerHTML to search_result.html")
            print(f"SearchResult HTML length: {len(html)}")
            print("First 1000 chars:")
            print(html[:1000])
        except Exception as e:
            print(f"Could not find SearchResult div: {e}")
            # Save full page source for inspection
            with open('results_page_source.html', 'w') as f:
                f.write(driver.page_source)
            print("Saved full page source to results_page_source.html")
            # Check for error messages
            page_text = driver.find_element(By.TAG_NAME, 'body').text
            print("Page text (first 800 chars):")
            print(page_text[:800])

        # Screenshot
        driver.save_screenshot('search_results.png')
        print("Saved screenshot to search_results.png")

finally:
    print("Waiting 10s before closing (inspect browser)...")
    time.sleep(10)
    driver.quit()
