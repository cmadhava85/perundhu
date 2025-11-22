-- Add OSM-related fields to locations table for enhanced integration
-- This migration adds the missing columns that the LocationJpaEntity expects

ALTER TABLE locations
ADD COLUMN osm_node_id BIGINT NULL COMMENT 'OpenStreetMap node ID for this location',
ADD COLUMN osm_way_id BIGINT NULL COMMENT 'OpenStreetMap way ID for this location',
ADD COLUMN last_osm_update TIMESTAMP NULL COMMENT 'Last time OSM data was updated for this location',
ADD COLUMN osm_tags JSON NULL COMMENT 'OSM tags in JSON format for additional location metadata';

-- Add index on OSM fields for better performance
CREATE INDEX idx_locations_osm_node_id ON locations(osm_node_id);
CREATE INDEX idx_locations_osm_way_id ON locations(osm_way_id);
CREATE INDEX idx_locations_last_osm_update ON locations(last_osm_update);