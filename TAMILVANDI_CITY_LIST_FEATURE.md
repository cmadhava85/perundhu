# Tamil Vandi Scraper - City List Feature

## What's New

Added a powerful city list fetcher that extracts all available cities from the Tamil Vandi website. This ensures you only use valid city names when scraping.

## Why This Is Important

### Before (Without City List)
```bash
# You might try:
python scripts/tamilvandi_scraper_selenium.py --from "Chenai" --to "Maduri"
# Result: ❌ No results found (typos in city names)
```

### After (With City List)
```bash
# First, get valid cities:
python scripts/tamilvandi_get_cities.py

# Now you know the exact names:
python scripts/tamilvandi_scraper_selenium.py --from "Chennai" --to "Madurai"
# Result: ✅ Successfully scraped 10+ bus routes
```

## New Files Created

### 1. City Fetcher Script
**File:** `scripts/tamilvandi_get_cities.py`

Fetches all available cities from the website using multiple strategies:
- Autocomplete suggestions
- Dropdown menus
- Page links
- Data attributes
- Fallback to curated list

### 2. Documentation
**File:** `TAMILVANDI_CITY_FETCHER_GUIDE.md`

Complete guide including:
- How to fetch cities
- How to use the city list
- Integration examples
- Python code samples
- Validation workflows

### 3. Test Script
**File:** `test_city_fetcher.sh`

Quick test script to fetch and display cities

## Quick Start

### Fetch All Cities

```bash
source .venv/bin/activate
python scripts/tamilvandi_get_cities.py
```

**Output:**
```
=== Tamil Vandi City List Fetcher ===
Setting up Chrome WebDriver...
WebDriver ready
Fetching cities from Tamil Vandi...
Loading https://www.tamilvandi.com/timings
Strategy 1: Checking autocomplete suggestions...
✓ Strategy 1 successful: 48 cities from autocomplete
WebDriver closed

✅ Successfully fetched 48 cities
📁 Saved to: data/tamilvandi_cities.json

📍 Cities found:
    1. Arakkonam
    2. Chennai
    3. Coimbatore
    ...
```

### View Cities

```bash
# JSON format
cat data/tamilvandi_cities.json | python -m json.tool

# Text format (one per line)
cat data/tamilvandi_cities.txt
```

### Use with Scraper

```bash
# Get cities first
python scripts/tamilvandi_get_cities.py

# Create route file with valid cities
cat > routes.txt << EOF
Chennai,Madurai
Coimbatore,Salem
Trichy,Thanjavur
EOF

# Scrape with confidence!
python scripts/tamilvandi_scraper_selenium.py --route-list routes.txt
```

## Output Format

### JSON File (data/tamilvandi_cities.json)

```json
{
  "cities": [
    "Arakkonam",
    "Ariyalur",
    "Attur",
    "Chennai",
    "Chengalpattu",
    "Coimbatore",
    "Cuddalore",
    "Dharmapuri",
    "Dindigul",
    "Erode",
    ...
  ],
  "count": 48,
  "fetched_at": "2026-01-15 14:30:00",
  "source": "https://www.tamilvandi.com/timings"
}
```

### Text File (data/tamilvandi_cities.txt)

```
Arakkonam
Ariyalur
Attur
Chennai
Chengalpattu
...
```

## How It Works

The fetcher tries multiple strategies in order:

### Strategy 1: Autocomplete (Primary)
1. Opens search page
2. Types letters (a, b, c, etc.) in search input
3. Captures autocomplete suggestions
4. Collects unique city names

### Strategy 2: Dropdowns (Secondary)
1. Finds `<select>` elements
2. Extracts all `<option>` values
3. Filters out placeholders

### Strategy 3: URL Parsing (Tertiary)
1. Finds links with `from=` or `to=` parameters
2. Extracts city names from URLs
3. Decodes URL encoding

### Strategy 4: Data Attributes (Quaternary)
1. Searches for `data-city`, `data-location`
2. Extracts attribute values

