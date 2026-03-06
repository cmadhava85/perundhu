-- V116__deduplicate_locations_case_insensitive.sql
--
-- Problem: The same place was inserted multiple times with different casing,
-- e.g. 'Sivakasi', 'Sivakasi' (duplicate), 'SIVAKASI'.
-- This produces wrong autocomplete results and breaks the hierarchy linking
-- in V115 (two city rows for the same city = terminals split between them).
--
-- Strategy:
--   1. For each case-insensitive duplicate group, elect ONE canonical row:
--        - Prefer 'Title Case' over 'ALL CAPS' over 'lower case'
--        - Among equal-case variants, prefer the row with more bus routes
--        - Final tiebreak: lowest id
--   2. Re-point every FK that references a non-canonical duplicate:
--        buses.from_location_id / to_location_id
--        stops.location_id
--        connecting_routes.connection_point_id
--        location_aliases.location_id
--        locations.parent_id  (self-reference for hierarchy)
--   3. Delete the now-orphaned duplicate rows.
--   4. Add a case-insensitive unique index so this cannot recur.
--
-- Fully idempotent:
--   - All FK updates use "UPDATE … WHERE column = duplicate_id"
--   - The final DELETE only removes rows that have been superseded
--   - The unique index uses CREATE UNIQUE INDEX IF NOT EXISTS

-- ================================================================
-- STEP 1: Build a mapping of duplicate → canonical id
-- ================================================================
-- We use a temporary table so the mapping survives across statements.

CREATE TEMPORARY TABLE IF NOT EXISTS location_dedup_map (
    duplicate_id  BIGINT NOT NULL PRIMARY KEY,
    canonical_id  BIGINT NOT NULL,
    INDEX idx_canonical (canonical_id)
);

-- STEP 1a: Pre-aggregate bus route counts in a single O(buses) scan.
-- The original approach ran a correlated subquery once per candidate
-- location, causing O(locations × buses) ≈ 157 M row reads.
-- This temp table reduces that to one pass (~32 K rows).
CREATE TEMPORARY TABLE IF NOT EXISTS bus_route_counts (
    location_id BIGINT NOT NULL PRIMARY KEY,
    route_cnt   INT    NOT NULL DEFAULT 0
);

INSERT INTO bus_route_counts (location_id, route_cnt)
SELECT location_id, COUNT(*) AS route_cnt
FROM (
    SELECT from_location_id AS location_id FROM buses WHERE from_location_id IS NOT NULL
    UNION ALL
    SELECT to_location_id   AS location_id FROM buses WHERE to_location_id   IS NOT NULL
) r
GROUP BY location_id;

-- STEP 1b: For each duplicate name group elect the canonical winner.
-- Strategy: PRIMARY KEY (name_key) + INSERT IGNORE keeps only the FIRST
-- row inserted per group. ORDER BY ensures that first row is the correctly-
-- ranked winner. No correlated subquery → no ONLY_FULL_GROUP_BY issue.
CREATE TEMPORARY TABLE IF NOT EXISTS location_canonical (
    name_key     VARCHAR(255) NOT NULL,
    canonical_id BIGINT       NOT NULL,
    PRIMARY KEY (name_key)
);

INSERT IGNORE INTO location_canonical (name_key, canonical_id)
SELECT
    LOWER(l.name) AS name_key,
    l.id          AS canonical_id
FROM locations l
JOIN (
    -- Inline derived table: only duplicate name groups
    SELECT LOWER(name) AS dup_key
    FROM locations
    GROUP BY LOWER(name)
    HAVING COUNT(*) > 1
) dup_groups ON LOWER(l.name) = dup_groups.dup_key
LEFT JOIN bus_route_counts brc ON brc.location_id = l.id
ORDER BY
    LOWER(l.name)                                                               ASC,
    -- Penalise ALL-CAPS; reward proper Title Case
    (IF(l.name = UPPER(l.name) AND l.name != LOWER(l.name), -1000, 0)
     + IF(l.name COLLATE utf8mb4_bin REGEXP '^([A-Z][a-z]+ ?)+$', 100, 0))   DESC,
    -- Most routes (higher = more "real")
    COALESCE(brc.route_cnt, 0)                                                 DESC,
    l.id                                                                        ASC;

-- STEP 1c: Populate the dedup map — every non-canonical duplicate → its winner.
INSERT IGNORE INTO location_dedup_map (duplicate_id, canonical_id)
SELECT l.id, lc.canonical_id
FROM locations l
JOIN location_canonical lc ON LOWER(l.name) = lc.name_key
WHERE l.id != lc.canonical_id;

DROP TEMPORARY TABLE IF EXISTS bus_route_counts;
DROP TEMPORARY TABLE IF EXISTS location_canonical;

