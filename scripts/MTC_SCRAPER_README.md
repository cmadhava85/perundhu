# MTC Chennai Bus Timing Scraper

Automated scraper for fetching bus timing data from the Metropolitan Transport Corporation (Chennai) website and exporting to JSON/CSV files.

## Overview

Two scraper versions are available:

### 1. **Selenium Scraper** (Recommended) - `mtc_bus_scraper_selenium.py`
Uses browser automation to interact with dynamic dropdowns:
1. Opens the website in Chrome
2. Selects each route from the dropdown
3. Waits for origins to load, selects each one
4. Waits for destinations to load, selects each one
5. Extracts all departure times
6. **EBrowser automation** - Selenium handles all JavaScript interactions
- ✅ **Cascading dropdown navigation** - Automatically waits for dynamic content
- ✅ **Rate limiting** - Configurable delays between operations
- ✅ **JSON export** - Structured data for API integration
- ✅ **CSV export** - Easy import into databases/spreadsheets
- ✅ **Progress logging** - Detailed status of scraping progress
- ✅ **Testing mode** - `--limit-routes` flag for quick tests
- ✅ **Headless mode** - Run without GUI (or `--show-browser` to watch)
- ✅ **Cascading dropdown navigation** - Handles dynamic origin/destination loading
- ✅ **Rate limiting** - Configurable delays to avoid overwhelming the server
- ✅ **MySQL storage** - Persistent storage with automatic schema creation
- ✅ **Duplicate handling** - Unique constraint prevents duplicate entries
- ✅ **Progress logging** - Detailed logging of scraping progress
- ✅ **Resumable** - Can be interrupted and restarted safely
- ✅ **Testing mode** - `--limit-routes` flag for testing with limited data

## Prerequisites

- Google Chrome browser (latest version)
- ChromeDriver (automatically managed by Selenium 4.15+
- MySQL database (local or remote)
- Internet connection

## Installation

1. **Install dependencies:**
   ```bash
   pip install -r mtc_requirements.txt
   ``Verify Chrome is installed:**
   ```bash
   # Check Chrome version (macOS)
   /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --version
   ```sql
   CREATE DATABASE IF NOT EXISTS perundhu CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```

## Usage

### Basic Usage (with defaults)

```bash
python scripts/mtc_bus_scraper.py
```

This uses the default configuration:
- Host: `localhosSelenium - Recommended)

```bash
# Test with 2 routes
python scripts/mtc_bus_scraper_selenium.py --limit-routes 2 --show-browser

# Full scrape (headless, outputs to data/mtc_bus_timings.json and .csv)
python scripts/mtc_bus_scraper_selenium.py --delay 2.0
```

This outputs:
- `data/mtc_bus_timings.json` - JSON format
- `data/mtc_bus_timings.csv` - CSV format for spreadshee
  --database perundhu \
  --user roOutput Location

```bash
python scripts/mtc_bus_scraper_selenium.py \
  --output exports/chennai_bus_data \
  --delay 2.0 \
  --limit-routes 5
```

### Show Browser (Watch It Work)

```bash
python scripts/mtc_bus_scraper_selenium.py --show-browser --limit-routes 1calhost)
  --port PORT              MySQL port (default: 3306)
  --database DATABASE      MySQL database name (default: perundhu)
  --user USER              MySQL username (default: root)
  --password PASSWORD      MySQL password (default: root)
  --delay SECONDS          Delay between requests in seconds (default: 1.0)
  --limit-routes N         Limit number of routes to process (for testing)
  --verbose                Enable verbose logging
  -h, --help               Show help message
```

## Doutput PATH            Output file path without extension (default: data/mtc_bus_timings)
  --delay SECONDS          Delay between operations in seconds (default: 2.0)
  --limit-routes N         Limit number of routes to process (for testing)
  --show-browser           Show browser window while scraping
    route_number VARCHAR(20) NOT NULL,
    origin_name VARCHAR(255) NOT NULL,
    destination_name VARCHAR(255) NOT NULL,
    timing VARCHAR(10) NOT NULL,
    scraped_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_route (route_number),
    INDEX idx_origin (origin_name),
   Output Format

### JSON Structure
```json
[
  {
    "route_number": "101",
    "route_name": "101",
    "origin_value": "1",
    "origin_name": "ANNA NAGAR EAST",
    "destination_value": "2",
    "destination_name": "POONAMALLEE B.S",
   Importing to MySQL

After scraping, import the CSV into your MySQL database:

```sql
-- Create table
CREATE TABLE mtc_bus_timings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    route_number VARCHAR(20),
    route_name VARCHAR(50),
    origin_value VARCHAR(20),
    origin_name VARCHAR(255),
    destination_value VARCHAR(20),
    destination_name VARCHAR(255),
    timing VARCHAR(10),
    scraped_at TIMESTAMP,
    INDEX idx_route (route_number),
    INDEX idx_origin (origin_name),
    INDEX idx_destination (destination_name)
);

-- Import CSV
LOAD DATA LOCAL INFILE '/path/to/mtc_bus_timings.csv'
INTO TABLE mtc_bus_timings
FIELDS TERMINATED BY ','
ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 ROWS

## Expected Runtime
1-3 minutes (depends on number of origin/destination pairs)
- **10 routes**: ~15-30 minutes
- **All routes**: Several hours (MTC has 600+ routes)
- **Recommendation**: Start with `--limit-routes 2es)
- **Recommendation**: Start with `--limit-routes 5` for testing

## Rate Limiting

The default delay of 1 second between requests is conservative. You can adjust:
- **More conservative** (slower, safer): `--delay 2.0`
- **More aggressive** (faster, riskier): `--delay 0.5`

⚠️ **Warning**: Too aggressive scraping may result in temporary IP bans or rate limiting by the server.

## TrhromeDriver Not Found

```
SessionNotCreatedException: Message: session not created
```

**Solution**: Selenium 4.15+ automatically manages ChromeDriver. Ensure you have:
```bash
pip install --upgrade selenium
```

### Chrome Version Mismatch

**Solution**: Update Chrome to the latest version, then restart the scraper.

### No Timings Found

If timings aren't being extracted:
1. Run with `--show-browser --verbose` to watch the process
2. Check if the website structure has changed
3. Increase `--delay` value (try 3.0 or 4.0 seconds)

### Page Load Timeout

```
TimeoutException: Message: timeout
```

**Solution**: Slow internet? Increase delay:
```bash
python scripts/mtc_bus_scraper_selenium.py --delay 3.0 --limit-routes 1
```

If timings aren't being extracted, the HTML structure may have changed. Check the logs for details.

## API Endpoints

The scraper uses these MTC website endpoints:

1. **Main search page**: `https://mtcbus.tn.gov.in/Home/bustimingsearch`
2. **Get origins by route**: `POST /Home/getoriginbyroute/{route_id}`
3. **Get destinations**: `POST /Home/getdestinationrouteorigin/{route_id}/{origin_id}`
4. **Get timings**: `POST /Home/bustimingsearch` with form data

## License

Part of the Perundhu project.

## Support

For issues or questions, check the main project documentation or logs with `--verbose` flag.
