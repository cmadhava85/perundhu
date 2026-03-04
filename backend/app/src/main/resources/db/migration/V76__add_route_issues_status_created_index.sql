-- Composite index to speed up admin paginated queries that filter by status
-- and order by created_at (e.g. WHERE status = 'PENDING' ORDER BY created_at DESC)
CREATE INDEX idx_route_issues_status_created
    ON route_issues (status, created_at);
