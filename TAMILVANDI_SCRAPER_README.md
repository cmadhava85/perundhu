# Tamil Vandi Bus Scraper

## Overview

This scraper fetches bus timing data from [TamilVandi.com](https://www.tamilvandi.com/timings), a popular website for Tamil Nadu bus timings. The scraper handles pagination automatically to collect all available bus routes between cities.

## Features

- ✅ Scrapes bus timings between any two cities
- ✅ Handles multiple pages of results automatically
- ✅ Extracts comprehensive data:
  - Origin (from city)
  - Destination (to city)
  - Departure time
  - Arrival time (if available)
  - Bus number/operator name
  - Bus type (Moffusil/Private)
  - Stops with timings (if available)
- ✅ Checkpoint system for resuming interrupted scrapes
- ✅ Outputs to both JSON and CSV formats
- ✅ Rate limiting to avoid overloading the server
- ✅ Detailed logging for monitoring progress

## Requirements

```bash
pip install selenium
```

You'll also need Chrome browser and ChromeDriver installed on your system.

## Usage

### Single Route Pair

Scrape buses from one city to another:

```bash
python scripts/tamilvandi_scraper_selenium.py \
  --from "Sivakasi" \
  --to "Madurai" \
  --output data/sivakasi_madurai
```

### Multiple Route Pairs

Create a text file with route pairs (one per line, format: `FROM,TO`):

**routes.txt:**
```
Sivakasi,Madurai
Madurai,Chennai
Chennai,Coimbatore
```

Then run:

```bash
python scripts/tamilvandi_scraper_selenium.py \
  --route-list routes.txt \
  --output data/tamilvandi_all_routes
```

### Testing (Limited Routes)

Test with first N route pairs:

```bash
python scripts/tamilvandi_scraper_selenium.py \
  --route-list routes.txt \
  --limit-routes 2 \
  --output data/test_routes
```

### Show Browser Window

By default, the scraper runs in headless mode. To see the browser:

```bash
python scripts/tamilvandi_scraper_selenium.py \
  --from "Sivakasi" \
  --to "Madurai" \
  --show-browser
```

### Verbose Logging

Enable debug-level logging:

```bash
python scripts/tamilvandi_scraper_selenium.py \
  --from "Sivakasi" \
  --to "Madurai" \
  --verbose
```

## Command Line Options

| Option | Description | Default |
|--------|-------------|---------|
| `--from` | Origin city | - |
| `--to` | Destination city | - |
| `--route-list` | File with route pairs (FROM,TO per line) | - |
| `--output` | Output file path (without extension) | `data/tamilvandi_routes` |
| `--delay` | Delay between operations (seconds) | `1.5` |
| `--limit-routes` | Limit number of route pairs (for testing) | None |
| `--headless` | Run browser in headless mode | `True` |
| `--show-browser` | Show browser window | `False` |
| `--verbose` | Enable verbose logging | `False` |

## Output Format

### JSON Output

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

### CSV Output

Columns:
- `bus_number`: Bus number or service name
- `bus_type`: Type of bus (Moffusil Bus, Private Bus, etc.)
- `operator_name`: Name of operator
- `origin`: Origin city
- `destination`: Destination city
- `departure_time`: Departure time (HH:MM format)
- `arrival_time`: Arrival time (if available)
- `stops_json`: JSON array of stops with timings
- `scraped_at`: ISO timestamp when data was scraped

## Checkpoint System

The scraper automatically saves progress to a checkpoint file (`.checkpoint.json`). If the scraper is interrupted:

1. It will resume from the last completed route pair
2. All previously collected data is preserved
3. No duplicate scraping of already-processed routes

To start fresh, delete the checkpoint file:

```bash
rm data/tamilvandi_routes.checkpoint.json
```

## Rate Limiting

The scraper includes built-in delays to avoid overwhelming the server:
- Default delay: 1.5 seconds between operations
- Configurable via `--delay` parameter
- Additional delays when navigating pages

## Error Handling

The scraper handles various error conditions:
- Missing or invalid route data
- Pagination issues
- Network timeouts
- Browser crashes
- Stale element references

Errors are logged but don't stop the entire scraping process.

## Sample Route Pairs File

See `tamilvandi_routes_sample.txt` for an example:

```
# Tamil Vandi Route Pairs
# Format: FROM,TO (one per line)
# Lines starting with # are comments

Sivakasi,Madurai
Madurai,Chennai
Chennai,Coimbatore
Coimbatore,Trichy
Trichy,Salem
```

## Tips for Best Results

1. **City Names**: Use exact city names as they appear on the website (usually in UPPERCASE)
2. **Rate Limiting**: For large scrapes, consider increasing delay: `--delay 2.0`
3. **Browser Mode**: Use `--show-browser` for debugging if results seem incorrect
4. **Checkpoint Files**: Keep checkpoint files during long scrapes for safety
5. **Testing**: Always test with `--limit-routes 1` first to verify setup

## Common Issues

### No Results Found

- Verify city names are spelled correctly
- Check if the route exists on TamilVandi.com manually
- Try with `--show-browser` to see what's happening

### Browser Not Found

Install ChromeDriver:
```bash
# macOS
brew install chromedriver

# Linux
sudo apt-get install chromium-chromedriver
```

### Timeout Errors

Increase delay:
```bash
--delay 3.0
```

## Comparison with Other Scrapers

| Feature | Tamil Vandi | MTC Scraper | TNSTC Scraper |
|---------|-------------|-------------|---------------|
| Source | TamilVandi.com | mtcbus.tn.gov.in | tnstc.in |
| Coverage | All Tamil Nadu | Chennai MTC only | TNSTC routes |
| Pagination | Yes | No | No |
| Stops Detail | Limited | No | Yes (via API) |
| Booking | No | No | Yes |

## Example Run

```bash
$ python scripts/tamilvandi_scraper_selenium.py --from "Sivakasi" --to "Madurai" --show-browser

2026-01-15 10:30:42 - INFO - === Starting Tamil Vandi Bus Scraper (Selenium) ===
2026-01-15 10:30:42 - INFO - Will scrape 1 route pairs
2026-01-15 10:30:42 - INFO - Setting up Chrome WebDriver...
2026-01-15 10:30:44 - INFO - WebDriver ready
2026-01-15 10:30:44 - INFO - 
[1/1] Processing: Sivakasi -> Madurai
2026-01-15 10:30:44 - INFO - 
=== Scraping Sivakasi -> Madurai ===
2026-01-15 10:30:44 - INFO - Loading: https://www.tamilvandi.com/timings?from=Sivakasi&to=Madurai
2026-01-15 10:30:47 - INFO - Found results on page
2026-01-15 10:30:47 - INFO -   Parsing page 1...
2026-01-15 10:30:49 - INFO - Parsed 10 routes from text
2026-01-15 10:30:49 - INFO -   Found 10 routes on page 1
2026-01-15 10:30:49 - INFO -   No more pages
2026-01-15 10:30:49 - INFO - Total routes collected for Sivakasi -> Madurai: 10
2026-01-15 10:30:49 - INFO - Checkpoint saved: 1 pairs, 10 routes
2026-01-15 10:30:51 - INFO - 
=== Scraping complete! Total routes collected: 10 ===
2026-01-15 10:30:51 - INFO - WebDriver closed
2026-01-15 10:30:51 - INFO - Saved 10 records to JSON: data/tamilvandi_routes.json
2026-01-15 10:30:51 - INFO - Saved 10 records to CSV: data/tamilvandi_routes.csv
2026-01-15 10:30:51 - INFO - 
✅ Successfully scraped 10 bus routes
2026-01-15 10:30:51 - INFO - 📁 Saved to: data/tamilvandi_routes.json and data/tamilvandi_routes.csv
```

## Next Steps

After scraping:
1. Review the output files in the `data/` directory
2. Validate the data quality
3. Import into your database or application
4. Set up scheduled scraping for regular updates

## Support

For issues or questions:
1. Check the logs for error messages
2. Try running with `--verbose` and `--show-browser`
3. Verify the website structure hasn't changed
4. Review similar scrapers (MTC, TNSTC) for reference patterns
