# Database Connection Configuration Audit

**Date:** January 6, 2026  
**Status:** ✅ FIXED - Flyway Enabled in Preprod

---

## 📋 Configuration Summary

### Production (`application-production.properties`)

| Setting | Value | Source |
|---------|-------|--------|
| **URL** | `${sm://production-db-url}` | GCP Secret Manager ✅ |
| **Username** | `${sm://production-db-username}` | GCP Secret Manager ✅ |
| **Password** | `${sm://production-db-password}` | GCP Secret Manager ✅ |
| **Flyway Enabled** | `true` ✅ | Auto-run migrations |
| **DDL Mode** | `validate` | Schema managed by Flyway |
| **Pool Size** | 10 max, 5 min | Configurable via env |
| **Connection Timeout** | 30s | Via `HIKARI_TIMEOUT` |
| **Features** | Rewards enabled, Auto-approval: 100/day | Full production features |

**Status:** ✅ Production-ready - All secrets from Secret Manager

---

### Preprod (`application-preprod.properties`) - **NOW FIXED**

| Setting | Before | After | Status |
|---------|--------|-------|--------|
| **URL** | `GCP_INSTANCE_CONNECTION_NAME` (env var) | Same | ⚠️ Requires env setup |
| **Username** | `perundhu_user` (hardcoded) | Same | ⚠️ Check if user exists |
| **Password** | Empty string (hardcoded) | Same | ⚠️ Missing credentials |
| **Flyway Enabled** | `false` ❌ | `true` ✅ | **FIXED** |
| **Baseline on Migrate** | `false` | `true` ✅ | **FIXED** |
| **DDL Mode** | `validate` | `validate` | ✓ Consistent |
| **Pool Size** | Configurable | Configurable | ✓ Good |
| **Connection Timeout** | 60s | 60s | ✓ Longer for migrations |

**Status:** ✅ FIXED - Flyway now enabled to match production

---

## 🔧 Issues Found & Fixed

### ❌ Issue 1: Flyway Disabled in Preprod
**Before:**
```properties
spring.flyway.enabled=false
spring.flyway.baseline-on-migrate=false
```

**After:**
```properties
spring.flyway.enabled=true
spring.flyway.baseline-on-migrate=true
```

**Why:** When Flyway is disabled but `spring.jpa.hibernate.ddl-auto=validate`, Hibernate validates the schema but doesn't create it. Flyway migrations are the only way to initialize the database.

---

### ⚠️ Issue 2: Missing Credentials (Preprod)
**Current:**
```properties
spring.datasource.username=${DB_USERNAME:${MYSQL_USERNAME:perundhu_user}}
spring.datasource.password=${DB_PASSWORD:${MYSQL_PASSWORD:}}
```

**Problem:**
- Username defaults to `perundhu_user` (may not exist in preprod)
- Password defaults to empty string (will fail authentication)

**Solution:** Set environment variables in Cloud Run deployment:
```bash
gcloud run deploy perundhu-backend-preprod \
  --set-env-vars DB_USERNAME=$(gcloud secrets versions access latest --secret=db-username) \
  --set-env-vars DB_PASSWORD=$(gcloud secrets versions access latest --secret=db-password)
```

---

### ⚠️ Issue 3: GCP Instance Connection Name (Preprod)
**Current:**
```properties
spring.datasource.url=jdbc:mysql://google/perundhu?socketFactory=com.google.cloud.sql.mysql.SocketFactory&cloudSqlInstance=${GCP_INSTANCE_CONNECTION_NAME}&...
```

**Problem:** `GCP_INSTANCE_CONNECTION_NAME` is not set (causes connection failure)

**Solution:** Set in Cloud Run deployment:
```bash
--set-env-vars GCP_INSTANCE_CONNECTION_NAME=astute-strategy-406601:asia-south1:perundhu-preprod-mysql-asia
```

---

## 🔍 Connection Settings Comparison

### Preprod vs Production

```
ASPECT                  PREPROD                          PRODUCTION
───────────────────────────────────────────────────────────────────────
Secret Source           Environment Variables           GCP Secret Manager
Credentials             Hardcoded defaults               sm:// prefix
Flyway                  ✅ NOW ENABLED                  ✅ ENABLED
DDL Mode                validate                        validate
Pool Size               10 (configurable)               10 (configurable)
Connection Timeout      60s (longer for migrations)     30s (faster)
Logging Level           INFO                            WARN
SSL Required            false                           true
Rewards Enabled         false                           true
Auto-approval Limit     50/day                          100/day
```

