-- V6__normalize_location_names.sql
-- Normalize location names by stripping BUS STAND/STATION suffixes
-- This fixes locations created by OCR extraction that included station names

-- Fix MATHAVARAMBUSSTAND -> MATHAVARAM
UPDATE locations 
SET name = 'MATHAVARAM' 
WHERE UPPER(name) = 'MATHAVARAMBUSSTAND' 
   OR UPPER(name) = 'MATHAVARAMBUSSTATION';

-- Fix any other locations with concatenated BUS STAND suffixes
-- (These may have been created without spaces)
UPDATE locations
SET name = REPLACE(REPLACE(UPPER(name), 'BUSSTAND', ''), 'BUSSTATION', '')
WHERE UPPER(name) LIKE '%BUSSTAND'
   OR UPPER(name) LIKE '%BUSSTATION';

-- Fix locations with spaced suffixes
UPDATE locations
SET name = TRIM(REPLACE(REPLACE(REPLACE(REPLACE(UPPER(name), 
    ' BUS STAND', ''), 
    ' BUS STATION', ''),
    ' STAND', ''),
    ' STATION', ''))
WHERE UPPER(name) LIKE '% BUS STAND'
   OR UPPER(name) LIKE '% BUS STATION'
   OR UPPER(name) LIKE '% STAND'
   OR UPPER(name) LIKE '% STATION';
