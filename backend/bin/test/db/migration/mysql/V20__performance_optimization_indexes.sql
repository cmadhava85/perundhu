-- V20__performance_optimization_indexes.sql
-- Additional performance indexes for query optimization

-- Helper procedure to create index if it doesn't exist
DELIMITER //
CREATE PROCEDURE create_index_if_not_exists_v20(
    IN index_name VARCHAR(64),
    IN table_name VARCHAR(64),
    IN index_definition TEXT
)
BEGIN
    DECLARE index_exists INT DEFAULT 0;
    
    SELECT COUNT(1) INTO index_exists
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = table_name
      AND INDEX_NAME = index_name;
    
    IF index_exists = 0 THEN
        SET @sql = CONCAT('CREATE INDEX ', index_name, ' ON ', table_name, '(', index_definition, ')');
        PREPARE stmt FROM @sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END //
DELIMITER ;

-- ============================================
-- STOPS TABLE OPTIMIZATION
-- ============================================
-- Index for finding stops by location (used in bus search via stops)
CALL create_index_if_not_exists_v20('idx_stops_location_order', 'stops', 'location_id, stop_order');

-- Index for looking up stops by bus with location
CALL create_index_if_not_exists_v20('idx_stops_bus_location', 'stops', 'bus_id, location_id');

-- ============================================
-- TIMING IMAGE CONTRIBUTIONS OPTIMIZATION
-- ============================================
-- Check if timing_image_contributions table exists before creating indexes
SET @table_exists = (
    SELECT COUNT(*) 
    FROM information_schema.TABLES 
    WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'timing_image_contributions'
);

-- Index for status-based queries (admin panel, pending review)
SET @sql = IF(
    @table_exists > 0,
    'CALL create_index_if_not_exists_v20(''idx_timing_contrib_status'', ''timing_image_contributions'', ''status, submission_date DESC'')',
    'SELECT "timing_image_contributions table not found - skipping index" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Index for user-based queries
SET @sql = IF(
    @table_exists > 0,
    'CALL create_index_if_not_exists_v20(''idx_timing_contrib_user'', ''timing_image_contributions'', ''user_id, submission_date DESC'')',
    'SELECT "timing_image_contributions table not found - skipping index" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================
-- BUS TIMING RECORDS OPTIMIZATION
-- ============================================
SET @table_exists = (
    SELECT COUNT(*) 
    FROM information_schema.TABLES 
    WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'bus_timing_records'
);

-- Index for route lookups in timing records
SET @sql = IF(
    @table_exists > 0,
    'CALL create_index_if_not_exists_v20(''idx_timing_records_route'', ''bus_timing_records'', ''from_location_id, to_location_id'')',
    'SELECT "bus_timing_records table not found - skipping index" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Index for contribution-based lookups
SET @sql = IF(
    @table_exists > 0,
    'CALL create_index_if_not_exists_v20(''idx_timing_records_contrib'', ''bus_timing_records'', ''contribution_id'')',
    'SELECT "bus_timing_records table not found - skipping index" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================
-- EXTRACTED BUS TIMINGS OPTIMIZATION
-- ============================================
SET @table_exists = (
    SELECT COUNT(*) 
    FROM information_schema.TABLES 
    WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'extracted_bus_timings'
);

-- Index for contribution-based lookups
SET @sql = IF(
    @table_exists > 0,
    'CALL create_index_if_not_exists_v20(''idx_extracted_timings_contrib'', ''extracted_bus_timings'', ''contribution_id'')',
    'SELECT "extracted_bus_timings table not found - skipping index" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================
-- LOCATIONS TABLE OPTIMIZATION
-- ============================================
-- Index for coordinate-based proximity searches
CALL create_index_if_not_exists_v20('idx_locations_coords', 'locations', 'latitude, longitude');

-- Index for name pattern searches (autocomplete)
CALL create_index_if_not_exists_v20('idx_locations_name_pattern', 'locations', 'name(50)');

-- ============================================
-- TRANSLATIONS TABLE OPTIMIZATION
-- ============================================
-- Composite index for entity lookups with language
CALL create_index_if_not_exists_v20('idx_translations_lookup', 'translations', 'entity_type, entity_id, language_code');

-- Drop the helper procedure
DROP PROCEDURE IF EXISTS create_index_if_not_exists_v20;

-- Performance statistics
SELECT 
    'Performance optimization indexes added' AS status,
    COUNT(*) AS total_indexes
FROM information_schema.STATISTICS
WHERE TABLE_SCHEMA = DATABASE()
  AND INDEX_NAME LIKE 'idx_%';
