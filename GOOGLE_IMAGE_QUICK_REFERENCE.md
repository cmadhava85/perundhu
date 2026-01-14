# Google Image Scraper - Quick Reference

## ⚡ Quick Start

```bash
cd /Users/mchand69/Documents/perundhu

# Default (recommended - all features enabled)
source .venv/bin/activate
python scripts/google_image_bus_scraper.py \
  --search "Chennai to Madurai bus schedule" \
  --limit 10

# View results
cat data/google_images_bus/extracted_buses.json | python -m json.tool | head -50
```

## 🎯 Common Use Cases

### Use Case 1: Single Route Extraction (Best Quality)
```bash
python scripts/google_image_bus_scraper.py \
  --search "Chennai to Madurai" \
  --limit 15 \
  --image-size large \
  --output ./data/chennai_madurai
```
**Features**: Large images for better OCR, unlimited results

### Use Case 2: Fast Batch Processing
```bash
python scripts/google_image_bus_scraper.py \
  --search "Trichy to Coimbatore" \
  --limit 5 \
  --no-enhance-query \
  --output ./data/batch_fast
```
**Features**: Minimal keywords, faster searches

### Use Case 3: Duplicate-Free Extraction
```bash
python scripts/google_image_bus_scraper.py \
  --batch-search ./queries.txt \
  --limit 10 \
  --output ./data/clean_extraction
```
**Features**: Dedup enabled (default), processes multiple queries

### Use Case 4: Verify with Image Links
```bash
# After running extraction:
# Open extracted_buses.json and click on image_source URLs
# Each entry has direct link to original image
```

## 📋 Output Format

### JSON Structure (New Fields Highlighted)
```json
[
  {
    "service_code": "IMGCHNMAD09:30",
    "origin": "CHENNAI",
    "destination": "MADURAI",
    "departure_time": "09:30",
    "arrival_time": "18:45",
    "image_source": "https://...",        // ← NEW: Click to verify
    "confidence_score": 0.87,              // ← NEW: Quality metric
    "stops": [...],
    "extracted_at": "2026-01-13T10:30:45"
  }
]
```

## 🔧 CLI Flags

```
--search QUERY           # Search query
--limit N                # Max images (default: 10)
--output PATH            # Output dir (default: ./data/google_images_bus)
--image-size SIZE        # small|medium|large|extra-large (default: medium)
--no-enhance-query       # Disable keyword enhancement
--no-dedup               # Disable duplicate detection
--batch-search FILE      # Process queries from file
--process-image PATH     # Process local image
--process-url URL        # Process image from URL
```

## 📊 Quality Metrics

### Confidence Score
- **0.90+**: Excellent OCR quality
- **0.70-0.90**: Good quality (usable)
- **< 0.70**: Poor quality (manual review recommended)

### Check Quality
```bash
# Find low-confidence extractions
cat data/google_images_bus/extracted_buses.json | \
  python -c "import sys, json; \
  data = json.load(sys.stdin); \
  low = [d for d in data if d.get('confidence_score', 0) < 0.70]; \
  print(f'Low confidence: {len(low)}')"
```

## 🐛 Troubleshooting

### No Images Found
```bash
# Use query enhancement (default enabled)
python scripts/google_image_bus_scraper.py \
  --search "bus time" \
  --limit 20

# If still no results, try more generic:
python scripts/google_image_bus_scraper.py \
  --search "bus schedule" \
  --limit 10
```

### Getting Duplicates
```bash
# Duplicate detection is enabled by default
# If still seeing duplicates, ensure latest version:
git pull origin master
```

### Poor OCR Quality
```bash
# Request larger images for better OCR
python scripts/google_image_bus_scraper.py \
  --search "Chennai Madurai bus" \
  --image-size large \
  --limit 10
```

### Want to Verify Extraction?
```bash
# Simply click image_source URL in JSON output
# Each route now includes the image link
```

## 💡 Tips & Tricks

### Tip 1: Enhanced Queries (ON by default)
Query: "bus schedule" → Auto-enhanced to "bus schedule timing time table"
- More relevant results
- Better quality images
- Takes same time as basic search

### Tip 2: Batch Processing
```bash
# Create search_queries.txt
echo "Chennai to Madurai" >> search_queries.txt
echo "Trichy to Coimbatore" >> search_queries.txt
echo "Salem to Bangalore" >> search_queries.txt

# Process all at once
python scripts/google_image_bus_scraper.py \
  --batch-search search_queries.txt \
  --limit 10
```

### Tip 3: Dedup by Default
- No duplicates in results (✅ automatic)
- Each image processed only once
- ~50% reduction in processing time
- Can disable with `--no-dedup` if needed

### Tip 4: Image Verification Workflow
1. Run extraction
2. Open extracted_buses.json
3. For each entry, click `image_source` URL
4. Visually verify OCR quality
5. Remove entries with wrong data
6. Import to database

## 📈 Performance Expectations

### Single Search
- **Query Time**: 2-3 seconds
- **Image Download**: 30-60 seconds (10 images)
- **OCR Processing**: 20-50 seconds (10 images)
- **Total**: ~1-2 minutes per search

### Batch Processing
- **5 Queries × 10 images each**: ~10 minutes
- **10 Queries × 10 images**: ~20 minutes

### Deduplication
- **Duplicate Detection**: < 1ms per image
- **Hash Computation**: < 100ms per image
- **Total Impact**: Negligible (< 2% overhead)

## ✅ Verification Checklist

Before using extracted data:
- [ ] Confidence score ≥ 0.70
- [ ] Image URL is clickable
- [ ] Time format is HH:MM (24-hour)
- [ ] Cities match expectations
- [ ] Departure < Arrival (or overnight)
- [ ] No HTML entities in text

## 🔍 Example Verification

```bash
# Verify output structure
python -c "
import json
with open('data/google_images_bus/extracted_buses.json') as f:
    data = json.load(f)
    print(f'✅ Routes extracted: {len(data)}')
    for route in data[:2]:
        print(f\"  {route['origin']} → {route['destination']}\")
        print(f\"  Time: {route['departure_time']} - {route['arrival_time']}\")
        print(f\"  Image: {route.get('image_source', 'N/A')[:60]}...\")
        print(f\"  Confidence: {route.get('confidence_score', 0):.2%}\")
"
```

---

**Version**: 2.1 | **Date**: Jan 13, 2026  
**Features**: ✅ Deduplication | ✅ Image URLs | ✅ Enhanced Search
