#!/bin/bash
# fix-preprod-migration-state.sql
# Run this script on the preprod database to clean up after failed migrations
# 
# Usage:
#   mysql -h preprod-db-host -u root -p < fix-preprod-migration-state.sql
#
# OR via command line:
#   mysql -h localhost -u root -pROOT_PASSWORD perundhu << 'EOF'
#   [paste contents of this file]
#   EOF

-- Delete all failed migration records from Flyway history
DELETE FROM flyway_schema_history WHERE success = 0;

-- Verify cleanup
SELECT 'Migration history after cleanup:' as message;
SELECT version, description, success, installed_on FROM flyway_schema_history ORDER BY installed_rank;

-- Count total migrations
SELECT CONCAT('Total successful migrations: ', COUNT(*)) FROM flyway_schema_history WHERE success = 1;
