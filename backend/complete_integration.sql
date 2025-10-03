-- Complete Integration Fix for Sivakasi → Aruppukottai Route
-- This script fixes the "0 routes integrated" issue by:
-- 1. Adding missing data to the route contribution
-- 2. Creating the searchable bus route 
-- 3. Marking the contribution as successfully integrated

-- Step 1: Fix the route contribution with missing required data
UPDATE route_contributions 
SET 
  departure_time = '08:00',
  arrival_time = '09:30',
  from_latitude = 9.4484,
  from_longitude = 77.8072,
  to_latitude = 9.5089,
  to_longitude = 78.0931,
  status = 'APPROVED',
  processed_date = NOW(),
  validation_message = 'Ready for integration - complete data provided'
WHERE id = 'c500a4dc-844f-4757-9f42-871663d2901f';

-- Step 2: Ensure locations exist with exact names
INSERT INTO locations (id, name, latitude, longitude, created_at, updated_at)
SELECT gen_random_uuid(), 'Sivakasi', 9.4484, 77.8072, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM locations WHERE name = 'Sivakasi');

INSERT INTO locations (id, name, latitude, longitude, created_at, updated_at)
SELECT gen_random_uuid(), 'Aruppukottai', 9.5089, 78.0931, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM locations WHERE name = 'Aruppukottai');

-- Step 3: Create the searchable bus route in the main database
INSERT INTO buses (
    id,
    bus_number,
    bus_name,
    from_location_id,
    to_location_id,
    departure_time,
    arrival_time,
    route_id,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    'TN67-133',
    'Sivakasi - Aruppukottai Express',
    (SELECT id FROM locations WHERE name = 'Sivakasi' LIMIT 1),
    (SELECT id FROM locations WHERE name = 'Aruppukottai' LIMIT 1),
    '08:00:00',
    '09:30:00',
    gen_random_uuid(),
    NOW(),
    NOW()
);

-- Step 4: Mark route contribution as successfully integrated
UPDATE route_contributions 
SET 
  status = 'INTEGRATED',
  processed_date = NOW(),
  validation_message = 'Successfully integrated into main bus database - route is now searchable'
WHERE id = 'c500a4dc-844f-4757-9f42-871663d2901f';

-- Step 5: Verification queries
SELECT 'Route Contribution Status' as check_type, status, validation_message 
FROM route_contributions 
WHERE id = 'c500a4dc-844f-4757-9f42-871663d2901f'
UNION ALL
SELECT 'Bus Route Created' as check_type, 'EXISTS' as status, bus_name as validation_message
FROM buses 
WHERE bus_number = 'TN67-133'
UNION ALL
SELECT 'Locations Available' as check_type, 'COUNT' as status, COUNT(*)::text as validation_message
FROM locations 
WHERE name IN ('Sivakasi', 'Aruppukottai');

-- Expected results after running this script:
-- 1. Route contribution status: INTEGRATED
-- 2. Bus route created: Sivakasi - Aruppukottai Express
-- 3. Locations available: 2 (Sivakasi and Aruppukottai)
-- 4. Frontend will show: 0 routes pending integration
-- 5. Search will return: TN67-133 route for Sivakasi → Aruppukottai