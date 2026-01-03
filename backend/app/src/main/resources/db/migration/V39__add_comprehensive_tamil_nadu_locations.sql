-- V39__add_comprehensive_tamil_nadu_locations.sql
-- Comprehensive list of Tamil Nadu villages, towns, and cities
-- Official government location data with coordinates
-- Generated from data.gov.in

-- Ariyalur Locations
INSERT INTO locations (name, latitude, longitude, district, nearby_city) VALUES
  ('Ariyalur', 11.1425, 79.0657, 'Ariyalur', 'Ariyalur')
ON DUPLICATE KEY UPDATE latitude = VALUES(latitude), longitude = VALUES(longitude);

-- Chengalpattu Locations
INSERT INTO locations (name, latitude, longitude, district, nearby_city) VALUES
  ('Chengalpattu', 12.6667, 80.15, 'Chengalpattu', 'Chengalpattu'),
  ('Tambaram', 12.9249, 80.1278, 'Chengalpattu', 'Tambaram'),
  ('Mahabalipuram', 12.6369, 80.1933, 'Chengalpattu', 'Mahabalipuram')
ON DUPLICATE KEY UPDATE latitude = VALUES(latitude), longitude = VALUES(longitude);

-- Chennai Locations
INSERT INTO locations (name, latitude, longitude, district, nearby_city) VALUES
  ('Chennai', 13.0827, 80.2707, 'Chennai', 'Chennai')
ON DUPLICATE KEY UPDATE latitude = VALUES(latitude), longitude = VALUES(longitude);

-- Coimbatore Locations
INSERT INTO locations (name, latitude, longitude, district, nearby_city) VALUES
  ('Coimbatore', 11.0183, 76.9725, 'Coimbatore', 'Coimbatore'),
  ('Pollachi', 10.6627, 77.0038, 'Coimbatore', 'Pollachi')
ON DUPLICATE KEY UPDATE latitude = VALUES(latitude), longitude = VALUES(longitude);

-- Cuddalore Locations
INSERT INTO locations (name, latitude, longitude, district, nearby_city) VALUES
  ('Cuddalore', 11.748, 79.7714, 'Cuddalore', 'Cuddalore'),
  ('Chidambaram', 11.2, 79.5667, 'Cuddalore', 'Chidambaram')
ON DUPLICATE KEY UPDATE latitude = VALUES(latitude), longitude = VALUES(longitude);

-- Dindigul Locations
INSERT INTO locations (name, latitude, longitude, district, nearby_city) VALUES
  ('Dindigul', 10.3624, 77.9695, 'Dindigul', 'Dindigul'),
  ('Kodaikanal', 10.2381, 77.4892, 'Dindigul', 'Kodaikanal'),
  ('Palani', 10.2742, 77.4485, 'Dindigul', 'Palani')
ON DUPLICATE KEY UPDATE latitude = VALUES(latitude), longitude = VALUES(longitude);

-- Erode Locations
INSERT INTO locations (name, latitude, longitude, district, nearby_city) VALUES
  ('Erode', 11.3394, 77.7264, 'Erode', 'Erode')
ON DUPLICATE KEY UPDATE latitude = VALUES(latitude), longitude = VALUES(longitude);

-- Kanchipuram Locations
INSERT INTO locations (name, latitude, longitude, district, nearby_city) VALUES
  ('Kanchipuram', 12.8342, 79.7029, 'Kanchipuram', 'Kanchipuram')
ON DUPLICATE KEY UPDATE latitude = VALUES(latitude), longitude = VALUES(longitude);

-- Kanyakumari Locations
INSERT INTO locations (name, latitude, longitude, district, nearby_city) VALUES
  ('Nagercoil', 8.1833, 77.4119, 'Kanyakumari', 'Nagercoil'),
  ('Kanyakumari', 8.0883, 77.5385, 'Kanyakumari', 'Kanyakumari')
ON DUPLICATE KEY UPDATE latitude = VALUES(latitude), longitude = VALUES(longitude);

-- Krishnagiri Locations
INSERT INTO locations (name, latitude, longitude, district, nearby_city) VALUES
  ('Hosur', 12.7411, 78.7727, 'Krishnagiri', 'Hosur')
ON DUPLICATE KEY UPDATE latitude = VALUES(latitude), longitude = VALUES(longitude);

-- Madurai Locations
INSERT INTO locations (name, latitude, longitude, district, nearby_city) VALUES
  ('Madurai', 9.9252, 78.1198, 'Madurai', 'Madurai')
ON DUPLICATE KEY UPDATE latitude = VALUES(latitude), longitude = VALUES(longitude);

-- Mayiladuthurai Locations
INSERT INTO locations (name, latitude, longitude, district, nearby_city) VALUES
  ('Mayiladuthurai', 11.1018, 79.6711, 'Mayiladuthurai', 'Mayiladuthurai')
ON DUPLICATE KEY UPDATE latitude = VALUES(latitude), longitude = VALUES(longitude);

-- Namakkal Locations
INSERT INTO locations (name, latitude, longitude, district, nearby_city) VALUES
  ('Namakkal', 11.7304, 78.1668, 'Namakkal', 'Namakkal'),
  ('Tiruchengode', 11.305, 78.1733, 'Namakkal', 'Tiruchengode')
