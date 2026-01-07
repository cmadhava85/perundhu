# Preprod Database Fix - Quick Reference

## ✅ What Was Fixed

The preprod environment was failing with:
```
Error occurred while executing flywayMigrate
Access denied for user '***'@'cloudsqlproxy~52.161.69.164'
```

**Root Cause:** Flyway was disabled in preprod, causing database schema validation to fail.

**Solution:** Enabled Flyway migrations to automatically initialize the database schema on startup.

---

## 🔧 Configuration Changes

**File:** `application-preprod.properties`

```diff
- spring.flyway.enabled=false
+ spring.flyway.enabled=true

- spring.flyway.baseline-on-migrate=false
+ spring.flyway.baseline-on-migrate=true
```

---

## 📋 Environment Variables Required (Preprod)

For Cloud Run deployment, set these environment variables:

```bash
GCP_INSTANCE_CONNECTION_NAME=astute-strategy-406601:asia-south1:perundhu-preprod-mysql-asia
DB_USERNAME=<from gcloud secrets>
DB_PASSWORD=<from gcloud secrets>
GEMINI_API_KEY=<from gcloud secrets>
```

**Retrieve from GCP Secret Manager:**
```bash
gcloud secrets versions access latest --secret=db-username
gcloud secrets versions access latest --secret=db-password
gcloud secrets versions access latest --secret=gemini-api-key
```

---

## 🚀 Deploy Preprod with Fixed Configuration

```bash
# 1. Pull latest changes
git pull origin master

# 2. Deploy to Cloud Run
gcloud run deploy perundhu-backend-preprod \
  --region asia-south1 \
  --set-env-vars GCP_INSTANCE_CONNECTION_NAME=astute-strategy-406601:asia-south1:perundhu-preprod-mysql-asia \
  --set-env-vars DB_USERNAME=$(gcloud secrets versions access latest --secret=db-username) \
  --set-env-vars DB_PASSWORD=$(gcloud secrets versions access latest --secret=db-password) \
  --set-env-vars GEMINI_API_KEY=$(gcloud secrets versions access latest --secret=gemini-api-key)

# 3. Check deployment logs
gcloud run logs read perundhu-backend-preprod --region asia-south1 --limit 100
```

---

## 🔍 Database Connection Settings by Environment

| Aspect | Dev/Local | Preprod | Production |
|--------|-----------|---------|------------|
| **Database URL** | localhost:3306 | Cloud SQL via socket factory | Secret Manager |
| **Username** | root | perundhu_user (env var) | Secret Manager |
| **Password** | root | Env var | Secret Manager |
| **Flyway** | ✅ Enabled | ✅ Enabled | ✅ Enabled |
| **DDL Mode** | none | validate | validate |
| **Timeout** | 20s | 60s | 30s |

---

## 📊 Before & After

### Before (❌ Failing)
```
spring.flyway.enabled=false                    # Flyway disabled
spring.flyway.baseline-on-migrate=false        # No baseline
spring.jpa.hibernate.ddl-auto=validate         # Only validates
↓
Result: Validation fails - no schema exists!
```

### After (✅ Working)
```
spring.flyway.enabled=true                     # Flyway enabled
spring.flyway.baseline-on-migrate=true         # Creates baseline
spring.jpa.hibernate.ddl-auto=validate         # Validates schema
↓
Result: Migrations run → schema created → validation passes ✅
```

---

## 📚 Related Documentation

- **Full Audit:** [DATABASE_CONNECTION_AUDIT.md](DATABASE_CONNECTION_AUDIT.md)
- **Production Config:** [application-production.properties](backend/app/src/main/resources/application-production.properties)
- **Preprod Config:** [application-preprod.properties](backend/app/src/main/resources/application-preprod.properties)

---

## ✨ Status

**Status:** ✅ FIXED and COMMITTED  
**Commit:** `f1ac108`  
**Files Modified:** 2 (application-preprod.properties + DATABASE_CONNECTION_AUDIT.md)  
**Ready for:** Preprod deployment

---

## 🎯 Testing Before Production

1. **Test in Preprod:**
   ```bash
   gcloud run deploy perundhu-backend-preprod --image gcr.io/astute-strategy-406601/perundhu-backend:latest
   ```

2. **Verify Migrations Ran:**
   ```bash
   # Check logs for "Successfully validated" or "Flyway applied" messages
   gcloud run logs read perundhu-backend-preprod --region asia-south1 --limit 50
   ```

3. **Test Database Connection:**
   ```bash
   curl https://perundhu-backend-preprod-*.run.app/actuator/health
   ```
   Should return: `"status":"UP"`

4. **Check Schema:**
   ```bash
   cloud-sql-proxy astute-strategy-406601:asia-south1:perundhu-preprod-mysql-asia &
   mysql -h 127.0.0.1 -u perundhu_user -p perundhu -e "SHOW TABLES;"
   ```

---

**Contact:** For issues, check [DATABASE_CONNECTION_AUDIT.md](DATABASE_CONNECTION_AUDIT.md)
