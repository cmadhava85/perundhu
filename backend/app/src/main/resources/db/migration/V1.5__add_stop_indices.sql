-- Add indices for better stop table query performance
-- These indices improve query performance for common WHERE clauses

CREATE INDEX idx_stop_bus_id ON stops(bus_id);
CREATE INDEX idx_stop_order ON stops(stop_order);
CREATE INDEX idx_stop_bus_order ON stops(bus_id, stop_order);