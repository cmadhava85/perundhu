# Google Image Bus Scraper - Architecture & Data Flow

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    GOOGLE IMAGE BUS SCRAPER                     │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│                        INPUT SOURCES                             │
├──────────────────────────────────────────────────────────────────┤
│  • Search queries (text)                                        │
│  • Image URLs                                                   │
│  • Local image files                                            │
│  • Batch query files                                            │
└──────────────────────────────────────────────────────────────────┘
           ↓
┌──────────────────────────────────────────────────────────────────┐
│              1. GOOGLE IMAGE SEARCH ENGINE                      │
├──────────────────────────────────────────────────────────────────┤
│  google_image_bus_scraper.py::GoogleImageSearcher               │
│                                                                 │
│  • Parse search query                                           │
│  • Query Bing Images API                                        │
│  • Query DuckDuckGo Images                                      │
│  • Download image with retries                                  │
│  • Handle rate limiting                                         │
└──────────────────────────────────────────────────────────────────┘
           ↓ [Image URLs/Files]
┌──────────────────────────────────────────────────────────────────┐
│           2. IMAGE PREPROCESSING PIPELINE                        │
├──────────────────────────────────────────────────────────────────┤
│  google_image_bus_scraper.py::ImagePreprocessor                 │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Input: Raw Image (RGB/Color)                           │   │
│  └────────────────────┬────────────────────────────────────┘   │
│                       ↓                                         │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 1. Grayscale Conversion                                │   │
│  │    RGB → Grayscale (L-mode)                            │   │
│  └────────────────────┬────────────────────────────────────┘   │
│                       ↓                                         │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 2. Image Resizing                                       │   │
│  │    2x upscaling for better OCR (300→600 DPI equiv.)    │   │
│  └────────────────────┬────────────────────────────────────┘   │
│                       ↓                                         │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 3. Denoising                                            │   │
│  │    Bilateral filtering (σ=9, σ_color=75, σ_space=75)  │   │
│  └────────────────────┬────────────────────────────────────┘   │
│                       ↓                                         │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 4. Contrast Enhancement                                │   │
│  │    Increase contrast by 1.5x                           │   │
│  └────────────────────┬────────────────────────────────────┘   │
│                       ↓                                         │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 5. Sharpness Enhancement                               │   │
│  │    Increase sharpness by 2.0x                          │   │
│  └────────────────────┬────────────────────────────────────┘   │
│                       ↓                                         │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 6. Brightness Adjustment                               │   │
│  │    Increase brightness by 1.1x                         │   │
│  └────────────────────┬────────────────────────────────────┘   │
│                       ↓                                         │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 7. Thresholding (Otsu's Binary)                        │   │
│  │    Convert to pure black & white                       │   │
│  └────────────────────┬────────────────────────────────────┘   │
│                       ↓                                         │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Output: Optimized Image (Ready for OCR)               │   │
│  └─────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
           ↓
┌──────────────────────────────────────────────────────────────────┐
│           3. MULTI-PAGE DETECTION (Optional)                     │
├──────────────────────────────────────────────────────────────────┤
│  advanced_bus_image_processor.py::MultiPageImageHandler         │
│                                                                 │
│  • Edge detection (Canny)                                       │
│  • Contour finding                                              │
│  • Page boundary detection                                      │
│  • Image splitting if needed                                    │
│  • Table structure recognition                                  │
└──────────────────────────────────────────────────────────────────┘
           ↓
┌──────────────────────────────────────────────────────────────────┐
│           4. OCR EXTRACTION (pytesseract)                        │
├──────────────────────────────────────────────────────────────────┤
│  google_image_bus_scraper.py::OCRExtractor                      │
│                                                                 │
│  Tesseract OCR Engine (--psm 6: Uniform text blocks)           │
│  ↓                                                              │
│  Extract: Raw text + confidence scores                         │
│  ↓                                                              │
│  Structured data:                                              │
│  • Lines of text                                               │
│  • Text blocks with coordinates                                │
│  • Word-level confidence                                       │
└──────────────────────────────────────────────────────────────────┘
           ↓ [OCR Text, Structured Data]
┌──────────────────────────────────────────────────────────────────┐
│           5. SYMBOL DETECTION (Parallel)                        │
├──────────────────────────────────────────────────────────────────┤
│  advanced_bus_image_processor.py::SymbolDetector                │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ A. Unicode Symbol Detection                            │   │
│  │    • Scan text for: → ← ↔ ⇒ ⇐ ⇔ ↑ ↓ etc.          │   │
│  │    • Classify as: forward/backward/bidirectional      │   │
│  │    • High confidence (95%)                            │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ B. Visual Arrow Detection                              │   │
│  │    • Create arrow templates (→ ← ↔)                   │   │
│  │    • Template matching in image                        │   │
│  │    • Find arrow positions                              │   │
│  │    • Classify direction                                │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Result: Direction type (→ ← ↔ ↑ ↓) + confidence              │
└──────────────────────────────────────────────────────────────────┘
           ↓ [Symbols]
┌──────────────────────────────────────────────────────────────────┐
│           6. DATA EXTRACTION & PARSING                          │
├──────────────────────────────────────────────────────────────────┤
│  google_image_bus_scraper.py::DataExtractor                    │
│                                                                 │
│  • Time extraction: Regex matching for HH:MM format            │
│  • City extraction: Match against known Tamil Nadu cities      │
│  • Stop extraction: Parse lines with time + city               │
│  • Bidirectional detection: Check symbols + keywords           │
│  • Pattern matching: Route numbers, fare, bus type             │
│                                                                 │
│  Output:                                                        │
│  • Times: ["09:30", "18:30", ...]                              │
│  • Cities: ["CHENNAI", "MADURAI"]                              │
│  • Stops: [BusStop(...), BusStop(...)]                         │
│  • Bidirectional: bool                                         │
└──────────────────────────────────────────────────────────────────┘
           ↓ [Structured Data]
┌──────────────────────────────────────────────────────────────────┐
│           7. DATA NORMALIZATION                                 │
├──────────────────────────────────────────────────────────────────┤
│  google_image_bus_scraper.py::BusDataProcessor                 │
│                                                                 │
│  Raw Data → BusRoute Object:                                   │
│  • origin: "CHENNAI"                                           │
│  • destination: "MADURAI"                                      │
│  • departure_time: "09:30"                                     │
│  • arrival_time: "18:30"                                       │
│  • stops: [...]                                                │
│  • confidence_score: 0.87                                      │
│  • bidirectional: False                                        │
│                                                                 │
│  BusRoute → TNSTC/MTC JSON Format                              │
└──────────────────────────────────────────────────────────────────┘
           ↓ [Normalized BusRoute]
┌──────────────────────────────────────────────────────────────────┐
│           8. VALIDATION & CLEANING                              │
├──────────────────────────────────────────────────────────────────┤
│  advanced_bus_image_processor.py::DataValidator                 │
│                                                                 │
│  • Time format validation: HH:MM ✓                             │
│  • City name validation: Known cities ✓                        │
│  • Route consistency: Departure < Arrival ✓                    │
│  • Stop data cleaning: Remove invalid entries                  │
│  • Flag invalid routes ✗                                       │
│  • Generate error reports                                      │
└──────────────────────────────────────────────────────────────────┘
           ↓ [Valid Routes Only]
┌──────────────────────────────────────────────────────────────────┐
│           9. DEDUPLICATION                                      │
├──────────────────────────────────────────────────────────────────┤
│  advanced_bus_image_processor.py::DataDeduplicator              │
│                                                                 │
│  A. Exact Deduplication:                                       │
│     • Hash: origin + destination + departure_time              │
│     • Keep highest confidence if duplicates                    │
│                                                                 │
│  B. Similarity-Based Merging:                                  │
│     • Score: 0-1 based on route similarity                    │
│     • Merge if similarity ≥ 85%                               │
│     • Combine stops from similar routes                       │
└──────────────────────────────────────────────────────────────────┘
           ↓ [Deduplicated Routes]
┌──────────────────────────────────────────────────────────────────┐
│           10. MERGE WITH EXISTING DATA (Optional)               │
├──────────────────────────────────────────────────────────────────┤
│  integrate_google_data.py::BusDataIntegrator                   │
│                                                                 │
│  • Load existing TNSTC/MTC data                                │
│  • Compare by hash (origin + dest + time)                      │
│  • Add new routes not in existing                              │
│  • Update if new has higher confidence                         │
│  • Statistics: routes added, updated                           │
└──────────────────────────────────────────────────────────────────┘
           ↓ [Merged Data]
┌──────────────────────────────────────────────────────────────────┐
│           11. EXPORT & STORAGE                                  │
├──────────────────────────────────────────────────────────────────┤
│  integrate_google_data.py (Export functions)                   │
│                                                                 │
│  Format Options:                                               │
│  • JSON (TNSTC compatible)                                     │
│  • CSV (Excel/Google Sheets)                                   │
│  • SQL (Database INSERT statements)                            │
└──────────────────────────────────────────────────────────────────┘
           ↓
┌──────────────────────────────────────────────────────────────────┐
│                        OUTPUT                                    │
├──────────────────────────────────────────────────────────────────┤
│  • extracted_buses.json (Raw extracted data)                    │
│  • cleaned_buses.json (After validation)                        │
│  • merged_buses.json (After merge with existing)                │
│  • buses.csv (For Excel/Sheets)                                 │
│  • buses.sql (For database import)                              │
│  • example_output.json (Sample format)                          │
└──────────────────────────────────────────────────────────────────┘
```

## 🔄 Data Flow Diagram

```
Search Query
     ↓
┌────────────────────────┐
│ Image Search Engine    │──→ [Image URLs]
│ (Bing/DuckDuckGo)     │
└────────────────────────┘
     ↓
[Download Images]
     ↓
┌────────────────────────────────────────┐
│ For each image:                        │
├────────────────────────────────────────┤
│                                        │
│  Image Preprocessing ──→ Optimized    │
│  ↓                       Image         │
│  OCR Extraction ────→ Raw Text         │
│  ↓                                     │
│  Symbol Detection ──→ Route Type       │
│  ↓                   (→ ← ↔)          │
│  Multi-Page Check ─→ Individual Pages │
│  ↓                                     │
│  Data Extraction ───→ Times, Cities,   │
│  ↓                   Stops             │
│  Normalization ─────→ BusRoute Object  │
│                      (JSON-compatible) │
└────────────────────────────────────────┘
     ↓
[Collected Routes]
     ↓
┌────────────────────────────────────────┐
│ Validation                             │
│ • Format checks                        │
│ • Data consistency                     │
│ • City/time validation                 │
└────────────────────────────────────────┘
     ↓
[Valid Routes]
     ↓
┌────────────────────────────────────────┐
│ Deduplication                          │
│ • Remove exact duplicates              │
│ • Merge similar routes                 │
│ • Keep highest confidence              │
└────────────────────────────────────────┘
     ↓
[Unique Routes]
     ↓
┌────────────────────────────────────────┐
│ Optional: Merge with Existing Data     │
│ • Compare by hash                      │
│ • Add new routes                       │
│ • Update confidence                    │
└────────────────────────────────────────┘
     ↓
[Final Routes]
     ↓
┌────────────────────────────────────────┐
│ Export                                 │
│ • JSON output                          │
│ • CSV export                           │
│ • SQL export                           │
└────────────────────────────────────────┘
     ↓
[Deliverables: JSON/CSV/SQL]
```

## 📊 Confidence Scoring

```
Raw Extraction (100% score possible):
  ├─ OCR Text Confidence: 0-100% (from tesseract)
  ├─ Time Extraction: Exact match = +20%
  ├─ City Recognition: Known city = +20%
  ├─ Stop Parsing: Valid stops = +20%
  ├─ Symbol Detection: Found symbols = +20%
  └─ Format Validation: Valid data = +20%

Final Score Calculation:
  confidence = (ocr_confidence + additional_score) / 2

Examples:
  • Perfect extraction, clear image: 0.95 (95%)
  • Good extraction, some OCR errors: 0.80 (80%)
  • Fair extraction, uncertain data: 0.65 (65%)
  • Poor extraction, many errors: 0.40 (40%)
```

## 🎯 Processing Pipeline Stages

```
Stage 1: DISCOVERY (5%)
└─ Search for images
  └─ Download candidates
  └─ Validate image format

Stage 2: EXTRACTION (35%)
└─ Preprocess image
  └─ Run OCR
  └─ Extract symbols
  └─ Parse data structures

Stage 3: NORMALIZATION (25%)
└─ Extract key data
  └─ Parse times/cities/stops
  └─ Generate route object
  └─ Convert to standard format

Stage 4: VALIDATION (15%)
└─ Check data format
  └─ Validate city names
  └─ Verify times
  └─ Clean stops

Stage 5: CONSOLIDATION (15%)
└─ Deduplicate
  └─ Merge similar
  └─ Integrate with existing
  └─ Export results
```

## 🗂️ Module Dependencies

```
google_image_bus_scraper.py
├─ Uses: PIL, cv2, numpy, requests, pytesseract
├─ Provides: OCRExtractor, DataExtractor, GoogleImageSearcher, BusImageAnalyzer
└─ Exports: BusRoute, BusStop

advanced_bus_image_processor.py
├─ Uses: cv2, numpy, pytesseract
├─ Depends on: google_image_bus_scraper (for BusStop type)
├─ Provides: SymbolDetector, MultiPageImageHandler, DataValidator, DataDeduplicator
└─ Exports: SymbolDetection

integrate_google_data.py
├─ Uses: json, csv, logging, datetime
├─ Depends on: advanced_bus_image_processor
├─ Provides: BusDataIntegrator, export functions
└─ Exports: Functions for validation, export, comparison

test_google_image_scraper.py
├─ Uses: All above modules
├─ Provides: Comprehensive test suite
└─ Validates: All functionality

quickstart_check.py
├─ Checks: Dependencies, imports, basic functionality
└─ Provides: Installation verification
```

---

This architecture supports:
- ✅ Scalable batch processing
- ✅ Parallel operations where applicable
- ✅ Error handling and recovery
- ✅ Quality assessment at each stage
- ✅ Flexible input/output formats
- ✅ Integration with existing systems
