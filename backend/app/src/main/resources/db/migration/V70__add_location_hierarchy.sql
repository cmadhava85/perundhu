-- V70__add_location_hierarchy.sql
-- Adds hierarchical location support for parent-child relationships
-- Purpose: Enable city-level searches to include buses from all child terminals
-- Example: Searching "Chennai" will include buses from CMBT, KCBT, Madhavaram, etc.

-- Create stored procedures for idempotent schema changes
DELIMITER //

CREATE PROCEDURE IF NOT EXISTS add_parent_id_column()
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'locations' 
    AND COLUMN_NAME = 'parent_id' 
    AND TABLE_SCHEMA = DATABASE()
  ) THEN
    ALTER TABLE locations 
    ADD COLUMN parent_id BIGINT DEFAULT NULL 
    COMMENT 'Reference to parent location (e.g., Chennai is parent of CMBT, KCBT)' 
    AFTER id;
  END IF;
END //

CREATE PROCEDURE IF NOT EXISTS add_location_type_column()
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'locations' 
    AND COLUMN_NAME = 'location_type' 
    AND TABLE_SCHEMA = DATABASE()
  ) THEN
    ALTER TABLE locations 
    ADD COLUMN location_type VARCHAR(20) DEFAULT 'CITY' 
    COMMENT 'Type of location: CITY, TERMINAL, STATION, VILLAGE, TOWN' 
    AFTER parent_id;
  END IF;
END //

CREATE PROCEDURE IF NOT EXISTS add_location_parent_fk()
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
    WHERE TABLE_NAME = 'locations' 
    AND COLUMN_NAME = 'parent_id' 
    AND CONSTRAINT_NAME = 'fk_location_parent' 
    AND TABLE_SCHEMA = DATABASE()
  ) THEN
    ALTER TABLE locations 
    ADD CONSTRAINT fk_location_parent 
    FOREIGN KEY (parent_id) REFERENCES locations(id) 
    ON DELETE SET NULL;
  END IF;
END //

CREATE PROCEDURE IF NOT EXISTS add_parent_id_index()
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.STATISTICS 
    WHERE TABLE_NAME = 'locations' 
    AND INDEX_NAME = 'idx_locations_parent_id' 
    AND TABLE_SCHEMA = DATABASE()
  ) THEN
    CREATE INDEX idx_locations_parent_id ON locations(parent_id);
  END IF;
END //

CREATE PROCEDURE IF NOT EXISTS add_location_type_index()
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.STATISTICS 
    WHERE TABLE_NAME = 'locations' 
    AND INDEX_NAME = 'idx_locations_location_type' 
    AND TABLE_SCHEMA = DATABASE()
  ) THEN
    CREATE INDEX idx_locations_location_type ON locations(location_type);
  END IF;
END //

DELIMITER ;

-- Execute all procedures
CALL add_parent_id_column();
CALL add_location_type_column();
CALL add_location_parent_fk();
CALL add_parent_id_index();
CALL add_location_type_index();

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
