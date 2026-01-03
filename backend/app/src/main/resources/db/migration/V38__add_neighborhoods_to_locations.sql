-- V38__add_neighborhoods_to_locations.sql
-- Add neighborhood locations for better location search coverage
-- These neighborhoods are important sub-areas within cities that users commonly search for

-- ============================================
-- CHENNAI NEIGHBORHOODS
-- ============================================
-- North Chennai
INSERT INTO locations (name, latitude, longitude, district, nearby_city) VALUES
('Perambur', 13.1652, 80.2425, 'Chennai', 'Chennai'),
('Madhavaram', 13.1482, 80.2317, 'Chennai', 'Chennai'),
('Tondiarpet', 13.1600, 80.2850, 'Chennai', 'Chennai'),
('Tiruvottriyur', 13.1567, 80.2967, 'Chennai', 'Chennai'),
('Ambattur', 13.1183, 80.1817, 'Chennai', 'Chennai'),
('Avadi', 13.1000, 80.1267, 'Chennai', 'Chennai'),
('Redhills', 13.0750, 80.1433, 'Chennai', 'Chennai')
ON DUPLICATE KEY UPDATE latitude = VALUES(latitude), longitude = VALUES(longitude);

-- South Chennai
INSERT INTO locations (name, latitude, longitude, district, nearby_city) VALUES
('Adyar', 13.0012, 80.2565, 'Chennai', 'Chennai'),
('Besant Nagar', 12.9843, 80.2565, 'Chennai', 'Chennai'),
('Mylapore', 13.0365, 80.2600, 'Chennai', 'Chennai'),
('Triplicane', 13.0478, 80.2833, 'Chennai', 'Chennai'),
('Santhome', 13.0350, 80.2717, 'Chennai', 'Chennai'),
('Mandaveli', 13.0267, 80.2633, 'Chennai', 'Chennai'),
('Alwarpet', 13.0283, 80.2633, 'Chennai', 'Chennai'),
('Palavakkam', 12.9950, 80.2367, 'Chennai', 'Chennai'),
('Kovalam', 12.9767, 80.2633, 'Chennai', 'Chennai'),
('Velachery', 12.9717, 80.2183, 'Chennai', 'Chennai'),
('Madipakkam', 12.9600, 80.2067, 'Chennai', 'Chennai'),
('Thiruvanmiyur', 12.9933, 80.2717, 'Chennai', 'Chennai')
ON DUPLICATE KEY UPDATE latitude = VALUES(latitude), longitude = VALUES(longitude);

-- Central Chennai
INSERT INTO locations (name, latitude, longitude, district, nearby_city) VALUES
('T. Nagar', 13.0404, 80.2165, 'Chennai', 'Chennai'),
('Kodambakkam', 13.0471, 80.1964, 'Chennai', 'Chennai'),
('Nungambakkam', 13.0567, 80.2265, 'Chennai', 'Chennai'),
('Chetpet', 13.0567, 80.2383, 'Chennai', 'Chennai'),
('Teynampet', 13.0450, 80.2500, 'Chennai', 'Chennai'),
('Kilpauk', 13.0690, 80.2167, 'Chennai', 'Chennai'),
('Egmore', 13.0617, 80.2700, 'Chennai', 'Chennai'),
('Purasawalkkam', 13.0867, 80.2617, 'Chennai', 'Chennai'),
('Mint', 13.0870, 80.2850, 'Chennai', 'Chennai'),
('George Town', 13.0854, 80.2854, 'Chennai', 'Chennai'),
('Sowcarpet', 13.0850, 80.2917, 'Chennai', 'Chennai')
ON DUPLICATE KEY UPDATE latitude = VALUES(latitude), longitude = VALUES(longitude);

-- West Chennai
INSERT INTO locations (name, latitude, longitude, district, nearby_city) VALUES
('Vadapalani', 13.0633, 80.1783, 'Chennai', 'Chennai'),
('Ashok Nagar', 13.0517, 80.1733, 'Chennai', 'Chennai'),
('Saidapet', 13.0333, 80.1833, 'Chennai', 'Chennai'),
('Mambalam', 13.0283, 80.1733, 'Chennai', 'Chennai'),
('Ramakrishnapuram', 13.0250, 80.1917, 'Chennai', 'Chennai')
ON DUPLICATE KEY UPDATE latitude = VALUES(latitude), longitude = VALUES(longitude);

