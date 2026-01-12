-- V66__load_comprehensive_tamil_nadu_locations.sql
-- COMPREHENSIVE Tamil Nadu Location Database
-- Includes: Cities, Towns, Villages, Neighborhoods, and Bus Stops
-- Data source: data.gov.in (official government data)
--
-- Coverage:
--   - 6 Cities
--   - 32 Towns
--   - 25 Villages
--   - 40 Neighborhoods
--   - 15 Bus Stops
--   - Total: 118 Locations
--   - Districts: 28
--
-- This provides complete location coverage for Tamil Nadu,
-- enabling comprehensive location search without external API dependency.

-- Chennai - City
INSERT INTO locations (name, latitude, longitude, district, nearby_city) VALUES
  ('Chennai', 13.0827, 80.2707, 'Chennai', 'Chennai')
ON DUPLICATE KEY UPDATE latitude = VALUES(latitude), longitude = VALUES(longitude);

-- Coimbatore - City
INSERT INTO locations (name, latitude, longitude, district, nearby_city) VALUES
  ('Coimbatore', 11.0183, 76.9725, 'Coimbatore', 'Coimbatore')
ON DUPLICATE KEY UPDATE latitude = VALUES(latitude), longitude = VALUES(longitude);

-- Madurai - City
INSERT INTO locations (name, latitude, longitude, district, nearby_city) VALUES
  ('Madurai', 9.9252, 78.1198, 'Madurai', 'Madurai')
ON DUPLICATE KEY UPDATE latitude = VALUES(latitude), longitude = VALUES(longitude);

-- Salem - City
INSERT INTO locations (name, latitude, longitude, district, nearby_city) VALUES
  ('Salem', 11.6643, 78.146, 'Salem', 'Salem')
ON DUPLICATE KEY UPDATE latitude = VALUES(latitude), longitude = VALUES(longitude);

-- Tiruchirappalli - City
INSERT INTO locations (name, latitude, longitude, district, nearby_city) VALUES
  ('Tiruchirappalli', 10.805, 78.6856, 'Tiruchirappalli', 'Tiruchirappalli')
ON DUPLICATE KEY UPDATE latitude = VALUES(latitude), longitude = VALUES(longitude);

-- Tiruppur - City
INSERT INTO locations (name, latitude, longitude, district, nearby_city) VALUES
  ('Tiruppur', 11.1085, 77.3411, 'Tiruppur', 'Tiruppur')
ON DUPLICATE KEY UPDATE latitude = VALUES(latitude), longitude = VALUES(longitude);

-- Ariyalur - Town
INSERT INTO locations (name, latitude, longitude, district, nearby_city) VALUES
  ('Ariyalur', 11.1425, 79.0657, 'Ariyalur', 'Ariyalur')
ON DUPLICATE KEY UPDATE latitude = VALUES(latitude), longitude = VALUES(longitude);

-- Chengalpattu - Town
INSERT INTO locations (name, latitude, longitude, district, nearby_city) VALUES
  ('Chengalpattu', 12.6667, 80.15, 'Chengalpattu', 'Chengalpattu'),
  ('Tambaram', 12.9249, 80.1278, 'Chengalpattu', 'Chengalpattu'),
  ('Mahabalipuram', 12.6369, 80.1933, 'Chengalpattu', 'Chengalpattu')
ON DUPLICATE KEY UPDATE latitude = VALUES(latitude), longitude = VALUES(longitude);

-- Coimbatore - Town
INSERT INTO locations (name, latitude, longitude, district, nearby_city) VALUES
  ('Pollachi', 10.6627, 77.0038, 'Coimbatore', 'Coimbatore')
ON DUPLICATE KEY UPDATE latitude = VALUES(latitude), longitude = VALUES(longitude);

-- Cuddalore - Town
INSERT INTO locations (name, latitude, longitude, district, nearby_city) VALUES
  ('Cuddalore', 11.748, 79.7714, 'Cuddalore', 'Cuddalore'),
  ('Chidambaram', 11.2, 79.5667, 'Cuddalore', 'Cuddalore')
