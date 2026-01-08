-- V56__baseline_complete_schema.sql
-- Baseline Schema: Complete database schema after consolidation
-- Purpose: Establish baseline after V1-V55 migrations
-- Date: 2026-01-06
-- Strategy: This migration captures the complete schema state, allowing cleanup of V1-V55

SET FOREIGN_KEY_CHECKS=0;

-- =====================
-- TRANSLATIONS TABLE
-- =====================
CREATE TABLE IF NOT EXISTS translations (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    entity_type VARCHAR(50) NOT NULL,
    entity_id BIGINT NOT NULL,
    language_code VARCHAR(10) NOT NULL,
    field_name VARCHAR(50) NOT NULL,
    translated_value TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_translation UNIQUE (entity_type, entity_id, language_code, field_name),
    KEY idx_entity_translation (entity_type, entity_id, language_code)
);

-- =====================
-- LOCATIONS TABLE
-- =====================
CREATE TABLE IF NOT EXISTS locations (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    latitude DOUBLE,
    longitude DOUBLE,
    district VARCHAR(100),
    nearby_city VARCHAR(100),
    osm_id BIGINT,
    osm_type VARCHAR(20),
    neighborhood VARCHAR(255),
    state VARCHAR(100),
    priority INT,
    type VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    KEY idx_location_name (name),
    KEY idx_location_coordinates (latitude, longitude),
    KEY idx_location_district (district)
);

-- =====================
-- BUSES TABLE
-- =====================
CREATE TABLE IF NOT EXISTS buses (
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
    rating DOUBLE,
    features VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_bus_from_location FOREIGN KEY (from_location_id) REFERENCES locations(id),
    CONSTRAINT fk_bus_to_location FOREIGN KEY (to_location_id) REFERENCES locations(id),
    KEY idx_bus_number (bus_number),
    KEY idx_bus_from_to (from_location_id, to_location_id)
);

-- =====================
-- STOPS TABLE
-- =====================
CREATE TABLE IF NOT EXISTS stops (
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
    CONSTRAINT fk_stop_location FOREIGN KEY (location_id) REFERENCES locations(id),
    KEY idx_stop_bus (bus_id),
    KEY idx_stop_location (location_id)
);