### Fallback: Default List
If all strategies fail, returns curated list of 50+ major Tamil Nadu cities.

## Usage Examples

### 1. Validate User Input

```python
import json

# Load cities
with open('data/tamilvandi_cities.json', 'r') as f:
    data = json.load(f)
    valid_cities = {city.lower(): city for city in data['cities']}

# Check user input
user_city = input("Enter city: ")
correct_name = valid_cities.get(user_city.lower())

if correct_name:
    print(f"✓ Using: {correct_name}")
else:
    print(f"✗ Invalid city. Try: {', '.join(list(valid_cities.values())[:5])}")
```

### 2. Generate All Route Pairs

```python
import json
from itertools import combinations

with open('data/tamilvandi_cities.json', 'r') as f:
    cities = json.load(f)['cities']

# Generate all possible routes
routes = list(combinations(cities, 2))
print(f"Total possible routes: {len(routes)}")

# Save to file
with open('all_routes.txt', 'w') as f:
    for from_city, to_city in routes:
        f.write(f"{from_city},{to_city}\n")
```

### 3. Autocomplete Search

```python
import json

with open('data/tamilvandi_cities.json', 'r') as f:
    cities = json.load(f)['cities']

# User types "che"
search = "che"
matches = [c for c in cities if c.lower().startswith(search.lower())]

print(f"Cities matching '{search}':")
for match in matches:
    print(f"  • {match}")
```

### 4. Build Route Validator

```python
import json
import sys

def validate_route(from_city, to_city):
    with open('data/tamilvandi_cities.json') as f:
        cities = {c.lower() for c in json.load(f)['cities']}
    
    if from_city.lower() not in cities:
        print(f"❌ Invalid origin: {from_city}")
        return False
    
    if to_city.lower() not in cities:
        print(f"❌ Invalid destination: {to_city}")
        return False
    
    return True

# Use in your scraping workflow
if validate_route("Chennai", "Madurai"):
    print("✓ Valid route, proceeding with scrape...")
```

## Command Line Options

```bash
# Default output
python scripts/tamilvandi_get_cities.py

# Custom output location
python scripts/tamilvandi_get_cities.py --output my_cities.json

# Show browser (for debugging)
python scripts/tamilvandi_get_cities.py --show-browser

# Verbose logging
python scripts/tamilvandi_get_cities.py --verbose
```

## Integration Workflow

**Complete workflow from cities to data:**

```bash
# Step 1: Get available cities
python scripts/tamilvandi_get_cities.py

# Step 2: Create route list with valid cities
python3 << 'EOF'
import json

with open('data/tamilvandi_cities.json') as f:
    cities = json.load(f)['cities'][:5]  # First 5 cities

with open('my_routes.txt', 'w') as f:
    for i, from_city in enumerate(cities):
        for to_city in cities[i+1:]:
            f.write(f"{from_city},{to_city}\n")

print(f"Created {sum(1 for _ in open('my_routes.txt'))} routes")
EOF

# Step 3: Scrape with validated routes
python scripts/tamilvandi_scraper_selenium.py \
  --route-list my_routes.txt \
  --output data/validated_results
```

## Enhanced Main Scraper

The main scraper (`tamilvandi_scraper_selenium.py`) now includes a `fetch_all_cities()` method that you can call programmatically:

```python
from scripts.tamilvandi_scraper_selenium import TamilVandiScraperSelenium

scraper = TamilVandiScraperSelenium(headless=False)
scraper._setup_driver()

# Fetch cities
cities = scraper.fetch_all_cities()
print(f"Found {len(cities)} cities: {cities}")

scraper._close_driver()
```

## Benefits

✅ **No More Guessing**: Know exactly which cities are searchable  
✅ **Error Prevention**: Validate before scraping  
✅ **Time Saving**: Avoid failed scrapes from typos  
✅ **Automation Ready**: Generate routes programmatically  
✅ **User-Friendly**: Provide autocomplete in your apps  
✅ **Data Quality**: Ensure consistent city names  

