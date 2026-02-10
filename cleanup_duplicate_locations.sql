-- Script to identify and clean up duplicate locations with no bus routes
-- Run this to find duplicates before deleting

-- Step 1: Find locations with similar names that have 0 routes
WITH location_route_counts AS (
    SELECT 
        l.id,
        l.name,
        l.district,
        COALESCE(origin_count, 0) + COALESCE(dest_count, 0) + COALESCE(stop_count, 0) as total_routes,
        LOWER(TRIM(REGEXP_REPLACE(l.name, '[^a-zA-Z]', ''))) as normalized_name
    FROM locations l
    LEFT JOIN (
        SELECT from_location_id, COUNT(*) as origin_count 
        FROM buses 
        WHERE active = 1 OR active IS NULL 
        GROUP BY from_location_id
    ) origins ON l.id = origins.from_location_id
    LEFT JOIN (
        SELECT to_location_id, COUNT(*) as dest_count 
        FROM buses 
        WHERE active = 1 OR active IS NULL 
        GROUP BY to_location_id
    ) dests ON l.id = dests.to_location_id
    LEFT JOIN (
        SELECT location_id, COUNT(DISTINCT bus_id) as stop_count 
        FROM stops 
        GROUP BY location_id
    ) stops ON l.id = stops.location_id
)
SELECT 
    l1.id as duplicate_id,
    l1.name as duplicate_name,
    l1.total_routes as duplicate_routes,
    l2.id as keep_id,
    l2.name as keep_name,
    l2.total_routes as keep_routes,
    l1.district
FROM location_route_counts l1
JOIN location_route_counts l2 
    ON l1.normalized_name = l2.normalized_name 
    AND l1.id != l2.id
WHERE l1.total_routes = 0 
  AND l2.total_routes > 0
ORDER BY l2.total_routes DESC, l1.name;

-- Step 2: Preview what will be deleted
-- SELECT id, name, district FROM locations WHERE id IN (
--     -- Put the duplicate_id values from Step 1 results here
-- );

-- Step 3: BACKUP before deletion!
-- CREATE TABLE locations_backup_20260209 AS SELECT * FROM locations;

-- Step 4: Delete locations with no routes that have duplicates with routes
-- ONLY RUN THIS AFTER REVIEWING STEP 1 RESULTS!
-- DELETE FROM locations 
-- WHERE id IN (
--     -- MANUALLY add IDs from Step 1 that you want to delete
--     -- For example:
--     14813,  -- Kilambakkam (0 routes, duplicate of KCBT KILAMBAKKAM)
--     580     -- M.G.R Mattuthavani Bus Stand , Madurai (0 routes, duplicate of Madurai - Mattuthavani)
-- );

-- Step 5: Verify deletions
-- SELECT COUNT(*) FROM locations;
-- SELECT COUNT(*) FROM locations_backup_20260209;
