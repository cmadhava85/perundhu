-- Composite index to speed up admin paginated queries that filter by status
-- and order by created_at (e.g. WHERE status = 'PENDING' ORDER BY created_at DESC)
-- Idempotent: skips creation if index already exists (MySQL lacks CREATE INDEX IF NOT EXISTS)
SET @idx_exists = (
    SELECT COUNT(*) FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME   = 'route_issues'
      AND INDEX_NAME   = 'idx_route_issues_status_created'
);
SET @sql = IF(@idx_exists = 0,
    'CREATE INDEX idx_route_issues_status_created ON route_issues (status, created_at)',
    'SELECT ''index already exists, skipping'' AS note'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
