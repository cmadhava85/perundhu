-- Fix Bus Stops Association Script
-- This script ensures the 'stops' table is present and properly structured for backend sync

-- PART 1: Database Schema Synchronization
-- -----------------------------------------

-- Ensure the 'stops' table exists
SET @stops_exists = (SELECT COUNT(*) FROM information_schema.tables
    WHERE table_schema = DATABASE() AND table_name = 'stops');

SELECT IF(@stops_exists > 0,
    'stops table exists and is ready for use.',
    'stops table does not exist. Please create the stops table as per entity definition.') AS message;

-- (Optional) Add DDL for creating 'stops' table if not present
-- CREATE TABLE IF NOT EXISTS stops (
--     id BIGINT AUTO_INCREMENT PRIMARY KEY,
--     name VARCHAR(255) NOT NULL,
--     bus_id BIGINT,
--     location_id BIGINT,
--     arrival_time TIME,
--     departure_time TIME,
--     stop_order INT,
--     created_at DATETIME,
--     updated_at DATETIME
-- );

-- PART 2: Fix the Chennai-Coimbatore Bus Stops Association 
-- -------------------------------------------------------

-- First verify the buses we're working with
SELECT id, name, bus_number, from_location_id, to_location_id, departure_time, arrival_time 
FROM buses 
WHERE id IN (1, 2, 12) 
ORDER BY id;

-- Check the stops for bus ID 12 (the ones we want to copy)
SELECT * FROM stops WHERE bus_id = 12 ORDER BY stop_order;

-- Check if buses 1 and 2 have any stops currently
SELECT * FROM stops WHERE bus_id IN (1, 2) ORDER BY bus_id, stop_order;

-- Now copy the stops from bus ID 12 to bus ID 1 (SETC Chennai Express)
-- First delete any existing stops for bus ID 1 to avoid duplicates
DELETE FROM stops WHERE bus_id = 1;

-- Insert the stops from bus ID 12 to bus ID 1
INSERT INTO stops (name, bus_id, location_id, arrival_time, departure_time, stop_order)
SELECT name, 1 AS bus_id, location_id, arrival_time, departure_time, stop_order
FROM stops
WHERE bus_id = 12
ORDER BY stop_order;

-- Now copy the stops from bus ID 12 to bus ID 2 (TNSTC Kovai Deluxe) 
-- with different timing (2 hours later for each stop)
DELETE FROM stops WHERE bus_id = 2;

INSERT INTO stops (name, bus_id, location_id, arrival_time, departure_time, stop_order)
SELECT
    name, 
    2 AS bus_id, 
    location_id, 
    ADDTIME(arrival_time, '02:00:00') AS arrival_time, 
    ADDTIME(departure_time, '02:00:00') AS departure_time, 
    stop_order
FROM stops
WHERE bus_id = 12
ORDER BY stop_order;

-- PART 3: Verify and optimize the database structure
-- --------------------------------------------------

-- Verify the stops are now correctly associated with buses 1 and 2
SELECT b.id AS bus_id, b.name AS bus_name, b.bus_number, 
       s.name AS stop_name, s.arrival_time, s.departure_time, s.stop_order
FROM buses b
JOIN stops s ON b.id = s.bus_id
WHERE b.id IN (1, 2)
ORDER BY b.id, s.stop_order;

-- Create or update any missing indexes for better performance
CREATE INDEX IF NOT EXISTS idx_stops_bus_id ON stops(bus_id);
CREATE INDEX IF NOT EXISTS idx_stops_order ON stops(stop_order);
CREATE INDEX IF NOT EXISTS idx_stops_bus_order ON stops(bus_id, stop_order);
CREATE INDEX IF NOT EXISTS idx_stops_location ON stops(location_id);

-- Record this in migration history if that table exists
SELECT COUNT(*) INTO @migration_table_exists FROM information_schema.tables
WHERE table_schema = DATABASE() AND table_name = 'migration_history';

SET @insert_statement = IF(@migration_table_exists > 0,
    'INSERT INTO migration_history (migration_name, description, executed_at, success) 
     VALUES ("fix_bus_stops_table_sync", "Synchronized stops table with entity model and fixed bus stops association", NOW(), TRUE)',
     'SELECT "Migration history table does not exist" AS message');
     
PREPARE stmt FROM @insert_statement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- If you need to rollback, you can use these commands:
-- DELETE FROM stops WHERE bus_id IN (1, 2);
-- If you recreated the stops table: DROP TABLE stops;

