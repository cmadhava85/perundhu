-- V2.2__increase_route_contributions_id_size.sql
-- Increase the size of ID column in route_contributions from VARCHAR(36) to VARCHAR(50)

-- Disable foreign key checks temporarily to allow table modification
SET FOREIGN_KEY_CHECKS=0;

-- Modify the id column in route_contributions table to use a larger VARCHAR size
ALTER TABLE route_contributions MODIFY COLUMN id VARCHAR(50) NOT NULL;

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS=1;

-- Add this migration to history
INSERT INTO migration_history (migration_name, description) 
VALUES ('V2.2__increase_route_contributions_id_size', 'Increased route_contributions.id column size from VARCHAR(36) to VARCHAR(50)');