-- V60__add_missing_announcement_columns.sql
-- Add missing columns to announcements table to match AnnouncementJpaEntity
-- Date: 2026-01-08

ALTER TABLE announcements ADD COLUMN IF NOT EXISTS title_fallback VARCHAR(255) NOT NULL DEFAULT '';
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS message_key VARCHAR(255) NOT NULL DEFAULT '';
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS message_fallback TEXT NOT NULL DEFAULT '';
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS link VARCHAR(500);
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS link_text_key VARCHAR(255);
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS link_text_fallback VARCHAR(255);
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS is_dismissible INT NOT NULL DEFAULT 1;
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS announcement_category VARCHAR(50);
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS display_banner INT NOT NULL DEFAULT 1;
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS display_modal INT NOT NULL DEFAULT 0;
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS starts_at DATETIME;
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS expires_at DATETIME;
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS view_count BIGINT NOT NULL DEFAULT 0;
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS dismiss_count BIGINT NOT NULL DEFAULT 0;
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS created_by VARCHAR(100);
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS updated_by VARCHAR(100);
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'DRAFT';

-- Update existing unique_id if not set
UPDATE announcements SET unique_id = CONCAT('announcement_', id) WHERE unique_id IS NULL OR unique_id = '';
