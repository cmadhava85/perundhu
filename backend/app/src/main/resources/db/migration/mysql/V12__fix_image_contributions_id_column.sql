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
ALTER TABLE image_contributions 
    DROP COLUMN IF EXISTS bus_number,
    DROP COLUMN IF EXISTS submitted_by,
    DROP COLUMN IF EXISTS rejection_reason;

-- Add new columns if they don't exist
ALTER TABLE image_contributions 
    ADD COLUMN IF NOT EXISTS user_id VARCHAR(50) NOT NULL DEFAULT 'system',
    ADD COLUMN IF NOT EXISTS location VARCHAR(100),
    ADD COLUMN IF NOT EXISTS route_name VARCHAR(100),
    ADD COLUMN IF NOT EXISTS processed_date TIMESTAMP,
    ADD COLUMN IF NOT EXISTS additional_notes VARCHAR(1000),
    ADD COLUMN IF NOT EXISTS validation_message TEXT,
    ADD COLUMN IF NOT EXISTS extracted_data TEXT;

-- Remove the default after adding the column
ALTER TABLE image_contributions MODIFY COLUMN user_id VARCHAR(50) NOT NULL;

-- Update existing column constraints
ALTER TABLE image_contributions MODIFY COLUMN description VARCHAR(1000);
ALTER TABLE image_contributions MODIFY COLUMN status VARCHAR(20) NOT NULL;

-- Update indexes
DROP INDEX IF EXISTS idx_image_contributions_bus_number ON image_contributions;
CREATE INDEX IF NOT EXISTS idx_image_contributions_user_id ON image_contributions(user_id);
CREATE INDEX IF NOT EXISTS idx_image_contributions_status ON image_contributions(status);
