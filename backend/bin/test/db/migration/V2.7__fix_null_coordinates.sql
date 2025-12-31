-- V2.5__fix_null_coordinates.sql
-- Fix locations with null or invalid coordinates

-- First, update any problematic reference locations
UPDATE locations 
SET latitude = NULL, longitude = NULL 
WHERE latitude = 0.0 AND longitude = 0.0 AND name = 'Reference Location';

-- Add constraints to ensure valid coordinate ranges when coordinates are provided
-- Only add if they don't already exist
SET @constraint_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS 
    WHERE CONSTRAINT_NAME = 'chk_latitude_range' AND TABLE_SCHEMA = 'perundhu');
SET @sql = IF(@constraint_exists = 0, 
    'ALTER TABLE locations ADD CONSTRAINT chk_latitude_range CHECK (latitude IS NULL OR (latitude >= -90.0 AND latitude <= 90.0))', 
    'SELECT "Latitude constraint already exists" as message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @constraint_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS 
    WHERE CONSTRAINT_NAME = 'chk_longitude_range' AND TABLE_SCHEMA = 'perundhu');
SET @sql = IF(@constraint_exists = 0, 
    'ALTER TABLE locations ADD CONSTRAINT chk_longitude_range CHECK (longitude IS NULL OR (longitude >= -180.0 AND longitude <= 180.0))', 
    'SELECT "Longitude constraint already exists" as message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Update any stops that reference invalid location IDs
UPDATE stops SET location_id = NULL WHERE location_id = 0 OR location_id NOT IN (SELECT id FROM locations);

-- Add index for locations with coordinates for better performance
-- Only add if it doesn't already exist
SET @index_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
    WHERE INDEX_NAME = 'idx_locations_coordinates' AND TABLE_SCHEMA = 'perundhu');
SET @sql = IF(@index_exists = 0, 
    'CREATE INDEX idx_locations_coordinates ON locations(latitude, longitude)', 
    'SELECT "Coordinates index already exists" as message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;