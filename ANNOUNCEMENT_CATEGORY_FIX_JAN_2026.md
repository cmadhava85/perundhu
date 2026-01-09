# Fix: Missing `announcement_category` Column in Announcements Table

## Problem
The database error shows:
```
org.springframework.dao.InvalidDataAccessResourceUsageException: 
Unknown column 'aje1_0.announcement_category' in 'field list'
```

This occurs when trying to query announcements because:
1. The JPA entity `AnnouncementJpaEntity` has the `announcement_category` field
2. The database `announcements` table is **missing** this column
3. The V60 migration exists but **hasn't been applied** to the database

---

## Root Cause
The migration `V60__add_missing_announcement_columns.sql` was created but not executed on the database. This can happen when:
- Flyway migration is disabled (`spring.flyway.enabled=false`)
- The backend hasn't been redeployed since the migration was added
- The migration ran but against the wrong database

---

## Solution Options

### ✅ Option 1: Redeploy Backend with Flyway Enabled (Recommended)

This ensures migrations run automatically on startup.

#### For Cloud Run:
```bash
# Deploy with Flyway enabled
gcloud run deploy perundhu-backend-preprod \
  --image gcr.io/astute-strategy-406601/perundhu-backend:latest \
  --set-env-vars SPRING_PROFILES_ACTIVE=preprod,SPRING_FLYWAY_ENABLED=true \
  --allow-unauthenticated \
  --region asia-south1
```

#### For Local/Docker:
```bash
# Rebuild backend
cd backend
./gradlew clean build -DskipTests

# Deploy with Flyway enabled
# Make sure application-preprod.properties has: spring.flyway.enabled=true
docker-compose up -d perundhu-backend
```

### Option 2: Run Migrations Manually

If you want to apply migrations without redeploying:

```bash
# Run from backend directory
cd backend
./gradlew flywayMigrate \
  -Dflyway.url=jdbc:mysql://[DB_HOST]:3306/perundhu \
  -Dflyway.user=perundhu_user \
  -Dflyway.password=[PASSWORD]
```

### Option 3: Execute SQL Directly (Last Resort)

If neither option above works, manually execute the migration SQL:

```bash
# SSH into your database or use a SQL client
mysql -h [DB_HOST] -u perundhu_user -p perundhu < apply-manual-migrations.sh
```

Or copy-paste this SQL:
```sql
-- Add missing announcement columns
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS title_fallback VARCHAR(255) NOT NULL DEFAULT '';
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS message_key VARCHAR(255) NOT NULL DEFAULT '';
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS message_fallback TEXT NOT NULL DEFAULT '';
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS link VARCHAR(500);
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS link_text_key VARCHAR(255);
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS link_text_fallback VARCHAR(255);
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS is_dismissible INT NOT NULL DEFAULT 1;
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS announcement_category VARCHAR(50);
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS display_banner INT NOT NULL DEFAULT 1;
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS display_modal INT NOT NULL DEFAULT 0;
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS starts_at DATETIME;
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS expires_at DATETIME;
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS view_count BIGINT NOT NULL DEFAULT 0;
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS dismiss_count BIGINT NOT NULL DEFAULT 0;
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS created_by VARCHAR(100);
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS updated_by VARCHAR(100);
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'DRAFT';

-- Verify columns were added
DESCRIBE announcements;
```

---

## Verification

After applying migrations, verify the column exists:

```bash
# Check column exists
mysql -h [DB_HOST] -u perundhu_user -p perundhu -e "DESCRIBE announcements;" | grep announcement_category

# Should output:
# announcement_category | varchar(50) | YES | | NULL | |
```

Or check the Flyway migration history:
```bash
mysql -h [DB_HOST] -u perundhu_user -p perundhu -e "SELECT version, description, success FROM flyway_schema_history WHERE version IN ('60', '61');"

# Should show:
# 60 | add_missing_announcement_columns | 1
# 61 | add_missing_locations_columns | 1
```

---

## Key Files
- **Migration**: `backend/app/src/main/resources/db/migration/V60__add_missing_announcement_columns.sql`
- **Entity**: `backend/app/src/main/java/com/perundhu/infrastructure/persistence/entity/AnnouncementJpaEntity.java`
- **Config**: `backend/app/src/main/resources/application-preprod.properties` (ensure `spring.flyway.enabled=true`)
- **Manual Script**: `apply-manual-migrations.sh`

---

## Why This Happened

The `announcement_category` field was added to the JPA entity to support categorizing announcements, but the database migration to add this column to the table wasn't executed. This is a common issue in development where schema changes get out of sync with migrations.

The fix ensures the database schema matches the JPA entity definition.

---

## Next Steps

1. **Choose your deployment method** (Option 1 is recommended)
2. **Execute migrations**
3. **Verify** the column exists using the verification steps above
4. **Test** the announcements API endpoint
5. **Monitor logs** for any other schema mismatches

---

## Related Issues
- **Date**: January 9, 2026
- **Component**: Announcements feature
- **Status**: Migration exists, needs execution
- **Impact**: Announcements queries fail until fixed
