-- Test schema for H2 in-memory database

DROP TABLE IF EXISTS translations;
DROP TABLE IF EXISTS connecting_routes;
DROP TABLE IF EXISTS stops;
DROP TABLE IF EXISTS buses;
DROP TABLE IF EXISTS locations;
DROP TABLE IF EXISTS base_entity;

-- Base entity tracking columns
CREATE TABLE base_entity (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Locations table
CREATE TABLE locations (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    latitude DOUBLE,
    longitude DOUBLE,
    district VARCHAR(255),
    nearby_city VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Buses table
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
    FOREIGN KEY (from_location_id) REFERENCES locations(id),
    FOREIGN KEY (to_location_id) REFERENCES locations(id)
);

-- Stops table
CREATE TABLE stops (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    bus_id BIGINT,
    location_id BIGINT,
    arrival_time TIME,
    departure_time TIME,
    stop_order INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (bus_id) REFERENCES buses(id),
    FOREIGN KEY (location_id) REFERENCES locations(id)
);

-- Translations table
CREATE TABLE translations (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    entity_type VARCHAR(50) NOT NULL,
    entity_id BIGINT NOT NULL,
    field_name VARCHAR(50) NOT NULL,
    language_code VARCHAR(10) NOT NULL,
    translated_value TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Connecting Routes table
CREATE TABLE connecting_routes (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    first_bus_id BIGINT NOT NULL,
    second_bus_id BIGINT NOT NULL,
    connection_point_id BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (first_bus_id) REFERENCES buses(id),
    FOREIGN KEY (second_bus_id) REFERENCES buses(id),
    FOREIGN KEY (connection_point_id) REFERENCES locations(id)
);