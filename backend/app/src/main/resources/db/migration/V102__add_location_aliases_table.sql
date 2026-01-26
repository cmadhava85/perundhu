-- V102__add_location_aliases_table.sql
-- Adds location aliases support to handle multiple names for the same location
-- Purpose: Enable users to search for "Broadway", "Broadway Bus Terminus", 
--          "Chennai - Broadway", etc. and get the same results
-- Example: All these names will map to the same location:
--          - BROADWAY
--          - Broadway Bus Terminus
--          - Chennai - Broadway
--          - Broadway Terminus
--          - Broadway Bus Stand

-- Create location_aliases table
CREATE TABLE IF NOT EXISTS location_aliases (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    location_id BIGINT NOT NULL COMMENT 'Reference to the canonical location',
    alias_name VARCHAR(255) NOT NULL COMMENT 'Alternative name for the location',
    is_primary BOOLEAN DEFAULT FALSE COMMENT 'Whether this is the primary/canonical name',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign key to locations table
    CONSTRAINT fk_alias_location 
        FOREIGN KEY (location_id) REFERENCES locations(id) 
        ON DELETE CASCADE,
    
    -- Ensure unique aliases (same alias can't point to different locations)
    CONSTRAINT unique_alias_name UNIQUE (alias_name),
    
    -- Index for fast alias lookups
    KEY idx_alias_name (alias_name),
    KEY idx_location_id (location_id),
    KEY idx_is_primary (is_primary)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci 
COMMENT='Stores alternative names (aliases) for locations to support flexible search';

-- Add comment to help developers understand the table structure
ALTER TABLE location_aliases COMMENT = 
'Location Aliases: Maps alternative names to canonical locations. 
Example: "Broadway", "Broadway Bus Terminus", "Chennai - Broadway" all point to location_id=123';
