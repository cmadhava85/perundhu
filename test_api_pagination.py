#!/usr/bin/env python3
import requests
import json

# Token from the curl command
token = "wixcode-pub.bf84097bdaa561bf7c609f31cd62210befbd9cae.eyJpbnN0YW5jZUlkIjoiZTg4NmY4NWYtNDZkNS00YThlLThkY2UtYzFlNjBmYTY4M2Y2IiwiaHRtbFNpdGVJZCI6IjNlMjdmYTQ5LTRkMjYtNDBjMy05N2YxLTE3NTAzNmRhNGE5ZCIsInVpZCI6bnVsbCwicGVybWlzc2lvbnMiOm51bGwsImlzVGVtcGxhdGUiOmZhbHNlLCJzaWduRGF0ZSI6MTc2ODU3MzI4MDA1NywiYWlkIjoiMzBiMjgzNGQtMTBhYy00YTkyLTg2MjItYzFlMjA2YTA2NmQ5IiwiYXBwRGVmSWQiOiJDbG91ZFNpdGVFeHRlbnNpb24iLCJpc0FkbWluIjpmYWxzZSwibWV0YVNpdGVJZCI6ImRhOGE3NTZmLTgwY2QtNGE0Yy05N2Y4LTQyNThkYzM0ZjU3OSIsImNhY2hlIjpudWxsLCJleHBpcmF0aW9uRGF0ZSI6bnVsbCwicHJlbWl1bUFzc2V0cyI6IkFkc0ZyZWUsU2hvd1dpeFdoaWxlTG9hZGluZyxIYXNEb21haW4iLCJ0ZW5hbnQiOm51bGwsInNpdGVPd25lcklkIjoiNWEyMTdiYTUtNzM3NC00ZWJkLTlhYzItODg5NzJhNzJiYTM4IiwiaW5zdGFuY2VUeXBlIjoicHViIiwic2l0ZU1lbWJlcklkIjpudWxsLCJwZXJtaXNzaW9uU2NvcGUiOm51bGwsImxvZ2luQWNjb3VudElkIjpudWxsLCJpc0xvZ2luQWNjb3VudE93bmVyIjpudWxsLCJib3VuZFNlc3Npb24iOiJQRDBCOElKOTBVWmRYNktMc3B0bGIxS05GZHF1QUdLUWRpbmY3MmNqSlpBIiwic2Vzc2lvbklkIjpudWxsLCJzZXNzaW9uQ3JlYXRpb25UaW1lIjpudWxsLCJzaXRlQ3JlYXRlZERhdGUiOiIyMDE4LTEyLTA3VDEyOjM0OjI2LjY0OVoiLCJhY2NvdW50Q3JlYXRlZERhdGUiOm51bGx9"

url = "https://www.tamilvandi.com/_api/wix-code-public-dispatcher-ng/siteview/_webMethods/backend/googleSheetFetch.jsw/getSheetDataPaginated.ajax?gridAppId=ee62bd20-2f2c-4073-bdd3-3e5bb29c2a48&viewMode=site"

headers = {
    'authorization': token,
    'x-wix-app-instance': token,
    'content-type': 'application/json',
    'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
}

# Test different page numbers to understand the pagination
print("Testing API pagination:\n")
for page_num in [0, 1, 2, 3]:
    payload = [page_num, 10, "Sivakasi", "Madurai"]
    print(f"Page {page_num}: {payload}")
    
    try:
        response = requests.post(url, headers=headers, json=payload, timeout=10)
        if response.status_code == 200:
            data = response.json()
            print(f"  ✓ Status: 200 OK")
            if isinstance(data, list):
                print(f"  ✓ Results: {len(data)} items")
                if data:
                    # Show first route info
                    first = data[0]
                    if isinstance(first, dict):
                        operator = first.get('operatorName', first.get('_id', 'N/A'))
                        print(f"  ✓ First route: {operator}")
            else:
                print(f"  Response: {str(data)[:100]}")
        else:
            print(f"  ✗ Status: {response.status_code}")
            print(f"  Error: {response.text[:200]}")
    except Exception as e:
        print(f"  ✗ Error: {e}")
    print()
