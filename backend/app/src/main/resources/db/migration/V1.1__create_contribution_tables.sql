-- Create the route_contributions table (if it doesn't exist)
-- Note: This table will be recreated/modified by later migrations (V2.3+) for the actual schema
-- This is a placeholder migration for version ordering
-- CREATE TABLE IF NOT EXISTS route_contributions (
--     id BIGINT AUTO_INCREMENT PRIMARY KEY,
--     bus_number VARCHAR(50) NOT NULL,
--     from_location VARCHAR(255),
--     to_location VARCHAR(255),
--     stops TEXT,
--     frequency VARCHAR(100),
--     operating_hours VARCHAR(100),
--     fare VARCHAR(100),
--     submission_date TIMESTAMP NOT NULL DEFAULT NOW(),
--     status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
--     submitted_by VARCHAR(100),
--     rejection_reason TEXT
-- );

-- Create the image_contributions table (if it doesn't exist)
-- CREATE TABLE IF NOT EXISTS image_contributions (
--     id BIGINT AUTO_INCREMENT PRIMARY KEY,
--     bus_number VARCHAR(50),
--     image_url VARCHAR(1000) NOT NULL,
--     description TEXT,
--     submission_date TIMESTAMP NOT NULL DEFAULT NOW(),
--     status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
--     submitted_by VARCHAR(100),
--     rejection_reason TEXT
-- );

-- Placeholder migration - actual tables created in later migrations
-- Add a dummy table or keep this empty for now
CREATE TABLE IF NOT EXISTS placeholder_v1_1_marker (
    id INT PRIMARY KEY,
    description VARCHAR(255)
);

INSERT IGNORE INTO placeholder_v1_1_marker (id, description) VALUES (1, 'V1.1 migration marker - contribution tables created in later migrations');