-- Update trigger for translations
CREATE TRIGGER translations_update_timestamp
BEFORE UPDATE ON translations
FOR EACH ROW
SET NEW.updated_at = CURRENT_TIMESTAMP();

-- Update trigger for locations
CREATE TRIGGER locations_update_timestamp
BEFORE UPDATE ON locations
FOR EACH ROW
SET NEW.updated_at = CURRENT_TIMESTAMP();

-- Update trigger for buses
CREATE TRIGGER buses_update_timestamp
BEFORE UPDATE ON buses
FOR EACH ROW
SET NEW.updated_at = CURRENT_TIMESTAMP();

-- Update trigger for stops
CREATE TRIGGER stop_update_timestamp
BEFORE UPDATE ON stop
FOR EACH ROW
SET NEW.updated_at = CURRENT_TIMESTAMP();

-- Update trigger for connecting_routes
CREATE TRIGGER connecting_routes_update_timestamp
BEFORE UPDATE ON connecting_routes
FOR EACH ROW
SET NEW.updated_at = CURRENT_TIMESTAMP();