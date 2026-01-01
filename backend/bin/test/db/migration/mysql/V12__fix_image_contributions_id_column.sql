-- Fix image_contributions table id column to support UUID strings
-- Change from BIGINT AUTO_INCREMENT to VARCHAR(36) to accommodate UUID format

-- Drop existing data if any (safe for new feature)
TRUNCATE TABLE image_contributions;

-- Drop the primary key constraint
ALTER TABLE image_contributions DROP PRIMARY KEY;

-- First, remove AUTO_INCREMENT by changing to BIGINT
ALTER TABLE image_contributions MODIFY COLUMN id BIGINT NOT NULL;

-- Now change from BIGINT to VARCHAR(36)
ALTER TABLE image_contributions MODIFY COLUMN id VARCHAR(36) NOT NULL;

-- Re-add primary key constraint
ALTER TABLE image_contributions ADD PRIMARY KEY (id);

-- Update other columns to match current entity definition
-- MySQL requires separate ALTER statements for DROP COLUMN IF EXISTS pattern
-- Using stored procedure to safely drop columns if they exist

DROP PROCEDURE IF EXISTS drop_column_if_exists;

DELIMITER //
CREATE PROCEDURE drop_column_if_exists()
BEGIN
    -- Drop bus_number if exists
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_schema = DATABASE() 
               AND table_name = 'image_contributions' 
               AND column_name = 'bus_number') THEN
        ALTER TABLE image_contributions DROP COLUMN bus_number;
    END IF;
    
    -- Drop submitted_by if exists
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_schema = DATABASE() 
               AND table_name = 'image_contributions' 
               AND column_name = 'submitted_by') THEN
        ALTER TABLE image_contributions DROP COLUMN submitted_by;
    END IF;
    
    -- Drop rejection_reason if exists
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_schema = DATABASE() 
               AND table_name = 'image_contributions' 
               AND column_name = 'rejection_reason') THEN
        ALTER TABLE image_contributions DROP COLUMN rejection_reason;
    END IF;
END //
DELIMITER ;

CALL drop_column_if_exists();
DROP PROCEDURE IF EXISTS drop_column_if_exists;

-- Add new columns if they don't exist (using procedure pattern)
DROP PROCEDURE IF EXISTS add_columns_if_not_exist;

DELIMITER //
CREATE PROCEDURE add_columns_if_not_exist()
BEGIN
    -- Add user_id if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = DATABASE() 
                   AND table_name = 'image_contributions' 
                   AND column_name = 'user_id') THEN
        ALTER TABLE image_contributions ADD COLUMN user_id VARCHAR(50) NOT NULL DEFAULT 'system';
        ALTER TABLE image_contributions MODIFY COLUMN user_id VARCHAR(50) NOT NULL;
    END IF;
    
    -- Add location if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = DATABASE() 
                   AND table_name = 'image_contributions' 
                   AND column_name = 'location') THEN
        ALTER TABLE image_contributions ADD COLUMN location VARCHAR(100);
    END IF;
    
    -- Add route_name if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = DATABASE() 
                   AND table_name = 'image_contributions' 
                   AND column_name = 'route_name') THEN
        ALTER TABLE image_contributions ADD COLUMN route_name VARCHAR(100);
    END IF;
    
    -- Add processed_date if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = DATABASE() 
                   AND table_name = 'image_contributions' 
                   AND column_name = 'processed_date') THEN
        ALTER TABLE image_contributions ADD COLUMN processed_date TIMESTAMP NULL;
    END IF;
    
    -- Add additional_notes if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = DATABASE() 
                   AND table_name = 'image_contributions' 
                   AND column_name = 'additional_notes') THEN
        ALTER TABLE image_contributions ADD COLUMN additional_notes VARCHAR(1000);
    END IF;
    
    -- Add validation_message if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = DATABASE() 
                   AND table_name = 'image_contributions' 
                   AND column_name = 'validation_message') THEN
        ALTER TABLE image_contributions ADD COLUMN validation_message TEXT;
    END IF;
    
    -- Add extracted_data if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = DATABASE() 
                   AND table_name = 'image_contributions' 
                   AND column_name = 'extracted_data') THEN
        ALTER TABLE image_contributions ADD COLUMN extracted_data TEXT;
    END IF;
END //
DELIMITER ;

CALL add_columns_if_not_exist();
DROP PROCEDURE IF EXISTS add_columns_if_not_exist;

-- Update existing column constraints
ALTER TABLE image_contributions MODIFY COLUMN description VARCHAR(1000);
ALTER TABLE image_contributions MODIFY COLUMN status VARCHAR(20) NOT NULL;

-- Update indexes (drop first, then create)
DROP PROCEDURE IF EXISTS update_indexes;

DELIMITER //
CREATE PROCEDURE update_indexes()
BEGIN
    -- Drop old index if exists
    IF EXISTS (SELECT 1 FROM information_schema.statistics 
               WHERE table_schema = DATABASE() 
               AND table_name = 'image_contributions' 
               AND index_name = 'idx_image_contributions_bus_number') THEN
        DROP INDEX idx_image_contributions_bus_number ON image_contributions;
    END IF;
    
    -- Create user_id index if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.statistics 
                   WHERE table_schema = DATABASE() 
                   AND table_name = 'image_contributions' 
                   AND index_name = 'idx_image_contributions_user_id') THEN
        CREATE INDEX idx_image_contributions_user_id ON image_contributions(user_id);
    END IF;
    
    -- Create status index if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.statistics 
                   WHERE table_schema = DATABASE() 
                   AND table_name = 'image_contributions' 
                   AND index_name = 'idx_image_contributions_status') THEN
        CREATE INDEX idx_image_contributions_status ON image_contributions(status);
    END IF;
END //
DELIMITER ;

CALL update_indexes();
DROP PROCEDURE IF EXISTS update_indexes;
