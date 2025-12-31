-- Add source_image_id and route_group_id columns to route_contributions table
-- These fields help track OCR-extracted schedules and group related entries

-- Add source_image_id column to track which image contribution created this route
ALTER TABLE route_contributions ADD COLUMN IF NOT EXISTS source_image_id VARCHAR(255);

-- Add route_group_id column to group related schedules (same route, different times)
ALTER TABLE route_contributions ADD COLUMN IF NOT EXISTS route_group_id VARCHAR(255);

-- Add indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_route_contributions_source_image_id ON route_contributions(source_image_id);
CREATE INDEX IF NOT EXISTS idx_route_contributions_route_group_id ON route_contributions(route_group_id);

-- Comment on columns
COMMENT ON COLUMN route_contributions.source_image_id IS 'ID of the image contribution this route was extracted from';
COMMENT ON COLUMN route_contributions.route_group_id IS 'Groups related schedules together (e.g., FROM-TO-VIA)';
