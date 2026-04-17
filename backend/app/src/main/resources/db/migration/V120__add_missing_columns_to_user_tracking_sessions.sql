-- Add columns that were added to UserTrackingSessionEntity but never migrated
ALTER TABLE user_tracking_sessions
    ADD COLUMN session_id VARCHAR(100) NULL,
    ADD COLUMN bus_id BIGINT NULL,
    ADD COLUMN start_location_id BIGINT NULL,
    ADD COLUMN end_location_id BIGINT NULL,
    ADD COLUMN device_info VARCHAR(500) NULL;

-- Index for session_id lookups (used by findBySessionId)
CREATE INDEX idx_user_tracking_sessions_session_id ON user_tracking_sessions (session_id);

-- Index for bus_id lookups
CREATE INDEX idx_user_tracking_sessions_bus_id ON user_tracking_sessions (bus_id);
