-- V22__create_route_issues_table.sql
-- Table for storing user-reported issues with bus routes/timings

CREATE TABLE IF NOT EXISTS route_issues (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    bus_id BIGINT NULL,
    bus_name VARCHAR(255) NULL,
    bus_number VARCHAR(100) NULL,
    from_location VARCHAR(255) NULL,
    to_location VARCHAR(255) NULL,
    issue_type VARCHAR(50) NOT NULL,
    description TEXT NULL,
    suggested_departure_time VARCHAR(20) NULL,
    suggested_arrival_time VARCHAR(20) NULL,
    last_traveled_date VARCHAR(50) NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    priority VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
    report_count INT NOT NULL DEFAULT 1,
    reporter_id VARCHAR(255) NULL,
    admin_notes TEXT NULL,
    resolution VARCHAR(500) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL,
    resolved_at TIMESTAMP NULL,
    
    INDEX idx_route_issues_status (status),
    INDEX idx_route_issues_bus_id (bus_id),
    INDEX idx_route_issues_issue_type (issue_type),
    INDEX idx_route_issues_priority (priority),
    INDEX idx_route_issues_reporter (reporter_id),
    INDEX idx_route_issues_created (created_at),
    INDEX idx_route_issues_from_to (from_location, to_location)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add comments for documentation
ALTER TABLE route_issues COMMENT = 'Stores user-reported issues with bus routes, timings, and schedules';
