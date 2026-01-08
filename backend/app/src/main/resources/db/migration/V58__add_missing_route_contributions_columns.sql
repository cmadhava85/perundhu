-- V58: Add missing columns to route_contributions, system_settings, and locations tables
-- Purpose: Fix schema mismatch for environments where V56 was applied without all columns
-- Date: 2026-01-08
-- Fixes: Unknown column 'rcje1_0.additional_notes', 'ssje1_0.id', 'fl1_0.last_osm_update'

-- =====================
-- ROUTE_CONTRIBUTIONS TABLE FIXES
-- =====================

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

-- Fix coordinate columns data type from VARCHAR(50) to DOUBLE
ALTER TABLE route_contributions 
    MODIFY COLUMN from_latitude DOUBLE,
    MODIFY COLUMN from_longitude DOUBLE,
    MODIFY COLUMN to_latitude DOUBLE,
    MODIFY COLUMN to_longitude DOUBLE;

-- =====================
-- SYSTEM_SETTINGS TABLE FIXES
-- =====================

-- Add id column if it doesn't exist (as primary key)
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE table_schema='perundhu' AND table_name='system_settings' AND column_name='id') = 0,
    'ALTER TABLE system_settings ADD COLUMN id BIGINT AUTO_INCREMENT PRIMARY KEY FIRST',
    'SELECT "Column id already exists"'));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Make setting_key unique if not already
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
     WHERE table_schema='perundhu' AND table_name='system_settings' AND index_name='setting_key' AND non_unique=0) = 0,
    'ALTER TABLE system_settings ADD UNIQUE KEY (setting_key)',
    'SELECT "Unique key on setting_key already exists"'));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add category column if it doesn't exist
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE table_schema='perundhu' AND table_name='system_settings' AND column_name='category') = 0,
    'ALTER TABLE system_settings ADD COLUMN category VARCHAR(50) AFTER setting_value',
    'SELECT "Column category already exists"'));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add description column if it doesn't exist
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE table_schema='perundhu' AND table_name='system_settings' AND column_name='description') = 0,
    'ALTER TABLE system_settings ADD COLUMN description VARCHAR(255) AFTER category',
    'SELECT "Column description already exists"'));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add created_at column if it doesn't exist
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE table_schema='perundhu' AND table_name='system_settings' AND column_name='created_at') = 0,
    'ALTER TABLE system_settings ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP AFTER description',
    'SELECT "Column created_at already exists"'));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- =====================
-- LOCATIONS TABLE FIXES
-- =====================

-- Add osm_node_id column if it doesn't exist
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE table_schema='perundhu' AND table_name='locations' AND column_name='osm_node_id') = 0,
    'ALTER TABLE locations ADD COLUMN osm_node_id BIGINT AFTER osm_type',
    'SELECT "Column osm_node_id already exists"'));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add osm_way_id column if it doesn't exist
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE table_schema='perundhu' AND table_name='locations' AND column_name='osm_way_id') = 0,
    'ALTER TABLE locations ADD COLUMN osm_way_id BIGINT AFTER osm_node_id',
    'SELECT "Column osm_way_id already exists"'));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add last_osm_update column if it doesn't exist
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE table_schema='perundhu' AND table_name='locations' AND column_name='last_osm_update') = 0,
    'ALTER TABLE locations ADD COLUMN last_osm_update DATETIME AFTER osm_way_id',
    'SELECT "Column last_osm_update already exists"'));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add osm_tags column if it doesn't exist
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE table_schema='perundhu' AND table_name='locations' AND column_name='osm_tags') = 0,
    'ALTER TABLE locations ADD COLUMN osm_tags JSON AFTER last_osm_update',
    'SELECT "Column osm_tags already exists"'));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Confirm migration status
SELECT 'V58: Missing columns added to route_contributions, system_settings, and locations; coordinate types fixed' as migration_status;

