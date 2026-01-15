# Tamil Vandi Scraper - Quick Reference Card

## City List Feature

### Fetch All Available Cities
```bash
# Get cities from website
python scripts/tamilvandi_get_cities.py

# Output files created:
# - data/tamilvandi_cities.json (JSON format)
# - data/tamilvandi_cities.txt (plain text)

# Show browser while fetching
python scripts/tamilvandi_get_cities.py --show-browser

# Custom output
python scripts/tamilvandi_get_cities.py --output my_cities.json
```

### Quick Test
```bash
./test_city_fetcher.sh
```

## Scraping with Valid Cities

### Workflow
```bash
# 1. Get valid cities
python scripts/tamilvandi_get_cities.py

# 2. View cities
cat data/tamilvandi_cities.txt

# 3. Create route file
cat > routes.txt << EOF
Chennai,Madurai
Coimbatore,Salem
EOF

# 4. Scrape
python scripts/tamilvandi_scraper_selenium.py --route-list routes.txt
```

## Python Integration

### Load Cities
```python
import json

with open('data/tamilvandi_cities.json', 'r') as f:
    data = json.load(f)
    cities = data['cities']
    print(f"Loaded {data['count']} cities")
```

### Validate City
```python
valid_cities = {c.lower() for c in cities}
if "chennai" in valid_cities:
    print("Valid city!")
```

### Autocomplete
```python
search = "mad"
matches = [c for c in cities if c.lower().startswith(search.lower())]
print(f"Matches: {matches}")  # ['Madurai']
```

### Generate Routes
```python
from itertools import combinations

routes = list(combinations(cities[:10], 2))
with open('routes.txt', 'w') as f:
    for from_city, to_city in routes:
        f.write(f"{from_city},{to_city}\n")
```

## Complete Pipeline

```bash
# Fetch cities → Generate routes → Scrape
python scripts/tamilvandi_get_cities.py && \
python3 -c "
import json
from itertools import combinations
cities = json.load(open('data/tamilvandi_cities.json'))['cities'][:5]
routes = combinations(cities, 2)
open('routes.txt', 'w').write('\n'.join(f'{f},{t}' for f,t in routes))
" && \
python scripts/tamilvandi_scraper_selenium.py --route-list routes.txt
```

## Key Benefits

✅ Know all valid cities before scraping  
✅ Avoid typos and errors  
✅ Generate routes programmatically  
✅ Validate user input  
✅ Build autocomplete features  

## File Locations

```
scripts/
├── tamilvandi_scraper_selenium.py    # Main scraper
├── tamilvandi_get_cities.py          # City fetcher
└── ...

data/
├── tamilvandi_cities.json            # Cities (JSON)
├── tamilvandi_cities.txt             # Cities (text)
└── ...

Documentation/
├── TAMILVANDI_SCRAPER_README.md      # Main scraper docs
├── TAMILVANDI_CITY_FETCHER_GUIDE.md  # City fetcher guide
└── TAMILVANDI_CITY_LIST_FEATURE.md   # Feature summary
```

## Common Commands

```bash
# Fetch cities
python scripts/tamilvandi_get_cities.py

# Scrape single route
python scripts/tamilvandi_scraper_selenium.py --from "Chennai" --to "Madurai"

# Scrape multiple routes
python scripts/tamilvandi_scraper_selenium.py --route-list routes.txt

# Show browser (for debugging)
python scripts/tamilvandi_scraper_selenium.py --from "Chennai" --to "Madurai" --show-browser

# Verbose logging
python scripts/tamilvandi_scraper_selenium.py --from "Chennai" --to "Madurai" --verbose
```

## Output Format

### City List JSON
```json
{
  "cities": ["Chennai", "Madurai", ...],
  "count": 48,
  "fetched_at": "2026-01-15 14:30:00",
  "source": "https://www.tamilvandi.com/timings"
}
```

### City List Text
```
Chennai
Madurai
Coimbatore
...
```

### Bus Routes JSON
```json
{
  "bus_number": "503",
  "operator_name": "503",
  "bus_type": "Moffusil Bus",
  "origin": "Sivakasi",
  "destination": "Madurai",
  "departure_time": "01:10",
  "arrival_time": "",
  "stops": [],
  "scraped_at": "2026-01-15T10:30:45"
}
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| No cities found | Use `--show-browser` to debug |
| Returns default list | Normal fallback, still usable |
| Missing cities | Manually add to JSON file |
| Scraper fails | Verify city names in city list |

## Next Steps

1. ✅ Fetch cities: `python scripts/tamilvandi_get_cities.py`
2. ✅ Review list: `cat data/tamilvandi_cities.txt`
3. ✅ Create routes: Use cities from list
4. ✅ Scrape: `python scripts/tamilvandi_scraper_selenium.py --route-list routes.txt`

---

**Quick Start:** `./test_city_fetcher.sh`  
**Full Guide:** See `TAMILVANDI_CITY_FETCHER_GUIDE.md`
