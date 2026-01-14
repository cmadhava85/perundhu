# Google Image Bus Scraper - Complete Workflow Guide

## 📋 Overview

This guide walks you through extracting bus timing data from Google Images and integrating it with your existing TNSTC/MTC database.

## 🚀 Quick Setup (5 minutes)

### 1. Install Dependencies

```bash
cd /Users/mchand69/Documents/perundhu/scripts

# Install system dependency (Tesseract OCR)
# macOS
brew install tesseract

# Ubuntu/Debian
sudo apt-get install tesseract-ocr

# Install Python packages
pip install -r google_image_requirements.txt
```

### 2. Run Quick Start Check

```bash
python quickstart_check.py
```

You should see all checks passing ✓

## 📸 Phase 1: Extract Data from Images

### Option A: Single Image File

```bash
python google_image_bus_scraper.py \
  --process-image ./path/to/bus_schedule.jpg \
  --output ./data/extracted_single
```

**Output**: `data/extracted_single/extracted_buses.json`

### Option B: Search and Extract (Recommended)

```bash
# Single search
python google_image_bus_scraper.py \
  --search "Chennai to Madurai bus schedule" \
  --limit 10 \
  --output ./data/extracted_search

# Multiple route searches
python google_image_bus_scraper.py \
  --search "Trichy to Coimbatore bus time" \
  --limit 10 \
  --output ./data/extracted_search

python google_image_bus_scraper.py \
  --search "Salem to Bangalore bus schedule" \
  --limit 10 \
  --output ./data/extracted_search
```

### Option C: Batch Processing (Best for Scale)

Create `searches.txt`:

```
Chennai to Madurai bus schedule image
Trichy to Coimbatore bus timing
Salem to Vellore bus route
Tiruppur to Chennai bus time
Erode to Madurai bus schedule
Dindigul to Chennai bus timing
Tenkasi to Madurai bus schedule
Nagercoil to Chennai bus timing
Villupuram to Bangalore bus schedule
Kanchipuram to Trichy bus time
```

Run batch:

```bash
python google_image_bus_scraper.py \
  --batch-search searches.txt \
  --limit 5 \
  --output ./data/extracted_batch
```

**Time estimate**: ~30 minutes for 50 search queries × 5 images each

## 🔍 Phase 2: Validate and Clean Data

```bash
python integrate_google_data.py \
  --extracted ./data/extracted_batch/extracted_buses.json \
  --output ./data/cleaned_buses.json
```

**This step**:
- ✓ Validates all routes (times, cities, data consistency)
- ✓ Cleans stop information
- ✓ Removes exact duplicates
- ✓ Adds metadata

**Output**: `data/cleaned_buses.json` with validation summary

## 🔗 Phase 3: Merge with Existing Data (Optional)

If you want to merge with your existing TNSTC/MTC data:

```bash
# Get existing data (adjust path to your data location)
python integrate_google_data.py \
  --extracted ./data/cleaned_buses.json \
  --existing ../data/existing_tnstc.json \
  --output ./data/merged_buses.json
```

**This step**:
- ✓ Keeps existing routes
- ✓ Adds new routes not in existing data
- ✓ Replaces routes with higher confidence if duplicate
- ✓ Shows merge statistics

## 📊 Phase 4: Export Results

### Export to CSV (for Excel)

```bash
python integrate_google_data.py \
  --extracted ./data/cleaned_buses.json \
  --output ./data/buses_final.json \
  --export-csv ./data/buses_final.csv
```

**Output**: `data/buses_final.csv` - Spreadsheet-friendly format

### Export to SQL (for Database Import)

```bash
python integrate_google_data.py \
  --extracted ./data/cleaned_buses.json \
  --output ./data/buses_final.json \
  --export-sql ./data/buses_import.sql
```

**Output**: `data/buses_import.sql` - Ready for database import

## 📈 Phase 5: Quality Analysis

### Check Extraction Quality

```bash
python -c "
import json

with open('./data/cleaned_buses.json', 'r') as f:
    routes = json.load(f)

# Statistics
total = len(routes)
high_conf = sum(1 for r in routes if r.get('confidence_score', 0) >= 0.85)
bidirectional = sum(1 for r in routes if r.get('bidirectional'))
total_stops = sum(len(r.get('stops', [])) for r in routes)

print(f'Total routes: {total}')
print(f'High confidence (≥85%): {high_conf} ({high_conf/total*100:.1f}%)')
print(f'Bidirectional routes: {bidirectional}')
print(f'Total stops: {total_stops}')

# Cities covered
cities = set()
for r in routes:
    cities.add(r.get('origin', ''))
    cities.add(r.get('destination', ''))
cities.discard('')

print(f'Cities covered: {len(cities)}')
print(f'Sample cities: {sorted(list(cities))[:5]}')
"
```

### View Sample Routes

```bash
python -c "
import json

with open('./data/cleaned_buses.json', 'r') as f:
    routes = json.load(f)

# Show first high-confidence route
for route in routes:
    if route.get('confidence_score', 0) >= 0.80:
        print(f\"Route: {route['origin']} → {route['destination']}\")
        print(f\"Time: {route['departure_time']} - {route['arrival_time']}\")
        print(f\"Stops: {len(route.get('stops', []))}\")
        print(f\"Confidence: {route.get('confidence_score', 0):.0%}\")
        break
"
```

## 🗂️ File Structure

