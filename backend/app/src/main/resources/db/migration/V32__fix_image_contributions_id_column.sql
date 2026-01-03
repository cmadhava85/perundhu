-- V32: Fix image_contributions table structure
-- Simplified migration that doesn't use complex procedures (which fail on some MySQL versions)
-- Keep INT id to avoid UUID compatibility issues
-- Just ensure the table has all needed columns

-- Ensure status column is properly defined
ALTER TABLE image_contributions MODIFY COLUMN status VARCHAR(20) NOT NULL DEFAULT 'PENDING';

-- Ensure description column size is adequate
ALTER TABLE image_contributions MODIFY COLUMN description VARCHAR(1000) NULL;

-- Add user_id column if it doesn't exist
ALTER TABLE image_contributions ADD COLUMN IF NOT EXISTS user_id VARCHAR(50) DEFAULT 'system';

-- Add processed_date column if it doesn't exist
ALTER TABLE image_contributions ADD COLUMN IF NOT EXISTS processed_date TIMESTAMP NULL;

-- Add validation_message column if it doesn't exist
ALTER TABLE image_contributions ADD COLUMN IF NOT EXISTS validation_message TEXT NULL;

-- Update indexes with safe DROP IF EXISTS pattern
DROP INDEX IF EXISTS idx_image_contributions_bus_number ON image_contributions;
DROP INDEX IF EXISTS idx_image_contributions_status ON image_contributions;
DROP INDEX IF EXISTS idx_image_contributions_user_id ON image_contributions;

-- Create new indexes
CREATE INDEX idx_image_contributions_status ON image_contributions(status);
CREATE INDEX idx_image_contributions_user_id ON image_contributions(user_id);
