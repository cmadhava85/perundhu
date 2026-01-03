-- Migration to add bus stands with accurate coordinates
-- Each major city's bus stands are added as separate locations
-- Coordinates are based on actual bus stand locations

-- Madurai Bus Stands (coordinates verified from OpenStreetMap)
INSERT INTO locations (name, latitude, longitude, district, nearby_city) VALUES
('Madurai - Mattuthavani', 9.9441, 78.1560, 'Madurai', 'Madurai'),
('Madurai - Arapalayam', 9.9320, 78.1007, 'Madurai', 'Madurai'),
('Madurai - Periyar', 9.9161, 78.1112, 'Madurai', 'Madurai')
ON DUPLICATE KEY UPDATE latitude = VALUES(latitude), longitude = VALUES(longitude);

-- Chennai Bus Stands
INSERT INTO locations (name, latitude, longitude, district, nearby_city) VALUES
('Chennai - CMBT (Koyambedu)', 13.0694, 80.1948, 'Chennai', 'Chennai'),
('Chennai - Madhavaram (MMBS)', 13.1482, 80.2317, 'Chennai', 'Chennai'),
('Chennai - Tambaram', 12.9249, 80.1278, 'Chennai', 'Chennai'),
('Chennai - Broadway', 13.0896, 80.2867, 'Chennai', 'Chennai'),
('Chennai - Kilambakkam (New CMBT)', 12.8089, 80.0194, 'Chennai', 'Chennai')
ON DUPLICATE KEY UPDATE latitude = VALUES(latitude), longitude = VALUES(longitude);

-- Coimbatore Bus Stands
INSERT INTO locations (name, latitude, longitude, district, nearby_city) VALUES
('Coimbatore - Gandhipuram', 11.0183, 76.9725, 'Coimbatore', 'Coimbatore'),
('Coimbatore - Ukkadam', 10.9923, 76.9614, 'Coimbatore', 'Coimbatore'),
('Coimbatore - Singanallur', 11.0059, 77.0319, 'Coimbatore', 'Coimbatore'),
('Coimbatore - Mettupalayam Road', 11.0423, 76.9417, 'Coimbatore', 'Coimbatore')
ON DUPLICATE KEY UPDATE latitude = VALUES(latitude), longitude = VALUES(longitude);

-- Trichy (Tiruchirappalli) Bus Stands
INSERT INTO locations (name, latitude, longitude, district, nearby_city) VALUES
('Trichy - Central', 10.8050, 78.6856, 'Tiruchirappalli', 'Trichy'),
('Trichy - Chatram', 10.8231, 78.6897, 'Tiruchirappalli', 'Trichy'),
('Trichy - Srirangam', 10.8627, 78.6897, 'Tiruchirappalli', 'Trichy')
ON DUPLICATE KEY UPDATE latitude = VALUES(latitude), longitude = VALUES(longitude);

-- Salem Bus Stands
INSERT INTO locations (name, latitude, longitude, district, nearby_city) VALUES
('Salem - New Bus Stand', 11.6508, 78.1556, 'Salem', 'Salem'),
('Salem - Old Bus Stand', 11.6643, 78.1460, 'Salem', 'Salem'),
('Salem - Town Bus Stand', 11.6600, 78.1580, 'Salem', 'Salem')
ON DUPLICATE KEY UPDATE latitude = VALUES(latitude), longitude = VALUES(longitude);

-- Tirunelveli Bus Stands
INSERT INTO locations (name, latitude, longitude, district, nearby_city) VALUES
('Tirunelveli - New Bus Stand', 8.7139, 77.7567, 'Tirunelveli', 'Tirunelveli'),
('Tirunelveli - Old Bus Stand', 8.7275, 77.6893, 'Tirunelveli', 'Tirunelveli'),
('Tirunelveli - Junction', 8.7261, 77.6844, 'Tirunelveli', 'Tirunelveli')
ON DUPLICATE KEY UPDATE latitude = VALUES(latitude), longitude = VALUES(longitude);

