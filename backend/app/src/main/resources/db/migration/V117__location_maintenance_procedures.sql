-- V117__location_maintenance_procedures.sql
--
-- Creates two reusable stored procedures that replicate the one-time
-- cleanup logic from V115 and V116 so it can be triggered after every
-- future bulk upload without writing a new migration each time.
--
-- Usage after any bulk data upload:
--   CALL sp_fix_location_hierarchy();     -- link new "City - Terminal" rows
--   CALL sp_cleanup_orphaned_locations(); -- remove locations with no routes
--
-- A daily MySQL EVENT also runs both procedures automatically if the
-- Cloud SQL event_scheduler flag is enabled.

-- ================================================================
-- Drop existing objects before (re-)creating them
-- ================================================================
DROP PROCEDURE IF EXISTS sp_fix_location_hierarchy;
DROP PROCEDURE IF EXISTS sp_cleanup_orphaned_locations;
DROP EVENT IF EXISTS evt_daily_location_maintenance;

DELIMITER //

-- ================================================================
-- PROCEDURE 1: sp_fix_location_hierarchy
-- ================================================================
-- Links any "City - Terminal" named location to its parent city row.
-- Handles special Chennai acronyms (KCBT / CMBT) and marks new CITY rows.
-- Safe to call multiple times (WHERE parent_id IS NULL prevents re-work).

CREATE PROCEDURE sp_fix_location_hierarchy()
BEGIN
    -- Step 1: Generic "City - Terminal" pattern.
    -- Any row whose name contains ' - ' is linked to the city row whose
    -- name matches the prefix before the first ' - '.
    UPDATE locations terminal_row
    JOIN locations city_row
        ON city_row.name = SUBSTRING_INDEX(terminal_row.name, ' - ', 1)
       AND city_row.id  != terminal_row.id
    SET terminal_row.parent_id = city_row.id
    WHERE terminal_row.name LIKE '% - %'
      AND terminal_row.parent_id IS NULL
      AND (city_row.location_type IS NULL OR city_row.location_type = 'CITY');

    -- Step 2: Chennai-specific rows that do NOT follow the "City - Terminal"
    -- naming convention (KCBT KILAMBAKKAM, CMBT, Kalaignar Maligai, etc.)
    UPDATE locations
    SET parent_id = (
        SELECT id FROM (
            SELECT id FROM locations WHERE LOWER(name) = 'chennai' LIMIT 1
        ) AS chennai_row
    )
    WHERE parent_id IS NULL
      AND (
          name LIKE 'KCBT KILAMBAKKAM%'
          OR name LIKE 'CHENNAI %'
          OR name LIKE '%CMBT%'
          OR name LIKE '%KCBT%'
          OR name LIKE '%Kilambakkam%'
          OR name LIKE '%Kalaignar%'
      )
      AND EXISTS (SELECT 1 FROM locations WHERE LOWER(name) = 'chennai');

    -- Step 3: Any location that gained children but still has no type
    -- should be classified as CITY so it appears as a search-expandable node.
    UPDATE locations
    SET location_type = 'CITY'
    WHERE location_type IS NULL
      AND id IN (
          SELECT DISTINCT parent_id FROM locations WHERE parent_id IS NOT NULL
      );
END //

-- ================================================================
-- PROCEDURE 2: sp_cleanup_orphaned_locations
-- ================================================================
-- Deletes locations not linked to any bus route, stop, connecting route,
-- or hierarchy parent — these can never appear in search results.
-- Also removes their location_aliases (FK child) before deleting the row.
-- Safe to call multiple times.

CREATE PROCEDURE sp_cleanup_orphaned_locations()
BEGIN
    CREATE TEMPORARY TABLE IF NOT EXISTS _orphan_ids (
        id BIGINT NOT NULL PRIMARY KEY
    );

    INSERT IGNORE INTO _orphan_ids (id)
    SELECT l.id
    FROM locations l
    WHERE l.id NOT IN (
        -- Referenced by a bus route (origin or destination)
        SELECT b.from_location_id     FROM buses             b  WHERE b.from_location_id      IS NOT NULL
        UNION
        SELECT b.to_location_id       FROM buses             b  WHERE b.to_location_id        IS NOT NULL
        UNION
        -- Referenced as a scheduled stop
        SELECT s.location_id          FROM stops             s  WHERE s.location_id           IS NOT NULL
        UNION
        -- Referenced as a connection point between routes
        SELECT cr.connection_point_id FROM connecting_routes cr WHERE cr.connection_point_id  IS NOT NULL
        UNION
        -- Referenced as a parent CITY in the hierarchy
        SELECT l2.parent_id           FROM locations         l2 WHERE l2.parent_id            IS NOT NULL
    );

    -- Delete aliases first to satisfy FK constraint
    DELETE FROM location_aliases
    WHERE location_id IN (SELECT id FROM _orphan_ids);

    -- Delete the orphaned location rows
    DELETE FROM locations
    WHERE id IN (SELECT id FROM _orphan_ids);

    DROP TEMPORARY TABLE IF EXISTS _orphan_ids;
END //

-- ================================================================
-- SCHEDULED EVENT: daily automatic maintenance
-- ================================================================
-- Requires event_scheduler = ON in Cloud SQL database flags.
-- To enable: set the 'event_scheduler' database flag to 'ON' in
-- GCP Console → SQL → Edit instance → Database flags.
-- To verify: SHOW VARIABLES LIKE 'event_scheduler';
--
-- Fires every 24 hours. Silently fixes hierarchy gaps and removes
-- orphaned locations — no manual intervention needed after bulk uploads.

CREATE EVENT IF NOT EXISTS evt_daily_location_maintenance
    ON SCHEDULE EVERY 1 DAY
    STARTS (CURRENT_TIMESTAMP + INTERVAL 1 HOUR)
    ON COMPLETION PRESERVE
    COMMENT 'Daily: link new City-Terminal hierarchy + remove orphaned locations'
DO BEGIN
    CALL sp_fix_location_hierarchy();
    CALL sp_cleanup_orphaned_locations();
END //

DELIMITER ;

-- ================================================================
-- Run both procedures immediately
-- ================================================================
-- Covers any data inserted between V116 and this migration.
CALL sp_fix_location_hierarchy();
CALL sp_cleanup_orphaned_locations();
