# Location Duplicate Prevention & Cleanup Solution

## Problem Statement

When uploading bus data from TNSTC/MTC/other operators, the system was creating **duplicate locations** instead of reusing existing ones:

### Examples of Duplicates Found:
- **Vadapalani** (ID: 62410)
- **VADAPALANI B.S** (ID: 62613)  
- **Vadapalani Bus Terminus** (ID: 710)

→ These are all the **same location** but created as 3 separate entries!

- **Besant Nagar** (ID: 62388)
- **Besant Nagar MTC Terminus** (ID: 613)

### Why This Happened

The previous fuzzy matching logic in `upload_bus_data.py` had limitations:

1. **Low threshold**: 80% similarity → "Vadapalani" vs "Vadapalani BS" = 84% (not matched as duplicate)
2. **No normalization**: Didn't remove suffixes like "BS", "Bus Stand", "Terminus"
3. **Limited search**: LIMIT 1000 → might miss existing locations
4. **Case sensitivity**: "VADAPALANI B.S" vs "Vadapalani" treated as very different

## Solution Implemented

### 1. Improved Location Matching in Upload Script

**File**: `scripts/upload_bus_data.py`

#### A. Name Normalization
Added `_normalize_location_name()` method that removes common suffixes:

```python
LOCATION_SUFFIXES = [
    ' BS',
    ' B.S',
    ' B.S.',
    ' bus stand',
    ' bus stop',
    ' bus station',
    ' bus terminus',
    ' MTC terminus',
    ' MTC bus stand',
    ' TNSTC bus stand',
    ' depot'
]

def _normalize_location_name(self, name: str) -> str:
    """Normalize location name for better matching"""
    name_lower = name.lower().strip()
    
    # Remove common suffixes
    for suffix in self.LOCATION_SUFFIXES:
        if name_lower.endswith(suffix.lower()):
            name_lower = name_lower[:-len(suffix)].strip()
            break
    
    return ' '.join(name_lower.split())
```

**Example**:
- "Vadapalani Bus Terminus" → "vadapalani"
- "VADAPALANI B.S" → "vadapalani"
- "Vadapalani" → "vadapalani"

All normalize to the same string → Matched as duplicates!

#### B. Smarter Fuzzy Matching

**Old approach**:
```python
# Compared raw names
ratio = SequenceMatcher(None, "vadapalani", "vadapalani b.s").ratio()
# = 0.84 (84%) - Below 80% threshold, creates duplicate!
```

**New approach**:
```python
# Compare normalized names
name1_normalized = "vadapalani"  # from "Vadapalani"
name2_normalized = "vadapalani"  # from "VADAPALANI B.S"
ratio = SequenceMatcher(None, name1_normalized, name2_normalized).ratio()
# = 1.0 (100%) - Perfect match, reuses existing location!

# Also boost substring matches
if name_normalized in loc_normalized or loc_normalized in name_normalized:
    ratio = max(ratio, 0.95)  # 95% for substring matches
```

#### C. Targeted Search with LIKE

**Old**: `SELECT id, name FROM locations LIMIT 1000`  
**New**: `SELECT id, name FROM locations WHERE LOWER(name) LIKE %s LIMIT 100`

Only searches locations matching first word, much faster and more accurate.

#### D. Increased Threshold

- **Old**: 80% similarity
- **New**: 85% similarity (more strict)

With normalization, even 85% catches all the same-location variants.

### 2. Duplicate Cleanup Script

**File**: `scripts/merge_duplicate_locations.py`

#### Features:
1. **Find duplicates** - Uses same normalization logic to find existing duplicates
2. **Smart merging** - Keeps the most descriptive name (e.g., "Vadapalani Bus Terminus" over "Vadapalani")
3. **Update references** - Updates all foreign keys in:
   - `buses.from_location_id`
   - `buses.to_location_id`
   - `stops.location_id`
   - `connecting_routes.from_location_id`
   - `connecting_routes.to_location_id`
4. **Safe operation** - Dry-run by default, requires `--execute` flag

#### Usage:

**Dry Run (see what would be merged)**:
```bash
python scripts/merge_duplicate_locations.py
```

**Actually merge duplicates**:
```bash
python scripts/merge_duplicate_locations.py --execute
```

**Custom database connection**:
```bash
python scripts/merge_duplicate_locations.py --execute \
  --host 127.0.0.1 \
  --port 3307 \
  --user root \
  --password root123 \
  --database perundhu
```

#### Example Output:
```
Found duplicate: 'Vadapalani' (ID: 62410) <-> 'VADAPALANI B.S' (ID: 62613) - 100% match
Found duplicate: 'Vadapalani' (ID: 62410) <-> 'Vadapalani Bus Terminus' (ID: 710) - 100% match

Merging 'Vadapalani' (ID: 62410) into 'Vadapalani Bus Terminus' (ID: 710)
  - buses.from_location_id: 5 rows to update
  - buses.to_location_id: 3 rows to update
  - stops.location_id: 12 rows to update
  Total rows affected: 20
  ✅ Deleted location ID 62410
  ✅ Merge completed successfully
```

## How It Works Together

### For New Data Uploads

