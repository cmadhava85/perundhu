-- Add stops_json column to route_contributions table
-- This field stores intermediate stops as JSON for routes extracted from images

-- Only add if not exists (in case it was manually added)
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'route_contributions' 
    AND COLUMN_NAME = 'stops_json');

SET @sql = IF(@col_exists = 0, 
    'ALTER TABLE route_contributions ADD COLUMN stops_json TEXT NULL',
    'SELECT "Column stops_json already exists"');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
