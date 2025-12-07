-- V17: Add image_data BLOB column for persistent image storage
-- This allows images to be stored directly in the database instead of filesystem
-- Essential for Cloud Run where the filesystem is ephemeral

-- Add image_data column to store actual image bytes
ALTER TABLE image_contributions 
ADD COLUMN IF NOT EXISTS image_data LONGBLOB COMMENT 'Binary image data for persistent storage';

-- Add content_type column to store the MIME type
ALTER TABLE image_contributions 
ADD COLUMN IF NOT EXISTS image_content_type VARCHAR(100) DEFAULT 'image/jpeg' COMMENT 'MIME type of the image';

-- Add index on status for faster queries (if not exists)
-- Note: Index already exists from V10, but we ensure it's there
