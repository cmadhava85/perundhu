-- V9__create_timing_tables.sql
-- Create tables for bus timing image contributions and OCR processing

-- Create timing image contributions table
CREATE TABLE IF NOT EXISTS timing_image_contributions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(255),
    image_url VARCHAR(500) NOT NULL,
    thumbnail_url VARCHAR(500),
    origin_location VARCHAR(200) NOT NULL,
    origin_location_tamil VARCHAR(200),
    origin_latitude DECIMAL(10, 8),
    origin_longitude DECIMAL(11, 8),
    board_type VARCHAR(50),
    description TEXT,
    submission_date DATETIME NOT NULL,
    status VARCHAR(50) NOT NULL,
    validation_message TEXT,
    processed_date DATETIME,
    processed_by VARCHAR(100),
    submitted_by VARCHAR(100),
    ocr_confidence DECIMAL(3, 2),
    requires_manual_review BOOLEAN DEFAULT FALSE,
    duplicate_check_status VARCHAR(50),
    merged_records INT DEFAULT 0,
    created_records INT DEFAULT 0,
    detected_language VARCHAR(10),
    detected_languages JSON,
    ocr_text_original TEXT,
    ocr_text_english TEXT,
    created_at DATETIME NOT NULL,
    updated_at DATETIME,
    INDEX idx_timing_contributions_status (status),
    INDEX idx_timing_contributions_submission_date (submission_date),
    INDEX idx_timing_contributions_user_id (user_id),
    INDEX idx_timing_contributions_origin (origin_location)
);

-- Create extracted bus timings table
CREATE TABLE IF NOT EXISTS extracted_bus_timings (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    contribution_id BIGINT NOT NULL,
    destination VARCHAR(200) NOT NULL,
    destination_tamil VARCHAR(200),
    morning_timings JSON,
    afternoon_timings JSON,
    night_timings JSON,
    created_at DATETIME NOT NULL,
    CONSTRAINT fk_extracted_timing_contribution FOREIGN KEY (contribution_id) 
        REFERENCES timing_image_contributions(id) ON DELETE CASCADE,
    INDEX idx_extracted_timings_contribution (contribution_id),
    INDEX idx_extracted_timings_destination (destination)
);

-- Create bus timing records table (final approved data)
CREATE TABLE IF NOT EXISTS bus_timing_records (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    bus_id BIGINT,
    from_location_id BIGINT NOT NULL,
    from_location_name VARCHAR(200) NOT NULL,
    to_location_id BIGINT NOT NULL,
    to_location_name VARCHAR(200) NOT NULL,
    departure_time TIME NOT NULL,
    arrival_time TIME,
    timing_type VARCHAR(50) NOT NULL,
    source VARCHAR(50),
    contribution_id BIGINT,
    verified BOOLEAN DEFAULT FALSE,
    last_updated DATETIME,
    CONSTRAINT fk_bus_timing_bus FOREIGN KEY (bus_id) REFERENCES buses(id),
    CONSTRAINT fk_bus_timing_from_location FOREIGN KEY (from_location_id) REFERENCES locations(id),
    CONSTRAINT fk_bus_timing_to_location FOREIGN KEY (to_location_id) REFERENCES locations(id),
    CONSTRAINT unique_bus_timing UNIQUE (from_location_id, to_location_id, departure_time, timing_type),
    INDEX idx_bus_timing_from_location (from_location_id),
    INDEX idx_bus_timing_to_location (to_location_id),
    INDEX idx_bus_timing_departure (departure_time),
    INDEX idx_bus_timing_type (timing_type),
    INDEX idx_bus_timing_verified (verified)
);

-- Create skipped timing records table (audit trail)
CREATE TABLE IF NOT EXISTS skipped_timing_records (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    contribution_id BIGINT NOT NULL,
    from_location_id BIGINT NOT NULL,
    from_location_name VARCHAR(200) NOT NULL,
    to_location_id BIGINT NOT NULL,
    to_location_name VARCHAR(200) NOT NULL,
    departure_time TIME,
    timing_type VARCHAR(50) NOT NULL,
    skip_reason VARCHAR(50) NOT NULL,
    existing_record_id BIGINT,
    existing_record_source VARCHAR(50),
    skipped_at DATETIME NOT NULL,
    processed_by VARCHAR(100),
    notes TEXT,
    INDEX idx_skipped_timing_contribution (contribution_id),
    INDEX idx_skipped_timing_locations (from_location_id, to_location_id),
    INDEX idx_skipped_timing_reason (skip_reason)
);

-- Create user tracking sessions table
CREATE TABLE IF NOT EXISTS user_tracking_sessions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    session_id VARCHAR(255),
    user_id VARCHAR(255),
    bus_id BIGINT,
    start_location_id BIGINT,
    end_location_id BIGINT,
    device_info VARCHAR(500),
    ip_address VARCHAR(45),
    start_time DATETIME,
    end_time DATETIME,
    user_agent VARCHAR(500),
    CONSTRAINT fk_tracking_bus FOREIGN KEY (bus_id) REFERENCES buses(id),
    CONSTRAINT fk_tracking_start_location FOREIGN KEY (start_location_id) REFERENCES locations(id),
    CONSTRAINT fk_tracking_end_location FOREIGN KEY (end_location_id) REFERENCES locations(id),
    INDEX idx_tracking_session (session_id),
    INDEX idx_tracking_user (user_id),
    INDEX idx_tracking_start_time (start_time)
);
