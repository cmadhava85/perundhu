# Bus Data Upload with Tamil Translation - Implementation Guide

## Overview

This guide documents the complete implementation for uploading MTC/TNSTC bus data to the database with structured format and automatic Tamil language translation support.

## Components

### 1. Data Transformation Script (`transform_flat_bus_data.py`)

**Purpose:** Converts flat bus timing data to structured format with empty stops array

**Input Format:**
```json
{
  "route_number": "101",
  "origin_name": "M.G.R KOYAMBEDU",
  "destination_name": "ANNA NAGAR EAST",
  "timing": "20:07"
}
```

**Output Format:**
```json
{
  "route_number": "101",
  "origin": "M.G.R KOYAMBEDU",
  "destination": "ANNA NAGAR EAST",
  "stops": []
}
```

**Usage:**
```bash
# Transform MTC data
python scripts/transform_flat_bus_data.py \
  --input data/mtc_all_routes_complete.json \
  --operator MTC \
  --output-dir data/

# Transform TNSTC data
python scripts/transform_flat_bus_data.py \
  --input data/tnstc_data.json \
  --operator TNSTC \
  --output-dir data/
```

**Output Files:**
- `data/mtc_structured.json` - Structured routes in JSON
- `data/mtc_bus_timings.checkpoint.json` - Checkpoint file for upload script

### 2. Tamil Translation Module (`tamil_translator.py`)

**Purpose:** Provides translation services from English to Tamil

**Features:**
- Offline Tamil dictionary (100+ location translations)
- Optional Google Translate API integration
- Translation caching for performance
- Batch translation support

**Supported Locations:**
- Major Tamil Nadu cities (Madurai, Salem, Coimbatore, etc.)
- Chennai localities (Broadway, Anna Nagar, Koyambedu, etc.)
- Common bus stop names

**Translation Methods:**
1. **Offline Dictionary** (default) - Fast, no API calls needed
2. **Google Translate API** (optional) - More comprehensive, requires credentials

**Usage:**
```python
from tamil_translator import TamilTranslator

# Initialize with offline dictionary
translator = TamilTranslator(use_api=False)

# Translate a location
tamil_name = translator.translate_location("BROADWAY")
# Output: "பாடாவே"

# Batch translate
locations = ["BROADWAY", "ANNA NAGAR", "SALEM"]
results = translator.get_batch_translations(locations)

# Save cache
translator.save_cache()
```

**Database Storage:**
Translations are stored in the `translations` table:
```sql
CREATE TABLE translations (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    entity_type VARCHAR(50),           -- 'location', 'bus', etc.
    entity_id BIGINT,                  -- Foreign key to locations.id
    language_code VARCHAR(10),         -- 'ta' for Tamil
    field_name VARCHAR(50),            -- 'name', 'description', etc.
    translated_value TEXT,             -- Translated text
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

### 3. Enhanced Upload Script (`upload_bus_data.py`)

**Purpose:** Upload structured bus data to database with Tamil translations

**New Features:**
- ✅ Tamil translation integration
- ✅ Translations table population
- ✅ Empty stops array support
- ✅ Multi-operator support (MTC, TNSTC)
- ✅ Transaction management
- ✅ Duplicate detection
- ✅ Location caching

**Table Coverage:**
1. **locations** - All origin, destination, and stop locations
2. **buses** - Bus routes with origin/destination
3. **stops** - Currently empty (can be populated separately)
4. **connecting_routes** - Connections between consecutive stops
5. **translations** - Tamil translations for all locations

**Usage:**

```bash
# Basic upload (no translations)
python scripts/upload_bus_data.py \
  --operator MTC \
  --environment local

# Upload with Tamil translations
python scripts/upload_bus_data.py \
  --operator MTC \
  --environment local \
  --enable-translation

# Upload TNSTC data with translations
python scripts/upload_bus_data.py \
  --operator TNSTC \
  --environment preprod \
  --enable-translation

# Production deployment
python scripts/upload_bus_data.py \
  --operator MTC \
  --environment prod \
  --enable-translation
