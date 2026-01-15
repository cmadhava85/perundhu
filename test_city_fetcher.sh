#!/bin/bash
# Quick test for Tamil Vandi City Fetcher

echo "🏙️  Tamil Vandi City Fetcher - Quick Test"
echo "========================================="
echo ""

# Activate virtual environment
source .venv/bin/activate

echo "📡 Fetching cities from Tamil Vandi website..."
echo ""

# Run the city fetcher
python scripts/tamilvandi_get_cities.py \
  --output data/tamilvandi_cities.json

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ City list fetched successfully!"
    echo ""
    
    # Show statistics
    CITY_COUNT=$(python3 -c "import json; print(json.load(open('data/tamilvandi_cities.json'))['count'])")
    echo "📊 Statistics:"
    echo "   Total cities: $CITY_COUNT"
    echo ""
    
    # Show first 10 cities
    echo "📍 First 10 cities:"
    python3 -c "import json; cities = json.load(open('data/tamilvandi_cities.json'))['cities']; print('\n'.join(f'   {i+1:2d}. {c}' for i, c in enumerate(cities[:10])))"
    
    echo ""
    echo "💡 Full list available in:"
    echo "   - data/tamilvandi_cities.json (JSON format)"
    echo "   - data/tamilvandi_cities.txt (text format)"
    echo ""
    echo "🎯 Use these cities when running the scraper to avoid errors!"
else
    echo ""
    echo "❌ Failed to fetch cities"
    exit 1
fi
