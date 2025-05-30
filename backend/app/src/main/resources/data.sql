-- Create tables with IF NOT EXISTS to prevent errors on repeated runs
CREATE TABLE IF NOT EXISTS locations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address VARCHAR(255),
    latitude DOUBLE,
    longitude DOUBLE
);

CREATE TABLE IF NOT EXISTS buses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    from_location_id INT NOT NULL,
    to_location_id INT NOT NULL,
    bus_name VARCHAR(255),
    bus_number VARCHAR(255),
    departure_time TIME NOT NULL,
    arrival_time TIME NOT NULL,
    FOREIGN KEY (from_location_id) REFERENCES locations(id),
    FOREIGN KEY (to_location_id) REFERENCES locations(id)
);

CREATE TABLE IF NOT EXISTS stops (
    id INT AUTO_INCREMENT PRIMARY KEY,
    bus_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    arrival_time TIME,
    departure_time TIME,
    stop_order INT NOT NULL,
    location_id INT,
    FOREIGN KEY (bus_id) REFERENCES buses(id),
    FOREIGN KEY (location_id) REFERENCES locations(id)
);

-- Create new table for connecting routes
CREATE TABLE IF NOT EXISTS connecting_route (
    id INT AUTO_INCREMENT PRIMARY KEY,
    from_location_id INT NOT NULL,
    to_location_id INT NOT NULL,
    first_bus_id INT NOT NULL,
    second_bus_id INT NOT NULL,
    connection_location_id INT NOT NULL,
    wait_time_minutes INT NOT NULL,
    FOREIGN KEY (from_location_id) REFERENCES locations(id),
    FOREIGN KEY (to_location_id) REFERENCES locations(id),
    FOREIGN KEY (first_bus_id) REFERENCES buses(id),
    FOREIGN KEY (second_bus_id) REFERENCES buses(id),
    FOREIGN KEY (connection_location_id) REFERENCES locations(id)
);

-- Only insert data if the locations table is empty
INSERT INTO locations (name)
SELECT 'Chennai' FROM dual WHERE NOT EXISTS (SELECT 1 FROM locations LIMIT 1);

-- Only proceed with inserts if the locations table was previously empty
INSERT INTO locations (name) 
SELECT 'Coimbatore' FROM dual WHERE EXISTS (SELECT 1 FROM locations WHERE name = 'Chennai' AND (SELECT COUNT(*) FROM locations) = 1);

-- Original locations from the initial script
INSERT INTO locations (name) 
SELECT 'Madurai' FROM dual WHERE EXISTS (SELECT 1 FROM locations WHERE name = 'Chennai' AND (SELECT COUNT(*) FROM locations) <= 2);

INSERT INTO locations (name) 
SELECT 'Trichy' FROM dual WHERE EXISTS (SELECT 1 FROM locations WHERE name = 'Chennai' AND (SELECT COUNT(*) FROM locations) <= 3);

INSERT INTO locations (name) 
SELECT 'Salem' FROM dual WHERE EXISTS (SELECT 1 FROM locations WHERE name = 'Chennai' AND (SELECT COUNT(*) FROM locations) <= 4);

INSERT INTO locations (name) 
SELECT 'Tirunelveli' FROM dual WHERE EXISTS (SELECT 1 FROM locations WHERE name = 'Chennai' AND (SELECT COUNT(*) FROM locations) <= 5);

INSERT INTO locations (name) 
SELECT 'Kanyakumari' FROM dual WHERE EXISTS (SELECT 1 FROM locations WHERE name = 'Chennai' AND (SELECT COUNT(*) FROM locations) <= 6);

INSERT INTO locations (name) 
SELECT 'Vellore' FROM dual WHERE EXISTS (SELECT 1 FROM locations WHERE name = 'Chennai' AND (SELECT COUNT(*) FROM locations) <= 7);

INSERT INTO locations (name) 
SELECT 'Thanjavur' FROM dual WHERE EXISTS (SELECT 1 FROM locations WHERE name = 'Chennai' AND (SELECT COUNT(*) FROM locations) <= 8);

INSERT INTO locations (name) 
SELECT 'Thoothukudi' FROM dual WHERE EXISTS (SELECT 1 FROM locations WHERE name = 'Chennai' AND (SELECT COUNT(*) FROM locations) <= 9);

INSERT INTO locations (name) 
SELECT 'Dindigul' FROM dual WHERE EXISTS (SELECT 1 FROM locations WHERE name = 'Chennai' AND (SELECT COUNT(*) FROM locations) <= 10);

INSERT INTO locations (name) 
SELECT 'Erode' FROM dual WHERE EXISTS (SELECT 1 FROM locations WHERE name = 'Chennai' AND (SELECT COUNT(*) FROM locations) <= 11);

INSERT INTO locations (name) 
SELECT 'Tirupur' FROM dual WHERE EXISTS (SELECT 1 FROM locations WHERE name = 'Chennai' AND (SELECT COUNT(*) FROM locations) <= 12);

INSERT INTO locations (name) 
SELECT 'Nagercoil' FROM dual WHERE EXISTS (SELECT 1 FROM locations WHERE name = 'Chennai' AND (SELECT COUNT(*) FROM locations) <= 13);

INSERT INTO locations (name) 
SELECT 'Hosur' FROM dual WHERE EXISTS (SELECT 1 FROM locations WHERE name = 'Chennai' AND (SELECT COUNT(*) FROM locations) <= 14);

INSERT INTO locations (name) 
SELECT 'Karur' FROM dual WHERE EXISTS (SELECT 1 FROM locations WHERE name = 'Chennai' AND (SELECT COUNT(*) FROM locations) <= 15);

INSERT INTO locations (name) 
SELECT 'Namakkal' FROM dual WHERE EXISTS (SELECT 1 FROM locations WHERE name = 'Chennai' AND (SELECT COUNT(*) FROM locations) <= 16);

INSERT INTO locations (name) 
SELECT 'Rameswaram' FROM dual WHERE EXISTS (SELECT 1 FROM locations WHERE name = 'Chennai' AND (SELECT COUNT(*) FROM locations) <= 17);

INSERT INTO locations (name) 
SELECT 'Kodaikanal' FROM dual WHERE EXISTS (SELECT 1 FROM locations WHERE name = 'Chennai' AND (SELECT COUNT(*) FROM locations) <= 18);

INSERT INTO locations (name) 
SELECT 'Ooty' FROM dual WHERE EXISTS (SELECT 1 FROM locations WHERE name = 'Chennai' AND (SELECT COUNT(*) FROM locations) <= 19);

INSERT INTO locations (name) 
SELECT 'Coonoor' FROM dual WHERE EXISTS (SELECT 1 FROM locations WHERE name = 'Chennai' AND (SELECT COUNT(*) FROM locations) <= 20);

-- Additional locations from various regions of Tamil Nadu
INSERT INTO locations (name) 
SELECT 'Kanchipuram' FROM dual WHERE NOT EXISTS (SELECT 1 FROM locations WHERE name = 'Kanchipuram');

INSERT INTO locations (name) 
SELECT 'Kumbakonam' FROM dual WHERE NOT EXISTS (SELECT 1 FROM locations WHERE name = 'Kumbakonam');

INSERT INTO locations (name) 
SELECT 'Tenkasi' FROM dual WHERE NOT EXISTS (SELECT 1 FROM locations WHERE name = 'Tenkasi');

INSERT INTO locations (name) 
SELECT 'Theni' FROM dual WHERE NOT EXISTS (SELECT 1 FROM locations WHERE name = 'Theni');

