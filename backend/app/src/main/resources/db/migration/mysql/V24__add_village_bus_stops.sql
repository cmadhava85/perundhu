-- Migration to add village bus stops with accurate coordinates
-- Villages typically have bus stops (not bus stands) at their main locations
-- Coordinates are based on actual village center/bus stop locations

-- Virudhunagar District Villages
INSERT INTO locations (name, latitude, longitude, district, nearby_city) VALUES
('Srivilliputhur - Bus Stop', 9.5115, 77.6318, 'Virudhunagar', 'Srivilliputhur'),
('Aruppukottai - Bus Stop', 9.5147, 78.0957, 'Virudhunagar', 'Aruppukottai'),
('Sivakasi - Bus Stop', 9.4534, 77.7985, 'Virudhunagar', 'Sivakasi'),
('Rajapalayam - Bus Stop', 9.4532, 77.5561, 'Virudhunagar', 'Rajapalayam'),
('Sattur - Bus Stop', 9.3544, 77.9192, 'Virudhunagar', 'Sattur')
ON DUPLICATE KEY UPDATE latitude = VALUES(latitude), longitude = VALUES(longitude);

-- Madurai District Villages
INSERT INTO locations (name, latitude, longitude, district, nearby_city) VALUES
('Melur - Bus Stop', 10.0318, 78.3364, 'Madurai', 'Melur'),
('Usilampatti - Bus Stop', 9.9713, 77.7854, 'Madurai', 'Usilampatti'),
('Vadipatti - Bus Stop', 10.0158, 77.8967, 'Madurai', 'Vadipatti'),
('Thirumangalam - Bus Stop', 9.8239, 77.9831, 'Madurai', 'Thirumangalam'),
('Peraiyur - Bus Stop', 9.7336, 77.7968, 'Madurai', 'Peraiyur')
ON DUPLICATE KEY UPDATE latitude = VALUES(latitude), longitude = VALUES(longitude);

-- Theni District Villages
INSERT INTO locations (name, latitude, longitude, district, nearby_city) VALUES
('Bodinayakanur - Bus Stop', 10.0123, 77.3498, 'Theni', 'Bodinayakanur'),
('Periyakulam - Bus Stop', 10.1203, 77.5440, 'Theni', 'Periyakulam'),
('Andipatti - Bus Stop', 9.9928, 77.6056, 'Theni', 'Andipatti'),
('Uthamapalayam - Bus Stop', 9.8076, 77.3259, 'Theni', 'Uthamapalayam'),
('Cumbum - Bus Stop', 9.7366, 77.2825, 'Theni', 'Cumbum')
ON DUPLICATE KEY UPDATE latitude = VALUES(latitude), longitude = VALUES(longitude);

-- Dindigul District Villages
INSERT INTO locations (name, latitude, longitude, district, nearby_city) VALUES
('Palani - Bus Stop', 10.4507, 77.5163, 'Dindigul', 'Palani'),
('Oddanchatram - Bus Stop', 10.2862, 77.7524, 'Dindigul', 'Oddanchatram'),
('Natham - Bus Stop', 10.2247, 78.1917, 'Dindigul', 'Natham'),
('Vedasandur - Bus Stop', 10.5267, 77.9513, 'Dindigul', 'Vedasandur'),
('Nilakottai - Bus Stop', 10.1676, 77.8519, 'Dindigul', 'Nilakottai')
ON DUPLICATE KEY UPDATE latitude = VALUES(latitude), longitude = VALUES(longitude);

-- Tirunelveli District Villages
INSERT INTO locations (name, latitude, longitude, district, nearby_city) VALUES
('Sankarankovil - Bus Stop', 9.1756, 77.5356, 'Tirunelveli', 'Sankarankovil'),
('Ambasamudram - Bus Stop', 8.7117, 77.4533, 'Tirunelveli', 'Ambasamudram'),
('Cheranmahadevi - Bus Stop', 8.5792, 77.6015, 'Tirunelveli', 'Cheranmahadevi'),
('Nanguneri - Bus Stop', 8.4936, 77.6589, 'Tirunelveli', 'Nanguneri'),
('Palayamkottai - Bus Stop', 8.7214, 77.7494, 'Tirunelveli', 'Palayamkottai')
ON DUPLICATE KEY UPDATE latitude = VALUES(latitude), longitude = VALUES(longitude);

-- Tenkasi District Villages
INSERT INTO locations (name, latitude, longitude, district, nearby_city) VALUES
('Tenkasi - Bus Stop', 8.9594, 77.3106, 'Tenkasi', 'Tenkasi'),
('Kadayanallur - Bus Stop', 9.0717, 77.3447, 'Tenkasi', 'Kadayanallur'),
('Shenkottai - Bus Stop', 8.9709, 77.2428, 'Tenkasi', 'Shenkottai'),
('Surandai - Bus Stop', 8.9819, 77.4272, 'Tenkasi', 'Surandai'),
('Alangulam - Bus Stop', 8.8633, 77.4972, 'Tenkasi', 'Alangulam')
ON DUPLICATE KEY UPDATE latitude = VALUES(latitude), longitude = VALUES(longitude);