-- ================================================================
-- STEP 2: Re-point all FK references to the canonical row
-- ================================================================

-- 2a. buses.from_location_id
UPDATE buses b
JOIN location_dedup_map m ON b.from_location_id = m.duplicate_id
SET b.from_location_id = m.canonical_id;

-- 2b. buses.to_location_id
UPDATE buses b
JOIN location_dedup_map m ON b.to_location_id = m.duplicate_id
SET b.to_location_id = m.canonical_id;

-- 2b-safe: After remapping, two bus rows may now be identical under the unique
-- index (bus_number, from_location_id, to_location_id, departure_time, arrival_time).
-- Keep the lower-id row (it has the same route data) and remove the duplicate.
DELETE bus_dup
FROM buses bus_dup
JOIN (
    SELECT MIN(id) AS keep_id,
           bus_number, from_location_id, to_location_id, departure_time, arrival_time
    FROM buses
    GROUP BY bus_number, from_location_id, to_location_id, departure_time, arrival_time
    HAVING COUNT(*) > 1
) keep_set
  ON  bus_dup.bus_number        = keep_set.bus_number
  AND bus_dup.from_location_id  = keep_set.from_location_id
  AND bus_dup.to_location_id    = keep_set.to_location_id
  AND bus_dup.departure_time    = keep_set.departure_time
  AND bus_dup.arrival_time      = keep_set.arrival_time
  AND bus_dup.id               != keep_set.keep_id;

-- 2c. stops.location_id
UPDATE stops s
JOIN location_dedup_map m ON s.location_id = m.duplicate_id
SET s.location_id = m.canonical_id;

-- 2d. connecting_routes.connection_point_id
UPDATE connecting_routes cr
JOIN location_dedup_map m ON cr.connection_point_id = m.duplicate_id
SET cr.connection_point_id = m.canonical_id;

-- 2e. location_aliases.location_id
UPDATE location_aliases la
JOIN location_dedup_map m ON la.location_id = m.duplicate_id
SET la.location_id = m.canonical_id;

-- 2f. locations.parent_id (self-referencing hierarchy)
UPDATE locations l
JOIN location_dedup_map m ON l.parent_id = m.duplicate_id
SET l.parent_id = m.canonical_id;

-- ================================================================
-- STEP 3: Merge location_type / parent_id onto the canonical row
--         before deleting duplicates
-- ================================================================
-- If a duplicate was already marked CITY or had a parent set, carry
-- those values onto the canonical row so we don't lose that info.

UPDATE locations canonical
JOIN location_dedup_map m ON canonical.id = m.canonical_id
JOIN locations dup        ON dup.id        = m.duplicate_id
SET
    -- Upgrade to CITY if either row is CITY; otherwise keep canonical's existing type
    canonical.location_type = IF(
        dup.location_type = 'CITY' OR canonical.location_type = 'CITY',
        'CITY',
        COALESCE(canonical.location_type, dup.location_type)
    ),
    canonical.parent_id = COALESCE(canonical.parent_id, dup.parent_id)
WHERE dup.location_type = 'CITY'
   OR (canonical.parent_id IS NULL AND dup.parent_id IS NOT NULL);

-- ================================================================
-- STEP 4: Delete the duplicate rows
-- ================================================================
-- Safe: all FKs already point to canonical_id; parent_id was also remapped.

DELETE FROM locations
WHERE id IN (SELECT duplicate_id FROM location_dedup_map);

-- ================================================================
-- STEP 4b: Delete orphaned locations (not tied to any route or stop)
-- ================================================================
-- A location that is not referenced by any bus route, stop, connecting
-- route, or child location (as a parent CITY) will NEVER appear in search
-- results — locationId is the key link between the search index and routes.
-- Keeping these rows only pollutes the autocomplete index.
--
-- We KEEP a location if it is referenced by at least one of:
--   • buses.from_location_id / to_location_id  (it has bus routes)
--   • stops.location_id                         (it is a bus stop)
--   • connecting_routes.connection_point_id     (it is a connection point)
--   • locations.parent_id                       (it is a parent CITY)

-- Use LEFT JOIN IS NULL instead of NOT IN: index-friendly, avoids full
-- subquery materialisation on every row (NOT IN is O(n*m) without indexes).
CREATE TEMPORARY TABLE IF NOT EXISTS orphan_location_ids (
    id BIGINT NOT NULL PRIMARY KEY
);

INSERT INTO orphan_location_ids (id)
SELECT l.id
FROM locations l
LEFT JOIN buses             b_from ON b_from.from_location_id    = l.id
LEFT JOIN buses             b_to   ON b_to.to_location_id        = l.id
LEFT JOIN stops             s      ON s.location_id              = l.id
LEFT JOIN connecting_routes cr     ON cr.connection_point_id     = l.id
LEFT JOIN locations         lchild ON lchild.parent_id           = l.id
WHERE b_from.from_location_id    IS NULL
  AND b_to.to_location_id        IS NULL
  AND s.location_id              IS NULL
  AND cr.connection_point_id     IS NULL
  AND lchild.parent_id           IS NULL;

