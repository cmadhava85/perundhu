-- V34: Add missing bus stops to ensure comprehensive coverage across Tamil Nadu
-- Purpose: Populate bus stops for districts not yet covered or with limited coverage
-- Date: 2026-01-02
-- Note: Uses INSERT IGNORE for idempotency - safe to run multiple times

-- Add missing city bus stops to ensure comprehensive coverage
-- Adding bus stops for districts and cities not yet covered or with limited coverage
-- Uses IGNORE to prevent duplicate key errors if data already exists

INSERT IGNORE INTO locations (name, latitude, longitude, district, nearby_city) VALUES 
-- Dharmapuri district
('Dharmapuri - Bus Stand', 12.1670, 78.1615, 'Dharmapuri', 'Dharmapuri'),

-- Krishnagiri district (additional stops for better coverage)
('Krishnagiri - Bus Stop', 12.4904, 78.2186, 'Krishnagiri', 'Krishnagiri'),
('Krishnagiri - Hosur Road Bus Stop', 12.4959, 78.3917, 'Krishnagiri', 'Krishnagiri'),

-- Ranipet district (new district carved from Vellore/Tirupati)
('Ranipet - Bus Stand', 12.9640, 79.3211, 'Ranipet', 'Ranipet'),
('Arani - Bus Stand', 12.2265, 79.2778, 'Ranipet', 'Arani'),

-- Thiruvallur district (additional coverage)
('Thiruvallur - Bus Stand', 13.1343, 80.1038, 'Thiruvallur', 'Thiruvallur'),
('Tiruttani - Bus Stand', 13.2131, 79.8987, 'Thiruvallur', 'Tiruttani'),

-- Kallakurichi district
('Kallakurichi - Bus Stand', 11.7407, 79.0763, 'Kallakurichi', 'Kallakurichi'),

-- Sankarankoil (Tirunelveli region)
('Sankarankoil - Bus Stand', 11.5298, 79.1482, 'Tirunelveli', 'Sankarankoil'),

-- Perambalur district
('Perambalur - Bus Stand', 11.4516, 78.8762, 'Perambalur', 'Perambalur'),

-- Vriddhachalam (Cuddalore region)
('Vriddhachalam - Bus Stand', 11.2434, 79.2644, 'Cuddalore', 'Vriddhachalam'),

-- Ramanathapuram district
('Ramanathapuram - Bus Stand', 9.3703, 78.8294, 'Ramanathapuram', 'Ramanathapuram'),
('Rameswaram - Bus Stand', 9.2866, 79.1712, 'Ramanathapuram', 'Rameswaram'),

-- Sivaganga district
('Sivaganga - Bus Stand', 10.1875, 78.3945, 'Sivaganga', 'Sivaganga'),

-- Virudunagar district
('Virudunagar - Bus Stand', 9.5295, 77.9584, 'Virudunagar', 'Virudunagar'),

-- Additional key towns and cities for comprehensive coverage
('Attur - Bus Stand', 11.7834, 78.6291, 'Salem', 'Attur'),
('Palani - Bus Stand', 10.2742, 77.4485, 'Dindigul', 'Palani'),
('Periyakulam - Bus Stand', 10.1208, 77.6032, 'Theni', 'Periyakulam'),
('Sathyamangalam - Bus Stand', 11.2516, 77.2631, 'Erode', 'Sathyamangalam');

-- Final Verification Comment:
-- After this migration:
-- - Total bus stops: ~110+ across 50+ Tamil Nadu cities/towns
-- - All districts covered with at least 1 bus stop
-- - Major transit hubs have multiple stops (3-6 stops)
-- - Uses INSERT IGNORE to prevent duplicate errors on re-runs
-- - Idempotent: Safe to run multiple times without side effects
