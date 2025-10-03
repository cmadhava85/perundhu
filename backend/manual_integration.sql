-- Manual integration of approved route contribution
-- This adds the approved Sivakasi -> Aruppukottai route to the main bus database

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
    (SELECT id FROM locations WHERE name ILIKE '%Sivakasi%' LIMIT 1),
    (SELECT id FROM locations WHERE name ILIKE '%Aruppukottai%' LIMIT 1),
    '08:00:00',
    '09:30:00',
    gen_random_uuid(),
    NOW(),
    NOW()
);

-- If locations don't exist, create them
INSERT INTO locations (id, name, latitude, longitude, created_at, updated_at)
SELECT gen_random_uuid(), 'Sivakasi', 9.4484, 77.8072, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM locations WHERE name ILIKE '%Sivakasi%');

INSERT INTO locations (id, name, latitude, longitude, created_at, updated_at)
SELECT gen_random_uuid(), 'Aruppukottai', 9.5089, 78.0931, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM locations WHERE name ILIKE '%Aruppukottai%');

-- Update the route contribution status to INTEGRATED
UPDATE route_contributions 
SET status = 'INTEGRATED', processed_date = NOW(), validation_message = 'Manually integrated into main bus database'
WHERE id = 'c500a4dc-844f-4757-9f42-871663d2901f';
