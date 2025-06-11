-- Diagnostic Query Script for Database-Entity Alignment
-- This script helps verify that database tables match Java entity structures
-- and checks the bus stop assignments for Chennai-Coimbatore route

-- SECTION 1: Check table structure and existence
-- ---------------------------------------------

-- Check which of stops table exists
SELECT
    table_name, 
    COUNT(*) AS record_count,
    'Table exists' AS status
FROM information_schema.tables
JOIN (
    SELECT 'stops' AS table_name, COUNT(*) AS record_count FROM stops
) AS counts USING (table_name)
WHERE table_schema = DATABASE() AND table_name = 'stops'
GROUP BY table_name, record_count;

-- SECTION 2: Bus and Route Data Analysis
-- -------------------------------------

-- Examine all buses in the system
SELECT 
    b.id, 
    b.name, 
    b.bus_number, 
    lf.name AS from_location, 
    lt.name AS to_location, 
    b.departure_time, 
    b.arrival_time,
    (SELECT COUNT(*) FROM stops WHERE bus_id = b.id) AS stop_count
FROM buses b
LEFT JOIN locations lf ON b.from_location_id = lf.id
LEFT JOIN locations lt ON b.to_location_id = lt.id
ORDER BY b.id;

-- Focus on Chennai-Coimbatore buses (IDs 1, 2, 12)
SELECT 
    b.id, 
    b.name, 
    b.bus_number, 
    lf.name AS from_location, 
    lt.name AS to_location,
    (SELECT COUNT(*) FROM stops WHERE bus_id = b.id) AS stop_count
FROM buses b
LEFT JOIN locations lf ON b.from_location_id = lf.id
LEFT JOIN locations lt ON b.to_location_id = lt.id
WHERE b.id IN (1, 2, 12)
ORDER BY b.id;

-- SECTION 3: Bus Stop Details
-- --------------------------

-- Show the complete stop details for our target buses
SELECT 
    b.id AS bus_id, 
    b.name AS bus_name, 
    b.bus_number,
    s.id AS stop_id,
    s.name AS stop_name, 
    l.name AS location_name, 
    l.latitude, 
    l.longitude,
    s.arrival_time, 
    s.departure_time, 
    s.stop_order
FROM buses b
LEFT JOIN stops s ON b.id = s.bus_id
LEFT JOIN locations l ON s.location_id = l.id
WHERE b.id IN (1, 2, 12)
ORDER BY b.id, s.stop_order;

-- SECTION 4: Database Structure Verification
-- ----------------------------------------

-- Check foreign key constraints between tables
SELECT 
    tc.table_name AS source_table,
    kcu.column_name AS source_column,
    kcu.referenced_table_name AS target_table,
    kcu.referenced_column_name AS target_column,
    tc.constraint_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
    ON tc.constraint_schema = kcu.constraint_schema
    AND tc.constraint_name = kcu.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = DATABASE()
    AND (tc.table_name IN ('buses', 'stops')
         OR kcu.referenced_table_name IN ('buses', 'stops'));

-- Check indexes that should match entity annotations and repository queries
SELECT 
    table_name, 
    index_name, 
    GROUP_CONCAT(column_name ORDER BY seq_in_index) AS columns
FROM information_schema.statistics
WHERE table_schema = DATABASE() 
    AND table_name IN ('buses', 'stops', 'locations')
GROUP BY table_name, index_name
ORDER BY table_name, index_name;

-- SECTION 5: Comprehensive Join Check
-- --------------------------------

-- This query verifies that the stop data joins correctly with buses and locations
-- It should show a complete picture of buses with their stops and locations
SELECT 
    b.id AS bus_id, 
    b.name AS bus_name, 
    l_from.name AS origin, 
    l_to.name AS destination,
    s.name AS stop_name,
    l_stop.name AS stop_location,
    s.arrival_time,
    s.departure_time,
    s.stop_order
FROM buses b
LEFT JOIN locations l_from ON b.from_location_id = l_from.id
LEFT JOIN locations l_to ON b.to_location_id = l_to.id
LEFT JOIN stops s ON b.id = s.bus_id
LEFT JOIN locations l_stop ON s.location_id = l_stop.id
WHERE (l_from.name LIKE '%Chennai%' AND l_to.name LIKE '%Coimbatore%')
   OR b.id IN (1, 2, 12)
ORDER BY b.id, s.stop_order;
