-- Sample data for locations
INSERT INTO locations (name, latitude, longitude) VALUES
('Chennai Central', 13.0827, 80.2707),
('Tambaram', 12.9249, 80.1000),
('Velachery', 12.9714, 80.2180),
('T Nagar', 13.0410, 80.2354),
('Adyar', 13.0012, 80.2565),
('Porur', 13.0359, 80.1567),
('Anna Nagar', 13.0850, 80.2101),
('Ambattur', 13.1143, 80.1548),
('Shollinganallur', 12.9010, 80.2279),
('Thiruvanmiyur', 12.9830, 80.2594),
('Madurai', 9.9252, 78.1198),
('Coimbatore', 11.0168, 76.9558),
('Trichy', 10.7905, 78.7047),
('Villupuram', 11.9401, 79.4861),
('Salem', 11.6643, 78.1460)
ON DUPLICATE KEY UPDATE name=name;

-- Sample data for buses
INSERT INTO buses (name, bus_number, departure_time, arrival_time, from_location_id, to_location_id) VALUES
('Chennai Express', '45A', '08:00:00', '09:30:00', 1, 2),
('Tambaram Special', '18C', '09:15:00', '10:45:00', 2, 1),
('Velachery Direct', '29C', '07:30:00', '08:45:00', 3, 1),
('T Nagar Shuttle', '23B', '08:45:00', '09:30:00', 4, 1),
('Adyar Line', '5B', '07:00:00', '08:15:00', 5, 1),
('Porur Express', '54C', '06:30:00', '08:00:00', 6, 1),
('Anna Nagar Direct', '27B', '07:45:00', '09:00:00', 7, 1),
('Ambattur Route', '14A', '06:45:00', '08:30:00', 8, 1),
('IT Corridor Bus', '102', '08:30:00', '10:00:00', 9, 1),
('Beach Route', '21G', '09:00:00', '10:15:00', 10, 1),
('Chennai-Madurai Superfast', 'TN-01-SF-001', '06:00:00', '13:30:00', 1, 11),
('Chennai-Coimbatore Express', 'TN-01-SF-002', '07:00:00', '15:00:00', 1, 12),
('Madurai-Chennai Daily', 'TN-01-SF-003', '16:00:00', '23:30:00', 11, 1),
('Coimbatore-Chennai Deluxe', 'TN-01-SF-004', '17:00:00', '01:00:00', 12, 1)
ON DUPLICATE KEY UPDATE name=name;

-- Sample data for stops
INSERT INTO stops (name, bus_id, location_id, arrival_time, departure_time, stop_order) VALUES
('Meenambakkam', 1, 2, '08:30:00', '08:32:00', 1),
('Guindy', 1, 3, '08:45:00', '08:47:00', 2),
('Saidapet', 1, 4, '09:00:00', '09:02:00', 3),
('Nandanam', 1, 5, '09:15:00', '09:17:00', 4),
('Chrompet', 2, 3, '09:45:00', '09:47:00', 1),
('St. Thomas Mount', 2, 4, '10:00:00', '10:02:00', 2),
('Guindy', 2, 5, '10:15:00', '10:17:00', 3),
('Kodambakkam', 3, 6, '07:50:00', '07:52:00', 1),
('T. Nagar', 3, 7, '08:05:00', '08:07:00', 2),
('Teynampet', 3, 8, '08:20:00', '08:22:00', 3),
-- Chennai to Madurai route stops (bus_id 11) - Fixed location IDs
('Chennai Central', 11, 1, '06:00:00', '06:15:00', 1),
('Tambaram', 11, 2, '06:50:00', '07:00:00', 2),
('Chengalpattu', 11, 3, '07:45:00', '07:55:00', 3),
('Villupuram', 11, 14, '09:00:00', '09:15:00', 4),
('Trichy', 11, 13, '11:00:00', '11:15:00', 5),
('Madurai', 11, 11, '13:30:00', '13:45:00', 6),
-- Chennai to Coimbatore route stops (bus_id 12) - Fixed location IDs
('Chennai Central', 12, 1, '07:00:00', '07:15:00', 1),
('Kanchipuram', 12, 3, '08:30:00', '08:40:00', 2),
('Vellore', 12, 7, '10:00:00', '10:15:00', 3), 
('Salem', 12, 15, '12:00:00', '12:15:00', 4),
('Coimbatore', 12, 12, '15:00:00', '15:15:00', 5),
-- Madurai to Chennai route stops (bus_id 13) - Fixed location IDs
('Madurai', 13, 11, '16:00:00', '16:15:00', 1),
('Trichy', 13, 13, '18:30:00', '18:45:00', 2),
('Villupuram', 13, 14, '20:30:00', '20:45:00', 3),
('Chengalpattu', 13, 3, '21:50:00', '22:00:00', 4),
('Tambaram', 13, 2, '22:45:00', '22:55:00', 5),
('Chennai Central', 13, 1, '23:30:00', '23:45:00', 6),
-- Coimbatore to Chennai route stops (bus_id 14) - Fixed location IDs
('Coimbatore', 14, 12, '17:00:00', '17:15:00', 1),
('Salem', 14, 15, '20:00:00', '20:15:00', 2),
('Vellore', 14, 7, '22:00:00', '22:15:00', 3),
('Kanchipuram', 14, 3, '23:45:00', '23:55:00', 4),
('Chennai Central', 14, 1, '01:00:00', '01:15:00', 5)
ON DUPLICATE KEY UPDATE name=name;

