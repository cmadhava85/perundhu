-- V59: Fix system_settings and locations tables for new database deploys
-- Purpose: Add missing columns that should have been in V56 baseline
-- Date: 2026-01-08
-- Fixes: Unknown column 'ssje1_0.id', 'fl1_0.last_osm_update'

-- =====================
-- SYSTEM_SETTINGS TABLE FIXES (for fresh V56 deploys)
-- =====================

-- Add id column if it doesn't exist (as primary key)
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE table_schema=DATABASE() AND table_name='system_settings' AND column_name='id') = 0,
    'ALTER TABLE system_settings ADD COLUMN id BIGINT AUTO_INCREMENT PRIMARY KEY FIRST',
    'SELECT "Column id already exists"'));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Make setting_key not primary key if it is
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
     WHERE table_schema=DATABASE() AND table_name='system_settings' AND index_name='PRIMARY' AND column_name='setting_key') > 0,
    'ALTER TABLE system_settings DROP PRIMARY KEY, MODIFY COLUMN setting_key VARCHAR(100) NOT NULL UNIQUE',
    'SELECT "setting_key is not primary key"'));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add category column if it doesn't exist
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE table_schema=DATABASE() AND table_name='system_settings' AND column_name='category') = 0,
    'ALTER TABLE system_settings ADD COLUMN category VARCHAR(50) AFTER setting_value',
    'SELECT "Column category already exists"'));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add description column if it doesn't exist
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE table_schema=DATABASE() AND table_name='system_settings' AND column_name='description') = 0,
    'ALTER TABLE system_settings ADD COLUMN description VARCHAR(255) AFTER category',
    'SELECT "Column description already exists"'));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add created_at column if it doesn't exist
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE table_schema=DATABASE() AND table_name='system_settings' AND column_name='created_at') = 0,
    'ALTER TABLE system_settings ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP AFTER description',
    'SELECT "Column created_at already exists"'));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- =====================
-- LOCATIONS TABLE FIXES (for fresh V56 deploys)
-- =====================

-- Add osm_node_id column if it doesn't exist
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE table_schema=DATABASE() AND table_name='locations' AND column_name='osm_node_id') = 0,
    'ALTER TABLE locations ADD COLUMN osm_node_id BIGINT AFTER osm_type',
    'SELECT "Column osm_node_id already exists"'));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add osm_way_id column if it doesn't exist
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE table_schema=DATABASE() AND table_name='locations' AND column_name='osm_way_id') = 0,
    'ALTER TABLE locations ADD COLUMN osm_way_id BIGINT AFTER osm_node_id',
    'SELECT "Column osm_way_id already exists"'));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add last_osm_update column if it doesn't exist
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE table_schema=DATABASE() AND table_name='locations' AND column_name='last_osm_update') = 0,
    'ALTER TABLE locations ADD COLUMN last_osm_update DATETIME AFTER osm_way_id',
    'SELECT "Column last_osm_update already exists"'));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add osm_tags column if it doesn't exist
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE table_schema=DATABASE() AND table_name='locations' AND column_name='osm_tags') = 0,
    'ALTER TABLE locations ADD COLUMN osm_tags JSON AFTER last_osm_update',
    'SELECT "Column osm_tags already exists"'));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Confirm migration status
SELECT 'V59: system_settings and locations tables fixed' as migration_status;
