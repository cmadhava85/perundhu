-- V5__simple_route_contributions_cleanup.sql
-- Simplified approach to clean up route_contributions table

-- Add indexes for better performance (MySQL compatible)
-- Using a safer approach that checks if index exists before creating

-- Create status index
SET @sql = IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = 'perundhu' AND TABLE_NAME = 'route_contributions' AND INDEX_NAME = 'idx_route_contributions_status') = 0, 'CREATE INDEX idx_route_contributions_status ON route_contributions(status);', 'SELECT "Index idx_route_contributions_status already exists";');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Create user_id index
SET @sql = IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = 'perundhu' AND TABLE_NAME = 'route_contributions' AND INDEX_NAME = 'idx_route_contributions_user_id') = 0, 'CREATE INDEX idx_route_contributions_user_id ON route_contributions(user_id);', 'SELECT "Index idx_route_contributions_user_id already exists";');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Create submission_date index
SET @sql = IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = 'perundhu' AND TABLE_NAME = 'route_contributions' AND INDEX_NAME = 'idx_route_contributions_submission_date') = 0, 'CREATE INDEX idx_route_contributions_submission_date ON route_contributions(submission_date);', 'SELECT "Index idx_route_contributions_submission_date already exists";');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;