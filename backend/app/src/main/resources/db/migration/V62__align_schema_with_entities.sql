-- V62__align_schema_with_entities.sql
-- Align DB schema with JPA entities - Enforce NOT NULL on existing columns
-- Date: 2026-01-09

-- =====================
-- Announcements: enforce non-null + indexes
-- =====================
UPDATE announcements SET type = 'INFO' WHERE type IS NULL;
UPDATE announcements SET title_key = '' WHERE title_key IS NULL;
UPDATE announcements SET title_fallback = COALESCE(title_fallback, '') WHERE title_fallback IS NULL;
UPDATE announcements SET message_key = '' WHERE message_key IS NULL;
UPDATE announcements SET message_fallback = COALESCE(message_fallback, '') WHERE message_fallback IS NULL;
UPDATE announcements SET unique_id = CONCAT('announcement_', id) WHERE unique_id IS NULL OR unique_id = '';
UPDATE announcements SET priority = 5 WHERE priority IS NULL;
UPDATE announcements SET target_users = 'ALL' WHERE target_users IS NULL;
UPDATE announcements SET is_active = IFNULL(is_active, 0);
UPDATE announcements SET created_at = NOW() WHERE created_at IS NULL;
UPDATE announcements SET updated_at = NOW() WHERE updated_at IS NULL;

-- Only modify columns if they exist (idempotent)
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE table_schema=DATABASE() AND table_name='announcements' AND column_name='type') > 0,
    'ALTER TABLE announcements MODIFY COLUMN type VARCHAR(50) NOT NULL, MODIFY COLUMN title_key VARCHAR(255) NOT NULL, MODIFY COLUMN title_fallback VARCHAR(255) NOT NULL, MODIFY COLUMN message_key VARCHAR(255) NOT NULL, MODIFY COLUMN message_fallback TEXT NOT NULL, MODIFY COLUMN unique_id VARCHAR(100) NOT NULL UNIQUE, MODIFY COLUMN is_active INT NOT NULL DEFAULT 1, MODIFY COLUMN priority INT NOT NULL DEFAULT 5, MODIFY COLUMN target_users VARCHAR(50) NOT NULL, MODIFY COLUMN created_at DATETIME NOT NULL, MODIFY COLUMN updated_at DATETIME NOT NULL',
    'SELECT "Announcements columns already modified or do not exist"'));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- =====================
-- Route issues: enforce non-null on existing columns
-- =====================
UPDATE route_issues SET issue_type = 'OTHER' WHERE issue_type IS NULL;
UPDATE route_issues SET status = 'PENDING' WHERE status IS NULL;
UPDATE route_issues SET created_at = NOW() WHERE created_at IS NULL;

SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE table_schema=DATABASE() AND table_name='route_issues' AND column_name='issue_type') > 0,
    'ALTER TABLE route_issues MODIFY COLUMN issue_type VARCHAR(100) NOT NULL, MODIFY COLUMN status VARCHAR(20) NOT NULL DEFAULT \'OPEN\'',
    'SELECT "Route issues columns already modified or do not exist"'));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- =====================
-- Reviews: enforce non-null on existing columns
-- =====================
UPDATE reviews SET status = 'PENDING' WHERE status IS NULL;
UPDATE reviews SET rating = 0 WHERE rating IS NULL;
UPDATE reviews SET created_at = NOW() WHERE created_at IS NULL;
UPDATE reviews SET updated_at = NOW() WHERE updated_at IS NULL;

-- Note: Cannot modify bus_id as it has foreign key constraint 'fk_review_bus'
-- Skip bus_id and status modifications to avoid foreign key issues
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE table_schema=DATABASE() AND table_name='reviews' AND column_name='rating') > 0,
    'ALTER TABLE reviews MODIFY COLUMN rating INT NOT NULL, MODIFY COLUMN created_at DATETIME NOT NULL, MODIFY COLUMN updated_at DATETIME NOT NULL',
    'SELECT "Reviews columns already modified or do not exist"'));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- =====================
-- User feedback: enforce non-null on existing columns
-- =====================
UPDATE user_feedback SET status = 'NEW' WHERE status IS NULL OR status = '';
UPDATE user_feedback SET created_at = NOW() WHERE created_at IS NULL;
UPDATE user_feedback SET updated_at = NOW() WHERE updated_at IS NULL;

SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE table_schema=DATABASE() AND table_name='user_feedback' AND column_name='message') > 0,
    'ALTER TABLE user_feedback MODIFY COLUMN message TEXT NOT NULL, MODIFY COLUMN status VARCHAR(50) NOT NULL DEFAULT \'NEW\', MODIFY COLUMN created_at DATETIME NOT NULL, MODIFY COLUMN updated_at DATETIME NOT NULL',
    'SELECT "User feedback columns already modified or do not exist"'));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- =====================
-- Social media posts: enforce non-null on existing columns
-- =====================
UPDATE social_media_posts SET platform = 'OTHER' WHERE platform IS NULL;
UPDATE social_media_posts SET created_at = NOW() WHERE created_at IS NULL;
UPDATE social_media_posts SET updated_at = NOW() WHERE updated_at IS NULL;

SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE table_schema=DATABASE() AND table_name='social_media_posts' AND column_name='platform') > 0,
    'ALTER TABLE social_media_posts MODIFY COLUMN platform VARCHAR(20) NOT NULL',
    'SELECT "Social media posts columns already modified or do not exist"'));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- =====================
-- Image contributions: enforce non-null on existing columns
-- =====================
UPDATE image_contributions SET submission_date = NOW() WHERE submission_date IS NULL;

SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE table_schema=DATABASE() AND table_name='image_contributions' AND column_name='submission_date') > 0,
    'ALTER TABLE image_contributions MODIFY COLUMN submission_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP',
    'SELECT "Image contributions columns already modified or do not exist"'));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
