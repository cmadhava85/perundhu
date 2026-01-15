# Tamil Vandi Scraper - Implementation Summary

**Date:** January 15, 2026  
**Target URL:** https://www.tamilvandi.com/timings

## What Was Created

### 1. Main Scraper Script
**File:** `scripts/tamilvandi_scraper_selenium.py`

A comprehensive Selenium-based web scraper that:
- Fetches bus timing data from TamilVandi.com
- Handles multiple pages of results (pagination)
- Extracts all available data fields
- Supports both single route and batch scraping
- Includes checkpoint/resume functionality
- Outputs to JSON and CSV formats

### 2. Sample Route File
**File:** `tamilvandi_routes_sample.txt`

Example route pairs for testing:
- Sivakasi → Madurai
- Madurai → Chennai
- Chennai → Coimbatore
- And more...

### 3. Documentation
**File:** `TAMILVANDI_SCRAPER_README.md`

Complete documentation including:
- Usage instructions
- Command-line options
- Output format specifications
- Troubleshooting guide
- Example runs

### 4. Helper Scripts

**File:** `run_tamilvandi_scraper_test.sh`
- Quick test script for single route
- Runs with browser visible for debugging

**File:** `run_tamilvandi_batch_scraper.sh`
- Batch processing script
- Interactive confirmation
- Timestamped output files

## Data Fields Extracted

The scraper captures:

| Field | Description | Example |
|-------|-------------|---------|
| `bus_number` | Bus service number or operator name | "503", "STAR" |
| `bus_type` | Type of bus service | "Moffusil Bus", "Private Bus" |
| `operator_name` | Name of the operator | "STAR", "RSR", "VENKATESHWARA" |
| `origin` | Starting city | "Sivakasi" |
| `destination` | Ending city | "Madurai" |
| `departure_time` | Departure time (HH:MM) | "04:15" |
| `arrival_time` | Arrival time if available | "06:30" |
| `stops` | Array of intermediate stops with times | `[{"stop_name": "...", "time": "..."}]` |
| `scraped_at` | Timestamp of when data was collected | "2026-01-15T10:30:45.123456" |

## How to Use

### Quick Test (Single Route)
```bash
./run_tamilvandi_scraper_test.sh
```

Or manually:
```bash
source .venv/bin/activate
python scripts/tamilvandi_scraper_selenium.py \
  --from "Sivakasi" \
  --to "Madurai" \
  --output data/test_output
```

### Batch Processing
```bash
./run_tamilvandi_batch_scraper.sh tamilvandi_routes_sample.txt
```

Or manually:
```bash
source .venv/bin/activate
python scripts/tamilvandi_scraper_selenium.py \
  --route-list tamilvandi_routes_sample.txt \
  --output data/batch_output
```

### Advanced Options

**Headless mode (default):**
```bash
python scripts/tamilvandi_scraper_selenium.py --from "City1" --to "City2"
```

**Show browser window:**
```bash
python scripts/tamilvandi_scraper_selenium.py \
  --from "City1" --to "City2" \
  --show-browser
```

**Adjust delay (for slower connections):**
```bash
python scripts/tamilvandi_scraper_selenium.py \
  --from "City1" --to "City2" \
  --delay 3.0
```

**Limit routes for testing:**
```bash
python scripts/tamilvandi_scraper_selenium.py \
  --route-list routes.txt \
  --limit-routes 2
```

**Verbose logging:**
```bash
python scripts/tamilvandi_scraper_selenium.py \
  --from "City1" --to "City2" \
  --verbose
```

## Output Examples

### JSON Format
```json
[
  {
    "bus_number": "503",
    "bus_type": "Moffusil Bus",
    "operator_name": "503",
    "origin": "Sivakasi",
    "destination": "Madurai",
    "departure_time": "01:10",
    "arrival_time": "",
    "stops": [],
    "scraped_at": "2026-01-15T10:30:45.123456"
  },
  {
    "bus_number": "STAR",
    "bus_type": "Private Bus",
    "operator_name": "STAR",
    "origin": "Sivakasi",
    "destination": "Madurai",
    "departure_time": "04:15",
    "arrival_time": "",
    "stops": [],
    "scraped_at": "2026-01-15T10:30:45.123456"
  }
]
```

### CSV Format
```
bus_number,bus_type,operator_name,origin,destination,departure_time,arrival_time,stops_json,scraped_at
503,Moffusil Bus,503,Sivakasi,Madurai,01:10,,[],2026-01-15T10:30:45.123456
STAR,Private Bus,STAR,Sivakasi,Madurai,04:15,,[],2026-01-15T10:30:45.123456
```

## Key Features

### 1. Pagination Handling
The scraper automatically detects and navigates through multiple pages:
- Checks for "Next" button
- Clicks to load more results
- Continues until all pages are scraped

### 2. Checkpoint System
Automatic progress saving:
- Saves after each route pair
- Can resume if interrupted
- Prevents duplicate scraping
- Checkpoint file: `{output}.checkpoint.json`

### 3. Error Handling
Robust error recovery:
- Handles missing data gracefully
- Logs errors without stopping
- Continues with next route on failure
- Detailed logging for debugging

### 4. Rate Limiting
Respectful scraping:
- Default 1.5s delay between operations
- Configurable via `--delay` parameter
- Prevents server overload
- Additional delays for page navigation

