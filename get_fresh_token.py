#!/usr/bin/env python3
import requests
import json

cookies = {
    'svSession': '10b8f44811f686d3a92f2bd63bd5d418187ebd92eb9b2c58ba7b3ada6a38998832a400adc2f48187047fcfac55206c461e60994d53964e647acf431e4f798bcd5ba0bc0805e9870a41f7ae541ba32d1c15dd413cc56066a95f3ff630289c8ac6ad167304063b7667d18fabf004b693651462395216396c89478b0b768361a3a9c96e584fcbbb914dae506e1f610078ee',
    '_ga': 'GA1.1.2004242938.1768244749',
    'server-session-bind': '1097f453-738b-4511-a0cb-41143878f1da',
    'XSRF-TOKEN': '1768573248|0JKHGrTErCtt',
    'hs': '1365782517',
    'bSession': 'f1cce3e5-c27c-4590-a2ab-6fce394b7069|1',
}

headers = {
    'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    'accept': '*/*',
    'referer': 'https://www.tamilvandi.com/timings'
}

try:
    print("Requesting token from API...")
    response = requests.get(
        'https://www.tamilvandi.com/_api/v1/access-tokens',
        cookies=cookies,
        headers=headers,
        timeout=10
    )
    print(f"Status Code: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print("\nSearching for wixcode-pub tokens...")
        
        def find_tokens(obj, path=""):
            if isinstance(obj, dict):
                for k, v in obj.items():
                    if isinstance(v, str) and 'wixcode-pub' in v:
                        print(f"\n✅ Found token at {path}.{k}:")
                        print(v)
                    elif isinstance(v, (dict, list)):
                        find_tokens(v, f"{path}.{k}" if path else k)
            elif isinstance(obj, list):
                for i, item in enumerate(obj):
                    if isinstance(item, str) and 'wixcode-pub' in item:
                        print(f"\n✅ Found token at {path}[{i}]:")
                        print(item)
                    elif isinstance(item, (dict, list)):
                        find_tokens(item, f"{path}[{i}]")
        
        find_tokens(data)
    else:
        print(f"Error: {response.status_code}")
        print(response.text[:500])
        
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
