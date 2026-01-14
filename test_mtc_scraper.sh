#!/bin/bash
# Test if MTC scraper works at all

source .venv/bin/activate

echo "🧪 Testing MTC Scraper..."
echo ""

# Test 1: Basic test with single route
echo "Test 1: Basic scraper test (single route, no headless)"
python scripts/mtc_bus_scraper_selenium.py --limit-routes 1 --output data/test_output.json --show-browser 2>&1 | head -30

echo ""
echo "✓ Test completed"
