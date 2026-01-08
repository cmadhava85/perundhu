-- Cleanup script for failed V1.1 migration
-- This should be run ONCE before redeploying with the fixed V1.1 migration

-- Delete the failed V1.1 migration record from Flyway history
DELETE FROM flyway_schema_history 
WHERE script = 'V1.1__create_contribution_tables.sql' 
  AND success = false;

-- Verify the cleanup
SELECT * FROM flyway_schema_history 
WHERE script LIKE 'V1%' 
ORDER BY version;