-- Erode Bus Stands
INSERT INTO locations (name, latitude, longitude, district, nearby_city) VALUES
('Erode - New Bus Stand', 11.3394, 77.7264, 'Erode', 'Erode'),
('Erode - Old Bus Stand', 11.3410, 77.7172, 'Erode', 'Erode')
ON DUPLICATE KEY UPDATE latitude = VALUES(latitude), longitude = VALUES(longitude);

-- Thanjavur Bus Stands
INSERT INTO locations (name, latitude, longitude, district, nearby_city) VALUES
('Thanjavur - New Bus Stand', 10.7870, 79.1378, 'Thanjavur', 'Thanjavur'),
('Thanjavur - Old Bus Stand', 10.7867, 79.1319, 'Thanjavur', 'Thanjavur')
ON DUPLICATE KEY UPDATE latitude = VALUES(latitude), longitude = VALUES(longitude);

-- Tiruppur Bus Stands
INSERT INTO locations (name, latitude, longitude, district, nearby_city) VALUES
('Tiruppur - New Bus Stand', 11.1085, 77.3411, 'Tiruppur', 'Tiruppur'),
('Tiruppur - Old Bus Stand', 11.1075, 77.3389, 'Tiruppur', 'Tiruppur')
ON DUPLICATE KEY UPDATE latitude = VALUES(latitude), longitude = VALUES(longitude);

-- Vellore Bus Stands
INSERT INTO locations (name, latitude, longitude, district, nearby_city) VALUES
('Vellore - Central Bus Stand', 12.9165, 79.1325, 'Vellore', 'Vellore'),
('Vellore - Katpadi', 12.9692, 79.1444, 'Vellore', 'Vellore')
ON DUPLICATE KEY UPDATE latitude = VALUES(latitude), longitude = VALUES(longitude);

-- Dindigul Bus Stands
INSERT INTO locations (name, latitude, longitude, district, nearby_city) VALUES
('Dindigul - New Bus Stand', 10.3624, 77.9695, 'Dindigul', 'Dindigul'),
('Dindigul - Old Bus Stand', 10.3571, 77.9750, 'Dindigul', 'Dindigul')
ON DUPLICATE KEY UPDATE latitude = VALUES(latitude), longitude = VALUES(longitude);

-- Theni Bus Stands
INSERT INTO locations (name, latitude, longitude, district, nearby_city) VALUES
('Theni - New Bus Stand', 10.0104, 77.4760, 'Theni', 'Theni'),
('Theni - Old Bus Stand', 10.0063, 77.4806, 'Theni', 'Theni')
ON DUPLICATE KEY UPDATE latitude = VALUES(latitude), longitude = VALUES(longitude);

-- Kanyakumari / Nagercoil Bus Stands
INSERT INTO locations (name, latitude, longitude, district, nearby_city) VALUES
('Nagercoil - New Bus Stand', 8.1833, 77.4119, 'Kanyakumari', 'Nagercoil'),
('Nagercoil - Old Bus Stand', 8.1781, 77.4342, 'Kanyakumari', 'Nagercoil'),
('Kanyakumari - Bus Stand', 8.0883, 77.5385, 'Kanyakumari', 'Kanyakumari')
ON DUPLICATE KEY UPDATE latitude = VALUES(latitude), longitude = VALUES(longitude);

-- Thoothukudi Bus Stands
INSERT INTO locations (name, latitude, longitude, district, nearby_city) VALUES
('Thoothukudi - New Bus Stand', 8.7642, 78.1348, 'Thoothukudi', 'Thoothukudi'),
('Thoothukudi - Old Bus Stand', 8.8053, 78.1461, 'Thoothukudi', 'Thoothukudi')
ON DUPLICATE KEY UPDATE latitude = VALUES(latitude), longitude = VALUES(longitude);

-- Karaikudi Bus Stands
INSERT INTO locations (name, latitude, longitude, district, nearby_city) VALUES
('Karaikudi - New Bus Stand', 10.0739, 78.7678, 'Sivaganga', 'Karaikudi'),
('Karaikudi - Old Bus Stand', 10.0715, 78.7844, 'Sivaganga', 'Karaikudi')
ON DUPLICATE KEY UPDATE latitude = VALUES(latitude), longitude = VALUES(longitude);

