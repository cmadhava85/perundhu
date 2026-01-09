# Preprod Schema Migration Troubleshooting Guide

## Problem
The error `Unknown column 'aje1_0.announcement_category' in 'field list'` indicates that the V60 migration (which adds the `announcement_category` column) has NOT been applied to the preprod Cloud SQL database.

## Root Cause
The CD pipeline's "Run Migrations" job may have:
1. Failed silently
2. Had authentication/connection issues with Cloud SQL Proxy
3. Not actually executed the Flyway migration command

## Verification

### Check if migrations were applied:

```bash
# Via gcloud SQL
gcloud sql connect perundhu-preprod-mysql --user=perundhu_user --quiet
# Then run: USE perundhu; SELECT version, description FROM flyway_schema_history WHERE version >= 60 ORDER BY version;

# Expected output:
# version | description
# 60      | add_missing_announcement_columns
# 61      | add_missing_locations_columns  
# 62      | align_schema_with_entities
# 63      | load_sample_locations

# OR check if the column exists:
DESCRIBE announcements;
# Should show: announcement_category | varchar(50) | YES | | NULL | |
```

## Solution Options

### Option 1: Manually Apply Schema (RECOMMENDED - Fastest)

```bash
# Apply the direct SQL fix
cd /Users/mchand69/Documents/perundhu
gcloud sql connect perundhu-preprod-mysql --user=perundhu_user --quiet < scripts/fix-preprod-schema.sql
```

### Option 2: Re-trigger CD Pipeline with Increased Logging

```bash
# Manually trigger the CD deployment
gh workflow run cd-preprod.yml --ref master

# Monitor the "Run Migrations" job for logs
# Check specifically for:
# - Cloud SQL Proxy startup
# - Flyway migration execution
# - V60, V61, V62, V63 migration status
```

### Option 3: Deploy with Flyway Enabled in Container

Edit `backend/app/src/main/resources/application-preprod.properties`:
```properties
# Temporarily enable Flyway on startup (NOT RECOMMENDED for long-term)
spring.flyway.enabled=true  # Change from: ${FLYWAY_ENABLED:false}
```

Then deploy:
```bash
gcloud run deploy perundhu-backend-preprod \
  --image asia-south1-docker.pkg.dev/astute-strategy-406601/perundhu/backend:preprod-latest \
  --region asia-south1 \
  --set-env-vars "SPRING_PROFILES_ACTIVE=preprod" \
  ...
```

**Note:** This is NOT recommended as it runs migrations on every container startup, but can be used as emergency fix.

## Configuration Check

### CD Pipeline Configuration
Location: `.github/workflows/cd-preprod.yml`

The pipeline should:
1. ✅ Build backend image with migration files
2. ✅ Run migrations using Cloud SQL Proxy BEFORE deployment
3. ✅ Deploy backend only AFTER migrations succeed
4. ✅ Set `FLYWAY_ENABLED=false` in deployed service (migrations already run)

### Application Properties
Location: `backend/app/src/main/resources/application-preprod.properties`

Should have:
- ✅ `spring.flyway.enabled=${FLYWAY_ENABLED:false}` (disabled at runtime)
- ✅ `spring.flyway.baseline-on-migrate=true`
- ✅ `spring.flyway.validate-on-migrate=true`

## Prevention for Future Deployments

1. **Monitor CD pipeline logs** - Check "Run Migrations" job output for errors
2. **Add database schema version check** - Include health check that verifies schema
3. **Explicit migration validation** - Add post-deployment step that queries flyway_schema_history

## Files Involved

- **Migration files:**
  - `backend/app/src/main/resources/db/migration/V60__add_missing_announcement_columns.sql`
  - `backend/app/src/main/resources/db/migration/V61__add_missing_locations_columns.sql`
  - `backend/app/src/main/resources/db/migration/V62__align_schema_with_entities.sql`
  - `backend/app/src/main/resources/db/migration/V63__load_sample_locations.sql`

- **Configuration:**
  - `backend/app/src/main/resources/application-preprod.properties`
  - `.github/workflows/cd-preprod.yml` (run-migrations job)

- **Fix scripts:**
  - `scripts/fix-preprod-schema.sql` (manual SQL fix)
  - `scripts/fix-preprod-schema-direct.py` (automated fix tool)

## Related Errors
- `Unknown column 'aje1_0.announcement_category'` - Missing V60 migration
- `Unknown column 'aje1_0.title_fallback'` - Missing V60 migration
- Announcement queries failing - Schema mismatch between JPA entity and database

---
**Date Created:** January 9, 2026  
**Status:** Guide for resolving preprod schema migration issues
