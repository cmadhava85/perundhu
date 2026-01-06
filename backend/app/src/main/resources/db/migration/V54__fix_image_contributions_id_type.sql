-- V54: Fix image_contributions ID column type
-- Purpose: Change ID from INT to VARCHAR(36) to support UUID strings
-- Reason: The application generates UUIDs (36 chars) but the DB column is INT
-- This migration safely migrates existing data if any

START TRANSACTION;

-- Check if the table exists and has data
SELECT COUNT(*) as row_count FROM image_contributions INTO @existing_rows;

-- If there's existing data, back it up first
CREATE TEMPORARY TABLE image_contributions_backup AS
SELECT * FROM image_contributions;

-- Drop the old primary key constraint and recreate the table with correct schema
ALTER TABLE image_contributions 
DROP PRIMARY KEY,
MODIFY COLUMN id VARCHAR(36) PRIMARY KEY,
DROP COLUMN bus_number IF EXISTS,
DROP COLUMN submitted_by IF EXISTS,
DROP COLUMN rejection_reason IF EXISTS;

-- Ensure all other required columns exist
ALTER TABLE image_contributions
ADD COLUMN IF NOT EXISTS user_id VARCHAR(50),
ADD COLUMN IF NOT EXISTS description VARCHAR(1000),
ADD COLUMN IF NOT EXISTS location VARCHAR(100),
ADD COLUMN IF NOT EXISTS route_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS extracted_data TEXT,
ADD COLUMN IF NOT EXISTS image_url VARCHAR(1000) NOT NULL AFTER id,
ADD COLUMN IF NOT EXISTS status VARCHAR(100) NOT NULL DEFAULT 'PENDING',
ADD COLUMN IF NOT EXISTS submission_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS processed_date TIMESTAMP,
ADD COLUMN IF NOT EXISTS validation_message TEXT,
ADD COLUMN IF NOT EXISTS additional_notes VARCHAR(1000),
ADD COLUMN IF NOT EXISTS image_data LONGBLOB,
ADD COLUMN IF NOT EXISTS image_content_type VARCHAR(100);

-- Add indices
CREATE INDEX IF NOT EXISTS idx_image_contributions_status ON image_contributions(status);
CREATE INDEX IF NOT EXISTS idx_image_contributions_user_id ON image_contributions(user_id);

COMMIT;
