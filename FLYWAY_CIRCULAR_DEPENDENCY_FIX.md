# Flyway Circular Dependency Fix

## Problem
When `SPRING_FLYWAY_ENABLED=true` was set during Cloud Run deployment, the application failed to start with:
```
Error creating bean with name 'flyway': Circular depends-on relationship between 'flyway' and 'entityManagerFactory'
```

## Root Cause
Spring Boot's bean initialization creates a circular dependency when:
1. **Flyway bean** depends on database being available to run migrations
2. **EntityManagerFactory bean** (from Hibernate/JPA) also depends on database connectivity
3. Both beans are trying to initialize, creating a deadlock

This is a known Spring Boot + Hibernate + Flyway configuration issue when using certain properties combinations.

## Solution
**Flyway is now DISABLED during Cloud Run deployment** with proper migration management:

### Configuration Changes
1. **application-preprod.properties**:
   - Already had: `spring.flyway.enabled=${FLYWAY_ENABLED:false}` (defaults to false)

2. **Environment Variable**:
   - Using: `FLYWAY_ENABLED=false` (not `SPRING_FLYWAY_ENABLED`)
   - This ensures Flyway doesn't try to auto-initialize on startup

3. **GitHub Actions Workflow** (cd-preprod.yml):
   - Runs `flywayMigrate` step BEFORE deploying to Cloud Run
   - Connects to Cloud SQL via proxy on local port 3306
   - Applies all pending migrations (V60, V61, etc.)
   - Then deploys the container with Flyway disabled

### Deployment Flow

```
┌─────────────────────────────────────────────────┐
│ GitHub Actions Workflow Execution               │
└─────────────────────────────────────────────────┘
                    │
                    ▼
        ┌───────────────────────┐
        │ Build Backend JAR     │
        │ (with V60, V61 in     │
        │  resources/           │
        │  db/migration/)       │
        └───────────────────────┘
                    │
                    ▼
        ┌───────────────────────┐
        │ Push Docker Image     │
        │ to GCP Registry       │
        └───────────────────────┘
                    │
                    ▼
        ┌───────────────────────┐
        │ Start Cloud SQL Proxy │
        │ on 127.0.0.1:3306    │
        └───────────────────────┘
                    │
                    ▼
        ┌───────────────────────┐
        │ Run Flyway Migrations │
        │ - flywayRepair        │
        │ - flywayMigrate       │
        │                       │
        │ Applies: V60, V61 ✓   │
        └───────────────────────┘
                    │
                    ▼
        ┌───────────────────────┐
        │ Deploy to Cloud Run   │
        │ FLYWAY_ENABLED=false  │
        │                       │
        │ (DB schema ready)     │
        │ (No bean conflicts)   │
        │ (App starts cleanly)  │
        └───────────────────────┘
```

## Key Files Modified

### 1. `.github/workflows/cd-preprod.yml`
- **Run Migrations Job** (`run-migrations`):
  - Checks out code
  - Sets up JDK 21
  - Authenticates to GCP
  - Starts Cloud SQL Proxy
  - Runs `./gradlew flywayMigrate` with database credentials
  - Cleans up proxy before deployment

- **Deploy Backend Job** (`deploy-backend`):
  - Sets `FLYWAY_ENABLED=false` (not `SPRING_FLYWAY_ENABLED`)
  - Deploys image to Cloud Run
  - Depends on successful migration step

### 2. `deploy-preprod-backend-corrected.sh`
- Updated to use `FLYWAY_ENABLED=false`
- Manual deployment script for local testing

## Migrations Included

### V60 - add_missing_announcement_columns.sql
- Adds 17 missing columns to `announcements` table
- Columns: title_fallback, message_key, message_fallback, link, link_text_key, link_text_fallback, is_dismissible, announcement_category, display_banner, display_modal, starts_at, expires_at, view_count, dismiss_count, created_by, updated_by, status

### V61 - add_missing_locations_columns.sql
- Adds 8 missing columns to `locations` table
- Columns: osm_type, osm_node_id, osm_way_id, last_osm_update, osm_tags, neighborhood, state, type

## Deployment Commands

### Option 1: Use GitHub Actions (Automated)
```bash
git add -A
git commit -m "Fix Flyway circular dependency - migrations run separately"
git push origin master
# Triggers CI then CD pipeline
```

### Option 2: Manual Deployment
```bash
cd /Users/mchand69/Documents/perundhu
./deploy-preprod-backend-corrected.sh
# Deploys with FLYWAY_ENABLED=false
```

### Option 3: Debug Migrations Locally
```bash
# Start Cloud SQL Proxy
cloud_sql_proxy -instances=astute-strategy-406601:asia-south1:perundhu-preprod-mysql=tcp:127.0.0.1:3306 &

# Run migrations
cd backend
./gradlew flywayMigrate \
  -Pflyway.url="jdbc:mysql://127.0.0.1:3306/perundhu?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC" \
  -Pflyway.user="perundhu_user" \
  -Pflyway.password="<password>" \
  -Pflyway.driver="com.mysql.cj.jdbc.Driver" \
  -Pflyway.baselineOnMigrate=true
```

## Verification

After deployment, verify everything works:

```bash
# Get service URL
SERVICE_URL=$(gcloud run services describe perundhu-backend-preprod \
  --region=asia-south1 \
  --format='value(status.url)')

# Test health check
curl -s $SERVICE_URL/actuator/health | jq

# Test announcements endpoint
curl -s $SERVICE_URL/api/v1/announcements | jq

# Check logs
gcloud run logs read perundhu-backend-preprod --region=asia-south1 --limit=50
```

## Expected Results

✅ **Before**: Container crashes with "Circular depends-on relationship"
✅ **After**: 
- Application starts successfully in ~5-10 seconds
- Database schema includes all columns from V60 and V61
- Endpoints respond with 200 status
- No schema mismatch errors in logs

## Troubleshooting

### Issue: Still seeing circular dependency error
**Fix**: Verify `FLYWAY_ENABLED=false` is set (not `SPRING_FLYWAY_ENABLED`)

### Issue: Migrations not running in GitHub Actions
**Fix**: Check that Cloud SQL Proxy started successfully on port 3306

### Issue: "Unknown column" errors after deployment
**Fix**: Ensure migrations ran successfully before deployment (check workflow logs)

### Issue: Can't connect to database during migration step
**Fix**: Verify GCP credentials and Cloud SQL instance configuration

## Future Considerations

1. **Production Migration**: Same approach - run migrations separately before deployment
2. **Alternative**: Could enable Flyway but fix bean dependencies using `@Lazy` annotation on EntityManagerFactory
3. **CI/CD**: Consider adding database health check before migrations
4. **Monitoring**: Add Flyway migration success metrics to Cloud Run logs

## Related Files
- `application-preprod.properties` - Flyway config
- `backend/src/main/resources/db/migration/V60__add_missing_announcement_columns.sql`
- `backend/src/main/resources/db/migration/V61__add_missing_locations_columns.sql`