-- Ramanathapuram District Villages
INSERT INTO locations (name, latitude, longitude, district, nearby_city) VALUES
('Paramakudi - Bus Stop', 9.5426, 78.5910, 'Ramanathapuram', 'Paramakudi'),
('Mudukulathur - Bus Stop', 9.3414, 78.5137, 'Ramanathapuram', 'Mudukulathur'),
('Kamuthi - Bus Stop', 9.4043, 78.3742, 'Ramanathapuram', 'Kamuthi'),
('Mandapam - Bus Stop', 9.2797, 79.1217, 'Ramanathapuram', 'Mandapam'),
('Tiruvadanai - Bus Stop', 9.7672, 78.9939, 'Ramanathapuram', 'Tiruvadanai')
ON DUPLICATE KEY UPDATE latitude = VALUES(latitude), longitude = VALUES(longitude);

-- Sivaganga District Villages
INSERT INTO locations (name, latitude, longitude, district, nearby_city) VALUES
('Sivaganga - Bus Stop', 9.8477, 78.4889, 'Sivaganga', 'Sivaganga'),
('Manamadurai - Bus Stop', 9.6811, 78.4694, 'Sivaganga', 'Manamadurai'),
('Devakottai - Bus Stop', 9.9483, 78.8219, 'Sivaganga', 'Devakottai'),
('Tirupathur - Bus Stop', 10.1246, 78.7897, 'Sivaganga', 'Tirupathur'),
('Ilayangudi - Bus Stop', 9.6610, 78.6144, 'Sivaganga', 'Ilayangudi')
ON DUPLICATE KEY UPDATE latitude = VALUES(latitude), longitude = VALUES(longitude);

-- Coimbatore District Villages
INSERT INTO locations (name, latitude, longitude, district, nearby_city) VALUES
('Pollachi - Bus Stop', 10.6588, 77.0089, 'Coimbatore', 'Pollachi'),
('Mettupalayam - Bus Stop', 11.2992, 76.9376, 'Coimbatore', 'Mettupalayam'),
('Annur - Bus Stop', 11.2312, 77.1067, 'Coimbatore', 'Annur'),
('Sulur - Bus Stop', 11.0367, 77.1283, 'Coimbatore', 'Sulur'),
('Valparai - Bus Stop', 10.3269, 76.9572, 'Coimbatore', 'Valparai')
ON DUPLICATE KEY UPDATE latitude = VALUES(latitude), longitude = VALUES(longitude);

-- Salem District Villages
INSERT INTO locations (name, latitude, longitude, district, nearby_city) VALUES
('Attur - Bus Stop', 11.5967, 78.6017, 'Salem', 'Attur'),
('Mettur - Bus Stop', 11.7886, 77.8005, 'Salem', 'Mettur'),
('Omalur - Bus Stop', 11.7450, 78.0436, 'Salem', 'Omalur'),
('Sankari - Bus Stop', 11.4879, 77.8675, 'Salem', 'Sankari'),
('Yercaud - Bus Stop', 11.7757, 78.2089, 'Salem', 'Yercaud')
ON DUPLICATE KEY UPDATE latitude = VALUES(latitude), longitude = VALUES(longitude);

-- Erode District Villages
INSERT INTO locations (name, latitude, longitude, district, nearby_city) VALUES
('Gobichettipalayam - Bus Stop', 11.4528, 77.4333, 'Erode', 'Gobichettipalayam'),
('Sathyamangalam - Bus Stop', 11.5056, 77.2381, 'Erode', 'Sathyamangalam'),
('Bhavani - Bus Stop', 11.4450, 77.6828, 'Erode', 'Bhavani'),
('Perundurai - Bus Stop', 11.2743, 77.5871, 'Erode', 'Perundurai'),
('Kodumudi - Bus Stop', 11.0777, 77.8881, 'Erode', 'Kodumudi')
ON DUPLICATE KEY UPDATE latitude = VALUES(latitude), longitude = VALUES(longitude);

-- Tiruppur District Villages
INSERT INTO locations (name, latitude, longitude, district, nearby_city) VALUES
('Avinashi - Bus Stop', 11.1933, 77.2664, 'Tiruppur', 'Avinashi'),
('Palladam - Bus Stop', 10.9906, 77.2867, 'Tiruppur', 'Palladam'),
('Udumalpet - Bus Stop', 10.5883, 77.2481, 'Tiruppur', 'Udumalpet'),
('Dharapuram - Bus Stop', 10.7372, 77.5219, 'Tiruppur', 'Dharapuram'),
('Kangeyam - Bus Stop', 10.9092, 77.5603, 'Tiruppur', 'Kangeyam')
ON DUPLICATE KEY UPDATE latitude = VALUES(latitude), longitude = VALUES(longitude);

