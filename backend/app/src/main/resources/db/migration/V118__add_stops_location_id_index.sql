-- Add index on stops.location_id to speed up queries that search for buses
-- passing through a specific location (findBusesPassingThroughLocations,
-- findBusesContinuingBeyondDestination, findByLocationId).
--
-- Without this index MySQL does a full table scan on the stops table for each
-- location predicate in the JOIN, which is particularly expensive for
-- multi-stop search paths.
--
-- Uses a helper procedure pattern consistent with V108 to handle the case
-- where the index already exists (idempotent).

DROP PROCEDURE IF EXISTS add_index_if_not_exists_v118;
DELIMITER //
CREATE PROCEDURE add_index_if_not_exists_v118()
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM INFORMATION_SCHEMA.STATISTICS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME   = 'stops'
          AND INDEX_NAME   = 'idx_stops_location_id'
    ) THEN
        ALTER TABLE stops ADD INDEX idx_stops_location_id (location_id);
    END IF;
END //
DELIMITER ;
CALL add_index_if_not_exists_v118();
DROP PROCEDURE IF EXISTS add_index_if_not_exists_v118;
