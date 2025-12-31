-- ============================================
-- V21: Additional Performance Optimization Indexes
-- ============================================
-- Adds indexes for query patterns identified in repository analysis
-- Uses MySQL-compatible procedure for safe index creation

DELIMITER //

-- Helper procedure to safely create an index if it doesn't exist
DROP PROCEDURE IF EXISTS CreateIndexIfNotExists//
CREATE PROCEDURE CreateIndexIfNotExists(
    IN tableName VARCHAR(128),
    IN indexName VARCHAR(128),
    IN indexColumns VARCHAR(256)
)
BEGIN
    DECLARE index_exists INT DEFAULT 0;
    
    SELECT COUNT(*) INTO index_exists
    FROM INFORMATION_SCHEMA.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = tableName
    AND INDEX_NAME = indexName;
    
    IF index_exists = 0 THEN
        SET @sql = CONCAT('CREATE INDEX ', indexName, ' ON ', tableName, '(', indexColumns, ')');
        PREPARE stmt FROM @sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END//

DELIMITER ;

-- Route contributions table indexes
CALL CreateIndexIfNotExists('route_contributions', 'idx_rc_user', 'user_id');
CALL CreateIndexIfNotExists('route_contributions', 'idx_rc_status_date', 'status, submission_date DESC');
CALL CreateIndexIfNotExists('route_contributions', 'idx_rc_submitter_date', 'submitted_by, submission_date DESC');

-- Image contributions table indexes  
CALL CreateIndexIfNotExists('image_contributions', 'idx_ic_user', 'user_id');
CALL CreateIndexIfNotExists('image_contributions', 'idx_ic_status_date', 'status, submission_date DESC');

-- Buses table composite indexes for join queries
CALL CreateIndexIfNotExists('buses', 'idx_bus_locations', 'from_location_id, to_location_id');
CALL CreateIndexIfNotExists('buses', 'idx_bus_category', 'category');
CALL CreateIndexIfNotExists('buses', 'idx_bus_number', 'bus_number');
CALL CreateIndexIfNotExists('buses', 'idx_bus_active', 'active');

-- Translations - field lookup optimization
CALL CreateIndexIfNotExists('translations', 'idx_trans_entity_field', 'entity_type, field_name');

-- User tracking sessions
CALL CreateIndexIfNotExists('user_tracking_sessions', 'idx_uts_session', 'session_id');
CALL CreateIndexIfNotExists('user_tracking_sessions', 'idx_uts_user_bus', 'user_id, bus_id');
CALL CreateIndexIfNotExists('user_tracking_sessions', 'idx_uts_active', 'end_time, start_time');

-- Cleanup: Drop the helper procedure
DROP PROCEDURE IF EXISTS CreateIndexIfNotExists;
