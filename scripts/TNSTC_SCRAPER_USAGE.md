# TNSTC Bus Scraper - Usage Guide

## Overview

This script scrapes bus route information from the TNSTC (Tamil Nadu State Transport Corporation) online booking system: https://www.tnstc.in/OTRSOnline/

## Features

✅ **Data Extraction:**
- Service code and route number
- Origin and destination cities
- Departure and arrival times
- Journey duration
- Bus type (AC, Sleeper, etc.)
- Available seats
- Fare information
- **Complete stop-by-stop details with intermediate city stops and departure times**

✅ **Smart Features:**
- Selenium-based web automation with Chrome
- Handles dynamic popup modals for stop details
- Rate limiting to avoid server overload
- Stale element handling for reliable scraping
- Error recovery and retry logic
- Outputs to both JSON and CSV formats

## Installation

### Prerequisites
```bash
pip install selenium
```

### Setup Chrome Driver
The script uses Chrome WebDriver. Make sure Chrome is installed:
- **macOS**: `brew install chromedriver`
- **Ubuntu/Linux**: `apt-get install chromium-chromedriver`
- **Windows**: Download from https://chromedriver.chromium.org/

## Usage

### 1. Single Route Pair (Quick Test)

```bash
python tnstc_bus_scraper_selenium.py --source MADURAI --dest CHENNAI --output data/madurai_to_chennai
```

**With custom date (default is 3 days from today):**
```bash
python tnstc_bus_scraper_selenium.py --source MADURAI --dest CHENNAI --date 20/01/2026 --output data/jan_20
```

### 2. Multiple Route Pairs from City Lists

```bash
python tnstc_bus_scraper_selenium.py \
  --source-list tnstc_sources.txt \
  --dest-list tnstc_destinations.txt \
  --output data/tnstc_all_routes
```

**Limit to first N route pairs (useful for testing):**
```bash
python tnstc_bus_scraper_selenium.py \
  --source-list tnstc_sources.txt \
  --dest-list tnstc_destinations.txt \
  --limit-routes 5 \
  --output data/tnstc_sample
```

### 3. With Custom Parameters

```bash
python tnstc_bus_scraper_selenium.py \
  --source MADURAI \
  --dest CHENNAI \
  --delay 3.0 \
  --rate-limit 2.0 \
  --show-browser \
  --verbose \
  --output data/madurai_to_chennai
```

## Command-line Options

| Option | Default | Description |
|--------|---------|-------------|
| `--source` | - | Source city name |
| `--dest` | - | Destination city name |
| `--source-list` | - | File with source cities (one per line) |
| `--dest-list` | - | File with destination cities (one per line) |
| `--date` | Today+3 days | Journey date in DD/MM/YYYY format |
| `--output` | `data/tnstc_bus_routes` | Output file path (without extension) |
| `--delay` | 2.0 | Delay between page interactions (seconds) |
| `--rate-limit` | 1.5 | Minimum delay between server requests (seconds) |
| `--limit-routes` | - | Limit number of route pairs to scrape |
| `--show-browser` | False | Show browser window (opposite of headless) |
| `--verbose` | False | Enable detailed logging |

## Output Files

The script creates two output files:

### JSON Format (`routes.json`)
```json
[
  {
    "service_code": "1415SHEAVANS",
    "route_number": "1415",
    "corporation": "SETC",
    "origin": "MADURAI",
    "destination": "CHENNAI AVADI",
    "departure_time": "19:15",
    "arrival_time": "05:15",
    "duration": "9.00Hrs",
    "available_seats": "6 Seats Available",
    "bus_type": "NON AC SLEEPER SEATER",
    "fare": "Rs 477/740",
    "journey_date": "16/01/2026",
    "stops": [
      {
        "city": "SHECOTTAH",
        "landmark": "SHENCOTTAH",
        "time": "14:15"
      },
      {
        "city": "TENKASI",
        "landmark": "TENKASI",
        "time": "14:30"
      },
      {
        "city": "RAJAPALAYM",
        "landmark": "RAJAPALAYAM NEW BS",
        "time": "16:45"
      }
    ],
    "scraped_at": "2026-01-12T10:30:45.123456"
  }
]
```

