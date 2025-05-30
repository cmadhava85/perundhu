-- Sample Locations
INSERT INTO locations (id, name, latitude, longitude, created_at, updated_at)
VALUES 
(1, 'Chennai', 13.0827, 80.2707, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(2, 'Bengaluru', 12.9716, 77.5946, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(3, 'Vellore', 12.9165, 79.1325, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Sample Buses
INSERT INTO buses (id, name, bus_number, from_location_id, to_location_id, departure_time, arrival_time, created_at, updated_at)
VALUES 
(1, 'Express 101', 'TN-01-1234', 1, 2, '06:00:00', '12:30:00', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(2, 'Super Fast 202', 'TN-01-5678', 2, 1, '14:00:00', '20:30:00', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Sample Stops
INSERT INTO stops (id, name, bus_id, location_id, arrival_time, departure_time, stop_order, created_at, updated_at)
VALUES 
(1, 'Koyambedu', 1, 1, '06:00:00', '06:15:00', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(2, 'Vellore', 1, 3, '07:30:00', '07:35:00', 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(3, 'Krishnagiri', 1, null, '09:00:00', '09:10:00', 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Sample Translations
INSERT INTO translations (id, entity_type, entity_id, field_name, language_code, translated_value, created_at, updated_at)
VALUES 
-- Location translations
(1, 'location', 1, 'name', 'ta', 'சென்னை', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(2, 'location', 2, 'name', 'ta', 'பெங்களூரு', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(3, 'location', 3, 'name', 'ta', 'வேலூர்', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- Bus translations
(4, 'bus', 1, 'name', 'ta', 'எக்ஸ்பிரஸ் 101', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(5, 'bus', 2, 'name', 'ta', 'சூப்பர் ஃபாஸ்ட் 202', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- Stop translations
(6, 'stop', 1, 'name', 'ta', 'கோயம்பேடு', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(7, 'stop', 2, 'name', 'ta', 'வேலூர்', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(8, 'stop', 3, 'name', 'ta', 'கிருஷ்ணகிரி', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Sample Connecting Routes
INSERT INTO connecting_routes (id, first_bus_id, second_bus_id, connection_point_id, created_at, updated_at)
VALUES 
(1, 1, 2, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);