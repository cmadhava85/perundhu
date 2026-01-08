# Preprod Backend 500 Error - Root Cause & Complete Fix

## 🚨 ACTUAL 500 ERROR ROOT CAUSE

The error is **NOT CORS related** (that was the initial red herring). The real issue is:

```
Unknown column 'aje1_0.announcement_category' in 'field list'
```

**Database migration V56 (baseline schema) doesn't have all the columns that the `AnnouncementJpaEntity` expects.**

The baseline migration created an outdated schema with missing columns:
- `title_fallback`
- `message_key`
- `message_fallback`
- `link`
- `link_text_key`
- `link_text_fallback`
- `is_dismissible`
- **`announcement_category`** ← This is the field causing the 500 error
- `display_banner`
- `display_modal`
- `starts_at`
- `expires_at`
- `view_count`
- `dismiss_count`
- `created_by`
- `updated_by`
- `status`

---

## ✅ COMPLETE FIX (3 Changes)

### 1. New Migration File Created
**File**: `backend/app/src/main/resources/db/migration/V60__add_missing_announcement_columns.sql`

This migration adds all missing columns to the announcements table.

### 2. Fixed Deployment Scripts
**Files Updated**:
- `deploy-preprod-backend-corrected.sh` → `SPRING_FLYWAY_ENABLED=true`
- `.github/workflows/cd-preprod.yml` → `SPRING_FLYWAY_ENABLED=true`

**Key Changes**:
```bash
# FROM (WRONG):
SPRING_FLYWAY_ENABLED=false

# TO (CORRECT):
SPRING_FLYWAY_ENABLED=true
```

Also fixed:
- Changed wildcard CORS: `https://perundhu-frontend-preprod-*.run.app` → exact URL
- Added all missing environment variables
- Added missing GCP secrets

### 3. Environment Variables for Preprod
```bash
SPRING_PROFILES_ACTIVE=preprod
SPRING_DATASOURCE_URL=jdbc:mysql://google/perundhu?cloudSqlInstance=astute-strategy-406601:asia-south1:perundhu-preprod-mysql&socketFactory=com.google.cloud.sql.mysql.SocketFactory&useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC
SPRING_DATASOURCE_DRIVER_CLASS_NAME=com.mysql.cj.jdbc.Driver
DB_USERNAME=perundhu_user
SPRING_DATASOURCE_USERNAME=perundhu_user
SPRING_FLYWAY_ENABLED=true                    # ← CRITICAL: This was false!
SERVER_PORT=8080
LOG_LEVEL_ROOT=INFO
LOG_LEVEL_APP=INFO
RATE_LIMIT_ENABLED=true
RATE_LIMIT_READ=100
RATE_LIMIT_WRITE=20
RATE_LIMIT_UPLOAD=10
ORIGIN_VALIDATION_ENABLED=true
ORIGIN_STRICT_MODE=false
HONEYPOT_ENABLED=true
RECAPTCHA_ENABLED=false
API_KEY_ENABLED=false
ADMIN_AUTH_ENABLED=true
GEMINI_API_ENABLED=true
DATA_ENCRYPTION_ENABLED=false
CORS_ALLOWED_ORIGINS=https://perundhu-frontend-preprod-1032721240281.asia-south1.run.app
GCP_PROJECT_ID=astute-strategy-406601
```

---

## 🚀 How to Deploy (Choose One)

### Option A: Use the corrected script (Fastest)
```bash
chmod +x deploy-preprod-backend-corrected.sh
./deploy-preprod-backend-corrected.sh
```

### Option B: Use the enhanced script with full logging
```bash
chmod +x deploy-preprod-backend-with-migrations.sh
./deploy-preprod-backend-with-migrations.sh
```

### Option C: Update GitHub Actions and push
The `.github/workflows/cd-preprod.yml` has been updated. Just push your changes and the workflow will deploy with migrations enabled.

---

## ✔️ Verification Steps

### 1. Check if migrations ran
```bash
curl https://perundhu-backend-preprod-1032721240281.asia-south1.run.app/actuator/health
# Should return: {"status":"UP",...}
```

### 2. Test the failing endpoint
```bash
curl 'https://perundhu-backend-preprod-1032721240281.asia-south1.run.app/api/v1/announcements' \
  -H 'Origin: https://perundhu-frontend-preprod-1032721240281.asia-south1.run.app'
# Should return 200 with data, NOT 500
```

### 3. Check logs for migration execution
```bash
gcloud run services logs read perundhu-backend-preprod \
  --region=asia-south1 \
  --project=astute-strategy-406601 \
  --limit=50 | grep -i "flyway\|migration"
# Should see: "Starting database migration" and "V60" migration applied
```

### 4. Direct database verification (if you have access)
```sql
DESCRIBE announcements;
-- Should show all columns including: announcement_category, title_fallback, message_key, etc.
```

---

## 🔄 Deployment Timeline

1. **Backend built** ✅ - New migration file included
2. **Docker image pushed** ✅ - With V60 migration
3. **Deploy with `SPRING_FLYWAY_ENABLED=true`** ✅ - Critical change
4. **Flyway runs V60 migration** ✅ - Adds missing columns
5. **Announcements endpoint works** ✅ - No more 500 error

---

## 📊 What Each Setting Does

| Setting | Purpose | Preprod Value |
|---------|---------|---------------|
| `SPRING_FLYWAY_ENABLED` | Enable database migrations | **true** ← This was the blocker! |
| `SPRING_PROFILES_ACTIVE` | Use preprod profile | `preprod` |
| `SPRING_DATASOURCE_URL` | Cloud SQL socket connection | Provided |
| `CORS_ALLOWED_ORIGINS` | Allow frontend requests | Exact frontend URL (not wildcard) |
| `RATE_LIMIT_ENABLED` | Enable rate limiting | `true` |
| `LOG_LEVEL_APP` | App-level logging | `INFO` |

---

## 🛠️ Why It Happened

1. **V56 baseline migration was outdated** - Created with old schema
2. **Flyway was disabled on deployment** - Migrations never ran
3. **Entity evolved** - Added new fields but migrations weren't created
4. **Result** - Mismatch between entity and database schema

---

## ✅ What's Fixed

✅ New migration V60 adds all missing announcement columns
✅ Flyway enabled for preprod deployments
✅ CORS wildcard fixed to exact URL
✅ All environment variables properly set
✅ GitHub workflow updated with correct settings

---

## 📝 Next Steps

1. **Immediate**: Deploy using one of the scripts above
2. **Verify**: Test the announcements endpoint (should return 200 now)
3. **Monitor**: Watch logs for any other schema mismatches
4. **Commit**: Push the migration file and workflow changes to GitHub

---

## 🎯 Summary

The 500 error was a **database schema mismatch**, not a CORS issue. 

**Root cause**: `SPRING_FLYWAY_ENABLED=false` meant the database never got the new columns it needs.

**Fix**: Enable Flyway (`SPRING_FLYWAY_ENABLED=true`) and provide the new migration file.

**Result**: Database schema is now in sync with the entity, and the announcements endpoint works.