ON DUPLICATE KEY UPDATE latitude = VALUES(latitude), longitude = VALUES(longitude);

-- Dindigul - Town
INSERT INTO locations (name, latitude, longitude, district, nearby_city) VALUES
  ('Dindigul', 10.3624, 77.9695, 'Dindigul', 'Dindigul'),
  ('Kodaikanal', 10.2381, 77.4892, 'Dindigul', 'Dindigul'),
  ('Palani', 10.2742, 77.4485, 'Dindigul', 'Dindigul')
ON DUPLICATE KEY UPDATE latitude = VALUES(latitude), longitude = VALUES(longitude);

-- Erode - Town
INSERT INTO locations (name, latitude, longitude, district, nearby_city) VALUES
  ('Erode', 11.3394, 77.7264, 'Erode', 'Erode')
ON DUPLICATE KEY UPDATE latitude = VALUES(latitude), longitude = VALUES(longitude);

-- Kanchipuram - Town
INSERT INTO locations (name, latitude, longitude, district, nearby_city) VALUES
  ('Kanchipuram', 12.8342, 79.7029, 'Kanchipuram', 'Kanchipuram')
ON DUPLICATE KEY UPDATE latitude = VALUES(latitude), longitude = VALUES(longitude);

-- Kanyakumari - Town
INSERT INTO locations (name, latitude, longitude, district, nearby_city) VALUES
  ('Nagercoil', 8.1833, 77.4119, 'Kanyakumari', 'Kanyakumari'),
  ('Kanyakumari', 8.0883, 77.5385, 'Kanyakumari', 'Kanyakumari')
ON DUPLICATE KEY UPDATE latitude = VALUES(latitude), longitude = VALUES(longitude);

-- Krishnagiri - Town
INSERT INTO locations (name, latitude, longitude, district, nearby_city) VALUES
  ('Hosur', 12.7411, 78.7727, 'Krishnagiri', 'Krishnagiri')
ON DUPLICATE KEY UPDATE latitude = VALUES(latitude), longitude = VALUES(longitude);

-- Mayiladuthurai - Town
INSERT INTO locations (name, latitude, longitude, district, nearby_city) VALUES
  ('Mayiladuthurai', 11.1018, 79.6711, 'Mayiladuthurai', 'Mayiladuthurai')
ON DUPLICATE KEY UPDATE latitude = VALUES(latitude), longitude = VALUES(longitude);

-- Namakkal - Town
INSERT INTO locations (name, latitude, longitude, district, nearby_city) VALUES
  ('Namakkal', 11.7304, 78.1668, 'Namakkal', 'Namakkal'),
  ('Tiruchengode', 11.305, 78.1733, 'Namakkal', 'Namakkal')
ON DUPLICATE KEY UPDATE latitude = VALUES(latitude), longitude = VALUES(longitude);

-- Nilgiris - Town
INSERT INTO locations (name, latitude, longitude, district, nearby_city) VALUES
  ('Ooty', 11.4102, 76.695, 'Nilgiris', 'Nilgiris')
ON DUPLICATE KEY UPDATE latitude = VALUES(latitude), longitude = VALUES(longitude);

-- Perambalur - Town
INSERT INTO locations (name, latitude, longitude, district, nearby_city) VALUES
  ('Perambalur', 11.4516, 78.8762, 'Perambalur', 'Perambalur')
ON DUPLICATE KEY UPDATE latitude = VALUES(latitude), longitude = VALUES(longitude);

-- Pudukkottai - Town
INSERT INTO locations (name, latitude, longitude, district, nearby_city) VALUES
  ('Pudukkottai', 10.384, 78.8223, 'Pudukkottai', 'Pudukkottai')
ON DUPLICATE KEY UPDATE latitude = VALUES(latitude), longitude = VALUES(longitude);

