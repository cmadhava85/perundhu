-- Update trigger for translations
DELIMITER //
CREATE TRIGGER translations_update_timestamp
BEFORE UPDATE ON translations
FOR EACH ROW
BEGIN
  SET NEW.updated_at = CURRENT_TIMESTAMP();
END//

-- Update trigger for locations
CREATE TRIGGER locations_update_timestamp
BEFORE UPDATE ON locations
FOR EACH ROW
BEGIN
  SET NEW.updated_at = CURRENT_TIMESTAMP();
END//

-- Update trigger for buses
CREATE TRIGGER buses_update_timestamp
BEFORE UPDATE ON buses
FOR EACH ROW
BEGIN
  SET NEW.updated_at = CURRENT_TIMESTAMP();
END//

-- Update trigger for stops
CREATE TRIGGER stops_update_timestamp
BEFORE UPDATE ON stops
FOR EACH ROW
BEGIN
  SET NEW.updated_at = CURRENT_TIMESTAMP();
END//

-- Update trigger for connecting_routes
CREATE TRIGGER connecting_routes_update_timestamp
BEFORE UPDATE ON connecting_routes
FOR EACH ROW
BEGIN
  SET NEW.updated_at = CURRENT_TIMESTAMP();
END//
DELIMITER ;