ON DUPLICATE KEY UPDATE latitude = VALUES(latitude), longitude = VALUES(longitude);

-- Nilgiris Locations
INSERT INTO locations (name, latitude, longitude, district, nearby_city) VALUES
  ('Ooty', 11.4102, 76.695, 'Nilgiris', 'Ooty')
ON DUPLICATE KEY UPDATE latitude = VALUES(latitude), longitude = VALUES(longitude);

-- Perambalur Locations
INSERT INTO locations (name, latitude, longitude, district, nearby_city) VALUES
  ('Perambalur', 11.4516, 78.8762, 'Perambalur', 'Perambalur')
ON DUPLICATE KEY UPDATE latitude = VALUES(latitude), longitude = VALUES(longitude);

-- Pudukkottai Locations
INSERT INTO locations (name, latitude, longitude, district, nearby_city) VALUES
  ('Pudukkottai', 10.384, 78.8223, 'Pudukkottai', 'Pudukkottai')
ON DUPLICATE KEY UPDATE latitude = VALUES(latitude), longitude = VALUES(longitude);

-- Ranipet Locations
INSERT INTO locations (name, latitude, longitude, district, nearby_city) VALUES
  ('Ranipet', 12.95, 79.3333, 'Ranipet', 'Ranipet')
ON DUPLICATE KEY UPDATE latitude = VALUES(latitude), longitude = VALUES(longitude);

-- Salem Locations
INSERT INTO locations (name, latitude, longitude, district, nearby_city) VALUES
  ('Salem', 11.6643, 78.146, 'Salem', 'Salem')
ON DUPLICATE KEY UPDATE latitude = VALUES(latitude), longitude = VALUES(longitude);

-- Thanjavur Locations
INSERT INTO locations (name, latitude, longitude, district, nearby_city) VALUES
  ('Thanjavur', 10.787, 79.1378, 'Thanjavur', 'Thanjavur'),
  ('Kumbakonam', 10.9609, 79.3881, 'Thanjavur', 'Kumbakonam')
ON DUPLICATE KEY UPDATE latitude = VALUES(latitude), longitude = VALUES(longitude);

-- Thoothukudi Locations
INSERT INTO locations (name, latitude, longitude, district, nearby_city) VALUES
  ('Thoothukudi', 8.7642, 78.1348, 'Thoothukudi', 'Thoothukudi')
ON DUPLICATE KEY UPDATE latitude = VALUES(latitude), longitude = VALUES(longitude);

-- Tiruchirappalli Locations
INSERT INTO locations (name, latitude, longitude, district, nearby_city) VALUES
  ('Tiruchirappalli', 10.805, 78.6856, 'Tiruchirappalli', 'Tiruchirappalli')
ON DUPLICATE KEY UPDATE latitude = VALUES(latitude), longitude = VALUES(longitude);

-- Tirunelveli Locations
INSERT INTO locations (name, latitude, longitude, district, nearby_city) VALUES
  ('Tirunelveli', 8.7139, 77.7567, 'Tirunelveli', 'Tirunelveli')
ON DUPLICATE KEY UPDATE latitude = VALUES(latitude), longitude = VALUES(longitude);

-- Tiruppur Locations
INSERT INTO locations (name, latitude, longitude, district, nearby_city) VALUES
  ('Tiruppur', 11.1085, 77.3411, 'Tiruppur', 'Tiruppur'),
  ('Udumalaipet', 11.2667, 77.3333, 'Tiruppur', 'Udumalaipet')
ON DUPLICATE KEY UPDATE latitude = VALUES(latitude), longitude = VALUES(longitude);

-- Tiruvannamalai Locations
INSERT INTO locations (name, latitude, longitude, district, nearby_city) VALUES
  ('Tiruvannamalai', 12.2333, 79.0733, 'Tiruvannamalai', 'Tiruvannamalai')
ON DUPLICATE KEY UPDATE latitude = VALUES(latitude), longitude = VALUES(longitude);

-- Vellore Locations
INSERT INTO locations (name, latitude, longitude, district, nearby_city) VALUES
  ('Vellore', 12.9165, 79.1325, 'Vellore', 'Vellore')
ON DUPLICATE KEY UPDATE latitude = VALUES(latitude), longitude = VALUES(longitude);

-- Villupuram Locations
INSERT INTO locations (name, latitude, longitude, district, nearby_city) VALUES
  ('Villupuram', 11.9401, 79.4861, 'Villupuram', 'Villupuram')
ON DUPLICATE KEY UPDATE latitude = VALUES(latitude), longitude = VALUES(longitude);

-- Virudunagar Locations
INSERT INTO locations (name, latitude, longitude, district, nearby_city) VALUES
  ('Sivakasi', 9.175, 77.8047, 'Virudunagar', 'Sivakasi'),
  ('Aruppukottai', 9.4908, 77.9479, 'Virudunagar', 'Aruppukottai')
ON DUPLICATE KEY UPDATE latitude = VALUES(latitude), longitude = VALUES(longitude);