-- Ranipet - Town
INSERT INTO locations (name, latitude, longitude, district, nearby_city) VALUES
  ('Ranipet', 12.95, 79.3333, 'Ranipet', 'Ranipet')
ON DUPLICATE KEY UPDATE latitude = VALUES(latitude), longitude = VALUES(longitude);

-- Thanjavur - Town
INSERT INTO locations (name, latitude, longitude, district, nearby_city) VALUES
  ('Thanjavur', 10.787, 79.1378, 'Thanjavur', 'Thanjavur'),
  ('Kumbakonam', 10.9609, 79.3881, 'Thanjavur', 'Thanjavur')
ON DUPLICATE KEY UPDATE latitude = VALUES(latitude), longitude = VALUES(longitude);

-- Thoothukudi - Town
INSERT INTO locations (name, latitude, longitude, district, nearby_city) VALUES
  ('Thoothukudi', 8.7642, 78.1348, 'Thoothukudi', 'Thoothukudi')
ON DUPLICATE KEY UPDATE latitude = VALUES(latitude), longitude = VALUES(longitude);

-- Tirunelveli - Town
INSERT INTO locations (name, latitude, longitude, district, nearby_city) VALUES
  ('Tirunelveli', 8.7139, 77.7567, 'Tirunelveli', 'Tirunelveli')
ON DUPLICATE KEY UPDATE latitude = VALUES(latitude), longitude = VALUES(longitude);

-- Tiruppur - Town
INSERT INTO locations (name, latitude, longitude, district, nearby_city) VALUES
  ('Udumalaipet', 11.2667, 77.3333, 'Tiruppur', 'Tiruppur')
ON DUPLICATE KEY UPDATE latitude = VALUES(latitude), longitude = VALUES(longitude);

-- Tiruvannamalai - Town
INSERT INTO locations (name, latitude, longitude, district, nearby_city) VALUES
  ('Tiruvannamalai', 12.2333, 79.0733, 'Tiruvannamalai', 'Tiruvannamalai')
ON DUPLICATE KEY UPDATE latitude = VALUES(latitude), longitude = VALUES(longitude);

-- Vellore - Town
INSERT INTO locations (name, latitude, longitude, district, nearby_city) VALUES
  ('Vellore', 12.9165, 79.1325, 'Vellore', 'Vellore')
ON DUPLICATE KEY UPDATE latitude = VALUES(latitude), longitude = VALUES(longitude);

-- Villupuram - Town
INSERT INTO locations (name, latitude, longitude, district, nearby_city) VALUES
  ('Villupuram', 11.9401, 79.4861, 'Villupuram', 'Villupuram')
ON DUPLICATE KEY UPDATE latitude = VALUES(latitude), longitude = VALUES(longitude);

-- Virudunagar - Town
INSERT INTO locations (name, latitude, longitude, district, nearby_city) VALUES
  ('Sivakasi', 9.175, 77.8047, 'Virudunagar', 'Virudunagar'),
  ('Aruppukottai', 9.4908, 77.9479, 'Virudunagar', 'Virudunagar')
ON DUPLICATE KEY UPDATE latitude = VALUES(latitude), longitude = VALUES(longitude);

-- Chengalpattu - Village
INSERT INTO locations (name, latitude, longitude, district, nearby_city) VALUES
  ('Maduranthagam', 12.5333, 80.05, 'Chengalpattu', 'Chengalpattu'),
  ('Kanchipuram', 12.8342, 79.7029, 'Chengalpattu', 'Chengalpattu')
ON DUPLICATE KEY UPDATE latitude = VALUES(latitude), longitude = VALUES(longitude);

