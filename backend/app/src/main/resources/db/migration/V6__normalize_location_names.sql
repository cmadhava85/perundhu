-- V6__normalize_location_names.sql
-- Normalize location names by stripping BUS STAND/STATION suffixes
-- This fixes locations created by OCR extraction that included station names

-- Fix MATHAVARAMBUSSTAND -> MATHAVARAM
UPDATE locations 
SET name = 'MATHAVARAM' 
WHERE UPPER(name) IN ('MATHAVARAMBUSSTAND', 'MATHAVARAMBUSSTATION');

-- Fix locations with spaced suffixes (e.g., "CITY BUS STAND" -> "CITY")
-- This handles "CITY BUS STAND", "CITY BUS STATION", "CITY STAND", "CITY STATION"
UPDATE locations
SET name = TRIM(SUBSTR(name, 1, INSTR(name, ' ') - 1))
WHERE (UPPER(name) LIKE '% BUS STAND' OR UPPER(name) LIKE '% BUS STATION'
   OR UPPER(name) LIKE '% STAND' OR UPPER(name) LIKE '% STATION')
  AND INSTR(name, ' ') > 0;

-- Fix locations with concatenated BUSSTAND (no spaces)
-- Use a simpler approach: remove the suffix
UPDATE locations
SET name = CASE 
    WHEN UPPER(name) LIKE '%BUSSTAND' THEN SUBSTR(name, 1, LENGTH(name) - 8)
    WHEN UPPER(name) LIKE '%BUSSTATION' THEN SUBSTR(name, 1, LENGTH(name) - 10)
    ELSE name
END
WHERE UPPER(name) LIKE '%BUSSTAND'
   OR UPPER(name) LIKE '%BUSSTATION';
