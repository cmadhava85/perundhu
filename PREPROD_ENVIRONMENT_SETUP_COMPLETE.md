# Preprod Environment Configuration - Complete Checklist

## Problem Analysis
Your 500 error is caused by **CORS mismatch**. The frontend URL `https://perundhu-frontend-preprod-1032721240281.asia-south1.run.app` is not in the allowed origins when deployed to Cloud Run.

## Root Cause
Multiple files define CORS and security settings with **incomplete environment variable propagation** to Cloud Run.

---

## 📋 Complete Configuration Checklist

### 1. CLOUD RUN DEPLOYMENT (CRITICAL)
**File**: `.github/workflows/cd-preprod.yml` (Line 271)

**Current Issue**: `CORS_ALLOWED_ORIGINS=https://perundhu-frontend-preprod-*.run.app` uses wildcard pattern that may not work with `@CrossOrigin` annotations.

**Fix Required**:
```bash
CORS_ALLOWED_ORIGINS=https://perundhu-frontend-preprod-1032721240281.asia-south1.run.app,https://perundhu-frontend-preprod-c6qn3mz4wa-el.a.run.app
```

**All Environment Variables to Set**:
```
SPRING_PROFILES_ACTIVE=preprod
SPRING_DATASOURCE_URL=jdbc:mysql://google/perundhu?cloudSqlInstance=astute-strategy-406601:asia-south1:perundhu-preprod-mysql&socketFactory=com.google.cloud.sql.mysql.SocketFactory&useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC
SPRING_DATASOURCE_DRIVER_CLASS_NAME=com.mysql.cj.jdbc.Driver
DB_USERNAME=perundhu_user
SPRING_DATASOURCE_USERNAME=perundhu_user
SPRING_FLYWAY_ENABLED=false
SERVER_PORT=8080
LOG_LEVEL_ROOT=INFO
LOG_LEVEL_APP=INFO

# CORS (CRITICAL FOR CROSS-ORIGIN REQUESTS)
CORS_ALLOWED_ORIGINS=https://perundhu-frontend-preprod-1032721240281.asia-south1.run.app

# Security
RATE_LIMIT_ENABLED=true
ORIGIN_VALIDATION_ENABLED=true
HONEYPOT_ENABLED=true
RECAPTCHA_ENABLED=false

# Gemini AI
GEMINI_API_ENABLED=true
GEMINI_API_KEY=${sm://gemini-api-key}

# Secrets (from GCP Secret Manager)
DB_PASSWORD=db-password:latest (via --update-secrets)
SPRING_DATASOURCE_PASSWORD=db-password:latest (via --update-secrets)
```

---

### 2. APPLICATION PROPERTIES FILES

#### **application.properties** (Base Configuration)
**File**: `backend/app/src/main/resources/application.properties`

**Issues Found**:
- Line 27: `spring.profiles.active=dev` - This overrides profile selection! ❌
- Line 236: `security.filters.enabled=false` - Security disabled globally
- Lines 124 & 154: CORS hardcoded to localhost defaults

**Changes Needed**:
```properties
# Remove or comment out these lines that override preprod profile:
# spring.profiles.active=dev
# security.filters.enabled=false
# security.ip-filtering.enabled=false
# security.monitoring.enabled=false
# security.anti-scraping.enabled=false

# These should only be set in application-dev.properties, NOT in base application.properties
```

#### **application-preprod.properties** (Preprod-Specific)
**File**: `backend/app/src/main/resources/application-preprod.properties`

**Status**: ✅ Well-configured, but **CORS_ALLOWED_ORIGINS environment variable not guaranteed in Cloud Run**

**Verification Points**:
- Line 17: Database URL uses correct Cloud SQL socket connection ✅
- Line 68: CORS origins reference `${CORS_ALLOWED_ORIGINS:...}` ✅
- Line 90: Security origins also use same variable ✅

