-- Add source_image_id and route_group_id columns to route_contributions table
-- These fields help track OCR-extracted schedules and group related entries

-- Add source_image_id column to track which image contribution created this route
ALTER TABLE route_contributions ADD COLUMN source_image_id VARCHAR(255) NULL;

-- Add route_group_id column to group related schedules (same route, different times)
ALTER TABLE route_contributions ADD COLUMN route_group_id VARCHAR(255) NULL;

-- Add indexes for efficient querying
CREATE INDEX idx_route_contributions_source_image_id ON route_contributions(source_image_id);
CREATE INDEX idx_route_contributions_route_group_id ON route_contributions(route_group_id);
