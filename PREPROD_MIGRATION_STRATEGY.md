# Preprod Migration Strategy - Startup Performance Fix

## Problem
- **V45__load_overpass_tamil_nadu_locations.sql** contains 25,768 lines of data inserts
- This migration was running on every application startup, causing timeout errors
- Cloud Run startup probe has a 240-second (4 minute) timeout window
- The large migration takes > 5 minutes to complete, exceeding the timeout

## Solution
**Separate migrations from application startup:**
1. Disable Flyway auto-migration in `application-preprod.properties`
2. Run migrations separately via Cloud Run job before deploying the application
3. Application starts faster and only validates schema

## Configuration Changes
✅ **application-preprod.properties**:
- `spring.flyway.enabled=false` - Disable automatic migration execution
- `spring.jpa.hibernate.ddl-auto=validate` - Only validate schema, don't modify

## Running Migrations

### Option 1: Cloud Run Job (Recommended for Production)
Create and run a one-time migration job BEFORE deploying the backend service:

```bash
# Set these environment variables from your Cloud Run settings
PROJECT_ID="astute-strategy-406601"
IMAGE="asia-south1-docker.pkg.dev/${PROJECT_ID}/perundhu/backend:20260104-233244-0c35667"
SQL_INSTANCE="astute-strategy-406601:us-central1:perundhu-preprod-mysql"

# Create and execute a one-time migration job
gcloud run jobs execute perundhu-migrate-preprod \
  --region=asia-south1 \
  --project=${PROJECT_ID} \
  2>&1 | tail -20

# If the job doesn't exist, create it first:
gcloud run jobs create perundhu-migrate-preprod \
  --image=${IMAGE} \
  --region=asia-south1 \
  --project=${PROJECT_ID} \
  --task-timeout=600s \
  --memory=1Gi \
  --cpu=2 \
  --set-env-vars="SPRING_PROFILES_ACTIVE=preprod,GCP_INSTANCE_CONNECTION_NAME=${SQL_INSTANCE}" \
  --set-secrets="DB_PASSWORD=preprod-db-password:latest,MYSQL_PASSWORD=preprod-db-password:latest" \
  --command='sh' \
  --args='-c,cd /app && java $JAVA_OPTS -Dspring.flyway.enabled=true -jar app.jar' \
  --execute
```

### Option 2: Local Gradle (For Development/Testing)
If running locally with access to preprod database:

```bash
cd backend

# Export preprod database credentials
export DB_URL="jdbc:mysql://[CLOUD_SQL_PROXY_OR_IP]:3306/perundhu"
export DB_USERNAME="perundhu_user"
export DB_PASSWORD="[your_password]"
export GCP_INSTANCE_CONNECTION_NAME="astute-strategy-406601:us-central1:perundhu-preprod-mysql"

# Run migrations
./gradlew flywayMigrate -Dspring.profiles.active=preprod
```

### Option 3: Direct SQL (Emergency Only)
If migrations fail and need manual intervention:

```bash
# Connect to preprod database and manually execute migration files
mysql -h [CLOUD_SQL_IP] -u perundhu_user -p perundhu < backend/app/src/main/resources/db/migration/V45__load_overpass_tamil_nadu_locations.sql
```

## Deployment Workflow

### Step 1: Run Migrations (5-10 minutes)
```bash
# Execute migration job - this runs migrations on preprod database
gcloud run jobs execute perundhu-migrate-preprod --region=asia-south1 --project=astute-strategy-406601
```

### Step 2: Wait for Migration Completion
Monitor job execution:
```bash
# Watch migration job logs
gcloud run jobs log perundhu-migrate-preprod --region=asia-south1 --project=astute-strategy-406601 --limit=100
```

Expected log at completion:
```
INFO o.f.core.internal.command.DbMigrate - Successfully applied X migrations...
INFO com.perundhu.App - Started App...
```

### Step 3: Deploy Backend Service
Once migrations complete, deploy the backend:
```bash
gcloud run deploy perundhu-backend-preprod \
  --image=${IMAGE} \
  --region=asia-south1 \
  --project=astute-strategy-406601 \
  --allow-unauthenticated
```

## Verification

### Check if migrations are applied:
```bash
# Query the migration history table
gcloud sql connect perundhu-preprod-mysql \
  --user=root \
  --project=astute-strategy-406601

# In MySQL:
SELECT version, description, success FROM flyway_schema_history ORDER BY version;
```

Expected output should show V45 as successful:
```
+-------+--------------------------------------------------+---------+
| version| description                                      | success |
+-------+--------------------------------------------------+---------+
| 45    | load overpass tamil nadu locations               | 1       |
| 46    | add missing columns to route contributions       | 1       |
| 47    | remove duplicate locations                        | 1       |
+-------+--------------------------------------------------+---------+
```

### Check application startup:
```bash
# View recent logs - should show successful startup without hanging
gcloud run services logs read perundhu-backend-preprod \
  --region=asia-south1 \
  --project=astute-strategy-406601 \
  --limit=20
```

Expected:
```
Started App in X seconds (JVM running for Y.Z seconds)
Tomcat initialized with port 8080 (http)
Initializing Spring embedded WebApplicationContext
```

## Troubleshooting

### Application still won't start
Check if schema validation is failing:
```
org.hibernate.tool.schema.spi.SchemaManagementException: Schema-validation: missing table [XXX]
```

**Solution**: Ensure migration job completed successfully before deploying backend.

### Migration job is stuck/running too long
Logs show Flyway still executing migration:
```
gcloud run jobs log perundhu-migrate-preprod --limit=50 --tail
```

**Solution**: 
1. Check query complexity (V45 has 25k+ inserts)
2. Ensure Cloud SQL instance has sufficient resources
3. May need to increase job timeout (currently 600s/10 minutes)

### Rolling back a migration
If a migration causes issues:
```bash
# Connect to database
gcloud sql connect perundhu-preprod-mysql --user=root

# Mark migration as not executed in Flyway history
UPDATE flyway_schema_history SET success = 0 WHERE version = 45;

# Then fix the migration file and re-run
gcloud run jobs execute perundhu-migrate-preprod
```

## Future Optimization

Consider breaking up V45 into smaller batches:
- V45a: Load first 8000 locations
- V45b: Load next 8000 locations  
- V45c: Load final 9731 locations

This would reduce individual migration time and improve startup reliability.

## References
- [Flyway Documentation](https://flywaydb.org/documentation/command/migrate)
- [Cloud Run Jobs Documentation](https://cloud.google.com/run/docs/quickstarts/jobs/create-execute)
- [Cloud SQL Proxy Documentation](https://cloud.google.com/sql/docs/mysql/sql-proxy)
