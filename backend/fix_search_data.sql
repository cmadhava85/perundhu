-- Fix database issues and add proper transit data
-- Run this to correct the search results and add connecting routes

-- First, let's check and fix Bus 11's stops (Chennai-Madurai Superfast)
-- The issue is that stop 2 has locationId=2 (Coimbatore) but should be a different location

-- Delete incorrect stops for Bus 11 and recreate with correct data
DELETE FROM stops WHERE bus_id = 11;

-- Add correct stops for Bus 11 (Chennai to Madurai via proper route)
INSERT INTO stops (bus_id, location_id, name, arrival_time, departure_time, stop_order) VALUES
(11, 1, 'Chennai Central', '06:00:00', '06:00:00', 1),
(11, NULL, 'Tambaram', '06:30:00', '06:35:00', 2),
(11, NULL, 'Chengalpattu', '07:00:00', '07:05:00', 3),
(11, NULL, 'Villupuram', '08:30:00', '08:40:00', 4),
(11, 4, 'Trichy', '11:00:00', '11:15:00', 5),
(11, 3, 'Madurai', '13:30:00', '13:30:00', 6);

-- Fix Bus 2 - add stops for Kovai Deluxe (Chennai to Coimbatore)
DELETE FROM stops WHERE bus_id = 2;

INSERT INTO stops (bus_id, location_id, name, arrival_time, departure_time, sequence, latitude, longitude) VALUES
(2, 1, 'Chennai', '08:00:00', '08:00:00', 1, 13.0827, 80.2707),
(2, 8, 'Vellore', '09:45:00', '09:50:00', 2, 12.9165, 79.1325),
(2, NULL, 'Krishnagiri', '11:00:00', '11:05:00', 3, 12.5186, 78.2137),
(2, 5, 'Salem', '12:00:00', '12:10:00', 4, 11.6643, 78.1460),
(2, NULL, 'Erode', '13:15:00', '13:20:00', 5, 11.3410, 77.7172),
(2, 2, 'Coimbatore', '14:30:00', '14:30:00', 6, 11.0168, 76.9558);

-- Add more buses for better search results

-- Bus 3: Chennai to Madurai Direct
INSERT INTO buses (number, name, operator, type) VALUES 
('TN-01-MD-001', 'Chennai-Madurai Direct', 'SETC', 'Express');

SET @bus3_id = LAST_INSERT_ID();

INSERT INTO stops (bus_id, location_id, name, arrival_time, departure_time, sequence, latitude, longitude) VALUES
(@bus3_id, 1, 'Chennai', '07:00:00', '07:00:00', 1, 13.0827, 80.2707),
(@bus3_id, 4, 'Trichy', '11:30:00', '11:45:00', 2, 10.7905, 78.7047),
(@bus3_id, 3, 'Madurai', '14:00:00', '14:00:00', 3, 9.9252, 78.1198);

-- Bus 4: Salem to Coimbatore (for transit connections)
INSERT INTO buses (number, name, operator, type) VALUES 
('TN-02-SC-001', 'Salem-Coimbatore Express', 'TNSTC', 'Regular');

SET @bus4_id = LAST_INSERT_ID();

INSERT INTO stops (bus_id, location_id, name, arrival_time, departure_time, sequence, latitude, longitude) VALUES
(@bus4_id, 5, 'Salem', '09:00:00', '09:00:00', 1, 11.6643, 78.1460),
(@bus4_id, NULL, 'Erode', '10:15:00', '10:20:00', 2, 11.3410, 77.7172),
(@bus4_id, 2, 'Coimbatore', '11:30:00', '11:30:00', 3, 11.0168, 76.9558);

-- Bus 5: Madurai to Coimbatore (for reverse transit)
INSERT INTO buses (number, name, operator, type) VALUES 
('TN-03-MC-001', 'Madurai-Coimbatore Direct', 'SETC', 'Express');

SET @bus5_id = LAST_INSERT_ID();

INSERT INTO stops (bus_id, location_id, name, arrival_time, departure_time, sequence, latitude, longitude) VALUES
(@bus5_id, 3, 'Madurai', '06:00:00', '06:00:00', 1, 9.9252, 78.1198),
(@bus5_id, NULL, 'Dindigul', '07:00:00', '07:05:00', 2, 10.3673, 77.9803),
(@bus5_id, 4, 'Trichy', '09:00:00', '09:15:00', 3, 10.7905, 78.7047),
(@bus5_id, 2, 'Coimbatore', '12:00:00', '12:00:00', 4, 11.0168, 76.9558);

-- Bus 6: Chennai to Salem (for connecting to Coimbatore via Bus 4)
INSERT INTO buses (number, name, operator, type) VALUES 
('TN-01-CS-001', 'Chennai-Salem Express', 'SETC', 'Express');

SET @bus6_id = LAST_INSERT_ID();

INSERT INTO stops (bus_id, location_id, name, arrival_time, departure_time, sequence, latitude, longitude) VALUES
(@bus6_id, 1, 'Chennai', '06:30:00', '06:30:00', 1, 13.0827, 80.2707),
(@bus6_id, 8, 'Vellore', '08:00:00', '08:05:00', 2, 12.9165, 79.1325),
(@bus6_id, 5, 'Salem', '10:30:00', '10:30:00', 3, 11.6643, 78.1460);

-- Bus 7: Trichy to Coimbatore
INSERT INTO buses (number, name, operator, type) VALUES 
('TN-04-TC-001', 'Trichy-Coimbatore Express', 'TNSTC', 'Regular');

SET @bus7_id = LAST_INSERT_ID();

INSERT INTO stops (bus_id, location_id, name, arrival_time, departure_time, sequence, latitude, longitude) VALUES
(@bus7_id, 4, 'Trichy', '08:00:00', '08:00:00', 1, 10.7905, 78.7047),
(@bus7_id, NULL, 'Karur', '09:00:00', '09:05:00', 2, 10.9601, 78.0766),
(@bus7_id, NULL, 'Erode', '10:30:00', '10:35:00', 3, 11.3410, 77.7172),
(@bus7_id, 2, 'Coimbatore', '11:45:00', '11:45:00', 4, 11.0168, 76.9558);

-- Bus 8: Chennai to Trichy (for connecting to other routes)
INSERT INTO buses (number, name, operator, type) VALUES 
('TN-01-CT-001', 'Chennai-Trichy Express', 'SETC', 'Express');

SET @bus8_id = LAST_INSERT_ID();

INSERT INTO stops (bus_id, location_id, name, arrival_time, departure_time, sequence, latitude, longitude) VALUES
(@bus8_id, 1, 'Chennai', '09:00:00', '09:00:00', 1, 13.0827, 80.2707),
(@bus8_id, NULL, 'Villupuram', '11:00:00', '11:10:00', 2, 11.9401, 79.4861),
(@bus8_id, 4, 'Trichy', '13:30:00', '13:30:00', 3, 10.7905, 78.7047);

-- Verify the fixes
SELECT 'Bus routes summary:' as message;
SELECT 
    b.id,
    b.number,
    b.name,
    COUNT(s.id) as stop_count,
    MIN(CASE WHEN s.sequence = 1 THEN l.name END) as origin,
    MAX(CASE WHEN s.sequence = (SELECT MAX(sequence) FROM stops WHERE bus_id = b.id) THEN COALESCE(l.name, s.name) END) as destination
FROM buses b
LEFT JOIN stops s ON b.id = s.bus_id
LEFT JOIN locations l ON s.location_id = l.id
GROUP BY b.id, b.number, b.name
ORDER BY b.id;