-- East Chennai
INSERT INTO locations (name, latitude, longitude, district, nearby_city) VALUES
('Kottivakkam', 12.9733, 80.2983, 'Chennai', 'Chennai'),
('Thiruvanmiyur', 12.9933, 80.2717, 'Chennai', 'Chennai'),
('Karapakkam', 12.9433, 80.2283, 'Chennai', 'Chennai'),
('Sholinganallur', 12.8750, 80.2267, 'Chennai', 'Chennai'),
('Navalur', 12.8567, 80.2000, 'Chennai', 'Chennai'),
('Okkiyam Thoraipakkam', 12.8983, 80.2433, 'Chennai', 'Chennai')
ON DUPLICATE KEY UPDATE latitude = VALUES(latitude), longitude = VALUES(longitude);

-- ============================================
-- COIMBATORE NEIGHBORHOODS
-- ============================================
INSERT INTO locations (name, latitude, longitude, district, nearby_city) VALUES
('Gandhipuram', 11.0183, 76.9725, 'Coimbatore', 'Coimbatore'),
('Ukkadam', 10.9923, 76.9614, 'Coimbatore', 'Coimbatore'),
('Singanallur', 11.0059, 77.0319, 'Coimbatore', 'Coimbatore'),
('Peelamedu', 11.0100, 76.9500, 'Coimbatore', 'Coimbatore'),
('Ramnagar', 11.0230, 76.9800, 'Coimbatore', 'Coimbatore'),
('Cross Cut Road', 11.0150, 76.9850, 'Coimbatore', 'Coimbatore'),
('RS Puram', 11.0250, 76.9600, 'Coimbatore', 'Coimbatore')
ON DUPLICATE KEY UPDATE latitude = VALUES(latitude), longitude = VALUES(longitude);

-- ============================================
-- SALEM NEIGHBORHOODS
-- ============================================
INSERT INTO locations (name, latitude, longitude, district, nearby_city) VALUES
('New Salem', 11.6508, 78.1556, 'Salem', 'Salem'),
('Fairlands', 11.6650, 78.1650, 'Salem', 'Salem'),
('Narasimharajapuram', 11.6800, 78.1400, 'Salem', 'Salem'),
('Salempur', 11.6700, 78.1500, 'Salem', 'Salem')
ON DUPLICATE KEY UPDATE latitude = VALUES(latitude), longitude = VALUES(longitude);

-- ============================================
-- TIRUPPUR NEIGHBORHOODS
-- ============================================
INSERT INTO locations (name, latitude, longitude, district, nearby_city) VALUES
('Tiruppur City', 11.1085, 77.3411, 'Tiruppur', 'Tiruppur'),
('Avinashi Road', 11.1167, 77.3533, 'Tiruppur', 'Tiruppur'),
('Lakshmi Mills', 11.1017, 77.3250, 'Tiruppur', 'Tiruppur'),
('Sengeni Nagar', 11.0950, 77.3467, 'Tiruppur', 'Tiruppur')
ON DUPLICATE KEY UPDATE latitude = VALUES(latitude), longitude = VALUES(longitude);

-- ============================================
-- MADURAI NEIGHBORHOODS
-- ============================================
INSERT INTO locations (name, latitude, longitude, district, nearby_city) VALUES
('Arapalayam', 9.9320, 78.1007, 'Madurai', 'Madurai'),
('Periyar', 9.9161, 78.1112, 'Madurai', 'Madurai'),
('Mattuthavani', 9.9441, 78.1560, 'Madurai', 'Madurai'),
('Arappalayam', 9.9250, 78.1233, 'Madurai', 'Madurai'),
('Town Hall', 9.9200, 78.1100, 'Madurai', 'Madurai')
ON DUPLICATE KEY UPDATE latitude = VALUES(latitude), longitude = VALUES(longitude);

-- ============================================
-- TRICHY (TIRUCHIRAPPALLI) NEIGHBORHOODS
-- ============================================
INSERT INTO locations (name, latitude, longitude, district, nearby_city) VALUES
('Trichy Central', 10.8050, 78.6856, 'Tiruchirappalli', 'Trichy'),
('Chatram', 10.8231, 78.6897, 'Tiruchirappalli', 'Trichy'),
('Srirangam', 10.8627, 78.6897, 'Tiruchirappalli', 'Trichy'),
('Teppakulam', 10.7850, 78.6850, 'Tiruchirappalli', 'Trichy'),
('Cantonment', 10.8100, 78.7100, 'Tiruchirappalli', 'Trichy')
ON DUPLICATE KEY UPDATE latitude = VALUES(latitude), longitude = VALUES(longitude);

-- ============================================
-- ERODE NEIGHBORHOODS
-- ============================================
INSERT INTO locations (name, latitude, longitude, district, nearby_city) VALUES
('Erode City', 11.3394, 77.7264, 'Erode', 'Erode'),
('Idayapatti', 11.3050, 77.6850, 'Erode', 'Erode'),
('Kondayampalayam', 11.3200, 77.7400, 'Erode', 'Erode'),
('Sathyamangalam', 11.2400, 77.9100, 'Erode', 'Erode')
ON DUPLICATE KEY UPDATE latitude = VALUES(latitude), longitude = VALUES(longitude);

