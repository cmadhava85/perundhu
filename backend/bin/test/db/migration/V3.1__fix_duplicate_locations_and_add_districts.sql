-- Migration: Fix duplicate locations and add district info
-- Compatible with MySQL 5.7+ and PostgreSQL
-- 
-- Issue: IDs 11, 12, 13, 15 are duplicates of IDs 3, 2, 4, 5 respectively
-- (same name, same coordinates - these are data entry errors, not villages with same names)
--
-- Solution:
-- 1. Update any stops/buses referencing duplicate IDs to use the original IDs
-- 2. Delete the duplicate location records
-- 3. Add district info to major cities for future reference

-- First, update any stops that might reference the duplicate locations
-- Using standard SQL UPDATE syntax (works in both MySQL and PostgreSQL)
UPDATE stops SET location_id = 3 WHERE location_id = 11;
UPDATE stops SET location_id = 2 WHERE location_id = 12;
UPDATE stops SET location_id = 4 WHERE location_id = 13;
UPDATE stops SET location_id = 5 WHERE location_id = 15;

-- Update any buses that might reference the duplicate locations (from_location_id)
UPDATE buses SET from_location_id = 3 WHERE from_location_id = 11;
UPDATE buses SET from_location_id = 2 WHERE from_location_id = 12;
UPDATE buses SET from_location_id = 4 WHERE from_location_id = 13;
UPDATE buses SET from_location_id = 5 WHERE from_location_id = 15;

-- Update any buses that might reference the duplicate locations (to_location_id)
UPDATE buses SET to_location_id = 3 WHERE to_location_id = 11;
UPDATE buses SET to_location_id = 2 WHERE to_location_id = 12;
UPDATE buses SET to_location_id = 4 WHERE to_location_id = 13;
UPDATE buses SET to_location_id = 5 WHERE to_location_id = 15;

-- Now safe to delete the duplicate locations
DELETE FROM locations WHERE id IN (11, 12, 13, 15);

-- Add district information to major cities
-- These are major cities, so they don't need nearby_city disambiguation
UPDATE locations SET district = 'Chennai District' WHERE id = 1 AND name = 'Chennai';
UPDATE locations SET district = 'Coimbatore District' WHERE id = 2 AND name = 'Coimbatore';
UPDATE locations SET district = 'Madurai District' WHERE id = 3 AND name = 'Madurai';
UPDATE locations SET district = 'Tiruchirappalli District' WHERE id = 4 AND name = 'Trichy';
UPDATE locations SET district = 'Salem District' WHERE id = 5 AND name = 'Salem';
UPDATE locations SET district = 'Tirunelveli District' WHERE id = 6 AND name = 'Tirunelveli';
UPDATE locations SET district = 'Kanyakumari District' WHERE id = 7 AND name = 'Kanyakumari';
UPDATE locations SET district = 'Vellore District' WHERE id = 8 AND name = 'Vellore';
UPDATE locations SET district = 'Thanjavur District' WHERE id = 9 AND name = 'Thanjavur';
UPDATE locations SET district = 'Thanjavur District' WHERE id = 10 AND name = 'Kumbakonam';
UPDATE locations SET district = 'Villupuram District' WHERE id = 14 AND name = 'Villupuram';

-- Add district and nearby_city for smaller towns (useful for future disambiguation)
UPDATE locations SET district = 'Virudhunagar District', nearby_city = 'Madurai' WHERE UPPER(name) = 'SIVAKASI';
UPDATE locations SET district = 'Thoothukudi District', nearby_city = 'Thoothukudi' WHERE UPPER(name) = 'THIRUCHENDUR';
UPDATE locations SET district = 'Virudhunagar District', nearby_city = 'Madurai' WHERE UPPER(name) = 'ARUPPUKKOTTAI';
UPDATE locations SET district = 'Virudhunagar District', nearby_city = 'Sivakasi' WHERE UPPER(name) = 'KATTALAIKUDIYIRUPPU';
UPDATE locations SET district = 'Tenkasi District', nearby_city = 'Tirunelveli' WHERE UPPER(name) = 'TENKASI';
UPDATE locations SET district = 'Thoothukudi District', nearby_city = 'Thoothukudi' WHERE UPPER(name) = 'KOVILPATTI';
UPDATE locations SET district = 'Thoothukudi District' WHERE UPPER(name) = 'THOOTHUKUDI';
UPDATE locations SET district = 'Tiruppur District' WHERE UPPER(name) = 'TIRUPPUR';
UPDATE locations SET district = 'Ramanathapuram District', nearby_city = 'Madurai' WHERE UPPER(name) = 'RAMESWARAM';
UPDATE locations SET district = 'Theni District', nearby_city = 'Madurai' WHERE UPPER(name) = 'THENI';
UPDATE locations SET district = 'Dindigul District', nearby_city = 'Madurai' WHERE UPPER(name) = 'DINDIGUL';
UPDATE locations SET district = 'Kanyakumari District', nearby_city = 'Kanyakumari' WHERE UPPER(name) = 'NAGERCOIL';
UPDATE locations SET district = 'Sivaganga District', nearby_city = 'Madurai' WHERE UPPER(name) = 'KARAIKUDI';
UPDATE locations SET district = 'Erode District' WHERE UPPER(name) = 'ERODE';
UPDATE locations SET district = 'Ramanathapuram District', nearby_city = 'Madurai' WHERE UPPER(name) = 'RAMANATHAPURAM';

-- Normalize location names to Title Case for consistency
UPDATE locations SET name = 'Sivakasi' WHERE UPPER(name) = 'SIVAKASI';
UPDATE locations SET name = 'Thiruchendur' WHERE UPPER(name) = 'THIRUCHENDUR';
UPDATE locations SET name = 'Aruppukkottai' WHERE UPPER(name) = 'ARUPPUKKOTTAI';
UPDATE locations SET name = 'Kattalaikudiyiruppu' WHERE UPPER(name) = 'KATTALAIKUDIYIRUPPU';
UPDATE locations SET name = 'Tenkasi' WHERE UPPER(name) = 'TENKASI';
UPDATE locations SET name = 'Kovilpatti' WHERE UPPER(name) = 'KOVILPATTI';
UPDATE locations SET name = 'Thoothukudi' WHERE UPPER(name) = 'THOOTHUKUDI';
UPDATE locations SET name = 'Tiruppur' WHERE UPPER(name) = 'TIRUPPUR';
UPDATE locations SET name = 'Rameswaram' WHERE UPPER(name) = 'RAMESWARAM';
UPDATE locations SET name = 'Theni' WHERE UPPER(name) = 'THENI';
UPDATE locations SET name = 'Dindigul' WHERE UPPER(name) = 'DINDIGUL';
UPDATE locations SET name = 'Nagercoil' WHERE UPPER(name) = 'NAGERCOIL';
UPDATE locations SET name = 'Karaikudi' WHERE UPPER(name) = 'KARAIKUDI';
UPDATE locations SET name = 'Erode' WHERE UPPER(name) = 'ERODE';
UPDATE locations SET name = 'Ramanathapuram' WHERE UPPER(name) = 'RAMANATHAPURAM';