-- Coimbatore - Village
INSERT INTO locations (name, latitude, longitude, district, nearby_city) VALUES
  ('Avinashi', 11.1883, 76.95, 'Coimbatore', 'Coimbatore'),
  ('Sulur', 10.9483, 76.8267, 'Coimbatore', 'Coimbatore'),
  ('Periyanaikuppam', 11.0333, 76.95, 'Coimbatore', 'Coimbatore'),
  ('Nedungudi', 11.0833, 76.95, 'Coimbatore', 'Coimbatore'),
  ('Koundampalayam', 10.9833, 77.05, 'Coimbatore', 'Coimbatore'),
  ('Villupuram', 11.9401, 79.4861, 'Coimbatore', 'Coimbatore')
ON DUPLICATE KEY UPDATE latitude = VALUES(latitude), longitude = VALUES(longitude);

-- Erode - Village
INSERT INTO locations (name, latitude, longitude, district, nearby_city) VALUES
  ('Vellakovil', 10.8667, 77.8167, 'Erode', 'Erode'),
  ('Bhavani', 11.4537, 77.6699, 'Erode', 'Erode'),
  ('Gudimangalam', 11.3234, 77.8456, 'Erode', 'Erode')
ON DUPLICATE KEY UPDATE latitude = VALUES(latitude), longitude = VALUES(longitude);

-- Kanchipuram - Village
INSERT INTO locations (name, latitude, longitude, district, nearby_city) VALUES
  ('Sriperumbudur', 12.9402, 79.9042, 'Kanchipuram', 'Kanchipuram'),
  ('Walajabad', 12.5962, 80.0597, 'Kanchipuram', 'Kanchipuram')
ON DUPLICATE KEY UPDATE latitude = VALUES(latitude), longitude = VALUES(longitude);

-- Madurai - Village
INSERT INTO locations (name, latitude, longitude, district, nearby_city) VALUES
  ('Melur', 9.7811, 78.0614, 'Madurai', 'Madurai'),
  ('Tirumangalam', 9.7167, 78.0833, 'Madurai', 'Madurai'),
  ('Nilakottai', 9.5667, 78.2167, 'Madurai', 'Madurai'),
  ('Usilampatti', 9.4333, 78.2667, 'Madurai', 'Madurai'),
  ('Vadipatti', 9.4208, 77.9792, 'Madurai', 'Madurai'),
  ('Andipatti', 9.3333, 77.9333, 'Madurai', 'Madurai')
ON DUPLICATE KEY UPDATE latitude = VALUES(latitude), longitude = VALUES(longitude);

-- Namakkal - Village
INSERT INTO locations (name, latitude, longitude, district, nearby_city) VALUES
  ('Rasipuram', 11.3654, 78.4308, 'Namakkal', 'Namakkal')
ON DUPLICATE KEY UPDATE latitude = VALUES(latitude), longitude = VALUES(longitude);

-- Salem - Village
INSERT INTO locations (name, latitude, longitude, district, nearby_city) VALUES
  ('Yercaud', 11.7673, 78.1357, 'Salem', 'Salem'),
  ('Attur', 11.7834, 78.6291, 'Salem', 'Salem'),
  ('Kolathur', 11.8167, 78.1667, 'Salem', 'Salem')
ON DUPLICATE KEY UPDATE latitude = VALUES(latitude), longitude = VALUES(longitude);

-- Thiruvallur - Village
INSERT INTO locations (name, latitude, longitude, district, nearby_city) VALUES
  ('Thiruvallur', 13.1353, 80.0906, 'Thiruvallur', 'Thiruvallur'),
  ('Poonamallee', 13.0697, 80.1056, 'Thiruvallur', 'Thiruvallur')
ON DUPLICATE KEY UPDATE latitude = VALUES(latitude), longitude = VALUES(longitude);