-- Sample data for route contributions
INSERT INTO route_contributions (id, user_id, bus_number, from_location_name, to_location_name, from_latitude, from_longitude, to_latitude, to_longitude, schedule_info, status, submission_date, additional_notes) VALUES
('11111111-1111-1111-1111-111111111111', 'user1', '75F', 'Medavakkam', 'Chennai Central', 12.9176, 80.1920, 13.0827, 80.2707, 'Hourly from 6 AM to 10 PM', 'PENDING', '2025-05-15 10:23:45', 'New route suggestion'),
('22222222-2222-2222-2222-222222222222', 'user2', '12B', 'Pallavaram', 'T Nagar', 12.9675, 80.1491, 13.0410, 80.2354, 'Every 30 mins from 7 AM to 9 PM', 'APPROVED', '2025-05-20 14:15:30', 'Frequent service needed'),
('33333333-3333-3333-3333-333333333333', 'user3', '119', 'Siruseri', 'Koyambedu', 12.8196, 80.2278, 13.0694, 80.1948, 'Morning 6 AM, 7 AM, 8 AM and evening 5 PM, 7 PM, 9 PM', 'REJECTED', '2025-05-25 09:45:12', 'For IT employees')
ON DUPLICATE KEY UPDATE user_id=user_id;

-- Sample data for image contributions
INSERT INTO image_contributions (id, user_id, description, location, route_name, image_url, status, submission_date, additional_notes) VALUES
('44444444-4444-4444-4444-444444444444', 'user1', 'Bus stop sign faded and hard to read', 'Guindy Bus Stand', 'Chennai Central - Tambaram', 'https://storage.perundhu.com/images/contributions/busstop1.jpg', 'PENDING', '2025-06-01 11:30:00', 'Needs immediate attention'),
('55555555-5555-5555-5555-555555555555', 'user2', 'New electronic display board installed', 'T Nagar Bus Terminal', 'Multiple Routes', 'https://storage.perundhu.com/images/contributions/display1.jpg', 'APPROVED', '2025-06-02 15:45:00', 'Working perfectly'),
('66666666-6666-6666-6666-666666666666', 'user3', 'Bus schedule poster unreadable', 'Adyar Bus Depot', 'Adyar - Chennai Central', 'https://storage.perundhu.com/images/contributions/schedule1.jpg', 'APPROVED', '2025-06-03 09:15:00', 'Need laminated posters')
ON DUPLICATE KEY UPDATE user_id=user_id;

-- Sample data for bus location history
INSERT INTO bus_location_history (id, bus_id, latitude, longitude, speed, heading, accuracy, timestamp) VALUES
('77777777-7777-7777-7777-777777777777', 1, 13.0500, 80.2200, 35.5, 90, 4.5, '2025-06-05 08:15:00'),
('88888888-8888-8888-8888-888888888888', 1, 13.0550, 80.2250, 32.0, 90, 5.0, '2025-06-05 08:20:00'),
('99999999-9999-9999-9999-999999999999', 2, 12.9300, 80.1050, 40.2, 270, 3.8, '2025-06-05 09:25:00')
ON DUPLICATE KEY UPDATE bus_id=bus_id;

-- Sample data for bus analytics
INSERT INTO bus_analytics (bus_id, date, passenger_count, avg_speed, on_time_percentage, total_trips, fuel_consumption) VALUES
(1, '2025-06-04', 1250, 32.5, 94.5, 24, 85.2),
(2, '2025-06-04', 980, 30.8, 91.2, 22, 82.6),
(3, '2025-06-04', 1100, 34.2, 95.0, 20, 78.9)
ON DUPLICATE KEY UPDATE passenger_count=passenger_count;

-- Sample data for user tracking sessions
INSERT INTO user_tracking_sessions (id, device_id, session_start, session_end, from_location_id, to_location_id, bus_id, status) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'device123', '2025-06-05 07:30:00', '2025-06-05 08:45:00', 1, 2, 1, 'COMPLETED'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'device456', '2025-06-05 08:15:00', '2025-06-05 09:30:00', 2, 1, 2, 'COMPLETED'),
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'device789', '2025-06-05 09:00:00', NULL, 3, 1, 3, 'IN_PROGRESS')
ON DUPLICATE KEY UPDATE device_id=device_id;

-- Sample data for bus travel metrics
INSERT INTO bus_travel_metrics (bus_id, date, total_distance, avg_travel_time, fuel_efficiency, co2_emission) VALUES
(1, '2025-06-04', 245.6, 85, 12.4, 198.2),
(2, '2025-06-04', 220.3, 92, 11.8, 186.7),
(3, '2025-06-04', 198.5, 78, 13.2, 150.4)
ON DUPLICATE KEY UPDATE total_distance=total_distance;

