-- V2.3__fix_route_contributions_id_column_comprehensive.sql
-- More comprehensive fix for route_contributions table ID column

-- Disable foreign key checks temporarily to allow table modification
SET FOREIGN_KEY_CHECKS=0;

-- First, identify any foreign keys that reference this table (if any)
-- This block lists them but doesn't drop them - you would need to manually add DROP statements
-- for any foreign keys found before altering the table

/*
-- Example of how to drop a foreign key if needed:
ALTER TABLE child_table DROP FOREIGN KEY fk_name;
*/

-- Create a backup of the existing table data (if any)
DROP TABLE IF EXISTS route_contributions_backup;

CREATE TABLE route_contributions_backup AS 
SELECT * FROM route_contributions;

-- Modify the ID column to use TEXT type which can store strings of any length
ALTER TABLE route_contributions MODIFY COLUMN id TEXT NOT NULL;

-- If you encounter issues even after this migration, try recreating the table completely
/*
-- Drop and recreate the table with the TEXT id column
DROP TABLE route_contributions;

CREATE TABLE route_contributions (
    id TEXT NOT NULL,
    user_id VARCHAR(255),
    bus_number VARCHAR(50),
    from_location_name VARCHAR(255),
    to_location_name VARCHAR(255),
    from_latitude DOUBLE,
    from_longitude DOUBLE,
    to_latitude DOUBLE, 
    to_longitude DOUBLE,
    schedule_info TEXT,
    status VARCHAR(50),
    submission_date DATETIME,
    processed_date DATETIME,
    additional_notes TEXT,
    validation_message TEXT,
    PRIMARY KEY (id(255))  -- Create a primary key on first 255 chars of TEXT column
);

-- Restore data from backup
INSERT INTO route_contributions
SELECT * FROM route_contributions_backup;

-- Drop the backup table
-- DROP TABLE route_contributions_backup;
*/

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS=1;

-- Add this migration to history
INSERT INTO migration_history (migration_name, description) 
VALUES ('V2.3__fix_route_contributions_id_column_comprehensive', 'Changed route_contributions.id column to TEXT type for maximum flexibility');