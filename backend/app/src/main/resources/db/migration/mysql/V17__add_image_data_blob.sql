-- V17: Add image_data BLOB column for persistent image storage
-- This allows images to be stored directly in the database instead of filesystem
-- Essential for Cloud Run where the filesystem is ephemeral

-- Add image_data column to store actual image bytes
-- Using simple ALTER TABLE - if column already exists, the migration will need manual cleanup
ALTER TABLE image_contributions 
ADD COLUMN image_data LONGBLOB COMMENT 'Binary image data for persistent storage';

-- Add content_type column to store the MIME type
ALTER TABLE image_contributions 
ADD COLUMN image_content_type VARCHAR(100) DEFAULT 'image/jpeg' COMMENT 'MIME type of the image';
