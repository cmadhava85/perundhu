-- Test data for H2 database

-- Insert sample locations
INSERT INTO locations (id, name_en, name_ta, latitude, longitude, address) VALUES 
(1, 'Chennai', 'சென்னை', 13.0827, 80.2707, 'Chennai, Tamil Nadu'),
(2, 'Bengaluru', NULL, 12.9716, 77.5946, 'Bengaluru, Karnataka'),
(3, 'Mumbai', NULL, 19.0760, 72.8777, 'Mumbai, Maharashtra'),
(4, 'Coimbatore', 'கோயம்புத்தூர்', 11.0168, 76.9558, 'Coimbatore, Tamil Nadu'),
(5, 'Madurai', 'மதுரை', 9.9252, 78.1198, 'Madurai, Tamil Nadu');

-- Tamil translations for locations
INSERT INTO translations (entity_type, entity_id, language_code, field_name, translated_value, created_at, updated_at) VALUES
('location', 1, 'ta', 'name', 'சென்னை', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('location', 4, 'ta', 'name', 'கோயம்புத்தூர்', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('location', 5, 'ta', 'name', 'மதுரை', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Insert sample buses
INSERT INTO buses (id, name, bus_number, from_location_id, to_location_id, departure_time, arrival_time, created_at, updated_at) VALUES 
(1, 'Express 101', 'EXP101', 1, 2, '06:00:00', '12:00:00', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(2, 'Super Fast 202', 'SF202', 1, 3, '20:00:00', '08:00:00', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(3, 'Local 303', 'LOC303', 1, 4, '14:00:00', '20:00:00', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(4, 'Overnight 404', 'OVN404', 2, 3, '22:00:00', '06:00:00', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(5, 'Daily 505', 'DLY505', 1, 5, '18:00:00', '00:00:00', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Insert sample stops
INSERT INTO stops (id, bus_id, location_id, arrival_time, departure_time, stop_order) VALUES 
(1, 1, 1, NULL, '06:00:00', 1),
(2, 1, 4, '09:00:00', '09:15:00', 2),
(3, 1, 2, '12:00:00', NULL, 3),
(4, 2, 1, NULL, '20:00:00', 1),
(5, 2, 3, '08:00:00', NULL, 2),
(6, 3, 1, NULL, '14:00:00', 1),
(7, 3, 4, '20:00:00', NULL, 2),
(8, 4, 2, NULL, '22:00:00', 1),
(9, 4, 3, '06:00:00', NULL, 2),
(10, 5, 1, NULL, '18:00:00', 1),
(11, 5, 4, '21:00:00', '21:15:00', 2),
(12, 5, 5, '00:00:00', NULL, 3);