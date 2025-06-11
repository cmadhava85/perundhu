-- Create table for translations
CREATE TABLE IF NOT EXISTS translations (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    entity_type VARCHAR(50) NOT NULL,  -- 'location', 'bus', 'stop'
    entity_id BIGINT NOT NULL,
    language_code VARCHAR(10) NOT NULL,
    field_name VARCHAR(50) NOT NULL,
    translated_value TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_translation (entity_type, entity_id, language_code, field_name)
);

-- Create table for route contributions
CREATE TABLE IF NOT EXISTS route_contributions (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(50),
    bus_number VARCHAR(20),
    from_location_name VARCHAR(100),
    to_location_name VARCHAR(100),
    from_latitude DOUBLE,
    from_longitude DOUBLE,
    to_latitude DOUBLE,
    to_longitude DOUBLE,
    schedule_info TEXT,
    status VARCHAR(20),
    submission_date TIMESTAMP,
    processed_date TIMESTAMP,
    additional_notes TEXT,
    validation_message TEXT
);

-- Create table for image contributions
CREATE TABLE IF NOT EXISTS image_contributions (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    description VARCHAR(1000),
    location VARCHAR(100),
    route_name VARCHAR(100),
    image_url VARCHAR(1000) NOT NULL,
    status VARCHAR(20) NOT NULL,
    submission_date TIMESTAMP NOT NULL,
    processed_date TIMESTAMP,
    additional_notes VARCHAR(1000),
    validation_message TEXT,
    extracted_data TEXT
);

-- Create table for buses
CREATE TABLE IF NOT EXISTS buses (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    bus_number VARCHAR(20) NOT NULL,
    departure_time TIME NOT NULL,
    arrival_time TIME NOT NULL,
    from_location_id BIGINT NOT NULL,
    to_location_id BIGINT NOT NULL
);

-- Create table for locations
CREATE TABLE IF NOT EXISTS locations (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    latitude DOUBLE,
    longitude DOUBLE
);

-- Create table for stops
CREATE TABLE IF NOT EXISTS stops (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    bus_id BIGINT NOT NULL,
    location_id BIGINT NOT NULL,
    arrival_time TIME NOT NULL,
    departure_time TIME NOT NULL,
    stop_order INT NOT NULL,
    FOREIGN KEY (bus_id) REFERENCES buses(id),
    FOREIGN KEY (location_id) REFERENCES locations(id)
);

-- Create table for bus location history
CREATE TABLE IF NOT EXISTS bus_location_history (
    id VARCHAR(36) PRIMARY KEY,
    bus_id BIGINT NOT NULL,
    latitude DOUBLE NOT NULL,
    longitude DOUBLE NOT NULL,
    speed DOUBLE,
    heading INTEGER,
    accuracy DOUBLE,
    timestamp TIMESTAMP NOT NULL,
    FOREIGN KEY (bus_id) REFERENCES buses(id)
);

-- Create table for bus analytics
CREATE TABLE IF NOT EXISTS bus_analytics (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    bus_id BIGINT NOT NULL,
    date DATE NOT NULL,
    passenger_count INTEGER DEFAULT 0,
    avg_speed DOUBLE DEFAULT 0.0,
    on_time_percentage DOUBLE DEFAULT 0.0,
    total_trips INTEGER DEFAULT 0,
    fuel_consumption DOUBLE DEFAULT 0.0,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (bus_id) REFERENCES buses(id)
);

-- Create table for user tracking sessions
CREATE TABLE IF NOT EXISTS user_tracking_sessions (
    id VARCHAR(36) PRIMARY KEY,
    device_id VARCHAR(100) NOT NULL,
    session_start TIMESTAMP NOT NULL,
    session_end TIMESTAMP,
    from_location_id BIGINT,
    to_location_id BIGINT,
    bus_id BIGINT,
    status VARCHAR(20),
    FOREIGN KEY (from_location_id) REFERENCES locations(id),
    FOREIGN KEY (to_location_id) REFERENCES locations(id),
    FOREIGN KEY (bus_id) REFERENCES buses(id)
);

-- Create table for bus travel metrics
CREATE TABLE IF NOT EXISTS bus_travel_metrics (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    bus_id BIGINT NOT NULL,
    date DATE NOT NULL,
    total_distance DOUBLE DEFAULT 0.0,
    avg_travel_time INTEGER DEFAULT 0,
    fuel_efficiency DOUBLE DEFAULT 0.0,
    co2_emission DOUBLE DEFAULT 0.0,
    FOREIGN KEY (bus_id) REFERENCES buses(id)
);
