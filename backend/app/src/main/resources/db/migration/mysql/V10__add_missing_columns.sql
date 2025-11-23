-- V10__add_missing_columns.sql
-- Comprehensive migration to add all missing columns across tables

-- ====================================
-- 1. Add missing columns to buses table
-- ====================================

-- Add active column
ALTER TABLE buses 
ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT TRUE COMMENT 'Whether the bus route is currently active';

-- Add capacity column
ALTER TABLE buses 
ADD COLUMN IF NOT EXISTS capacity INT DEFAULT 50 COMMENT 'Passenger capacity of the bus';

-- Add category column
ALTER TABLE buses 
ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'Unknown' COMMENT 'Bus category/type';

-- Add timestamps if not already added in V6
ALTER TABLE buses 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE buses 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- Add index on active buses for faster queries
CREATE INDEX IF NOT EXISTS idx_buses_active ON buses(active);

-- ====================================
-- 2. Restructure route_contributions table
-- ====================================

-- Drop and recreate route_contributions to match RouteContributionJpaEntity
DROP TABLE IF EXISTS route_contributions;

CREATE TABLE route_contributions (
    id VARCHAR(36) PRIMARY KEY COMMENT 'UUID for the contribution',
    user_id VARCHAR(255) NOT NULL COMMENT 'User who submitted the contribution',
    bus_number VARCHAR(50) NOT NULL COMMENT 'Bus number',
    bus_name VARCHAR(255) COMMENT 'Bus name',
    from_location_name VARCHAR(255) NOT NULL COMMENT 'Origin location name',
    to_location_name VARCHAR(255) NOT NULL COMMENT 'Destination location name',
    from_latitude DOUBLE COMMENT 'Origin latitude',
    from_longitude DOUBLE COMMENT 'Origin longitude',
    to_latitude DOUBLE COMMENT 'Destination latitude',
    to_longitude DOUBLE COMMENT 'Destination longitude',
    departure_time VARCHAR(20) COMMENT 'Departure time as string',
    arrival_time VARCHAR(20) COMMENT 'Arrival time as string',
    schedule_info TEXT COMMENT 'Schedule information',
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' COMMENT 'Contribution status',
    submission_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'When the contribution was submitted',
    processed_date TIMESTAMP NULL COMMENT 'When the contribution was processed',
    additional_notes TEXT COMMENT 'Additional notes from contributor',
    validation_message TEXT COMMENT 'Validation or rejection message',
    submitted_by VARCHAR(255) COMMENT 'Name of the submitter',
    INDEX idx_route_contributions_user (user_id),
    INDEX idx_route_contributions_status (status),
    INDEX idx_route_contributions_bus_number (bus_number),
    INDEX idx_route_contributions_submission_date (submission_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================
-- 3. Restructure image_contributions table
-- ====================================

-- Drop and recreate image_contributions to match ImageContributionJpaEntity
DROP TABLE IF EXISTS image_contributions;

CREATE TABLE image_contributions (
    id VARCHAR(36) PRIMARY KEY COMMENT 'UUID for the image contribution',
    user_id VARCHAR(50) NOT NULL COMMENT 'User who submitted the image',
    description VARCHAR(1000) COMMENT 'Description of the image',
    location VARCHAR(100) COMMENT 'Location name',
    route_name VARCHAR(100) COMMENT 'Route name',
    image_url VARCHAR(1000) NOT NULL COMMENT 'URL of the uploaded image',
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' COMMENT 'Processing status',
    submission_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'When submitted',
    processed_date TIMESTAMP NULL COMMENT 'When processed',
    additional_notes VARCHAR(1000) COMMENT 'Additional notes',
    validation_message TEXT COMMENT 'Validation or rejection message',
    extracted_data TEXT COMMENT 'Data extracted from the image',
    INDEX idx_image_contributions_user (user_id),
    INDEX idx_image_contributions_status (status),
    INDEX idx_image_contributions_submission_date (submission_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================
-- 4. Update user_tracking_sessions column names
-- ====================================

-- Ensure column names match entity expectations
-- Note: These columns should already exist from V9, but we ensure naming consistency

-- Check if columns need to be renamed
SET @column_exists = (
  SELECT COUNT(*) 
  FROM information_schema.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'user_tracking_sessions' 
    AND COLUMN_NAME = 'session_id'
);

-- The table structure from V9 already matches, no changes needed

-- ====================================
-- 5. Verify schema alignment
-- ====================================

SELECT 
  'Schema alignment migration V10 completed successfully' AS status,
  (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'buses' AND COLUMN_NAME = 'active') AS buses_active_added,
  (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'buses' AND COLUMN_NAME = 'capacity') AS buses_capacity_added,
  (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'buses' AND COLUMN_NAME = 'category') AS buses_category_added,
  (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'route_contributions') AS route_contributions_exists,
  (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'image_contributions') AS image_contributions_exists;