## When to Refresh City List

Refresh the city list when:
- Website adds new routes/cities
- You notice missing cities
- Periodically (e.g., monthly)
- After website structure changes

```bash
# Refresh periodically
python scripts/tamilvandi_get_cities.py --output data/cities_$(date +%Y%m%d).json
```

## Troubleshooting

### Returns Default List Only

If scraper can't find cities on website:
- ✓ Still usable - default list covers major cities
- Try `--show-browser` to debug
- Use `--verbose` for detailed logs
- Website structure may have changed

### Missing Some Cities

- Normal - website may not list all cities upfront
- You can manually add to JSON file
- Try different search letters in autocomplete

### Wrong City Names

- Verify spelling on tamilvandi.com
- Some cities have variants (e.g., "Trichy" vs "Tiruchirappalli")
- The scraper handles case-insensitive matching

## Example: Complete Scraping Pipeline

```bash
#!/bin/bash
# complete_pipeline.sh - Full scraping workflow with validation

set -e  # Exit on error

echo "🚀 Tamil Vandi Complete Scraping Pipeline"
echo ""

# Step 1: Fetch cities
echo "📡 Step 1: Fetching available cities..."
python scripts/tamilvandi_get_cities.py
CITY_COUNT=$(python3 -c "import json; print(json.load(open('data/tamilvandi_cities.json'))['count'])")
echo "✓ Found $CITY_COUNT cities"
echo ""

# Step 2: Generate routes for top 10 cities
echo "🗺️  Step 2: Generating route pairs..."
python3 << 'SCRIPT'
import json
from itertools import combinations

with open('data/tamilvandi_cities.json') as f:
    cities = json.load(f)['cities'][:10]

routes = list(combinations(cities, 2))

with open('generated_routes.txt', 'w') as f:
    for from_city, to_city in routes:
        f.write(f"{from_city},{to_city}\n")

print(f"✓ Generated {len(routes)} routes")
SCRIPT
echo ""

# Step 3: Scrape with validation
echo "🔍 Step 3: Scraping bus data..."
python scripts/tamilvandi_scraper_selenium.py \
  --route-list generated_routes.txt \
  --output data/pipeline_output \
  --delay 2.0

echo ""
echo "✅ Pipeline complete!"
echo "📊 Results in: data/pipeline_output.json"
```

## API-Style Usage

For programmatic access:

```python
#!/usr/bin/env python3
"""Example: Using city fetcher programmatically"""

from scripts.tamilvandi_get_cities import TamilVandiCityFetcher
import json

def main():
    # Fetch cities
    fetcher = TamilVandiCityFetcher(headless=True)
    cities = fetcher.run()
    
    print(f"Fetched {len(cities)} cities")
    
    # Use in your application
    city_map = {city.lower(): city for city in cities}
    
    # Example: validate and autocomplete
    user_input = "mad"
    matches = [c for c in cities if c.lower().startswith(user_input.lower())]
    
    print(f"\nCities starting with '{user_input}':")
    for match in matches:
        print(f"  - {match}")

if __name__ == '__main__':
    main()
```

## Summary

The city fetcher feature provides:

1. **Standalone script** to fetch all cities
2. **Multiple fetching strategies** for reliability
3. **JSON and text output** for easy integration
4. **Comprehensive documentation** with examples
5. **Test script** for quick verification
6. **Integration with main scraper** for validation

This makes the Tamil Vandi scraper more robust and user-friendly by ensuring you always use valid city names.

---

**Files Summary:**
- `scripts/tamilvandi_get_cities.py` - City fetcher script
- `TAMILVANDI_CITY_FETCHER_GUIDE.md` - Complete guide
- `test_city_fetcher.sh` - Quick test script
- Enhanced `scripts/tamilvandi_scraper_selenium.py` - Added fetch_all_cities() method

**Quick Test:**
```bash
./test_city_fetcher.sh
```

**Status:** ✅ Ready to use
