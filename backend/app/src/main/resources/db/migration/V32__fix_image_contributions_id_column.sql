-- V32: Add optional columns to image_contributions table
-- Simplified migration that safely adds new columns if they don't exist

-- Add user_id column if it doesn't exist
SET @col_exists = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME='image_contributions' AND COLUMN_NAME='user_id'
);

SET @sql = IF(@col_exists=0, 
    'ALTER TABLE image_contributions ADD COLUMN user_id VARCHAR(50) DEFAULT "system"', 
    'SELECT 1 /* Column already exists */'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add processed_date column if it doesn't exist
SET @col_exists = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME='image_contributions' AND COLUMN_NAME='processed_date'
);

SET @sql = IF(@col_exists=0, 
    'ALTER TABLE image_contributions ADD COLUMN processed_date TIMESTAMP NULL', 
    'SELECT 1 /* Column already exists */'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add validation_message column if it doesn't exist
SET @col_exists = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME='image_contributions' AND COLUMN_NAME='validation_message'
);

SET @sql = IF(@col_exists=0, 
    'ALTER TABLE image_contributions ADD COLUMN validation_message TEXT NULL', 
    'SELECT 1 /* Column already exists */'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;


