-- Insert test data for locations
INSERT INTO locations (id, name_en, name_ta, latitude, longitude, created_at, updated_at) VALUES 
(1, 'Chennai', 'சென்னை', 13.0827, 80.2707, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(2, 'Bengaluru', NULL, 12.9716, 77.5946, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(3, 'Hyderabad', NULL, 17.3850, 78.4867, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(4, 'Mumbai', NULL, 19.0760, 72.8777, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(5, 'Kolkata', NULL, 22.5726, 88.3639, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Insert test data for buses
INSERT INTO buses (id, name_en, bus_number, from_location_id, to_location_id, created_at, updated_at) VALUES
(1, 'Chennai Express', 'CE001', 1, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(2, 'Bangalore Rider', 'BR002', 2, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Insert test data for stops
INSERT INTO stops (id, location_id, name, arrival_time, departure_time, stop_order, bus_id, created_at, updated_at) VALUES
(1, 1, 'Chennai Central', NULL, '08:00:00', 1, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(2, 2, 'Bengaluru Main', '12:00:00', NULL, 2, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(3, 2, 'Bengaluru Main', NULL, '14:00:00', 1, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(4, 3, 'Hyderabad Station', '18:00:00', NULL, 2, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Insert test data for connecting routes
INSERT INTO connecting_route (id, from_location_id, to_location_id, first_bus_id, second_bus_id, connection_location_id, wait_time_minutes, created_at, updated_at) VALUES
(1, 1, 3, 1, 2, 2, 120, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);