INSERT INTO locations (name) 
SELECT 'Cuddalore' FROM dual WHERE NOT EXISTS (SELECT 1 FROM locations WHERE name = 'Cuddalore');

INSERT INTO locations (name) 
SELECT 'Chengalpattu' FROM dual WHERE NOT EXISTS (SELECT 1 FROM locations WHERE name = 'Chengalpattu');

INSERT INTO locations (name) 
SELECT 'Dharmapuri' FROM dual WHERE NOT EXISTS (SELECT 1 FROM locations WHERE name = 'Dharmapuri');

INSERT INTO locations (name) 
SELECT 'Krishnagiri' FROM dual WHERE NOT EXISTS (SELECT 1 FROM locations WHERE name = 'Krishnagiri');

INSERT INTO locations (name) 
SELECT 'Kallakurichi' FROM dual WHERE NOT EXISTS (SELECT 1 FROM locations WHERE name = 'Kallakurichi');

INSERT INTO locations (name) 
SELECT 'Ariyalur' FROM dual WHERE NOT EXISTS (SELECT 1 FROM locations WHERE name = 'Ariyalur');

INSERT INTO locations (name) 
SELECT 'Perambalur' FROM dual WHERE NOT EXISTS (SELECT 1 FROM locations WHERE name = 'Perambalur');

INSERT INTO locations (name) 
SELECT 'Nagapattinam' FROM dual WHERE NOT EXISTS (SELECT 1 FROM locations WHERE name = 'Nagapattinam');

INSERT INTO locations (name) 
SELECT 'Mayiladuthurai' FROM dual WHERE NOT EXISTS (SELECT 1 FROM locations WHERE name = 'Mayiladuthurai');

INSERT INTO locations (name) 
SELECT 'Pudukkottai' FROM dual WHERE NOT EXISTS (SELECT 1 FROM locations WHERE name = 'Pudukkottai');

INSERT INTO locations (name) 
SELECT 'Virudhunagar' FROM dual WHERE NOT EXISTS (SELECT 1 FROM locations WHERE name = 'Virudhunagar');

INSERT INTO locations (name) 
SELECT 'Sivakasi' FROM dual WHERE NOT EXISTS (SELECT 1 FROM locations WHERE name = 'Sivakasi');

INSERT INTO locations (name) 
SELECT 'Ramanathapuram' FROM dual WHERE NOT EXISTS (SELECT 1 FROM locations WHERE name = 'Ramanathapuram');

INSERT INTO locations (name) 
SELECT 'Sivaganga' FROM dual WHERE NOT EXISTS (SELECT 1 FROM locations WHERE name = 'Sivaganga');

INSERT INTO locations (name) 
SELECT 'Tiruvannamalai' FROM dual WHERE NOT EXISTS (SELECT 1 FROM locations WHERE name = 'Tiruvannamalai');

INSERT INTO locations (name) 
SELECT 'Poonamallee' FROM dual WHERE NOT EXISTS (SELECT 1 FROM locations WHERE name = 'Poonamallee');

INSERT INTO locations (name) 
SELECT 'Tirupathur' FROM dual WHERE NOT EXISTS (SELECT 1 FROM locations WHERE name = 'Tirupathur');

INSERT INTO locations (name) 
SELECT 'Ranipet' FROM dual WHERE NOT EXISTS (SELECT 1 FROM locations WHERE name = 'Ranipet');

INSERT INTO locations (name) 
SELECT 'Thiruvallur' FROM dual WHERE NOT EXISTS (SELECT 1 FROM locations WHERE name = 'Thiruvallur');

INSERT INTO locations (name) 
SELECT 'Kanyakumari Town' FROM dual WHERE NOT EXISTS (SELECT 1 FROM locations WHERE name = 'Kanyakumari Town');

INSERT INTO locations (name) 
SELECT 'Pollachi' FROM dual WHERE NOT EXISTS (SELECT 1 FROM locations WHERE name = 'Pollachi');

INSERT INTO locations (name) 
SELECT 'Palani' FROM dual WHERE NOT EXISTS (SELECT 1 FROM locations WHERE name = 'Palani');

INSERT INTO locations (name) 
SELECT 'Tuticorin' FROM dual WHERE NOT EXISTS (SELECT 1 FROM locations WHERE name = 'Tuticorin');

INSERT INTO locations (name) 
SELECT 'Yercaud' FROM dual WHERE NOT EXISTS (SELECT 1 FROM locations WHERE name = 'Yercaud');

INSERT INTO locations (name) 
SELECT 'Mahabalipuram' FROM dual WHERE NOT EXISTS (SELECT 1 FROM locations WHERE name = 'Mahabalipuram');

INSERT INTO locations (name) 
SELECT 'Kotagiri' FROM dual WHERE NOT EXISTS (SELECT 1 FROM locations WHERE name = 'Kotagiri');

INSERT INTO locations (name) 
SELECT 'Valparai' FROM dual WHERE NOT EXISTS (SELECT 1 FROM locations WHERE name = 'Valparai');

INSERT INTO locations (name) 
SELECT 'Courtallam' FROM dual WHERE NOT EXISTS (SELECT 1 FROM locations WHERE name = 'Courtallam');

INSERT INTO locations (name) 
SELECT 'Hogenakkal' FROM dual WHERE NOT EXISTS (SELECT 1 FROM locations WHERE name = 'Hogenakkal');

INSERT INTO locations (name) 
SELECT 'Mettupalayam' FROM dual WHERE NOT EXISTS (SELECT 1 FROM locations WHERE name = 'Mettupalayam');

INSERT INTO locations (name) 
SELECT 'Kovilpatti' FROM dual WHERE NOT EXISTS (SELECT 1 FROM locations WHERE name = 'Kovilpatti');

-- Only insert buses if the buses table is empty
-- Chennai to multiple destinations
INSERT INTO buses (from_location_id, to_location_id, bus_name, bus_number, departure_time, arrival_time)
SELECT 1, 2, 'SETC Chennai Express', 'TN-01-1234', '06:00:00', '12:30:00' FROM dual
WHERE NOT EXISTS (SELECT 1 FROM buses LIMIT 1);

INSERT INTO buses (from_location_id, to_location_id, bus_name, bus_number, departure_time, arrival_time)
SELECT 1, 2, 'TNSTC Kovai Deluxe', 'TN-01-5678', '08:00:00', '14:30:00' FROM dual
WHERE EXISTS (SELECT 1 FROM buses WHERE id = 1);

INSERT INTO buses (from_location_id, to_location_id, bus_name, bus_number, departure_time, arrival_time)
SELECT 1, 2, 'Chennai-Coimbatore Super Fast', 'TN-01-9876', '10:00:00', '16:30:00' FROM dual
WHERE EXISTS (SELECT 1 FROM buses WHERE id = 2);

INSERT INTO buses (from_location_id, to_location_id, bus_name, bus_number, departure_time, arrival_time)
SELECT 1, 3, 'SETC Madurai Express', 'TN-01-2345', '07:00:00', '14:00:00' FROM dual
WHERE EXISTS (SELECT 1 FROM buses WHERE id = 3);

INSERT INTO buses (from_location_id, to_location_id, bus_name, bus_number, departure_time, arrival_time)
SELECT 1, 3, 'TNSTC Madurai Special', 'TN-01-6789', '09:00:00', '16:00:00' FROM dual
WHERE EXISTS (SELECT 1 FROM buses WHERE id = 4);

INSERT INTO buses (from_location_id, to_location_id, bus_name, bus_number, departure_time, arrival_time)
SELECT 1, 4, 'SETC Trichy Express', 'TN-01-3456', '08:00:00', '14:00:00' FROM dual
WHERE EXISTS (SELECT 1 FROM buses WHERE id = 5);

