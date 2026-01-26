-- Migration: Add parent_id column to locations table for hierarchical relationships
-- Purpose: Enable city-level locations to have child terminals/stations
-- Example: Chennai (parent) -> CMBT Koyambedu, KCBT Kilambakkam, Madhavaram (children)

-- Add parent_id column
ALTER TABLE locations 
ADD COLUMN parent_id BIGINT DEFAULT NULL AFTER id;

-- Add foreign key constraint
ALTER TABLE locations 
ADD CONSTRAINT fk_location_parent 
FOREIGN KEY (parent_id) REFERENCES locations(id) 
ON DELETE SET NULL;

-- Add index for better query performance
CREATE INDEX idx_locations_parent_id ON locations(parent_id);

-- Add a column to distinguish location types
ALTER TABLE locations 
ADD COLUMN location_type ENUM('CITY', 'TERMINAL', 'STATION', 'VILLAGE', 'TOWN') DEFAULT 'CITY' AFTER parent_id;

-- Add comment for documentation
ALTER TABLE locations 
MODIFY COLUMN parent_id BIGINT DEFAULT NULL 
COMMENT 'Reference to parent location (e.g., Chennai is parent of CMBT, KCBT)';

-- Verify the changes
SELECT 
    COLUMN_NAME, 
    COLUMN_TYPE, 
    IS_NULLABLE, 
    COLUMN_KEY, 
    COLUMN_DEFAULT,
    COLUMN_COMMENT
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'perundhu' 
  AND TABLE_NAME = 'locations' 
  AND COLUMN_NAME IN ('parent_id', 'location_type')
ORDER BY ORDINAL_POSITION;