### 5. Multiple Parsing Strategies
Fallback mechanisms:
- Primary: Structured element parsing
- Secondary: Text-based parsing
- Handles different page layouts
- Adapts to website changes

## Technical Details

### Architecture
- **Language:** Python 3.x
- **Framework:** Selenium WebDriver
- **Browser:** Chrome (headless mode supported)
- **Data Storage:** JSON + CSV

### Dependencies
```
selenium>=4.0.0
```

### Browser Requirements
- Chrome or Chromium browser
- ChromeDriver (auto-managed by Selenium)

## Comparison with Other Scrapers

| Feature | Tamil Vandi | MTC | TNSTC |
|---------|-------------|-----|-------|
| **Source** | tamilvandi.com | mtcbus.tn.gov.in | tnstc.in |
| **Coverage** | All Tamil Nadu | Chennai only | TNSTC network |
| **Pagination** | ✅ Yes | ❌ No | ❌ No |
| **Stop Details** | ⚠️ Limited | ❌ No | ✅ Yes (API) |
| **Bus Types** | ✅ Yes | ✅ Yes | ✅ Yes |
| **Checkpoint** | ✅ Yes | ✅ Yes | ✅ Yes |
| **Output Formats** | JSON + CSV | JSON + CSV | JSON + CSV |

## Known Limitations

1. **Stop Details:** TamilVandi.com shows limited stop information in listings
2. **Arrival Times:** Not always available in the data
3. **Real-time Data:** Only shows scheduled timings, not real-time
4. **Website Changes:** Scraper may need updates if website structure changes

## Troubleshooting

### No Results Found
- Verify city names match website exactly (usually UPPERCASE)
- Check route exists on website manually
- Use `--show-browser` to debug visually

### Browser Errors
Install ChromeDriver:
```bash
# macOS
brew install chromedriver

# Linux
sudo apt-get install chromium-chromedriver
```

### Timeout Issues
Increase delay:
```bash
--delay 3.0
```

### Checkpoint Issues
Remove checkpoint to start fresh:
```bash
rm data/output_name.checkpoint.json
```

## Future Enhancements

Possible improvements:
1. Add support for date-specific searches
2. Implement parallel scraping for faster processing
3. Add data validation and quality checks
4. Include fare information if available
5. Add support for return journey scraping
6. Integrate with database for automatic updates

## Testing Recommendations

1. **Start Small:** Test with 1-2 routes first
2. **Use --show-browser:** Verify scraping behavior visually
3. **Check Output:** Validate JSON/CSV format and data quality
4. **Monitor Logs:** Use `--verbose` for detailed information
5. **Test Resume:** Interrupt and restart to test checkpoint system

## Integration Examples

### Load JSON Data in Python
```python
import json

with open('data/tamilvandi_routes.json', 'r') as f:
    routes = json.load(f)

for route in routes:
    print(f"{route['origin']} -> {route['destination']}")
    print(f"  {route['operator_name']}: {route['departure_time']}")
```

### Load CSV Data in Python
```python
import csv

with open('data/tamilvandi_routes.csv', 'r') as f:
    reader = csv.DictReader(f)
    for row in reader:
        print(f"{row['origin']} -> {row['destination']}: {row['departure_time']}")
```

### Query Routes
```python
import json

# Load data
with open('data/tamilvandi_routes.json', 'r') as f:
    routes = json.load(f)

# Find buses after 6 AM
morning_buses = [
    r for r in routes 
    if r['departure_time'] >= '06:00'
]

# Find private buses
private_buses = [
    r for r in routes 
    if r['bus_type'] == 'Private Bus'
]
```

## File Structure

```
perundhu/
├── scripts/
│   └── tamilvandi_scraper_selenium.py    # Main scraper
├── data/
│   └── (output files will be saved here)
├── tamilvandi_routes_sample.txt          # Sample routes
├── run_tamilvandi_scraper_test.sh        # Test script
├── run_tamilvandi_batch_scraper.sh       # Batch script
├── TAMILVANDI_SCRAPER_README.md          # Full documentation
└── TAMILVANDI_SCRAPER_SUMMARY.md         # This file
```

## Support & Maintenance

The scraper is designed to be:
- **Self-contained:** No external dependencies beyond Selenium
- **Maintainable:** Clear code structure and documentation
- **Extensible:** Easy to add new features
- **Reliable:** Comprehensive error handling

For issues:
1. Check logs for error details
2. Review documentation (README.md)
3. Test with `--show-browser` and `--verbose`
4. Compare with working examples (MTC/TNSTC scrapers)

## Quick Reference Card

```bash
# Single route test
python scripts/tamilvandi_scraper_selenium.py --from "City1" --to "City2"

# Batch processing
python scripts/tamilvandi_scraper_selenium.py --route-list routes.txt

# Show browser
python scripts/tamilvandi_scraper_selenium.py --from "City1" --to "City2" --show-browser

# Verbose logging
python scripts/tamilvandi_scraper_selenium.py --from "City1" --to "City2" --verbose

# Custom delay
python scripts/tamilvandi_scraper_selenium.py --from "City1" --to "City2" --delay 3.0

# Limit routes
python scripts/tamilvandi_scraper_selenium.py --route-list routes.txt --limit-routes 5

# Custom output
python scripts/tamilvandi_scraper_selenium.py --from "City1" --to "City2" --output custom_name
```

---

**Status:** ✅ Ready for use  
**Last Updated:** January 15, 2026  
**Version:** 1.0
