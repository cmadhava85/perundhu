#!/bin/bash
# Test the fast API scraper with a small sample

TOKEN="wixcode-pub.bf84097bdaa561bf7c609f31cd62210befbd9cae.eyJpbnN0YW5jZUlkIjoiZTg4NmY4NWYtNDZkNS00YThlLThkY2UtYzFlNjBmYTY4M2Y2IiwiaHRtbFNpdGVJZCI6IjNlMjdmYTQ5LTRkMjYtNDBjMy05N2YxLTE3NTAzNmRhNGE5ZCIsInVpZCI6bnVsbCwicGVybWlzc2lvbnMiOm51bGwsImlzVGVtcGxhdGUiOmZhbHNlLCJzaWduRGF0ZSI6MTc2ODU3MzI4MDA1NywiYWlkIjoiMzBiMjgzNGQtMTBhYy00YTkyLTg2MjItYzFlMjA2YTA2NmQ5IiwiYXBwRGVmSWQiOiJDbG91ZFNpdGVFeHRlbnNpb24iLCJpc0FkbWluIjpmYWxzZSwibWV0YVNpdGVJZCI6ImRhOGE3NTZmLTgwY2QtNGE0Yy05N2Y4LTQyNThkYzM0ZjU3OSIsImNhY2hlIjpudWxsLCJleHBpcmVzSW4iOm51bGwsIm93bmVySWQiOm51bGx9"

echo "Testing Fast API Scraper (no browser, direct API calls)"
echo "========================================================"
echo ""

# Test single route
echo "Test 1: Single route (Sivakasi → Madurai)"
time python3 scripts/tamilvandi_api_scraper.py \
  --auth-token "$TOKEN" \
  --from "Sivakasi" \
  --to "Madurai" \
  --output data/test_api_fast \
  --delay 0.3

echo ""
echo "Results saved to:"
ls -lh data/test_api_fast.json data/test_api_fast.csv
echo ""

# Show sample
echo "Sample data:"
head -20 data/test_api_fast.json
