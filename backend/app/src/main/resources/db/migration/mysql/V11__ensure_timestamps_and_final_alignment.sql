-- V11__ensure_timestamps_and_final_alignment.sql
-- Comprehensive migration to ensure ALL tables have proper timestamps and alignment

-- ====================================
-- 1. Ensure locations table has timestamps
-- ====================================
ALTER TABLE locations 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Creation timestamp';

ALTER TABLE locations 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last update timestamp';

-- ====================================
-- 2. Update buses table to ensure all V10 columns exist
-- ====================================
-- These should already exist from V10, but we ensure they're present

-- Verify capacity column exists
SET @column_exists = (
  SELECT COUNT(*) 
  FROM information_schema.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'buses' 
    AND COLUMN_NAME = 'capacity'
);

SET @sql = IF(
  @column_exists = 0,
  'ALTER TABLE buses ADD COLUMN capacity INT DEFAULT 50 COMMENT "Passenger capacity"',
  'SELECT "Column capacity already exists" AS message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Verify category column exists
SET @column_exists = (
  SELECT COUNT(*) 
  FROM information_schema.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'buses' 
    AND COLUMN_NAME = 'category'
);

SET @sql = IF(
  @column_exists = 0,
  'ALTER TABLE buses ADD COLUMN category VARCHAR(50) DEFAULT "Unknown" COMMENT "Bus category/type"',
  'SELECT "Column category already exists" AS message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Verify active column exists
SET @column_exists = (
  SELECT COUNT(*) 
  FROM information_schema.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'buses' 
    AND COLUMN_NAME = 'active'
);

SET @sql = IF(
  @column_exists = 0,
  'ALTER TABLE buses ADD COLUMN active BOOLEAN DEFAULT TRUE COMMENT "Route active status"',
  'SELECT "Column active already exists" AS message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ====================================
-- 3. Add created_at/updated_at to buses if missing
-- ====================================
SET @column_exists = (
  SELECT COUNT(*) 
  FROM information_schema.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'buses' 
    AND COLUMN_NAME = 'created_at'
);

SET @sql = IF(
  @column_exists = 0,
  'ALTER TABLE buses ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
  'SELECT "Column created_at already exists" AS message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @column_exists = (
  SELECT COUNT(*) 
  FROM information_schema.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'buses' 
    AND COLUMN_NAME = 'updated_at'
);

SET @sql = IF(
  @column_exists = 0,
  'ALTER TABLE buses ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP',
  'SELECT "Column updated_at already exists" AS message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ====================================
-- 4. Ensure stops table has created_at/updated_at
-- ====================================
SET @column_exists = (
  SELECT COUNT(*) 
  FROM information_schema.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'stops' 
    AND COLUMN_NAME = 'created_at'
);

SET @sql = IF(
  @column_exists = 0,
  'ALTER TABLE stops ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
  'SELECT "stops.created_at already exists" AS message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @column_exists = (
  SELECT COUNT(*) 
  FROM information_schema.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'stops' 
    AND COLUMN_NAME = 'updated_at'
);

SET @sql = IF(
  @column_exists = 0,
  'ALTER TABLE stops ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP',
  'SELECT "stops.updated_at already exists" AS message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ====================================
-- 5. Verify translations table timestamps
-- ====================================
SET @column_exists = (
  SELECT COUNT(*) 
  FROM information_schema.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'translations' 
    AND COLUMN_NAME = 'created_at'
);

SET @sql = IF(
  @column_exists = 0,
  'ALTER TABLE translations ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
  'SELECT "translations.created_at already exists" AS message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @column_exists = (
  SELECT COUNT(*) 
  FROM information_schema.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'translations' 
    AND COLUMN_NAME = 'updated_at'
);

SET @sql = IF(
  @column_exists = 0,
  'ALTER TABLE translations ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP',
  'SELECT "translations.updated_at already exists" AS message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ====================================
-- 6. Final Verification Query
-- ====================================
SELECT 
  'V11 Schema Alignment Complete' AS status,
  (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'buses' AND COLUMN_NAME = 'active') AS buses_active,
  (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'buses' AND COLUMN_NAME = 'capacity') AS buses_capacity,
  (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'buses' AND COLUMN_NAME = 'category') AS buses_category,
  (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'buses' AND COLUMN_NAME = 'created_at') AS buses_created_at,
  (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'buses' AND COLUMN_NAME = 'updated_at') AS buses_updated_at,
  (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'locations' AND COLUMN_NAME = 'created_at') AS locations_created_at,
  (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'locations' AND COLUMN_NAME = 'updated_at') AS locations_updated_at;

-- Create a comprehensive view for schema validation
CREATE OR REPLACE VIEW v_schema_validation AS
SELECT 
  t.TABLE_NAME,
  t.TABLE_TYPE,
  COUNT(c.COLUMN_NAME) AS column_count,
  GROUP_CONCAT(
    CONCAT(c.COLUMN_NAME, ':', c.DATA_TYPE) 
    ORDER BY c.ORDINAL_POSITION 
    SEPARATOR ', '
  ) AS columns
FROM information_schema.TABLES t
LEFT JOIN information_schema.COLUMNS c 
  ON t.TABLE_SCHEMA = c.TABLE_SCHEMA 
  AND t.TABLE_NAME = c.TABLE_NAME
WHERE t.TABLE_SCHEMA = DATABASE()
  AND t.TABLE_TYPE = 'BASE TABLE'
  AND t.TABLE_NAME IN (
    'buses', 'locations', 'stops', 'translations',
    'route_contributions', 'image_contributions',
    'bus_timing_records', 'timing_image_contributions',
    'extracted_bus_timings', 'skipped_timing_records',
    'user_tracking_sessions'
  )
GROUP BY t.TABLE_NAME, t.TABLE_TYPE
ORDER BY t.TABLE_NAME;

-- Display schema validation summary
SELECT * FROM v_schema_validation;
