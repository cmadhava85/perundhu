-- V63: Load Sample Location Data
-- Purpose: Populate the locations table with Tamil Nadu city data
-- This migration ensures location data is available in preprod and production

-- Insert sample locations (Tamil Nadu cities)
INSERT IGNORE INTO locations (name, latitude, longitude, created_at, updated_at) VALUES
('Chennai Central', 13.0827, 80.2707, NOW(), NOW()),
('Tambaram', 12.9249, 80.1000, NOW(), NOW()),
('Velachery', 12.9714, 80.2180, NOW(), NOW()),
('T Nagar', 13.0410, 80.2354, NOW(), NOW()),
('Adyar', 13.0012, 80.2565, NOW(), NOW()),
('Porur', 13.0359, 80.1567, NOW(), NOW()),
('Anna Nagar', 13.0850, 80.2101, NOW(), NOW()),
('Ambattur', 13.1143, 80.1548, NOW(), NOW()),
('Shollinganallur', 12.9010, 80.2279, NOW(), NOW()),
('Thiruvanmiyur', 12.9830, 80.2594, NOW(), NOW()),
('Madurai', 9.9252, 78.1198, NOW(), NOW()),
('Coimbatore', 11.0168, 76.9558, NOW(), NOW()),
('Trichy', 10.7905, 78.7047, NOW(), NOW()),
('Villupuram', 11.9401, 79.4861, NOW(), NOW()),
('Salem', 11.6643, 78.1460, NOW(), NOW());
