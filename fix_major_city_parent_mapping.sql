-- ============================================================================
-- Fix Major City Parent Mapping for Terminals
-- Purpose: Ensure terminals like Kilambakkam map to their parent city so
--          city-level searches return all related terminals.
-- ============================================================================

-- Step 0: Confirm city records (review ids before updates)
SELECT id, name, location_type
FROM locations
WHERE LOWER(name) IN (
    'chennai','madurai','coimbatore','tiruchirappalli','trichy','salem','vellore',
    'tirunelveli','erode','tiruppur','nagercoil','thanjavur','dindigul','kancheepuram','kanchipuram'
)
ORDER BY LOWER(name), id;

-- Optional: run updates in a transaction
-- START TRANSACTION;

-- Step 1: Chennai terminals -> Chennai city
SET @chennai_id := (
    SELECT id FROM locations
    WHERE LOWER(name) = 'chennai'
    ORDER BY (location_type = 'CITY') DESC, id
    LIMIT 1
);
SELECT @chennai_id AS chennai_id;

UPDATE locations
SET parent_id = @chennai_id
WHERE id <> @chennai_id
  AND parent_id IS NULL
  AND (
      LOWER(name) LIKE '%kilambakkam%'
      OR LOWER(name) LIKE '%kcbt%'
      OR LOWER(name) LIKE '%cmbt%'
      OR LOWER(name) LIKE '%koyambedu%'
      OR LOWER(name) LIKE '%broadway%'
      OR LOWER(name) LIKE '%tambaram%'
      OR LOWER(name) LIKE '%t nagar%'
      OR LOWER(name) LIKE '%t. nagar%'
      OR LOWER(name) LIKE '%tnagar%'
      OR LOWER(name) LIKE '%adyar%'
      OR LOWER(name) LIKE '%vadapalani%'
  );
SELECT ROW_COUNT() AS chennai_rows_updated;

-- Step 2: Coimbatore terminals -> Coimbatore city
SET @coimbatore_id := (
    SELECT id FROM locations
    WHERE LOWER(name) = 'coimbatore'
    ORDER BY (location_type = 'CITY') DESC, id
    LIMIT 1
);
SELECT @coimbatore_id AS coimbatore_id;

UPDATE locations
SET parent_id = @coimbatore_id
WHERE id <> @coimbatore_id
  AND parent_id IS NULL
  AND (
      LOWER(name) LIKE '%gandhipuram%'
      OR LOWER(name) LIKE '%singanallur%'
  );
SELECT ROW_COUNT() AS coimbatore_rows_updated;

-- Step 3: Tiruchirappalli (Trichy) terminals -> city
SET @tiruchirappalli_id := (
    SELECT id FROM locations
    WHERE LOWER(name) IN ('tiruchirappalli','trichy')
    ORDER BY (location_type = 'CITY') DESC, id
    LIMIT 1
);
SELECT @tiruchirappalli_id AS tiruchirappalli_id;

UPDATE locations
SET parent_id = @tiruchirappalli_id
WHERE id <> @tiruchirappalli_id
  AND parent_id IS NULL
  AND (
      LOWER(name) LIKE '%central bus stand%'
      OR LOWER(name) LIKE '%central bus stand, trichy%'
      OR LOWER(name) LIKE '%chatram%'
  );
SELECT ROW_COUNT() AS tiruchirappalli_rows_updated;

-- Step 4: Madurai terminals -> Madurai city
SET @madurai_id := (
    SELECT id FROM locations
    WHERE LOWER(name) = 'madurai'
    ORDER BY (location_type = 'CITY') DESC, id
    LIMIT 1
);
SELECT @madurai_id AS madurai_id;

UPDATE locations
SET parent_id = @madurai_id
WHERE id <> @madurai_id
  AND parent_id IS NULL
  AND (
      LOWER(name) LIKE '%mattuthavani%'
  );
SELECT ROW_COUNT() AS madurai_rows_updated;

-- Step 5: Audit missing parent_id for major-city terminals
-- Use this list to add more city-specific updates above as needed.
SELECT l.id, l.name, l.parent_id, c.id AS city_id, c.name AS city_name
FROM locations l
JOIN locations c
  ON c.location_type = 'CITY'
 AND LOWER(c.name) IN (
    'chennai','madurai','coimbatore','tiruchirappalli','trichy','salem','vellore',
    'tirunelveli','erode','tiruppur','nagercoil','thanjavur','dindigul','kancheepuram','kanchipuram'
 )
WHERE l.parent_id IS NULL
  AND l.id <> c.id
  AND (
      LOWER(l.name) LIKE CONCAT('%', LOWER(c.name), '%')
      OR LOWER(l.name) LIKE '%bus stand%'
      OR LOWER(l.name) LIKE '%bus station%'
      OR LOWER(l.name) LIKE '%terminus%'
      OR LOWER(l.name) LIKE '%depot%'
      OR LOWER(l.name) LIKE '%cbt%'
  )
ORDER BY city_name, l.name;

-- Optional: COMMIT;
-- Optional: ROLLBACK;