INSERT INTO buses (from_location_id, to_location_id, bus_name, bus_number, departure_time, arrival_time)
SELECT 1, 4, 'TNSTC Trichy Flyer', 'TN-01-7890', '10:00:00', '16:00:00' FROM dual
WHERE EXISTS (SELECT 1 FROM buses WHERE id = 6);

INSERT INTO buses (from_location_id, to_location_id, bus_name, bus_number, departure_time, arrival_time)
SELECT 1, 5, 'SETC Salem Express', 'TN-01-4567', '07:30:00', '12:30:00' FROM dual
WHERE EXISTS (SELECT 1 FROM buses WHERE id = 7);

INSERT INTO buses (from_location_id, to_location_id, bus_name, bus_number, departure_time, arrival_time)
SELECT 1, 5, 'TNSTC Salem Special', 'TN-01-8901', '09:30:00', '14:30:00' FROM dual
WHERE EXISTS (SELECT 1 FROM buses WHERE id = 8);

INSERT INTO buses (from_location_id, to_location_id, bus_name, bus_number, departure_time, arrival_time)
SELECT 1, 6, 'SETC Tirunelveli Express', 'TN-01-5678', '18:00:00', '06:00:00' FROM dual
WHERE EXISTS (SELECT 1 FROM buses WHERE id = 9);

-- Add more bus routes
INSERT INTO buses (from_location_id, to_location_id, bus_name, bus_number, departure_time, arrival_time)
SELECT 1, 7, 'SETC Kanyakumari Express', 'TN-01-6789', '20:00:00', '10:00:00' FROM dual
WHERE EXISTS (SELECT 1 FROM buses WHERE id = 10);

INSERT INTO buses (from_location_id, to_location_id, bus_name, bus_number, departure_time, arrival_time)
SELECT 1, 8, 'TNSTC Vellore Traveller', 'TN-01-7890', '08:30:00', '11:30:00' FROM dual
WHERE EXISTS (SELECT 1 FROM buses WHERE id = 11);

-- Coimbatore to multiple destinations
INSERT INTO buses (from_location_id, to_location_id, bus_name, bus_number, departure_time, arrival_time)
SELECT 2, 1, 'SETC Coimbatore Express', 'TN-02-1234', '06:00:00', '12:30:00' FROM dual
WHERE EXISTS (SELECT 1 FROM buses WHERE id = 12);

INSERT INTO buses (from_location_id, to_location_id, bus_name, bus_number, departure_time, arrival_time)
SELECT 2, 3, 'TNSTC Kovai-Madurai Express', 'TN-02-2345', '07:00:00', '11:30:00' FROM dual
WHERE EXISTS (SELECT 1 FROM buses WHERE id = 13);

INSERT INTO buses (from_location_id, to_location_id, bus_name, bus_number, departure_time, arrival_time)
SELECT 2, 4, 'SETC Kovai-Trichy Liner', 'TN-02-3456', '08:00:00', '13:00:00' FROM dual
WHERE EXISTS (SELECT 1 FROM buses WHERE id = 14);

-- Insert stops data if the stops table is empty
INSERT INTO stops (bus_id, name, arrival_time, departure_time, stop_order)
SELECT 1, 'Chennai', '06:00:00', '06:00:00', 1 FROM dual
WHERE NOT EXISTS (SELECT 1 FROM stops LIMIT 1);

INSERT INTO stops (bus_id, name, arrival_time, departure_time, stop_order)
SELECT 1, 'Vellore', '07:30:00', '07:35:00', 2 FROM dual
WHERE EXISTS (SELECT 1 FROM stops WHERE id = 1);

INSERT INTO stops (bus_id, name, arrival_time, departure_time, stop_order)
SELECT 1, 'Salem', '09:30:00', '09:40:00', 3 FROM dual
WHERE EXISTS (SELECT 1 FROM stops WHERE id = 2);

INSERT INTO stops (bus_id, name, arrival_time, departure_time, stop_order)
SELECT 1, 'Erode', '11:00:00', '11:05:00', 4 FROM dual
WHERE EXISTS (SELECT 1 FROM stops WHERE id = 3);

INSERT INTO stops (bus_id, name, arrival_time, departure_time, stop_order)
SELECT 1, 'Coimbatore', '12:30:00', '12:30:00', 5 FROM dual
WHERE EXISTS (SELECT 1 FROM stops WHERE id = 4);

-- Stops for Chennai to Madurai Express (Bus ID 4)
INSERT INTO stops (bus_id, name, arrival_time, departure_time, stop_order)
SELECT 4, 'Chennai', '07:00:00', '07:00:00', 1 FROM dual
WHERE EXISTS (SELECT 1 FROM stops WHERE id = 5);

INSERT INTO stops (bus_id, name, arrival_time, departure_time, stop_order)
SELECT 4, 'Villupuram', '08:30:00', '08:35:00', 2 FROM dual
WHERE EXISTS (SELECT 1 FROM stops WHERE id = 6);

INSERT INTO stops (bus_id, name, arrival_time, departure_time, stop_order)
SELECT 4, 'Trichy', '11:00:00', '11:10:00', 3 FROM dual
WHERE EXISTS (SELECT 1 FROM stops WHERE id = 7);

INSERT INTO stops (bus_id, name, arrival_time, departure_time, stop_order)
SELECT 4, 'Dindigul', '12:30:00', '12:35:00', 4 FROM dual
WHERE EXISTS (SELECT 1 FROM stops WHERE id = 8);

INSERT INTO stops (bus_id, name, arrival_time, departure_time, stop_order)
SELECT 4, 'Madurai', '14:00:00', '14:00:00', 5 FROM dual
WHERE EXISTS (SELECT 1 FROM stops WHERE id = 9);

-- Stops for Chennai to Tirunelveli Express route
INSERT INTO stops (bus_id, name, arrival_time, departure_time, stop_order)
SELECT 
    (SELECT id FROM buses WHERE bus_name = 'SETC Tirunelveli Express' LIMIT 1),
    'Chennai', '18:00:00', '18:00:00', 1
FROM dual;

INSERT INTO stops (bus_id, name, arrival_time, departure_time, stop_order)
SELECT 
    (SELECT id FROM buses WHERE bus_name = 'SETC Tirunelveli Express' LIMIT 1),
    'Villupuram', '20:30:00', '20:35:00', 2
FROM dual;

INSERT INTO stops (bus_id, name, arrival_time, departure_time, stop_order)
SELECT 
    (SELECT id FROM buses WHERE bus_name = 'SETC Tirunelveli Express' LIMIT 1),
    'Trichy', '23:00:00', '23:15:00', 3
FROM dual;

INSERT INTO stops (bus_id, name, arrival_time, departure_time, stop_order)
SELECT 
    (SELECT id FROM buses WHERE bus_name = 'SETC Tirunelveli Express' LIMIT 1),
    'Madurai', '01:30:00', '01:45:00', 4
FROM dual;

INSERT INTO stops (bus_id, name, arrival_time, departure_time, stop_order)
SELECT 
    (SELECT id FROM buses WHERE bus_name = 'SETC Tirunelveli Express' LIMIT 1),
    'Tirunelveli', '06:00:00', '06:00:00', 5
FROM dual;

-- Stops for Coimbatore to Madurai Express route
INSERT INTO stops (bus_id, name, arrival_time, departure_time, stop_order)
SELECT 
    (SELECT id FROM buses WHERE bus_name = 'TNSTC Kovai-Madurai Express' LIMIT 1),
    'Coimbatore', '07:00:00', '07:00:00', 1
FROM dual;

