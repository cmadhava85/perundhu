# Preprod Environment Setup - Quick Reference Card

## 🚨 YOUR 500 ERROR ROOT CAUSE
**CORS mismatch** - Frontend origin not in allowed origins in Cloud Run

---

## ✅ THREE PLACES THAT MUST MATCH

### 1. Base Configuration
**File**: `backend/app/src/main/resources/application.properties`
```properties
cors.allowed-origins=${CORS_ALLOWED_ORIGINS:http://localhost:5173,http://localhost:4173}
security.allowed-origins=${CORS_ALLOWED_ORIGINS:http://localhost:5173,http://localhost:4173,https://perundhu.app,https://www.perundhu.app}
```
✅ **Fixed**: Removed hardcoded `spring.profiles.active=dev`

### 2. Preprod Profile
**File**: `backend/app/src/main/resources/application-preprod.properties`
```properties
cors.allowed-origins=${CORS_ALLOWED_ORIGINS:https://perundhu-frontend-preprod-1032721240281.asia-south1.run.app,https://perundhu-frontend-preprod-c6qn3mz4wa-el.a.run.app}
security.allowed-origins=${CORS_ALLOWED_ORIGINS:https://perundhu-frontend-preprod-1032721240281.asia-south1.run.app,https://perundhu-frontend-preprod-c6qn3mz4wa-el.a.run.app}
```
✅ **Status**: Properly configured, waits for env variable

### 3. Cloud Run Environment Variable (CRITICAL)
**Set via**: `.github/workflows/cd-preprod.yml` line 271 OR manual gcloud command
```bash
--set-env-vars="CORS_ALLOWED_ORIGINS=https://perundhu-frontend-preprod-1032721240281.asia-south1.run.app"
```
❌ **ISSUE FOUND**: Your workflow uses wildcard `https://perundhu-frontend-preprod-*.run.app` - needs exact URL

---

## 🔧 IMMEDIATE FIX (Choose One)

### Option A: Quick Manual Deploy (Test Now)
```bash
chmod +x deploy-preprod-backend-corrected.sh
./deploy-preprod-backend-corrected.sh
```

### Option B: Update GitHub Workflow
**File**: `.github/workflows/cd-preprod.yml` - Line 271

Find:
```yaml
--set-env-vars="SPRING_PROFILES_ACTIVE=preprod,...,CORS_ALLOWED_ORIGINS=https://perundhu-frontend-preprod-*.run.app"
```

Replace with all env vars from `deploy-preprod-backend-corrected.sh`

---

## 📊 CONFIGURATION MATRIX

| Setting | Dev | Preprod | Production |
|---------|-----|---------|------------|
| **Profile File** | `application-dev.properties` | `application-preprod.properties` | `application-production.properties` |
| **CORS Origins** | `localhost:5173` | `${CORS_ALLOWED_ORIGINS}` | `${CORS_ALLOWED_ORIGINS}` |
| **Security Filters** | ❌ Disabled | ✅ Enabled | ✅ Enabled |
| **Flyway Enabled** | ✅ true | ❌ false | ✅ true |
| **Logging Level** | DEBUG | INFO | WARN |
| **Rate Limiting** | ❌ Disabled | ✅ Enabled | ✅ Enabled |
| **reCAPTCHA** | ❌ Disabled | ❌ Disabled | ✅ Enabled |
| **Data Encryption** | ❌ false | ❌ false | ✅ true |

---

## ✔️ VERIFICATION AFTER DEPLOYMENT

### 1. Environment Variables Set
```bash
gcloud run services describe perundhu-backend-preprod \
  --region=asia-south1 \
  --project=astute-strategy-406601 \
  --format='value(spec.template.spec.containers[0].env[*].{name:name,value:value})' | grep CORS
```
Expected: `CORS_ALLOWED_ORIGINS | https://perundhu-frontend-preprod-1032721240281.asia-south1.run.app`

### 2. CORS Headers Present
```bash
curl -v 'https://perundhu-backend-preprod-1032721240281.asia-south1.run.app/api/v1/announcements' \
  -H 'Origin: https://perundhu-frontend-preprod-1032721240281.asia-south1.run.app' \
  -H 'Access-Control-Request-Method: GET' 2>&1 | grep -i access-control-allow-origin
```
Expected: `access-control-allow-origin: https://perundhu-frontend-preprod-1032721240281.asia-south1.run.app`

### 3. Health Check
```bash
curl https://perundhu-backend-preprod-1032721240281.asia-south1.run.app/actuator/health
```
Expected: `{"status":"UP",...}`

### 4. Actual API Call
```bash
curl 'https://perundhu-backend-preprod-1032721240281.asia-south1.run.app/api/v1/announcements' \
  -H 'Origin: https://perundhu-frontend-preprod-1032721240281.asia-south1.run.app'
```
Expected: Returns 200 with data (no 500 error)

---

## 🔍 DEBUG LOGS

```bash
# See last 100 lines
gcloud run logs read perundhu-backend-preprod \
  --region=asia-south1 \
  --project=astute-strategy-406601 \
  --limit=100

# Real-time streaming
gcloud run logs read perundhu-backend-preprod \
  --region=asia-south1 \
  --project=astute-strategy-406601 \
  --follow
```

---

## 🛠️ WHAT WAS FIXED

### In `application.properties`:
- ❌ Removed: `spring.profiles.active=dev` (was overriding preprod profile)
- ❌ Removed: All dev-only security disabling from base config
- ✅ Moved to: `application-dev.properties` where it belongs

### In `application-dev.properties`:
- ✅ Added: `spring.profiles.active=dev` (now properly scoped)
- ✅ Added: All dev-specific settings (security disabled for testing)

### In `deploy-preprod-backend-corrected.sh`:
- ✅ Created: Complete deployment script with all env vars
- ✅ Added: Exact CORS_ALLOWED_ORIGINS value (not wildcard)
- ✅ Added: All security and feature flags
- ✅ Added: Verification steps

---

## 🚀 NEXT STEPS

1. **Deploy immediately**: `./deploy-preprod-backend-corrected.sh`
2. **Verify CORS headers**: Use curl command above
3. **Test from frontend**: Verify network requests work
4. **Update GitHub Actions**: Commit changes to `cd-preprod.yml`
5. **Monitor logs**: Watch for any new errors

---

## 📝 NOTES

- Configuration follows Spring Boot **profile inheritance** pattern
- Environment variables override property file values (highest priority)
- Wildcard patterns (`*.run.app`) don't work with CORS filters - use exact URLs
- Both `cors.allowed-origins` and `security.allowed-origins` must be set to same value
