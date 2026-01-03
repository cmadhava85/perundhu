-- V37__add_osm_fields_to_locations.sql
-- Add missing OSM (OpenStreetMap) integration fields to locations table

ALTER TABLE locations
ADD COLUMN osm_node_id BIGINT COMMENT 'OpenStreetMap Node ID',
ADD COLUMN osm_way_id BIGINT COMMENT 'OpenStreetMap Way ID',
ADD COLUMN last_osm_update DATETIME COMMENT 'Last OpenStreetMap update timestamp',
ADD COLUMN osm_tags JSON COMMENT 'OpenStreetMap tags in JSON format';

-- Add index for OSM node ID lookups
CREATE INDEX idx_osm_node_id ON locations(osm_node_id);

-- Add index for OSM way ID lookups
CREATE INDEX idx_osm_way_id ON locations(osm_way_id);

-- Add index for last OSM update time for tracking synchronization
CREATE INDEX idx_last_osm_update ON locations(last_osm_update);
