-- MODIFIED: Keep consistent 'stops' table naming
-- Original file renamed stops to stop, but we've standardized on 'stops'
-- This script now ensures we're using 'stops' (plural) consistently

-- Check if 'stop' (singular) table exists
SET @stop_singular_exists = (SELECT COUNT(*)
    FROM information_schema.tables
    WHERE table_schema = DATABASE()
    AND table_name = 'stop');

-- If 'stop' exists, rename it to 'stops' to ensure consistency
SET @rename_statement = IF(@stop_singular_exists > 0,
    'RENAME TABLE stop TO stops',
    'SELECT "stops table already correctly named" AS message');

PREPARE stmt FROM @rename_statement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add a comment to migration history table if it exists
SET @history_exists = (SELECT COUNT(*)
    FROM information_schema.tables
    WHERE table_schema = DATABASE()
    AND table_name = 'flyway_schema_history');

SET @history_update = IF(@history_exists > 0,
    'INSERT INTO flyway_schema_history_comments (version, description, comment)
     VALUES ("1.6", "rename_stops_table", "Modified to standardize on stops (plural) table name")
     ON DUPLICATE KEY UPDATE comment = "Modified to standardize on stops (plural) table name"',
    'SELECT "No history table to update" AS message');

-- The above statement will execute only if you have a comments table for migrations
-- If you don't, this is just documentation of the change

