-- V2.0__bus_tracking_analytics.sql
-- Migration script to add bus tracking and historical data analytics features

-- First, set foreign key checks to 0 to avoid constraint issues
SET FOREIGN_KEY_CHECKS=0;

-- Drop tables if they exist (for clean migrations)
DROP TABLE IF EXISTS bus_location_history;
DROP TABLE IF EXISTS user_rewards;
DROP TABLE IF EXISTS bus_performance_metrics;
DROP TABLE IF EXISTS trip_statistics;
DROP TABLE IF EXISTS user_tracking_sessions;

SET FOREIGN_KEY_CHECKS=1;

-- Table for storing historical bus location data
CREATE TABLE bus_location_history (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    bus_id BIGINT NOT NULL,
    latitude DOUBLE NOT NULL,
    longitude DOUBLE NOT NULL,
    speed DOUBLE,
    heading INTEGER,
    accuracy DOUBLE,
    timestamp DATETIME NOT NULL,
    reported_by VARCHAR(255),
    nearest_stop_id BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_bus_location_history_bus FOREIGN KEY (bus_id) REFERENCES buses(id),
    CONSTRAINT fk_bus_location_history_stop FOREIGN KEY (nearest_stop_id) REFERENCES stops(id)
);

-- Table for user rewards system
CREATE TABLE user_rewards (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    points INTEGER NOT NULL DEFAULT 0,
    level INTEGER NOT NULL DEFAULT 1,
    total_reports INTEGER NOT NULL DEFAULT 0,
    total_distance_tracked DOUBLE NOT NULL DEFAULT 0,
    total_time_tracked BIGINT NOT NULL DEFAULT 0,
    last_reward_date DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_user_reward UNIQUE (user_id)
);

-- Table for tracking individual user sessions
CREATE TABLE user_tracking_sessions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    bus_id BIGINT NOT NULL,
    start_time DATETIME NOT NULL,
    end_time DATETIME,
    start_location_id BIGINT,
    end_location_id BIGINT,
    points_earned INTEGER DEFAULT 0,
    distance_tracked DOUBLE DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, COMPLETED, TERMINATED
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_tracking_session_bus FOREIGN KEY (bus_id) REFERENCES buses(id),
    CONSTRAINT fk_tracking_session_start FOREIGN KEY (start_location_id) REFERENCES locations(id),
    CONSTRAINT fk_tracking_session_end FOREIGN KEY (end_location_id) REFERENCES locations(id)
);

-- Table for bus performance metrics
CREATE TABLE bus_performance_metrics (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    bus_id BIGINT NOT NULL,
    date DATE NOT NULL,
    on_time_arrival_rate DOUBLE,
    average_delay BIGINT, -- in seconds
    total_trips INTEGER,
    completed_trips INTEGER,
    canceled_trips INTEGER,
    average_speed DOUBLE,
    average_passengers INTEGER,
    max_passengers INTEGER,
    total_distance DOUBLE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_performance_metrics_bus FOREIGN KEY (bus_id) REFERENCES buses(id),
    CONSTRAINT unique_bus_date_metrics UNIQUE (bus_id, date)
);

-- Table for detailed trip statistics
CREATE TABLE trip_statistics (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    bus_id BIGINT NOT NULL,
    trip_date DATE NOT NULL,
    trip_sequence INTEGER NOT NULL,
    from_location_id BIGINT NOT NULL,
    to_location_id BIGINT NOT NULL,
    scheduled_departure DATETIME NOT NULL,
    actual_departure DATETIME,
    scheduled_arrival DATETIME NOT NULL,
    actual_arrival DATETIME,
    passenger_count INTEGER,
    passenger_capacity INTEGER,
    utilization_rate DOUBLE,
    delay_minutes INTEGER,
    status VARCHAR(20) NOT NULL DEFAULT 'SCHEDULED', -- SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED
    cancellation_reason VARCHAR(255),
    weather_condition VARCHAR(50),
    traffic_condition VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_trip_statistics_bus FOREIGN KEY (bus_id) REFERENCES buses(id),
    CONSTRAINT fk_trip_statistics_from FOREIGN KEY (from_location_id) REFERENCES locations(id),
    CONSTRAINT fk_trip_statistics_to FOREIGN KEY (to_location_id) REFERENCES locations(id),
    CONSTRAINT unique_trip_instance UNIQUE (bus_id, trip_date, trip_sequence)
);

-- Add indexes for better query performance
CREATE INDEX idx_bus_location_history_bus ON bus_location_history(bus_id);
CREATE INDEX idx_bus_location_history_time ON bus_location_history(timestamp);
CREATE INDEX idx_bus_location_history_bus_time ON bus_location_history(bus_id, timestamp);
CREATE INDEX idx_user_rewards_user ON user_rewards(user_id);
CREATE INDEX idx_user_tracking_sessions_user ON user_tracking_sessions(user_id);
CREATE INDEX idx_user_tracking_sessions_bus ON user_tracking_sessions(bus_id);
CREATE INDEX idx_user_tracking_sessions_status ON user_tracking_sessions(status);
CREATE INDEX idx_bus_performance_metrics_date ON bus_performance_metrics(date);
CREATE INDEX idx_bus_performance_metrics_bus_date ON bus_performance_metrics(bus_id, date);
CREATE INDEX idx_trip_statistics_bus_date ON trip_statistics(bus_id, trip_date);
CREATE INDEX idx_trip_statistics_status ON trip_statistics(status);

-- Add record in migration_history table
INSERT INTO migration_history (migration_name, description) 
VALUES ('V2.0__bus_tracking_analytics', 'Added tables for bus tracking, historical data analytics, and user rewards system');