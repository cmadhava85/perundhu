-- V6__add_missing_route_contribution_columns.sql
-- Create indexes for better performance on existing route contribution columns

-- Create indexes for better performance on timing queries
-- Using MySQL compatible syntax without IF NOT EXISTS
CREATE INDEX idx_route_contributions_departure_time ON route_contributions(departure_time);
CREATE INDEX idx_route_contributions_arrival_time ON route_contributions(arrival_time);
CREATE INDEX idx_route_contributions_bus_name ON route_contributions(bus_name);
CREATE INDEX idx_route_contributions_from_location ON route_contributions(from_location_name);
CREATE INDEX idx_route_contributions_to_location ON route_contributions(to_location_name);

-- Record this migration
INSERT IGNORE INTO migration_history (migration_name, description, success) 
VALUES ('V6__add_missing_route_contribution_columns', 'Added performance indexes to existing route_contributions table columns', TRUE);