-- ============================================
-- VELLORE NEIGHBORHOODS
-- ============================================
INSERT INTO locations (name, latitude, longitude, district, nearby_city) VALUES
('Vellore City', 12.9165, 79.1325, 'Vellore', 'Vellore'),
('Katpadi', 12.9692, 79.1444, 'Vellore', 'Vellore'),
('Ranipet', 12.9500, 79.3333, 'Ranipet', 'Ranipet')
ON DUPLICATE KEY UPDATE latitude = VALUES(latitude), longitude = VALUES(longitude);

-- ============================================
-- THANJAVUR NEIGHBORHOODS
-- ============================================
INSERT INTO locations (name, latitude, longitude, district, nearby_city) VALUES
('Thanjavur City', 10.7870, 79.1378, 'Thanjavur', 'Thanjavur'),
('Kumbakonam', 10.9609, 79.3881, 'Thanjavur', 'Kumbakonam'),
('Buharpur', 10.7800, 79.1300, 'Thanjavur', 'Thanjavur')
ON DUPLICATE KEY UPDATE latitude = VALUES(latitude), longitude = VALUES(longitude);

-- ============================================
-- KANCHIPURAM NEIGHBORHOODS
-- ============================================
INSERT INTO locations (name, latitude, longitude, district, nearby_city) VALUES
('Kanchipuram City', 12.8342, 79.7029, 'Kanchipuram', 'Kanchipuram'),
('Timiri', 12.8600, 79.7200, 'Kanchipuram', 'Kanchipuram')
ON DUPLICATE KEY UPDATE latitude = VALUES(latitude), longitude = VALUES(longitude);

-- ============================================
-- VILLUPURAM NEIGHBORHOODS
-- ============================================
INSERT INTO locations (name, latitude, longitude, district, nearby_city) VALUES
('Villupuram City', 11.9401, 79.4861, 'Villupuram', 'Villupuram'),
('Tiruvannamalai', 12.2333, 79.0733, 'Tiruvannamalai', 'Tiruvannamalai')
ON DUPLICATE KEY UPDATE latitude = VALUES(latitude), longitude = VALUES(longitude);

-- ============================================
-- TIRUNELVELI NEIGHBORHOODS
-- ============================================
INSERT INTO locations (name, latitude, longitude, district, nearby_city) VALUES
('Tirunelveli City', 8.7139, 77.7567, 'Tirunelveli', 'Tirunelveli'),
('Palayamkottai', 8.7261, 77.6844, 'Tirunelveli', 'Palayamkottai'),
('Nagercoil', 8.1833, 77.4119, 'Kanyakumari', 'Nagercoil'),
('Kanyakumari', 8.0883, 77.5385, 'Kanyakumari', 'Kanyakumari')
ON DUPLICATE KEY UPDATE latitude = VALUES(latitude), longitude = VALUES(longitude);

-- ============================================
-- THOOTHUKUDI NEIGHBORHOODS
-- ============================================
INSERT INTO locations (name, latitude, longitude, district, nearby_city) VALUES
('Thoothukudi City', 8.7642, 78.1348, 'Thoothukudi', 'Thoothukudi'),
('Tiruchendur', 8.6300, 78.3100, 'Thoothukudi', 'Tiruchendur')
ON DUPLICATE KEY UPDATE latitude = VALUES(latitude), longitude = VALUES(longitude);

-- ============================================
-- CUDDALORE NEIGHBORHOODS
-- ============================================
INSERT INTO locations (name, latitude, longitude, district, nearby_city) VALUES
('Cuddalore City', 11.7480, 79.7714, 'Cuddalore', 'Cuddalore'),
('Chidambaram', 11.2000, 79.5667, 'Cuddalore', 'Chidambaram')
ON DUPLICATE KEY UPDATE latitude = VALUES(latitude), longitude = VALUES(longitude);

-- ============================================
-- DINDIGUL NEIGHBORHOODS
-- ============================================
INSERT INTO locations (name, latitude, longitude, district, nearby_city) VALUES
('Dindigul City', 10.3624, 77.9695, 'Dindigul', 'Dindigul'),
('Kodaikanal', 10.2381, 77.4892, 'Dindigul', 'Kodaikanal'),
('Palani', 10.2742, 77.4485, 'Dindigul', 'Palani')
ON DUPLICATE KEY UPDATE latitude = VALUES(latitude), longitude = VALUES(longitude);

