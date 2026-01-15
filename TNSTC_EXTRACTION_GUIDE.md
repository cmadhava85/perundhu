# TNSTC Bus Timetable Image Extraction Guide

## Overview
Script to search for and extract TNSTC bus timetable images using your existing `google_image_bus_scraper.py` with multiple search queries focused on bus timing and scheduling information.

## Features
- **Multiple search strategies** - Different queries to capture various timetable formats
- **Duplicate detection** - Avoids processing the same image twice
- **OCR extraction** - Extracts text from images using Tesseract
- **Smart filtering** - Only considers bus timing/schedule images
- **City-specific routes** - Searches for popular Tamil Nadu bus routes
- **Structured output** - JSON format matching TNSTC/MTC data structure

## Search Categories

### 1. Direct TNSTC Searches
```
tnstc bus time table
tnstc bus timing schedule
tnstc bus routes time
```

### 2. City-Specific Routes
```
Chennai to Madurai TNSTC bus timetable
Salem to Bangalore TNSTC bus schedule
Trichy to Salem TNSTC bus timing
Coimbatore to Bangalore TNSTC timetable
Erode to Salem TNSTC bus timing
```

### 3. Alternative Keywords
```
TNSTC bus schedule table
TNSTC bus departure arrival times
TNSTC bus frequency daily schedule
```

### 4. Regional Searches
```
Tamil Nadu bus timetable schedule
Tamil Nadu TNSTC routes timing
```

### 5. Format-Based Searches
```
bus schedule timing table image
bus time table schedule format Tamil Nadu
```

## Usage

### Run All Default Searches
```bash
python search_tnstc_bus_timetables.py
```

**Output:**
- `tnstc_timetable_results/all_results.json` - Detailed extraction results
- `tnstc_timetable_results/search_summary.json` - Search statistics
- `tnstc_timetable_results/search_log.txt` - Execution log

### Run with Custom Output Directory
```bash
python search_tnstc_bus_timetables.py --output ./my_results
```

### Increase Images Per Search (Default: 10)
```bash
python search_tnstc_bus_timetables.py --limit 20
```

### Single Custom Query
```bash
python search_tnstc_bus_timetables.py --query "bus timetable Chennai"
```

### Multiple Custom Queries from File
```bash
python search_tnstc_bus_timetables.py --custom-queries queries.txt
```

**queries.txt format:**
```
Chennai to Kanchipuram bus timing
Vellore to Chennai TNSTC schedule
Madurai to Rameswaram bus route
```

### Disable Duplicate Detection
```bash
python search_tnstc_bus_timetables.py --no-dedup
```

## Output Files

### all_results.json
Detailed results for each search query:
```json
{
  "tnstc_basic": {
    "query": "tnstc bus time table",
    "extracted_count": 3,
    "routes": [
      {
        "service_code": "IMGCHEKMG0630",
        "origin": "CHENNAI",
        "destination": "KANCHIPURAM",
        "departure_time": "06:30",
        "arrival_time": "09:45",
        "image_source": "https://...",
        "confidence_score": 0.85
      }
    ]
  }
}
```

### search_summary.json
High-level statistics:
```json
{
  "timestamp": "2025-01-14T15:30:00.000Z",
  "total_queries": 17,
  "total_routes_extracted": 45,
  "queries_successful": 15,
  "queries_failed": 2,
  "queries": {
    "tnstc_basic": {
      "query": "tnstc bus time table",
      "extracted": 3,
      "has_error": false
    }
  }
}
```

### search_log.txt
Execution log with details for each query.

## Image Filtering Logic

The script filters images to keep only **bus timing-related** content:

### Included (Timing Keywords)
- bus, timetable, schedule, time, departure, arrival
- route, timings, service, tnstc, transport
- bus service, bus schedule, bus timetable
- frequency, timing, operating hours

### Excluded (Noise Keywords)
- driver, accident, crash, people, passenger
- interior, exterior, picture, photo, ticket
- booking, reservation, app, website, mobile
- logo, advertisement, poster, manual

## Data Extraction Process

1. **Search** - Find images using multiple queries
2. **Deduplication** - Skip duplicate images (SHA256 hash)
3. **Download** - Fetch image from URL
4. **OCR** - Extract text using Tesseract
5. **Parsing** - Extract structured data (origin, destination, times)
6. **Validation** - Verify extracted data quality
7. **Normalization** - Convert to standard TNSTC format
8. **Save** - Store in JSON with metadata

## Configuration

### In the Script

```python
# Adjust search queries
SEARCH_QUERIES = {
    "your_key": "your search query"
}

# Modify keyword filters
TIMING_KEYWORDS = {...}
EXCLUDE_KEYWORDS = {...}
```

### Via Command Line

```bash
# More images per query (default 10)
python search_tnstc_bus_timetables.py --limit 50

# Disable duplicate detection for broader search
python search_tnstc_bus_timetables.py --no-dedup

# Custom output location
python search_tnstc_bus_timetables.py --output /path/to/results
```

## Troubleshooting

### No images found
- Check internet connection
- Try different search queries
- Increase `--limit` to get more results
- Ensure pytesseract is installed: `pip install pytesseract`

### OCR extraction errors
- Install Tesseract: `brew install tesseract` (macOS)
- Ensure image quality is sufficient
- Check `search_log.txt` for specific errors

### Duplicate detection too aggressive
- Use `--no-dedup` to disable
- Or adjust hash comparison in code

### Low confidence scores
- These indicate lower-quality OCR extractions
- Check `confidence_score` field in results
- Filter results with confidence > 0.7

## API Dependencies

The script uses:
1. **bing-image-downloader** - Primary image search
2. **pytesseract** - OCR text extraction
3. **Tesseract** - OCR engine (system dependency)
4. **PIL/Pillow** - Image processing
5. **OpenCV** - Image enhancement
4. **requests** - HTTP requests

Install Python dependencies:
```bash
pip install pytesseract pillow opencv-python requests bing-image-downloader
```

## Example Workflow

```bash
# 1. Run default searches
python search_tnstc_bus_timetables.py --limit 15

# 2. Check results
cat tnstc_timetable_results/search_summary.json | python -m json.tool

# 3. If successful, view detailed results
cat tnstc_timetable_results/all_results.json | python -m json.tool | head -50

# 4. Try custom queries if needed
echo "Nagercoil to Madurai TNSTC bus" > custom.txt
echo "Tenkasi to Salem bus timing" >> custom.txt
python search_tnstc_bus_timetables.py --custom-queries custom.txt
```

## Notes

- Search results are **non-deterministic** - different runs may return different images
- OCR accuracy depends on image quality and resolution
- Some TNSTC timetables may be in Tamil script - OCR extraction may be limited
- Image URLs are temporary - save `local_path` if downloading for archive

## Next Steps

1. Analyze extracted routes for patterns
2. Cross-reference with official TNSTC schedules
3. Build database of common routes and timings
4. Set up automated daily/weekly extraction

## Performance Notes

- **Deduplication**: Adds minimal overhead (~SHA256 hash per image)
- **OCR extraction**: ~2-5 seconds per image
- **Search**: ~1-3 seconds per query
- **Total time for all queries**: ~2-5 minutes depending on network and system

For faster execution:
- Reduce `--limit`
- Use `--custom-queries` with fewer queries
- Disable `--no-dedup` (if duplicates are acceptable)
