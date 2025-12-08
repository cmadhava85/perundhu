-- ============================================
-- V21: Additional Performance Optimization Indexes
-- ============================================
-- Adds indexes for query patterns identified in repository analysis

-- Route contributions table indexes
CREATE INDEX IF NOT EXISTS idx_rc_user ON route_contributions(user_id);
CREATE INDEX IF NOT EXISTS idx_rc_status_date ON route_contributions(status, submission_date DESC);
CREATE INDEX IF NOT EXISTS idx_rc_submitter_date ON route_contributions(submitted_by, submission_date DESC);

-- Image contributions table indexes  
CREATE INDEX IF NOT EXISTS idx_ic_user ON image_contributions(user_id);
CREATE INDEX IF NOT EXISTS idx_ic_status_date ON image_contributions(status, submission_date DESC);

-- Buses table composite indexes for join queries
CREATE INDEX IF NOT EXISTS idx_bus_locations ON buses(from_location_id, to_location_id);
CREATE INDEX IF NOT EXISTS idx_bus_category ON buses(category);
CREATE INDEX IF NOT EXISTS idx_bus_number ON buses(bus_number);
CREATE INDEX IF NOT EXISTS idx_bus_active ON buses(active);

-- Translations - field lookup optimization
CREATE INDEX IF NOT EXISTS idx_trans_entity_field ON translations(entity_type, field_name);

-- User tracking sessions
CREATE INDEX IF NOT EXISTS idx_uts_session ON user_tracking_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_uts_user_bus ON user_tracking_sessions(user_id, bus_id);
CREATE INDEX IF NOT EXISTS idx_uts_active ON user_tracking_sessions(end_time, start_time);
