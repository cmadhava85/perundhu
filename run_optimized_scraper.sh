#!/bin/bash
# Run the existing Selenium scraper with optimized settings for speed

echo "Running optimized scraper with reduced delays..."
echo "Estimated time for 2,256 routes: ~2-3 hours"
echo ""

python3 scripts/tamilvandi_scraper_selenium.py \
  --route-list tamilvandi_all_routes.txt \
  --output data/tamilvandi_full \
  --delay 0.5 \
  --limit-routes 10

# To run all routes, remove the --limit-routes parameter
