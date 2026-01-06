-- V55: Comprehensive Schema Audit and Fixes
-- Purpose: Ensure all database table column types align with JPA entities
-- This migration checks and fixes potential type misalignments across all tables

-- =====================
-- BUSES TABLE
-- =====================
-- Check: id should be BIGINT AUTO_INCREMENT (per BusJpaEntity)
-- Current: CHECK via entity - @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
-- Status: OK (BIGINT AUTO_INCREMENT in V1)

-- =====================
-- LOCATIONS TABLE  
-- =====================
-- Check: id should be BIGINT AUTO_INCREMENT (per LocationJpaEntity)
-- Status: OK (BIGINT AUTO_INCREMENT in V1)

-- =====================
-- STOPS TABLE
-- =====================
-- Check: id should be BIGINT AUTO_INCREMENT (per StopJpaEntity)
-- Status: OK (BIGINT AUTO_INCREMENT in V1)

-- =====================
-- REVIEWS TABLE
-- =====================
-- Check: id should be BIGINT AUTO_INCREMENT, user_id VARCHAR(255), status VARCHAR(20)
ALTER TABLE reviews 
MODIFY COLUMN id BIGINT AUTO_INCREMENT,
MODIFY COLUMN user_id VARCHAR(255),
MODIFY COLUMN status VARCHAR(20) DEFAULT 'PENDING';

-- =====================
-- IMAGE_CONTRIBUTIONS TABLE - CRITICAL FIX
-- =====================
-- Issue: id is INT AUTO_INCREMENT but entity declares String type (UUID)
-- This is already handled by V54__fix_image_contributions_id_type.sql

-- =====================
-- ROUTE_CONTRIBUTIONS TABLE
-- =====================
-- Check: id should be VARCHAR(50+) for UUID strings (36 chars needed)
-- Status: OK (id VARCHAR(50) in V1, entity declares String)
-- Additional: Ensure all added columns have correct types
ALTER TABLE route_contributions 
MODIFY COLUMN id VARCHAR(50) NOT NULL PRIMARY KEY,
MODIFY COLUMN user_id VARCHAR(50),
MODIFY COLUMN bus_name VARCHAR(255),
MODIFY COLUMN from_location_name VARCHAR(255),
MODIFY COLUMN to_location_name VARCHAR(255),
MODIFY COLUMN departure_time VARCHAR(50),
MODIFY COLUMN arrival_time VARCHAR(50),
MODIFY COLUMN schedule_info TEXT,
MODIFY COLUMN processed_date DATETIME,
MODIFY COLUMN validation_message TEXT,
MODIFY COLUMN source_bus_id BIGINT,
MODIFY COLUMN contribution_type VARCHAR(50),
MODIFY COLUMN from_latitude DECIMAL(10, 8),
MODIFY COLUMN from_longitude DECIMAL(11, 8),
MODIFY COLUMN to_latitude DECIMAL(10, 8),
MODIFY COLUMN to_longitude DECIMAL(11, 8);

-- =====================
-- ANNOUNCEMENTS TABLE
-- =====================
-- Check: id BIGINT AUTO_INCREMENT, type VARCHAR(50), unique_id VARCHAR(100)
ALTER TABLE announcements 
MODIFY COLUMN id BIGINT AUTO_INCREMENT,
MODIFY COLUMN type VARCHAR(50),
MODIFY COLUMN unique_id VARCHAR(100) NOT NULL UNIQUE,
MODIFY COLUMN title_key VARCHAR(255) NOT NULL,
MODIFY COLUMN is_active BOOLEAN DEFAULT TRUE,
MODIFY COLUMN priority INT DEFAULT 5,
MODIFY COLUMN target_users VARCHAR(50);

-- =====================
-- TRANSLATIONS TABLE
-- =====================
-- Check: id BIGINT AUTO_INCREMENT, entity_type VARCHAR(50), language_code VARCHAR(10)
ALTER TABLE translations 
MODIFY COLUMN id BIGINT AUTO_INCREMENT,
MODIFY COLUMN entity_type VARCHAR(50) NOT NULL,
MODIFY COLUMN entity_id BIGINT NOT NULL,
MODIFY COLUMN language_code VARCHAR(10) NOT NULL,
MODIFY COLUMN field_name VARCHAR(255) NOT NULL,
MODIFY COLUMN translated_value TEXT;

-- =====================
-- USER_FEEDBACK TABLE
-- =====================
-- Check: id BIGINT AUTO_INCREMENT, user_id VARCHAR(255), feedback_type VARCHAR(50)
ALTER TABLE user_feedback 
MODIFY COLUMN id BIGINT AUTO_INCREMENT,
MODIFY COLUMN user_id VARCHAR(255),
MODIFY COLUMN feedback_type VARCHAR(50),
MODIFY COLUMN message TEXT,
MODIFY COLUMN rating INT,
MODIFY COLUMN status VARCHAR(20) DEFAULT 'PENDING';

