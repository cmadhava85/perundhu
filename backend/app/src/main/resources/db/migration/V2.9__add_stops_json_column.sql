-- V2.9: Add stops_json column to route_contributions table
-- This column stores intermediate stops (VIA cities) as JSON
-- Format: [{"name":"STOP1","stopOrder":1},{"name":"STOP2","stopOrder":2}]

-- Add stops_json column if it doesn't exist
ALTER TABLE route_contributions ADD COLUMN IF NOT EXISTS stops_json TEXT;

-- Add comment describing the column
COMMENT ON COLUMN route_contributions.stops_json IS 'JSON array of intermediate stops extracted from OCR VIA column';
