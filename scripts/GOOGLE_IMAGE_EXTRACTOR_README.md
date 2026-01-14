# Google Image Bus Schedule Extractor

A comprehensive system to extract bus timing data from images found on Google Images, including OCR extraction, symbol detection, and data normalization to match your existing TNSTC/MTC database format.

## Features

✅ **Search Integration**
- Google Images search with alternative search methods (DuckDuckGo, Bing)
- Support for batch queries
- Configurable result limits

✅ **Image Processing**
- Image enhancement for better OCR accuracy
- Grayscale conversion, resizing, denoising, thresholding
- Multi-page image detection and splitting
- Table structure recognition

✅ **Optical Character Recognition (OCR)**
- pytesseract integration for text extraction
- Confidence scoring
- Structured data extraction (tables, text blocks)

✅ **Symbol & Arrow Detection**
- Arrow symbol detection (→, ←, ↔, etc.)
- Bidirectional route identification
- Route marker symbols
- Both Unicode and visual arrow detection

✅ **Data Extraction & Normalization**
- Automatic time extraction (HH:MM format)
- City/town name detection
- Stop information parsing
- Multi-page handling

✅ **Data Validation & Quality Control**
- Route validation (times, cities, data consistency)
- Stop data cleaning
- Confidence scoring
- Deduplication (exact and similarity-based)

✅ **Output Format**
- Automatic conversion to TNSTC/MTC JSON format
- Compatible with existing database schema
- Metadata preservation (source, confidence, extraction time)

## Installation

### Prerequisites

```bash
# System requirements
# - Python 3.8+
# - Tesseract OCR engine (required by pytesseract)
# - OpenCV support

# macOS (using Homebrew)
brew install tesseract

# Ubuntu/Debian
sudo apt-get install tesseract-ocr

# Windows
# Download from: https://github.com/UB-Mannheim/tesseract/wiki
```

### Python Dependencies

```bash
cd /Users/mchand69/Documents/perundhu

# Install required packages
pip install pillow opencv-python numpy requests pytesseract

# Optional: For better image search capabilities
pip install bing-image-downloader selenium
```

## Usage

### 1. Process Local Image Files

```bash
cd /Users/mchand69/Documents/perundhu/scripts

# Process a single image
python google_image_bus_scraper.py --process-image ./bus_schedule.jpg

# Process multiple images in a directory
for image in ./bus_images/*.jpg; do
    python google_image_bus_scraper.py --process-image "$image"
done
```

### 2. Search and Process Images

```bash
# Search for images and extract data
python google_image_bus_scraper.py \
    --search "Chennai to Madurai bus schedule" \
    --limit 10

# Specify output directory
python google_image_bus_scraper.py \
    --search "Trichy to Coimbatore bus time" \
    --limit 15 \
    --output ./data/google_bus_data
```

### 3. Batch Processing

Create a file `search_queries.txt`:

```
Chennai to Madurai bus schedule image
Trichy to Coimbatore bus timing
Salem to Vellore bus route image
Tiruppur to Chennai bus schedule
Erode to Madurai bus time table
```

Then run:

```bash
python google_image_bus_scraper.py \
    --batch-search search_queries.txt \
    --limit 5
```

### 4. Process from URL

```bash
python google_image_bus_scraper.py \
    --process-url "https://example.com/bus_schedule.jpg"
```

## Output Format

Extracted data is saved as JSON files compatible with your TNSTC/MTC format:

```json
{
  "service_code": "IMGCHNMAD09:30",
  "route_number": "",
  "corporation": "UNKNOWN",
  "origin": "CHENNAI",
  "destination": "MADURAI",
  "departure_time": "09:30",
  "arrival_time": "18:30",
  "duration": "UNKNOWN",
  "available_seats": "UNKNOWN",
  "bus_type": "STANDARD",
  "fare": "UNKNOWN",
  "journey_date": "13/01/2026",
  "stops": [
    {
      "city": "VILLUPURAM",
      "landmark": "VILLUPURAM BUS STAND",
      "time": "11:30"
    },
    {
      "city": "TIRUPATI",
      "landmark": "TIRUPATI",
      "time": "14:00"
    }
  ],
  "extracted_at": "2026-01-13T10:30:45.123456",
  "source": "Google Images",
  "image_source": "https://example.com/bus_image.jpg",
  "confidence_score": 0.87,
  "bidirectional": false
}
```

## Advanced Features

### Symbol Detection

The system automatically detects:
- **Directional Arrows**: → ← ↔
- **Route Symbols**: ●, ■, ○, etc.
- **Bidirectional Routes**: Identified by ↔ or ⇔ symbols
- **Arrow Type Classification**: Forward, Backward, Vertical, Bidirectional

### Multi-Page Image Handling

