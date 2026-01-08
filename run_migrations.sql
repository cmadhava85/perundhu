-- V60 and V61 Migrations: Add missing columns

-- V60: Add missing announcement columns
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
UPDATE announcements SET unique_id = CONCAT('announcement_', id) WHERE unique_id IS NULL OR unique_id = '';

-- V61: Add missing locations columns
ALTER TABLE locations ADD COLUMN IF NOT EXISTS osm_type VARCHAR(20);
ALTER TABLE locations ADD COLUMN IF NOT EXISTS osm_node_id BIGINT;
ALTER TABLE locations ADD COLUMN IF NOT EXISTS osm_way_id BIGINT;
ALTER TABLE locations ADD COLUMN IF NOT EXISTS last_osm_update DATETIME;
ALTER TABLE locations ADD COLUMN IF NOT EXISTS osm_tags JSON;
ALTER TABLE locations ADD COLUMN IF NOT EXISTS neighborhood VARCHAR(255);
ALTER TABLE locations ADD COLUMN IF NOT EXISTS state VARCHAR(100);
ALTER TABLE locations ADD COLUMN IF NOT EXISTS type VARCHAR(50);

SELECT 'Migrations Applied!' as status;