-- Sample data for translations
INSERT INTO translations (entity_type, entity_id, language_code, field_name, translated_value) VALUES
('location', 1, 'ta', 'name', 'சென்னை சென்ட்ரல்'),
('location', 2, 'ta', 'name', 'தாம்பரம்'),
('location', 3, 'ta', 'name', 'வேளச்சேரி'),
('location', 4, 'ta', 'name', 'தி நகர்'),
('location', 5, 'ta', 'name', 'அடையாறு'),
('location', 6, 'ta', 'name', 'போரூர்'),
('location', 7, 'ta', 'name', 'அண்ணா நகர்'),
('location', 8, 'ta', 'name', 'அம்பத்தூர்'),
('location', 9, 'ta', 'name', 'சோழிங்கநல்லூர்'),
('location', 10, 'ta', 'name', 'திருவான்மியூர்'),
('location', 11, 'ta', 'name', 'மதுரை'),
('location', 12, 'ta', 'name', 'கோயம்புத்தூர்'),
('location', 13, 'ta', 'name', 'திருச்சி'),
('location', 14, 'ta', 'name', 'விழுப்புரம்'),
('location', 15, 'ta', 'name', 'சேலம்'),
('bus', 1, 'ta', 'name', 'சென்னை எக்ஸ்பிரஸ்'),
('bus', 2, 'ta', 'name', 'தாம்பரம் ஸ்பெஷல்'),
('bus', 3, 'ta', 'name', 'வேளச்சேரி நேரடி'),
('bus', 4, 'ta', 'name', 'தி நகர் ஷட்டில்'),
('bus', 5, 'ta', 'name', 'அடையாறு லைன்'),
('bus', 6, 'ta', 'name', 'போரூர் எக்ஸ்பிரஸ்'),
('bus', 7, 'ta', 'name', 'அண்ணா நகர் நேரடி'),
('bus', 8, 'ta', 'name', 'அம்பத்தூர் வழி'),
('bus', 9, 'ta', 'name', 'ஐ.டி பாதை பஸ்'),
('bus', 10, 'ta', 'name', 'கடற்கரை வழி'),
('bus', 11, 'ta', 'name', 'சென்னை-மதுரை சூப்பர் ஃபாஸ்ட்'),
('bus', 12, 'ta', 'name', 'சென்னை-கோயம்புத்தூர் எக்ஸ்பிரஸ்'),
('bus', 13, 'ta', 'name', 'மதுரை-சென்னை டெய்லி'),
('bus', 14, 'ta', 'name', 'கோயம்புத்தூர்-சென்னை டீலக்ஸ்'),
('stop', 11, 'ta', 'name', 'சென்னை சென்ட்ரல்'),
('stop', 12, 'ta', 'name', 'தாம்பரம்'),
('stop', 13, 'ta', 'name', 'செங்கல்பட்டு'),
('stop', 14, 'ta', 'name', 'விழுப்புரம்'),
('stop', 15, 'ta', 'name', 'திருச்சி'),
('stop', 16, 'ta', 'name', 'மதுரை'),
('stop', 17, 'ta', 'name', 'சென்னை சென்ட்ரல்'),
('stop', 18, 'ta', 'name', 'காஞ்சிபுரம்'),
('stop', 19, 'ta', 'name', 'வேலூர்'),
('stop', 20, 'ta', 'name', 'சேலம்'),
('stop', 21, 'ta', 'name', 'கோயம்புத்தூர்'),
('stop', 22, 'ta', 'name', 'மதுரை'),
('stop', 23, 'ta', 'name', 'திருச்சி'),
('stop', 24, 'ta', 'name', 'விழுப்புரம்'),
('stop', 25, 'ta', 'name', 'செங்கல்பட்டு'),
('stop', 26, 'ta', 'name', 'தாம்பரம்'),
('stop', 27, 'ta', 'name', 'சென்னை சென்ட்ரல்'),
('stop', 28, 'ta', 'name', 'கோயம்புத்தூர்'),
('stop', 29, 'ta', 'name', 'சேலம்'),
('stop', 30, 'ta', 'name', 'வேலூர்'),
('stop', 31, 'ta', 'name', 'காஞ்சிபுரம்'),
('stop', 32, 'ta', 'name', 'சென்னை சென்ட்ரல்'),
('bus_number', 11, 'ta', 'number', 'டி.என்-01-எஸ்.எஃப்-001'),
('bus_number', 12, 'ta', 'number', 'டி.என்-01-எஸ்.எஃப்-002'),
('bus_number', 13, 'ta', 'number', 'டி.என்-01-எஸ்.எஃப்-003'),
('bus_number', 14, 'ta', 'number', 'டி.என்-01-எஸ்.எஃப்-004')
ON DUPLICATE KEY UPDATE translated_value=translated_value;

