-- V35: Create missing tracking and timing tables
-- Purpose: Create all missing tables referenced by JPA entities
-- Date: 2026-01-02
-- This migration ensures all entities have corresponding database tables

-- =====================
-- IMAGE CONTRIBUTION TIMING TABLE (MUST BE FIRST - referenced by other tables)
-- =====================

-- Create timing_image_contributions table (images of bus timing boards)
CREATE TABLE IF NOT EXISTS timing_image_contributions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(50),
    image_url VARCHAR(500) NOT NULL,
    thumbnail_url VARCHAR(500),
    origin_location VARCHAR(200) NOT NULL,
    origin_location_tamil VARCHAR(200),
    origin_latitude DECIMAL(10, 8),
    origin_longitude DECIMAL(11, 8),
    board_type VARCHAR(50),
    description TEXT,
    submission_date DATETIME NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    validation_message TEXT,
    processed_date DATETIME,
    processed_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_timing_image_user_id (user_id),
    INDEX idx_timing_image_status (status),
    INDEX idx_timing_image_submission (submission_date)
);

-- =====================
-- USER TRACKING TABLES
-- =====================

-- Create user_tracking_sessions table
CREATE TABLE IF NOT EXISTS user_tracking_sessions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    session_id VARCHAR(255),
    user_id VARCHAR(50),
    bus_id BIGINT,
    start_location_id BIGINT,
    device_info VARCHAR(500),
    ip_address VARCHAR(50),
    start_time DATETIME,
    end_time DATETIME,
    user_agent VARCHAR(500),
    end_location_id BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user_tracking_start_location FOREIGN KEY (start_location_id) REFERENCES locations(id),
    CONSTRAINT fk_user_tracking_end_location FOREIGN KEY (end_location_id) REFERENCES locations(id),
    CONSTRAINT fk_user_tracking_bus FOREIGN KEY (bus_id) REFERENCES buses(id),
    UNIQUE KEY uk_session_id (session_id),
    INDEX idx_user_tracking_user_id (user_id),
    INDEX idx_user_tracking_session_id (session_id)
);

-- =====================
-- BUS TIMING TABLES
-- =====================

-- Create bus_timing_records table (approved timing data)
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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_timing_from_location FOREIGN KEY (from_location_id) REFERENCES locations(id),
    CONSTRAINT fk_timing_to_location FOREIGN KEY (to_location_id) REFERENCES locations(id),
    CONSTRAINT fk_timing_bus FOREIGN KEY (bus_id) REFERENCES buses(id),
    UNIQUE KEY uk_bus_timing (from_location_id, to_location_id, departure_time, timing_type),
    INDEX idx_bus_timing_bus_id (bus_id),
    INDEX idx_bus_timing_from_location (from_location_id),
    INDEX idx_bus_timing_to_location (to_location_id)
);

-- Create extracted_bus_timings table (extracted from images)
CREATE TABLE IF NOT EXISTS extracted_bus_timings (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    contribution_id BIGINT,
    destination VARCHAR(200) NOT NULL,
    destination_tamil VARCHAR(200),
    morning_timings JSON,
    afternoon_timings JSON,
    night_timings JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_extracted_timing_contribution FOREIGN KEY (contribution_id) REFERENCES timing_image_contributions(id),
    INDEX idx_extracted_timing_contribution (contribution_id)
);

-- Create skipped_timing_records table (records skipped during processing)
CREATE TABLE IF NOT EXISTS skipped_timing_records (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    contribution_id BIGINT NOT NULL,
    from_location_id BIGINT NOT NULL,
    from_location_name VARCHAR(200) NOT NULL,
    to_location_id BIGINT NOT NULL,
    to_location_name VARCHAR(200) NOT NULL,
    departure_time TIME,
    timing_type VARCHAR(50) NOT NULL,
    skip_reason VARCHAR(100) NOT NULL,
    existing_record_id BIGINT,
    existing_record_source VARCHAR(50),
    skipped_at DATETIME NOT NULL,
    processed_by VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_skipped_from_location FOREIGN KEY (from_location_id) REFERENCES locations(id),
    CONSTRAINT fk_skipped_to_location FOREIGN KEY (to_location_id) REFERENCES locations(id),
    CONSTRAINT fk_skipped_contribution FOREIGN KEY (contribution_id) REFERENCES timing_image_contributions(id),
    INDEX idx_skipped_contribution (contribution_id),
    INDEX idx_skipped_from_location (from_location_id),
    INDEX idx_skipped_to_location (to_location_id)
);

