# Tamil Vandi City List Fetcher - Guide

## Overview

This tool fetches all available cities from the Tamil Vandi website so you can:
- Know exactly which cities are searchable
- Avoid errors from invalid city names
- Build valid route pairs programmatically
- Validate user input against supported cities

## Quick Start

### Fetch Cities (Default)

```bash
source .venv/bin/activate
python scripts/tamilvandi_get_cities.py
```

This creates:
- `data/tamilvandi_cities.json` - JSON file with city list
- `data/tamilvandi_cities.txt` - Plain text file (one city per line)

### Show Browser While Fetching

```bash
python scripts/tamilvandi_get_cities.py --show-browser
```

### Custom Output Location

```bash
python scripts/tamilvandi_get_cities.py --output my_cities.json
```

## Output Format

### JSON Format

```json
{
  "cities": [
    "Arakkonam",
    "Chennai",
    "Coimbatore",
    "Madurai",
    ...
  ],
  "count": 50,
  "fetched_at": "2026-01-15 14:30:00",
  "source": "https://www.tamilvandi.com/timings"
}
```

### Text Format

```
Arakkonam
Chennai
Coimbatore
Madurai
...
```

## How It Works

The fetcher tries multiple strategies to extract cities:

### Strategy 1: Autocomplete Suggestions
- Triggers autocomplete on search inputs
- Tests with different letters (a, b, c, etc.)
- Collects all suggested cities

### Strategy 2: Dropdown Menus
- Looks for `<select>` elements
- Extracts all `<option>` values

### Strategy 3: Page Links
- Parses links with `from=` and `to=` parameters
- Extracts city names from URLs

### Strategy 4: Data Attributes
- Checks for `data-city`, `data-location` attributes
- Extracts values from HTML elements

### Fallback
If all strategies fail, returns a curated list of major Tamil Nadu cities.

## Using the City List

### 1. Validate City Names Before Scraping

```python
import json

# Load cities
with open('data/tamilvandi_cities.json', 'r') as f:
    data = json.load(f)
    valid_cities = set(data['cities'])

# Check if city is valid
city = "Chennai"
if city in valid_cities:
    print(f"{city} is valid!")
else:
    print(f"{city} not found. Try: {', '.join(list(valid_cities)[:5])}")
```

### 2. Generate All Valid Route Pairs

```python
import json
from itertools import combinations

# Load cities
with open('data/tamilvandi_cities.json', 'r') as f:
    cities = json.load(f)['cities']

# Generate all unique pairs
route_pairs = []
for from_city, to_city in combinations(cities, 2):
    route_pairs.append((from_city, to_city))

print(f"Generated {len(route_pairs)} possible route pairs")

# Save to file for scraping
with open('all_routes.txt', 'w') as f:
    for from_city, to_city in route_pairs:
        f.write(f"{from_city},{to_city}\n")
```

### 3. Case-Insensitive Matching

```python
import json

with open('data/tamilvandi_cities.json', 'r') as f:
    cities = json.load(f)['cities']
    city_map = {city.lower(): city for city in cities}

# Find correct case for user input
user_input = "chennai"
correct_name = city_map.get(user_input.lower())

if correct_name:
    print(f"Using: {correct_name}")
else:
    print(f"City not found: {user_input}")
```

### 4. Autocomplete for User Input

```python
import json

with open('data/tamilvandi_cities.json', 'r') as f:
    cities = json.load(f)['cities']

# Search cities starting with user input
user_input = "Che"
matches = [city for city in cities if city.lower().startswith(user_input.lower())]

print(f"Cities starting with '{user_input}':")
for match in matches:
    print(f"  - {match}")
```

## Integration with Main Scraper

### Pre-validate Routes

Create a wrapper script that validates cities before scraping:

```python
#!/usr/bin/env python3
import json
import subprocess
import sys

# Load valid cities
with open('data/tamilvandi_cities.json', 'r') as f:
    valid_cities = set(city.lower() for city in json.load(f)['cities'])

# Get user input
from_city = sys.argv[1]
to_city = sys.argv[2]

# Validate
if from_city.lower() not in valid_cities:
    print(f"Error: '{from_city}' is not a valid city")
    sys.exit(1)

if to_city.lower() not in valid_cities:
    print(f"Error: '{to_city}' is not a valid city")
    sys.exit(1)

# Run scraper
subprocess.run([
    'python', 'scripts/tamilvandi_scraper_selenium.py',
    '--from', from_city,
    '--to', to_city
])
```

### Filter Route List

