#!/bin/bash
# Full automated workflow: Extract token → Run parallel scraping

set -e

echo "========================================="
echo "Fast Parallel Tamil Vandi Scraper"
echo "========================================="
echo ""

# Step 1: Extract fresh token
echo "Step 1/3: Extracting fresh authentication token..."
TOKEN=$(python3 scripts/extract_token.py | grep "wixcode-pub\." | head -1)

if [ -z "$TOKEN" ]; then
    echo "❌ Failed to extract token"
    exit 1
fi

echo "✅ Token extracted successfully"
echo ""

# Step 2: Run parallel scraping
echo "Step 2/3: Starting parallel scraping with 5 workers..."
echo "Estimated time: ~20-30 minutes for all 2,256 routes"
echo ""

python3 scripts/run_parallel_scraper.py \
  --auth-token "$TOKEN" \
  --route-list tamilvandi_all_routes.txt \
  --workers 5 \
  --delay 0.3 \
  --output data/tamilvandi_parallel

echo ""
echo "Step 3/3: Cleaning up temporary files..."
rm -rf temp_chunks/

echo ""
echo "========================================="
echo "✅ SCRAPING COMPLETE!"
echo "========================================="
echo ""
echo "Results saved to:"
echo "  - data/tamilvandi_parallel.json"
echo "  - data/tamilvandi_parallel.csv"
echo ""
ls -lh data/tamilvandi_parallel.*
