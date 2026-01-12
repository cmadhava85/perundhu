#!/usr/bin/env python3
import requests
import urllib3
from bs4 import BeautifulSoup

urllib3.disable_warnings()

s = requests.Session()
s.verify = False

# Get main page
r1 = s.get('https://mtcbus.tn.gov.in/Home/bustimingsearch')
soup = BeautifulSoup(r1.content, 'html.parser')

# Get CSRF
csrf_input = soup.find('input', {'name': 'csrf_test_name'})
csrf_value = csrf_input.get('value') if csrf_input else None
print(f'CSRF: {csrf_value}')

if csrf_value:
    s.cookies.set('csrf_test_name', csrf_value)

# Try using ajaxbustimingsearch with form data
headers = {
    'Referer': 'https://mtcbus.tn.gov.in/Home/bustimingsearch',
    'X-Requested-With': 'XMLHttpRequest',
}

# Test with actual values from the URL: selroute=101&selfrom=1&selto=1
form_data = {
    'selroute': '101',
    'selfrom': '1',
    'selto': '1',
    'csrf_test_name': csrf_value
}

r2 = s.get('https://mtcbus.tn.gov.in/Home/ajaxbustimingsearch', params=form_data, headers=headers)
print(f'\najaxbustimingsearch Status: {r2.status_code}')
print(f'Response length: {len(r2.text)}')
print(f'First 1000 chars:\n{r2.text[:1000]}')

# Also try POST
r3 = s.post('https://mtcbus.tn.gov.in/Home/ajaxbustimingsearch', data=form_data, headers=headers)
print(f'\nPOST ajaxbustimingsearch Status: {r3.status_code}')
print(f'Response length: {len(r3.text)}')
print(f'First 1000 chars:\n{r3.text[:1000]}')
