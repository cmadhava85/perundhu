-- Add missing columns to announcements table (using conditional SQL)
-- These columns should exist but may be missing in some environments

SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE table_schema=DATABASE() AND table_name='announcements' AND column_name='title_fallback') = 0,
    'ALTER TABLE announcements ADD COLUMN title_fallback VARCHAR(255)',
    'SELECT "Column title_fallback already exists"'));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE table_schema=DATABASE() AND table_name='announcements' AND column_name='message_key') = 0,
    'ALTER TABLE announcements ADD COLUMN message_key VARCHAR(255)',
    'SELECT "Column message_key already exists"'));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE table_schema=DATABASE() AND table_name='announcements' AND column_name='message_fallback') = 0,
    'ALTER TABLE announcements ADD COLUMN message_fallback TEXT',
    'SELECT "Column message_fallback already exists"'));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE table_schema=DATABASE() AND table_name='announcements' AND column_name='link') = 0,
    'ALTER TABLE announcements ADD COLUMN link VARCHAR(500)',
    'SELECT "Column link already exists"'));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE table_schema=DATABASE() AND table_name='announcements' AND column_name='link_text_key') = 0,
    'ALTER TABLE announcements ADD COLUMN link_text_key VARCHAR(255)',
    'SELECT "Column link_text_key already exists"'));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE table_schema=DATABASE() AND table_name='announcements' AND column_name='link_text_fallback') = 0,
    'ALTER TABLE announcements ADD COLUMN link_text_fallback VARCHAR(255)',
    'SELECT "Column link_text_fallback already exists"'));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE table_schema=DATABASE() AND table_name='announcements' AND column_name='is_dismissible') = 0,
    'ALTER TABLE announcements ADD COLUMN is_dismissible INT DEFAULT 1',
    'SELECT "Column is_dismissible already exists"'));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE table_schema=DATABASE() AND table_name='announcements' AND column_name='announcement_category') = 0,
    'ALTER TABLE announcements ADD COLUMN announcement_category VARCHAR(50)',
    'SELECT "Column announcement_category already exists"'));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE table_schema=DATABASE() AND table_name='announcements' AND column_name='display_banner') = 0,
    'ALTER TABLE announcements ADD COLUMN display_banner INT DEFAULT 1',
    'SELECT "Column display_banner already exists"'));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE table_schema=DATABASE() AND table_name='announcements' AND column_name='display_modal') = 0,
    'ALTER TABLE announcements ADD COLUMN display_modal INT DEFAULT 0',
    'SELECT "Column display_modal already exists"'));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE table_schema=DATABASE() AND table_name='announcements' AND column_name='starts_at') = 0,
    'ALTER TABLE announcements ADD COLUMN starts_at DATETIME',
    'SELECT "Column starts_at already exists"'));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE table_schema=DATABASE() AND table_name='announcements' AND column_name='expires_at') = 0,
    'ALTER TABLE announcements ADD COLUMN expires_at DATETIME',
    'SELECT "Column expires_at already exists"'));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE table_schema=DATABASE() AND table_name='announcements' AND column_name='view_count') = 0,
    'ALTER TABLE announcements ADD COLUMN view_count BIGINT DEFAULT 0',
    'SELECT "Column view_count already exists"'));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE table_schema=DATABASE() AND table_name='announcements' AND column_name='dismiss_count') = 0,
    'ALTER TABLE announcements ADD COLUMN dismiss_count BIGINT DEFAULT 0',
    'SELECT "Column dismiss_count already exists"'));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE table_schema=DATABASE() AND table_name='announcements' AND column_name='created_by') = 0,
    'ALTER TABLE announcements ADD COLUMN created_by VARCHAR(100)',
    'SELECT "Column created_by already exists"'));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE table_schema=DATABASE() AND table_name='announcements' AND column_name='updated_by') = 0,
    'ALTER TABLE announcements ADD COLUMN updated_by VARCHAR(100)',
    'SELECT "Column updated_by already exists"'));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE table_schema=DATABASE() AND table_name='announcements' AND column_name='status') = 0,
    'ALTER TABLE announcements ADD COLUMN status VARCHAR(20) DEFAULT \'DRAFT\'',
    'SELECT "Column status already exists"'));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Update null values for existing records
UPDATE announcements SET title_fallback = '' WHERE title_fallback IS NULL;
UPDATE announcements SET message_key = '' WHERE message_key IS NULL;
UPDATE announcements SET message_fallback = '' WHERE message_fallback IS NULL;
UPDATE announcements SET unique_id = CONCAT('announcement_', id) WHERE unique_id IS NULL OR unique_id = '';
