-- V117__location_maintenance_procedures.sql
--
-- Runs two maintenance passes against the locations table:
--   1. Fix hierarchy: link "City - Terminal" rows to their parent city.
--   2. Clean orphans: delete locations not referenced by any bus route,
--      stop, connecting route, or as a hierarchy parent.
--
-- NOTE: Stored procedures and scheduled events are intentionally omitted
-- from this migration. Flyway/JDBC does not reliably handle DELIMITER /
-- CREATE PROCEDURE with MySQL connector 9.x. The same logic can be run
-- manually via the scripts in scripts/maintenance/ when needed after a
-- bulk data upload.

-- ================================================================
-- PASS 1: Fix location hierarchy
-- ================================================================

-- 1a. Generic "City - Terminal" pattern.
-- Link any row whose name contains ' - ' to the city whose name
-- matches the prefix before the first ' - '.
UPDATE locations terminal_row
JOIN locations city_row
    ON city_row.name = SUBSTRING_INDEX(terminal_row.name, ' - ', 1)
   AND city_row.id  != terminal_row.id
SET terminal_row.parent_id = city_row.id
WHERE terminal_row.name LIKE '% - %'
  AND terminal_row.parent_id IS NULL
  AND (city_row.location_type IS NULL OR city_row.location_type = 'CITY');

-- 1b. Chennai-specific rows that do not follow the "City - Terminal"
-- naming convention (KCBT KILAMBAKKAM, CMBT, Kalaignar Maligai, etc.)
-- Use a JOIN to avoid MySQL error 1093 (cannot read and update same table
-- in a subquery; a derived-table JOIN sidesteps the restriction).
UPDATE locations terminal_row
JOIN (
    SELECT id AS city_id
    FROM locations
    WHERE LOWER(name) = 'chennai'
    LIMIT 1
) AS chennai ON TRUE
SET terminal_row.parent_id = chennai.city_id
WHERE terminal_row.parent_id IS NULL
  AND (
      terminal_row.name LIKE 'KCBT KILAMBAKKAM%'
      OR terminal_row.name LIKE 'CHENNAI %'
      OR terminal_row.name LIKE '%CMBT%'
      OR terminal_row.name LIKE '%KCBT%'
      OR terminal_row.name LIKE '%Kilambakkam%'
      OR terminal_row.name LIKE '%Kalaignar%'
  );

-- 1c. Any location that now has children but still has no type should be
-- classified as CITY. Double-wrap the subquery to avoid MySQL error 1093.
UPDATE locations
SET location_type = 'CITY'
WHERE location_type IS NULL
  AND id IN (
      SELECT parent_id FROM (
          SELECT DISTINCT parent_id FROM locations WHERE parent_id IS NOT NULL
      ) AS _parents
  );

-- ================================================================
-- PASS 2: Delete orphaned locations
-- ================================================================
-- A location that is not referenced by any bus route, stop, connecting
-- route, or child location (as a parent CITY) can never appear in search
-- results and only pollutes the autocomplete index.

CREATE TEMPORARY TABLE IF NOT EXISTS _orphan_ids (
    id BIGINT NOT NULL PRIMARY KEY
);

INSERT INTO _orphan_ids (id)
SELECT l.id
FROM locations l
LEFT JOIN buses             b_from ON b_from.from_location_id   = l.id
LEFT JOIN buses             b_to   ON b_to.to_location_id       = l.id
LEFT JOIN stops             s      ON s.location_id             = l.id
LEFT JOIN connecting_routes cr     ON cr.connection_point_id    = l.id
LEFT JOIN locations         lchild ON lchild.parent_id          = l.id
WHERE b_from.from_location_id  IS NULL
  AND b_to.to_location_id      IS NULL
  AND s.location_id            IS NULL
  AND cr.connection_point_id   IS NULL
  AND lchild.parent_id         IS NULL;

-- Remove aliases first (FK child must be deleted before the parent row)
DELETE FROM location_aliases
WHERE location_id IN (SELECT id FROM _orphan_ids);

DELETE FROM locations
WHERE id IN (SELECT id FROM _orphan_ids);

DROP TEMPORARY TABLE IF EXISTS _orphan_ids;

-- ================================================================
-- VERIFICATION
-- ================================================================
-- Shows any remaining case-insensitive duplicates (should be 0).
SELECT LOWER(name) AS name_lower, COUNT(*) AS cnt
FROM locations
GROUP BY LOWER(name)
HAVING cnt > 1
ORDER BY cnt DESC, name_lower;