-- =====================
-- CONNECTING ROUTES TABLE
-- =====================
CREATE TABLE IF NOT EXISTS connecting_routes (
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
-- ROUTE CONTRIBUTIONS TABLE
-- =====================
CREATE TABLE IF NOT EXISTS route_contributions (
    id VARCHAR(50) NOT NULL PRIMARY KEY,
    user_id VARCHAR(50),
    bus_name VARCHAR(255),
    from_location_name VARCHAR(255),
    to_location_name VARCHAR(255),
    departure_time VARCHAR(50),
    arrival_time VARCHAR(50),
    schedule_info TEXT,
    status VARCHAR(50) DEFAULT 'PENDING',
    processed_date DATETIME,
    validation_message TEXT,
    source_bus_id BIGINT,
    contribution_type VARCHAR(50),
    from_latitude VARCHAR(50),
    from_longitude VARCHAR(50),
    to_latitude VARCHAR(50),
    to_longitude VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    KEY idx_route_contribution_status (status),
    KEY idx_route_contribution_user (user_id)
);

-- =====================
-- IMAGE CONTRIBUTIONS TABLE
-- =====================
CREATE TABLE IF NOT EXISTS image_contributions (
    id VARCHAR(36) NOT NULL PRIMARY KEY,
    image_url VARCHAR(1000),
    status VARCHAR(100) DEFAULT 'PENDING',
    submission_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_date TIMESTAMP NULL,
    user_id VARCHAR(50),
    description VARCHAR(1000),
    location VARCHAR(100),
    route_name VARCHAR(100),
    extracted_data TEXT,
    validation_message TEXT,
    additional_notes VARCHAR(1000),
    image_data LONGBLOB,
    image_content_type VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY idx_image_contributions_status (status),
    KEY idx_image_contributions_user_id (user_id)
);

-- =====================
-- ROUTE ISSUES TABLE
-- =====================
CREATE TABLE IF NOT EXISTS route_issues (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    bus_id BIGINT,
    issue_type VARCHAR(100),
    description TEXT,
    status VARCHAR(20) DEFAULT 'OPEN',
    reported_by VARCHAR(100),
    resolved_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    KEY idx_route_issues_status (status),
    KEY idx_route_issues_bus (bus_id)
);

-- =====================
-- REVIEWS TABLE
-- =====================
CREATE TABLE IF NOT EXISTS reviews (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(255),
    bus_id BIGINT,
    rating INT,
    comment TEXT,
    status VARCHAR(20) DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    KEY idx_reviews_status (status),
    KEY idx_reviews_bus (bus_id),
    CONSTRAINT fk_review_bus FOREIGN KEY (bus_id) REFERENCES buses(id)
);

-- =====================
-- ANNOUNCEMENTS TABLE
-- =====================
CREATE TABLE IF NOT EXISTS announcements (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    type VARCHAR(50),
    unique_id VARCHAR(100) UNIQUE,
    title_key VARCHAR(255),
    is_active INT DEFAULT 1,
    priority INT DEFAULT 5,
    target_users VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================
-- USER FEEDBACK TABLE
-- =====================
CREATE TABLE IF NOT EXISTS user_feedback (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(255),
    feedback_type VARCHAR(50),
    message TEXT,
    rating INT,
    status VARCHAR(20) DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    KEY idx_user_feedback_status (status)
);

-- =====================
-- USER TRACKING SESSIONS TABLE
-- =====================
CREATE TABLE IF NOT EXISTS user_tracking_sessions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(50),
    ip_address VARCHAR(50),
    user_agent VARCHAR(500),
    start_time DATETIME,
    end_time DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    KEY idx_user_tracking_user (user_id)
);

-- =====================
-- TIMING IMAGE CONTRIBUTIONS TABLE
-- =====================
CREATE TABLE IF NOT EXISTS timing_image_contributions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(50),
    image_url VARCHAR(500),
    thumbnail_url VARCHAR(500),
    origin_location VARCHAR(200),
    origin_location_tamil VARCHAR(200),
    origin_latitude VARCHAR(50),
    origin_longitude VARCHAR(50),
    board_type VARCHAR(50),
    description TEXT,
    submission_date DATETIME,
    status VARCHAR(50),
    validation_message TEXT,
    processed_date DATETIME,
    processed_by VARCHAR(100),
    submitted_by VARCHAR(100),
    ocr_confidence VARCHAR(50),
    requires_manual_review INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    KEY idx_timing_image_status (status),
    KEY idx_timing_image_user (user_id)
);

-- =====================
-- EXTRACTED BUS TIMINGS TABLE
-- =====================
CREATE TABLE IF NOT EXISTS extracted_bus_timings (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    bus_number VARCHAR(50),
    from_location VARCHAR(255),
    to_location VARCHAR(255),
    departure_time VARCHAR(50),
    arrival_time VARCHAR(50),
    status VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    KEY idx_extracted_bus_number (bus_number)
);

-- =====================
-- SKIPPED TIMING RECORDS TABLE
-- =====================
CREATE TABLE IF NOT EXISTS skipped_timing_records (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    timing_text TEXT,
    reason VARCHAR(255),
    skipped_at DATETIME,
    context_data TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================
-- BUS TIMING RECORDS TABLE
-- =====================
CREATE TABLE IF NOT EXISTS bus_timing_records (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    bus_id BIGINT,
    record_date DATE,
    timing_text TEXT,
    extracted_at DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    KEY idx_bus_timing_bus (bus_id),
    KEY idx_bus_timing_date (record_date)
);

-- =====================
-- SYSTEM SETTINGS TABLE
-- =====================
CREATE TABLE IF NOT EXISTS system_settings (
    setting_key VARCHAR(100) PRIMARY KEY,
    setting_value TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- =====================
-- SOCIAL MEDIA POSTS TABLE
-- =====================
CREATE TABLE IF NOT EXISTS social_media_posts (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255),
    content TEXT,
    platform VARCHAR(50),
    scheduled_at DATETIME,
    posted_at DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

SET FOREIGN_KEY_CHECKS=1;

-- Confirm migration status
SELECT 'V56: Complete baseline schema established' as migration_status;