```
perundhu/scripts/
├── google_image_bus_scraper.py          # Main scraper (search + OCR + extraction)
├── advanced_bus_image_processor.py      # Symbol detection, multi-page, validation
├── integrate_google_data.py             # Validation, deduplication, merging
├── test_google_image_scraper.py         # Test suite
├── quickstart_check.py                  # Installation verification
├── google_image_requirements.txt        # Python dependencies
├── GOOGLE_IMAGE_EXTRACTOR_README.md     # Full documentation
└── WORKFLOW.md                          # This file

data/
├── extracted_batch/
│   ├── extracted_buses.json             # Raw extracted data
│   └── example_output.json              # Sample output
├── cleaned_buses.json                   # After validation
├── merged_buses.json                    # After merge with existing
├── buses_final.json                     # Final processed data
├── buses_final.csv                      # CSV export
└── buses_import.sql                     # SQL export
```

## 🎯 Common Workflows

### Workflow 1: Quick Test (15 min)

1. Run quickstart check: `python quickstart_check.py`
2. Test with single image: `python google_image_bus_scraper.py --process-image ./test_image.jpg`
3. Check output: `cat data/google_images_bus/extracted_buses.json | python -m json.tool | head -50`

### Workflow 2: Extract One Route (30 min)

1. Search: `python google_image_bus_scraper.py --search "Chennai to Madurai bus" --limit 5`
2. Validate: `python integrate_google_data.py --extracted ./data/google_images_bus/extracted_buses.json --output ./data/result.json`
3. Review: `cat ./data/result.json | python -m json.tool`

### Workflow 3: Batch Extraction for State (2-3 hours)

1. Create `searches.txt` with 20-30 city pairs
2. Run batch: `python google_image_bus_scraper.py --batch-search searches.txt --limit 5`
3. Validate: `python integrate_google_data.py --extracted ... --output ...`
4. Export: `python integrate_google_data.py --extract-csv ./buses.csv --extract-sql ./buses.sql`
5. Import to database using your existing scripts

### Workflow 4: Incremental Updates (Weekly)

1. Find new routes: `python google_image_bus_scraper.py --search "<new route>" --limit 3`
2. Validate: `python integrate_google_data.py --extracted ... --output ...`
3. Merge with existing: `python integrate_google_data.py --extracted ... --existing ... --output ...`
4. Update database

## ⚙️ Configuration Tips

### For Better OCR Accuracy

Use high-resolution images (300+ DPI recommended):

```bash
# If you have low-quality images, try resizing:
python -c "
from PIL import Image
img = Image.open('low_res.jpg')
# Enlarge 3x for better OCR
enlarged = img.resize((img.width*3, img.height*3))
enlarged.save('high_res.jpg')
"
```

### For Faster Processing

Skip validation if you're doing manual review:

```bash
python integrate_google_data.py \
  --extracted ./data/extracted_buses.json \
  --no-validate \
  --output ./data/fast_result.json
```

### For High Confidence Only

Filter before export:

```bash
python -c "
import json

with open('./data/cleaned_buses.json', 'r') as f:
    routes = json.load(f)

# Keep only high confidence
high_conf = [r for r in routes if r.get('confidence_score', 0) >= 0.88]

with open('./data/high_confidence_only.json', 'w') as f:
    json.dump(high_conf, f, indent=2)

print(f'Filtered to {len(high_conf)} high confidence routes')
"
```

## 🐛 Troubleshooting

### Issue: "pytesseract not available"

**Solution**:
```bash
pip install pytesseract
# Also ensure Tesseract is installed:
brew install tesseract  # macOS
```

### Issue: Low OCR Confidence (< 70%)

**Causes**:
- Low image quality
- Poor contrast
- Text too small
- Image noise

**Solutions**:
1. Use higher resolution source images
2. Try manual enhancement in image editor first
3. Check that image actually contains bus schedule

### Issue: No search results

**Solutions**:
1. Check internet connection
2. Try simpler search query
3. Use different city name spelling
4. Try alternative route combinations

### Issue: Extracted data looks wrong

**Check**:
1. Original image quality: `file -i image.jpg`
2. OCR output: Print raw_text field in JSON
3. Confidence score (should be ≥ 0.60)
4. Manual review of image vs extracted data

## 📝 Data Quality Checklist

Before importing to database, verify:

- [ ] Times are in HH:MM format
- [ ] Cities are recognized (in your city database)
- [ ] Departure time < Arrival time (or next day for overnight)
- [ ] At least 3 stops extracted
- [ ] No incomplete routes
- [ ] No duplicates
- [ ] Confidence score ≥ 0.70 (for important routes)
- [ ] No HTML entities in text (like &nbsp;)
- [ ] Proper corporation assignment

## 📞 Support

For issues or questions:
1. Check GOOGLE_IMAGE_EXTRACTOR_README.md for detailed docs
2. Review test cases in test_google_image_scraper.py
3. Check logs for error messages
4. Try with different image/search query

## 🎓 Examples

See example outputs in: `data/google_images_bus/example_output.json`

## 📊 Performance Metrics

- Single image processing: 5-15 seconds
- Batch of 10 images: 1-2 minutes
- 50 search queries (250 images): 30-45 minutes
- Validation/deduplication: <1 second per 100 routes
- Export to SQL: <1 second per 1000 routes

---

**Last Updated**: January 13, 2026
**Version**: 1.0
