-- V49: Add missing additional_notes column to image_contributions table
-- Purpose: Add additional_notes column required by ImageContributionJpaEntity
-- Date: 2026-01-05
-- Safety: This migration is idempotent and will not fail if column already exists

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

-- Add missing additional_notes column to image_contributions
CALL add_column_if_not_exists('image_contributions', 'additional_notes', 'TEXT');

-- Drop the temporary procedure
DROP PROCEDURE IF EXISTS add_column_if_not_exists;
