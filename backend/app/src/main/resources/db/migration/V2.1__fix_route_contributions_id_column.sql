-- V2.1__fix_route_contributions_id_column.sql
-- Change the ID column in route_contributions from INTEGER to VARCHAR to support UUID strings

-- Disable foreign key checks temporarily to allow table modification
SET FOREIGN_KEY_CHECKS=0;

-- Modify the id column in route_contributions table to VARCHAR(50) to support UUID strings
ALTER TABLE route_contributions MODIFY COLUMN id VARCHAR(50) NOT NULL;

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS=1;

-- Add this migration to history
INSERT INTO migration_history (migration_name, description) 
VALUES ('V2.1__fix_route_contributions_id_column', 'Changed route_contributions.id column from INTEGER to VARCHAR(50) to support UUID strings');