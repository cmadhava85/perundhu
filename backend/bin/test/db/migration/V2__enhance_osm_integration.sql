-- Migration to enhance database for OSM integration
-- File: V2__enhance_osm_integration.sql

-- Add OSM-specific fields to locations table for caching OSM data
ALTER TABLE locations 
ADD COLUMN osm_node_id BIGINT NULL,
ADD COLUMN osm_way_id BIGINT NULL,
ADD COLUMN last_osm_update TIMESTAMP NULL,
ADD COLUMN osm_tags JSON NULL;

-- Create table for caching OSM bus stop data
CREATE TABLE osm_bus_stops (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    osm_id BIGINT UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    latitude DOUBLE NOT NULL,
    longitude DOUBLE NOT NULL,
    stop_type ENUM('bus_stop', 'platform', 'station') DEFAULT 'bus_stop',
    has_shelter BOOLEAN DEFAULT FALSE,
    has_bench BOOLEAN DEFAULT FALSE,
    network VARCHAR(100),
    operator VARCHAR(100),
    accessibility VARCHAR(50),
    surface VARCHAR(50),
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_osm_id (osm_id),
    INDEX idx_location (latitude, longitude),
    INDEX idx_network (network),
    INDEX idx_facilities (has_shelter, has_bench)
);

-- Create table for caching OSM bus routes
CREATE TABLE osm_bus_routes (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    osm_relation_id BIGINT UNIQUE NOT NULL,
    route_ref VARCHAR(50),
    route_name VARCHAR(255),
    network VARCHAR(100),
    operator VARCHAR(100),
    from_location VARCHAR(255),
    to_location VARCHAR(255),
    route_type VARCHAR(50) DEFAULT 'bus',
    frequency VARCHAR(50),
    operating_hours VARCHAR(100),
    estimated_duration INTEGER, -- in minutes
    estimated_distance DOUBLE,   -- in km
    relevance_score DOUBLE DEFAULT 0.0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_osm_relation_id (osm_relation_id),
    INDEX idx_route_ref (route_ref),
    INDEX idx_network (network),
    INDEX idx_relevance (relevance_score DESC)
);

-- Junction table for OSM route stops
CREATE TABLE osm_route_stops (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    osm_route_id BIGINT NOT NULL,
    osm_stop_id BIGINT NOT NULL,
    stop_sequence INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (osm_route_id) REFERENCES osm_bus_routes(id) ON DELETE CASCADE,
    FOREIGN KEY (osm_stop_id) REFERENCES osm_bus_stops(id) ON DELETE CASCADE,
    UNIQUE KEY unique_route_stop (osm_route_id, osm_stop_id),
    INDEX idx_route_sequence (osm_route_id, stop_sequence)
);

-- Enhanced connecting_routes table with OSM support
ALTER TABLE connecting_routes 
ADD COLUMN is_osm_discovered BOOLEAN DEFAULT FALSE,
ADD COLUMN osm_route_ref VARCHAR(50) NULL,
ADD COLUMN osm_network VARCHAR(100) NULL,
ADD COLUMN osm_operator VARCHAR(100) NULL;

-- Table for OSM API rate limiting and caching
CREATE TABLE osm_api_cache (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    query_hash VARCHAR(64) UNIQUE NOT NULL, -- MD5/SHA256 of query parameters
    query_type ENUM('bus_stops', 'bus_routes', 'route_relation') NOT NULL,
    bbox_north DOUBLE,
    bbox_south DOUBLE,
    bbox_east DOUBLE,
    bbox_west DOUBLE,
    response_data JSON,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_query_hash (query_hash),
    INDEX idx_expires (expires_at),
    INDEX idx_bbox (bbox_north, bbox_south, bbox_east, bbox_west)
);

-- Performance indexes for existing tables
CREATE INDEX idx_buses_from_to ON buses(from_location_id, to_location_id);
CREATE INDEX idx_stops_bus_order ON stops(bus_id, stop_order);
CREATE INDEX idx_locations_coordinates ON locations(latitude, longitude);

-- Add constraints for data integrity
ALTER TABLE osm_bus_stops 
ADD CONSTRAINT chk_latitude CHECK (latitude >= -90 AND latitude <= 90),
ADD CONSTRAINT chk_longitude CHECK (longitude >= -180 AND longitude <= 180);

ALTER TABLE locations
ADD CONSTRAINT chk_loc_latitude CHECK (latitude IS NULL OR (latitude >= -90 AND latitude <= 90)),
ADD CONSTRAINT chk_loc_longitude CHECK (longitude IS NULL OR (longitude >= -180 AND longitude <= 180));