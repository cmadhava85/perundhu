#!/usr/bin/env python3
import requests
from urllib.parse import quote
import re
import json

query = "bus time table"
encoded_query = quote(query)
bing_url = f"https://www.bing.com/images/search?q={encoded_query}&qs=n&form=QBILPG"

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
}

print(f"Fetching: {bing_url}")
response = requests.get(bing_url, headers=headers, timeout=10)
print(f"Status: {response.status_code}")
print(f"Content length: {len(response.text)}")

# Look for different patterns
patterns = {
    'murl': r'"murl":"([^"]+)"',
    'imgurl': r'"imgurl":"([^"]+)"',
    'purl': r'"purl":"([^"]+)"',
    'mediaurl': r'mediaurl["\']:\s*["\']([^"\']+)',
    'image_url': r'"image":\{"url":"([^"]+)"',
    'url_field': r'"url":"(https?://[^"]+)"',
}

for name, pattern in patterns.items():
    matches = re.findall(pattern, response.text)
    if matches:
        print(f"\n✅ {name}: found {len(matches)} matches")
        for i, match in enumerate(matches[:3]):
            print(f"  {i+1}. {match[:100]}...")
    else:
        print(f"\n❌ {name}: 0 matches")

# Also check for pinImageContent
if '"pinImageContent"' in response.text:
    print("\n✅ Found pinImageContent references")
    pin_matches = re.findall(r'"pinImageContent":"([^"]+)"', response.text)
    print(f"   {len(pin_matches)} items")
    for i, match in enumerate(pin_matches[:3]):
        print(f"   {i+1}. {match[:100]}...")
