#!/bin/bash
# Batch Scraper for Multiple Tamil Vandi Routes

echo "🚌 Tamil Vandi Batch Scraper"
echo "============================"
echo ""

# Activate virtual environment
source .venv/bin/activate

# Check if route list exists
ROUTE_FILE="${1:-tamilvandi_routes_sample.txt}"

if [ ! -f "$ROUTE_FILE" ]; then
    echo "❌ Route file not found: $ROUTE_FILE"
    echo ""
    echo "Usage: $0 [route_file]"
    echo ""
    echo "Create a route file with format:"
    echo "  FROM,TO"
    echo "  One route per line"
    echo ""
    echo "Example:"
    echo "  Sivakasi,Madurai"
    echo "  Madurai,Chennai"
    exit 1
fi

# Count routes
ROUTE_COUNT=$(grep -v '^#' "$ROUTE_FILE" | grep -v '^$' | wc -l | tr -d ' ')

echo "📋 Route file: $ROUTE_FILE"
echo "📊 Routes to scrape: $ROUTE_COUNT"
echo ""

# Ask for confirmation
read -p "Continue? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cancelled."
    exit 0
fi

# Run scraper
OUTPUT_FILE="data/tamilvandi_batch_$(date +%Y%m%d_%H%M%S)"

echo ""
echo "🚀 Starting batch scrape..."
echo "📁 Output: $OUTPUT_FILE"
echo ""

python scripts/tamilvandi_scraper_selenium.py \
  --route-list "$ROUTE_FILE" \
  --output "$OUTPUT_FILE" \
  --delay 2.0

echo ""
echo "✅ Batch scraping complete!"
echo "📁 Check output files:"
echo "   - ${OUTPUT_FILE}.json"
echo "   - ${OUTPUT_FILE}.csv"
echo ""
echo "To view results:"
echo "   cat ${OUTPUT_FILE}.json | python -m json.tool | less"
