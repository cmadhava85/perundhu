-- V50: Add all missing columns to image_contributions table
-- Purpose: Add columns required by ImageContributionJpaEntity
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

-- Add missing columns to image_contributions
CALL add_column_if_not_exists('image_contributions', 'location', 'VARCHAR(100)');
CALL add_column_if_not_exists('image_contributions', 'route_name', 'VARCHAR(100)');
CALL add_column_if_not_exists('image_contributions', 'extracted_data', 'TEXT');
CALL add_column_if_not_exists('image_contributions', 'image_data', 'LONGBLOB');
CALL add_column_if_not_exists('image_contributions', 'image_content_type', 'VARCHAR(100)');

-- Drop the temporary procedure
DROP PROCEDURE IF EXISTS add_column_if_not_exists;