```

**Command-line Options:**
- `--operator` - Bus operator (MTC or TNSTC)
- `--environment` - Deployment environment (local, preprod, prod)
- `--enable-translation` - Enable Tamil language translation
- `--dry-run` - Validate without uploading

**Output Statistics:**
```
============================================================
Upload Statistics:
  Operator: Metropolitan Transport Corporation (MTC)
  Locations Created: 250
  Locations Skipped (duplicates): 45
  Buses Created: 1250
  Stops Created: 0
  Connecting Routes Created: 1200
  Tamil Translations Created: 250
  Errors: 0
============================================================
```

## Complete Workflow

### Step 1: Transform Raw Data

```bash
# Transform MTC flat data to structured format
python scripts/transform_flat_bus_data.py \
  --input data/mtc_all_routes_complete.json \
  --operator MTC
```

**Output:**
- `data/mtc_structured.json` (human-readable structured data)
- `data/mtc_bus_timings.checkpoint.json` (ready for upload)

### Step 2: Upload to Database

```bash
# Upload with Tamil translations
python scripts/upload_bus_data.py \
  --operator MTC \
  --environment local \
  --enable-translation
```

**What Happens:**
1. ✅ Creates location records in `locations` table
2. ✅ Creates bus records in `buses` table (with empty stops)
3. ✅ Creates connecting routes in `connecting_routes` table
4. ✅ Translates location names to Tamil
5. ✅ Stores translations in `translations` table
6. ✅ Manages transactions with rollback on error

### Step 3: Verify Data

```bash
# Check uploaded locations
mysql -h localhost -u root -p perundhu -e \
  "SELECT COUNT(*) as total_locations FROM locations WHERE category = 'MTC';"

# Check translations
mysql -h localhost -u root -p perundhu -e \
  "SELECT COUNT(*) as total_translations FROM translations WHERE language_code = 'ta';"

# Sample translations
mysql -h localhost -u root -p perundhu -e \
  "SELECT l.name, t.translated_value 
   FROM locations l 
   JOIN translations t ON l.id = t.entity_id AND t.entity_type = 'location'
   WHERE t.language_code = 'ta' AND l.category = 'MTC'
   LIMIT 10;"
```

## Architecture Diagram

```
Raw Data (MTC/TNSTC)
        ↓
[transform_flat_bus_data.py]
        ↓
Structured Data with empty stops
        ↓
[upload_bus_data.py]
    ↙   ↓   ↘
  ↙     ↓      ↘
locations  buses  connecting_routes
  ↓            ↓
[tamil_translator.py] ← (if --enable-translation)
  ↓
translations table (Tamil)
```

## Database Schema Coverage

### locations Table
```sql
CREATE TABLE locations (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255),           -- English name
    category VARCHAR(50),        -- 'MTC', 'TNSTC', etc.
    type VARCHAR(50),           -- 'bus_stop', 'bus_terminal'
    latitude DOUBLE,
    longitude DOUBLE,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

