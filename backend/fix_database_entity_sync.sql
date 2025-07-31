-- Database Entity Synchronization Script
-- This script ensures database tables are properly aligned with Java entity classes
-- and fixes foreign key relationships to maintain data integrity

-- Step 1: Check if the stops table exists (to match StopJpaEntity @Table annotation)
SET @table_exists = 0;
SELECT COUNT(*) INTO @table_exists FROM information_schema.tables 
WHERE table_schema = DATABASE() AND table_name = 'stops';

-- Confirm the correct table name
SELECT IF(@table_exists > 0,
    'The stops table exists as expected for the StopJpaEntity @Table annotation.',
    'WARNING: The stops table does not exist. It needs to be created to match the StopJpaEntity @Table annotation.') AS message;

-- Step 2: Fix the bus stops assignment issue
-- First verify buses
SELECT id, name, bus_number, from_location_id, to_location_id, departure_time, arrival_time 
FROM buses 
WHERE id IN (1, 2, 12) 
ORDER BY id;

-- Use the correct table name
SET @table_name = 'stops';
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

-- Check and add missing indexes on stops table
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

-- Step 5: Fix potential issues with search functionality
-- Verify the location_id in stops table are valid and exist in locations table
SET @location_check_query = CONCAT(
    'SELECT s.id, s.name, s.bus_id, s.location_id, COUNT(l.id) as location_exists ',
    'FROM ', @table_name, ' s ',
    'LEFT JOIN locations l ON s.location_id = l.id ',
    'GROUP BY s.id ',
    'HAVING location_exists = 0'
);

PREPARE stmt FROM @location_check_query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Fix bus route integrity - ensure from_location_id and to_location_id in buses table match first and last stop
SET @route_integrity_query = '
    SELECT b.id, b.name, b.from_location_id, min_stop.location_id as first_stop_location_id,
           b.to_location_id, max_stop.location_id as last_stop_location_id
    FROM buses b
    LEFT JOIN (
        SELECT bus_id, location_id FROM stops WHERE (bus_id, stop_order) IN (
            SELECT bus_id, MIN(stop_order) FROM stops GROUP BY bus_id
        )
    ) min_stop ON b.id = min_stop.bus_id
    LEFT JOIN (
        SELECT bus_id, location_id FROM stops WHERE (bus_id, stop_order) IN (
            SELECT bus_id, MAX(stop_order) FROM stops GROUP BY bus_id
        )
    ) max_stop ON b.id = max_stop.bus_id
    WHERE b.from_location_id != min_stop.location_id OR b.to_location_id != max_stop.location_id
';

PREPARE stmt FROM @route_integrity_query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Fix any mismatches between buses from/to locations and their first/last stops
SET @fix_bus_routes = '
    UPDATE buses b
    JOIN (
        SELECT bus_id, location_id as first_stop_loc
        FROM stops 
        WHERE (bus_id, stop_order) IN (
            SELECT bus_id, MIN(stop_order) FROM stops GROUP BY bus_id
        )
    ) first_stops ON b.id = first_stops.bus_id
    JOIN (
        SELECT bus_id, location_id as last_stop_loc
        FROM stops 
        WHERE (bus_id, stop_order) IN (
            SELECT bus_id, MAX(stop_order) FROM stops GROUP BY bus_id
        )
    ) last_stops ON b.id = last_stops.bus_id
    SET b.from_location_id = first_stops.first_stop_loc,
        b.to_location_id = last_stops.last_stop_loc
    WHERE b.from_location_id != first_stops.first_stop_loc
       OR b.to_location_id != last_stops.last_stop_loc
';

PREPARE stmt FROM @fix_bus_routes;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Verify bus search endpoints can find routes between common locations
SET @test_search_query = '
    SELECT COUNT(*) as route_count
    FROM buses
    WHERE from_location_id IN (
        SELECT id FROM locations WHERE name IN ("Chennai", "Bangalore", "Coimbatore")
    )
    AND to_location_id IN (
        SELECT id FROM locations WHERE name IN ("Chennai", "Bangalore", "Coimbatore")
    )
';

PREPARE stmt FROM @test_search_query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add a record to migration_history if the table exists
SELECT COUNT(*) INTO @migration_table_exists FROM information_schema.tables
WHERE table_schema = DATABASE() AND table_name = 'migration_history';

SET @migration_insert = IF(@migration_table_exists > 0,
    'INSERT INTO migration_history (migration_name, description, executed_at) VALUES ("database_entity_sync", "Synchronized database schema with entity classes and fixed bus search functionality", NOW())',
    'SELECT "migration_history table does not exist" AS message');

PREPARE stmt FROM @migration_insert;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Verify that the search endpoint will return results for common location pairs
SELECT l1.name AS from_location, l2.name AS to_location,
       COUNT(b.id) AS bus_count
FROM locations l1
CROSS JOIN locations l2
LEFT JOIN buses b ON b.from_location_id = l1.id AND b.to_location_id = l2.id
WHERE l1.id != l2.id
GROUP BY l1.name, l2.name
ORDER BY bus_count DESC
LIMIT 10;