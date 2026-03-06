-- V115__fix_location_hierarchy_seeding.sql
-- Fix: V70 seeded the hierarchy with fragile exact-name/district matching,
-- causing it to silently skip cities whose district column didn't match.
-- This migration takes a self-seeding approach:
--
--   1. GENERIC: for every "City - Terminal" name in the locations table,
--      auto-find the parent city row and link it. Covers ALL cities —
--      current or future — without needing per-city blocks.
--
--   2. SPECIFIC: handle Chennai's extra terminal names that don't follow
--      the standard "Chennai - X" prefix pattern (KCBT, CMBT acronyms, etc.)
--
-- Approach: uses a temporary mapping table to resolve city names robustly,
-- picking the best parent row (prefer already-CITY type, then lowest id).
-- Fully idempotent — only touches rows where parent_id IS NULL or already
-- points to the same resolved city.

-- ================================================================
-- STEP 1: Generic auto-link for "City - Terminal" naming convention
-- ================================================================
-- For every location named "CityName - TerminalName", find the matching
-- city row named exactly "CityName" and set it as the parent.
-- This handles: Chennai, Madurai, Coimbatore, Salem, Trichy, Thanjavur,
-- Thoothukudi, Tirunelveli, Vellore, Erode and any others added later.

-- Mark city rows (any location that is the direct parent of a "City - X" terminal)
UPDATE locations city_row
SET city_row.location_type = 'CITY'
WHERE (city_row.location_type IS NULL OR city_row.location_type = 'CITY')
  AND city_row.id IN (
      SELECT parent_candidate.id
      FROM locations terminal_row
      JOIN locations parent_candidate
        ON parent_candidate.name = SUBSTRING_INDEX(terminal_row.name, ' - ', 1)
      WHERE terminal_row.name LIKE '% - %'
        AND SUBSTRING_INDEX(terminal_row.name, ' - ', 1) != ''
        AND CHAR_LENGTH(SUBSTRING_INDEX(terminal_row.name, ' - ', 1)) > 2
  );

-- Link "City - Terminal" rows to their parent city.
-- When multiple plain city rows exist (duplicate imports), pick the best one:
-- prefer already-flagged CITY rows, then fall back to lowest id.
UPDATE locations terminal_row
JOIN (
    SELECT
        t.id AS terminal_id,
        (
            SELECT p.id
            FROM locations p
            WHERE p.name = SUBSTRING_INDEX(t.name, ' - ', 1)
              AND p.id != t.id
            ORDER BY
                CASE WHEN p.location_type = 'CITY' THEN 0 ELSE 1 END,
                p.id ASC
            LIMIT 1
        ) AS resolved_parent_id
    FROM locations t
    WHERE t.name LIKE '% - %'
      AND SUBSTRING_INDEX(t.name, ' - ', 1) != ''
      AND CHAR_LENGTH(SUBSTRING_INDEX(t.name, ' - ', 1)) > 2
) mapping ON mapping.terminal_id = terminal_row.id
SET terminal_row.parent_id    = mapping.resolved_parent_id,
    terminal_row.location_type = 'TERMINAL'
WHERE mapping.resolved_parent_id IS NOT NULL
  AND (terminal_row.parent_id IS NULL
    OR terminal_row.parent_id = mapping.resolved_parent_id);

-- ================================================================
-- STEP 2: Chennai-specific terminals that don't follow "Chennai - X"
-- ================================================================
-- Some Chennai terminals are named by acronym or caps and won't be caught
-- by the generic step above.

SET @chennai_id = (
    SELECT id FROM locations
    WHERE name = 'Chennai'
    ORDER BY
        CASE WHEN location_type = 'CITY' THEN 0 ELSE 1 END,
        id ASC
    LIMIT 1
);

UPDATE locations
SET location_type = 'CITY'
WHERE id = @chennai_id;

UPDATE locations
SET parent_id     = @chennai_id,
    location_type = 'TERMINAL'
WHERE id != @chennai_id
  AND (
      name IN (
          'KCBT KILAMBAKKAM',
          'CHENNAI TAMBARAM',
          'CHENNAI AIRPORT',
          'CHENNAI KALAIGNAR CBT'
      )
      OR name LIKE 'CHENNAI %'
      OR name LIKE '%CMBT%'
      OR name LIKE '%KCBT%'
      OR name LIKE '%Kilambakkam%'
      OR name LIKE '%Kalaignar%'
  )
  AND (parent_id IS NULL OR parent_id = @chennai_id);

-- ================================================================
-- STEP 3: Trichy alias — "Trichy" and "Tiruchirappalli" are the same city
-- ================================================================
-- Pick the best Trichy/Tiruchirappalli row and unify all terminals under it.

SET @trichy_id = (
    SELECT id FROM locations
    WHERE name IN ('Trichy', 'Tiruchirappalli')
    ORDER BY
        CASE WHEN location_type = 'CITY' THEN 0 ELSE 1 END,
        id ASC
    LIMIT 1
);

UPDATE locations
SET location_type = 'CITY'
WHERE id = @trichy_id;

-- Terminals that start with the alias name not caught by step 1
UPDATE locations
SET parent_id     = @trichy_id,
    location_type = 'TERMINAL'
WHERE id != @trichy_id
  AND (
      name LIKE 'Trichy - %'
      OR name LIKE 'Tiruchirappalli - %'
      OR name LIKE 'Trichy %Bus%'
  )
  AND (parent_id IS NULL OR parent_id = @trichy_id);

-- ================================================================
-- STEP 4: Ensure every plain city-only row that has linked children
--         is marked as CITY (catches any left unmarked by steps above)
-- ================================================================
UPDATE locations p
SET p.location_type = 'CITY'
WHERE EXISTS (
    SELECT 1 FROM locations c WHERE c.parent_id = p.id
)
AND p.location_type IS NULL;

-- ================================================================
-- VERIFICATION — shows the linked hierarchy after migration runs
-- ================================================================
SELECT
    p.id            AS city_id,
    p.name          AS city_name,
    p.location_type AS city_type,
    COUNT(c.id)     AS linked_terminals
FROM locations p
LEFT JOIN locations c ON c.parent_id = p.id
WHERE p.location_type = 'CITY'
GROUP BY p.id, p.name, p.location_type
HAVING linked_terminals > 0
ORDER BY linked_terminals DESC;
