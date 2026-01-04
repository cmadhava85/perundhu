-- V46: Add missing columns to route_contributions table
-- Purpose: Add columns required by RouteContributionJpaEntity that were missing from initial schema
-- Date: 2026-01-04
-- Safety: This migration is idempotent and will not fail if columns already exist in preprod

-- Procedure to safely add columns if they don't exist
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

-- Procedure to safely add indexes if they don't exist
DROP PROCEDURE IF EXISTS add_index_if_not_exists$$

CREATE PROCEDURE add_index_if_not_exists(
    IN table_name VARCHAR(64),
    IN index_name VARCHAR(64),
    IN column_name VARCHAR(64)
)
BEGIN
    DECLARE CONTINUE HANDLER FOR 1061 BEGIN END;
    SET @ddl = CONCAT('ALTER TABLE ', table_name, ' ADD INDEX ', index_name, ' (', column_name, ')');
    PREPARE stmt FROM @ddl;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
END$$

DELIMITER ;

-- Add missing columns to route_contributions
CALL add_column_if_not_exists('route_contributions', 'user_id', 'VARCHAR(50)');
CALL add_column_if_not_exists('route_contributions', 'bus_name', 'VARCHAR(255)');
CALL add_column_if_not_exists('route_contributions', 'from_location_name', 'VARCHAR(255)');
CALL add_column_if_not_exists('route_contributions', 'to_location_name', 'VARCHAR(255)');
CALL add_column_if_not_exists('route_contributions', 'departure_time', 'VARCHAR(50)');
CALL add_column_if_not_exists('route_contributions', 'arrival_time', 'VARCHAR(50)');
CALL add_column_if_not_exists('route_contributions', 'schedule_info', 'TEXT');
CALL add_column_if_not_exists('route_contributions', 'processed_date', 'DATETIME');
CALL add_column_if_not_exists('route_contributions', 'validation_message', 'TEXT');
CALL add_column_if_not_exists('route_contributions', 'source_bus_id', 'BIGINT');
CALL add_column_if_not_exists('route_contributions', 'contribution_type', 'VARCHAR(50)');
CALL add_column_if_not_exists('route_contributions', 'from_latitude', 'DECIMAL(10, 8)');
CALL add_column_if_not_exists('route_contributions', 'from_longitude', 'DECIMAL(11, 8)');
CALL add_column_if_not_exists('route_contributions', 'to_latitude', 'DECIMAL(10, 8)');
CALL add_column_if_not_exists('route_contributions', 'to_longitude', 'DECIMAL(11, 8)');

-- Add indexes for better query performance (safely ignores if they already exist)
CALL add_index_if_not_exists('route_contributions', 'idx_route_contributions_user_id', 'user_id');
CALL add_index_if_not_exists('route_contributions', 'idx_route_contributions_contribution_type', 'contribution_type');

-- Drop the temporary procedures
DROP PROCEDURE IF EXISTS add_column_if_not_exists;
DROP PROCEDURE IF EXISTS add_index_if_not_exists;
