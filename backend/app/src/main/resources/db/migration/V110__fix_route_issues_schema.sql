-- V110: Fix route_issues table schema to match RouteIssue entity
-- Add missing columns for full route issue functionality

-- Add admin and resolution fields (check if column exists handled by Flyway repair)
ALTER TABLE route_issues
    ADD COLUMN admin_notes TEXT COMMENT 'Admin notes on this issue',
    ADD COLUMN resolution TEXT COMMENT 'Resolution details',
    ADD COLUMN priority VARCHAR(20) DEFAULT 'MEDIUM' COMMENT 'Issue priority: LOW, MEDIUM, HIGH, CRITICAL',
    ADD COLUMN report_count INT DEFAULT 1 COMMENT 'Number of times this issue was reported',
    ADD COLUMN reporter_id VARCHAR(255) COMMENT 'ID of the user who reported the issue';

-- Add bus and route details
ALTER TABLE route_issues
    ADD COLUMN bus_name VARCHAR(255) COMMENT 'Name of the bus service',
    ADD COLUMN bus_number VARCHAR(50) COMMENT 'Bus number/route identifier',
    ADD COLUMN from_location VARCHAR(255) COMMENT 'Origin location',
    ADD COLUMN to_location VARCHAR(255) COMMENT 'Destination location';

-- Add timing-related details for timing issues
ALTER TABLE route_issues
    ADD COLUMN suggested_departure_time VARCHAR(10) COMMENT 'User-suggested departure time',
    ADD COLUMN suggested_arrival_time VARCHAR(10) COMMENT 'User-suggested arrival time',
    ADD COLUMN last_traveled_date VARCHAR(20) COMMENT 'Last date user traveled on this route';

-- Update status column to support all enum values
ALTER TABLE route_issues
    MODIFY COLUMN status VARCHAR(20) DEFAULT 'PENDING' 
    COMMENT 'Status: PENDING, UNDER_REVIEW, CONFIRMED, RESOLVED, REJECTED, CANNOT_VERIFY';

-- Create index on priority for filtering high-priority issues
CREATE INDEX idx_route_issues_priority ON route_issues(priority);

-- Create composite index for status and priority queries
CREATE INDEX idx_route_issues_status_priority ON route_issues(status, priority);

-- Create index on reporter_id for user issue tracking
CREATE INDEX idx_route_issues_reporter ON route_issues(reporter_id);
