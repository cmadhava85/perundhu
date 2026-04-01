-- Check if we have routes that could form connecting routes
-- Example: Chennai -> Aruppukottai via Madurai

-- 1. Check locations exist
SELECT id, name_english, name_tamil, location_type 
FROM location 
WHERE name_english IN ('Chennai', 'Madurai', 'Aruppukottai', 'Trichy', 'Coimbatore')
ORDER BY name_english;

-- 2. Check if there are any buses at all
SELECT COUNT(*) as total_buses FROM bus;

-- 3. Check buses from Chennai
SELECT b.id, b.bus_number, b.bus_name, 
       l_from.name_english as from_location,
       l_to.name_english as to_location,
       b.via_locations,
       b.route_type
FROM bus b
JOIN location l_from ON b.from_location_id = l_from.id
JOIN location l_to ON b.to_location_id = l_to.id
WHERE l_from.name_english LIKE '%Chennai%'
LIMIT 10;

-- 4. Check buses to/from Madurai
SELECT b.id, b.bus_number, b.bus_name,
       l_from.name_english as from_location,
       l_to.name_english as to_location,
       b.via_locations
FROM bus b
JOIN location l_from ON b.from_location_id = l_from.id
JOIN location l_to ON b.to_location_id = l_to.id
WHERE l_from.name_english LIKE '%Madurai%' 
   OR l_to.name_english LIKE '%Madurai%'
LIMIT 10;

-- 5. Check potential connecting route: Chennai -> Madurai, Madurai -> Aruppukottai
SELECT 
  'Leg 1: Chennai to Madurai' as segment,
  b.id, b.bus_number, b.bus_name,
  l_from.name_english as from_loc,
  l_to.name_english as to_loc
FROM bus b
JOIN location l_from ON b.from_location_id = l_from.id
JOIN location l_to ON b.to_location_id = l_to.id
WHERE (l_from.name_english LIKE '%Chennai%' AND l_to.name_english LIKE '%Madurai%')
   OR (b.via_locations LIKE '%Madurai%' AND l_from.name_english LIKE '%Chennai%')

UNION ALL

SELECT 
  'Leg 2: Madurai to Aruppukottai' as segment,
  b.id, b.bus_number, b.bus_name,
  l_from.name_english as from_loc,
  l_to.name_english as to_loc
FROM bus b
JOIN location l_from ON b.from_location_id = l_from.id
JOIN location l_to ON b.to_location_id = l_to.id
WHERE (l_from.name_english LIKE '%Madurai%' AND l_to.name_english LIKE '%Aruppukottai%')
   OR (b.via_locations LIKE '%Aruppukottai%' AND l_from.name_english LIKE '%Madurai%');
