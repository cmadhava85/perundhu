-- Add the specific columns that the application expects
ALTER TABLE route_contributions 
ADD COLUMN fare DECIMAL(10,2) NULL,
ADD COLUMN frequency VARCHAR(100) NULL,
ADD COLUMN operating_hours VARCHAR(200) NULL;

-- Add missing columns that might be expected by the JPA entity
ALTER TABLE route_contributions 
ADD COLUMN stops VARCHAR(2000) NULL,
ADD COLUMN from_location VARCHAR(255) NULL,
ADD COLUMN to_location VARCHAR(255) NULL,
ADD COLUMN rejection_reason VARCHAR(500) NULL;

-- Copy data from existing columns to new ones where applicable
UPDATE route_contributions SET 
    stops = intermediate_stops,
    from_location = from_location_name,
    to_location = to_location_name
WHERE stops IS NULL OR from_location IS NULL OR to_location IS NULL;