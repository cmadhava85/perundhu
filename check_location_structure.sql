-- Check Chennai-related locations and their bus counts
SELECT 
    l.id,
    l.name,
    l.district,
    COUNT(DISTINCT b.id) as bus_count_from_here
FROM locations l
LEFT JOIN buses b ON b.from_location_id = l.id
WHERE l.name LIKE '%Chennai%' OR l.name LIKE '%CHENNAI%' 
   OR l.name LIKE '%Koyambedu%' OR l.name LIKE '%Kilambakkam%' 
   OR l.name LIKE '%Madhavaram%'
GROUP BY l.id, l.name, l.district
ORDER BY bus_count_from_here DESC;