```bash
# Create validated route list
python scripts/tamilvandi_get_cities.py

# Generate routes only for valid cities
python3 << 'EOF'
import json

with open('data/tamilvandi_cities.json') as f:
    cities = json.load(f)['cities'][:10]  # First 10 cities

with open('validated_routes.txt', 'w') as f:
    for i, from_city in enumerate(cities):
        for to_city in cities[i+1:]:
            f.write(f"{from_city},{to_city}\n")

print("Created validated_routes.txt")
EOF

# Scrape with validated routes
python scripts/tamilvandi_scraper_selenium.py \
  --route-list validated_routes.txt \
  --output data/validated_output
```

## Command Line Options

| Option | Description | Default |
|--------|-------------|---------|
| `--output` | Output JSON file path | `data/tamilvandi_cities.json` |
| `--show-browser` | Show browser window | False (headless) |
| `--verbose` | Enable debug logging | False |

## Troubleshooting

### No Cities Found

If the script returns the default list instead of scraping:
1. Run with `--show-browser` to see what's happening
2. Check if website structure has changed
3. Use `--verbose` to see which strategies were tried
4. The default list is still usable for most routes

### Partial Results

If you get some cities but not all:
- This is normal - website may not expose all cities upfront
- The default list supplements what's found
- You can manually add cities to the JSON file

### Wrong City Names

If city names don't work with the scraper:
- Check the exact spelling on tamilvandi.com
- Try both uppercase and lowercase versions
- Some cities may have multiple names (e.g., "Trichy" vs "Tiruchirappalli")

## Example Workflow

Complete workflow from fetching cities to scraping:

```bash
# Step 1: Fetch available cities
python scripts/tamilvandi_get_cities.py

# Step 2: View the cities
cat data/tamilvandi_cities.json | python -m json.tool | less

# Step 3: Create route list with valid cities
cat > my_routes.txt << EOF
Chennai,Madurai
Coimbatore,Salem
Trichy,Thanjavur
EOF

# Step 4: Validate routes exist in city list
python3 << 'SCRIPT'
import json

with open('data/tamilvandi_cities.json') as f:
    valid_cities = {c.lower() for c in json.load(f)['cities']}

with open('my_routes.txt') as f:
    for line in f:
        if line.strip():
            from_city, to_city = line.strip().split(',')
            if from_city.lower() not in valid_cities:
                print(f"⚠️  '{from_city}' may not be valid")
            if to_city.lower() not in valid_cities:
                print(f"⚠️  '{to_city}' may not be valid")

print("✓ Validation complete")
SCRIPT

# Step 5: Run scraper with validated routes
python scripts/tamilvandi_scraper_selenium.py \
  --route-list my_routes.txt \
  --output data/my_results
```

## Benefits

✅ **Error Prevention**: Know valid cities before scraping  
✅ **Time Saving**: Avoid failed scrapes from invalid cities  
✅ **Completeness**: Ensure you don't miss any cities  
✅ **Automation**: Generate routes programmatically  
✅ **Validation**: Check user input against known cities  

## Limitations

⚠️ **Website Dependent**: Relies on website structure  
⚠️ **May Not Be Complete**: Website may not list all cities  
⚠️ **Fallback Required**: Uses default list if scraping fails  
⚠️ **Manual Updates**: May need to update default list over time  

## Updating the City List

To refresh the city list periodically:

```bash
# Fetch latest cities
python scripts/tamilvandi_get_cities.py --output data/cities_$(date +%Y%m%d).json

# Compare with previous version
diff data/tamilvandi_cities.json data/cities_$(date +%Y%m%d).json

# Replace if newer has more cities
mv data/cities_$(date +%Y%m%d).json data/tamilvandi_cities.json
```

## Advanced: Building a City Database

Create a comprehensive city database:

```python
import json
from datetime import datetime

# Combine multiple sources
sources = [
    'data/tamilvandi_cities.json',
    'data/tnstc_cities.json',  # If you have it
    'data/mtc_cities.json',    # If you have it
]

all_cities = set()
for source in sources:
    try:
        with open(source) as f:
            data = json.load(f)
            all_cities.update(data.get('cities', []))
    except FileNotFoundError:
        pass

# Create master city list
master_data = {
    "cities": sorted(list(all_cities)),
    "count": len(all_cities),
    "sources": sources,
    "created_at": datetime.now().isoformat()
}

with open('data/master_cities.json', 'w') as f:
    json.dump(master_data, f, indent=2, ensure_ascii=False)

print(f"Created master list with {len(all_cities)} unique cities")
```

---

**Pro Tip**: Run the city fetcher weekly to keep your city list updated as the website adds new routes!