### buses Table
```sql
CREATE TABLE buses (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    route_number VARCHAR(50),
    origin_location_id BIGINT,        -- FK to locations
    destination_location_id BIGINT,   -- FK to locations
    operator VARCHAR(50),             -- 'MTC', 'TNSTC'
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

### stops Table (populated separately)
```sql
CREATE TABLE stops (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    bus_id BIGINT,                    -- FK to buses
    location_id BIGINT,               -- FK to locations
    stop_order INT,
    arrival_time TIME,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

### connecting_routes Table
```sql
CREATE TABLE connecting_routes (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    from_location_id BIGINT,          -- FK to locations
    to_location_id BIGINT,            -- FK to locations
    bus_id BIGINT,                    -- FK to buses
    travel_time_minutes INT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

### translations Table
```sql
CREATE TABLE translations (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    entity_type VARCHAR(50),          -- 'location', 'bus'
    entity_id BIGINT,                 -- FK to entity (location.id)
    language_code VARCHAR(10),        -- 'ta' for Tamil
    field_name VARCHAR(50),           -- 'name'
    translated_value TEXT,            -- Tamil translation
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

## Tamil Dictionary Coverage

The offline Tamil dictionary includes:
- 50+ major Tamil Nadu cities
- 30+ Chennai neighborhoods
- Common bus stop names
- Easily extensible for new locations

**Example Mappings:**
| English | Tamil |
|---------|-------|
| BROADWAY | பாடாவே |
| ANNA NAGAR | அண்ணா நகர் |
| KOYAMBEDU | கோயம்பேடு |
| MADURAI | மதுரை |
| SALEM | சேலம் |
| COIMBATORE | கோயம்பூர் |

## Extending the Tamil Dictionary

To add new location translations, edit `tamil_translator.py`:

```python
TAMIL_DICTIONARY = {
    # ... existing entries ...
    'NEW_LOCATION': 'நவ_இடம்_தமிழ்',
    # ... more entries ...
}
```

## Error Handling & Recovery

### Connection Failures
```
ERROR: Database connection failed
RECOVERY: Check database credentials and network connectivity
```

### Duplicate Detection
- Uses 80% fuzzy matching to prevent duplicate locations
- Logs skipped locations for review

### Transaction Rollback
- On error: All changes in transaction are rolled back
- Prevents partial data insertion
- Clean state for retry

### Missing Translations
- Locations without Tamil translations are still inserted
- Translation insertion failures don't block data upload
- Can be retried later

## Performance Considerations

1. **Location Caching** - In-memory cache for location lookups (reduces DB queries)
2. **Translation Caching** - Disk-based cache for translations (survives restarts)
3. **Batch Processing** - Processes routes in configurable batches
4. **Fuzzy Matching** - 80% threshold avoids expensive comparisons

## Troubleshooting

### Q: Tamil translations not appearing?
**A:** 
- Enable with `--enable-translation` flag
- Check `translations` table: `SELECT COUNT(*) FROM translations WHERE language_code = 'ta';`
- Verify location names match dictionary

### Q: Script fails with "Checkpoint file not found"?
**A:**
- Run `transform_flat_bus_data.py` first to create checkpoint
- Check file location: `data/mtc_bus_timings.checkpoint.json`

### Q: Duplicate locations being created?
**A:**
- Locations within 80% match are considered duplicates
- Check logs for "Found similar location" messages
- Adjust `LOCATION_SIMILARITY_THRESHOLD` if needed

### Q: Performance is slow?
**A:**
- Translation caching is working (check `data/translation_cache.json`)
- Batch size can be increased in the script
- Use local environment first before preprod/prod

## Next Steps

1. ✅ Transform MTC data: `python scripts/transform_flat_bus_data.py --input data/mtc_all_routes_complete.json --operator MTC`
2. ✅ Upload to database: `python scripts/upload_bus_data.py --operator MTC --environment local --enable-translation`
3. ✅ Verify data in database
4. ✅ Extend Tamil dictionary for missing locations
5. ⏳ Populate stops table from external source
6. ⏳ Frontend integration for language-aware API

## Related Files

- **Transformation:** `scripts/transform_flat_bus_data.py`
- **Translation:** `scripts/tamil_translator.py`
- **Upload:** `scripts/upload_bus_data.py`
- **Cache:** `data/translation_cache.json`
- **Checkpoint:** `data/mtc_bus_timings.checkpoint.json`
- **Structured Data:** `data/mtc_structured.json`

## Language Support

Currently implemented:
- ✅ English (input data)
- ✅ Tamil (translations)

Future support:
- ⏳ Hindi
- ⏳ Kannada
- ⏳ Telugu
- ⏳ Marathi

## Summary

The implementation provides:
- ✅ Data transformation to structured format
- ✅ Multi-operator support (MTC, TNSTC)
- ✅ Automatic Tamil translation
- ✅ Database insertion with transaction safety
- ✅ Complete table coverage (locations, buses, stops, connecting_routes, translations)
- ✅ Extensible architecture for future enhancements
