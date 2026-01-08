# Preprod Backend Deployment Status Report

## ✅ Deployment Successful
- Backend successfully deployed to Cloud Run (preprod)
- Service URL: `https://perundhu-backend-preprod-1032721240281.asia-south1.run.app`
- Revision: perundhu-backend-preprod-00012-p47
- Status: Serving traffic (100%)

## ⚠️ Schema Mismatch Issue
The backend is running but still experiencing schema mismatches:
- `Unknown column 'fl1_0.last_osm_update'` in `locations` table
- `Unknown column 'ssje1_0.id'` in `system_settings` table
- Cannot retrieve announcements because database schema is incomplete

## Root Cause
The migrations (V60, V61) were created and included in the built JAR, but haven't been applied to the preprod database yet.

**Why?** 
- Flyway is disabled (`FLYWAY_ENABLED=false`) during deployment to avoid circular dependency
- Migration execution must happen separately via CI/CD or manual database operations
- Deployment script uses the already-built image without running migrations

## Solution Implemented

### Updated Deployment Process
1. **Build** with migrations in JAR
2. **Push** image to GCP
3. **Separately run migrations** to preprod database (via CI/CD run-migrations job)
4. **Deploy** to Cloud Run with Flyway disabled

### Configuration Changes Made
- ✅ `.github/workflows/cd-preprod.yml` - Added `run-migrations` job that executes before deployment
- ✅ `deploy-preprod-backend-corrected.sh` - Updated with `FLYWAY_ENABLED=false`
- ✅ `application-preprod.properties` - Already configured with `spring.flyway.enabled=${FLYWAY_ENABLED:false}`
- ✅ Created `FLYWAY_CIRCULAR_DEPENDENCY_FIX.md` documentation

## Next Steps to Complete

### Option 1: Use GitHub Actions (Recommended)
```bash
git commit -am "Fix Flyway - run migrations separately"
git push origin master
# GitHub Actions will:
# 1. Run CI tests
# 2. Build backend (includes V60, V61 migrations in JAR)
# 3. Push Docker image
# 4. Run flywayMigrate step via Cloud SQL Proxy
# 5. Deploy to Cloud Run with FLYWAY_ENABLED=false
```

### Option 2: Manual Database Migration
Need to apply these columns to preprod database:

**V60: Announcement columns**
```sql
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS title_fallback VARCHAR(255);
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS message_key VARCHAR(255);
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS message_fallback TEXT;
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS link VARCHAR(500);
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS link_text_key VARCHAR(255);
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS link_text_fallback VARCHAR(255);
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS is_dismissible INT DEFAULT 1;
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS announcement_category VARCHAR(50);
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS display_banner INT DEFAULT 1;
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS display_modal INT DEFAULT 0;
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS starts_at DATETIME;
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS expires_at DATETIME;
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS view_count BIGINT DEFAULT 0;
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS dismiss_count BIGINT DEFAULT 0;
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS created_by VARCHAR(100);
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS updated_by VARCHAR(100);
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'DRAFT';
```

**V61: Location columns**
```sql
ALTER TABLE locations ADD COLUMN IF NOT EXISTS osm_type VARCHAR(20);
ALTER TABLE locations ADD COLUMN IF NOT EXISTS osm_node_id BIGINT;
ALTER TABLE locations ADD COLUMN IF NOT EXISTS osm_way_id BIGINT;
ALTER TABLE locations ADD COLUMN IF NOT EXISTS last_osm_update DATETIME;
ALTER TABLE locations ADD COLUMN IF NOT EXISTS osm_tags JSON;
ALTER TABLE locations ADD COLUMN IF NOT EXISTS neighborhood VARCHAR(255);
ALTER TABLE locations ADD COLUMN IF NOT EXISTS state VARCHAR(100);
ALTER TABLE locations ADD COLUMN IF NOT EXISTS type VARCHAR(50);
```

## Current Deployment Configuration

### Environment Variables Set
```
SPRING_PROFILES_ACTIVE=preprod
FLYWAY_ENABLED=false
SPRING_DATASOURCE_URL=jdbc:mysql://google/perundhu?cloudSqlInstance=...&socketFactory=...
CORS_ALLOWED_ORIGINS=https://perundhu-frontend-preprod-1032721240281.asia-south1.run.app
LOG_LEVEL_ROOT=INFO
LOG_LEVEL_APP=INFO
RATE_LIMIT_ENABLED=true
HONEYPOT_ENABLED=true
```

### Secrets Configured
- DB_PASSWORD ✓
- GEMINI_API_KEY ✓
- ADMIN_USERNAME ✓
- ADMIN_PASSWORD ✓

## Testing After Schema Fix

Once migrations are applied:

```bash
# Test health endpoint (bypasses IP filter with browser UA)
curl -s 'https://perundhu-backend-preprod-1032721240281.asia-south1.run.app/actuator/health' \
  -H 'User-Agent: Mozilla/5.0' | jq

# Test announcements endpoint
curl -s 'https://perundhu-backend-preprod-1032721240281.asia-south1.run.app/api/v1/announcements' \
  -H 'Origin: https://perundhu-frontend-preprod-1032721240281.asia-south1.run.app' \
  -H 'User-Agent: Mozilla/5.0' | jq

# Check logs
gcloud run services logs read perundhu-backend-preprod --region=asia-south1 --limit=50
```

## Files Modified
- `.github/workflows/cd-preprod.yml` - Added run-migrations job
- `deploy-preprod-backend-corrected.sh` - Fixed env var syntax, set FLYWAY_ENABLED=false
- `FLYWAY_CIRCULAR_DEPENDENCY_FIX.md` - Comprehensive fix documentation

## Known Issues
1. IP filtering blocks curl requests (not a real error, app is rejecting suspicious agents)
2. MySQL client authentication plugin issue when trying direct connection from local machine
3. Flyway circular dependency solved but requires separate migration execution

## Timeline
- **2026-01-08 07:52** - V60 migration created
- **2026-01-08 09:05** - V61 migration created  
- **2026-01-08 11:20** - Backend deployed to Cloud Run successfully
- **2026-01-08 14:00** - Identified schema mismatch in running service
- **Current** - Deployment complete, awaiting schema migration execution

## Recommended Action
Run the GitHub Actions CI/CD pipeline to:
1. Test code
2. Build JAR with migrations
3. Run migrations separately
4. Deploy to preprod

This ensures a clean, repeatable process for future deployments.
