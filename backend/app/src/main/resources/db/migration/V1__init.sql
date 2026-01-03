-- V1__init.sql
-- Comprehensive schema and data initialization - CONSOLIDATED AND CLEANED UP
-- This migration consolidates all migrations V1.1 through V6 to eliminate
-- migration ordering and compatibility issues

SET FOREIGN_KEY_CHECKS=0;

-- Drop existing tables in correct dependency order
DROP TABLE IF EXISTS connecting_routes;
DROP TABLE IF EXISTS stops;
DROP TABLE IF EXISTS route_issues;
DROP TABLE IF EXISTS route_contributions;
DROP TABLE IF EXISTS image_contributions;
DROP TABLE IF EXISTS buses;
DROP TABLE IF EXISTS locations;
DROP TABLE IF EXISTS translations;
DROP TABLE IF EXISTS migration_history;
DROP TABLE IF EXISTS osm_route_stops;
DROP TABLE IF EXISTS osm_bus_stops;

SET FOREIGN_KEY_CHECKS=1;

-- =====================
-- BASE TABLES
-- =====================

-- Create table for translations
CREATE TABLE translations (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    entity_type VARCHAR(50) NOT NULL,
    entity_id BIGINT NOT NULL,
    language_code VARCHAR(10) NOT NULL,
    field_name VARCHAR(50) NOT NULL,
    translated_value TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_translation UNIQUE (entity_type, entity_id, language_code, field_name)
);

