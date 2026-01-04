-- V41__add_osm_indexes.sql
-- Add indexes for OSM fields on locations table
-- Created separately to avoid issues if indexes already exist

-- Check if index exists before creating
DELIMITER $$

CREATE PROCEDURE IF NOT EXISTS add_osm_indexes()
BEGIN
    DECLARE index_count INT;
    
    -- Check and create idx_osm_node_id
    SET index_count = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
        WHERE TABLE_NAME = 'locations' AND INDEX_NAME = 'idx_osm_node_id');
    IF index_count = 0 THEN
        ALTER TABLE locations ADD INDEX idx_osm_node_id (osm_node_id);
    END IF;
    
    -- Check and create idx_osm_way_id
    SET index_count = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
        WHERE TABLE_NAME = 'locations' AND INDEX_NAME = 'idx_osm_way_id');
    IF index_count = 0 THEN
        ALTER TABLE locations ADD INDEX idx_osm_way_id (osm_way_id);
    END IF;
    
    -- Check and create idx_last_osm_update
    SET index_count = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
        WHERE TABLE_NAME = 'locations' AND INDEX_NAME = 'idx_last_osm_update');
    IF index_count = 0 THEN
        ALTER TABLE locations ADD INDEX idx_last_osm_update (last_osm_update);
    END IF;
    
END$$

DELIMITER ;

CALL add_osm_indexes();
DROP PROCEDURE IF EXISTS add_osm_indexes;
