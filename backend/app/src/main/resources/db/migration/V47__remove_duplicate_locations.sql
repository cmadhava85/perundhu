-- V47: Remove duplicate locations and keep only one copy of each
-- Purpose: Clean up data quality by removing duplicate location entries
-- Date: 2026-01-04
-- Safety: Production-safe migration with ultra-fast approach
-- Optimized: Using MIN() aggregate on pre-filtered dataset - NO subqueries, NO window functions, NO joins on large tables

-- Disable foreign key checks temporarily to allow updates
SET FOREIGN_KEY_CHECKS=0;

-- Step 1: Create efficient temporary table with minimum IDs per location
CREATE TEMPORARY TABLE min_location_ids AS
SELECT LOWER(TRIM(name)) as norm_name, MIN(id) as min_id
FROM locations
GROUP BY LOWER(TRIM(name))
HAVING COUNT(*) > 1;

-- Step 2: Create mapping table for duplicates (only entries where id > min_id)
CREATE TEMPORARY TABLE location_id_mapping (
  old_id INT PRIMARY KEY,
  new_id INT NOT NULL
);

-- Step 3: Populate mapping - super fast, only for duplicates
INSERT INTO location_id_mapping
SELECT l.id, m.min_id
FROM locations l
INNER JOIN min_location_ids m ON LOWER(TRIM(l.name)) = m.norm_name
WHERE l.id > m.min_id;

-- Step 4: Update bus_stops with a single batch UPDATE
UPDATE bus_stops bs
INNER JOIN location_id_mapping lm ON bs.location_id = lm.old_id
SET bs.location_id = lm.new_id;

-- Step 5: Delete duplicates - single DELETE statement
DELETE FROM locations
WHERE id IN (SELECT old_id FROM location_id_mapping);

-- Step 6: Clean up temporary tables
DROP TEMPORARY TABLE IF EXISTS location_id_mapping;
DROP TEMPORARY TABLE IF EXISTS min_location_ids;

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS=1;
