-- Add unique indexes to prevent duplicate inserts from bulk uploads

-- Create procedure to safely create unique indexes
DROP PROCEDURE IF EXISTS create_unique_index_safe;

DELIMITER $$
CREATE PROCEDURE create_unique_index_safe(
    IN p_table_name VARCHAR(128),
    IN p_index_name VARCHAR(128),
    IN p_index_columns VARCHAR(512)
)
BEGIN
    DECLARE index_exists INT DEFAULT 0;
    
    -- Check if index exists
    SELECT COUNT(1) INTO index_exists
    FROM information_schema.statistics
    WHERE table_schema = DATABASE()
    AND table_name = p_table_name
    AND index_name = p_index_name;
    
    -- Create index if it doesn't exist
    IF index_exists = 0 THEN
        SET @sql = CONCAT('CREATE UNIQUE INDEX ', p_index_name, ' ON ', p_table_name, ' (', p_index_columns, ')');
        PREPARE stmt FROM @sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
        SELECT CONCAT('Created unique index: ', p_index_name) AS status;
    ELSE
        SELECT CONCAT('Unique index already exists: ', p_index_name) AS status;
    END IF;
END$$
DELIMITER ;

-- Create unique indexes safely
CALL create_unique_index_safe('locations', 'uq_locations_name_district_state', 'name, district, state');
CALL create_unique_index_safe('buses', 'uq_buses_bus_number_route_time', 'bus_number, from_location_id, to_location_id, departure_time, arrival_time');
CALL create_unique_index_safe('stops', 'uq_stops_bus_order', 'bus_id, stop_order');

-- Clean up procedure
DROP PROCEDURE IF EXISTS create_unique_index_safe;
