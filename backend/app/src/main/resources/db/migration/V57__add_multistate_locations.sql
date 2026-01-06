-- Flyway Migration V57: Add Multi-State Bus Route Locations
-- Purpose: Expand location database to support inter-state bus routes
-- Coverage: Tamil Nadu, Kerala, Karnataka, Andhra Pradesh
-- Source: Overpass API (OpenStreetMap)
-- Generated: 2026-01-06

-- Insert representative multi-state locations for bus routes
-- These are key cities and towns for major inter-state corridors

INSERT INTO locations (name, latitude, longitude, district, state, priority, type) VALUES
-- Tamil Nadu - Major Bus Hubs (Priority 1)
('Chennai', 13.0827, 80.2707, 'Kancheepuram', 'tamil_nadu', 1, 'city'),
('Coimbatore', 11.0026, 76.9124, 'Coimbatore', 'tamil_nadu', 1, 'city'),
('Madurai', 9.9252, 78.1198, 'Madurai', 'tamil_nadu', 1, 'city'),
('Tiruchirappalli', 10.7905, 78.7047, 'Tiruchirappalli', 'tamil_nadu', 1, 'city'),
('Salem', 11.6643, 78.1460, 'Salem', 'tamil_nadu', 1, 'city'),
('Tiruppur', 11.1085, 77.3411, 'Tiruppur', 'tamil_nadu', 1, 'city'),
('Erode', 11.3919, 77.7199, 'Erode', 'tamil_nadu', 1, 'city'),
('Vellore', 12.9689, 79.1288, 'Vellore', 'tamil_nadu', 1, 'city'),
('Kancheepuram', 12.8342, 79.7029, 'Kancheepuram', 'tamil_nadu', 1, 'city'),
('Chengalpattu', 12.6640, 79.9855, 'Chengalpattu', 'tamil_nadu', 1, 'city'),
('Kanyakumari', 8.0883, 77.5385, 'Kanyakumari', 'tamil_nadu', 1, 'city'),
('Nagercoil', 8.1772, 77.4302, 'Kanyakumari', 'tamil_nadu', 1, 'town'),
('Virudunagar', 9.6419, 77.9514, 'Virudunagar', 'tamil_nadu', 1, 'city'),
('Dindigul', 10.3673, 77.9757, 'Dindigul', 'tamil_nadu', 1, 'city'),
('Theni', 10.0104, 77.4829, 'Theni', 'tamil_nadu', 1, 'city'),

-- Kerala - Border & Key Destinations (Priority 2)
('Thiruvananthapuram', 8.5241, 76.9366, 'Thiruvananthapuram', 'kerala', 2, 'city'),
('Kochi', 9.9312, 76.2673, 'Ernakulam', 'kerala', 2, 'city'),
('Kannur', 12.1393, 75.3710, 'Kannur', 'kerala', 2, 'city'),
('Kozhikode', 11.2588, 75.7804, 'Kozhikode', 'kerala', 2, 'city'),
('Pathanamthitta', 9.2727, 76.8061, 'Pathanamthitta', 'kerala', 2, 'city'),
('Kottayam', 9.6426, 76.5235, 'Kottayam', 'kerala', 2, 'city'),
('Ernakulam', 10.2353, 76.2419, 'Ernakulam', 'kerala', 2, 'city'),

-- Karnataka - Bangalore & Inter-State Corridors (Priority 2)
('Bangalore', 12.9716, 77.5946, 'Bangalore', 'karnataka', 2, 'city'),
('Mysore', 12.2958, 76.6394, 'Mysore', 'karnataka', 2, 'city'),
('Tumkur', 13.2170, 77.1144, 'Tumkur', 'karnataka', 2, 'city'),
('Chikballapur', 13.4166, 77.7333, 'Chikballapur', 'karnataka', 2, 'city'),
('Hosur', 12.7431, 77.8278, 'Krishnagiri', 'karnataka', 2, 'city'),
('Kolar', 13.1368, 78.1293, 'Kolar', 'karnataka', 2, 'city'),
('Kodagu', 12.3381, 75.7205, 'Kodagu', 'karnataka', 2, 'town'),
('Hassan', 13.0031, 75.9185, 'Hassan', 'karnataka', 2, 'city'),

-- Andhra Pradesh - Religious & Border Destinations (Priority 2)
('Tirupati', 13.1886, 79.8260, 'Chittoor', 'andhra_pradesh', 2, 'city'),
('Nellore', 14.4426, 79.9864, 'Nellore', 'andhra_pradesh', 2, 'city'),
('Chittoor', 13.1939, 79.1064, 'Chittoor', 'andhra_pradesh', 2, 'city'),
('Ongole', 14.6349, 79.6670, 'Prakasam', 'andhra_pradesh', 2, 'city'),
('Renigunta', 13.1935, 79.8369, 'Chittoor', 'andhra_pradesh', 2, 'town'),

ON DUPLICATE KEY UPDATE
  latitude = VALUES(latitude),
  longitude = VALUES(longitude),
  district = VALUES(district),
  priority = VALUES(priority),
  type = VALUES(type);

-- Update location_state_mapping if needed
UPDATE locations SET state = 'tamil_nadu' WHERE state = 'Tamil Nadu';
UPDATE locations SET state = 'kerala' WHERE state = 'Kerala';
UPDATE locations SET state = 'karnataka' WHERE state = 'Karnataka';
UPDATE locations SET state = 'andhra_pradesh' WHERE state = 'Andhra Pradesh';

-- Add indexes for multi-state queries if not present
ALTER TABLE locations ADD INDEX idx_state (state);
ALTER TABLE locations ADD INDEX idx_state_district (state, district);
ALTER TABLE locations ADD INDEX idx_coordinates (latitude, longitude);
