#!/bin/bash
# Test API directly
TOKEN="wixcode-pub.bf84097bdaa561bf7c609f31cd62210befbd9cae.eyJpbnN0YW5jZUlkIjoiZTg4NmY4NWYtNDZkNS00YThlLThkY2UtYzFlNjBmYTY4M2Y2IiwiaHRtbFNpdGVJZCI6IjNlMjdmYTQ5LTRkMjYtNDBjMy05N2YxLTE3NTAzNmRhNGE5ZCIsInVpZCI6bnVsbCwicGVybWlzc2lvbnMiOm51bGwsImlzVGVtcGxhdGUiOmZhbHNlLCJzaWduRGF0ZSI6MTc2ODU3MzI4MDA1NywiYWlkIjoiMzBiMjgzNGQtMTBhYy00YTkyLTg2MjItYzFlMjA2YTA2NmQ5IiwiYXBwRGVmSWQiOiJDbG91ZFNpdGVFeHRlbnNpb24iLCJpc0FkbWluIjpmYWxzZSwibWV0YVNpdGVJZCI6ImRhOGE3NTZmLTgwY2QtNGE0Yy05N2Y4LTQyNThkYzM0ZjU3OSIsImNhY2hlIjpudWxsLCJleHBpcmF0aW9uRGF0ZSI6bnVsbCwicHJlbWl1bUFzc2V0cyI6IkFkc0ZyZWUsU2hvd1dpeFdoaWxlTG9hZGluZyxIYXNEb21haW4iLCJ0ZW5hbnQiOm51bGwsInNpdGVPd25lcklkIjoiNWEyMTdiYTUtNzM3NC00ZWJkLTlhYzItODg5NzJhNzJiYTM4IiwiaW5zdGFuY2VUeXBlIjoicHViIiwic2l0ZU1lbWJlcklkIjpudWxsLCJwZXJtaXNzaW9uU2NvcGUiOm51bGwsImxvZ2luQWNjb3VudElkIjpudWxsLCJpc0xvZ2luQWNjb3VudE93bmVyIjpudWxsLCJib3VuZFNlc3Npb24iOiJQRDBCOElKOTBVWmRYNktMc3B0bGIxS05GZHF1QUdLUWRpbmY3MmNqSlpBIiwic2Vzc2lvbklkIjpudWxsLCJzZXNzaW9uQ3JlYXRpb25UaW1lIjpudWxsLCJzaXRlQ3JlYXRlZERhdGUiOiIyMDE4LTEyLTA3VDEyOjM0OjI2LjY0OVoiLCJhY2NvdW50Q3JlYXRlZERhdGUiOm51bGx9"

echo "Testing page 1 (index 1):"
curl -s 'https://www.tamilvandi.com/_api/wix-code-public-dispatcher-ng/siteview/_webMethods/backend/googleSheetFetch.jsw/getSheetDataPaginated.ajax?gridAppId=ee62bd20-2f2c-4073-bdd3-3e5bb29c2a48&viewMode=site' \
  -H "authorization: $TOKEN" \
  -H 'content-type: application/json' \
  --data-raw '[1,10,"Sivakasi","Madurai"]' | python3 -c "import sys, json; d=json.load(sys.stdin); print(f'Results: {len(d) if isinstance(d, list) else \"error\"}'); print(d if not isinstance(d, list) else d[0] if d else 'empty')"

echo -e "\nTesting page 0 (index 0 - first page):"
curl -s 'https://www.tamilvandi.com/_api/wix-code-public-dispatcher-ng/siteview/_webMethods/backend/googleSheetFetch.jsw/getSheetDataPaginated.ajax?gridAppId=ee62bd20-2f2c-4073-bdd3-3e5bb29c2a48&viewMode=site' \
  -H "authorization: $TOKEN" \
  -H 'content-type: application/json' \
  --data-raw '[0,10,"Sivakasi","Madurai"]' | python3 -c "import sys, json; d=json.load(sys.stdin); print(f'Results: {len(d) if isinstance(d, list) else \"error\"}'); print(d[0] if isinstance(d, list) and d else d)"
