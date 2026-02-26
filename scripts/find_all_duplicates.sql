-- Find all location duplicates (case-insensitive grouping)
-- This will show which locations need to be merged

SELECT 
    LOWER(name) as normalized_name,
    COUNT(*) as duplicate_count,
    GROUP_CONCAT(id ORDER BY id) as all_ids,
    GROUP_CONCAT(name ORDER BY id SEPARATOR ' | ') as all_names,
    -- Keep the ID with the highest route count (or lowest ID if tied)
    SUBSTRING_INDEX(GROUP_CONCAT(id ORDER BY 
        (SELECT COUNT(*) FROM buses b WHERE b.start_location_id = l.id OR b.end_location_id = l.id) DESC, 
        id ASC), ',', 1) as keep_id,
    MAX((SELECT COUNT(*) FROM buses b WHERE b.start_location_id = l.id OR b.end_location_id = l.id)) as max_route_count
FROM locations l
GROUP BY LOWER(name)
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC, max_route_count DESC
LIMIT 50;
