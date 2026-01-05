-- V51: Add missing columns to route_issues table
-- Purpose: Add columns required by RouteIssueJpaEntity
-- Date: 2026-01-05
-- Safety: This migration is idempotent and will not fail if columns already exist

-- Procedure to safely add column if it doesn't exist
DELIMITER $$

DROP PROCEDURE IF EXISTS add_column_if_not_exists$$

CREATE PROCEDURE add_column_if_not_exists(
    IN table_name VARCHAR(64),
    IN column_name VARCHAR(64),
    IN column_definition VARCHAR(256)
)
BEGIN
    DECLARE CONTINUE HANDLER FOR 1060 BEGIN END;
    SET @ddl = CONCAT('ALTER TABLE ', table_name, ' ADD COLUMN ', column_name, ' ', column_definition);
    PREPARE stmt FROM @ddl;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
END$$

DELIMITER ;

-- Add missing columns to route_issues
CALL add_column_if_not_exists('route_issues', 'bus_name', 'VARCHAR(255)');
CALL add_column_if_not_exists('route_issues', 'bus_number', 'VARCHAR(50)');
CALL add_column_if_not_exists('route_issues', 'from_location', 'VARCHAR(255)');
CALL add_column_if_not_exists('route_issues', 'to_location', 'VARCHAR(255)');
CALL add_column_if_not_exists('route_issues', 'suggested_departure_time', 'VARCHAR(50)');
CALL add_column_if_not_exists('route_issues', 'suggested_arrival_time', 'VARCHAR(50)');
CALL add_column_if_not_exists('route_issues', 'last_traveled_date', 'VARCHAR(50)');
CALL add_column_if_not_exists('route_issues', 'priority', 'VARCHAR(50)');
CALL add_column_if_not_exists('route_issues', 'report_count', 'INT');
CALL add_column_if_not_exists('route_issues', 'reporter_id', 'VARCHAR(100)');
CALL add_column_if_not_exists('route_issues', 'admin_notes', 'TEXT');
CALL add_column_if_not_exists('route_issues', 'resolution', 'TEXT');
CALL add_column_if_not_exists('route_issues', 'updated_at', 'DATETIME');

-- Drop the temporary procedure
DROP PROCEDURE IF EXISTS add_column_if_not_exists;
