-- Migration: Add district and nearby_city columns to locations table
-- Purpose: Enable disambiguation for duplicate village names near different cities/towns
-- 
-- Example: If there are two villages named "Kovilpatti":
-- 1. Kovilpatti (Thoothukudi District, near Thoothukudi city)
-- 2. Kovilpatti (Virudhunagar District, near Aruppukottai town)
--
-- The frontend will show: "Kovilpatti (near Thoothukudi)" vs "Kovilpatti (near Aruppukottai)"

-- Add district column for administrative district name (MySQL compatible)
-- MySQL 8.0+ supports IF NOT EXISTS, for older versions use stored procedure
ALTER TABLE locations ADD COLUMN district VARCHAR(255) NULL;

-- Add nearby_city column for disambiguation (nearest major city/town)
ALTER TABLE locations ADD COLUMN nearby_city VARCHAR(255) NULL;

-- Add index for faster lookups by name (useful for duplicate name detection)
-- Drop first if exists to avoid errors on re-run
CREATE INDEX idx_locations_name ON locations(name);

-- Add composite index for name + district lookups
CREATE INDEX idx_locations_name_district ON locations(name, district);