-- Create locations table with all necessary columns
CREATE TABLE locations (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    latitude DOUBLE,
    longitude DOUBLE,
    district VARCHAR(100),
    nearby_city VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create buses table with all necessary columns
CREATE TABLE buses (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    bus_number VARCHAR(50),
    from_location_id BIGINT,
    to_location_id BIGINT,
    departure_time TIME,
    arrival_time TIME,
    capacity INT DEFAULT 50,
    category VARCHAR(50) DEFAULT 'Regular',
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_bus_from_location FOREIGN KEY (from_location_id) REFERENCES locations(id),
    CONSTRAINT fk_bus_to_location FOREIGN KEY (to_location_id) REFERENCES locations(id)
);

-- Create stops table with all necessary columns
CREATE TABLE stops (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    bus_id BIGINT,
    location_id BIGINT,
    arrival_time TIME,
    departure_time TIME,
    stop_order INT NOT NULL,
    stops_json JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_stop_bus FOREIGN KEY (bus_id) REFERENCES buses(id),
    CONSTRAINT fk_stop_location FOREIGN KEY (location_id) REFERENCES locations(id)
);

-- Create connecting routes table
CREATE TABLE connecting_routes (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    first_bus_id BIGINT NOT NULL,
    second_bus_id BIGINT NOT NULL,
    connection_point_id BIGINT NOT NULL,
    wait_time_minutes INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_connecting_route_first_bus FOREIGN KEY (first_bus_id) REFERENCES buses(id),
    CONSTRAINT fk_connecting_route_second_bus FOREIGN KEY (second_bus_id) REFERENCES buses(id),
    CONSTRAINT fk_connecting_route_connection_point FOREIGN KEY (connection_point_id) REFERENCES locations(id)
);

-- =====================
-- CONTRIBUTION TABLES (V1.1)
-- =====================

CREATE TABLE route_contributions (
    id VARCHAR(50) NOT NULL PRIMARY KEY,
    bus_number VARCHAR(50),
    from_location VARCHAR(255),
    to_location VARCHAR(255),
    stops TEXT,
    frequency VARCHAR(100),
    operating_hours VARCHAR(100),
    fare VARCHAR(100),
    submission_date TIMESTAMP NOT NULL DEFAULT NOW(),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    submitted_by VARCHAR(100),
    rejection_reason TEXT,
    source_image_id VARCHAR(255),
    route_group_id VARCHAR(255),
    stops_json TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE image_contributions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    bus_number VARCHAR(50),
    image_url VARCHAR(1000) NOT NULL,
    description TEXT,
    submission_date TIMESTAMP NOT NULL DEFAULT NOW(),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    submitted_by VARCHAR(100),
    rejection_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================
-- ISSUES & TRACKING TABLE (V5)
-- =====================

CREATE TABLE route_issues (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    bus_id BIGINT,
    issue_type VARCHAR(100),
    description TEXT,
    status VARCHAR(20) DEFAULT 'OPEN',
    reported_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP,
    CONSTRAINT fk_issue_bus FOREIGN KEY (bus_id) REFERENCES buses(id)
);

-- =====================
-- OSM INTEGRATION TABLES (V2)
-- =====================

CREATE TABLE osm_bus_stops (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    osm_id VARCHAR(50) NOT NULL,
    name VARCHAR(255),
    latitude DOUBLE,
    longitude DOUBLE,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_osm_id (osm_id)
);

CREATE TABLE osm_route_stops (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    osm_route_id VARCHAR(50) NOT NULL,
    stop_order INT,
    osm_stop_id VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (osm_stop_id) REFERENCES osm_bus_stops(osm_id)
);

-- =====================
-- MIGRATION TRACKING
-- =====================

CREATE TABLE migration_history (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    migration_name VARCHAR(255) NOT NULL,
    executed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    success BOOLEAN NOT NULL DEFAULT TRUE,
    description VARCHAR(1000),
    CONSTRAINT unique_migration UNIQUE (migration_name)
);

-- =====================
-- INDICES FOR PERFORMANCE
-- =====================

-- Translations indices
CREATE INDEX idx_translations_entity ON translations(entity_type, entity_id);
CREATE INDEX idx_translations_language ON translations(language_code);
CREATE INDEX idx_translations_field ON translations(field_name);

-- Locations indices
CREATE INDEX idx_locations_name ON locations(name);
CREATE INDEX idx_locations_coords ON locations(latitude, longitude);

-- Buses indices
CREATE INDEX idx_buses_locations ON buses(from_location_id, to_location_id);
CREATE INDEX idx_buses_number ON buses(bus_number);
CREATE INDEX idx_buses_active ON buses(active);

-- Stops indices
CREATE INDEX idx_stop_bus_id ON stops(bus_id);
CREATE INDEX idx_stop_order ON stops(stop_order);
CREATE INDEX idx_stop_bus_order ON stops(bus_id, stop_order);

-- Route contributions indices
CREATE INDEX idx_route_contributions_status ON route_contributions(status);
CREATE INDEX idx_route_contributions_bus_number ON route_contributions(bus_number);

-- Image contributions indices
CREATE INDEX idx_image_contributions_status ON image_contributions(status);
CREATE INDEX idx_image_contributions_bus_number ON image_contributions(bus_number);

-- Route issues indices
CREATE INDEX idx_route_issues_status ON route_issues(status);
CREATE INDEX idx_route_issues_bus ON route_issues(bus_id);

-- OSM indices
CREATE INDEX idx_osm_bus_stops_osm_id ON osm_bus_stops(osm_id);
CREATE INDEX idx_osm_route_stops_route ON osm_route_stops(osm_route_id);

-- Connecting routes indices
CREATE INDEX idx_connecting_routes_buses ON connecting_routes(first_bus_id, second_bus_id);
CREATE INDEX idx_connecting_routes_connection ON connecting_routes(connection_point_id);

-- =====================
-- BASE DATA
-- =====================

-- Insert base data for locations
INSERT INTO locations (name, latitude, longitude, district) VALUES 
('Chennai', 13.0827, 80.2707, 'Chennai'),
('Coimbatore', 11.0168, 76.9558, 'Coimbatore'),
('Madurai', 9.9252, 78.1198, 'Madurai'),
('Trichy', 10.7905, 78.7047, 'Tiruchirappalli'),
('Salem', 11.6643, 78.1460, 'Salem'),
('Tirunelveli', 8.7139, 77.7567, 'Tirunelveli'),
('Kanyakumari', 8.0883, 77.5385, 'Kanyakumari'),
('Vellore', 12.9165, 79.1325, 'Vellore'),
('Thanjavur', 10.7870, 79.1378, 'Thanjavur'),
('Kumbakonam', 10.9602, 79.3845, 'Thanjavur');

-- Insert base data for buses
INSERT INTO buses (name, bus_number, from_location_id, to_location_id, departure_time, arrival_time, capacity, category, active) VALUES
('SETC Chennai Express', 'TN-01-1234', 1, 2, '06:00:00', '12:30:00', 50, 'Express', TRUE),
('TNSTC Kovai Deluxe', 'TN-01-5678', 1, 2, '08:00:00', '14:30:00', 45, 'Deluxe', TRUE),
('SETC Madurai Express', 'TN-01-2345', 1, 3, '07:00:00', '14:00:00', 50, 'Express', TRUE),
('TNSTC Madurai Special', 'TN-01-6789', 1, 3, '09:00:00', '16:00:00', 48, 'Special', TRUE),
('SETC Trichy Express', 'TN-01-3456', 1, 4, '08:00:00', '14:00:00', 50, 'Express', TRUE),
('TNSTC Trichy Flyer', 'TN-01-7890', 1, 4, '10:00:00', '16:00:00', 45, 'Regular', TRUE);

-- Insert stops data
INSERT INTO stops (name, bus_id, location_id, arrival_time, departure_time, stop_order) VALUES
('Chennai', 1, 1, '06:00:00', '06:00:00', 1),
('Vellore', 1, 8, '07:30:00', '07:35:00', 2),
('Salem', 1, 5, '09:30:00', '09:40:00', 3),
('Coimbatore', 1, 2, '12:30:00', '12:30:00', 5),
('Chennai', 4, 1, '07:00:00', '07:00:00', 1),
('Trichy', 4, 4, '11:00:00', '11:10:00', 3),
('Madurai', 4, 3, '14:00:00', '14:00:00', 5);

-- Insert connecting routes
INSERT INTO connecting_routes (first_bus_id, second_bus_id, connection_point_id, wait_time_minutes) VALUES
(1, 6, 2, 30),
(3, 1, 1, 45);

-- Add Tamil translations for locations
INSERT INTO translations (entity_type, entity_id, language_code, field_name, translated_value) VALUES
('location', 1, 'ta', 'name', 'சென்னை'),
('location', 2, 'ta', 'name', 'கோயம்புத்தூர்'),
('location', 3, 'ta', 'name', 'மதுரை'),
('location', 4, 'ta', 'name', 'திருச்சி'),
('location', 5, 'ta', 'name', 'சேலம்'),
('location', 6, 'ta', 'name', 'திருநெல்வேலி'),
('location', 7, 'ta', 'name', 'கன்னியாகுமரி'),
('location', 8, 'ta', 'name', 'வேலூர்'),
('location', 9, 'ta', 'name', 'தஞ்சாவூர்'),
('location', 10, 'ta', 'name', 'கும்பகோணம்');
