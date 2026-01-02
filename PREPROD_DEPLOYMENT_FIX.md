# Preprod Backend Deployment Fix - Missing Announcements Table

## Problem
The preprod backend failed to deploy with the following error:
```
org.springframework.beans.factory.BeanCreationException: Error creating bean with name 'entityManagerFactory'...
org.hibernate.tool.schema.spi.SchemaManagementException: Schema-validation: missing table [announcements]
```

## Root Cause Analysis

1. **Configuration**: In `application-preprod.properties`, the setting is:
   ```properties
   spring.jpa.hibernate.ddl-auto=validate
   ```
   This means Hibernate validates that all JPA entities have corresponding tables in the database.

2. **Missing Migration Execution**: The migration file `V29__create_announcements_table.sql` exists in the codebase but hasn't been executed on the preprod database yet.

3. **Entity Definition**: The `AnnouncementJpaEntity` class exists and is mapped to the `announcements` table, but the table doesn't exist in the preprod database.

## Solution Overview

There are two approaches:

### Approach 1: Run Migrations on Preprod Database (Recommended)
This is the correct approach as it ensures all pending migrations are executed in order.

### Approach 2: Change Hibernate DDL Strategy
Only use this as a temporary fix if migrations cannot be run immediately. This allows the application to start but should not be the permanent solution.

---

## Implementation Steps

### Step 1: Verify Migration Sequence
All migration files are present in the codebase:
- Location: `backend/app/src/main/resources/db/migration/`
- Key files: V1 through V29 migrations exist
- V29 creates the announcements table

### Step 2: Execute Pending Migrations on Preprod

#### Option A: Using Flyway Gradle Task (Recommended)
Run this command from the project root:

```bash
# Set environment variables for preprod database
export DB_URL="[preprod-database-url]"
export DB_USERNAME="[preprod-db-user]"
export DB_PASSWORD="[preprod-db-password]"

# Run migrations
cd backend
./gradlew flywayMigrate
```

#### Option B: Let Spring Boot Run Migrations on Startup
If `spring.flyway.enabled=true` is set in `application-preprod.properties`, migrations will run automatically on application startup.

**Important**: Verify in `application-preprod.properties`:
```properties
spring.flyway.enabled=true
spring.flyway.locations=classpath:db/migration/mysql
spring.flyway.baseline-on-migrate=true
spring.flyway.validate-on-migrate=true
```

### Step 3: Verify the Migration Was Applied
After deployment, verify the table exists:

```sql
DESCRIBE announcements;
```

Or check the Flyway migration history table:
```sql
SELECT * FROM flyway_schema_history WHERE script = 'V29__create_announcements_table.sql';
```

---

## Deployment Strategy for Cloud Run

### For Cloud Run Preprod Deployment:

1. **Create a migration job** (optional but recommended):
   ```bash
   # Before deploying the backend, run migrations in a separate Cloud Run job
   gcloud run jobs create perundhu-migrate-preprod \
     --image gcr.io/[PROJECT_ID]/perundhu-backend:preprod \
     --set-env-vars DB_URL=[CLOUD_SQL_URL],DB_USERNAME=[USER],DB_PASSWORD=[PASSWORD] \
     --memory 512Mi \
     --task-timeout 600s \
     --command ./gradlew,flywayMigrate
   ```

2. **Deploy the backend** (migrations will run automatically if enabled):
   ```bash
   gcloud run deploy perundhu-backend-preprod \
     --image gcr.io/[PROJECT_ID]/perundhu-backend:preprod \
     --set-env-vars SPRING_PROFILES_ACTIVE=preprod,DB_URL=[CLOUD_SQL_URL],... \
     --allow-unauthenticated
   ```

### Important Environment Variables for Preprod:
```
SPRING_PROFILES_ACTIVE=preprod
GCP_INSTANCE_CONNECTION_NAME=[YOUR_CLOUD_SQL_CONNECTION]
DB_USERNAME=[DATABASE_USER]
DB_PASSWORD=[DATABASE_PASSWORD]
MYSQL_USERNAME=[FALLBACK_USER]
MYSQL_PASSWORD=[FALLBACK_PASSWORD]
```

---

## Permanent Fix (Already Applied)

The codebase already has:

1. ✅ Migration file: `V29__create_announcements_table.sql`
2. ✅ JPA Entity: `AnnouncementJpaEntity.java`
3. ✅ Configuration: `application-preprod.properties` with proper Flyway settings
4. ✅ REST Controller: `AnnouncementController.java`
5. ✅ Service layer: `AnnouncementService.java`

**No code changes are needed.** Just ensure migrations are executed on the preprod database.

---

## Rollback (If Needed)

If the migration causes issues, Flyway can be rolled back:

```bash
# This should only be done if absolutely necessary
# Ensure you have proper backups first
./gradlew flywayClean  # This will delete all tables! Use with caution.
```

Better approach - manually drop just the announcements table:
```sql
DROP TABLE IF EXISTS announcements;
```

Then Flyway will automatically re-create it on the next run.

---

## Verification Checklist

- [ ] Migration file `V29__create_announcements_table.sql` is in the codebase
- [ ] `AnnouncementJpaEntity` JPA mapping is correct
- [ ] `application-preprod.properties` has `spring.flyway.enabled=true`
- [ ] Flyway migration runs on application startup
- [ ] `announcements` table is created in preprod database
- [ ] Backend deploys successfully
- [ ] No more `Schema-validation: missing table [announcements]` error

---

## References

- Flyway Documentation: https://flywaydb.org/
- Spring Boot Flyway Integration: https://spring.io/guides/gs/accessing-data-mysql/
- JPA Entity: `backend/app/src/main/java/com/perundhu/infrastructure/persistence/entity/AnnouncementJpaEntity.java`
- Migration: `backend/app/src/main/resources/db/migration/V29__create_announcements_table.sql`
- Config: `backend/app/src/main/resources/application-preprod.properties`
