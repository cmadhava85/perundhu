-- V101__add_location_hierarchy.sql
-- Adds hierarchical location support for parent-child relationships
-- Purpose: Enable city-level searches to include buses from all child terminals
-- Example: Searching "Chennai" will include buses from CMBT, KCBT, Madhavaram, etc.

-- Add parent_id column for hierarchical relationships
ALTER TABLE locations 
ADD COLUMN parent_id BIGINT DEFAULT NULL 
COMMENT 'Reference to parent location (e.g., Chennai is parent of CMBT, KCBT)' 
AFTER id;

-- Add location_type column to distinguish between cities, terminals, stations, etc.
ALTER TABLE locations 
ADD COLUMN location_type VARCHAR(20) DEFAULT 'CITY' 
COMMENT 'Type of location: CITY, TERMINAL, STATION, VILLAGE, TOWN' 
AFTER parent_id;

-- Add foreign key constraint for parent relationship
ALTER TABLE locations 
ADD CONSTRAINT fk_location_parent 
FOREIGN KEY (parent_id) REFERENCES locations(id) 
ON DELETE SET NULL;

-- Add indexes for performance
CREATE INDEX idx_locations_parent_id ON locations(parent_id);
CREATE INDEX idx_locations_location_type ON locations(location_type);

-- Set up Chennai hierarchy
-- Mark Chennai as CITY
UPDATE locations 
SET location_type = 'CITY' 
WHERE name = 'Chennai' AND district = 'Kancheepuram';

-- Link Chennai terminals to Chennai city
UPDATE locations 
SET parent_id = (SELECT id FROM (SELECT id FROM locations WHERE name = 'Chennai' AND district = 'Kancheepuram' LIMIT 1) AS parent),
    location_type = 'TERMINAL'
WHERE name IN (
    'Chennai - CMBT (Koyambedu)',
    'KCBT KILAMBAKKAM',
    'CHENNAI TAMBARAM',
    'CHENNAI AIRPORT',
    'CHENNAI KALAIGNAR CBT'
) OR name LIKE '%Chennai %';

-- Set up Madurai hierarchy
UPDATE locations 
SET location_type = 'CITY' 
WHERE name = 'Madurai' AND district = 'Madurai';

UPDATE locations 
SET parent_id = (SELECT id FROM (SELECT id FROM locations WHERE name = 'Madurai' AND district = 'Madurai' LIMIT 1) AS parent),
    location_type = 'TERMINAL'
WHERE name LIKE 'Madurai -%';

-- Set up Coimbatore hierarchy
UPDATE locations 
SET location_type = 'CITY' 
WHERE name = 'Coimbatore';

UPDATE locations 
SET parent_id = (SELECT id FROM (SELECT id FROM locations WHERE name = 'Coimbatore' LIMIT 1) AS parent),
    location_type = 'TERMINAL'
WHERE name LIKE 'Coimbatore -%';

-- Set up Trichy hierarchy
UPDATE locations 
SET location_type = 'CITY' 
WHERE name IN ('Trichy', 'Tiruchirappalli');

UPDATE locations 
SET parent_id = (SELECT id FROM (SELECT id FROM locations WHERE name IN ('Trichy', 'Tiruchirappalli') LIMIT 1) AS parent),
    location_type = 'TERMINAL'
WHERE name LIKE 'Trichy -%' OR name LIKE 'Tiruchirappalli -%';

-- Set up Salem hierarchy  
UPDATE locations 
SET location_type = 'CITY' 
WHERE name = 'Salem';

UPDATE locations 
SET parent_id = (SELECT id FROM (SELECT id FROM locations WHERE name = 'Salem' LIMIT 1) AS parent),
    location_type = 'TERMINAL'
WHERE name LIKE 'Salem -%';

-- Verification: Show hierarchy setup
-- (Comment out in production, useful for migration testing)
/*
SELECT 
    p.id as parent_id,
    p.name as parent_name,
    p.location_type as parent_type,
    COUNT(c.id) as child_count
FROM locations p
LEFT JOIN locations c ON c.parent_id = p.id
WHERE p.location_type = 'CITY'
GROUP BY p.id, p.name, p.location_type
HAVING child_count > 0
ORDER BY child_count DESC;
*/
