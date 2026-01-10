# Location Data Deduplication Guide

## Problem Summary

After uploading new location data to the preprod database, you're seeing duplicate locations:
- **Chennai appears 3 times**
- Other cities also duplicated
- No proper formatting for bus stands

## Root Causes

1. **Multiple Overpass queries** - Each query type (cities, towns, villages, bus stops) can return the same location
2. **Spelling variations** - OSM has multiple name variations for the same location
3. **Coordinate matching** - Simple coordinate deduplication not working properly
4. **Name formatting** - Bus stands not formatted with city name (e.g., "Madurai - Periyar Bus Stand")

## Solution Strategy

### Phase 1: Analyze Current Duplicates

```bash
# Run deduplication script to identify duplicates
python3 scripts/deduplicate-locations.py
```

This will:
- ✅ Connect to preprod database
- ✅ Find exact duplicate names and coordinates
- ✅ Find fuzzy duplicates (similar names, same location)
- ✅ Report locations to merge
- ✅ Generate SQL to fix issues

### Phase 2: Regenerate Location Data

```bash
# Option 1: Use enhanced fetcher (recommended - includes deduplication)
python3 scripts/enhanced-fetch-locations.py

# Option 2: Use original fetcher (will still have duplicates)
python3 scripts/fetch-from-overpass.py
```

**Enhanced Fetcher Advantages:**
- ✅ Automatically deduplicates during fetch
- ✅ Proper name formatting for bus stands
- ✅ Similarity matching (>90% name match + same coordinates = duplicate)
- ✅ Removes exact duplicates
- ✅ Reports deduplication statistics

### Phase 3: Apply Migrations

```bash
# 1. First, clean existing duplicates
mysql -u perundhu_user -p perundhu < deduplication_migration.sql

# 2. Then, load new deduplicated data
cd backend
./gradlew flywayMigrate
```

## Recommended Naming Convention

### Bus Stands
Format: `{City Name} - {Area/Locality Name}` or `{City Name} Bus Stand`

Examples:
```
✅ Madurai - Periyar Bus Stand
✅ Madurai - Mattuthavani Bus Stand
✅ Chennai Central Bus Stand
✅ Coimbatore Gandhipuram Bus Stand
```

### Towns/Villages
Simple name without suffix:
```
✅ Sivakasi
✅ Tiruppur
✅ Erode
✅ Salem
```

### Bus Stops
Name with "Bus Stop" suffix if not already included:
```
✅ Kovilpalayam Main Bus Stop
✅ Perambur MTC Terminus
✅ Saligramam Bus Terminus
```

## Database Schema

### Locations Table
```sql
CREATE TABLE locations (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,              -- Formatted location name
    latitude DOUBLE,
    longitude DOUBLE,
    district VARCHAR(100),                   -- Always "Tamil Nadu" for now
    nearby_city VARCHAR(100),                -- Optional: for bus stops
    type VARCHAR(50),                        -- city, town, village, bus_stop, neighborhood
    priority INT,                            -- For sorting/filtering
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    KEY idx_location_name (name),
    KEY idx_location_coordinates (latitude, longitude),
    KEY idx_location_type (type)
);
```

### Translations Table (for Tamil names)
```sql
INSERT INTO translations (entity_type, entity_id, language_code, field_name, translated_value)
VALUES 
    ('location', 1, 'ta', 'name', 'சென்னை'),
    ('location', 2, 'ta', 'name', 'மதுரை'),
    -- ... etc for all cities
;
```

## Implementation Steps

### Step 1: Identify Duplicates

```bash
python3 scripts/deduplicate-locations.py
```

Output will show:
```
📍 Chennai (x3)
   Type: city
   Coordinates: (13.0836939, 80.270186)
   ✅ KEEP: ID 5 (created: 2026-01-10 10:00:00)
   🔴 DELETE: ID 145 (created: 2026-01-10 11:00:00)
   🔴 DELETE: ID 287 (created: 2026-01-10 11:05:00)
```

### Step 2: Create Deduplication Migration

