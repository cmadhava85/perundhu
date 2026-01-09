#!/bin/bash
# Apply V58 migration to add missing route_contributions columns

set -e

PROJECT_ID="astute-strategy-406601"
INSTANCE="perundhu-preprod-mysql"
DATABASE="perundhu"
USER="perundhu_user"

echo "Fetching password from Secret Manager..."
PASSWORD=$(gcloud secrets versions access latest --secret=db-password --project=$PROJECT_ID)

echo "Applying V58 migration: Add missing route_contributions columns..."

gcloud sql connect $INSTANCE \
  --user=$USER \
  --project=$PROJECT_ID \
  --quiet \
  << 'SQL_EOF'
USE perundhu;

-- Add bus_number column if it doesn't exist
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE table_schema=DATABASE() AND table_name='route_contributions' AND column_name='bus_number') = 0,
    'ALTER TABLE route_contributions ADD COLUMN bus_number VARCHAR(50) AFTER user_id',
    'SELECT "Column bus_number already exists"'));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add submission_date column if it doesn't exist
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE table_schema=DATABASE() AND table_name='route_contributions' AND column_name='submission_date') = 0,
    'ALTER TABLE route_contributions ADD COLUMN submission_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP AFTER status',
    'SELECT "Column submission_date already exists"'));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add additional_notes column if it doesn't exist
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE table_schema=DATABASE() AND table_name='route_contributions' AND column_name='additional_notes') = 0,
    'ALTER TABLE route_contributions ADD COLUMN additional_notes TEXT AFTER processed_date',
    'SELECT "Column additional_notes already exists"'));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add submitted_by column if it doesn't exist
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE table_schema=DATABASE() AND table_name='route_contributions' AND column_name='submitted_by') = 0,
    'ALTER TABLE route_contributions ADD COLUMN submitted_by VARCHAR(100) AFTER validation_message',
    'SELECT "Column submitted_by already exists"'));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add source_image_id column if it doesn't exist
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE table_schema=DATABASE() AND table_name='route_contributions' AND column_name='source_image_id') = 0,
    'ALTER TABLE route_contributions ADD COLUMN source_image_id VARCHAR(50) AFTER submitted_by',
    'SELECT "Column source_image_id already exists"'));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add route_group_id column if it doesn't exist
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE table_schema=DATABASE() AND table_name='route_contributions' AND column_name='route_group_id') = 0,
    'ALTER TABLE route_contributions ADD COLUMN route_group_id VARCHAR(50) AFTER source_image_id',
    'SELECT "Column route_group_id already exists"'));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add stops_json column if it doesn't exist
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE table_schema=DATABASE() AND table_name='route_contributions' AND column_name='stops_json') = 0,
    'ALTER TABLE route_contributions ADD COLUMN stops_json TEXT AFTER contribution_type',
    'SELECT "Column stops_json already exists"'));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add contribution_type column if it doesn't exist
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE table_schema=DATABASE() AND table_name='route_contributions' AND column_name='contribution_type') = 0,
    'ALTER TABLE route_contributions ADD COLUMN contribution_type VARCHAR(50)',
    'SELECT "Column contribution_type already exists"'));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add source_bus_id column if it doesn't exist
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE table_schema=DATABASE() AND table_name='route_contributions' AND column_name='source_bus_id') = 0,
    'ALTER TABLE route_contributions ADD COLUMN source_bus_id BIGINT',
    'SELECT "Column source_bus_id already exists"'));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Verify columns exist
SELECT 'V58 Migration: Route Contributions columns added' as status;
DESC route_contributions;

SQL_EOF

echo "✅ V58 Migration applied successfully!"
