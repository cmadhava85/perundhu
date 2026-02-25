-- Deduplicate locations in production database
-- This script will:
-- 1. Find duplicate location names (case-insensitive)
-- 2. Keep the first occurrence (lowest ID)
-- 3. Update all foreign key references
-- 4. Delete duplicate entries

-- First, let's see what duplicates we have
SELECT normalized_name, COUNT(*) as count, GROUP_CONCAT(id ORDER BY id) as ids
FROM (
    SELECT id, UPPER(TRIM(name)) as normalized_name
    FROM locations
) as normalized_locations
GROUP BY normalized_name
HAVING COUNT(*) > 1
ORDER BY count DESC
LIMIT 20;
