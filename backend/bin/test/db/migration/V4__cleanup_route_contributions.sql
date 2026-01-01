-- V4__cleanup_route_contributions.sql
-- Remove legacy fields and consolidate route_contributions table

-- Remove legacy fields that are no longer needed
ALTER TABLE route_contributions 
DROP COLUMN IF EXISTS starting_point,
DROP COLUMN IF EXISTS ending_point,
DROP COLUMN IF EXISTS from_location,
DROP COLUMN IF EXISTS to_location,
DROP COLUMN IF EXISTS fare,
DROP COLUMN IF EXISTS frequency,
DROP COLUMN IF EXISTS operating_hours,
DROP COLUMN IF EXISTS stops,
DROP COLUMN IF EXISTS rejection_reason;

-- Ensure the table has the correct structure
-- Add missing columns if they don't exist
ALTER TABLE route_contributions 
ADD COLUMN IF NOT EXISTS bus_name VARCHAR(255) NULL,
ADD COLUMN IF NOT EXISTS departure_time VARCHAR(50) NULL,
ADD COLUMN IF NOT EXISTS arrival_time VARCHAR(50) NULL,
ADD COLUMN IF NOT EXISTS submitted_by VARCHAR(255) NULL;

-- Ensure proper constraints
ALTER TABLE route_contributions 
MODIFY COLUMN from_location_name VARCHAR(255) NOT NULL,
MODIFY COLUMN to_location_name VARCHAR(255) NOT NULL,
MODIFY COLUMN user_id VARCHAR(255) NOT NULL,
MODIFY COLUMN bus_number VARCHAR(50) NOT NULL,
MODIFY COLUMN status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
MODIFY COLUMN submission_date TIMESTAMP NOT NULL;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_route_contributions_status ON route_contributions(status);
CREATE INDEX IF NOT EXISTS idx_route_contributions_user_id ON route_contributions(user_id);
CREATE INDEX IF NOT EXISTS idx_route_contributions_submission_date ON route_contributions(submission_date);

-- Record migration completion
INSERT INTO migration_history (migration_name, description, success) 
VALUES ('V4__cleanup_route_contributions', 'Removed legacy fields and consolidated route_contributions table', TRUE);