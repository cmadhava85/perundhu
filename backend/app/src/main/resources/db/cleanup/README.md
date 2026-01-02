# Database Cleanup Guide

## Failed Flyway Migration - V1.1

### Problem
The V1.1__create_contribution_tables.sql migration failed with:
```
Error Code 1061: Duplicate key name 'idx_route_contributions_status'
```

This was caused by attempting to create tables and indexes that already exist in V1__init.sql.

### Solution
The V1.1 migration has been fixed to be a no-op (just comments). However, you need to clean up the failed migration record from the Flyway history table.

### Steps to Fix

#### For Preprod/Production (Cloud SQL)
1. Connect to your Cloud SQL database using Cloud SQL Proxy or gcloud
2. Run the cleanup SQL from `cleanup_failed_v1_1.sql`:
   ```bash
   mysql -h 127.0.0.1 -u admin -p perundhu < cleanup_failed_v1_1.sql
   ```
3. Redeploy the application - Flyway will now successfully apply the (now-fixed) V1.1 migration

#### For Local Development
1. If using H2 in-memory database (default for tests), no action needed - DB is reset each run
2. If using local MySQL:
   ```bash
   cd backend
   mysql -u root -p perundhu < src/main/resources/db/cleanup/cleanup_failed_v1_1.sql
   ```
3. Run the application or tests again

### Verification
After cleanup, verify the migration history:
```bash
SELECT * FROM flyway_schema_history ORDER BY version;
```

You should see V1 as SUCCESS and V1.1 should either be absent or marked as SUCCESS.

### Migration Details
- **V1__init.sql**: Creates all core tables including route_contributions and image_contributions
- **V1.1__create_contribution_tables.sql**: Was a duplicate - now converted to no-op comment
- **V23+ migrations**: Additive features on top of V1 schema

No data is lost - the cleanup only removes the failed migration metadata record.
