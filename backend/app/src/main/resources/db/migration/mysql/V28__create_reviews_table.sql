-- V28: Create reviews table for bus service reviews
-- This migration adds support for user reviews of bus services

CREATE TABLE IF NOT EXISTS reviews (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    bus_id BIGINT NOT NULL,
    user_id VARCHAR(255),
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment VARCHAR(500),
    tags VARCHAR(500),
    travel_date DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign key to buses table
    CONSTRAINT fk_reviews_bus FOREIGN KEY (bus_id) REFERENCES buses(id) ON DELETE CASCADE,
    
    -- Ensure valid status values
    CONSTRAINT chk_review_status CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED'))
);

-- Indexes for common queries
CREATE INDEX idx_reviews_bus_id ON reviews(bus_id);
CREATE INDEX idx_reviews_user_id ON reviews(user_id);
CREATE INDEX idx_reviews_status ON reviews(status);
CREATE INDEX idx_reviews_bus_status ON reviews(bus_id, status);
CREATE INDEX idx_reviews_created_at ON reviews(created_at);

-- Composite index for finding approved reviews for a bus (most common query)
CREATE INDEX idx_reviews_bus_approved ON reviews(bus_id, status, created_at DESC);
