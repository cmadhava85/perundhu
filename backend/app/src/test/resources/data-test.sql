-- Insert test data for locations
INSERT INTO locations (id, name, latitude, longitude) VALUES
(1, 'Chennai', 13.0827, 80.2707),
(2, 'Bengaluru', 12.9716, 77.5946),
(3, 'Hyderabad', 17.3850, 78.4867),
(4, 'Mumbai', 19.0760, 72.8777),
(5, 'Kolkata', 22.5726, 88.3639);

-- Insert test data for buses
INSERT INTO buses (id, name, bus_number, departure_time, arrival_time, from_location_id, to_location_id) VALUES
(1, 'Chennai Express', 'CE001', '08:00:00', '12:00:00', 1, 2),
(2, 'Bangalore Rider', 'BR002', '14:00:00', '18:00:00', 2, 3);

-- Insert test data for stops
INSERT INTO stops (id, name, bus_id, location_id, arrival_time, departure_time, stop_order) VALUES
(1, 'Chennai Central', 1, 1, '07:45:00', '08:00:00', 1),
(2, 'Bengaluru Main', 1, 2, '12:00:00', '12:15:00', 2),
(3, 'Bengaluru Main', 2, 2, '13:45:00', '14:00:00', 1),
(4, 'Hyderabad Station', 2, 3, '18:00:00', '18:15:00', 2);

-- Insert test data for translations (for the location and bus names in Tamil)
INSERT INTO translations (entity_type, entity_id, language_code, field_name, translated_value) VALUES
('location', 1, 'ta', 'name', 'சென்னை'),
('bus', 1, 'ta', 'name', 'சென்னை எக்ஸ்பிரஸ்');

-- Insert test data for route contributions
INSERT INTO route_contributions (id, user_id, bus_number, from_location_name, to_location_name, from_latitude, from_longitude, to_latitude, to_longitude, status, submission_date) VALUES
('11111111-1111-1111-1111-111111111111', 'test-user-1', 'T123', 'Chennai', 'Bengaluru', 13.0827, 80.2707, 12.9716, 77.5946, 'PENDING', CURRENT_TIMESTAMP),
('22222222-2222-2222-2222-222222222222', 'test-user-2', 'T456', 'Bengaluru', 'Hyderabad', 12.9716, 77.5946, 17.3850, 78.4867, 'APPROVED', CURRENT_TIMESTAMP);

-- Insert test data for image contributions
INSERT INTO image_contributions (id, user_id, description, location, route_name, image_url, status, submission_date) VALUES
('33333333-3333-3333-3333-333333333333', 'test-user-1', 'Test image contribution', 'Chennai Bus Stand', 'Chennai-Bengaluru', 'http://test-image-url.com/image1.jpg', 'PENDING', CURRENT_TIMESTAMP),
('44444444-4444-4444-4444-444444444444', 'test-user-2', 'Another test image', 'Bengaluru Bus Station', 'Bengaluru-Hyderabad', 'http://test-image-url.com/image2.jpg', 'APPROVED', CURRENT_TIMESTAMP);

