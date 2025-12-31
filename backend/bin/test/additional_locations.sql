-- Additional Tamil Nadu Locations and Bus Routes
-- This script adds more cities, towns and bus routes covering most parts of Tamil Nadu

-- Additional locations from various regions of Tamil Nadu
INSERT INTO location (name) 
SELECT 'Kanchipuram' FROM dual WHERE NOT EXISTS (SELECT 1 FROM location WHERE name = 'Kanchipuram');

INSERT INTO location (name) 
SELECT 'Kumbakonam' FROM dual WHERE NOT EXISTS (SELECT 1 FROM location WHERE name = 'Kumbakonam');

INSERT INTO location (name) 
SELECT 'Tenkasi' FROM dual WHERE NOT EXISTS (SELECT 1 FROM location WHERE name = 'Tenkasi');

INSERT INTO location (name) 
SELECT 'Theni' FROM dual WHERE NOT EXISTS (SELECT 1 FROM location WHERE name = 'Theni');

INSERT INTO location (name) 
SELECT 'Cuddalore' FROM dual WHERE NOT EXISTS (SELECT 1 FROM location WHERE name = 'Cuddalore');

INSERT INTO location (name) 
SELECT 'Chengalpattu' FROM dual WHERE NOT EXISTS (SELECT 1 FROM location WHERE name = 'Chengalpattu');

INSERT INTO location (name) 
SELECT 'Dharmapuri' FROM dual WHERE NOT EXISTS (SELECT 1 FROM location WHERE name = 'Dharmapuri');

INSERT INTO location (name) 
SELECT 'Krishnagiri' FROM dual WHERE NOT EXISTS (SELECT 1 FROM location WHERE name = 'Krishnagiri');

INSERT INTO location (name) 
SELECT 'Kallakurichi' FROM dual WHERE NOT EXISTS (SELECT 1 FROM location WHERE name = 'Kallakurichi');

INSERT INTO location (name) 
SELECT 'Ariyalur' FROM dual WHERE NOT EXISTS (SELECT 1 FROM location WHERE name = 'Ariyalur');

INSERT INTO location (name) 
SELECT 'Perambalur' FROM dual WHERE NOT EXISTS (SELECT 1 FROM location WHERE name = 'Perambalur');

INSERT INTO location (name) 
SELECT 'Nagapattinam' FROM dual WHERE NOT EXISTS (SELECT 1 FROM location WHERE name = 'Nagapattinam');

INSERT INTO location (name) 
SELECT 'Mayiladuthurai' FROM dual WHERE NOT EXISTS (SELECT 1 FROM location WHERE name = 'Mayiladuthurai');

INSERT INTO location (name) 
SELECT 'Pudukkottai' FROM dual WHERE NOT EXISTS (SELECT 1 FROM location WHERE name = 'Pudukkottai');

INSERT INTO location (name) 
SELECT 'Virudhunagar' FROM dual WHERE NOT EXISTS (SELECT 1 FROM location WHERE name = 'Virudhunagar');

INSERT INTO location (name) 
SELECT 'Sivakasi' FROM dual WHERE NOT EXISTS (SELECT 1 FROM location WHERE name = 'Sivakasi');

INSERT INTO location (name) 
SELECT 'Ramanathapuram' FROM dual WHERE NOT EXISTS (SELECT 1 FROM location WHERE name = 'Ramanathapuram');

INSERT INTO location (name) 
SELECT 'Sivaganga' FROM dual WHERE NOT EXISTS (SELECT 1 FROM location WHERE name = 'Sivaganga');

INSERT INTO location (name) 
SELECT 'Tiruvannamalai' FROM dual WHERE NOT EXISTS (SELECT 1 FROM location WHERE name = 'Tiruvannamalai');

INSERT INTO location (name) 
SELECT 'Poonamallee' FROM dual WHERE NOT EXISTS (SELECT 1 FROM location WHERE name = 'Poonamallee');

INSERT INTO location (name) 
SELECT 'Tirupathur' FROM dual WHERE NOT EXISTS (SELECT 1 FROM location WHERE name = 'Tirupathur');

INSERT INTO location (name) 
SELECT 'Ranipet' FROM dual WHERE NOT EXISTS (SELECT 1 FROM location WHERE name = 'Ranipet');

INSERT INTO location (name) 
SELECT 'Thiruvallur' FROM dual WHERE NOT EXISTS (SELECT 1 FROM location WHERE name = 'Thiruvallur');

