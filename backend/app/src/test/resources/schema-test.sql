-- Drop tables if they exist to start with a clean slate
DROP TABLE IF EXISTS connecting_route;
DROP TABLE IF EXISTS stop;
DROP TABLE IF EXISTS buses;
DROP TABLE IF EXISTS locations;

-- Create locations table
CREATE TABLE locations (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name_en VARCHAR(255) NOT NULL,
    name_ta VARCHAR(255),
    latitude DOUBLE NOT NULL,
    longitude DOUBLE NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

-- Create buses table
CREATE TABLE buses (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    from_location_id BIGINT,
    to_location_id BIGINT,
    name_en VARCHAR(255) NOT NULL,
    name_ta VARCHAR(255) NULL,
    bus_number VARCHAR(255) NOT NULL,
    departure_time TIME,
    arrival_time TIME,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    FOREIGN KEY (from_location_id) REFERENCES locations(id),
    FOREIGN KEY (to_location_id) REFERENCES locations(id)
);

-- Create stops table
CREATE TABLE stop (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    location_id BIGINT NOT NULL,
    bus_id BIGINT NOT NULL,
    name VARCHAR(255) NOT NULL,
    arrival_time TIME,
    departure_time TIME,
    stop_order INT NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    FOREIGN KEY (location_id) REFERENCES locations(id),
    FOREIGN KEY (bus_id) REFERENCES buses(id)
);

-- Create connecting routes table
CREATE TABLE connecting_route (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    from_location_id BIGINT NOT NULL,
    to_location_id BIGINT NOT NULL, 
    first_bus_id BIGINT NOT NULL,
    second_bus_id BIGINT NOT NULL,
    connection_location_id BIGINT NOT NULL,
    wait_time_minutes INT NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    FOREIGN KEY (from_location_id) REFERENCES locations(id),
    FOREIGN KEY (to_location_id) REFERENCES locations(id),
    FOREIGN KEY (first_bus_id) REFERENCES buses(id),
    FOREIGN KEY (second_bus_id) REFERENCES buses(id),
    FOREIGN KEY (connection_location_id) REFERENCES locations(id)
);