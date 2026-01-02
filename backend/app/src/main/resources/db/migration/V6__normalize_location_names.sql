-- V6__normalize_location_names.sql
-- Normalize location names by stripping BUS STAND/STATION suffixes
-- This fixes locations created by OCR extraction that included station names

-- Fix MATHAVARAMBUSSTAND -> MATHAVARAM
UPDATE locations 
SET name = 'MATHAVARAM' 
WHERE UPPER(name) IN ('MATHAVARAMBUSSTAND', 'MATHAVARAMBUSSTATION');

-- Fix any other locations with BUS STAND suffixes (with spaces)
UPDATE locations
SET name = TRIM(REGEXP_SUBSTR(name, '^[^ ]+ [^ ]+ [^ ]+'))
WHERE UPPER(name) LIKE '% BUS STAND'
   OR UPPER(name) LIKE '% BUS STATION';

-- Fix locations with concatenated BUSSTAND (no spaces)
UPDATE locations
SET name = REGEXP_REPLACE(UPPER(name), '(BUSSTAND|BUSSTATION)$', '')
WHERE UPPER(name) LIKE '%BUSSTAND'
   OR UPPER(name) LIKE '%BUSSTATION';