INSERT INTO location (name) 
SELECT 'Kanyakumari Town' FROM dual WHERE NOT EXISTS (SELECT 1 FROM location WHERE name = 'Kanyakumari Town');

INSERT INTO location (name) 
SELECT 'Pollachi' FROM dual WHERE NOT EXISTS (SELECT 1 FROM location WHERE name = 'Pollachi');

INSERT INTO location (name) 
SELECT 'Palani' FROM dual WHERE NOT EXISTS (SELECT 1 FROM location WHERE name = 'Palani');

INSERT INTO location (name) 
SELECT 'Tuticorin' FROM dual WHERE NOT EXISTS (SELECT 1 FROM location WHERE name = 'Tuticorin');

INSERT INTO location (name) 
SELECT 'Yercaud' FROM dual WHERE NOT EXISTS (SELECT 1 FROM location WHERE name = 'Yercaud');

INSERT INTO location (name) 
SELECT 'Mahabalipuram' FROM dual WHERE NOT EXISTS (SELECT 1 FROM location WHERE name = 'Mahabalipuram');

INSERT INTO location (name) 
SELECT 'Kotagiri' FROM dual WHERE NOT EXISTS (SELECT 1 FROM location WHERE name = 'Kotagiri');

INSERT INTO location (name) 
SELECT 'Valparai' FROM dual WHERE NOT EXISTS (SELECT 1 FROM location WHERE name = 'Valparai');

INSERT INTO location (name) 
SELECT 'Courtallam' FROM dual WHERE NOT EXISTS (SELECT 1 FROM location WHERE name = 'Courtallam');

INSERT INTO location (name) 
SELECT 'Hogenakkal' FROM dual WHERE NOT EXISTS (SELECT 1 FROM location WHERE name = 'Hogenakkal');

INSERT INTO location (name) 
SELECT 'Mettupalayam' FROM dual WHERE NOT EXISTS (SELECT 1 FROM location WHERE name = 'Mettupalayam');

INSERT INTO location (name) 
SELECT 'Kovilpatti' FROM dual WHERE NOT EXISTS (SELECT 1 FROM location WHERE name = 'Kovilpatti');

-- Now let's add bus routes for these locations
-- We'll first ensure we get the correct IDs by using subqueries
-- Routes from Chennai to all new locations

-- Helper to get location ID by name
SET @getLocationId = '
  WITH locationData AS (
    SELECT id, name FROM location
  )
  SELECT id FROM locationData WHERE name = ?
';

-- Chennai to Kanchipuram
INSERT INTO bus (from_location_id, to_location_id, bus_name, bus_number, departure_time, arrival_time)
SELECT 
    (SELECT id FROM location WHERE name = 'Chennai'), 
    (SELECT id FROM location WHERE name = 'Kanchipuram'),
    'TNSTC Chennai-Kanchipuram Express', 'TN-01-K-1234', '06:00:00', '07:30:00'
FROM dual
WHERE NOT EXISTS (
    SELECT 1 FROM bus b 
    JOIN location l1 ON b.from_location_id = l1.id 
    JOIN location l2 ON b.to_location_id = l2.id 
    WHERE l1.name = 'Chennai' AND l2.name = 'Kanchipuram'
);

-- Chennai to Tiruvannamalai
INSERT INTO bus (from_location_id, to_location_id, bus_name, bus_number, departure_time, arrival_time)
SELECT 
    (SELECT id FROM location WHERE name = 'Chennai'), 
    (SELECT id FROM location WHERE name = 'Tiruvannamalai'),
    'SETC Arunachala Express', 'TN-01-T-5678', '07:00:00', '10:30:00'
FROM dual
WHERE NOT EXISTS (
    SELECT 1 FROM bus b 
    JOIN location l1 ON b.from_location_id = l1.id 
    JOIN location l2 ON b.to_location_id = l2.id 
    WHERE l1.name = 'Chennai' AND l2.name = 'Tiruvannamalai'
);

-- Chennai to Kumbakonam
INSERT INTO bus (from_location_id, to_location_id, bus_name, bus_number, departure_time, arrival_time)
SELECT 
    (SELECT id FROM location WHERE name = 'Chennai'), 
    (SELECT id FROM location WHERE name = 'Kumbakonam'),
    'SETC Chennai-Kumbakonam Deluxe', 'TN-01-K-7890', '20:00:00', '05:00:00'
