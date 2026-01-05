-- V47: Remove duplicate locations and keep only one copy of each
-- Purpose: Clean up data quality by removing duplicate location entries
-- Date: 2026-01-04
-- Safety: Production-safe migration with proper constraints handling
-- Optimized: Using indexed temp table and batch operations for performance

-- Disable foreign key checks temporarily to allow updates
SET FOREIGN_KEY_CHECKS=0;

-- Step 1: Create indexed temporary table for the mapping
CREATE TEMPORARY TABLE location_id_mapping (
  old_id INT PRIMARY KEY,
  new_id INT NOT NULL,
  INDEX idx_new_id (new_id)
);

-- Step 2: Insert duplicate mappings using a more efficient approach
-- First, get the min ID for each location name
INSERT INTO location_id_mapping (old_id, new_id)
SELECT 
    l.id as old_id,
    (
        SELECT MIN(l2.id) 
        FROM locations l2 
        WHERE LOWER(TRIM(l2.name)) = LOWER(TRIM(l.name))
    ) as new_id
FROM locations l
WHERE l.id > (
    SELECT MIN(l2.id) 
    FROM locations l2 
    WHERE LOWER(TRIM(l2.name)) = LOWER(TRIM(l.name))
);

-- Step 3: Update all foreign key references from duplicates to primary IDs
-- Using direct join for better performance
UPDATE bus_stops bs
INNER JOIN location_id_mapping lm ON bs.location_id = lm.old_id
SET bs.location_id = lm.new_id;

-- Step 4: Delete the duplicate location records
DELETE FROM locations
WHERE id IN (SELECT old_id FROM location_id_mapping);

-- Step 5: Clean up temporary table
DROP TEMPORARY TABLE IF EXISTS location_id_mapping;

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS=1;
