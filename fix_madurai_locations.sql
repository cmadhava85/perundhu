
SELECT id, name, parent_id FROM locations 
WHERE name LIKE '%Madurai%' OR name LIKE '%Mattuthavani%'
ORDER BY id;


UPDATE locations SET parent_id = 623 WHERE id IN (580, 581, 41396);
-- ============================================================================
-- Fix Madurai Location Hierarchy
-- This script sets up parent-child relationships for Madurai bus stands
-- so that searching from any Madurai location returns all Madurai buses
-- ============================================================================

-- Step 1: Verify current state (before update)
SELECT '=== Current State of Madurai Locations ===' AS info;
SELECT id, name, parent_id FROM locations 
WHERE id IN (580, 581, 623, 41396)
ORDER BY id;
-- Step 3: Verify the update
-- Step 2: Set Madurai (623) as the parent city
-- Link all bus stands as children of the main Madurai location
-- This enables hierarchical search to work automatically
SELECT '=== Updating Parent-Child Relationships ===' AS info;
SELECT id, name, parent_id FROM locations 
-- Update bus stands to have Madurai (623) as their parent
-- Note: We do NOT set 623's parent_id since it's the parent city itself
UPDATE locations SET parent_id = 623 WHERE id IN (580, 581, 41396);
WHERE id IN (580, 581, 623, 41396)
-- Show rows affected
SELECT ROW_COUNT() AS 'Rows Updated';
ORDER BY CASE WHEN parent_id IS NULL THEN 0 ELSE 1 END, id;
-- Step 3: Verify the update
SELECT '=== After Update - Verify Relationships ===' AS info;
SELECT id, name, parent_id,
       CASE 
           WHEN parent_id IS NULL THEN '(Parent City)'
           ELSE '(Child Terminal)'
       END AS role
FROM locations 
WHERE id IN (580, 581, 623, 41396)
ORDER BY CASE WHEN parent_id IS NULL THEN 0 ELSE 1 END, id;

-- Step 4: Test the hierarchical search query for location 580 (MGR Mattuthavani)
SELECT '=== Hierarchical Search Test: From MGR Mattuthavani (580) ===' AS info;
SELECT DISTINCT location_id, l.name FROM (
    -- The location itself
    SELECT id AS location_id FROM locations WHERE id = 580
    
    UNION
    
    -- All children of this location (if it's a parent)
    SELECT id FROM locations WHERE parent_id = 580
    
    UNION
    
    -- The parent of this location (if it's a child)
    SELECT parent_id FROM locations WHERE id = 580 AND parent_id IS NOT NULL
    
    UNION
    
    -- All sibling locations (other children of the same parent)
    SELECT sibling.id 
    FROM locations AS location
    JOIN locations AS sibling ON sibling.parent_id = location.parent_id
    WHERE location.id = 580 AND location.parent_id IS NOT NULL
) AS expanded_locations
JOIN locations l ON l.id = expanded_locations.location_id
ORDER BY location_id;
-- Step 4: Test the hierarchical search query
-- Step 5: Test hierarchical search for location 623 (Madurai city)
SELECT '=== Hierarchical Search Test: From Madurai City (623) ===' AS info;
SELECT DISTINCT location_id, l.name FROM (
    SELECT id AS location_id FROM locations WHERE id = 623
    UNION
    SELECT id FROM locations WHERE parent_id = 623
    UNION
    SELECT parent_id FROM locations WHERE id = 623 AND parent_id IS NOT NULL
    UNION
    SELECT sibling.id 
    FROM locations AS location
    JOIN locations AS sibling ON sibling.parent_id = location.parent_id
    WHERE location.id = 623 AND location.parent_id IS NOT NULL
) AS expanded_locations
JOIN locations l ON l.id = expanded_locations.location_id
ORDER BY location_id;
-- This should return all 4 location IDs: 580, 581, 623, 41396
-- Step 6: Test hierarchical search for location 41396 (Madurai - Mattuthavani)
SELECT '=== Hierarchical Search Test: From Madurai-Mattuthavani (41396) ===' AS info;
SELECT DISTINCT location_id, l.name FROM (
    SELECT id AS location_id FROM locations WHERE id = 41396
    UNION
    SELECT id FROM locations WHERE parent_id = 41396
    UNION
    SELECT parent_id FROM locations WHERE id = 41396 AND parent_id IS NOT NULL
    UNION
    SELECT sibling.id 
    FROM locations AS location
    JOIN locations AS sibling ON sibling.parent_id = location.parent_id
    WHERE location.id = 41396 AND location.parent_id IS NOT NULL
) AS expanded_locations
JOIN locations l ON l.id = expanded_locations.location_id
ORDER BY location_id;
SELECT DISTINCT location_id FROM (
-- Expected result for all three tests: 580, 581, 623, 41396
-- This proves that searching from ANY of these locations will now include ALL of them
    -- The location itself
-- Step 7: Summary
SELECT '=== Summary ===' AS info;
SELECT 
    (SELECT COUNT(*) FROM locations WHERE parent_id = 623) AS 'Child Terminals',
    623 AS 'Parent Location ID',
    'Madurai' AS 'Parent Location Name';
    SELECT id AS location_id FROM locations WHERE id = 580
-- ============================================================================
-- NEXT STEPS:
-- 1. Clear the application cache by restarting the backend:
--    ./start-local.sh backend
--
-- 2. Test the API:
--    curl 'http://localhost:8080/api/v1/bus-schedules/search?fromLocationId=580&toLocationId=611&lang=en'
--
-- 3. Apply similar fix to other major cities (Chennai, Coimbatore, etc.)
-- ============================================================================
    
    UNION
    
    -- All children of this location (if it's a parent)
    SELECT id FROM locations WHERE parent_id = 580
    
    UNION
    
    -- The parent of this location (if it's a child)
    SELECT parent_id FROM locations WHERE id = 580 AND parent_id IS NOT NULL
    
    UNION
    
    -- All sibling locations (other children of the same parent)
    SELECT sibling.id 
    FROM locations AS location
    JOIN locations AS sibling ON sibling.parent_id = location.parent_id
    WHERE location.id = 580 AND location.parent_id IS NOT NULL
) AS expanded_locations
ORDER BY location_id;

-- Expected result: 580, 581, 623, 41396

-- Step 5: Test with location 623 (Madurai city)
SELECT DISTINCT location_id FROM (
    SELECT id AS location_id FROM locations WHERE id = 623
    UNION
    SELECT id FROM locations WHERE parent_id = 623
    UNION
    SELECT parent_id FROM locations WHERE id = 623 AND parent_id IS NOT NULL
    UNION
    SELECT sibling.id 
    FROM locations AS location
    JOIN locations AS sibling ON sibling.parent_id = location.parent_id
    WHERE location.id = 623 AND location.parent_id IS NOT NULL
) AS expanded_locations
ORDER BY location_id;

-- Expected result: 580, 581, 623, 41396

-- Step 6: (Optional) Set up similar relationships for other major cities
-- Chennai (example - adjust IDs as needed)
-- UPDATE locations SET parent_id = 1 WHERE name LIKE '%CMBT%' OR name LIKE '%KCBT%' OR name LIKE '%Broadway%';

-- Coimbatore (example - adjust IDs as needed)
-- UPDATE locations SET parent_id = <coimbatore_city_id> WHERE name LIKE '%Gandhipuram%';

-- Step 7: Clear the cache to pick up new relationships
-- This may require restarting the backend or waiting for cache expiration
-- The cache key is: busSearchCache with key format: fromLocationId-toLocationId-languageCode
