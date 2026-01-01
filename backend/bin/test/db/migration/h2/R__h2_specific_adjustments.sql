-- This is a repeatable migration that runs after versioned migrations
-- It contains H2-specific adjustments for test environment

-- H2 needs special handling for TEXT data type compatibility with MySQL
CREATE ALIAS IF NOT EXISTS CONVERT_CLOB_TO_TEXT AS '
    void convertClobToText() {
        // No-op in H2, as TEXT is automatically handled
    }
';

-- Add H2-specific indexes if running in H2 (these are safe to run multiple times)
CREATE INDEX IF NOT EXISTS idx_translations_entity_h2 
    ON translations(entity_type, entity_id);

CREATE INDEX IF NOT EXISTS idx_buses_locations_h2 
    ON buses(from_location_id, to_location_id);

CREATE INDEX IF NOT EXISTS idx_stops_sequence_h2 
    ON stops(bus_id, stop_order);