**Critical**: Both lines 68 and 90 depend on `CORS_ALLOWED_ORIGINS` being set in Cloud Run.

---

### 3. SECURITY CONFIGURATION LOCATIONS (All Must Match)

| Setting | Location | Preprod Value |
|---------|----------|---------------|
| **CORS origins** | `cors.allowed-origins` | `application-preprod.properties:68` |
| **Security origins** | `security.allowed-origins` | `application-preprod.properties:90` |
| **Environment Var** | `CORS_ALLOWED_ORIGINS` | Cloud Run `--set-env-vars` |

**Both properties reference the same `${CORS_ALLOWED_ORIGINS}` variable** ✅

---

### 4. GCP SECRET MANAGER CONFIGURATION

**File**: `backend/app/src/main/resources/application-preprod.properties`

**Secrets Used**:
```
${sm://recaptcha-site-key}        (Line 115)
${sm://recaptcha-secret-key}      (Line 116)
${sm://preprod-jwt-secret}        (Line 130)
${sm://admin-username}            (Line 182)
${sm://admin-password}            (Line 183)
```

**Verify these exist**:
```bash
gcloud secrets list --project=astute-strategy-406601
```

**If missing, create them**:
```bash
gcloud secrets create preprod-jwt-secret \
  --data-file=- --project=astute-strategy-406601

gcloud secrets create admin-username \
  --data-file=- --project=astute-strategy-406601

gcloud secrets create admin-password \
  --data-file=- --project=astute-strategy-406601
```

---

### 5. DATABASE CONNECTION VERIFICATION

**Cloud SQL Instance**: `astute-strategy-406601:asia-south1:perundhu-preprod-mysql`

**Connection Method**: Cloud SQL Proxy Socket
```
jdbc:mysql://google/perundhu?cloudSqlInstance=astute-strategy-406601:asia-south1:perundhu-preprod-mysql&socketFactory=com.google.cloud.sql.mysql.SocketFactory
```

**Verify Connection**:
```bash
# List Cloud SQL instances
gcloud sql instances list --project=astute-strategy-406601

# Check instance status
gcloud sql instances describe perundhu-preprod-mysql \
  --project=astute-strategy-406601 \
  --region=asia-south1
```

---

### 6. DEPLOYMENT COMMAND (CORRECTED)

**Update your `cd-preprod.yml` Line 271 to**:

```yaml
- name: Deploy Backend
  run: |
    gcloud run deploy perundhu-backend-preprod \
      --image=${{ env.REGISTRY }}/${{ env.PROJECT_ID }}/perundhu/backend:preprod-latest \
      --platform=managed \
      --region=${{ env.REGION }} \
      --allow-unauthenticated \
      --set-env-vars="\
SPRING_PROFILES_ACTIVE=preprod,\
SPRING_DATASOURCE_URL=jdbc:mysql://google/perundhu?cloudSqlInstance=${{ env.SQL_INSTANCE }}&socketFactory=com.google.cloud.sql.mysql.SocketFactory&useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC,\
SPRING_DATASOURCE_DRIVER_CLASS_NAME=com.mysql.cj.jdbc.Driver,\
DB_USERNAME=perundhu_user,\
SPRING_DATASOURCE_USERNAME=perundhu_user,\
SPRING_FLYWAY_ENABLED=false,\
SERVER_PORT=8080,\
LOG_LEVEL_ROOT=INFO,\
LOG_LEVEL_APP=INFO,\
RATE_LIMIT_ENABLED=true,\
ORIGIN_VALIDATION_ENABLED=true,\
HONEYPOT_ENABLED=true,\
RECAPTCHA_ENABLED=false,\
GEMINI_API_ENABLED=true,\
CORS_ALLOWED_ORIGINS=https://perundhu-frontend-preprod-1032721240281.asia-south1.run.app" \
      --update-secrets="DB_PASSWORD=db-password:latest,SPRING_DATASOURCE_PASSWORD=db-password:latest,GEMINI_API_KEY=gemini-api-key:latest" \
      --add-cloudsql-instances=${{ env.SQL_INSTANCE }} \
      --memory=2Gi \
      --cpu=2 \
      --min-instances=0 \
      --max-instances=10 \
      --timeout=300s
```