INSERT INTO stops (bus_id, name, arrival_time, departure_time, stop_order)
SELECT 
    (SELECT id FROM buses WHERE bus_name = 'TNSTC Kovai-Madurai Express' LIMIT 1),
    'Palladam', '07:45:00', '07:50:00', 2
FROM dual;

INSERT INTO stops (bus_id, name, arrival_time, departure_time, stop_order)
SELECT 
    (SELECT id FROM buses WHERE bus_name = 'TNSTC Kovai-Madurai Express' LIMIT 1),
    'Karur', '09:00:00', '09:10:00', 3
FROM dual;

INSERT INTO stops (bus_id, name, arrival_time, departure_time, stop_order)
SELECT 
    (SELECT id FROM buses WHERE bus_name = 'TNSTC Kovai-Madurai Express' LIMIT 1),
    'Dindigul', '10:15:00', '10:20:00', 4
FROM dual;

INSERT INTO stops (bus_id, name, arrival_time, departure_time, stop_order)
SELECT 
    (SELECT id FROM buses WHERE bus_name = 'TNSTC Kovai-Madurai Express' LIMIT 1),
    'Madurai', '11:30:00', '11:30:00', 5
FROM dual;

-- Stops for Coimbatore to Trichy route
INSERT INTO stops (bus_id, name, arrival_time, departure_time, stop_order)
SELECT 
    (SELECT id FROM buses WHERE bus_name = 'SETC Kovai-Trichy Liner' LIMIT 1),
    'Coimbatore', '08:00:00', '08:00:00', 1
FROM dual;

INSERT INTO stops (bus_id, name, arrival_time, departure_time, stop_order)
SELECT 
    (SELECT id FROM buses WHERE bus_name = 'SETC Kovai-Trichy Liner' LIMIT 1),
    'Karur', '10:00:00', '10:10:00', 2
FROM dual;

INSERT INTO stops (bus_id, name, arrival_time, departure_time, stop_order)
SELECT 
    (SELECT id FROM buses WHERE bus_name = 'SETC Kovai-Trichy Liner' LIMIT 1),
    'Kulithalai', '11:15:00', '11:20:00', 3
FROM dual;

INSERT INTO stops (bus_id, name, arrival_time, departure_time, stop_order)
SELECT 
    (SELECT id FROM buses WHERE bus_name = 'SETC Kovai-Trichy Liner' LIMIT 1),
    'Trichy', '13:00:00', '13:00:00', 4
FROM dual;

-- Stops for Chennai to Kanchipuram route
INSERT INTO stops (bus_id, name, arrival_time, departure_time, stop_order)
SELECT 
    (SELECT b.id FROM buses b 
     JOIN locations l1 ON b.from_location_id = l1.id 
     JOIN locations l2 ON b.to_location_id = l2.id 
     WHERE l1.name = 'Chennai' AND l2.name = 'Kanchipuram' 
     LIMIT 1),
    'Chennai', '06:00:00', '06:00:00', 1
FROM dual;

INSERT INTO stops (bus_id, name, arrival_time, departure_time, stop_order)
SELECT 
    (SELECT b.id FROM buses b 
     JOIN locations l1 ON b.from_location_id = l1.id 
     JOIN locations l2 ON b.to_location_id = l2.id 
     WHERE l1.name = 'Chennai' AND l2.name = 'Kanchipuram' 
     LIMIT 1),
    'Poonamallee', '06:30:00', '06:35:00', 2
FROM dual;

INSERT INTO stops (bus_id, name, arrival_time, departure_time, stop_order)
SELECT 
    (SELECT b.id FROM buses b 
     JOIN locations l1 ON b.from_location_id = l1.id 
     JOIN locations l2 ON b.to_location_id = l2.id 
     WHERE l1.name = 'Chennai' AND l2.name = 'Kanchipuram' 
     LIMIT 1),
    'Kanchipuram', '07:30:00', '07:30:00', 3
FROM dual;

-- Stops for Chennai to Tiruvannamalai route
INSERT INTO stops (bus_id, name, arrival_time, departure_time, stop_order)
SELECT 
    (SELECT b.id FROM buses b 
     JOIN locations l1 ON b.from_location_id = l1.id 
     JOIN locations l2 ON b.to_location_id = l2.id 
     WHERE l1.name = 'Chennai' AND l2.name = 'Tiruvannamalai' 
     LIMIT 1),
    'Chennai', '07:00:00', '07:00:00', 1
FROM dual;

INSERT INTO stops (bus_id, name, arrival_time, departure_time, stop_order)
SELECT 
    (SELECT b.id FROM buses b 
     JOIN locations l1 ON b.from_location_id = l1.id 
     JOIN locations l2 ON b.to_location_id = l2.id 
     WHERE l1.name = 'Chennai' AND l2.name = 'Tiruvannamalai' 
     LIMIT 1),
    'Kanchipuram', '08:15:00', '08:20:00', 2
FROM dual;

INSERT INTO stops (bus_id, name, arrival_time, departure_time, stop_order)
SELECT 
    (SELECT b.id FROM buses b 
     JOIN locations l1 ON b.from_location_id = l1.id 
     JOIN locations l2 ON b.to_location_id = l2.id 
     WHERE l1.name = 'Chennai' AND l2.name = 'Tiruvannamalai' 
     LIMIT 1),
    'Tiruvannamalai', '10:30:00', '10:30:00', 3
FROM dual;

-- Stops for Coimbatore to Valparai route
INSERT INTO stops (bus_id, name, arrival_time, departure_time, stop_order)
SELECT 
    (SELECT b.id FROM buses b 
     JOIN locations l1 ON b.from_location_id = l1.id 
     JOIN locations l2 ON b.to_location_id = l2.id 
     WHERE l1.name = 'Coimbatore' AND l2.name = 'Valparai' 
     LIMIT 1),
    'Coimbatore', '07:00:00', '07:00:00', 1
FROM dual;

INSERT INTO stops (bus_id, name, arrival_time, departure_time, stop_order)
SELECT 
    (SELECT b.id FROM buses b 
     JOIN locations l1 ON b.from_location_id = l1.id 
     JOIN locations l2 ON b.to_location_id = l2.id 
     WHERE l1.name = 'Coimbatore' AND l2.name = 'Valparai' 
     LIMIT 1),
    'Pollachi', '08:15:00', '08:25:00', 2
FROM dual;

INSERT INTO stops (bus_id, name, arrival_time, departure_time, stop_order)
SELECT 
    (SELECT b.id FROM buses b 
     JOIN locations l1 ON b.from_location_id = l1.id 
     JOIN locations l2 ON b.to_location_id = l2.id 
     WHERE l1.name = 'Coimbatore' AND l2.name = 'Valparai' 
     LIMIT 1),
    'Aliyar', '09:30:00', '09:35:00', 3
FROM dual;

INSERT INTO stops (bus_id, name, arrival_time, departure_time, stop_order)
SELECT 
    (SELECT b.id FROM buses b 
     JOIN locations l1 ON b.from_location_id = l1.id 
     JOIN locations l2 ON b.to_location_id = l2.id 
     WHERE l1.name = 'Coimbatore' AND l2.name = 'Valparai' 
     LIMIT 1),
    'Attakatti', '10:30:00', '10:35:00', 4
FROM dual;

INSERT INTO stops (bus_id, name, arrival_time, departure_time, stop_order)
SELECT 
    (SELECT b.id FROM buses b 
     JOIN locations l1 ON b.from_location_id = l1.id 
     JOIN locations l2 ON b.to_location_id = l2.id 
     WHERE l1.name = 'Coimbatore' AND l2.name = 'Valparai' 
     LIMIT 1),
    'Valparai', '11:30:00', '11:30:00', 5
