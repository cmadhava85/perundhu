-- Direct SQL to fix the preprod database schema
-- Run this if Flyway migrations haven't been applied in the CD pipeline
-- Execute this manually via: gcloud sql connect perundhu-preprod-mysql --user=perundhu_user

USE perundhu;

-- V60: Add missing announcement columns
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS title_fallback VARCHAR(255);
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS message_key VARCHAR(255);
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS message_fallback TEXT;
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS announcement_category VARCHAR(50);
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS link VARCHAR(500);
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS link_text_key VARCHAR(255);
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS link_text_fallback VARCHAR(255);
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS is_dismissible INT DEFAULT 1;
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS display_banner INT DEFAULT 1;
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS display_modal INT DEFAULT 0;
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS starts_at DATETIME;
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS expires_at DATETIME;
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS view_count BIGINT DEFAULT 0;
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS dismiss_count BIGINT DEFAULT 0;
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS created_by VARCHAR(100);
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS updated_by VARCHAR(100);
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS status VARCHAR(20);

-- V62: Align schema with entities - Set NOT NULL on key fields
-- (These should already exist from V60, we're just enforcing constraints)
ALTER TABLE announcements MODIFY COLUMN announcement_category VARCHAR(50) NULL;

-- V63: Load sample location data (if locations table is empty)
INSERT INTO locations (name, latitude, longitude, district, state, priority, type, created_at, updated_at) 
SELECT 'Chennai', 13.0827, 80.2707, 'Chennai', 'Tamil Nadu', 1, 'city', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM locations WHERE name = 'Chennai' AND state = 'Tamil Nadu');

-- Verify the fix
DESCRIBE announcements;
SELECT COUNT(*) as total_locations FROM locations;
