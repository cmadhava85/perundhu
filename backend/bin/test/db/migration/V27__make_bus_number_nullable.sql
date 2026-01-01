-- V27: Make bus_number column nullable in route_contributions table
-- Reason: Bus number is optional for paste contributions where users share
-- bus schedule information from social media that doesn't always include bus numbers.

-- Check if the column exists and is NOT NULL before altering
-- This migration makes bus_number optional to support paste contributions
-- that may not have bus number information available.

ALTER TABLE route_contributions 
    MODIFY COLUMN bus_number VARCHAR(255) NULL;

-- Add a comment explaining the business reason
-- ALTER TABLE route_contributions MODIFY COLUMN bus_number VARCHAR(255) NULL 
-- COMMENT 'Optional - not always available in paste contributions from social media';
