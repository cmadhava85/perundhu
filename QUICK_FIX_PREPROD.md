# Quick Action: Fix Preprod Backend Deployment

## 🔴 Error Summary
```
Schema-validation: missing table [announcements]
```
**Cause:** The V29 database migration hasn't been executed on the preprod database.

---

## ✅ Quick Fix (Choose One)

### Option 1: Auto-Migration on Startup (Recommended for Cloud Run)
No action needed if:
- ✅ `application-preprod.properties` has `spring.flyway.enabled=true`
- ✅ The preprod database is accessible via environment variables

Just redeploy the backend to Cloud Run, and Flyway will run migrations automatically on startup.

**Deploy command:**
```bash
gcloud run deploy perundhu-backend-preprod \
  --image gcr.io/[PROJECT_ID]/perundhu-backend:[VERSION] \
  --set-env-vars \
    SPRING_PROFILES_ACTIVE=preprod,\
    GCP_INSTANCE_CONNECTION_NAME=[CLOUD_SQL_CONNECTION],\
    DB_USERNAME=[DB_USER],\
    DB_PASSWORD=[DB_PASSWORD]
```

---

### Option 2: Pre-Deploy Migration (More Control)
Run migrations before deploying if you want to validate them first:

```bash
# 1. Set environment variables
# See PREPROD_ENVIRONMENT_SETUP_COMPLETE.md and PREPROD_QUICK_FIX.md for latest comprehensive guides
export DB_USERNAME="[DB_USER]"
export DB_PASSWORD="[DB_PASSWORD]"

# 2. Run migrations
cd /Users/mchand69/Documents/perundhu/backend
./gradlew flywayMigrate

# 3. Verify migration success
# Check that V29__create_announcements_table.sql is marked as SUCCESS in the database
```

---

### Option 3: Manual SQL Execution (Last Resort)
If neither option works, manually create the table:

```bash
# Connect to preprod database
mysql -h [HOST] -u [USER] -p [DATABASE]

# Run this SQL
source backend/app/src/main/resources/db/migration/V29__create_announcements_table.sql
```

---

## 📋 Verification

After deployment, verify the fix:

### Method 1: Check Application Logs
```bash
# In Cloud Run logs, you should see:
# "Successfully validated 29 migrations of namespace 'default'"
# or
# "Successfully applied 29 migrations"
```

### Method 2: Check Database
```sql
-- Connect to preprod database
SELECT * FROM flyway_schema_history WHERE script LIKE '%V29%';

-- Should return:
-- installed_rank | version | description | type | script | checksum | installed_by | installed_on | execution_time | success
-- 29 | 29 | create announcements table | SQL | V29__create_announcements_table.sql | ... | ...
```

### Method 3: Verify Table Exists
```sql
DESCRIBE announcements;

-- Should show all announcement table columns
```

---

## 🔧 Key Files in This Issue

| File | Purpose |
|------|---------|
| `backend/app/src/main/resources/db/migration/V29__create_announcements_table.sql` | Migration that creates announcements table |
| `backend/app/src/main/resources/application-preprod.properties` | Preprod config with Flyway settings |
| `backend/app/src/main/java/com/perundhu/infrastructure/persistence/entity/AnnouncementJpaEntity.java` | JPA entity mapped to announcements table |

---

## 🚀 Next Steps

1. **Choose your deployment method** (Option 1, 2, or 3 above)
2. **Deploy/run migrations**
3. **Verify the fix** using one of the verification methods
4. **Test the announcements API** to confirm functionality

---

## ⚠️ Important Notes

- **No code changes needed** - the solution is already in the codebase
- **Flyway handles ordering** - migrations run in sequence (V1 → V29)
- **Idempotent migrations** - safe to re-run without issues
- **Backup first** - if modifying production, always backup first

---

## 📞 Support

If you need to check database migrations:
```bash
# View all migration files
ls -1 /Users/mchand69/Documents/perundhu/backend/app/src/main/resources/db/migration/ | sort

# Count total migrations
ls -1 /Users/mchand69/Documents/perundhu/backend/app/src/main/resources/db/migration/ | wc -l
```

Total: **26 migration files** (V1 through V29)