FROM dual;

-- Stops for Salem to Yercaud route
INSERT INTO stops (bus_id, name, arrival_time, departure_time, stop_order)
SELECT 
    (SELECT b.id FROM buses b 
     JOIN locations l1 ON b.from_location_id = l1.id 
     JOIN locations l2 ON b.to_location_id = l2.id 
     WHERE l1.name = 'Salem' AND l2.name = 'Yercaud' 
     LIMIT 1),
    'Salem', '08:00:00', '08:00:00', 1
FROM dual;

INSERT INTO stops (bus_id, name, arrival_time, departure_time, stop_order)
SELECT 
    (SELECT b.id FROM buses b 
     JOIN locations l1 ON b.from_location_id = l1.id 
     JOIN locations l2 ON b.to_location_id = l2.id 
     WHERE l1.name = 'Salem' AND l2.name = 'Yercaud' 
     LIMIT 1),
    'Yercaud Foothills', '08:30:00', '08:35:00', 2
FROM dual;

INSERT INTO stops (bus_id, name, arrival_time, departure_time, stop_order)
SELECT 
    (SELECT b.id FROM buses b 
     JOIN locations l1 ON b.from_location_id = l1.id 
     JOIN locations l2 ON b.to_location_id = l2.id 
     WHERE l1.name = 'Salem' AND l2.name = 'Yercaud' 
     LIMIT 1),
    'Yercaud', '09:15:00', '09:15:00', 3
FROM dual;

-- Stops for Madurai to Theni route
INSERT INTO stops (bus_id, name, arrival_time, departure_time, stop_order)
SELECT 
    (SELECT b.id FROM buses b 
     JOIN locations l1 ON b.from_location_id = l1.id 
     JOIN locations l2 ON b.to_location_id = l2.id 
     WHERE l1.name = 'Madurai' AND l2.name = 'Theni' 
     LIMIT 1),
    'Madurai', '07:30:00', '07:30:00', 1
FROM dual;

INSERT INTO stops (bus_id, name, arrival_time, departure_time, stop_order)
SELECT 
    (SELECT b.id FROM buses b 
     JOIN locations l1 ON b.from_location_id = l1.id 
     JOIN locations l2 ON b.to_location_id = l2.id 
     WHERE l1.name = 'Madurai' AND l2.name = 'Theni' 
     LIMIT 1),
    'Andipatti', '08:15:00', '08:20:00', 2
FROM dual;

INSERT INTO stops (bus_id, name, arrival_time, departure_time, stop_order)
SELECT 
    (SELECT b.id FROM buses b 
     JOIN locations l1 ON b.from_location_id = l1.id 
     JOIN locations l2 ON b.to_location_id = l2.id 
     WHERE l1.name = 'Madurai' AND l2.name = 'Theni' 
     LIMIT 1),
    'Theni', '09:00:00', '09:00:00', 3
FROM dual;

-- Stops for Madurai to Palani route
INSERT INTO stops (bus_id, name, arrival_time, departure_time, stop_order)
SELECT 
    (SELECT b.id FROM buses b 
     JOIN locations l1 ON b.from_location_id = l1.id 
     JOIN locations l2 ON b.to_location_id = l2.id 
     WHERE l1.name = 'Madurai' AND l2.name = 'Palani' 
     LIMIT 1),
    'Madurai', '06:00:00', '06:00:00', 1
FROM dual;

INSERT INTO stops (bus_id, name, arrival_time, departure_time, stop_order)
SELECT 
    (SELECT b.id FROM buses b 
     JOIN locations l1 ON b.from_location_id = l1.id 
     JOIN locations l2 ON b.to_location_id = l2.id 
     WHERE l1.name = 'Madurai' AND l2.name = 'Palani' 
     LIMIT 1),
    'Perumal Malai', '07:15:00', '07:20:00', 2
FROM dual;

INSERT INTO stops (bus_id, name, arrival_time, departure_time, stop_order)
SELECT 
    (SELECT b.id FROM buses b 
     JOIN locations l1 ON b.from_location_id = l1.id 
     JOIN locations l2 ON b.to_location_id = l2.id 
     WHERE l1.name = 'Madurai' AND l2.name = 'Palani' 
     LIMIT 1),
    'Palani', '09:00:00', '09:00:00', 3
FROM dual;

-- Stops for Tirunelveli to Courtallam route
INSERT INTO stops (bus_id, name, arrival_time, departure_time, stop_order)
SELECT 
    (SELECT b.id FROM buses b 
     JOIN locations l1 ON b.from_location_id = l1.id 
     JOIN locations l2 ON b.to_location_id = l2.id 
     WHERE l1.name = 'Tirunelveli' AND l2.name = 'Courtallam' 
     LIMIT 1),
    'Tirunelveli', '08:00:00', '08:00:00', 1
FROM dual;

INSERT INTO stops (bus_id, name, arrival_time, departure_time, stop_order)
SELECT 
    (SELECT b.id FROM buses b 
     JOIN locations l1 ON b.from_location_id = l1.id 
     JOIN locations l2 ON b.to_location_id = l2.id 
     WHERE l1.name = 'Tirunelveli' AND l2.name = 'Courtallam' 
     LIMIT 1),
    'Tenkasi', '08:30:00', '08:35:00', 2
FROM dual;

INSERT INTO stops (bus_id, name, arrival_time, departure_time, stop_order)
SELECT 
    (SELECT b.id FROM buses b 
     JOIN locations l1 ON b.from_location_id = l1.id 
     JOIN locations l2 ON b.to_location_id = l2.id 
     WHERE l1.name = 'Tirunelveli' AND l2.name = 'Courtallam' 
     LIMIT 1),
    'Courtallam', '09:00:00', '09:00:00', 3
FROM dual;

-- Stops for Trichy to Thanjavur route
INSERT INTO stops (bus_id, name, arrival_time, departure_time, stop_order)
SELECT 
    (SELECT b.id FROM buses b 
     JOIN locations l1 ON b.from_location_id = l1.id 
     JOIN locations l2 ON b.to_location_id = l2.id 
     WHERE l1.name = 'Trichy' AND l2.name = 'Thanjavur' 
     LIMIT 1),
    'Trichy', '07:00:00', '07:00:00', 1
FROM dual;

INSERT INTO stops (bus_id, name, arrival_time, departure_time, stop_order)
SELECT 
    (SELECT b.id FROM buses b 
     JOIN locations l1 ON b.from_location_id = l1.id 
     JOIN locations l2 ON b.to_location_id = l2.id 
     WHERE l1.name = 'Trichy' AND l2.name = 'Thanjavur' 
     LIMIT 1),
    'Tiruverumbur', '07:20:00', '07:25:00', 2
FROM dual;

INSERT INTO stops (bus_id, name, arrival_time, departure_time, stop_order)
SELECT 
    (SELECT b.id FROM buses b 
     JOIN locations l1 ON b.from_location_id = l1.id 
     JOIN locations l2 ON b.to_location_id = l2.id 
     WHERE l1.name = 'Trichy' AND l2.name = 'Thanjavur' 
     LIMIT 1),
    'Thanjavur', '08:15:00', '08:15:00', 3
FROM dual;

-- Stops for Trichy to Pudukkottai route
INSERT INTO stops (bus_id, name, arrival_time, departure_time, stop_order)
SELECT 
    (SELECT b.id FROM buses b 
     JOIN locations l1 ON b.from_location_id = l1.id 
     JOIN locations l2 ON b.to_location_id = l2.id 
     WHERE l1.name = 'Trichy' AND l2.name = 'Pudukkottai' 
     LIMIT 1),
    'Trichy', '07:30:00', '07:30:00', 1
