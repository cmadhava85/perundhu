-- Timing Image Contributions Table
CREATE TABLE timing_image_contributions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id VARCHAR(100),
    image_url VARCHAR(500) NOT NULL,
    thumbnail_url VARCHAR(500),
    origin_location VARCHAR(200) NOT NULL,
    origin_location_tamil VARCHAR(200),
    origin_latitude DECIMAL(10, 8),
    origin_longitude DECIMAL(11, 8),
    board_type ENUM('GOVERNMENT', 'PRIVATE', 'LOCAL', 'INTER_CITY'),
    description TEXT,
    submission_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('PENDING', 'APPROVED', 'REJECTED', 'PROCESSING') DEFAULT 'PENDING',
    validation_message TEXT,
    processed_date TIMESTAMP,
    processed_by VARCHAR(100),
    submitted_by VARCHAR(100),
    ocr_confidence DECIMAL(3, 2),
    requires_manual_review BOOLEAN DEFAULT FALSE,
    duplicate_check_status ENUM('CHECKED', 'DUPLICATES_FOUND', 'UNIQUE', 'SKIPPED'),
    merged_records INT DEFAULT 0,
    created_records INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_status (status),
    INDEX idx_user (user_id),
    INDEX idx_origin (origin_location),
    INDEX idx_submission_date (submission_date)
);

-- Extracted Timings Table (JSON storage)
CREATE TABLE extracted_bus_timings (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    contribution_id BIGINT NOT NULL,
    destination VARCHAR(200) NOT NULL,
    destination_tamil VARCHAR(200),
    morning_timings JSON,
    afternoon_timings JSON,
    night_timings JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (contribution_id) REFERENCES timing_image_contributions(id) ON DELETE CASCADE,
    INDEX idx_contribution (contribution_id),
    INDEX idx_destination (destination)
);

-- Bus Timing Records (Final approved data)
CREATE TABLE bus_timing_records (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    bus_id BIGINT,
    from_location_id BIGINT NOT NULL,
    from_location_name VARCHAR(200) NOT NULL,
    to_location_id BIGINT NOT NULL,
    to_location_name VARCHAR(200) NOT NULL,
    departure_time TIME NOT NULL,
    arrival_time TIME,
    timing_type ENUM('MORNING', 'AFTERNOON', 'NIGHT') NOT NULL,
    source ENUM('USER_CONTRIBUTION', 'OFFICIAL', 'OCR_EXTRACTED') DEFAULT 'OCR_EXTRACTED',
    contribution_id BIGINT,
    verified BOOLEAN DEFAULT FALSE,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (from_location_id) REFERENCES locations(id),
    FOREIGN KEY (to_location_id) REFERENCES locations(id),
    FOREIGN KEY (bus_id) REFERENCES buses(id),
    FOREIGN KEY (contribution_id) REFERENCES timing_image_contributions(id),
    UNIQUE KEY unique_timing (from_location_id, to_location_id, departure_time, timing_type),
    INDEX idx_route (from_location_id, to_location_id),
    INDEX idx_departure (departure_time),
    INDEX idx_source (source)
);

-- Skipped Timing Records (Audit trail for duplicates)
CREATE TABLE skipped_timing_records (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    contribution_id BIGINT NOT NULL,
    from_location_id BIGINT NOT NULL,
    from_location_name VARCHAR(200) NOT NULL,
    to_location_id BIGINT NOT NULL,
    to_location_name VARCHAR(200) NOT NULL,
    departure_time TIME,
    timing_type ENUM('MORNING', 'AFTERNOON', 'NIGHT') NOT NULL,
    skip_reason ENUM('DUPLICATE_EXACT', 'DUPLICATE_SIMILAR', 'INVALID_TIME', 'INVALID_LOCATION') NOT NULL,
    existing_record_id BIGINT,
    existing_record_source ENUM('USER_CONTRIBUTION', 'OFFICIAL', 'OCR_EXTRACTED'),
    skipped_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_by VARCHAR(100),
    notes TEXT,
    FOREIGN KEY (contribution_id) REFERENCES timing_image_contributions(id) ON DELETE CASCADE,
    FOREIGN KEY (from_location_id) REFERENCES locations(id),
    FOREIGN KEY (to_location_id) REFERENCES locations(id),
    FOREIGN KEY (existing_record_id) REFERENCES bus_timing_records(id) ON DELETE SET NULL,
    INDEX idx_contribution (contribution_id),
    INDEX idx_route (from_location_id, to_location_id),
    INDEX idx_skip_reason (skip_reason),
    INDEX idx_skipped_at (skipped_at)
);
