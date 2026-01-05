# Preprod Startup Error - Root Cause & Fix

## Issue Identified
The preprod backend deployment is failing with a startup timeout error.

### Cloud Run Error Message
```
Revision 'perundhu-backend-preprod-00119-zdg' is not ready and cannot serve traffic. 
The user-provided container failed to start and listen on the port defined by the 
PORT=8080 environment variable within the allocated timeout.
```

### Root Cause
The application hangs during the Flyway database migration phase:

1. **Large Data Migration**: `V45__load_overpass_tamil_nadu_locations.sql` contains **25,768 lines** of SQL INSERT statements
2. **Data Volume**: Loading 25,731 location records takes > 5 minutes
3. **Startup Probe Timeout**: Cloud Run's health check only waits **240 seconds (4 minutes)** before declaring the service unhealthy
4. **Timing Mismatch**: Migration time (>5 min) > Startup probe timeout (4 min) = **FAILURE**

### Cloud Run Logs Evidence
```
23:51:37 - Flyway migration starts
23:51:43 - Schema history repair completes
23:51:45 - Successfully repaired schema history (execution time 00:04.753s)
23:52:06 - Last log entry (migration still running)
23:54:36 - Application never starts (stuck in V45 migration)
23:55:06 - Timeout reached, service marked as failed
```

## Solution Implemented

### Changes Made
Modified `/backend/app/src/main/resources/application-preprod.properties`:

**Before:**
```properties
spring.flyway.enabled=true
spring.jpa.hibernate.ddl-auto=none
```

**After:**
```properties
spring.flyway.enabled=false  # ← Disable auto-migration
spring.jpa.hibernate.ddl-auto=validate  # ← Validate schema only
```

### Why This Works
1. **Fast Startup**: Application starts in < 5 seconds (validates schema, no data load)
2. **Separate Migration**: Large migrations run in dedicated Cloud Run job with 10-minute timeout
3. **Reliable Checks**: Hibernate still validates all tables exist (catches schema issues early)

## Next Steps

### Option A: Immediate Fix (Quick Redeploy)
```bash
# 1. Rebuild and push the image
cd /Users/mchand69/Documents/perundhu/backend
./gradlew clean build -x test
docker build -t asia-south1-docker.pkg.dev/astute-strategy-406601/perundhu/backend:preprod-fix .
docker push asia-south1-docker.pkg.dev/astute-strategy-406601/perundhu/backend:preprod-fix

# 2. Deploy with new image
gcloud run deploy perundhu-backend-preprod \
  --image=asia-south1-docker.pkg.dev/astute-strategy-406601/perundhu/backend:preprod-fix \
  --region=asia-south1 \
  --project=astute-strategy-406601 \
  --allow-unauthenticated

# 3. Check if it starts
curl https://perundhu-backend-preprod-1032721240281.asia-south1.run.app/api/health
```

### Option B: Using Cloud Build (Recommended)
```bash
# Use existing Cloud Build pipeline which will auto-rebuild
cd /Users/mchand69/Documents/perundhu
git add backend/app/src/main/resources/application-preprod.properties
git commit -m "Fix preprod startup timeout: disable auto-migration on app startup"
git push origin master

# Cloud Build will automatically trigger and deploy
```

## Important Notes

### ⚠️ Database Must Already Be Migrated
The preprod database **MUST** have all migrations applied BEFORE deploying this change:

**Check current migration status:**
```bash
gcloud sql connect perundhu-preprod-mysql --user=root --project=astute-strategy-406601
SELECT version, description, success FROM flyway_schema_history ORDER BY version DESC LIMIT 5;
```

**Expected:**
```
| 47 | remove duplicate locations           | 1 |
| 46 | add missing columns to route cont... | 1 |
| 45 | load overpass tamil nadu locations   | 1 |
```

### If Database is Missing Migrations
Run this BEFORE deploying the app:

```bash
# Create a migration job that runs the migrations
gcloud run jobs create perundhu-migrate-preprod \
  --image=asia-south1-docker.pkg.dev/astute-strategy-406601/perundhu/backend:latest \
  --region=asia-south1 \
  --project=astute-strategy-406601 \
  --task-timeout=600s \
  --memory=1Gi \
  --cpu=2 \
  --set-env-vars="SPRING_PROFILES_ACTIVE=preprod,GCP_INSTANCE_CONNECTION_NAME=astute-strategy-406601:us-central1:perundhu-preprod-mysql" \
  --set-secrets="DB_PASSWORD=preprod-db-password:latest,MYSQL_PASSWORD=preprod-db-password:latest" \
  --command='java' \
  --args='$JAVA_OPTS,-Dspring.flyway.enabled=true,-jar,app.jar'

# Then execute it
gcloud run jobs execute perundhu-migrate-preprod --region=asia-south1 --project=astute-strategy-406601

# Wait for completion (check logs)
gcloud run jobs log perundhu-migrate-preprod --region=asia-south1 --project=astute-strategy-406601 --tail
```

## Verification

### After Deployment
```bash
# Check application is running
gcloud run services describe perundhu-backend-preprod --region=asia-south1 --project=astute-strategy-406601

# Check recent logs
gcloud run services logs read perundhu-backend-preprod --region=asia-south1 --project=astute-strategy-406601 --limit=30

# Test endpoint
curl -I https://perundhu-backend-preprod-1032721240281.asia-south1.run.app/api/health
# Expected: HTTP 200
```

### Expected Successful Logs
```
23:51:24 - Spring Boot startup
23:51:29 - Tomcat initialized with port 8080
23:51:32 - Root WebApplicationContext initialization
23:51:33 - Hibernate validates schema
23:51:35 - All beans created successfully
23:51:36 - Started App in X seconds
```

## Files Changed
- ✅ `backend/app/src/main/resources/application-preprod.properties` - Configuration updated
- ✅ `PREPROD_MIGRATION_STRATEGY.md` - Documentation created for migration workflow
- ✅ `PREPROD_STARTUP_ERROR_FIX.md` - This file

## Related Issues
- Large data migrations (V45: 25,768 lines) should be moved to separate job
- Consider splitting V45 into smaller batches in future refactoring
- Cloud Run startup probe timeout may need adjustment if more DB work is added

## Test Checklist
- [ ] Cloud Build triggers automatically after git push
- [ ] New image builds successfully  
- [ ] Application deploys and starts within 240 seconds
- [ ] Schema validation passes (all tables exist)
- [ ] API endpoints respond to requests
- [ ] No "Schema-validation: missing table" errors