FROM dual;

INSERT INTO stops (bus_id, name, arrival_time, departure_time, stop_order)
SELECT 
    (SELECT b.id FROM buses b 
     JOIN locations l1 ON b.from_location_id = l1.id 
     JOIN locations l2 ON b.to_location_id = l2.id 
     WHERE l1.name = 'Trichy' AND l2.name = 'Pudukkottai' 
     LIMIT 1),
    'Keeranur', '08:15:00', '08:20:00', 2
FROM dual;

INSERT INTO stops (bus_id, name, arrival_time, departure_time, stop_order)
SELECT 
    (SELECT b.id FROM buses b 
     JOIN locations l1 ON b.from_location_id = l1.id 
     JOIN locations l2 ON b.to_location_id = l2.id 
     WHERE l1.name = 'Trichy' AND l2.name = 'Pudukkottai' 
     LIMIT 1),
    'Pudukkottai', '09:00:00', '09:00:00', 3
FROM dual;

-- Add stops for Chennai-Coimbatore Super Fast (Bus ID 2)
INSERT INTO stops (bus_id, name, arrival_time, departure_time, stop_order, location_id)
VALUES 
    (2, 'Chennai', '10:00:00', '10:00:00', 1, (SELECT id FROM locations WHERE name = 'Chennai')),
    (2, 'Vellore', '11:30:00', '11:35:00', 2, (SELECT id FROM locations WHERE name = 'Vellore')),
    (2, 'Salem', '13:30:00', '13:40:00', 3, (SELECT id FROM locations WHERE name = 'Salem')),
    (2, 'Erode', '15:00:00', '15:05:00', 4, (SELECT id FROM locations WHERE name = 'Erode')),
    (2, 'Coimbatore', '16:30:00', '16:30:00', 5, (SELECT id FROM locations WHERE name = 'Coimbatore'));

-- Add stops for Chennai-Coimbatore Super Fast (Bus ID 3)
INSERT INTO stops (bus_id, name, arrival_time, departure_time, stop_order, location_id)
VALUES 
    (3, 'Chennai', '10:00:00', '10:00:00', 1, (SELECT id FROM locations WHERE name = 'Chennai')),
    (3, 'Vellore', '11:30:00', '11:35:00', 2, (SELECT id FROM locations WHERE name = 'Vellore')),
    (3, 'Salem', '13:30:00', '13:40:00', 3, (SELECT id FROM locations WHERE name = 'Salem')),
    (3, 'Erode', '15:00:00', '15:05:00', 4, (SELECT id FROM locations WHERE name = 'Erode')),
    (3, 'Coimbatore', '16:30:00', '16:30:00', 5, (SELECT id FROM locations WHERE name = 'Coimbatore'));

-- Bus routes for additional locations

-- Chennai to Kanchipuram
INSERT INTO buses (from_location_id, to_location_id, bus_name, bus_number, departure_time, arrival_time)
SELECT 
    (SELECT id FROM locations WHERE name = 'Chennai'), 
    (SELECT id FROM locations WHERE name = 'Kanchipuram'),
    'TNSTC Chennai-Kanchipuram Express', 'TN-01-K-1234', '06:00:00', '07:30:00'
FROM dual
WHERE NOT EXISTS (
    SELECT 1 FROM buses b 
    JOIN locations l1 ON b.from_location_id = l1.id 
    JOIN locations l2 ON b.to_location_id = l2.id 
    WHERE l1.name = 'Chennai' AND l2.name = 'Kanchipuram'
);

-- Chennai to Tiruvannamalai
INSERT INTO buses (from_location_id, to_location_id, bus_name, bus_number, departure_time, arrival_time)
SELECT 
    (SELECT id FROM locations WHERE name = 'Chennai'), 
    (SELECT id FROM locations WHERE name = 'Tiruvannamalai'),
    'SETC Arunachala Express', 'TN-01-T-5678', '07:00:00', '10:30:00'
FROM dual
WHERE NOT EXISTS (
    SELECT 1 FROM buses b 
    JOIN locations l1 ON b.from_location_id = l1.id 
    JOIN locations l2 ON b.to_location_id = l2.id 
    WHERE l1.name = 'Chennai' AND l2.name = 'Tiruvannamalai'
);

-- Chennai to Kumbakonam
INSERT INTO buses (from_location_id, to_location_id, bus_name, bus_number, departure_time, arrival_time)
SELECT 
    (SELECT id FROM locations WHERE name = 'Chennai'), 
    (SELECT id FROM locations WHERE name = 'Kumbakonam'),
    'SETC Chennai-Kumbakonam Deluxe', 'TN-01-K-7890', '20:00:00', '05:00:00'
FROM dual
WHERE NOT EXISTS (
    SELECT 1 FROM buses b 
    JOIN locations l1 ON b.from_location_id = l1.id 
    JOIN locations l2 ON b.to_location_id = l2.id 
    WHERE l1.name = 'Chennai' AND l2.name = 'Kumbakonam'
);

-- Chennai to Hogenakkal
INSERT INTO buses (from_location_id, to_location_id, bus_name, bus_number, departure_time, arrival_time)
SELECT 
    (SELECT id FROM locations WHERE name = 'Chennai'), 
    (SELECT id FROM locations WHERE name = 'Hogenakkal'),
    'TNSTC Falls Special', 'TN-01-H-2345', '06:30:00', '12:00:00'
FROM dual
WHERE NOT EXISTS (
    SELECT 1 FROM buses b 
    JOIN locations l1 ON b.from_location_id = l1.id 
    JOIN locations l2 ON b.to_location_id = l2.id 
    WHERE l1.name = 'Chennai' AND l2.name = 'Hogenakkal'
);

-- Coimbatore to Pollachi
INSERT INTO buses (from_location_id, to_location_id, bus_name, bus_number, departure_time, arrival_time)
SELECT 
    (SELECT id FROM locations WHERE name = 'Coimbatore'), 
    (SELECT id FROM locations WHERE name = 'Pollachi'),
    'TNSTC Kovai-Pollachi Shuttle', 'TN-38-P-1234', '06:00:00', '07:30:00'
FROM dual
WHERE NOT EXISTS (
    SELECT 1 FROM buses b 
    JOIN locations l1 ON b.from_location_id = l1.id 
    JOIN locations l2 ON b.to_location_id = l2.id 
    WHERE l1.name = 'Coimbatore' AND l2.name = 'Pollachi'
);

-- Coimbatore to Valparai
INSERT INTO buses (from_location_id, to_location_id, bus_name, bus_number, departure_time, arrival_time)
SELECT 
    (SELECT id FROM locations WHERE name = 'Coimbatore'), 
    (SELECT id FROM locations WHERE name = 'Valparai'),
    'TNSTC Hill Express', 'TN-38-V-5678', '07:00:00', '11:30:00'
FROM dual
WHERE NOT EXISTS (
    SELECT 1 FROM buses b 
    JOIN locations l1 ON b.from_location_id = l1.id 
    JOIN locations l2 ON b.to_location_id = l2.id 
    WHERE l1.name = 'Coimbatore' AND l2.name = 'Valparai'
);

-- Salem to Yercaud
INSERT INTO buses (from_location_id, to_location_id, bus_name, bus_number, departure_time, arrival_time)
SELECT 
    (SELECT id FROM locations WHERE name = 'Salem'), 
    (SELECT id FROM locations WHERE name = 'Yercaud'),
    'TNSTC Hill Climber', 'TN-30-Y-1234', '08:00:00', '09:15:00'