FROM dual
WHERE NOT EXISTS (
    SELECT 1 FROM bus b 
    JOIN location l1 ON b.from_location_id = l1.id 
    JOIN location l2 ON b.to_location_id = l2.id 
    WHERE l1.name = 'Chennai' AND l2.name = 'Kumbakonam'
);

-- Chennai to Hogenakkal
INSERT INTO bus (from_location_id, to_location_id, bus_name, bus_number, departure_time, arrival_time)
SELECT 
    (SELECT id FROM location WHERE name = 'Chennai'), 
    (SELECT id FROM location WHERE name = 'Hogenakkal'),
    'TNSTC Falls Special', 'TN-01-H-2345', '06:30:00', '12:00:00'
FROM dual
WHERE NOT EXISTS (
    SELECT 1 FROM bus b 
    JOIN location l1 ON b.from_location_id = l1.id 
    JOIN location l2 ON b.to_location_id = l2.id 
    WHERE l1.name = 'Chennai' AND l2.name = 'Hogenakkal'
);

-- Coimbatore to Pollachi
INSERT INTO bus (from_location_id, to_location_id, bus_name, bus_number, departure_time, arrival_time)
SELECT 
    (SELECT id FROM location WHERE name = 'Coimbatore'), 
    (SELECT id FROM location WHERE name = 'Pollachi'),
    'TNSTC Kovai-Pollachi Shuttle', 'TN-38-P-1234', '06:00:00', '07:30:00'
FROM dual
WHERE NOT EXISTS (
    SELECT 1 FROM bus b 
    JOIN location l1 ON b.from_location_id = l1.id 
    JOIN location l2 ON b.to_location_id = l2.id 
    WHERE l1.name = 'Coimbatore' AND l2.name = 'Pollachi'
);

-- Coimbatore to Valparai
INSERT INTO bus (from_location_id, to_location_id, bus_name, bus_number, departure_time, arrival_time)
SELECT 
    (SELECT id FROM location WHERE name = 'Coimbatore'), 
    (SELECT id FROM location WHERE name = 'Valparai'),
    'TNSTC Hill Express', 'TN-38-V-5678', '07:00:00', '11:30:00'
FROM dual
WHERE NOT EXISTS (
    SELECT 1 FROM bus b 
    JOIN location l1 ON b.from_location_id = l1.id 
    JOIN location l2 ON b.to_location_id = l2.id 
    WHERE l1.name = 'Coimbatore' AND l2.name = 'Valparai'
);

-- Salem to Yercaud
INSERT INTO bus (from_location_id, to_location_id, bus_name, bus_number, departure_time, arrival_time)
SELECT 
    (SELECT id FROM location WHERE name = 'Salem'), 
    (SELECT id FROM location WHERE name = 'Yercaud'),
    'TNSTC Hill Climber', 'TN-30-Y-1234', '08:00:00', '09:15:00'
FROM dual
WHERE NOT EXISTS (
    SELECT 1 FROM bus b 
    JOIN location l1 ON b.from_location_id = l1.id 
    JOIN location l2 ON b.to_location_id = l2.id 
    WHERE l1.name = 'Salem' AND l2.name = 'Yercaud'
);

-- Madurai to Theni
INSERT INTO bus (from_location_id, to_location_id, bus_name, bus_number, departure_time, arrival_time)
SELECT 
    (SELECT id FROM location WHERE name = 'Madurai'), 
    (SELECT id FROM location WHERE name = 'Theni'),
    'TNSTC Madurai-Theni Express', 'TN-59-T-1234', '07:30:00', '09:00:00'
FROM dual
WHERE NOT EXISTS (
    SELECT 1 FROM bus b 
    JOIN location l1 ON b.from_location_id = l1.id 
    JOIN location l2 ON b.to_location_id = l2.id 
    WHERE l1.name = 'Madurai' AND l2.name = 'Theni'
);

-- Madurai to Palani
INSERT INTO bus (from_location_id, to_location_id, bus_name, bus_number, departure_time, arrival_time)
SELECT 
    (SELECT id FROM location WHERE name = 'Madurai'), 
    (SELECT id FROM location WHERE name = 'Palani'),
    'TNSTC Murugan Special', 'TN-59-P-5678', '06:00:00', '09:00:00'
