-- Add source_bus_id and contribution_type columns to route_contributions
-- These columns help track stop contributions that are being added to existing routes

ALTER TABLE route_contributions 
ADD COLUMN source_bus_id BIGINT NULL COMMENT 'ID of the existing bus this stop contribution is for';

ALTER TABLE route_contributions 
ADD COLUMN contribution_type VARCHAR(50) NULL COMMENT 'Type of contribution: NEW_ROUTE or ADD_STOPS';

-- Add index for filtering by contribution type
CREATE INDEX idx_route_contributions_type ON route_contributions(contribution_type);

-- Add index for filtering by source bus ID
CREATE INDEX idx_route_contributions_source_bus ON route_contributions(source_bus_id);