FROM dual
WHERE NOT EXISTS (
    SELECT 1 FROM buses b 
    JOIN locations l1 ON b.from_location_id = l1.id 
    JOIN locations l2 ON b.to_location_id = l2.id 
    WHERE l1.name = 'Salem' AND l2.name = 'Yercaud'
);

-- Madurai to Theni
INSERT INTO buses (from_location_id, to_location_id, bus_name, bus_number, departure_time, arrival_time)
SELECT 
    (SELECT id FROM locations WHERE name = 'Madurai'), 
    (SELECT id FROM locations WHERE name = 'Theni'),
    'TNSTC Madurai-Theni Express', 'TN-59-T-1234', '07:30:00', '09:00:00'
FROM dual
WHERE NOT EXISTS (
    SELECT 1 FROM buses b 
    JOIN locations l1 ON b.from_location_id = l1.id 
    JOIN locations l2 ON b.to_location_id = l2.id 
    WHERE l1.name = 'Madurai' AND l2.name = 'Theni'
);

-- Madurai to Palani
INSERT INTO buses (from_location_id, to_location_id, bus_name, bus_number, departure_time, arrival_time)
SELECT 
    (SELECT id FROM locations WHERE name = 'Madurai'), 
    (SELECT id FROM locations WHERE name = 'Palani'),
    'TNSTC Murugan Special', 'TN-59-P-5678', '06:00:00', '09:00:00'
FROM dual
WHERE NOT EXISTS (
    SELECT 1 FROM buses b 
    JOIN locations l1 ON b.from_location_id = l1.id 
    JOIN locations l2 ON b.to_location_id = l2.id 
    WHERE l1.name = 'Madurai' AND l2.name = 'Palani'
);

-- Tirunelveli to Courtallam
INSERT INTO buses (from_location_id, to_location_id, bus_name, bus_number, departure_time, arrival_time)
SELECT 
    (SELECT id FROM locations WHERE name = 'Tirunelveli'), 
    (SELECT id FROM locations WHERE name = 'Courtallam'),
    'TNSTC Falls Express', 'TN-72-C-1234', '08:00:00', '09:00:00'
FROM dual
WHERE NOT EXISTS (
    SELECT 1 FROM buses b 
    JOIN locations l1 ON b.from_location_id = l1.id 
    JOIN locations l2 ON b.to_location_id = l2.id 
    WHERE l1.name = 'Tirunelveli' AND l2.name = 'Courtallam'
);

-- Tirunelveli to Tenkasi
INSERT INTO buses (from_location_id, to_location_id, bus_name, bus_number, departure_time, arrival_time)
SELECT 
    (SELECT id FROM locations WHERE name = 'Tirunelveli'), 
    (SELECT id FROM locations WHERE name = 'Tenkasi'),
    'TNSTC Nellai-Tenkasi Link', 'TN-72-T-5678', '07:00:00', '08:30:00'
FROM dual
WHERE NOT EXISTS (
    SELECT 1 FROM buses b 
    JOIN locations l1 ON b.from_location_id = l1.id 
    JOIN locations l2 ON b.to_location_id = l2.id 
    WHERE l1.name = 'Tirunelveli' AND l2.name = 'Tenkasi'
);

-- Trichy to Pudukkottai
INSERT INTO buses (from_location_id, to_location_id, bus_name, bus_number, departure_time, arrival_time)
SELECT 
    (SELECT id FROM locations WHERE name = 'Trichy'), 
    (SELECT id FROM locations WHERE name = 'Pudukkottai'),
    'TNSTC Rockfort Link', 'TN-45-P-1234', '07:30:00', '09:00:00'
FROM dual
WHERE NOT EXISTS (
    SELECT 1 FROM buses b 
    JOIN locations l1 ON b.from_location_id = l1.id 
    JOIN locations l2 ON b.to_location_id = l2.id 
    WHERE l1.name = 'Trichy' AND l2.name = 'Pudukkottai'
);

-- Trichy to Thanjavur
INSERT INTO buses (from_location_id, to_location_id, bus_name, bus_number, departure_time, arrival_time)
SELECT 
    (SELECT id FROM locations WHERE name = 'Trichy'), 
    (SELECT id FROM locations WHERE name = 'Thanjavur'),
    'TNSTC Chola Express', 'TN-45-T-5678', '07:00:00', '08:15:00'
FROM dual
WHERE NOT EXISTS (
    SELECT 1 FROM buses b 
    JOIN locations l1 ON b.from_location_id = l1.id 
    JOIN locations l2 ON b.to_location_id = l2.id 
    WHERE l1.name = 'Trichy' AND l2.name = 'Thanjavur'
);

-- Kanyakumari to Nagercoil
INSERT INTO buses (from_location_id, to_location_id, bus_name, bus_number, departure_time, arrival_time)
SELECT 
    (SELECT id FROM locations WHERE name = 'Kanyakumari Town'), 
    (SELECT id FROM locations WHERE name = 'Nagercoil'),
    'TNSTC Cape Shuttle', 'TN-74-N-1234', '07:00:00', '07:45:00'
FROM dual
WHERE NOT EXISTS (
    SELECT 1 FROM buses b 
    JOIN locations l1 ON b.from_location_id = l1.id 
    JOIN locations l2 ON b.to_location_id = l2.id 
    WHERE l1.name = 'Kanyakumari Town' AND l2.name = 'Nagercoil'
);

-- Adding stops data for one route as an example - Chennai to Kumbakonam bus
INSERT INTO stops (bus_id, name, arrival_time, departure_time, stop_order)
SELECT 
    (SELECT b.id FROM buses b 
     JOIN locations l1 ON b.from_location_id = l1.id 
     JOIN locations l2 ON b.to_location_id = l2.id 
     WHERE l1.name = 'Chennai' AND l2.name = 'Kumbakonam' 
     LIMIT 1),
    'Chennai', '20:00:00', '20:00:00', 1
FROM dual
WHERE EXISTS (
    SELECT 1 FROM buses b 
    JOIN locations l1 ON b.from_location_id = l1.id 
    JOIN locations l2 ON b.to_location_id = l2.id 
    WHERE l1.name = 'Chennai' AND l2.name = 'Kumbakonam'
) AND NOT EXISTS (
    SELECT 1 FROM stops s 
    JOIN buses b ON s.bus_id = b.id
    JOIN locations l1 ON b.from_location_id = l1.id
    JOIN locations l2 ON b.to_location_id = l2.id
    WHERE l1.name = 'Chennai' AND l2.name = 'Kumbakonam' AND s.stop_order = 1
);

INSERT INTO stops (bus_id, name, arrival_time, departure_time, stop_order)
SELECT 
    (SELECT b.id FROM buses b 
     JOIN locations l1 ON b.from_location_id = l1.id 
     JOIN locations l2 ON b.to_location_id = l2.id 
     WHERE l1.name = 'Chennai' AND l2.name = 'Kumbakonam' 
     LIMIT 1),
    'Chengalpattu', '21:00:00', '21:05:00', 2
FROM dual
WHERE EXISTS (
    SELECT 1 FROM buses b 
    JOIN locations l1 ON b.from_location_id = l1.id 
    JOIN locations l2 ON b.to_location_id = l2.id 
    WHERE l1.name = 'Chennai' AND l2.name = 'Kumbakonam'
);

INSERT INTO stops (bus_id, name, arrival_time, departure_time, stop_order)
SELECT 
    (SELECT b.id FROM buses b 
     JOIN locations l1 ON b.from_location_id = l1.id 
     JOIN locations l2 ON b.to_location_id = l2.id 
     WHERE l1.name = 'Chennai' AND l2.name = 'Kumbakonam' 
     LIMIT 1),
    'Villupuram', '22:30:00', '22:40:00', 3
