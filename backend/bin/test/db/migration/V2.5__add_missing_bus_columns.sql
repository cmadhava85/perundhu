-- V2.5__add_missing_bus_columns.sql
-- Add missing columns to buses table to match BusJpaEntity

-- Add capacity column
ALTER TABLE buses ADD COLUMN capacity INTEGER DEFAULT 50;

-- Add category column
ALTER TABLE buses ADD COLUMN category VARCHAR(50) DEFAULT 'Regular';

-- Add active column (this is the one causing the 500 error)
ALTER TABLE buses ADD COLUMN active BOOLEAN DEFAULT TRUE;

-- Update existing records to have reasonable defaults
UPDATE buses SET 
    capacity = 50,
    category = 'Regular',
    active = TRUE
WHERE capacity IS NULL OR category IS NULL OR active IS NULL;

-- Add record to migration history
INSERT INTO migration_history (migration_name, description) 
VALUES ('V2.5__add_missing_bus_columns', 'Added missing capacity, category, and active columns to buses table to match BusJpaEntity');