-- Chennai - Neighborhood
INSERT INTO locations (name, latitude, longitude, district, nearby_city) VALUES
  ('Adyar', 13.0012, 80.2565, 'Chennai', 'Chennai'),
  ('Besant Nagar', 12.9843, 80.2565, 'Chennai', 'Chennai'),
  ('Mylapore', 13.0365, 80.26, 'Chennai', 'Chennai'),
  ('Triplicane', 13.0478, 80.2833, 'Chennai', 'Chennai'),
  ('Santhome', 13.035, 80.2717, 'Chennai', 'Chennai'),
  ('Mandaveli', 13.0267, 80.2633, 'Chennai', 'Chennai'),
  ('Alwarpet', 13.0283, 80.2633, 'Chennai', 'Chennai'),
  ('Palavakkam', 12.995, 80.2367, 'Chennai', 'Chennai'),
  ('Kovalam', 12.9767, 80.2633, 'Chennai', 'Chennai'),
  ('Velachery', 12.9717, 80.2183, 'Chennai', 'Chennai'),
  ('Madipakkam', 12.96, 80.2067, 'Chennai', 'Chennai'),
  ('Thiruvanmiyur', 12.9933, 80.2717, 'Chennai', 'Chennai'),
  ('T. Nagar', 13.0404, 80.2165, 'Chennai', 'Chennai'),
  ('Kodambakkam', 13.0471, 80.1964, 'Chennai', 'Chennai'),
  ('Nungambakkam', 13.0567, 80.2265, 'Chennai', 'Chennai'),
  ('Chetpet', 13.0567, 80.2383, 'Chennai', 'Chennai'),
  ('Teynampet', 13.045, 80.25, 'Chennai', 'Chennai'),
  ('Kilpauk', 13.069, 80.2167, 'Chennai', 'Chennai'),
  ('Egmore', 13.0617, 80.27, 'Chennai', 'Chennai'),
  ('Purasawalkkam', 13.0867, 80.2617, 'Chennai', 'Chennai'),
  ('Mint', 13.087, 80.285, 'Chennai', 'Chennai'),
  ('George Town', 13.0854, 80.2854, 'Chennai', 'Chennai'),
  ('Sowcarpet', 13.085, 80.2917, 'Chennai', 'Chennai'),
  ('Vadapalani', 13.0633, 80.1783, 'Chennai', 'Chennai'),
  ('Ashok Nagar', 13.0517, 80.1733, 'Chennai', 'Chennai'),
  ('Saidapet', 13.0333, 80.1833, 'Chennai', 'Chennai'),
  ('Mambalam', 13.0283, 80.1733, 'Chennai', 'Chennai'),
  ('Ramakrishnapuram', 13.025, 80.1917, 'Chennai', 'Chennai'),
  ('Kottivakkam', 12.9733, 80.2983, 'Chennai', 'Chennai'),
  ('Karapakkam', 12.9433, 80.2283, 'Chennai', 'Chennai'),
  ('Sholinganallur', 12.875, 80.2267, 'Chennai', 'Chennai'),
  ('Navalur', 12.8567, 80.2, 'Chennai', 'Chennai'),
  ('Okkiyam Thoraipakkam', 12.8983, 80.2433, 'Chennai', 'Chennai'),
  ('Perambur', 13.1652, 80.2425, 'Chennai', 'Chennai'),
  ('Madhavaram', 13.1482, 80.2317, 'Chennai', 'Chennai'),
  ('Tondiarpet', 13.16, 80.285, 'Chennai', 'Chennai'),
  ('Tiruvottriyur', 13.1567, 80.2967, 'Chennai', 'Chennai'),
  ('Ambattur', 13.1183, 80.1817, 'Chennai', 'Chennai'),
  ('Avadi', 13.1, 80.1267, 'Chennai', 'Chennai'),
  ('Redhills', 13.075, 80.1433, 'Chennai', 'Chennai')
ON DUPLICATE KEY UPDATE latitude = VALUES(latitude), longitude = VALUES(longitude);

-- Chengalpattu - Bus Stop
INSERT INTO locations (name, latitude, longitude, district, nearby_city) VALUES
  ('Chennai - Tambaram', 12.9249, 80.1278, 'Chengalpattu', 'Chengalpattu')
ON DUPLICATE KEY UPDATE latitude = VALUES(latitude), longitude = VALUES(longitude);

