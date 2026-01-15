-- ============================================
-- V68: Additional Performance Optimization Indexes
-- ============================================
-- Adds missing indexes for N+1 query prevention and cost optimization
-- Target: Support 100k users with minimal database scaling
-- Note: Using procedures to handle "IF NOT EXISTS" for MySQL

-- Drop procedure if exists
DROP PROCEDURE IF EXISTS create_index_if_not_exists;

-- Create procedure to safely create indexes
DELIMITER $$
CREATE PROCEDURE create_index_if_not_exists(
    IN table_name VARCHAR(128),
    IN index_name VARCHAR(128),
    IN index_columns VARCHAR(512)
)
BEGIN
    DECLARE index_exists INT DEFAULT 0;
    
    -- Check if index exists
    SELECT COUNT(1) INTO index_exists
    FROM information_schema.statistics
    WHERE table_schema = DATABASE()
    AND table_name = table_name
    AND index_name = index_name;
    
    -- Create index if it doesn't exist
    IF index_exists = 0 THEN
        SET @sql = CONCAT('CREATE INDEX ', index_name, ' ON ', table_name, ' (', index_columns, ')');
        PREPARE stmt FROM @sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END$$
DELIMITER ;

-- 1. Route Contributions - User lookup optimization
CALL create_index_if_not_exists('route_contributions', 'idx_route_contributions_user_id', 'user_id');

-- 2. Route Contributions - Submitted by lookup
CALL create_index_if_not_exists('route_contributions', 'idx_route_contributions_submitted_by', 'submitted_by');

-- 3. Route Contributions - Composite index for time-based queries
CALL create_index_if_not_exists('route_contributions', 'idx_route_contributions_submitted_date', 'submitted_by, submission_date DESC');

-- 4. Image Contributions - User lookup optimization
CALL create_index_if_not_exists('image_contributions', 'idx_image_contributions_user_id', 'user_id');

-- 5. Image Contributions - Image URL lookup
CALL create_index_if_not_exists('image_contributions', 'idx_image_contributions_image_url', 'image_url(255)');

-- 6. Reviews - Bus and status composite index
CALL create_index_if_not_exists('reviews', 'idx_reviews_bus_status', 'bus_id, status');

-- 7. Reviews - User reviews lookup
CALL create_index_if_not_exists('reviews', 'idx_reviews_user_id', 'user_id');

-- 8. Buses - Route lookup optimization
CALL create_index_if_not_exists('buses', 'idx_buses_route_id', 'route_id');

-- 9. Bus Routes - Name search optimization
CALL create_index_if_not_exists('bus_routes', 'idx_bus_routes_name', 'name');

-- 10. Stops - Location lookup
CALL create_index_if_not_exists('stops', 'idx_stops_location_id', 'location_id');

-- 11. User Tracking Sessions - User lookup
CALL create_index_if_not_exists('user_tracking_sessions', 'idx_user_tracking_sessions_user_id', 'user_id');

-- 12. User Tracking Sessions - Bus tracking
CALL create_index_if_not_exists('user_tracking_sessions', 'idx_user_tracking_sessions_bus_id', 'bus_id');

-- 13. User Tracking Sessions - Session ID lookup
CALL create_index_if_not_exists('user_tracking_sessions', 'idx_user_tracking_sessions_session_id', 'session_id');

-- 14. User Tracking Sessions - Active sessions
CALL create_index_if_not_exists('user_tracking_sessions', 'idx_user_tracking_sessions_end_time', 'end_time');

-- 15. User Tracking Sessions - Time range queries
CALL create_index_if_not_exists('user_tracking_sessions', 'idx_user_tracking_sessions_start_time', 'start_time DESC');

-- Drop the temporary procedure
DROP PROCEDURE IF EXISTS create_index_if_not_exists;

-- Update table statistics for query optimizer
ANALYZE TABLE route_contributions;
ANALYZE TABLE image_contributions;
ANALYZE TABLE reviews;
ANALYZE TABLE buses;
ANALYZE TABLE bus_routes;
ANALYZE TABLE stops;
ANALYZE TABLE user_tracking_sessions;

-- Log completion
SELECT 'V68: Added 15 additional performance indexes for 100k user scale' AS migration_status;
