-- Create the route_contributions table
CREATE TABLE IF NOT EXISTS route_contributions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    bus_number VARCHAR(50) NOT NULL,
    from_location VARCHAR(255),
    to_location VARCHAR(255),
    stops TEXT,
    frequency VARCHAR(100),
    operating_hours VARCHAR(100),
    fare DECIMAL(10,2),
    submission_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    submitted_by VARCHAR(100),
    rejection_reason TEXT
);

-- Create the image_contributions table
CREATE TABLE IF NOT EXISTS image_contributions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    bus_number VARCHAR(50),
    image_url VARCHAR(1000) NOT NULL,
    description TEXT,
    submission_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    submitted_by VARCHAR(100),
    rejection_reason TEXT
);

-- Add index on status for faster querying
CREATE INDEX idx_route_contributions_status ON route_contributions(status);
CREATE INDEX idx_image_contributions_status ON image_contributions(status);

-- Add index on bus_number for faster lookups
CREATE INDEX idx_route_contributions_bus_number ON route_contributions(bus_number);
CREATE INDEX idx_image_contributions_bus_number ON image_contributions(bus_number);