FROM dual
WHERE NOT EXISTS (
    SELECT 1 FROM bus b 
    JOIN location l1 ON b.from_location_id = l1.id 
    JOIN location l2 ON b.to_location_id = l2.id 
    WHERE l1.name = 'Madurai' AND l2.name = 'Palani'
);

-- Tirunelveli to Courtallam
INSERT INTO bus (from_location_id, to_location_id, bus_name, bus_number, departure_time, arrival_time)
SELECT 
    (SELECT id FROM location WHERE name = 'Tirunelveli'), 
    (SELECT id FROM location WHERE name = 'Courtallam'),
    'TNSTC Falls Express', 'TN-72-C-1234', '08:00:00', '09:00:00'
FROM dual
WHERE NOT EXISTS (
    SELECT 1 FROM bus b 
    JOIN location l1 ON b.from_location_id = l1.id 
    JOIN location l2 ON b.to_location_id = l2.id 
    WHERE l1.name = 'Tirunelveli' AND l2.name = 'Courtallam'
);

-- Tirunelveli to Tenkasi
INSERT INTO bus (from_location_id, to_location_id, bus_name, bus_number, departure_time, arrival_time)
SELECT 
    (SELECT id FROM location WHERE name = 'Tirunelveli'), 
    (SELECT id FROM location WHERE name = 'Tenkasi'),
    'TNSTC Nellai-Tenkasi Link', 'TN-72-T-5678', '07:00:00', '08:30:00'
FROM dual
WHERE NOT EXISTS (
    SELECT 1 FROM bus b 
    JOIN location l1 ON b.from_location_id = l1.id 
    JOIN location l2 ON b.to_location_id = l2.id 
    WHERE l1.name = 'Tirunelveli' AND l2.name = 'Tenkasi'
);

-- Trichy to Pudukkottai
INSERT INTO bus (from_location_id, to_location_id, bus_name, bus_number, departure_time, arrival_time)
SELECT 
    (SELECT id FROM location WHERE name = 'Trichy'), 
    (SELECT id FROM location WHERE name = 'Pudukkottai'),
    'TNSTC Rockfort Link', 'TN-45-P-1234', '07:30:00', '09:00:00'
FROM dual
WHERE NOT EXISTS (
    SELECT 1 FROM bus b 
    JOIN location l1 ON b.from_location_id = l1.id 
    JOIN location l2 ON b.to_location_id = l2.id 
    WHERE l1.name = 'Trichy' AND l2.name = 'Pudukkottai'
);

-- Trichy to Thanjavur
INSERT INTO bus (from_location_id, to_location_id, bus_name, bus_number, departure_time, arrival_time)
SELECT 
    (SELECT id FROM location WHERE name = 'Trichy'), 
    (SELECT id FROM location WHERE name = 'Thanjavur'),
    'TNSTC Chola Express', 'TN-45-T-5678', '07:00:00', '08:15:00'
FROM dual
WHERE NOT EXISTS (
    SELECT 1 FROM bus b 
    JOIN location l1 ON b.from_location_id = l1.id 
    JOIN location l2 ON b.to_location_id = l2.id 
    WHERE l1.name = 'Trichy' AND l2.name = 'Thanjavur'
);

-- Kanyakumari to Nagercoil
INSERT INTO bus (from_location_id, to_location_id, bus_name, bus_number, departure_time, arrival_time)
SELECT 
    (SELECT id FROM location WHERE name = 'Kanyakumari Town'), 
    (SELECT id FROM location WHERE name = 'Nagercoil'),
    'TNSTC Cape Shuttle', 'TN-74-N-1234', '07:00:00', '07:45:00'
FROM dual
WHERE NOT EXISTS (
    SELECT 1 FROM bus b 
    JOIN location l1 ON b.from_location_id = l1.id 
    JOIN location l2 ON b.to_location_id = l2.id 
    WHERE l1.name = 'Kanyakumari Town' AND l2.name = 'Nagercoil'
);

-- Adding stops data for one route as an example
-- Chennai to Kumbakonam bus with stops
INSERT INTO stop (bus_id, name, arrival_time, departure_time, stop_order)
SELECT 
    (SELECT b.id FROM bus b 
     JOIN location l1 ON b.from_location_id = l1.id 
     JOIN location l2 ON b.to_location_id = l2.id 
     WHERE l1.name = 'Chennai' AND l2.name = 'Kumbakonam' 
     LIMIT 1),
    'Chennai', '20:00:00', '20:00:00', 1
