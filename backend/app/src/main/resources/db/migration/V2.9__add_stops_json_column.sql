-- V2.9: Add stops_json column to route_contributions table
-- This column stores intermediate stops (VIA cities) as JSON
-- Format: [{"name":"STOP1","stopOrder":1},{"name":"STOP2","stopOrder":2}]

-- Add stops_json column if it doesn't exist
ALTER TABLE route_contributions ADD COLUMN stops_json TEXT;

-- Column description (for documentation):
-- stops_json: JSON array of intermediate stops extracted from OCR VIA column
-- Format: [{"name":"STOP1","stopOrder":1},{"name":"STOP2","stopOrder":2}]
