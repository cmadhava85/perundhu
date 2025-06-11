-- V2.4__verify_entity_consistency.sql
-- This migration verifies and maintains consistency between database tables and JPA entities

-- Set strict SQL mode to catch errors
SET SQL_MODE = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION';

-- Make sure we're using the table name that matches @Table annotation in StopJpaEntity
-- The entity uses name="stop" (singular) in the @Table annotation

-- First check if we have the correct table
SET @stops_exists = 0;
SELECT COUNT(*) INTO @stops_exists FROM information_schema.tables 
WHERE table_schema = DATABASE() AND table_name = 'stops';

SET @stop_exists = 0;
SELECT COUNT(*) INTO @stop_exists FROM information_schema.tables 
WHERE table_schema = DATABASE() AND table_name = 'stop';

-- If 'stops' exists but 'stop' doesn't, rename it (migrate to proper naming)
SET @rename_needed = @stops_exists > 0 AND @stop_exists = 0;

-- Use dynamic SQL with prepared statements since we can't use conditionals directly
SET @rename_statement = IF(@rename_needed, 'RENAME TABLE stops TO stop', 'SELECT "Table is already correct or does not exist" AS message');

PREPARE stmt FROM @rename_statement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Update any references to the old table name in foreign keys
-- This is a safety check to update any constraints that might reference the old table name

-- Verify critical foreign key relationships match the entity mappings
-- 1. Bus entity references

-- Make sure bus locations reference locations table correctly
SELECT COUNT(*) INTO @fk_exists_from FROM information_schema.key_column_usage 
WHERE table_schema = DATABASE() 
  AND table_name = 'buses' 
  AND column_name = 'from_location_id'
  AND referenced_table_name = 'locations';

SELECT COUNT(*) INTO @fk_exists_to FROM information_schema.key_column_usage 
WHERE table_schema = DATABASE() 
  AND table_name = 'buses' 
  AND column_name = 'to_location_id'
  AND referenced_table_name = 'locations';

-- If foreign keys are missing, recreate them
-- The ALTER TABLE statements will be executed only if needed
SET @fk_from_statement = IF(@fk_exists_from = 0, 
    'ALTER TABLE buses ADD CONSTRAINT fk_bus_from_location FOREIGN KEY (from_location_id) REFERENCES locations(id)',
    'SELECT "Foreign key from buses.from_location_id to locations already exists" AS message');

SET @fk_to_statement = IF(@fk_exists_to = 0, 
    'ALTER TABLE buses ADD CONSTRAINT fk_bus_to_location FOREIGN KEY (to_location_id) REFERENCES locations(id)',
    'SELECT "Foreign key from buses.to_location_id to locations already exists" AS message');

PREPARE stmt FROM @fk_from_statement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

PREPARE stmt FROM @fk_to_statement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 2. Stop entity references - use the correct table name based on earlier check
SET @stop_table = IF(@stop_exists > 0, 'stop', 'stops');

SET @check_stop_bus_fk = CONCAT(
    'SELECT COUNT(*) INTO @fk_stop_bus_exists FROM information_schema.key_column_usage ',
    'WHERE table_schema = DATABASE() ',
    'AND table_name = "', @stop_table, '" ',
    'AND column_name = "bus_id" ',
    'AND referenced_table_name = "buses"'
);

PREPARE stmt FROM @check_stop_bus_fk;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @fk_stop_bus_statement = CONCAT(
    'SET @add_fk_stop_bus = IF(@fk_stop_bus_exists = 0, ',
    '"ALTER TABLE ', @stop_table, ' ADD CONSTRAINT fk_stop_bus FOREIGN KEY (bus_id) REFERENCES buses(id)", ',
    '"SELECT \"Foreign key from ', @stop_table, '.bus_id to buses already exists\" AS message")'
);

PREPARE stmt FROM @fk_stop_bus_statement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

PREPARE stmt FROM @add_fk_stop_bus;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add missing indexes that match those defined in the repository layer
-- These correspond to query methods in the repositories

-- Make sure we have proper indexes on the stop table
SET @check_stop_index = CONCAT(
    'SELECT COUNT(*) INTO @idx_stop_sequence_exists FROM information_schema.statistics ',
    'WHERE table_schema = DATABASE() ',
    'AND table_name = "', @stop_table, '" ',
    'AND index_name = "idx_stops_sequence"'
);

PREPARE stmt FROM @check_stop_index;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @create_stop_index = CONCAT(
    'SET @add_stop_index = IF(@idx_stop_sequence_exists = 0, ',
    '"CREATE INDEX idx_stops_sequence ON ', @stop_table, '(bus_id, stop_order)", ',
    '"SELECT \"Index idx_stops_sequence already exists on ', @stop_table, '\" AS message")'
);

PREPARE stmt FROM @create_stop_index;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

PREPARE stmt FROM @add_stop_index;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Make sure BusLocationHistory table references are correct (if table exists)
SELECT COUNT(*) INTO @bus_location_history_exists FROM information_schema.tables
WHERE table_schema = DATABASE() AND table_name = 'bus_location_history';

SET @check_blh_fk = IF(@bus_location_history_exists > 0,
    'SELECT COUNT(*) INTO @blh_fk_exists FROM information_schema.key_column_usage
     WHERE table_schema = DATABASE() 
     AND table_name = "bus_location_history"
     AND column_name = "bus_id" 
     AND referenced_table_name = "buses"',
    'SELECT 0 INTO @blh_fk_exists');

PREPARE stmt FROM @check_blh_fk;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @blh_fk_statement = IF(@bus_location_history_exists > 0, 
    CONCAT('SET @add_blh_fk = IF(@blh_fk_exists = 0, ',
           '"ALTER TABLE bus_location_history ADD CONSTRAINT fk_bus_location_history_bus ',
           'FOREIGN KEY (bus_id) REFERENCES buses(id)", ',
           '"SELECT \"Foreign key from bus_location_history.bus_id to buses already exists\" AS message")'),
    'SET @add_blh_fk = "SELECT \"bus_location_history table does not exist\" AS message"');

PREPARE stmt FROM @blh_fk_statement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

PREPARE stmt FROM @add_blh_fk;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Record this verification in migration history
INSERT INTO migration_history (migration_name, description, executed_at)
VALUES ('V2.4__verify_entity_consistency', 'Verified database schema consistency with JPA entities', NOW());