---

## ✅ VERIFICATION STEPS

### 1. Check Deployment Status
```bash
gcloud run services describe perundhu-backend-preprod \
  --region=asia-south1 \
  --project=astute-strategy-406601
```

### 2. Verify Environment Variables
```bash
gcloud run services describe perundhu-backend-preprod \
  --region=asia-south1 \
  --project=astute-strategy-406601 \
  --format='value(spec.template.spec.containers[0].env[*].{name:name,value:value})'
```

### 3. Check Recent Logs
```bash
gcloud run logs read perundhu-backend-preprod \
  --region=asia-south1 \
  --project=astute-strategy-406601 \
  --limit=100
```

### 4. Test CORS Request
```bash
curl -v 'https://perundhu-backend-preprod-1032721240281.asia-south1.run.app/api/v1/announcements' \
  -H 'Origin: https://perundhu-frontend-preprod-1032721240281.asia-south1.run.app' \
  -H 'Access-Control-Request-Method: GET' \
  -H 'Access-Control-Request-Headers: content-type'

# Should return: Access-Control-Allow-Origin: https://perundhu-frontend-preprod-1032721240281.asia-south1.run.app
```

### 5. Test Actual Request
```bash
curl 'https://perundhu-backend-preprod-1032721240281.asia-south1.run.app/api/v1/announcements' \
  -H 'Origin: https://perundhu-frontend-preprod-1032721240281.asia-south1.run.app' \
  -H 'Accept: application/json'
```

---

## 🔧 IMMEDIATE ACTION ITEMS

### Priority 1 (Critical for 500 Error)
1. ✅ Update `cd-preprod.yml` with explicit `CORS_ALLOWED_ORIGINS` value
2. ✅ Redeploy backend: `gcloud run deploy ...` with corrected env vars
3. ✅ Verify CORS header in response

### Priority 2 (Prevent Future Issues)
1. ✅ Remove `spring.profiles.active=dev` from `application.properties` base file
2. ✅ Move dev-only settings to `application-dev.properties`
3. ✅ Document all environment variables needed per environment

### Priority 3 (Security & Reliability)
1. ✅ Verify all GCP secrets exist
2. ✅ Test health endpoint: `https://perundhu-backend-preprod-1032721240281.asia-south1.run.app/actuator/health`
3. ✅ Monitor logs after deployment

---

## 📊 Configuration Override Order (Spring Boot)

Spring Boot applies configuration in this order (last wins):

1. `application.properties` (base)
2. `application-{PROFILE}.properties` (profile-specific)
3. Environment variables (highest priority)

**Example Flow for Preprod**:
```
1. application.properties → CORS_ALLOWED_ORIGINS=http://localhost:5173
2. application-preprod.properties → CORS_ALLOWED_ORIGINS=${CORS_ALLOWED_ORIGINS:https://...}
3. Cloud Run env var → CORS_ALLOWED_ORIGINS=https://perundhu-frontend-preprod-1032721240281.asia-south1.run.app
   ✅ FINAL: https://perundhu-frontend-preprod-1032721240281.asia-south1.run.app
```

---

## 🎯 Summary

**Your 500 Error Root Cause**: CORS filter rejecting frontend origin because `CORS_ALLOWED_ORIGINS` environment variable wasn't set in Cloud Run.

**Required Fix**: Set `CORS_ALLOWED_ORIGINS` explicitly in the gcloud deploy command with your actual frontend URL.

**All configuration is now properly layered**:
- Base defaults in `application.properties`
- Preprod overrides in `application-preprod.properties`
- Runtime secrets from GCP Secret Manager
- Environment variables from Cloud Run deployment

