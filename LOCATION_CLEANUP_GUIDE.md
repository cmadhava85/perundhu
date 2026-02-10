# Location Cleanup Guide

## Problem
We have duplicate locations in the database where one has bus routes and one doesn't.

**Example:**
- ❌ "Kilambakkam" (ID: 14813) - **0 bus routes**
- ✅ "KCBT KILAMBAKKAM" (ID: 41136) - **250+ bus routes**

When users search "Kilambakkam", they might select the wrong one with no buses!

## Solution Options

### Option 1: Automated Python Script (Recommended)

**Preview duplicates (safe - no changes):**
```bash
cd /Users/mchand69/Documents/perundhu
python3 cleanup_duplicate_locations.py --dry-run
```

**Execute cleanup (will delete duplicates):**
```bash
python3 cleanup_duplicate_locations.py --execute
```

The script will:
1. Find all locations with similar names
2. Identify which have 0 routes vs many routes
3. Create a backup table automatically
4. Delete locations with 0 routes when a similar location has routes

### Option 2: Manual SQL Cleanup

**Step 1 - Find duplicates:**
```sql
-- Run this query to see duplicates
source /Users/mchand69/Documents/perundhu/cleanup_duplicate_locations.sql
```

**Step 2 - Review and delete manually:**
```sql
-- Backup first!
CREATE TABLE locations_backup_20260209 AS SELECT * FROM locations;

-- Delete specific IDs you want to remove
DELETE FROM locations WHERE id IN (
    14813,  -- Kilambakkam (0 routes, duplicate of KCBT KILAMBAKKAM)
    580     -- M.G.R Mattuthavani (0 routes, duplicate of Madurai - Mattuthavani)
    -- Add more IDs as needed
);
```

### Option 3: Merge Instead of Delete

If locations have different information (coordinates, district), consider merging:

```sql
-- Transfer any unique data from duplicate to keep location
UPDATE locations 
SET latitude = COALESCE(latitude, (SELECT latitude FROM locations WHERE id = 14813)),
    longitude = COALESCE(longitude, (SELECT longitude FROM locations WHERE id = 14813))
WHERE id = 41136;

-- Then delete the duplicate
DELETE FROM locations WHERE id = 14813;
```

## What Gets Deleted

The cleanup identifies duplicates using this logic:

1. **Normalize names** - Remove special characters, convert to lowercase
   - "KCBT KILAMBAKKAM" → "kcbtkilambakkam"
   - "Kilambakkam" → "kilambakkam"

2. **Count routes** - Count buses where location is:
   - Origin (from_location_id)
   - Destination (to_location_id)
   - Intermediate stop (in stops table)

3. **Mark for deletion** - Delete location if:
   - Has 0 total routes
   - Has similar name to another location
   - That other location has >0 routes

## Safety Features

- ✅ Automatic backup before deletion
- ✅ Dry-run mode to preview changes
- ✅ User confirmation required for execution
- ✅ Only deletes locations with 0 routes
- ✅ Preserves locations with any bus data

## Expected Results

Using the Kilambakkam/Mattuthavani example:

**Before cleanup:**
- Kilambakkam (14813) - 0 routes
- KCBT KILAMBAKKAM (41136) - 250 routes
- M.G.R Mattuthavani (580) - 0 routes  
- Madurai - Mattuthavani (41396) - 180 routes

**After cleanup:**
- ~~Kilambakkam (14813)~~ - **DELETED**
- KCBT KILAMBAKKAM (41136) - 250 routes ✅
- ~~M.G.R Mattuthavani (580)~~ - **DELETED**
- Madurai - Mattuthavani (41396) - 180 routes ✅

Now autocomplete only shows locations with actual bus data!

## Rollback

If you need to restore deleted locations:

```sql
-- List backup tables
SHOW TABLES LIKE 'locations_backup%';

-- Restore from backup
INSERT INTO locations 
SELECT * FROM locations_backup_20260209 
WHERE id NOT IN (SELECT id FROM locations);
```

## Maintenance

Run this cleanup periodically:
- After bulk data imports
- After scraping new routes
- Monthly to keep database clean

## Notes

- The improved autocomplete (with route counts) already helps users avoid empty locations
- This cleanup makes the problem disappear completely
- Consider adding a database constraint to prevent 0-route locations from being created