-- Remove aliases first (FK child must be deleted before the parent row)
DELETE FROM location_aliases
WHERE location_id IN (SELECT id FROM orphan_location_ids);

-- Delete the orphaned location rows
DELETE FROM locations
WHERE id IN (SELECT id FROM orphan_location_ids);

DROP TEMPORARY TABLE IF EXISTS orphan_location_ids;

-- ================================================================
-- STEP 5: Deduplicate location_aliases created by the FK re-point
--         (two aliases may now have the same location_id + alias_name)
-- ================================================================
DELETE la
FROM location_aliases la
JOIN (
    SELECT MIN(id) AS keep_id, location_id, LOWER(alias_name) AS alias_key
    FROM location_aliases
    GROUP BY location_id, LOWER(alias_name)
    HAVING COUNT(*) > 1
) dups ON la.location_id = dups.location_id
      AND LOWER(la.alias_name) = dups.alias_key
      AND la.id != dups.keep_id;

-- ================================================================
-- STEP 6: Add a case-insensitive unique index to prevent recurrence
-- ================================================================
-- Uses PREPARE/EXECUTE for conditional DDL so Flyway (which uses JDBC
-- and does NOT support the MySQL CLI-only DELIMITER command) can run
-- this script without any stored procedure.

-- 6a. Drop the old case-sensitive unique index from V108 if it exists.
SET @drop_old_idx = IF(
    EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.STATISTICS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME   = 'locations'
          AND INDEX_NAME   = 'uq_locations_name_district_state'
    ),
    'ALTER TABLE locations DROP INDEX uq_locations_name_district_state',
    'SELECT 1 -- index uq_locations_name_district_state not present, skip'
);
PREPARE _stmt FROM @drop_old_idx;
EXECUTE _stmt;
DEALLOCATE PREPARE _stmt;

-- 6b+6c. Add the generated lowercase column AND its unique index in a single
-- ALTER TABLE so MySQL rebuilds the table only once instead of twice.
-- Falls back gracefully: if column already exists, skip; if index already
-- exists but column is missing, add column only; etc.
SET @col_exists = (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME   = 'locations'
      AND COLUMN_NAME  = 'name_lower'
);
SET @idx_exists = (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME   = 'locations'
      AND INDEX_NAME   = 'uq_locations_name_ci'
);

-- Case 1: neither column nor index exist → one ALTER TABLE does both (1 rebuild)
SET @ddl_both = IF(
    @col_exists = 0 AND @idx_exists = 0,
    'ALTER TABLE locations ADD COLUMN name_lower VARCHAR(255) GENERATED ALWAYS AS (LOWER(name)) STORED COMMENT ''Lowercase generated column for case-insensitive unique constraint'', ADD UNIQUE INDEX uq_locations_name_ci (name_lower)',
    'SELECT 1 -- skip combined add'
);
PREPARE _stmt FROM @ddl_both;
EXECUTE _stmt;
DEALLOCATE PREPARE _stmt;

-- Case 2: column missing but index somehow exists (shouldn't happen, but safe)
SET @ddl_col_only = IF(
    @col_exists = 0 AND @idx_exists > 0,
    'ALTER TABLE locations ADD COLUMN name_lower VARCHAR(255) GENERATED ALWAYS AS (LOWER(name)) STORED COMMENT ''Lowercase generated column for case-insensitive unique constraint''',
    'SELECT 1 -- skip column-only add'
);
PREPARE _stmt FROM @ddl_col_only;
EXECUTE _stmt;
DEALLOCATE PREPARE _stmt;

-- Case 3: column exists but index is missing (e.g. previous partial run)
SET @ddl_idx_only = IF(
    @col_exists > 0 AND @idx_exists = 0,
    'CREATE UNIQUE INDEX uq_locations_name_ci ON locations (name_lower)',
    'SELECT 1 -- skip index-only add'
);
PREPARE _stmt FROM @ddl_idx_only;
EXECUTE _stmt;
DEALLOCATE PREPARE _stmt;

-- ================================================================
-- STEP 7: Clean up temp tables
-- ================================================================
DROP TEMPORARY TABLE IF EXISTS location_dedup_map;

-- ================================================================
-- VERIFICATION
-- ================================================================
-- Shows any remaining case-insensitive duplicates (should be 0 rows).
SELECT LOWER(name) AS name_lower, COUNT(*) AS cnt
FROM locations
GROUP BY LOWER(name)
HAVING cnt > 1
ORDER BY cnt DESC, name_lower;