```python
from advanced_bus_image_processor import MultiPageImageHandler
from PIL import Image

# Split multi-page image
image = Image.open('multi_page_schedule.jpg')
pages = MultiPageImageHandler.split_image_by_pages(image)

# Process each page
for i, page in enumerate(pages):
    print(f"Processing page {i+1}/{len(pages)}")
    # Extract text from page...
```

### Table Structure Recognition

```python
from advanced_bus_image_processor import MultiPageImageHandler

# Detect table rows and columns
image = Image.open('bus_table.jpg')
rows = MultiPageImageHandler.detect_table_structure(image)

print(f"Detected {len(rows)} rows in table")
for row_idx, row in enumerate(rows):
    print(f"Row {row_idx}: {len(row)} cells")
```

### Data Validation

```python
from advanced_bus_image_processor import DataValidator

route = {
    'origin': 'CHENNAI',
    'destination': 'MADURAI',
    'departure_time': '09:30',
    'arrival_time': '18:30',
    'stops': [...]
}

is_valid, errors = DataValidator.validate_bus_route(route)

if is_valid:
    print("Route is valid!")
else:
    print("Validation errors:")
    for error in errors:
        print(f"  - {error}")
```

### Deduplication

```python
from advanced_bus_image_processor import DataDeduplicator

routes = [...]  # Your extracted routes

# Remove exact duplicates
unique = DataDeduplicator.deduplicate_routes(routes, similarity_threshold=0.95)

# Merge similar routes (85% match)
merged = DataDeduplicator.merge_similar_routes(unique, threshold=0.85)

print(f"Reduced {len(routes)} routes to {len(merged)}")
```

## Image Preprocessing Options

The system automatically applies:

1. **Grayscale Conversion**: Reduces color noise
2. **Image Resizing**: 2x upscaling for better OCR accuracy
3. **Denoising**: Bilateral filtering to remove artifacts
4. **Contrast Enhancement**: 1.5x contrast boost
5. **Sharpness Enhancement**: 2x sharpness increase
6. **Brightness Adjustment**: 1.1x brightness boost
7. **Thresholding**: Otsu's binary thresholding

## Configuration

### OCR Configuration

```python
from google_image_bus_scraper import OCRExtractor

ocr = OCRExtractor()

# Extract with confidence
text, confidence = ocr.extract_text_with_confidence(image)

# Extract structured data
structure = ocr.extract_structure(image)
print(f"Lines detected: {len(structure['lines'])}")
print(f"Confidence: {structure['confidence']:.2%}")
```

### Search Configuration

```python
from google_image_bus_scraper import GoogleImageSearcher

searcher = GoogleImageSearcher(max_retries=3)

# Search with retry handling
urls = searcher.search_images(
    query="Chennai to Madurai bus schedule",
    limit=10
)
```

### Analyzer Configuration

```python
from google_image_bus_scraper import BusImageAnalyzer

analyzer = BusImageAnalyzer(output_dir='./data/bus_images')

# Process with custom output directory
analyzer.search_and_process("Chennai to Madurai", limit=5)

# Get summary
summary = analyzer.get_summary()
print(f"Extracted {summary['total_routes']} routes")
print(f"Total stops: {summary['total_stops']}")
print(f"Average confidence: {summary['avg_confidence']:.2%}")
```

## Data Integration with Existing Database

The extracted data can be directly integrated with your existing TNSTC/MTC database:

```bash
# 1. Extract data from images
python google_image_bus_scraper.py \
    --search "Tamil Nadu bus schedules" \
    --output ./data/google_extracted

# 2. Validate and deduplicate
python validate_and_merge.py \
    --input ./data/google_extracted/extracted_buses.json \
    --output ./data/google_extracted/validated_buses.json

# 3. Import to database
# Use your existing import scripts:
# python upload_bus_data.py --file ./data/google_extracted/validated_buses.json
```

## Troubleshooting

### OCR Not Working

```bash
# Verify pytesseract installation
python -c "import pytesseract; print(pytesseract.pytesseract.pytesseract_cmd)"

# If not found, set path manually:
# export PYTESSERACT_CMD=/usr/local/bin/tesseract  # macOS
# export PYTESSERACT_CMD=/usr/bin/tesseract        # Linux
```

### Low OCR Accuracy

1. **Improve image quality**:
   - Use high-resolution images (300+ DPI)
   - Ensure good lighting
   - Minimize shadows and glare

2. **Try different preprocessing**:
   - Adjust contrast and brightness
   - Experiment with threshold values
   - Resize to different scales

3. **Manual adjustment**:
   - Set `--image-enhancement` flag
   - Increase scale in preprocessing

### Search Not Finding Images

1. **Check query quality**:
   - Use specific location names
   - Include "bus" and "schedule" keywords
   - Try alternative route names

2. **Increase limits**:
   - Set `--limit` to higher value
   - Try multiple queries for same route

3. **Use alternative search engines**:
   - Some images may only be on specific search engines
   - Try different query formulations

## Integration with Existing Scripts

### With TNSTC Scraper