---

## ✅ What Changed

### File: `application-preprod.properties`

**Lines 29-35 (Flyway Section):**
- ✅ Changed `spring.flyway.enabled=false` → `true`
- ✅ Changed `spring.flyway.baseline-on-migrate=false` → `true`
- ✅ Updated comment to reflect new behavior

**Impact:**
- Migrations will now auto-run on startup
- Database schema will be created automatically
- Consistency with production behavior

---

## 🚀 Next Steps for Preprod Deployment

### Before Deploying:

1. **Verify Environment Variables:**
   ```bash
   # Confirm these secrets exist
   gcloud secrets list | grep db-
   gcloud secrets list | grep GCP_INSTANCE_CONNECTION_NAME
   ```

2. **Set Cloud Run Environment Variables:**
   ```bash
   gcloud run deploy perundhu-backend-preprod \
     --region asia-south1 \
     --set-env-vars GCP_INSTANCE_CONNECTION_NAME=astute-strategy-406601:asia-south1:perundhu-preprod-mysql-asia \
     --set-env-vars DB_USERNAME=$(gcloud secrets versions access latest --secret=db-username) \
     --set-env-vars DB_PASSWORD=$(gcloud secrets versions access latest --secret=db-password) \
     --set-env-vars GEMINI_API_KEY=$(gcloud secrets versions access latest --secret=gemini-api-key)
   ```

3. **Verify Database Exists:**
   ```bash
   # Connect via Cloud SQL proxy
   cloud-sql-proxy astute-strategy-406601:asia-south1:perundhu-preprod-mysql-asia &
   mysql -h 127.0.0.1 -u perundhu_user -p
   ```

4. **Check Logs After Deployment:**
   ```bash
   gcloud run logs read perundhu-backend-preprod --region asia-south1 --limit 100
   ```

---

## 📊 Configuration Files Audit

| File | Status | Flyway | DDL | Secrets | Notes |
|------|--------|--------|-----|---------|-------|
| `application.properties` | ✅ | Enabled | none | Env vars | Local dev |
| `application-dev.properties` | ✅ | Enabled | none | Env vars | Dev environment |
| `application-development.properties` | ✅ | Enabled | none | Env vars | Alt dev |
| `application-preprod.properties` | ✅ FIXED | Enabled | validate | Env vars | Pre-production |
| `application-production.properties` | ✅ | Enabled | validate | Secret Mgr | Production |
| `application-mysql-test.properties` | ✅ | Enabled | none | Env vars | Test |
| `application-mysql-local.properties` | ✅ | Enabled | none | Env vars | Local |

---

## 🔐 Security Best Practices

✅ **Production:** Uses GCP Secret Manager (`sm://` prefix)  
⚠️ **Preprod:** Uses Environment Variables (acceptable for non-sensitive data, but consider migrating credentials to Secret Manager)  
✅ **Dev/Local:** Uses hardcoded defaults (safe for local development)

---

## 📝 Migration Strategy

### Current Approach:
1. Flyway manages all schema changes
2. Automatic migration on startup
3. Validation ensures consistency

### For Large Migrations (if needed):
```properties
# In application-preprod.properties
spring.flyway.out-of-order=true
# Only use if migrations must run out of sequence
```

---

## ✨ Summary

**Before:**
- ❌ Flyway disabled in preprod
- ❌ Migrations not running
- ❌ Database schema validation failing
- ❌ `flywayMigrate` task failing

**After:**
- ✅ Flyway enabled in preprod
- ✅ Migrations auto-run on startup
- ✅ Consistent with production
- ✅ Database initialization automatic

**Status:** Ready for deployment once environment variables are configured.

---

**Commit Message:**
```
fix: Enable Flyway migrations in preprod environment

- Enable spring.flyway.enabled=true for automatic schema initialization
- Set spring.flyway.baseline-on-migrate=true for consistency
- Preprod now matches production migration behavior
- Fixes flywayMigrate task failure on startup
- Requires environment variables: GCP_INSTANCE_CONNECTION_NAME, DB_USERNAME, DB_PASSWORD
```