-- Kumbakonam Bus Stands
INSERT INTO locations (name, latitude, longitude, district, nearby_city) VALUES
('Kumbakonam - New Bus Stand', 10.9609, 79.3881, 'Thanjavur', 'Kumbakonam'),
('Kumbakonam - Old Bus Stand', 10.9602, 79.3845, 'Thanjavur', 'Kumbakonam')
ON DUPLICATE KEY UPDATE latitude = VALUES(latitude), longitude = VALUES(longitude);

-- Villupuram Bus Stand
INSERT INTO locations (name, latitude, longitude, district, nearby_city) VALUES
('Villupuram - Bus Stand', 11.9401, 79.4861, 'Villupuram', 'Villupuram')
ON DUPLICATE KEY UPDATE latitude = VALUES(latitude), longitude = VALUES(longitude);

-- Cuddalore Bus Stand
INSERT INTO locations (name, latitude, longitude, district, nearby_city) VALUES
('Cuddalore - New Bus Stand', 11.7480, 79.7714, 'Cuddalore', 'Cuddalore'),
('Cuddalore - Old Bus Stand', 11.7560, 79.7633, 'Cuddalore', 'Cuddalore')
ON DUPLICATE KEY UPDATE latitude = VALUES(latitude), longitude = VALUES(longitude);

-- Ooty Bus Stand
INSERT INTO locations (name, latitude, longitude, district, nearby_city) VALUES
('Ooty - Bus Stand', 11.4102, 76.6950, 'Nilgiris', 'Ooty')
ON DUPLICATE KEY UPDATE latitude = VALUES(latitude), longitude = VALUES(longitude);

-- Kodaikanal Bus Stand
INSERT INTO locations (name, latitude, longitude, district, nearby_city) VALUES
('Kodaikanal - Bus Stand', 10.2381, 77.4892, 'Dindigul', 'Kodaikanal')
ON DUPLICATE KEY UPDATE latitude = VALUES(latitude), longitude = VALUES(longitude);

-- Add Tamil translations for new bus stands
INSERT INTO translations (entity_type, entity_id, language_code, field_name, translated_value)
SELECT 'location', l.id, 'ta', 'name',
    CASE 
        WHEN l.name LIKE 'Madurai%Mattuthavani%' THEN 'மதுரை - மாட்டுத்தாவணி'
        WHEN l.name LIKE 'Madurai%Arapalayam%' THEN 'மதுரை - ஆரப்பாளையம்'
        WHEN l.name LIKE 'Madurai%Periyar%' THEN 'மதுரை - பெரியார்'
        WHEN l.name LIKE 'Chennai%CMBT%' THEN 'சென்னை - சிஎம்பிடி (கோயம்பேடு)'
        WHEN l.name LIKE 'Chennai%Madhavaram%' THEN 'சென்னை - மாதவரம்'
        WHEN l.name LIKE 'Chennai%Tambaram%' THEN 'சென்னை - தாம்பரம்'
        WHEN l.name LIKE 'Chennai%Broadway%' THEN 'சென்னை - பிராட்வே'
        WHEN l.name LIKE 'Chennai%Kilambakkam%' THEN 'சென்னை - கிளாம்பாக்கம்'
        WHEN l.name LIKE 'Coimbatore%Gandhipuram%' THEN 'கோயம்புத்தூர் - காந்திபுரம்'
        WHEN l.name LIKE 'Coimbatore%Ukkadam%' THEN 'கோயம்புத்தூர் - உக்கடம்'
        WHEN l.name LIKE 'Trichy%Central%' THEN 'திருச்சி - மத்திய'
        WHEN l.name LIKE 'Trichy%Chatram%' THEN 'திருச்சி - சத்திரம்'
        ELSE l.name
    END
FROM locations l
WHERE l.name LIKE '% - %'
AND NOT EXISTS (
    SELECT 1 FROM translations t 
    WHERE t.entity_type = 'location' 
    AND t.entity_id = l.id 
    AND t.language_code = 'ta' 
    AND t.field_name = 'name'
)
ON DUPLICATE KEY UPDATE translated_value = VALUES(translated_value);