```
┌─────────────────────────────────────────────┐
│ upload_bus_data.py encounters "Vadapalani"  │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
        ┌─────────────────────┐
        │ Normalize name      │
        │ "vadapalani"        │
        └─────────┬───────────┘
                  │
                  ▼
    ┌──────────────────────────────────────┐
    │ Search existing locations with LIKE  │
    │ WHERE name LIKE '%vadapalani%'       │
    └─────────────┬────────────────────────┘
                  │
                  ▼
    ┌──────────────────────────────────────┐
    │ Found: "Vadapalani Bus Terminus"     │
    │ Normalized: "vadapalani"             │
    │ Match: 100%                          │
    └─────────────┬────────────────────────┘
                  │
                  ▼
    ┌──────────────────────────────────────┐
    │ ✅ Reuse existing location ID        │
    │ No duplicate created!                │
    └──────────────────────────────────────┘
```

### For Existing Duplicates

```
┌──────────────────────────────────────────┐
│ merge_duplicate_locations.py finds:      │
│ - Vadapalani (ID: 62410)                 │
│ - VADAPALANI B.S (ID: 62613)             │
│ - Vadapalani Bus Terminus (ID: 710)      │
└─────────────┬────────────────────────────┘
              │
              ▼
    ┌─────────────────────────────────┐
    │ Choose primary location:        │
    │ "Vadapalani Bus Terminus" (710) │
    │ (most descriptive name)         │
    └──────────┬──────────────────────┘
              │
              ▼
    ┌─────────────────────────────────┐
    │ Update all references:          │
    │ buses.from_location_id: 62410   │
    │   → 710                          │
    │ buses.to_location_id: 62613     │
    │   → 710                          │
    └──────────┬──────────────────────┘
              │
              ▼
    ┌─────────────────────────────────┐
    │ Delete secondary locations:     │
    │ DELETE FROM locations           │
    │ WHERE id IN (62410, 62613)      │
    └─────────────────────────────────┘
```

## Testing the Fix

### 1. Test Upload Script (Mock Data)

Create test data with duplicates:
```json
{
  "route_number": "123",
  "origin": "Vadapalani",
  "destination": "T Nagar",
  "stops": [
    {"name": "Vadapalani BS", "time": "06:00"},
    {"name": "VADAPALANI B.S", "time": "06:05"},
    {"name": "Vadapalani Bus Terminus", "time": "06:10"}
  ]
}
```

Run upload:
```bash
python scripts/upload_bus_data.py --operator TEST --environment local --file test_data.json
```

Expected log output:
```
✅ Found similar location: 'Vadapalani BS' -> 'Vadapalani Bus Terminus' (match: 100%, normalized: 'vadapalani' vs 'vadapalani')
✅ Found similar location: 'VADAPALANI B.S' -> 'Vadapalani Bus Terminus' (match: 100%, normalized: 'vadapalani' vs 'vadapalani')
```

### 2. Test Cleanup Script

```bash
# Dry run to see what would be merged
python scripts/merge_duplicate_locations.py

# Actually merge
python scripts/merge_duplicate_locations.py --execute
```

### 3. Verify in Frontend

Search for "Vadapalani" in location autocomplete:
- **Before**: 3 entries (Vadapalani, VADAPALANI B.S, Vadapalani Bus Terminus)
- **After**: 1 entry (Vadapalani Bus Terminus)

## Benefits

### 1. Cleaner Database
- No duplicate locations
- Consistent naming
- Better data quality

### 2. Better User Experience
- Fewer confusing autocomplete results
- Consistent location names
- Easier to find destinations

### 3. Improved Search
- Faster queries (fewer rows)
- Better relevance
- No duplicate confusion

### 4. Maintainability
- Future uploads won't create duplicates
- Easy to merge any new duplicates found
- Clear logging for debugging

## Migration Path

### For Existing Deployments:

1. **Backup database**:
```bash
mysqldump -u root -p perundhu > backup_$(date +%Y%m%d).sql
```

2. **Run dry-run to preview changes**:
```bash
python scripts/merge_duplicate_locations.py
```

3. **Review output**, ensure it's merging correctly

4. **Execute merge**:
```bash
python scripts/merge_duplicate_locations.py --execute
```

5. **Verify results**:
```bash
# Check location count before and after
SELECT COUNT(*) FROM locations;  # Should be reduced

# Check specific locations
SELECT * FROM locations WHERE name LIKE '%Vadapalani%';
```

6. **Deploy updated upload script** - Future uploads will use new matching logic

## Future Improvements

1. **Location aliases** - Store alternate names in a separate table
2. **Manual review UI** - Admin interface to review and merge duplicates
3. **Geocoding integration** - Use coordinates to detect duplicates
4. **Machine learning** - Train model on location name variations
5. **API endpoint** - Backend API for merging duplicates

## Related Files

- `scripts/upload_bus_data.py` - Enhanced location matching (lines 110-360)
- `scripts/merge_duplicate_locations.py` - Cleanup script (new file)
- `frontend/src/services/locationAutocompleteService.ts` - Frontend deduplication
- `frontend/LOCATION_DUPLICATE_HANDLING.md` - Frontend duplicate handling

## Notes

### Why Keep Descriptive Names?

Example: "Vadapalani Bus Terminus" vs "Vadapalani"

**Better**: "Vadapalani Bus Terminus"
- More specific
- Users know it's a bus terminus
- Distinguishes from general area "Vadapalani"

**Exception**: City-specific bus stands
- "Chennai - CMBT (Koyambedu)" ✅ Good (specific terminus)
- "Chennai" ❌ Too generic (whole city)

### Suffix Handling

The normalization removes suffixes for **matching** but keeps them in the database:
- Match: "vadapalani" = "vadapalani" ✅
- Store: "Vadapalani Bus Terminus" (descriptive name retained)

This gives us best of both worlds:
- **Smart matching** (prevents duplicates)
- **Clear names** (users see full details)
