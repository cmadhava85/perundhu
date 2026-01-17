#!/usr/bin/env python3
import requests
import sys

token = "wixcode-pub.96bf25fa2687b694ef3b967a8ec797c7ac4c10c8.eyJpbnN0YW5jZUlkIjoiZTg4NmY4NWYtNDZkNS00YThlLThkY2UtYzFlNjBmYTY4M2Y2IiwiaHRtbFNpdGVJZCI6IjNlMjdmYTQ5LTRkMjYtNDBjMy05N2YxLTE3NTAzNmRhNGE5ZCIsInVpZCI6bnVsbCwicGVybWlzc2lvbnMiOm51bGwsImlzVGVtcGxhdGUiOmZhbHNlLCJzaWduRGF0ZSI6MTc2ODU3ODAxNjYxNCwiYWlkIjoiMzBiMjgzNGQtMTBhYy00YTkyLTg2MjItYzFlMjA2YTA2NmQ5IiwiYXBwRGVmSWQiOiJDbG91ZFNpdGVFeHRlbnNpb24iLCJpc0FkbWluIjpmYWxzZSwibWV0YVNpdGVJZCI6ImRhOGE3NTZmLTgwY2QtNGE0Yy05N2Y4LTQyNThkYzM0ZjU3OSIsImNhY2hlIjpudWxsLCJleHBpcmF0aW9uRGF0ZSI6bnVsbCwicHJlbWl1bUFzc2V0cyI6IkFkc0ZyZWUsU2hvd1dpeFdoaWxlTG9hZGluZyxIYXNEb21haW4iLCJ0ZW5hbnQiOm51bGwsInNpdGVPd25lcklkIjoiNWEyMTdiYTUtNzM3NC00ZWJkLTlhYzItODg5NzJhNzJiYTM4IiwiaW5zdGFuY2VUeXBlIjoicHViIiwic2l0ZU1lbWJlcklkIjpudWxsLCJwZXJtaXNzaW9uU2NvcGUiOm51bGwsImxvZ2luQWNjb3VudElkIjpudWxsLCJpc0xvZ2luQWNjb3VudE93bmVyIjpudWxsLCJib3VuZFNlc3Npb24iOiJQRDBCOElKOTBVWmRYNktMc3B0bGIxS05GZHF1QUdLUWRpbmY3MmNqSlpBIiwic2Vzc2lvbklkIjpudWxsLCJzZXNzaW9uQ3JlYXRpb25UaW1lIjpudWxsLCJzaXRlQ3JlYXRlZERhdGUiOiIyMDE4LTEyLTA3VDEyOjM0OjI2LjY0OVoiLCJhY2NvdW50Q3JlYXRlZERhdGUiOm51bGx9"

headers = {
    "authorization": token,
    "x-wix-app-instance": "ee62bd20-2f2c-4073-bdd3-3e5bb29c2a48",
    "content-type": "application/json",
    "user-agent": "Mozilla/5.0"
}

url = "https://www.tamilvandi.com/_api/wix-code-public-dispatcher-ng/siteview/_webMethods/backend/googleSheetFetch.jsw/getSheetDataPaginated.ajax?gridAppId=ee62bd20-2f2c-4073-bdd3-3e5bb29c2a48&viewMode=site"

data = {
    "filter": {
        "fieldName": "From",
        "value": "Arakkonam"
    },
    "sort": [],
    "paging": {
        "limit": 100,
        "offset": 0
    }
}

try:
    print("Testing token with API request...")
    print(f"URL: {url}")
    print(f"Token: {token[:50]}...")
    
    response = requests.post(url, json=data, headers=headers, timeout=10)
    print(f"Status Code: {response.status_code}")
    
    if response.status_code == 200:
        result = response.json()
        print("✅ Token is VALID - API returned 200")
        print(f"Response keys: {list(result.keys()) if isinstance(result, dict) else 'not a dict'}")
        # Check if we got data
        if isinstance(result, dict) and 'items' in result:
            print(f"Got {len(result['items'])} items")
    else:
        print(f"❌ Token may be INVALID - got {response.status_code}")
        print(f"Response: {response.text[:500]}")
        sys.exit(1)
        
except Exception as e:
    print(f"❌ ERROR: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
