-- V61__add_missing_locations_columns.sql
-- Add missing columns to locations table that LocationJpaEntity expects
-- Date: 2026-01-08

ALTER TABLE locations ADD COLUMN IF NOT EXISTS osm_type VARCHAR(20);
ALTER TABLE locations ADD COLUMN IF NOT EXISTS osm_node_id BIGINT;
ALTER TABLE locations ADD COLUMN IF NOT EXISTS osm_way_id BIGINT;
ALTER TABLE locations ADD COLUMN IF NOT EXISTS last_osm_update DATETIME;
ALTER TABLE locations ADD COLUMN IF NOT EXISTS osm_tags JSON;
ALTER TABLE locations ADD COLUMN IF NOT EXISTS neighborhood VARCHAR(255);
ALTER TABLE locations ADD COLUMN IF NOT EXISTS state VARCHAR(100);
ALTER TABLE locations ADD COLUMN IF NOT EXISTS type VARCHAR(50);
