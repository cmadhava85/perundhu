-- V9__add_performance_indexes.sql
-- Add composite indexes for query performance optimization

-- Helper procedure to create index if it doesn't exist
DELIMITER //
CREATE PROCEDURE create_index_if_not_exists(
    IN index_name VARCHAR(64),
    IN table_name VARCHAR(64),
    IN index_definition TEXT
)
BEGIN
    DECLARE index_exists INT DEFAULT 0;
    
    SELECT COUNT(1) INTO index_exists
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = table_name
      AND INDEX_NAME = index_name;
    
    IF index_exists = 0 THEN
        SET @sql = CONCAT('CREATE INDEX ', index_name, ' ON ', table_name, '(', index_definition, ')');
        PREPARE stmt FROM @sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END //
DELIMITER ;

-- Helper procedure to create FULLTEXT index if it doesn't exist
DELIMITER //
CREATE PROCEDURE create_fulltext_index_if_not_exists(
    IN index_name VARCHAR(64),
    IN table_name VARCHAR(64),
    IN column_name VARCHAR(64)
)
BEGIN
    DECLARE index_exists INT DEFAULT 0;
    
    SELECT COUNT(1) INTO index_exists
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = table_name
      AND INDEX_NAME = index_name;
    
    IF index_exists = 0 THEN
        SET @sql = CONCAT('CREATE FULLTEXT INDEX ', index_name, ' ON ', table_name, '(', column_name, ')');
        PREPARE stmt FROM @sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END //
DELIMITER ;

-- Create indexes using the helper procedure
CALL create_index_if_not_exists('idx_buses_route_lookup', 'buses', 'from_location_id, to_location_id, departure_time');
CALL create_index_if_not_exists('idx_stops_bus_sequence', 'stops', 'bus_id, stop_order');
CALL create_index_if_not_exists('idx_contributions_status_date', 'route_contributions', 'status, submission_date');
CALL create_index_if_not_exists('idx_image_contributions_status', 'image_contributions', 'status, submission_date');
CALL create_fulltext_index_if_not_exists('idx_location_name_fulltext', 'locations', 'name');
CALL create_index_if_not_exists('idx_buses_name', 'buses', 'name');
CALL create_index_if_not_exists('idx_buses_number', 'buses', 'bus_number');

-- Drop the helper procedures
DROP PROCEDURE IF EXISTS create_index_if_not_exists;
DROP PROCEDURE IF EXISTS create_fulltext_index_if_not_exists;

-- Add check constraints using similar approach
DELIMITER //
CREATE PROCEDURE add_constraint_if_not_exists(
    IN constraint_name VARCHAR(64),
    IN table_name VARCHAR(64),
    IN constraint_definition TEXT
)
BEGIN
    DECLARE constraint_exists INT DEFAULT 0;
    
    SELECT COUNT(1) INTO constraint_exists
    FROM information_schema.TABLE_CONSTRAINTS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = table_name
      AND CONSTRAINT_NAME = constraint_name;
    
    IF constraint_exists = 0 THEN
        SET @sql = CONCAT('ALTER TABLE ', table_name, ' ADD CONSTRAINT ', constraint_name, ' ', constraint_definition);
        PREPARE stmt FROM @sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END //
DELIMITER ;

-- Add check constraints
CALL add_constraint_if_not_exists('chk_stops_order', 'stops', 'CHECK (stop_order >= 0)');
CALL add_constraint_if_not_exists('chk_latitude', 'locations', 'CHECK (latitude IS NULL OR (latitude BETWEEN -90 AND 90))');
CALL add_constraint_if_not_exists('chk_longitude', 'locations', 'CHECK (longitude IS NULL OR (longitude BETWEEN -180 AND 180))');

-- Drop the helper procedure
DROP PROCEDURE IF EXISTS add_constraint_if_not_exists;

-- Add computed column for journey duration (if not exists)
-- Note: MySQL 5.7+ supports generated columns
SET @column_exists = (
  SELECT COUNT(*) 
  FROM information_schema.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'buses' 
    AND COLUMN_NAME = 'journey_duration_minutes'
);

SET @sql = IF(
  @column_exists = 0,
  'ALTER TABLE buses ADD COLUMN journey_duration_minutes INT GENERATED ALWAYS AS (TIMESTAMPDIFF(MINUTE, departure_time, arrival_time)) STORED',
  'SELECT "Column journey_duration_minutes already exists" AS message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add stops_count column for denormalization
SET @column_exists = (
  SELECT COUNT(*) 
  FROM information_schema.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'buses' 
    AND COLUMN_NAME = 'stops_count'
);

SET @sql = IF(
  @column_exists = 0,
  'ALTER TABLE buses ADD COLUMN stops_count INT DEFAULT 0',
  'SELECT "Column stops_count already exists" AS message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Initialize stops_count for existing buses
UPDATE buses b
SET stops_count = (
  SELECT COUNT(*) 
  FROM stops s 
  WHERE s.bus_id = b.id
)
WHERE stops_count = 0 OR stops_count IS NULL;

-- Add index on journey_duration for sorting
CREATE INDEX idx_buses_duration 
ON buses(journey_duration_minutes);

-- Performance statistics
SELECT 
  'Performance indexes added successfully' AS status,
  COUNT(*) AS total_indexes
FROM information_schema.STATISTICS
WHERE TABLE_SCHEMA = DATABASE()
  AND INDEX_NAME LIKE 'idx_%';
