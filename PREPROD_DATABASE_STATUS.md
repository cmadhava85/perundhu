# Preprod Database Status Report

**Date:** January 6, 2026  
**Status:** ✅ Database Created and Ready for Migrations

---

## 📊 Preprod Database Status

### Cloud SQL Instance

| Property | Value |
|----------|-------|
| **Instance Name** | `perundhu-preprod-mysql-asia` |
| **Project** | `astute-strategy-406601` |
| **Database Version** | MySQL 8.0 |
| **Location** | asia-south1-b |
| **Tier** | db-f1-micro |
| **Primary IP** | 35.244.40.110 |
| **Status** | ✅ RUNNABLE |

---

### Database Created ✅

| Property | Value |
|----------|-------|
| **Database Name** | `perundhu` |
| **Charset** | utf8mb4 |
| **Collation** | utf8mb4_0900_ai_ci |
| **Status** | ✅ Created |

---

## 🔄 What Happens Next

With Flyway now enabled in `application-preprod.properties`, the next deployment will:

1. **Connect to Cloud SQL instance** via socket factory
2. **Access the `perundhu` database** ✅ (now exists)
3. **Run Flyway migrations** automatically:
   - V1-V56: Create all tables and schema
   - V57+ (if any): Create additional changes
4. **Validate schema** with Hibernate

---

## 📋 Verification Checklist

- ✅ Cloud SQL Instance exists: `perundhu-preprod-mysql-asia`
- ✅ Database created: `perundhu`
- ✅ Flyway enabled in configuration
- ✅ Baseline migration enabled
- ⏳ **Pending:** Deploy backend to run migrations

---

## 🚀 Deploy Preprod Backend

```bash
# 1. Ensure you're in the correct project
gcloud config set project astute-strategy-406601

# 2. Build the image (if not built)
gcloud builds submit --config=cloudbuild.yaml

# 3. Deploy to Cloud Run with environment variables
gcloud run deploy perundhu-backend-preprod \
  --region asia-south1 \
  --image gcr.io/astute-strategy-406601/perundhu-backend:latest \
  --set-env-vars GCP_INSTANCE_CONNECTION_NAME=astute-strategy-406601:asia-south1:perundhu-preprod-mysql-asia \
  --set-env-vars DB_USERNAME=$(gcloud secrets versions access latest --secret=db-username --project=astute-strategy-406601) \
  --set-env-vars DB_PASSWORD=$(gcloud secrets versions access latest --secret=db-password --project=astute-strategy-406601) \
  --set-env-vars GEMINI_API_KEY=$(gcloud secrets versions access latest --secret=gemini-api-key --project=astute-strategy-406601)

# 4. Check logs
gcloud run logs read perundhu-backend-preprod --region asia-south1 --limit 100
```

---

## ✨ Expected Behavior After Deployment

When the backend starts:

1. **Flyway initializes**
   ```
   Creating schema history table [public.flyway_schema_history]
   ```

2. **Migrations run**
   ```
   Successfully validated 56 migrations
   [Migration SQL] Starting migration of schema `public` by user `perundhu_user`
   [V1__baseline.sql] Running SQL...
   [V2__add_locations.sql] Running SQL...
   ...
   [V56__baseline_complete_schema.sql] Running SQL...
   ```

3. **Hibernate validates**
   ```
   Hibernate: validate - checking presence of table [locations]
   Hibernate: validate - checking presence of table [buses]
   ...
   ✅ All tables validated
   ```

4. **Application starts**
   ```
   Tomcat initialized with port(s): 8080 (http)
   Started PerundhuApplication in X seconds
   ```

---

## 🔗 Related Configurations

- **Backend Config:** `backend/app/src/main/resources/application-preprod.properties`
- **Flyway Migrations:** `backend/app/src/main/resources/db/migration/`
- **Database Scripts:** `scripts/` (if any setup scripts exist)

---

## 📞 Troubleshooting

### If migrations fail:

1. **Check logs:**
   ```bash
   gcloud run logs read perundhu-backend-preprod --region asia-south1 --limit 100 | grep -i error
   ```

2. **Verify database exists:**
   ```bash
   gcloud sql databases list --instance=perundhu-preprod-mysql-asia --project=astute-strategy-406601
   ```

3. **Check Flyway history:**
   ```bash
   # Via Cloud SQL proxy
   cloud-sql-proxy astute-strategy-406601:asia-south1:perundhu-preprod-mysql-asia &
   mysql -h 127.0.0.1 -u perundhu_user -p perundhu -e "SELECT * FROM flyway_schema_history;"
   ```

---

## ✅ Status Summary

| Item | Status |
|------|--------|
| Cloud SQL Instance | ✅ Running |
| Database `perundhu` | ✅ Created |
| Flyway Configuration | ✅ Enabled |
| Credentials | ⏳ Need to set in Cloud Run |
| Backend Deployment | ⏳ Ready to deploy |
| Schema/Tables | ⏳ Will be created on deployment |

**Next Step:** Deploy backend to preprod with the fixed configuration.

---

**Created:** January 6, 2026  
**Related Commits:**
- `f1ac108` - Enable Flyway migrations in preprod
- `0da08d1` - Add quick reference guide for preprod database fix
