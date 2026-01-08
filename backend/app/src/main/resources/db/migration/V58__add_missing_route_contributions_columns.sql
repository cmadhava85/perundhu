-- V58: Add missing columns to route_contributions table
-- Purpose: Fix schema mismatch for environments where V56 was applied without all columns
-- Date: 2026-01-08
-- Fixes: Unknown column 'rcje1_0.additional_notes' in 'field list'

-- Add bus_number column if it doesn't exist
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE table_schema='perundhu' AND table_name='route_contributions' AND column_name='bus_number') = 0,
    'ALTER TABLE route_contributions ADD COLUMN bus_number VARCHAR(50) AFTER user_id',
    'SELECT "Column bus_number already exists"'));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add submission_date column if it doesn't exist
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE table_schema='perundhu' AND table_name='route_contributions' AND column_name='submission_date') = 0,
    'ALTER TABLE route_contributions ADD COLUMN submission_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP AFTER status',
    'SELECT "Column submission_date already exists"'));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add additional_notes column if it doesn't exist
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE table_schema='perundhu' AND table_name='route_contributions' AND column_name='additional_notes') = 0,
    'ALTER TABLE route_contributions ADD COLUMN additional_notes TEXT AFTER processed_date',
    'SELECT "Column additional_notes already exists"'));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add submitted_by column if it doesn't exist
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE table_schema='perundhu' AND table_name='route_contributions' AND column_name='submitted_by') = 0,
    'ALTER TABLE route_contributions ADD COLUMN submitted_by VARCHAR(100) AFTER validation_message',
    'SELECT "Column submitted_by already exists"'));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add source_image_id column if it doesn't exist
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE table_schema='perundhu' AND table_name='route_contributions' AND column_name='source_image_id') = 0,
    'ALTER TABLE route_contributions ADD COLUMN source_image_id VARCHAR(50) AFTER submitted_by',
    'SELECT "Column source_image_id already exists"'));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add route_group_id column if it doesn't exist
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE table_schema='perundhu' AND table_name='route_contributions' AND column_name='route_group_id') = 0,
    'ALTER TABLE route_contributions ADD COLUMN route_group_id VARCHAR(50) AFTER source_image_id',
    'SELECT "Column route_group_id already exists"'));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add stops_json column if it doesn't exist
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE table_schema='perundhu' AND table_name='route_contributions' AND column_name='stops_json') = 0,
    'ALTER TABLE route_contributions ADD COLUMN stops_json TEXT AFTER contribution_type',
    'SELECT "Column stops_json already exists"'));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add indexes if they don't exist
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
     WHERE table_schema='perundhu' AND table_name='route_contributions' AND index_name='idx_route_contribution_submitted_by') = 0,
    'ALTER TABLE route_contributions ADD INDEX idx_route_contribution_submitted_by (submitted_by)',
    'SELECT "Index idx_route_contribution_submitted_by already exists"'));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
     WHERE table_schema='perundhu' AND table_name='route_contributions' AND index_name='idx_route_contribution_submission_date') = 0,
    'ALTER TABLE route_contributions ADD INDEX idx_route_contribution_submission_date (submission_date)',
    'SELECT "Index idx_route_contribution_submission_date already exists"'));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
     WHERE table_schema='perundhu' AND table_name='route_contributions' AND index_name='idx_route_contribution_source_image') = 0,
    'ALTER TABLE route_contributions ADD INDEX idx_route_contribution_source_image (source_image_id)',
    'SELECT "Index idx_route_contribution_source_image already exists"'));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
     WHERE table_schema='perundhu' AND table_name='route_contributions' AND index_name='idx_route_contribution_route_group') = 0,
    'ALTER TABLE route_contributions ADD INDEX idx_route_contribution_route_group (route_group_id)',
    'SELECT "Index idx_route_contribution_route_group already exists"'));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Confirm migration status
SELECT 'V58: Missing route_contributions columns added successfully' as migration_status;
