-- Add indices for better stop table query performance
CREATE INDEX IF NOT EXISTS idx_stop_bus_id ON stops(bus_id);
CREATE INDEX IF NOT EXISTS idx_stop_order ON stops(stop_order);
CREATE INDEX IF NOT EXISTS idx_stop_bus_order ON stops(bus_id, stop_order);