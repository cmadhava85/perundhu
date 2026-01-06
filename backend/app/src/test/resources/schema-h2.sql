-- Test schema for H2 database
-- Drop tables first to avoid constraint issues
DROP TABLE IF EXISTS stops;
DROP TABLE IF EXISTS buses;
DROP TABLE IF EXISTS locations;
DROP TABLE IF EXISTS system_settings;

-- System Settings table
CREATE TABLE system_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT,
    category VARCHAR(50),
    description VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Locations table
CREATE TABLE locations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name_en VARCHAR(100) NOT NULL,
    name_ta VARCHAR(100),
    latitude DOUBLE NOT NULL,
    longitude DOUBLE NOT NULL,
    address VARCHAR(255),
    district VARCHAR(255),
    nearby_city VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Buses table
CREATE TABLE buses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    bus_number VARCHAR(100) NOT NULL,
    from_location_id INT,
    to_location_id INT,
    departure_time TIME,
    arrival_time TIME,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_from_location FOREIGN KEY (from_location_id) REFERENCES locations(id),
    CONSTRAINT fk_to_location FOREIGN KEY (to_location_id) REFERENCES locations(id)
);

-- Stops table
CREATE TABLE stops (
    id INT AUTO_INCREMENT PRIMARY KEY,
    bus_id INT,
    location_id INT,
    name VARCHAR(100) NOT NULL,
    arrival_time TIME,
    departure_time TIME,
    stop_order INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_bus FOREIGN KEY (bus_id) REFERENCES buses(id),
    CONSTRAINT fk_location FOREIGN KEY (location_id) REFERENCES locations(id)
);