```bash
# Extract from Google Images
python google_image_bus_scraper.py --search "Tamil Nadu buses" --limit 20

# Combine with TNSTC scraper output
python combine_sources.py \
    --google ./data/google_extracted/extracted_buses.json \
    --tnstc ../data/tnstc_buses.json \
    --output ./data/combined_buses.json
```

### With MTC Scraper

```bash
# Similar approach for Chennai MTC buses
python google_image_bus_scraper.py \
    --search "Chennai city bus MTC" \
    --limit 15 \
    --output ./data/mtc_google_extracted
```

## Performance Considerations

| Operation | Typical Time | Notes |
|-----------|-------------|-------|
| Image download | 1-3 sec | Depends on internet speed |
| Image preprocessing | 0.5-2 sec | Varies with image size |
| OCR extraction | 2-5 sec | Depends on image quality |
| Symbol detection | 0.1-0.5 sec | Fast |
| Data validation | 0.01 sec | Per route |
| Full image processing | 5-15 sec | Total per image |

**Batch processing 10 images**: ~1-2 minutes

## Advanced Usage Examples

### Example 1: Extract with Custom Preprocessing

```python
from google_image_bus_scraper import BusImageAnalyzer, ImagePreprocessor
from PIL import Image

analyzer = BusImageAnalyzer()
image = Image.open('bus_schedule.jpg')

# Custom preprocessing
image = ImagePreprocessor.resize_image(image, scale=3.0)
image = ImagePreprocessor.denoise_image(image)
image = ImagePreprocessor.enhance_image(image)

# Extract
route = analyzer.processor.normalize_route(
    text=analyzer.ocr.extract_text(image),
    image_source='bus_schedule.jpg'
)
```

### Example 2: Detect Multi-Page Schedules

```python
from advanced_bus_image_processor import MultiPageImageHandler
from google_image_bus_scraper import BusImageAnalyzer
from PIL import Image

image = Image.open('multi_page_bus_table.jpg')
pages = MultiPageImageHandler.split_image_by_pages(image)

analyzer = BusImageAnalyzer()
all_routes = []

for page in pages:
    text = analyzer.ocr.extract_text(page)
    route = analyzer.processor.normalize_route(text, image_source='multi_page')
    if route:
        all_routes.append(route)

print(f"Extracted {len(all_routes)} routes from {len(pages)} pages")
```

### Example 3: High-Confidence Extraction Only

```python
from google_image_bus_scraper import BusImageAnalyzer

analyzer = BusImageAnalyzer()

# Search and process with confidence filtering
routes = analyzer.search_and_process("Chennai to Madurai", limit=20)

# Filter by confidence
high_confidence = [r for r in routes if r.confidence_score >= 0.85]

print(f"Total extracted: {len(routes)}")
print(f"High confidence (≥85%): {len(high_confidence)}")

# Save only high confidence results
analyzer.extracted_routes = high_confidence
analyzer.save_results('high_confidence_buses.json')
```

## Limitations & Recommendations

### Current Limitations

1. **Direct Google Images API** requires authentication
   - Solution: Using alternative search engines (DuckDuckGo, Bing)
   
2. **OCR Accuracy** varies with image quality
   - Solution: Use high-quality images (300+ DPI)

3. **Manual verification needed** for critical data
   - Solution: Confidence scores help identify uncertain entries

4. **Symbol detection** may miss some route markers
   - Solution: Manual review of bidirectional/special routes

### Recommendations

1. **Start with high-confidence results** (≥80%)
2. **Manually verify** a sample before bulk import
3. **Use in combination** with TNSTC/MTC scrapers for completeness
4. **Regular updates** as new schedules become available
5. **Quality control** by checking extracted stops against known routes

## Future Enhancements

- [ ] Direct Google Images API integration (requires API key)
- [ ] Advanced table parsing with cell recognition
- [ ] Multi-language support (Hindi, Tamil, etc.)
- [ ] Handwritten schedule detection
- [ ] Real-time image capture and extraction
- [ ] Mobile app integration
- [ ] Crowdsourced schedule verification
- [ ] AI model fine-tuning for better accuracy

## Support & Debugging

### Enable Verbose Logging

```bash
python google_image_bus_scraper.py \
    --search "Chennai to Madurai" \
    --log-level DEBUG
```

### Check Extraction Quality

```python
from google_image_bus_scraper import BusImageAnalyzer

analyzer = BusImageAnalyzer()
route = analyzer.process_local_image('test_image.jpg')

if route:
    print(f"Service Code: {route.service_code}")
    print(f"Route: {route.origin} → {route.destination}")
    print(f"Time: {route.departure_time} - {route.arrival_time}")
    print(f"Confidence: {route.confidence_score:.2%}")
    print(f"Stops: {len(route.stops)}")
    print(f"Bidirectional: {route.bidirectional}")
```

---

**Last Updated**: January 13, 2026
**Version**: 1.0
**Author**: Perundhu Project Team