FROM dual
WHERE EXISTS (
    SELECT 1 FROM buses b 
    JOIN locations l1 ON b.from_location_id = l1.id 
    JOIN locations l2 ON b.to_location_id = l2.id 
    WHERE l1.name = 'Chennai' AND l2.name = 'Kumbakonam'
);

INSERT INTO stops (bus_id, name, arrival_time, departure_time, stop_order)
SELECT 
    (SELECT b.id FROM buses b 
     JOIN locations l1 ON b.from_location_id = l1.id 
     JOIN locations l2 ON b.to_location_id = l2.id 
     WHERE l1.name = 'Chennai' AND l2.name = 'Kumbakonam' 
     LIMIT 1),
    'Trichy', '02:00:00', '02:15:00', 4
FROM dual
WHERE EXISTS (
    SELECT 1 FROM buses b 
    JOIN locations l1 ON b.from_location_id = l1.id 
    JOIN locations l2 ON b.to_location_id = l2.id 
    WHERE l1.name = 'Chennai' AND l2.name = 'Kumbakonam'
);

INSERT INTO stops (bus_id, name, arrival_time, departure_time, stop_order)
SELECT 
    (SELECT b.id FROM buses b 
     JOIN locations l1 ON b.from_location_id = l1.id 
     JOIN locations l2 ON b.to_location_id = l2.id 
     WHERE l1.name = 'Chennai' AND l2.name = 'Kumbakonam' 
     LIMIT 1),
    'Thanjavur', '03:30:00', '03:45:00', 5
FROM dual
WHERE EXISTS (
    SELECT 1 FROM buses b 
    JOIN locations l1 ON b.from_location_id = l1.id 
    JOIN locations l2 ON b.to_location_id = l2.id 
    WHERE l1.name = 'Chennai' AND l2.name = 'Kumbakonam'
);

INSERT INTO stops (bus_id, name, arrival_time, departure_time, stop_order)
SELECT 
    (SELECT b.id FROM buses b 
     JOIN locations l1 ON b.from_location_id = l1.id 
     JOIN locations l2 ON b.to_location_id = l2.id 
     WHERE l1.name = 'Chennai' AND l2.name = 'Kumbakonam' 
     LIMIT 1),
    'Kumbakonam', '05:00:00', '05:00:00', 6
FROM dual
WHERE EXISTS (
    SELECT 1 FROM buses b 
    JOIN locations l1 ON b.from_location_id = l1.id 
    JOIN locations l2 ON b.to_location_id = l2.id 
    WHERE l1.name = 'Chennai' AND l2.name = 'Kumbakonam'
);

-- Insert sample connecting routes data
-- Example: Chennai to Courtallam via Tirunelveli
INSERT INTO connecting_route (from_location_id, to_location_id, first_bus_id, second_bus_id, connection_location_id, wait_time_minutes)
SELECT 
    (SELECT id FROM locations WHERE name = 'Chennai'), 
    (SELECT id FROM locations WHERE name = 'Courtallam'),
    (SELECT id FROM buses WHERE from_location_id = (SELECT id FROM locations WHERE name = 'Chennai') 
                         AND to_location_id = (SELECT id FROM locations WHERE name = 'Tirunelveli') LIMIT 1),
    (SELECT id FROM buses WHERE from_location_id = (SELECT id FROM locations WHERE name = 'Tirunelveli') 
                         AND to_location_id = (SELECT id FROM locations WHERE name = 'Courtallam') LIMIT 1),
    (SELECT id FROM locations WHERE name = 'Tirunelveli'),
    30
FROM dual
WHERE NOT EXISTS (SELECT 1 FROM connecting_route LIMIT 1);

-- Chennai to Yercaud via Salem
INSERT INTO connecting_route (from_location_id, to_location_id, first_bus_id, second_bus_id, connection_location_id, wait_time_minutes)
SELECT 
    (SELECT id FROM locations WHERE name = 'Chennai'), 
    (SELECT id FROM locations WHERE name = 'Yercaud'),
    (SELECT id FROM buses WHERE from_location_id = (SELECT id FROM locations WHERE name = 'Chennai') 
                         AND to_location_id = (SELECT id FROM locations WHERE name = 'Salem') LIMIT 1),
    (SELECT id FROM buses WHERE from_location_id = (SELECT id FROM locations WHERE name = 'Salem') 
                         AND to_location_id = (SELECT id FROM locations WHERE name = 'Yercaud') LIMIT 1),
    (SELECT id FROM locations WHERE name = 'Salem'),
    45
FROM dual
WHERE EXISTS (SELECT 1 FROM connecting_route LIMIT 1);

-- Chennai to Pollachi via Coimbatore
INSERT INTO connecting_route (from_location_id, to_location_id, first_bus_id, second_bus_id, connection_location_id, wait_time_minutes)
SELECT 
    (SELECT id FROM locations WHERE name = 'Chennai'), 
    (SELECT id FROM locations WHERE name = 'Pollachi'),
    (SELECT id FROM buses WHERE from_location_id = (SELECT id FROM locations WHERE name = 'Chennai') 
                         AND to_location_id = (SELECT id FROM locations WHERE name = 'Coimbatore') LIMIT 1),
    (SELECT id FROM buses WHERE from_location_id = (SELECT id FROM locations WHERE name = 'Coimbatore') 
                         AND to_location_id = (SELECT id FROM locations WHERE name = 'Pollachi') LIMIT 1),
    (SELECT id FROM locations WHERE name = 'Coimbatore'),
    60
FROM dual
WHERE EXISTS (SELECT 1 FROM connecting_route WHERE id = 2);

-- Chennai to Theni via Madurai
INSERT INTO connecting_route (from_location_id, to_location_id, first_bus_id, second_bus_id, connection_location_id, wait_time_minutes)
SELECT 
    (SELECT id FROM locations WHERE name = 'Chennai'), 
    (SELECT id FROM locations WHERE name = 'Theni'),
    (SELECT id FROM buses WHERE from_location_id = (SELECT id FROM locations WHERE name = 'Chennai') 
                         AND to_location_id = (SELECT id FROM locations WHERE name = 'Madurai') LIMIT 1),
    (SELECT id FROM buses WHERE from_location_id = (SELECT id FROM locations WHERE name = 'Madurai') 
                         AND to_location_id = (SELECT id FROM locations WHERE name = 'Theni') LIMIT 1),
    (SELECT id FROM locations WHERE name = 'Madurai'),
    45
FROM dual
WHERE EXISTS (SELECT 1 FROM connecting_route WHERE id = 3);

-- Coimbatore to Ooty via Mettupalayam
INSERT INTO connecting_route (from_location_id, to_location_id, first_bus_id, second_bus_id, connection_location_id, wait_time_minutes)
SELECT 
    (SELECT id FROM locations WHERE name = 'Coimbatore'), 
    (SELECT id FROM locations WHERE name = 'Ooty'),
    (SELECT id FROM buses WHERE from_location_id = (SELECT id FROM locations WHERE name = 'Coimbatore') 
                         AND to_location_id = (SELECT id FROM locations WHERE name = 'Mettupalayam') LIMIT 1),
    (SELECT b.id FROM buses b 
     JOIN locations l1 ON b.from_location_id = l1.id 
     JOIN locations l2 ON b.to_location_id = l2.id
     WHERE l1.name = 'Mettupalayam' AND l2.name = 'Ooty' LIMIT 1),
    (SELECT id FROM locations WHERE name = 'Mettupalayam'),
    30
FROM dual
WHERE EXISTS (SELECT 1 FROM connecting_route WHERE id = 4);