FROM dual
WHERE EXISTS (
    SELECT 1 FROM bus b 
    JOIN location l1 ON b.from_location_id = l1.id 
    JOIN location l2 ON b.to_location_id = l2.id 
    WHERE l1.name = 'Chennai' AND l2.name = 'Kumbakonam'
) AND NOT EXISTS (
    SELECT 1 FROM stop s 
    JOIN bus b ON s.bus_id = b.id
    JOIN location l1 ON b.from_location_id = l1.id
    JOIN location l2 ON b.to_location_id = l2.id
    WHERE l1.name = 'Chennai' AND l2.name = 'Kumbakonam' AND s.stop_order = 1
);

INSERT INTO stop (bus_id, name, arrival_time, departure_time, stop_order)
SELECT 
    (SELECT b.id FROM bus b 
     JOIN location l1 ON b.from_location_id = l1.id 
     JOIN location l2 ON b.to_location_id = l2.id 
     WHERE l1.name = 'Chennai' AND l2.name = 'Kumbakonam' 
     LIMIT 1),
    'Chengalpattu', '21:00:00', '21:05:00', 2
FROM dual
WHERE EXISTS (
    SELECT 1 FROM bus b 
    JOIN location l1 ON b.from_location_id = l1.id 
    JOIN location l2 ON b.to_location_id = l2.id 
    WHERE l1.name = 'Chennai' AND l2.name = 'Kumbakonam'
);

INSERT INTO stop (bus_id, name, arrival_time, departure_time, stop_order)
SELECT 
    (SELECT b.id FROM bus b 
     JOIN location l1 ON b.from_location_id = l1.id 
     JOIN location l2 ON b.to_location_id = l2.id 
     WHERE l1.name = 'Chennai' AND l2.name = 'Kumbakonam' 
     LIMIT 1),
    'Villupuram', '22:30:00', '22:40:00', 3
FROM dual
WHERE EXISTS (
    SELECT 1 FROM bus b 
    JOIN location l1 ON b.from_location_id = l1.id 
    JOIN location l2 ON b.to_location_id = l2.id 
    WHERE l1.name = 'Chennai' AND l2.name = 'Kumbakonam'
);

INSERT INTO stop (bus_id, name, arrival_time, departure_time, stop_order)
SELECT 
    (SELECT b.id FROM bus b 
     JOIN location l1 ON b.from_location_id = l1.id 
     JOIN location l2 ON b.to_location_id = l2.id 
     WHERE l1.name = 'Chennai' AND l2.name = 'Kumbakonam' 
     LIMIT 1),
    'Trichy', '02:00:00', '02:15:00', 4
FROM dual
WHERE EXISTS (
    SELECT 1 FROM bus b 
    JOIN location l1 ON b.from_location_id = l1.id 
    JOIN location l2 ON b.to_location_id = l2.id 
    WHERE l1.name = 'Chennai' AND l2.name = 'Kumbakonam'
);

INSERT INTO stop (bus_id, name, arrival_time, departure_time, stop_order)
SELECT 
    (SELECT b.id FROM bus b 
     JOIN location l1 ON b.from_location_id = l1.id 
     JOIN location l2 ON b.to_location_id = l2.id 
     WHERE l1.name = 'Chennai' AND l2.name = 'Kumbakonam' 
     LIMIT 1),
    'Thanjavur', '03:30:00', '03:45:00', 5
FROM dual
WHERE EXISTS (
    SELECT 1 FROM bus b 
    JOIN location l1 ON b.from_location_id = l1.id 
    JOIN location l2 ON b.to_location_id = l2.id 
    WHERE l1.name = 'Chennai' AND l2.name = 'Kumbakonam'
);

INSERT INTO stop (bus_id, name, arrival_time, departure_time, stop_order)
SELECT 
    (SELECT b.id FROM bus b 
     JOIN location l1 ON b.from_location_id = l1.id 
     JOIN location l2 ON b.to_location_id = l2.id 
     WHERE l1.name = 'Chennai' AND l2.name = 'Kumbakonam' 
     LIMIT 1),
    'Kumbakonam', '05:00:00', '05:00:00', 6
FROM dual
WHERE EXISTS (
    SELECT 1 FROM bus b 
    JOIN location l1 ON b.from_location_id = l1.id 
    JOIN location l2 ON b.to_location_id = l2.id 
    WHERE l1.name = 'Chennai' AND l2.name = 'Kumbakonam'
);