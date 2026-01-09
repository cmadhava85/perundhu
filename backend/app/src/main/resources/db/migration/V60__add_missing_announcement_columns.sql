-- Add missing columns to announcements table
ALTER TABLE announcements ADD COLUMN title_fallback VARCHAR(255);
ALTER TABLE announcements ADD COLUMN message_key VARCHAR(255);
ALTER TABLE announcements ADD COLUMN message_fallback TEXT;
ALTER TABLE announcements ADD COLUMN link VARCHAR(500);
ALTER TABLE announcements ADD COLUMN link_text_key VARCHAR(255);
ALTER TABLE announcements ADD COLUMN link_text_fallback VARCHAR(255);
ALTER TABLE announcements ADD COLUMN is_dismissible INT DEFAULT 1;
ALTER TABLE announcements ADD COLUMN announcement_category VARCHAR(50);
ALTER TABLE announcements ADD COLUMN display_banner INT DEFAULT 1;
ALTER TABLE announcements ADD COLUMN display_modal INT DEFAULT 0;
ALTER TABLE announcements ADD COLUMN starts_at DATETIME;
ALTER TABLE announcements ADD COLUMN expires_at DATETIME;
ALTER TABLE announcements ADD COLUMN view_count BIGINT DEFAULT 0;
ALTER TABLE announcements ADD COLUMN dismiss_count BIGINT DEFAULT 0;
ALTER TABLE announcements ADD COLUMN created_by VARCHAR(100);
ALTER TABLE announcements ADD COLUMN updated_by VARCHAR(100);
ALTER TABLE announcements ADD COLUMN status VARCHAR(20) DEFAULT 'DRAFT';

-- Update null values
UPDATE announcements SET title_fallback = '' WHERE title_fallback IS NULL;
UPDATE announcements SET message_key = '' WHERE message_key IS NULL;
UPDATE announcements SET message_fallback = '' WHERE message_fallback IS NULL;
UPDATE announcements SET unique_id = CONCAT('announcement_', id) WHERE unique_id IS NULL OR unique_id = '';
