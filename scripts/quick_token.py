#!/usr/bin/env python3
"""
Quick Token Getter - Uses cookies to get fresh token
Run this after visiting tamilvandi.com in your browser
"""

import requests
import sys

# Your cookies from the browser (update these from your curl command)
# Updated: 2026-01-16
COOKIES = {
    'svSession': '10b8f44811f686d3a92f2bd63bd5d418187ebd92eb9b2c58ba7b3ada6a38998832a400adc2f48187047fcfac55206c461e60994d53964e647acf431e4f798bcd5ba0bc0805e9870a41f7ae541ba32d1c15dd413cc56066a95f3ff630289c8ac6ad167304063b7667d18fabf004b693651462395216396c89478b0b768361a3a9c96e584fcbbb914dae506e1f610078ee',
    '_ga': 'GA1.1.2004242938.1768244749',
    'server-session-bind': '1097f453-738b-4511-a0cb-41143878f1da',
    'XSRF-TOKEN': '1768573248|0JKHGrTErCtt',
    'hs': '1365782517',
    'bSession': 'f1cce3e5-c27c-4590-a2ab-6fce394b7069|1',
    'ssr-caching': 'ssr-caching=cache#desc=hit#varnish=hit_hit_etag#dc#desc=fastly_g',
    '_ga_5N6S2HVJSZ': 'GS2.1.s1768575087$o7$g1$t1768577567$j52$l0$h0',
}

# Note: Cookies expire! Update them from your browser if this fails.

def get_token_from_api():
    """Try to get token from access-tokens API"""
    try:
        response = requests.get(
            'https://www.tamilvandi.com/_api/v1/access-tokens',
            cookies=COOKIES,
            headers={
                'accept': '*/*',
                'accept-language': 'en-US,en;q=0.9',
                'client-binding': '1097f453-738b-4511-a0cb-41143878f1da',
                'priority': 'u=1, i',
                'referer': 'https://www.tamilvandi.com/',
                'sec-ch-ua': '"Google Chrome";v="143", "Chromium";v="143", "Not A(Brand";v="24"',
                'sec-ch-ua-mobile': '?0',
                'sec-ch-ua-platform': '"macOS"',
                'sec-fetch-dest': 'empty',
                'sec-fetch-mode': 'cors',
                'sec-fetch-site': 'same-origin',
                'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36'
            },
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            # Look for wixcode-pub token in response
            for key, value in data.items():
                if isinstance(value, str) and value.startswith('wixcode-pub.'):
                    return value
            print("Response received but no token found:", data)
        else:
            print(f"API returned status {response.status_code}")
            
    except Exception as e:
        print(f"API request failed: {e}")
    
    return None


if __name__ == '__main__':
    print("Attempting to get fresh token...")
    token = get_token_from_api()
    
    if token:
        print(f"\n{'='*80}")
        print("✅ TOKEN RETRIEVED SUCCESSFULLY!")
        print(f"{'='*80}\n")
        print(token)
        print(f"\n{'='*80}")
        
        # Save to env file
        with open('token.env', 'w') as f:
            f.write(f'TOKEN="{token}"\n')
        print("Saved to token.env")
        
    else:
        print("\n❌ Failed to get token via API")
        print("\nPlease update the COOKIES in this script from your browser:")
        print("1. Open tamilvandi.com in Chrome")
        print("2. Open DevTools → Network tab")
        print("3. Find any request and copy cookies")
        print("4. Update COOKIES dict in this script")
        sys.exit(1)
