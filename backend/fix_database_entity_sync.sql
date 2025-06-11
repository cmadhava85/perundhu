-- Database Entity Synchronization Script
-- This script ensures database tables are properly aligned with Java entity classes
-- and fixes foreign key relationships to maintain data integrity

-- Step 1: Check if we need to rename the stops table to match StopJpaEntity @Table annotation
SET @table_exists = 0;
SELECT COUNT(*) INTO @table_exists FROM information_schema.tables 
WHERE table_schema = DATABASE() AND table_name = 'stops';

SET @stop_singular_exists = 0;
SELECT COUNT(*) INTO @stop_singular_exists FROM information_schema.tables 
WHERE table_schema = DATABASE() AND table_name = 'stop';

-- If 'stops' exists but 'stop' doesn't, rename it
SET @rename_needed = @table_exists AND NOT @stop_singular_exists;
SET @rename_statement = IF(@rename_needed, 'RENAME TABLE stops TO stop', 'SELECT "No rename needed" AS message');

PREPARE stmt FROM @rename_statement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Step 2: Fix the bus stops assignment issue as in the original script
-- First verify buses
SELECT id, name, bus_number, from_location_id, to_location_id, departure_time, arrival_time 
FROM buses 
WHERE id IN (1, 2, 12) 
ORDER BY id;

-- Use the correct table name (could be either 'stop' or 'stops' depending on rename operation)
SET @table_name = IF(@stop_singular_exists OR @rename_needed, 'stop', 'stops');
SET @select_query = CONCAT('SELECT * FROM ', @table_name, ' WHERE bus_id = 12 ORDER BY stop_order');

PREPARE stmt FROM @select_query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check if buses 1 and 2 have any stops currently
SET @check_query = CONCAT('SELECT * FROM ', @table_name, ' WHERE bus_id IN (1, 2) ORDER BY bus_id, stop_order');

PREPARE stmt FROM @check_query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Delete existing stops for bus IDs 1 and 2
SET @delete_query1 = CONCAT('DELETE FROM ', @table_name, ' WHERE bus_id = 1');
SET @delete_query2 = CONCAT('DELETE FROM ', @table_name, ' WHERE bus_id = 2');

PREPARE stmt FROM @delete_query1;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

PREPARE stmt FROM @delete_query2;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Copy stops from bus ID 12 to bus ID 1 (SETC Chennai Express)
SET @insert_query1 = CONCAT(
    'INSERT INTO ', @table_name, ' (name, bus_id, location_id, arrival_time, departure_time, stop_order) ',
    'SELECT name, 1 AS bus_id, location_id, arrival_time, departure_time, stop_order ',
    'FROM ', @table_name, ' WHERE bus_id = 12 ORDER BY stop_order'
);

PREPARE stmt FROM @insert_query1;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Copy stops from bus ID 12 to bus ID 2 (TNSTC Kovai Deluxe) with adjusted times
SET @insert_query2 = CONCAT(
    'INSERT INTO ', @table_name, ' (name, bus_id, location_id, arrival_time, departure_time, stop_order) ',
    'SELECT name, 2 AS bus_id, location_id, ADDTIME(arrival_time, "02:00:00") AS arrival_time, ',
    'ADDTIME(departure_time, "02:00:00") AS departure_time, stop_order ',
    'FROM ', @table_name, ' WHERE bus_id = 12 ORDER BY stop_order'
);

PREPARE stmt FROM @insert_query2;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Step 3: Verify all DB indexes match Java entity annotations for critical tables
-- This will create any missing indexes needed by entity annotations

-- Check and add missing indexes on buses table
SELECT COUNT(*) INTO @index_exists FROM information_schema.statistics
WHERE table_schema = DATABASE() AND table_name = 'buses' 
AND index_name = 'idx_buses_locations';

SET @create_index_statement = IF(@index_exists = 0, 
    'CREATE INDEX idx_buses_locations ON buses(from_location_id, to_location_id)',
    'SELECT "Index idx_buses_locations already exists" AS message');

PREPARE stmt FROM @create_index_statement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check and add missing indexes on stop/stops table
SET @stop_index_query = CONCAT(
    'SELECT COUNT(*) INTO @stop_index_exists FROM information_schema.statistics ',
    'WHERE table_schema = DATABASE() AND table_name = "', @table_name, '" ',
    'AND index_name = "idx_stops_sequence"'
);

PREPARE stmt FROM @stop_index_query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @create_stop_index = CONCAT(
    'CREATE INDEX idx_stops_sequence ON ', @table_name, '(bus_id, stop_order)'
);

-- Fix: Properly escape the quotes in the SQL statement
SET @create_stop_index_statement = CONCAT(
    'SET @create_statement = IF(@stop_index_exists = 0, "', @create_stop_index, '", ',
    '"SELECT ''Index idx_stops_sequence already exists'' AS message")'
);

PREPARE stmt FROM @create_stop_index_statement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

PREPARE stmt FROM @create_statement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Step 4: Verify the stops are now correctly associated with buses 1 and 2
SET @verify_query = CONCAT(
    'SELECT b.id AS bus_id, b.name AS bus_name, b.bus_number, ',
    's.name AS stop_name, s.arrival_time, s.departure_time, s.stop_order ',
    'FROM buses b ',
    'JOIN ', @table_name, ' s ON b.id = s.bus_id ',
    'WHERE b.id IN (1, 2) ',
    'ORDER BY b.id, s.stop_order'
);

PREPARE stmt FROM @verify_query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add a record to migration_history if the table exists
SELECT COUNT(*) INTO @migration_table_exists FROM information_schema.tables
WHERE table_schema = DATABASE() AND table_name = 'migration_history';

SET @migration_insert = IF(@migration_table_exists > 0,
    'INSERT INTO migration_history (migration_name, description, executed_at) VALUES ("database_entity_sync", "Synchronized database schema with entity classes", NOW())',
    'SELECT "migration_history table does not exist" AS message');

PREPARE stmt FROM @migration_insert;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;