-- Thanjavur District Villages  
INSERT INTO locations (name, latitude, longitude, district, nearby_city) VALUES
('Thiruvaiyaru - Bus Stop', 10.8803, 79.1039, 'Thanjavur', 'Thiruvaiyaru'),
('Papanasam - Bus Stop', 10.9247, 79.2708, 'Thanjavur', 'Papanasam'),
('Orathanadu - Bus Stop', 10.6472, 79.2283, 'Thanjavur', 'Orathanadu'),
('Pattukkottai - Bus Stop', 10.4247, 79.3214, 'Thanjavur', 'Pattukkottai'),
('Peravurani - Bus Stop', 10.2892, 79.1917, 'Thanjavur', 'Peravurani')
ON DUPLICATE KEY UPDATE latitude = VALUES(latitude), longitude = VALUES(longitude);

-- Nagapattinam District Villages
INSERT INTO locations (name, latitude, longitude, district, nearby_city) VALUES
('Nagapattinam - Bus Stop', 10.7656, 79.8424, 'Nagapattinam', 'Nagapattinam'),
('Sirkazhi - Bus Stop', 11.2367, 79.7381, 'Nagapattinam', 'Sirkazhi'),
('Vedaranyam - Bus Stop', 10.3703, 79.8500, 'Nagapattinam', 'Vedaranyam'),
('Mayiladuthurai - Bus Stop', 11.1033, 79.6533, 'Nagapattinam', 'Mayiladuthurai'),
('Tharangambadi - Bus Stop', 11.0292, 79.8508, 'Nagapattinam', 'Tharangambadi')
ON DUPLICATE KEY UPDATE latitude = VALUES(latitude), longitude = VALUES(longitude);

-- Kanyakumari District Villages
INSERT INTO locations (name, latitude, longitude, district, nearby_city) VALUES
('Marthandam - Bus Stop', 8.3072, 77.2203, 'Kanyakumari', 'Marthandam'),
('Colachel - Bus Stop', 8.1764, 77.2547, 'Kanyakumari', 'Colachel'),
('Padmanabhapuram - Bus Stop', 8.2478, 77.3256, 'Kanyakumari', 'Padmanabhapuram'),
('Thuckalay - Bus Stop', 8.2528, 77.1525, 'Kanyakumari', 'Thuckalay'),
('Kuzhithurai - Bus Stop', 8.3019, 77.1956, 'Kanyakumari', 'Kuzhithurai')
ON DUPLICATE KEY UPDATE latitude = VALUES(latitude), longitude = VALUES(longitude);

-- Add Tamil translations for new bus stops
INSERT INTO translations (entity_type, entity_id, language_code, field_name, translated_value)
SELECT 'location', l.id, 'ta', 'name',
    CASE 
        WHEN l.name LIKE 'Srivilliputhur%' THEN 'ஸ்ரீவில்லிபுத்தூர் - பேருந்து நிறுத்தம்'
        WHEN l.name LIKE 'Aruppukottai%' THEN 'அருப்புக்கோட்டை - பேருந்து நிறுத்தம்'
        WHEN l.name LIKE 'Sivakasi%' THEN 'சிவகாசி - பேருந்து நிறுத்தம்'
        WHEN l.name LIKE 'Rajapalayam%' THEN 'ராஜபாளையம் - பேருந்து நிறுத்தம்'
        WHEN l.name LIKE 'Sattur%' THEN 'சாத்தூர் - பேருந்து நிறுத்தம்'
        WHEN l.name LIKE 'Melur%' THEN 'மேலூர் - பேருந்து நிறுத்தம்'
        WHEN l.name LIKE 'Palani%' THEN 'பழனி - பேருந்து நிறுத்தம்'
        WHEN l.name LIKE 'Pollachi%' THEN 'பொள்ளாச்சி - பேருந்து நிறுத்தம்'
        WHEN l.name LIKE 'Mettupalayam%' THEN 'மேட்டுப்பாளையம் - பேருந்து நிறுத்தம்'
        WHEN l.name LIKE 'Gobichettipalayam%' THEN 'கோபிசெட்டிபாளையம் - பேருந்து நிறுத்தம்'
        WHEN l.name LIKE 'Sankarankovil%' THEN 'சங்கரன்கோவில் - பேருந்து நிறுத்தம்'
        WHEN l.name LIKE 'Bodinayakanur%' THEN 'போடிநாயக்கனூர் - பேருந்து நிறுத்தம்'
        WHEN l.name LIKE 'Paramakudi%' THEN 'பரமக்குடி - பேருந்து நிறுத்தம்'
        WHEN l.name LIKE 'Sivaganga%Bus Stop%' THEN 'சிவகங்கை - பேருந்து நிறுத்தம்'
        WHEN l.name LIKE 'Marthandam%' THEN 'மார்த்தாண்டம் - பேருந்து நிறுத்தம்'
        ELSE l.name
    END
FROM locations l
WHERE l.name LIKE '% - Bus Stop'
AND NOT EXISTS (
    SELECT 1 FROM translations t 
    WHERE t.entity_type = 'location' 
    AND t.entity_id = l.id 
    AND t.language_code = 'ta' 
    AND t.field_name = 'name'
)
ON DUPLICATE KEY UPDATE translated_value = VALUES(translated_value);
