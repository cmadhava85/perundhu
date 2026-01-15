#!/bin/bash
# Quick Start Script for Tamil Vandi Scraper

echo "🚌 Tamil Vandi Bus Scraper - Quick Start"
echo "========================================"
echo ""

# Activate virtual environment
source .venv/bin/activate

# Test single route
echo "Testing with Sivakasi -> Madurai route..."
python scripts/tamilvandi_scraper_selenium.py \
  --from "Sivakasi" \
  --to "Madurai" \
  --output data/tamilvandi_test \
  --show-browser

echo ""
echo "✅ Scraping complete!"
echo "📁 Check output files:"
echo "   - data/tamilvandi_test.json"
echo "   - data/tamilvandi_test.csv"
echo ""
echo "To view JSON results:"
echo "   cat data/tamilvandi_test.json | python -m json.tool | head -50"
echo ""
echo "To view CSV results:"
echo "   head -20 data/tamilvandi_test.csv"
