# TNSTC Bus Scraper - Quick Start Guide

## 🚀 Quick Examples

### Test Run (Single Route)
```bash
cd /Users/mchand69/Documents/perundhu/scripts
python tnstc_bus_scraper_selenium.py --source MADURAI --dest CHENNAI --output ../data/test_route
```

### Scrape Multiple Routes (Pre-defined Cities)
```bash
python tnstc_bus_scraper_selenium.py \
  --source-list tnstc_sources.txt \
  --dest-list tnstc_destinations.txt \
  --limit-routes 5 \
  --output ../data/tnstc_sample
```

### Full Scrape (All Combinations)
```bash
python tnstc_bus_scraper_selenium.py \
  --source-list tnstc_sources.txt \
  --dest-list tnstc_destinations.txt \
  --rate-limit 2.0 \
  --output ../data/tnstc_all_routes
```

### Show Browser During Scraping (Debugging)
```bash
python tnstc_bus_scraper_selenium.py \
  --source MADURAI \
  --dest CHENNAI \
  --show-browser \
  --verbose \
  --output ../data/debug_route
```

## 📊 Output Files

After running, you'll get:
- **JSON**: `../data/filename.json` - Complete structured data with all stops
- **CSV**: `../data/filename.csv` - Spreadsheet-friendly format

## 🔍 Data You Get

For each bus route:
```
✓ Service Code (e.g., 1415SHEAVANS)
✓ Route Number
✓ Corporation (SETC, etc.)
✓ Origin & Destination Cities
✓ Departure & Arrival Times
✓ Bus Type (AC, Sleeper, etc.)
✓ Fare
✓ Available Seats
✓ COMPLETE STOP DETAILS:
  - City name
  - Bus stand/landmark
  - Departure time from each stop
```

## ⚙️ Key Parameters

| Parameter | Use | Example |
|-----------|-----|---------|
| `--source` | Single source city | `MADURAI` |
| `--dest` | Single destination | `CHENNAI` |
| `--source-list` | Multiple sources | `tnstc_sources.txt` |
| `--dest-list` | Multiple destinations | `tnstc_destinations.txt` |
| `--date` | Custom date | `20/01/2026` |
| `--delay` | UI interaction delay | `2.0` |
| `--rate-limit` | Server request delay | `1.5` |
| `--limit-routes` | Test mode (sample) | `5` |
| `--show-browser` | Debug mode | (no value) |
| `--verbose` | Detailed logs | (no value) |
| `--output` | Where to save | `../data/my_routes` |

## 🔄 Rate Limiting

Default: 1.5 seconds between requests
- For heavy scraping: Increase to 2.0-3.0 seconds
- For light scraping: Can keep at 1.5 seconds

## 📝 City List Format

Both `tnstc_sources.txt` and `tnstc_destinations.txt` contain:
```
MADURAI
TRICHY
SALEM
COIMBATORE
...
```
(One city per line)

## ✅ Pre-requisites

```bash
# Install Selenium
pip install selenium

# Install Chrome WebDriver (macOS)
brew install chromedriver

# Or Ubuntu/Linux
sudo apt-get install chromium-chromedriver
```

## 🎯 Common Tasks

**Task: Scrape Madurai to Chennai routes for Jan 20**
```bash
python tnstc_bus_scraper_selenium.py \
  --source MADURAI \
  --dest CHENNAI \
  --date 20/01/2026 \
  --output ../data/madurai_to_chennai_jan20
```

**Task: Get sample of 10 route combinations**
```bash
python tnstc_bus_scraper_selenium.py \
  --source-list tnstc_sources.txt \
  --dest-list tnstc_destinations.txt \
  --limit-routes 10 \
  --output ../data/sample_10_routes
```

**Task: Debug scraper with visual browser**
```bash
python tnstc_bus_scraper_selenium.py \
  --source MADURAI \
  --dest CHENNAI \
  --show-browser \
  --delay 3.0 \
  --output ../data/debug
```

---

For detailed documentation, see: **TNSTC_SCRAPER_USAGE.md**
