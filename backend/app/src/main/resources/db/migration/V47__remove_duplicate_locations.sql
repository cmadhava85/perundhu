-- V47: Remove duplicate locations and keep only one copy of each
-- Purpose: Clean up data quality by removing duplicate location entries
-- Date: 2026-01-04
-- Safety: Production-safe migration with proper constraints handling

-- Disable foreign key checks temporarily to allow updates
SET FOREIGN_KEY_CHECKS=0;

-- Step 1: Create mapping of duplicate location IDs to primary IDs
CREATE TEMPORARY TABLE location_id_mapping (
  old_id INT PRIMARY KEY,
  new_id INT NOT NULL
);

-- Insert all duplicate IDs that should be merged (exclude the minimum ID for each location)
-- For each location name, all duplicate IDs map to the minimum ID for that name
INSERT INTO location_id_mapping (old_id, new_id)
SELECT 
    l.id as old_id,
    MIN(l2.id) as new_id
FROM locations l
INNER JOIN locations l2 ON LOWER(TRIM(l.name)) = LOWER(TRIM(l2.name))
WHERE l.id != (SELECT MIN(l3.id) FROM locations l3 WHERE LOWER(TRIM(l3.name)) = LOWER(TRIM(l.name)))
GROUP BY l.id, LOWER(TRIM(l.name));

-- Step 2: Update all foreign key references from duplicates to primary IDs
UPDATE bus_stops bs
SET bs.location_id = (
    SELECT new_id FROM location_id_mapping 
    WHERE old_id = bs.location_id 
    LIMIT 1
)
WHERE bs.location_id IN (SELECT old_id FROM location_id_mapping);

-- Step 3: Delete the duplicate location records
DELETE FROM locations
WHERE id IN (SELECT old_id FROM location_id_mapping);

-- Step 4: Clean up temporary table
DROP TEMPORARY TABLE IF EXISTS location_id_mapping;

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS=1;
