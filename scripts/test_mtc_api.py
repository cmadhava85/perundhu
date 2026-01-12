#!/usr/bin/env python3
import requests
import urllib3
from bs4 import BeautifulSoup

urllib3.disable_warnings()

s = requests.Session()
s.verify = False

# Get main page
r1 = s.get('https://mtcbus.tn.gov.in/Home/bustimingsearch')
print('Cookies after main page:', s.cookies.get_dict())

# Parse CSRF from HTML
soup = BeautifulSoup(r1.content, 'html.parser')
csrf_input = soup.find('input', {'name': 'csrf_test_name'})
csrf_value = csrf_input.get('value') if csrf_input else None
print('CSRF from HTML:', csrf_value)

# Try with CSRF in cookies AND data
if csrf_value:
    s.cookies.set('csrf_test_name', csrf_value)

headers = {
    'Referer': 'https://mtcbus.tn.gov.in/Home/bustimingsearch',
    'X-Requested-With': 'XMLHttpRequest',
    'User-Agent': 'Mozilla/5.0'
}

data = {'csrf_test_name': csrf_value} if csrf_value else {}

# Test route 102 instead of 101
r2 = s.post('https://mtcbus.tn.gov.in/Home/getoriginbyroute/102', headers=headers, data=data)
print('\nOrigins API Status (route 102):', r2.status_code)
if r2.status_code == 200:
    print('Response length:', len(r2.text))
    print('First 500 chars:', r2.text[:500])
    
    soup2 = BeautifulSoup(r2.content, 'html.parser')
    options = soup2.find_all('option')
    print(f'\nFound {len(options)} options')
    for opt in options[:5]:
        print(f'  Value: {opt.get("value")}, Text: {opt.text.strip()}')
else:
    print('Error:', r2.text[:200])
