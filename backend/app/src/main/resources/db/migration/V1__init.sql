-- V1__init.sql
-- Comprehensive schema and data initialization

-- First, drop existing tables in correct order to avoid foreign key constraints
SET FOREIGN_KEY_CHECKS=0;

DROP TABLE IF EXISTS connecting_routes;
DROP TABLE IF EXISTS stops;
DROP TABLE IF EXISTS buses;
DROP TABLE IF EXISTS locations;
DROP TABLE IF EXISTS translations;
DROP TABLE IF EXISTS migration_history;

SET FOREIGN_KEY_CHECKS=1;

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

-- Create locations table
CREATE TABLE locations (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    latitude DOUBLE,
    longitude DOUBLE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create buses table
CREATE TABLE buses (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    bus_number VARCHAR(50) NOT NULL,
    from_location_id BIGINT,
    to_location_id BIGINT,
    departure_time TIME,
    arrival_time TIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_bus_from_location FOREIGN KEY (from_location_id) REFERENCES locations(id),
    CONSTRAINT fk_bus_to_location FOREIGN KEY (to_location_id) REFERENCES locations(id)
);

-- Create stops table
CREATE TABLE stops (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    bus_id BIGINT,
    location_id BIGINT,
    arrival_time TIME,
    departure_time TIME,
    stop_order INT NOT NULL,
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

-- Create migration_history table for tracking custom migrations
CREATE TABLE migration_history (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    migration_name VARCHAR(255) NOT NULL,
    executed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    success BOOLEAN NOT NULL DEFAULT TRUE,
    description VARCHAR(1000),
    CONSTRAINT unique_migration UNIQUE (migration_name)
);

-- Add indexes for better performance
CREATE INDEX idx_translations_entity ON translations(entity_type, entity_id);
CREATE INDEX idx_translations_language ON translations(language_code);
CREATE INDEX idx_translations_field ON translations(field_name);
CREATE INDEX idx_buses_locations ON buses(from_location_id, to_location_id);
CREATE INDEX idx_stops_sequence ON stops(bus_id, stop_order);
CREATE INDEX idx_connecting_routes_buses ON connecting_routes(first_bus_id, second_bus_id);
CREATE INDEX idx_connecting_routes_connection ON connecting_routes(connection_point_id);

-- Insert base data for locations
INSERT INTO locations (name, latitude, longitude) VALUES 
('Chennai', 13.0827, 80.2707),
('Coimbatore', 11.0168, 76.9558),
('Madurai', 9.9252, 78.1198),
('Trichy', 10.7905, 78.7047),
('Salem', 11.6643, 78.1460),
('Tirunelveli', 8.7139, 77.7567),
('Kanyakumari', 8.0883, 77.5385),
('Vellore', 12.9165, 79.1325),
('Thanjavur', 10.7870, 79.1378),
('Kumbakonam', 10.9602, 79.3845);

-- Insert base data for buses
INSERT INTO buses (name, bus_number, from_location_id, to_location_id, departure_time, arrival_time) VALUES
('SETC Chennai Express', 'TN-01-1234', 1, 2, '06:00:00', '12:30:00'),
('TNSTC Kovai Deluxe', 'TN-01-5678', 1, 2, '08:00:00', '14:30:00'),
('SETC Madurai Express', 'TN-01-2345', 1, 3, '07:00:00', '14:00:00'),
('TNSTC Madurai Special', 'TN-01-6789', 1, 3, '09:00:00', '16:00:00'),
('SETC Trichy Express', 'TN-01-3456', 1, 4, '08:00:00', '14:00:00'),
('TNSTC Trichy Flyer', 'TN-01-7890', 1, 4, '10:00:00', '16:00:00');

-- Insert stops data
INSERT INTO stops (name, bus_id, location_id, arrival_time, departure_time, stop_order) VALUES
('Chennai', 1, 1, '06:00:00', '06:00:00', 1),
('Vellore', 1, 8, '07:30:00', '07:35:00', 2),
('Salem', 1, 5, '09:30:00', '09:40:00', 3),
('Erode', 1, NULL, '11:00:00', '11:05:00', 4),
('Coimbatore', 1, 2, '12:30:00', '12:30:00', 5),
('Chennai', 4, 1, '07:00:00', '07:00:00', 1),
('Villupuram', 4, NULL, '08:30:00', '08:35:00', 2),
('Trichy', 4, 4, '11:00:00', '11:10:00', 3),
('Dindigul', 4, NULL, '12:30:00', '12:35:00', 4),
('Madurai', 4, 3, '14:00:00', '14:00:00', 5);

-- Insert connecting routes
INSERT INTO connecting_routes (first_bus_id, second_bus_id, connection_point_id, wait_time_minutes) VALUES
(1, 6, 2, 30),  -- Chennai to Coimbatore to Trichy
(3, 1, 1, 45);  -- Chennai to Madurai to Coimbatore

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