-- V37__add_osm_fields_to_locations.sql
-- Add missing OSM (OpenStreetMap) integration fields to locations table
-- This migration safely handles the case where columns may have already been added

-- Only add columns if they don't exist
-- Since MySQL doesn't support IF NOT EXISTS in ALTER TABLE, we do this via procedure
DELIMITER $$

CREATE PROCEDURE IF NOT EXISTS add_osm_columns()
BEGIN
    DECLARE col_count INT;
    
    SET col_count = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'locations' AND COLUMN_NAME = 'osm_node_id');
    IF col_count = 0 THEN
        ALTER TABLE locations ADD COLUMN osm_node_id BIGINT;
    END IF;
    
    SET col_count = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'locations' AND COLUMN_NAME = 'osm_way_id');
    IF col_count = 0 THEN
        ALTER TABLE locations ADD COLUMN osm_way_id BIGINT;
    END IF;
    
    SET col_count = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'locations' AND COLUMN_NAME = 'last_osm_update');
    IF col_count = 0 THEN
        ALTER TABLE locations ADD COLUMN last_osm_update DATETIME;
    END IF;
    
    SET col_count = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'locations' AND COLUMN_NAME = 'osm_tags');
    IF col_count = 0 THEN
        ALTER TABLE locations ADD COLUMN osm_tags JSON;
    END IF;
    
END$$

DELIMITER ;

CALL add_osm_columns();
DROP PROCEDURE IF EXISTS add_osm_columns;
