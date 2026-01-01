-- V2.6__add_location_coordinates.sql
-- Add latitude and longitude coordinates for all Tamil Nadu locations

-- Major cities with accurate coordinates
UPDATE locations SET latitude = 13.0827, longitude = 80.2707 WHERE name = 'Chennai';
UPDATE locations SET latitude = 11.0168, longitude = 76.9558 WHERE name = 'Coimbatore';
UPDATE locations SET latitude = 9.9252, longitude = 78.1198 WHERE name = 'Madurai';
UPDATE locations SET latitude = 10.7905, longitude = 78.7047 WHERE name = 'Trichy';
UPDATE locations SET latitude = 11.6643, longitude = 78.1460 WHERE name = 'Salem';
UPDATE locations SET latitude = 8.7139, longitude = 77.7567 WHERE name = 'Tirunelveli';
UPDATE locations SET latitude = 8.0883, longitude = 77.5385 WHERE name = 'Kanyakumari';
UPDATE locations SET latitude = 8.0883, longitude = 77.5385 WHERE name = 'Kanyakumari Town';
UPDATE locations SET latitude = 12.9165, longitude = 79.1325 WHERE name = 'Vellore';
UPDATE locations SET latitude = 10.7870, longitude = 79.1378 WHERE name = 'Thanjavur';
UPDATE locations SET latitude = 10.9601, longitude = 79.3788 WHERE name = 'Kumbakonam';

-- Additional cities
UPDATE locations SET latitude = 12.2958, longitude = 76.6394 WHERE name = 'Mysore';
UPDATE locations SET latitude = 12.9716, longitude = 77.5946 WHERE name = 'Bangalore';
UPDATE locations SET latitude = 13.0878, longitude = 80.2785 WHERE name = 'Chennai Central';
UPDATE locations SET latitude = 13.0827, longitude = 80.2707 WHERE name = 'Chennai Egmore';
UPDATE locations SET latitude = 12.2348, longitude = 79.8378 WHERE name = 'Kanchipuram';
UPDATE locations SET latitude = 12.2253, longitude = 79.0747 WHERE name = 'Tiruvannamalai';
UPDATE locations SET latitude = 10.3673, longitude = 76.2419 WHERE name = 'Pollachi';
UPDATE locations SET latitude = 10.3368, longitude = 76.9414 WHERE name = 'Valparai';
UPDATE locations SET latitude = 8.8932, longitude = 77.2906 WHERE name = 'Courtallam';
UPDATE locations SET latitude = 12.1372, longitude = 77.8255 WHERE name = 'Hogenakkal';
UPDATE locations SET latitude = 11.3410, longitude = 76.7295 WHERE name = 'Mettupalayam';
UPDATE locations SET latitude = 9.1714, longitude = 77.8206 WHERE name = 'Kovilpatti';
UPDATE locations SET latitude = 10.0889, longitude = 77.4419 WHERE name = 'Theni';
UPDATE locations SET latitude = 10.4478, longitude = 77.5208 WHERE name = 'Palani';
UPDATE locations SET latitude = 8.7342, longitude = 77.6986 WHERE name = 'Tenkasi';
UPDATE locations SET latitude = 10.3581, longitude = 78.8347 WHERE name = 'Pudukkottai';
UPDATE locations SET latitude = 11.7401, longitude = 79.7734 WHERE name = 'Yercaud';
UPDATE locations SET latitude = 8.1778, longitude = 77.4056 WHERE name = 'Nagercoil';

-- Verify the update worked
SELECT name, latitude, longitude FROM locations WHERE latitude IS NOT NULL ORDER BY name;