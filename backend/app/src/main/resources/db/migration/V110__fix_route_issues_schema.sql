-- V110: Fix route_issues table schema to match RouteIssue entity
-- Add missing columns for full route issue functionality

-- Add admin and resolution fields using conditional logic
SET @sql = IF((SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='route_issues' AND column_name='admin_notes') = 0,
    'ALTER TABLE route_issues ADD COLUMN admin_notes TEXT COMMENT ''Admin notes on this issue''',
    'SELECT ''Column admin_notes already exists'' AS skip_message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = IF((SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='route_issues' AND column_name='resolution') = 0,
    'ALTER TABLE route_issues ADD COLUMN resolution TEXT COMMENT ''Resolution details''',
    'SELECT ''Column resolution already exists'' AS skip_message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = IF((SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='route_issues' AND column_name='priority') = 0,
    'ALTER TABLE route_issues ADD COLUMN priority VARCHAR(20) DEFAULT ''MEDIUM'' COMMENT ''Issue priority: LOW, MEDIUM, HIGH, CRITICAL''',
    'SELECT ''Column priority already exists'' AS skip_message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = IF((SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='route_issues' AND column_name='report_count') = 0,
    'ALTER TABLE route_issues ADD COLUMN report_count INT DEFAULT 1 COMMENT ''Number of times this issue was reported''',
    'SELECT ''Column report_count already exists'' AS skip_message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = IF((SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='route_issues' AND column_name='reporter_id') = 0,
    'ALTER TABLE route_issues ADD COLUMN reporter_id VARCHAR(255) COMMENT ''ID of the user who reported the issue''',
    'SELECT ''Column reporter_id already exists'' AS skip_message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add bus and route details
SET @sql = IF((SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='route_issues' AND column_name='bus_name') = 0,
    'ALTER TABLE route_issues ADD COLUMN bus_name VARCHAR(255) COMMENT ''Name of the bus service''',
    'SELECT ''Column bus_name already exists'' AS skip_message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = IF((SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='route_issues' AND column_name='bus_number') = 0,
    'ALTER TABLE route_issues ADD COLUMN bus_number VARCHAR(50) COMMENT ''Bus number/route identifier''',
    'SELECT ''Column bus_number already exists'' AS skip_message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = IF((SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='route_issues' AND column_name='from_location') = 0,
    'ALTER TABLE route_issues ADD COLUMN from_location VARCHAR(255) COMMENT ''Origin location''',
    'SELECT ''Column from_location already exists'' AS skip_message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = IF((SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='route_issues' AND column_name='to_location') = 0,
    'ALTER TABLE route_issues ADD COLUMN to_location VARCHAR(255) COMMENT ''Destination location''',
    'SELECT ''Column to_location already exists'' AS skip_message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add timing-related details for timing issues
SET @sql = IF((SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='route_issues' AND column_name='suggested_departure_time') = 0,
    'ALTER TABLE route_issues ADD COLUMN suggested_departure_time VARCHAR(10) COMMENT ''User-suggested departure time''',
    'SELECT ''Column suggested_departure_time already exists'' AS skip_message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = IF((SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='route_issues' AND column_name='suggested_arrival_time') = 0,
    'ALTER TABLE route_issues ADD COLUMN suggested_arrival_time VARCHAR(10) COMMENT ''User-suggested arrival time''',
    'SELECT ''Column suggested_arrival_time already exists'' AS skip_message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = IF((SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='route_issues' AND column_name='last_traveled_date') = 0,
    'ALTER TABLE route_issues ADD COLUMN last_traveled_date VARCHAR(20) COMMENT ''Last date user traveled on this route''',
    'SELECT ''Column last_traveled_date already exists'' AS skip_message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Update status column to support all enum values (safe to run multiple times)
ALTER TABLE route_issues
    MODIFY COLUMN status VARCHAR(20) DEFAULT 'PENDING' 
    COMMENT 'Status: PENDING, UNDER_REVIEW, CONFIRMED, RESOLVED, REJECTED, CANNOT_VERIFY';

-- Create indexes if they don't exist
SET @sql = IF((SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema=DATABASE() AND table_name='route_issues' AND index_name='idx_route_issues_priority') = 0,
    'CREATE INDEX idx_route_issues_priority ON route_issues(priority)',
    'SELECT ''Index idx_route_issues_priority already exists'' AS skip_message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = IF((SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema=DATABASE() AND table_name='route_issues' AND index_name='idx_route_issues_status_priority') = 0,
    'CREATE INDEX idx_route_issues_status_priority ON route_issues(status, priority)',
    'SELECT ''Index idx_route_issues_status_priority already exists'' AS skip_message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = IF((SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema=DATABASE() AND table_name='route_issues' AND index_name='idx_route_issues_reporter') = 0,
    'CREATE INDEX idx_route_issues_reporter ON route_issues(reporter_id)',
    'SELECT ''Index idx_route_issues_reporter already exists'' AS skip_message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