-- ============================================
-- THENI NEIGHBORHOODS
-- ============================================
INSERT INTO locations (name, latitude, longitude, district, nearby_city) VALUES
('Theni City', 10.0104, 77.4760, 'Theni', 'Theni'),
('Periyakulam', 10.1208, 77.6032, 'Theni', 'Periyakulam')
ON DUPLICATE KEY UPDATE latitude = VALUES(latitude), longitude = VALUES(longitude);

-- ============================================
-- NAMAKKAL NEIGHBORHOODS
-- ============================================
INSERT INTO locations (name, latitude, longitude, district, nearby_city) VALUES
('Namakkal City', 11.7304, 78.1668, 'Namakkal', 'Namakkal'),
('Tiruchengode', 11.3050, 78.1733, 'Namakkal', 'Tiruchengode')
ON DUPLICATE KEY UPDATE latitude = VALUES(latitude), longitude = VALUES(longitude);

-- ============================================
-- CHENGALPATTU NEIGHBORHOODS
-- ============================================
INSERT INTO locations (name, latitude, longitude, district, nearby_city) VALUES
('Chengalpattu City', 12.6667, 80.1500, 'Chengalpattu', 'Chengalpattu'),
('Tambaram', 12.9249, 80.1278, 'Chengalpattu', 'Tambaram'),
('Mahabalipuram', 12.6369, 80.1933, 'Chengalpattu', 'Mahabalipuram')
ON DUPLICATE KEY UPDATE latitude = VALUES(latitude), longitude = VALUES(longitude);

-- Add Tamil translations for neighborhoods
INSERT INTO translations (entity_type, entity_id, language_code, field_name, translated_value)
SELECT 'location', l.id, 'ta', 'name',
    CASE 
        WHEN l.name = 'Adyar' THEN 'அடையார்'
        WHEN l.name = 'Besant Nagar' THEN 'பிசண்ட் நகர்'
        WHEN l.name = 'Mylapore' THEN 'மைலாப்பூர்'
        WHEN l.name = 'Triplicane' THEN 'திரிப்ளிகேன்'
        WHEN l.name = 'T. Nagar' THEN 'டி. நகர்'
        WHEN l.name = 'Kodambakkam' THEN 'கோடம்பாக்கம்'
        WHEN l.name = 'Velachery' THEN 'வேளச்சேரி'
        WHEN l.name = 'Madipakkam' THEN 'மாதிப்பாக்கம்'
        WHEN l.name = 'Nungambakkam' THEN 'நுங்கம்பாக்கம்'
        WHEN l.name = 'Chetpet' THEN 'சேத்பேட்'
        WHEN l.name = 'Alwarpet' THEN 'ஆல்வார்பேட்'
        WHEN l.name = 'Palavakkam' THEN 'பாளவக்கம்'
        WHEN l.name = 'Kovalam' THEN 'கோவளம்'
        WHEN l.name = 'Thiruvanmiyur' THEN 'திருவன்மியூர்'
        WHEN l.name = 'Mandaveli' THEN 'மண்டாவேளி'
        WHEN l.name = 'Santhome' THEN 'சாந்தோம்'
        WHEN l.name = 'Perambur' THEN 'பெரம்பூர்'
        WHEN l.name = 'Madhavaram' THEN 'மாதவரம்'
        WHEN l.name = 'Tondiarpet' THEN 'தொண்டியாப்பேட்'
        WHEN l.name = 'Tiruvottriyur' THEN 'திருவோத்திரியூர்'
        WHEN l.name = 'Teynampet' THEN 'டேனம்பேட்'
        WHEN l.name = 'Kilpauk' THEN 'கில்பாக்'
        WHEN l.name = 'Egmore' THEN 'எக்மோர்'
        ELSE l.name
    END
FROM locations l
WHERE (l.name IN ('Adyar', 'Besant Nagar', 'Mylapore', 'Triplicane', 'T. Nagar', 'Kodambakkam', 
                   'Velachery', 'Madipakkam', 'Nungambakkam', 'Chetpet', 'Alwarpet', 'Palavakkam',
                   'Kovalam', 'Thiruvanmiyur', 'Mandaveli', 'Santhome', 'Perambur', 'Madhavaram',
                   'Tondiarpet', 'Tiruvottriyur', 'Teynampet', 'Kilpauk', 'Egmore'))
AND NOT EXISTS (
    SELECT 1 FROM translations t 
    WHERE t.entity_type = 'location' 
    AND t.entity_id = l.id 
    AND t.language_code = 'ta' 
    AND t.field_name = 'name'
)
ON DUPLICATE KEY UPDATE translated_value = VALUES(translated_value);