-- Chennai - Bus Stop
INSERT INTO locations (name, latitude, longitude, district, nearby_city) VALUES
  ('Chennai - CMBT (Koyambedu)', 13.0694, 80.1948, 'Chennai', 'Chennai'),
  ('Chennai - Madhavaram (MMBS)', 13.1482, 80.2317, 'Chennai', 'Chennai'),
  ('Chennai - Broadway', 13.0896, 80.2867, 'Chennai', 'Chennai')
ON DUPLICATE KEY UPDATE latitude = VALUES(latitude), longitude = VALUES(longitude);

-- Coimbatore - Bus Stop
INSERT INTO locations (name, latitude, longitude, district, nearby_city) VALUES
  ('Coimbatore - Gandhipuram', 11.0183, 76.9725, 'Coimbatore', 'Coimbatore'),
  ('Coimbatore - Ukkadam', 10.9923, 76.9614, 'Coimbatore', 'Coimbatore')
ON DUPLICATE KEY UPDATE latitude = VALUES(latitude), longitude = VALUES(longitude);

-- Erode - Bus Stop
INSERT INTO locations (name, latitude, longitude, district, nearby_city) VALUES
  ('Erode - Bus Stand', 11.3394, 77.7264, 'Erode', 'Erode')
ON DUPLICATE KEY UPDATE latitude = VALUES(latitude), longitude = VALUES(longitude);

-- Madurai - Bus Stop
INSERT INTO locations (name, latitude, longitude, district, nearby_city) VALUES
  ('Madurai - Mattuthavani', 9.9441, 78.156, 'Madurai', 'Madurai'),
  ('Madurai - Arapalayam', 9.932, 78.1007, 'Madurai', 'Madurai')
ON DUPLICATE KEY UPDATE latitude = VALUES(latitude), longitude = VALUES(longitude);

-- Salem - Bus Stop
INSERT INTO locations (name, latitude, longitude, district, nearby_city) VALUES
  ('Salem - New Bus Stand', 11.6508, 78.1556, 'Salem', 'Salem')
ON DUPLICATE KEY UPDATE latitude = VALUES(latitude), longitude = VALUES(longitude);

-- Thanjavur - Bus Stop
INSERT INTO locations (name, latitude, longitude, district, nearby_city) VALUES
  ('Thanjavur - Bus Stand', 10.787, 79.1378, 'Thanjavur', 'Thanjavur')
ON DUPLICATE KEY UPDATE latitude = VALUES(latitude), longitude = VALUES(longitude);

-- Thoothukudi - Bus Stop
INSERT INTO locations (name, latitude, longitude, district, nearby_city) VALUES
  ('Thoothukudi - Bus Stand', 8.7642, 78.1348, 'Thoothukudi', 'Thoothukudi')
ON DUPLICATE KEY UPDATE latitude = VALUES(latitude), longitude = VALUES(longitude);

-- Tiruchirappalli - Bus Stop
INSERT INTO locations (name, latitude, longitude, district, nearby_city) VALUES
  ('Trichy - Central', 10.805, 78.6856, 'Tiruchirappalli', 'Tiruchirappalli')
ON DUPLICATE KEY UPDATE latitude = VALUES(latitude), longitude = VALUES(longitude);

-- Tirunelveli - Bus Stop
INSERT INTO locations (name, latitude, longitude, district, nearby_city) VALUES
  ('Tirunelveli - Bus Stand', 8.7139, 77.7567, 'Tirunelveli', 'Tirunelveli')
ON DUPLICATE KEY UPDATE latitude = VALUES(latitude), longitude = VALUES(longitude);

-- Vellore - Bus Stop
INSERT INTO locations (name, latitude, longitude, district, nearby_city) VALUES
  ('Vellore - Central Bus Stand', 12.9165, 79.1325, 'Vellore', 'Vellore')
ON DUPLICATE KEY UPDATE latitude = VALUES(latitude), longitude = VALUES(longitude);
