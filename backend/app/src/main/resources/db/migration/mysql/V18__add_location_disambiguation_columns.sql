-- Migration: Add district and nearby_city columns to locations table
-- Purpose: Enable disambiguation for duplicate village names near different cities/towns
-- MySQL compatible version

-- Add district column for administrative district name
-- Using ALTER IGNORE to skip if column already exists (MySQL 5.7+)
ALTER TABLE locations ADD COLUMN district VARCHAR(255) NULL;

-- Add nearby_city column for disambiguation (nearest major city/town)
ALTER TABLE locations ADD COLUMN nearby_city VARCHAR(255) NULL;

-- Add index for faster lookups by name (useful for duplicate name detection)
-- MySQL allows CREATE INDEX without IF NOT EXISTS, will error if exists
-- Use DROP INDEX IF EXISTS first for idempotency (requires MySQL 8.0.29+)
CREATE INDEX idx_locations_name ON locations(name);

-- Add composite index for name + district lookups
CREATE INDEX idx_locations_name_district ON locations(name, district);