-- =====================
-- ROUTE_ISSUES TABLE
-- =====================
-- Check: id BIGINT AUTO_INCREMENT, bus_id BIGINT (foreign key), issue_type VARCHAR(100)
ALTER TABLE route_issues 
MODIFY COLUMN id BIGINT AUTO_INCREMENT,
MODIFY COLUMN bus_id BIGINT,
MODIFY COLUMN issue_type VARCHAR(100),
MODIFY COLUMN description TEXT,
MODIFY COLUMN status VARCHAR(20) DEFAULT 'OPEN',
MODIFY COLUMN reported_by VARCHAR(100),
MODIFY COLUMN resolved_at TIMESTAMP NULL;

-- =====================
-- USER_TRACKING_SESSIONS TABLE
-- =====================
-- Check: id BIGINT AUTO_INCREMENT (per UserTrackingSessionEntity using GenerationType.IDENTITY)
-- Status: OK in V35 (BIGINT AUTO_INCREMENT)
ALTER TABLE user_tracking_sessions 
MODIFY COLUMN user_id VARCHAR(50),
MODIFY COLUMN ip_address VARCHAR(50),
MODIFY COLUMN user_agent VARCHAR(500),
MODIFY COLUMN start_time DATETIME,
MODIFY COLUMN end_time DATETIME;

-- =====================
-- TIMING_IMAGE_CONTRIBUTIONS TABLE
-- =====================
-- Check: id BIGINT AUTO_INCREMENT (per TimingImageContributionEntity using GenerationType.IDENTITY)
-- Status: OK in V35 (BIGINT AUTO_INCREMENT)
ALTER TABLE timing_image_contributions 
MODIFY COLUMN user_id VARCHAR(50),
MODIFY COLUMN image_url VARCHAR(500) NOT NULL,
MODIFY COLUMN thumbnail_url VARCHAR(500),
MODIFY COLUMN origin_location VARCHAR(200) NOT NULL,
MODIFY COLUMN origin_location_tamil VARCHAR(200),
MODIFY COLUMN origin_latitude DECIMAL(10, 8),
MODIFY COLUMN origin_longitude DECIMAL(11, 8),
MODIFY COLUMN board_type VARCHAR(50),
MODIFY COLUMN description TEXT,
MODIFY COLUMN submission_date DATETIME NOT NULL,
MODIFY COLUMN status VARCHAR(50),
MODIFY COLUMN validation_message TEXT,
MODIFY COLUMN processed_date DATETIME,
MODIFY COLUMN processed_by VARCHAR(100),
ADD COLUMN IF NOT EXISTS submitted_by VARCHAR(100),
ADD COLUMN IF NOT EXISTS ocr_confidence DECIMAL(3, 2),
ADD COLUMN IF NOT EXISTS requires_manual_review BOOLEAN;

-- =====================
-- EXTRACTED_BUS_TIMINGS TABLE
-- =====================
-- Check: id BIGINT AUTO_INCREMENT, bus_number VARCHAR(50)
ALTER TABLE extracted_bus_timings 
MODIFY COLUMN id BIGINT AUTO_INCREMENT,
MODIFY COLUMN bus_number VARCHAR(50),
MODIFY COLUMN from_location VARCHAR(255),
MODIFY COLUMN to_location VARCHAR(255),
MODIFY COLUMN departure_time VARCHAR(50),
MODIFY COLUMN arrival_time VARCHAR(50),
MODIFY COLUMN status VARCHAR(50);

-- =====================
-- SKIPPED_TIMING_RECORDS TABLE
-- =====================
-- Check: id BIGINT AUTO_INCREMENT, reason VARCHAR(255)
ALTER TABLE skipped_timing_records 
MODIFY COLUMN id BIGINT AUTO_INCREMENT,
MODIFY COLUMN timing_text TEXT,
MODIFY COLUMN reason VARCHAR(255),
MODIFY COLUMN skipped_at DATETIME,
MODIFY COLUMN context_data JSON;

-- =====================
-- BUS_TIMING_RECORDS TABLE
-- =====================
-- Check: id BIGINT AUTO_INCREMENT, bus_id BIGINT, record_date DATE
ALTER TABLE bus_timing_records 
MODIFY COLUMN id BIGINT AUTO_INCREMENT,
MODIFY COLUMN bus_id BIGINT,
MODIFY COLUMN record_date DATE,
MODIFY COLUMN timing_text TEXT,
MODIFY COLUMN extracted_at DATETIME;

-- =====================
-- SYSTEM_SETTINGS TABLE
-- =====================
-- Check: setting_key VARCHAR(100) PRIMARY KEY, setting_value TEXT
ALTER TABLE system_settings 
MODIFY COLUMN setting_key VARCHAR(100) PRIMARY KEY,
MODIFY COLUMN setting_value TEXT,
MODIFY COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- Add message to confirm migration ran successfully
SELECT 'Schema audit and fixes completed' as migration_status;