Script generates SQL like:
```sql
-- Deduplication Migration
SET FOREIGN_KEY_CHECKS=0;

DELETE FROM locations WHERE id IN (145, 287, 452, 853, ...);

-- Update foreign key references to point to kept IDs
UPDATE buses SET from_location_id = 5 WHERE from_location_id IN (145, 287);
UPDATE buses SET to_location_id = 5 WHERE to_location_id IN (145, 287);
UPDATE stops SET location_id = 5 WHERE location_id IN (145, 287);

SET FOREIGN_KEY_CHECKS=1;
```

### Step 3: Regenerate Location Data

Run enhanced fetcher:
```bash
cd /Users/mchand69/Documents/perundhu
python3 scripts/enhanced-fetch-locations.py
```

This creates:
- `V66__load_deduplicated_tamil_nadu_locations.sql` (new migration)
- `data/tamil_nadu_locations_from_overpass.csv` (CSV backup)

### Step 4: Apply to Database

```bash
# Apply deduplication first
mysql -h localhost -u perundhu_user -p -D perundhu < deduplication_migration.sql

# Then run migrations
cd backend
./gradlew flywayMigrate
```

## Deduplication Algorithm

The enhanced fetcher uses this approach:

1. **Fetch locations** from 5 separate Overpass queries
2. **Normalize names** - Standardize spacing, capitalization
3. **Compare each pair:**
   - Calculate string similarity (SequenceMatcher)
   - Check coordinate proximity (< 0.005° ≈ 500m)
4. **Mark as duplicate if:**
   - Name similarity ≥ 90% AND coordinates close
   - OR exact match on both

5. **Keep:** First occurrence (oldest)
6. **Delete:** All subsequent occurrences

## Tamil Translation Support

Generate Tamil names:
```python
tamil_translations = {
    'Chennai': 'சென்னை',
    'Madurai': 'மதுரை',
    'Coimbatore': 'கோவை',
    'Tiruppur': 'திருப்பூர்',
    'Salem': 'சேலம்',
    # ... more
}
```

Insert into database:
```sql
INSERT INTO translations (entity_type, entity_id, language_code, field_name, translated_value)
SELECT 
    'location',
    l.id,
    'ta',
    'name',
    CASE 
        WHEN l.name = 'Chennai' THEN 'சென்னை'
        WHEN l.name = 'Madurai' THEN 'மதுரை'
        -- ... etc
    END
FROM locations l
WHERE l.name IN ('Chennai', 'Madurai', 'Coimbatore', ...);
```

## Testing Deduplication

```bash
# Before
SELECT name, COUNT(*) as count FROM locations 
GROUP BY LOWER(name) HAVING count > 1
ORDER BY count DESC;

# Results:
# | name        | count |
# | Chennai     |     3 |
# | Madurai     |     2 |
# | ...         |   ... |

# After (should show 0 results)
SELECT name, COUNT(*) as count FROM locations 
GROUP BY LOWER(name) HAVING count > 1
ORDER BY count DESC;

# | (no results) |
```

## Verification Checklist

- [ ] No duplicate location names
- [ ] All bus stands properly formatted
- [ ] Tamil translations present
- [ ] Coordinates accurate (verified against OSM)
- [ ] Type field properly set (city, town, village, bus_stop, neighborhood)
- [ ] All foreign key references valid
- [ ] Database migrations executed successfully

## Rollback Plan

If issues arise:
```bash
# Revert to previous state
cd backend
./gradlew flywayUndo
./gradlew flywayUndo
# ... repeat for each migration

# Or restore from backup
mysql -u perundhu_user -p < /path/to/backup.sql
```

## Key Files

- `scripts/deduplicate-locations.py` - Analyze and fix duplicates
- `scripts/enhanced-fetch-locations.py` - Fetch with auto-deduplication
- `backend/app/src/main/resources/db/migration/V6X__*.sql` - Migration files
- `data/tamil_nadu_locations_from_overpass.csv` - CSV backup

---

**Status:** Ready to implement
**Date:** January 10, 2026
**Priority:** High (duplicates affecting user experience)
