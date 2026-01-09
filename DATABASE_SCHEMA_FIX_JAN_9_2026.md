# Database Schema Migration Fix - January 9, 2026

## Issue
Backend service logs showed:
```
org.springframework.dao.InvalidDataAccessResourceUsageException: 
JDBC exception executing SQL [...] [Unknown column 'rcje1_0.additional_notes' in 'field list']
```

## Root Cause
**Schema mismatch**: The Hibernate entity `RouteContributionJpaEntity` has a field `additional_notes` mapped to a database column, but this column didn't exist in the `route_contributions` table.

The migration `V58__add_missing_route_contributions_columns.sql` should have been applied during the CD pipeline, but wasn't executed.

### Why Migration Was Skipped
The CD pipeline has a `run-migrations` job that runs Flyway migrations BEFORE deploying to Cloud Run. However:
1. Cloud Run is configured with `FLYWAY_ENABLED=false` (by design - due to Spring Boot circular dependency issue)
2. Migrations must run during the CI/CD pipeline via `gradle flywayMigrate`
3. The latest deployment didn't execute the migration step, leaving the schema out of sync

## Solution Applied

### Immediate Fix (Manual Migration)
Ran the V58 migration manually using Python script to add missing columns:

**Columns added to `route_contributions` table:**
- ✅ `bus_number` (VARCHAR(50))
- ✅ `submission_date` (TIMESTAMP)
- ✅ `additional_notes` (TEXT)
- ✅ `submitted_by` (VARCHAR(100))
- ✅ `source_image_id` (VARCHAR(50))
- ✅ `route_group_id` (VARCHAR(50))
- ✅ `stops_json` (TEXT)

**Verification:**
- Total columns in table: 26
- All required columns now present: ✅

### Permanent Fix (Ensure Future Deployments)
The CD pipeline is already configured correctly:
- ✅ `cd-preprod.yml` has `run-migrations` job
- ✅ `run-migrations` job uses Cloud SQL Proxy to run `gradle flywayMigrate`
- ✅ `deploy-backend` job depends on `run-migrations` completing successfully

**Action Items:**
1. Monitor next CD deployment to ensure `run-migrations` step executes successfully
2. If migrations fail in future, check Cloud SQL Proxy connectivity in CI/CD logs
3. Alternatively, manually apply migrations using the `apply-migration-v58.py` script

## Files Created
- `apply-migration-v58.py` - Python script to apply V58 migration manually
- `apply-migration-v58.sh` - Bash script version (requires gcloud sql connect with plugin support)

## Testing
✅ Database schema updated successfully  
✅ No "Unknown column" errors in logs  
✅ Service running normally with all required columns  
✅ Last ERROR in logs: 2026-01-09T12:02:09Z (before migration)  
✅ Current logs: INFO level only (no errors)

## Migration History
The migration was created on 2026-01-08 but marked as part of V58:
- File: `backend/app/src/main/resources/db/migration/V58__add_missing_route_contributions_columns.sql`
- Purpose: Fix schema mismatch for environments where V56 was applied without all columns
- Idempotent: Uses conditional checks to avoid errors if columns already exist

## Next Steps
1. Monitor Cloud Run logs for any remaining errors
2. Test API endpoints that use RouteContribution entity
3. On next CD pipeline run, verify that `run-migrations` job completes successfully
4. If migrations fail again, investigate Cloud SQL Proxy connectivity in CI/CD environment
