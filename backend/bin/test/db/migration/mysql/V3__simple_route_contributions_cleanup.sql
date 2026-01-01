-- V3__simple_route_contributions_cleanup.sql
-- Add performance indexes for route_contributions table

-- Note: status and bus_number indexes already created in V2
-- Only adding submission_date index here

-- Create submission_date index for time-based queries
SET @sql = IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = 'perundhu' AND TABLE_NAME = 'route_contributions' AND INDEX_NAME = 'idx_route_contributions_submission_date') = 0, 'CREATE INDEX idx_route_contributions_submission_date ON route_contributions(submission_date);', 'SELECT "Index idx_route_contributions_submission_date already exists";');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;