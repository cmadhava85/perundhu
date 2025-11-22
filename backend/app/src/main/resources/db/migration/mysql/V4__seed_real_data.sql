-- Seed data migration to ensure real database data instead of mock/stub data
-- This migration adds essential data for all main tables

-- Ensure locations table has data
INSERT IGNORE INTO locations (id, name, latitude, longitude) VALUES
(1, 'Chennai Central', 13.0827, 80.2707),
(2, 'Tambaram', 12.9249, 80.1000),
(3, 'Velachery', 12.9714, 80.2180),
(4, 'T Nagar', 13.0410, 80.2354),
(5, 'Adyar', 13.0012, 80.2565),
(6, 'Porur', 13.0359, 80.1567),
(7, 'Anna Nagar', 13.0850, 80.2101),
(8, 'Ambattur', 13.1143, 80.1548),
(9, 'Shollinganallur', 12.9010, 80.2279),
(10, 'Thiruvanmiyur', 12.9830, 80.2594),
(11, 'Madurai', 9.9252, 78.1198),
(12, 'Coimbatore', 11.0168, 76.9558),
(13, 'Trichy', 10.7905, 78.7047),
(14, 'Villupuram', 11.9401, 79.4861),
(15, 'Salem', 11.6643, 78.1460);

-- Ensure buses table has data
INSERT IGNORE INTO buses (id, name, bus_number, departure_time, arrival_time, from_location_id, to_location_id, capacity, category) VALUES
(1, 'Chennai Express', '45A', '08:00:00', '09:30:00', 1, 2, 50, 'Regular'),
(2, 'Tambaram Special', '18C', '09:15:00', '10:45:00', 2, 1, 50, 'Regular'),
(3, 'Velachery Direct', '29C', '07:30:00', '08:45:00', 3, 1, 50, 'Regular'),
(4, 'T Nagar Shuttle', '23B', '08:45:00', '09:30:00', 4, 1, 50, 'Regular'),
(5, 'Adyar Line', '5B', '07:00:00', '08:15:00', 5, 1, 50, 'Regular'),
(6, 'Porur Express', '54C', '06:30:00', '08:00:00', 6, 1, 50, 'Regular'),
(7, 'Anna Nagar Direct', '27B', '07:45:00', '09:00:00', 7, 1, 50, 'Regular'),
(8, 'Ambattur Route', '14A', '06:45:00', '08:30:00', 8, 1, 50, 'Regular'),
(9, 'IT Corridor Bus', '102', '08:30:00', '10:00:00', 9, 1, 50, 'Regular'),
(10, 'Beach Route', '21G', '09:00:00', '10:15:00', 10, 1, 50, 'Regular'),
(11, 'Chennai-Madurai Superfast', 'TN-01-SF-001', '06:00:00', '13:30:00', 1, 11, 45, 'Express'),
(12, 'Chennai-Coimbatore Express', 'TN-01-SF-002', '07:00:00', '15:00:00', 1, 12, 45, 'Express'),
(13, 'Madurai-Chennai Daily', 'TN-01-SF-003', '16:00:00', '23:30:00', 11, 1, 45, 'Express'),
(14, 'Coimbatore-Chennai Deluxe', 'TN-01-SF-004', '17:00:00', '01:00:00', 12, 1, 45, 'Express');

-- Ensure stops table has data
INSERT IGNORE INTO stops (id, name, bus_id, location_id, arrival_time, departure_time, stop_order) VALUES
(1, 'Meenambakkam', 1, 2, '08:30:00', '08:32:00', 1),
(2, 'Guindy', 1, 3, '08:45:00', '08:47:00', 2),
(3, 'Saidapet', 1, 4, '09:00:00', '09:02:00', 3),
(4, 'Nandanam', 1, 5, '09:15:00', '09:17:00', 4),
(5, 'Chrompet', 2, 3, '09:45:00', '09:47:00', 1),
(6, 'St. Thomas Mount', 2, 4, '10:00:00', '10:02:00', 2),
(7, 'Guindy', 2, 5, '10:15:00', '10:17:00', 3),
(8, 'Kodambakkam', 3, 6, '07:50:00', '07:52:00', 1),
(9, 'T. Nagar', 3, 7, '08:05:00', '08:07:00', 2),
(10, 'Teynampet', 3, 8, '08:20:00', '08:22:00', 3),
-- Chennai to Madurai route stops (bus_id 11)
(11, 'Chennai Central', 11, 1, '06:00:00', '06:15:00', 1),
(12, 'Tambaram', 11, 2, '06:50:00', '07:00:00', 2),
(13, 'Chengalpattu', 11, 3, '07:45:00', '07:55:00', 3),
(14, 'Villupuram', 11, 14, '09:00:00', '09:15:00', 4),
(15, 'Trichy', 11, 13, '11:00:00', '11:15:00', 5),
(16, 'Madurai', 11, 11, '13:30:00', '13:45:00', 6),
-- Chennai to Coimbatore route stops (bus_id 12)
(17, 'Chennai Central', 12, 1, '07:00:00', '07:15:00', 1),
(18, 'Kanchipuram', 12, 3, '08:30:00', '08:40:00', 2),
(19, 'Vellore', 12, 7, '10:00:00', '10:15:00', 3), 
(20, 'Salem', 12, 15, '12:00:00', '12:15:00', 4),
(21, 'Coimbatore', 12, 12, '15:00:00', '15:15:00', 5),
-- Madurai to Chennai route stops (bus_id 13)
(22, 'Madurai', 13, 11, '16:00:00', '16:15:00', 1),
(23, 'Trichy', 13, 13, '18:30:00', '18:45:00', 2),
(24, 'Villupuram', 13, 14, '20:30:00', '20:45:00', 3),
(25, 'Chengalpattu', 13, 3, '21:50:00', '22:00:00', 4),
(26, 'Tambaram', 13, 2, '22:45:00', '22:55:00', 5),
(27, 'Chennai Central', 13, 1, '23:30:00', '23:45:00', 6),
-- Coimbatore to Chennai route stops (bus_id 14)
(28, 'Coimbatore', 14, 12, '17:00:00', '17:15:00', 1),
(29, 'Salem', 14, 15, '20:00:00', '20:15:00', 2),
(30, 'Vellore', 14, 7, '22:00:00', '22:15:00', 3),
(31, 'Kanchipuram', 14, 3, '23:45:00', '23:55:00', 4),
(32, 'Chennai Central', 14, 1, '01:00:00', '01:15:00', 5);

-- Ensure translations table has data for Tamil localization
INSERT IGNORE INTO translations (entity_type, entity_id, language_code, field_name, translated_value) VALUES
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
('bus', 14, 'ta', 'name', 'கோயம்புத்தூர்-சென்னை டீலக்ஸ்');