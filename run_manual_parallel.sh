#!/bin/bash
# Manual Parallel Scraper - use a fresh token
# 
# To get a fresh token:
# 1. Open https://www.tamilvandi.com/timings in Chrome
# 2. Open DevTools (F12) → Network tab
# 3. Search for any route (e.g., Chennai to Madurai)
# 4. Look for "getSheetDataPaginated.ajax" request
# 5. Copy the "authorization" header value (starts with wixcode-pub.)
# 6. Paste it below

# === PASTE YOUR FRESH TOKEN HERE ===
TOKEN="YOUR_TOKEN_HERE"

# Check if token is set
if [ "$TOKEN" = "YOUR_TOKEN_HERE" ]; then
    echo "❌ Please update the TOKEN in this script first!"
    echo ""
    echo "To get a fresh token:"
    echo "1. Open https://www.tamilvandi.com/timings in Chrome"
    echo "2. Open DevTools (F12) → Network tab"
    echo "3. Search for any route"
    echo "4. Find 'getSheetDataPaginated.ajax' request"
    echo "5. Copy the 'authorization' header value"
    echo "6. Update TOKEN in this script"
    echo ""
    exit 1
fi

echo "========================================="
echo "Fast Parallel Tamil Vandi Scraper"
echo "========================================="
echo ""
echo "Configuration:"
echo "  - Routes: $(wc -l < tamilvandi_all_routes.txt | tr -d ' ') pairs"
echo "  - Workers: 5 parallel processes"
echo "  - Delay: 0.3s per request"
echo "  - Estimated time: 20-30 minutes"
echo ""
read -p "Start scraping? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cancelled."
    exit 0
fi

python3 scripts/run_parallel_scraper.py \
  --auth-token "$TOKEN" \
  --route-list tamilvandi_all_routes.txt \
  --workers 5 \
  --delay 0.3 \
  --output data/tamilvandi_parallel

echo ""
echo "Cleaning up temporary files..."
rm -rf temp_chunks/

echo ""
echo "========================================="
echo "✅ SCRAPING COMPLETE!"
echo "========================================="
echo ""
echo "Results:"
ls -lh data/tamilvandi_parallel.* 2>/dev/null || echo "Check logs above for errors"
