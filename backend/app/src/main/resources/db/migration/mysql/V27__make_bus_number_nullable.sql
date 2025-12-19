-- V27: Make bus_number column nullable in route_contributions table
-- Reason: Bus number is optional for paste contributions where users share
-- bus schedule information from social media that doesn't always include bus numbers.

-- This migration makes bus_number optional to support paste contributions
-- that may not have bus number information available.

ALTER TABLE route_contributions 
    MODIFY COLUMN bus_number VARCHAR(255) NULL;