### CSV Format (`routes.csv`)
Tabular format with stops stored as JSON in `stops_json` column for easy Excel import.

## Rate Limiting

The scraper includes built-in rate limiting to be respectful to the server:
- Default rate limit: 1.5 seconds between requests
- Additional 2x delay between route pairs
- Adjustable via `--rate-limit` parameter

For large-scale scraping, use a higher rate limit:
```bash
python tnstc_bus_scraper_selenium.py \
  --source-list tnstc_sources.txt \
  --dest-list tnstc_destinations.txt \
  --rate-limit 3.0 \
  --output data/tnstc_all_routes
```

## Example: Complete Scraping Workflow

```bash
# 1. Create city lists (if not already created)
cat > sources.txt << EOF
MADURAI
TRICHY
SALEM
EOF

cat > destinations.txt << EOF
CHENNAI
COIMBATORE
EOF

# 2. Test with small sample (2 routes)
python tnstc_bus_scraper_selenium.py \
  --source-list sources.txt \
  --dest-list destinations.txt \
  --limit-routes 2 \
  --verbose \
  --output data/test_routes

# 3. If successful, run full scrape
python tnstc_bus_scraper_selenium.py \
  --source-list sources.txt \
  --dest-list destinations.txt \
  --rate-limit 2.0 \
  --output data/tnstc_complete
```

## Troubleshooting

### Chrome Driver not found
```bash
# macOS
brew install chromedriver

# Ubuntu/Debian
sudo apt-get install chromium-chromedriver

# Fedora
sudo dnf install chromedriver
```

### Selenium timeout errors
- Increase `--delay` parameter to 3.0 or 4.0
- Increase `--rate-limit` parameter
- Check internet connection speed
- Try with `--show-browser` to debug visually

### No results found
- Verify city names are correct (case-insensitive but should match exactly)
- Ensure date is in the future and in DD/MM/YYYY format
- Check if routes actually exist on TNSTC website

### Memory issues
- Scrape smaller batches using `--limit-routes`
- Close other applications
- Increase system RAM or use a more powerful machine

## Data Structure

### BusRoute Object
```
service_code: str       # e.g., "1415SHEAVANS"
route_number: str       # e.g., "1415"
corporation: str        # e.g., "SETC"
origin: str            # Starting city
destination: str       # End city
departure_time: str    # HH:MM format, e.g., "19:15"
arrival_time: str      # Arrival stop or format
duration: str          # e.g., "9.00Hrs"
available_seats: str   # e.g., "6 Seats Available"
bus_type: str          # e.g., "NON AC SLEEPER SEATER"
fare: str              # e.g., "Rs 477/740"
journey_date: str      # DD/MM/YYYY
stops: List[Dict]      # List of intermediate stops with city, landmark, time
scraped_at: str        # ISO format timestamp
```

### Stop Object (within stops list)
```
city: str              # City name
landmark: str          # Bus stand/landmark name
time: str              # Departure time from that stop (HH:MM)
```

## Performance Tips

1. **For small datasets** (< 50 routes): Use default settings
2. **For medium datasets** (50-500 routes): Increase `--delay` to 2.5, `--rate-limit` to 2.0
3. **For large datasets** (> 500 routes):
   - Split into batches
   - Use `--limit-routes` and run multiple times
   - Increase `--rate-limit` to 3.0 or higher

## Legal & Ethical Considerations

- ✅ This scraper is for **personal and research use**
- ✅ It respects rate limiting to minimize server load
- ⚠️ Check TNSTC's Terms of Service before using
- ⚠️ Do not distribute scraped data commercially without permission
- ⚠️ Do not use for competing bus booking services

## Support

For issues or improvements:
1. Check the logs with `--verbose` flag
2. Try with `--show-browser` to observe behavior
3. Verify Chrome/Chromedriver versions match
4. Check internet connectivity

---

**Created:** 2026-01-12  
**Compatible with:** Python 3.7+, Selenium 4.0+
