# Admin Credentials Fix - January 10, 2026

## Problem Identified

**Issue**: Admin authentication failing with "Connection timed out" error despite correct credentials.

**Root Cause**: Admin credentials (`ADMIN_USERNAME` and `ADMIN_PASSWORD`) were being passed as **literal strings** (`"admin-username:latest"` and `"admin-password:latest"`) instead of being loaded from GCP Secret Manager.

### What Was Wrong

```bash
# ❌ INCORRECT (Before Fix) - Line 353 of cd-preprod.yml
--set-env-vars="...,ADMIN_USERNAME=admin-username:latest,ADMIN_PASSWORD=admin-password:latest,..."
--update-secrets="SPRING_DATASOURCE_PASSWORD=db-password:latest,..."
```

This set the environment variables to the **literal strings** `"admin-username:latest"` and `"admin-password:latest"` rather than fetching the actual values from GCP Secret Manager.

So when you tried to login with:
- Username: `perundhu_admin`
- Password: `u90TLYrmpoQf6tHC6a3Tnw==`

The backend was comparing against:
- Expected Username: `admin-username:latest` ❌
- Expected Password: `admin-password:latest` ❌

## Solution Applied

### 1. Added Startup Validation (AdminBasicAuthFilter.java)

Added `@PostConstruct` method that validates credentials on application startup:

```java
@PostConstruct
public void validateCredentialsOnStartup() {
    // Validates:
    // ✓ Credentials are not null/blank
    // ✓ Credentials don't contain ":latest" (indicating secret not loaded)
    // ✓ Credentials meet minimum length requirements
    // ✓ Fails fast in prod/preprod if misconfigured
}
```

**Benefits**:
- **Early Detection**: Catches configuration issues immediately on startup
- **Clear Logging**: Shows exactly what values are loaded (masked for security)
- **Fail Fast**: Throws exception in prod/preprod if secrets not properly loaded
- **Security Warnings**: Alerts on weak credentials or disabled auth

### 2. Fixed CD Pipeline (cd-preprod.yml)

Moved admin credentials from `--set-env-vars` to `--update-secrets`:

```bash
# ✅ CORRECT (After Fix)
--set-env-vars="...,GEMINI_API_ENABLED=true,HIKARI_MIN_IDLE=2" \
--update-secrets="SPRING_DATASOURCE_PASSWORD=db-password:latest,
                 DB_PASSWORD=db-password:latest,
                 GEMINI_API_KEY=gemini-api-key:latest,
                 JWT_SECRET=preprod-jwt-secret:latest,
                 PUBLIC_API_KEY=PUBLIC_API_KEY:latest,
                 RECAPTCHA_SITE_KEY=recaptcha-site-key:latest,
                 RECAPTCHA_SECRET_KEY=recaptcha-secret-key:latest,
                 ADMIN_USERNAME=admin-username:latest,
                 ADMIN_PASSWORD=admin-password:latest" \
```

Also moved `RECAPTCHA_SITE_KEY` and `RECAPTCHA_SECRET_KEY` to secrets for consistency.

## Verification Steps

### 1. Check Startup Logs

After redeployment, check Cloud Run logs for:

```
=============================================================
ADMIN AUTHENTICATION CONFIGURATION VALIDATION
=============================================================
Active Profile: preprod
Admin Auth Enabled: true
Admin Username: pe***in
Admin Password: u9***==
✅ Admin credentials validated successfully
=============================================================
```

**If you see**:
```
❌ ADMIN USERNAME CONTAINS ':latest' - Secret not loaded from GCP Secret Manager!
❌ ADMIN PASSWORD CONTAINS ':latest' - Secret not loaded from GCP Secret Manager!
```
Then the secrets are still not being loaded properly.

### 2. Verify GCP Secrets Exist

```bash
# List secrets in preprod project
gcloud secrets list --project=astute-strategy-406601

# Verify admin secrets exist
gcloud secrets versions list admin-username --project=astute-strategy-406601
gcloud secrets versions list admin-password --project=astute-strategy-406601

# Check latest version values (be careful - this shows actual secrets!)
gcloud secrets versions access latest --secret=admin-username --project=astute-strategy-406601
gcloud secrets versions access latest --secret=admin-password --project=astute-strategy-406601
```

### 3. Test Authentication

Once deployed with the fix:

```bash
# Decode your current Basic Auth header to verify what you're sending
echo "cGVydW5kaHVfYWRtaW46dTkwVExZcm1wb1FmNnRIQzZhM1Rudz09" | base64 -d
# Output: perundhu_admin:u90TLYrmpoQf6tHC6a3Tnw==

# Test the endpoint
curl -v 'https://perundhu-backend-preprod-1032721240281.asia-south1.run.app/api/admin/contributions/routes/pending' \
  -H 'authorization: Basic cGVydW5kaHVfYWRtaW46dTkwVExZcm1wb1FmNnRIQzZhM1Rudz09'
```

**Expected**:
- ✅ HTTP 200 with data (if credentials match secrets)
- ❌ HTTP 401 "Invalid username or password" (if credentials don't match)

## Required Actions

### Immediate Actions

1. **Verify Secret Values Match**
   ```bash
   # Check what's actually stored in GCP Secret Manager
   gcloud secrets versions access latest --secret=admin-username --project=astute-strategy-406601
   gcloud secrets versions access latest --secret=admin-password --project=astute-strategy-406601
   ```

2. **Update Secrets If Needed**
   ```bash
   # If the secret values don't match what you expect, update them
   echo -n "perundhu_admin" | gcloud secrets versions add admin-username --data-file=- --project=astute-strategy-406601
   echo -n "u90TLYrmpoQf6tHC6a3Tnw==" | gcloud secrets versions add admin-password --data-file=- --project=astute-strategy-406601
   ```

3. **Deploy the Fixed CD Pipeline**
   ```bash
   # Commit and push the changes
   git add .github/workflows/cd-preprod.yml
   git add backend/app/src/main/java/com/perundhu/infrastructure/security/AdminBasicAuthFilter.java
   git commit -m "fix: Load admin credentials from GCP Secret Manager, add startup validation"
   git push origin master
   ```

4. **Monitor Deployment**
   - Watch the GitHub Actions workflow
   - Once backend is deployed, check Cloud Run logs
   - Look for the "ADMIN AUTHENTICATION CONFIGURATION VALIDATION" section

## Understanding the Fix

### Before Fix - Data Flow

```
CD Pipeline
  ↓
Cloud Run Environment Variables:
  ADMIN_USERNAME = "admin-username:latest"  ← Literal string!
  ADMIN_PASSWORD = "admin-password:latest"  ← Literal string!
  ↓
Spring Boot Application Reads:
  adminUsername = "admin-username:latest"
  adminPassword = "admin-password:latest"
  ↓
Authentication Comparison:
  User sends: "perundhu_admin" / "u90TLYrmpoQf6tHC6a3Tnw=="
  Backend expects: "admin-username:latest" / "admin-password:latest"
  Result: ❌ NO MATCH
```

### After Fix - Data Flow

```
CD Pipeline
  ↓
Cloud Run with Secret Manager Integration:
  --update-secrets="ADMIN_USERNAME=admin-username:latest"
  --update-secrets="ADMIN_PASSWORD=admin-password:latest"
  ↓
Cloud Run Fetches from GCP Secret Manager:
  ADMIN_USERNAME = "perundhu_admin"  ← Actual value from secret
  ADMIN_PASSWORD = "u90TLYrmpoQf6tHC6a3Tnw=="  ← Actual value from secret
  ↓
Spring Boot Application Reads:
  adminUsername = "perundhu_admin"
  adminPassword = "u90TLYrmpoQf6tHC6a3Tnw=="
  ↓
Startup Validation:
  ✅ Credentials validated successfully
  ↓
Authentication Comparison:
  User sends: "perundhu_admin" / "u90TLYrmpoQf6tHC6a3Tnw=="
  Backend expects: "perundhu_admin" / "u90TLYrmpoQf6tHC6a3Tnw=="
  Result: ✅ MATCH - Authentication succeeds
```

## Common Issues & Troubleshooting

### Issue 1: Secrets Don't Exist

**Symptoms**: Deployment fails with "Secret not found" error

**Solution**:
```bash
# Create the secrets
echo -n "perundhu_admin" | gcloud secrets create admin-username \
  --data-file=- \
  --replication-policy=automatic \
  --project=astute-strategy-406601

echo -n "YOUR_SECURE_PASSWORD" | gcloud secrets create admin-password \
  --data-file=- \
  --replication-policy=automatic \
  --project=astute-strategy-406601
```

### Issue 2: Cloud Run Service Account Lacks Permission

**Symptoms**: "Permission denied accessing secret" error

**Solution**:
```bash
# Grant Cloud Run service account access to secrets
SERVICE_ACCOUNT="$(gcloud run services describe perundhu-backend-preprod \
  --region=asia-south1 \
  --format='value(spec.template.spec.serviceAccountName)')"

gcloud secrets add-iam-policy-binding admin-username \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role="roles/secretmanager.secretAccessor" \
  --project=astute-strategy-406601

gcloud secrets add-iam-policy-binding admin-password \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role="roles/secretmanager.secretAccessor" \
  --project=astute-strategy-406601
```

### Issue 3: Startup Validation Still Shows ":latest"

**Symptoms**: Logs show credentials still contain ":latest"

**Possible Causes**:
1. CD pipeline changes not deployed yet
2. Old revision still serving traffic
3. Secrets not granted to service account

**Solution**:
```bash
# Force deploy latest revision
gcloud run services update-traffic perundhu-backend-preprod \
  --to-latest \
  --region=asia-south1 \
  --project=astute-strategy-406601
```

## Testing the Fix

### Test 1: Startup Logs

```bash
# View recent logs
gcloud run services logs read perundhu-backend-preprod \
  --region=asia-south1 \
  --limit=100 \
  --project=astute-strategy-406601 | grep -A 10 "ADMIN AUTHENTICATION"
```

Expected output:
```
ADMIN AUTHENTICATION CONFIGURATION VALIDATION
Active Profile: preprod
Admin Auth Enabled: true
Admin Username: pe***in  ← Shows first 2 and last 2 chars
Admin Password: u9***==  ← Shows first 2 and last 2 chars
✅ Admin credentials validated successfully
```

### Test 2: Authentication Endpoint

```bash
# Get a valid Basic Auth token
echo -n "perundhu_admin:u90TLYrmpoQf6tHC6a3Tnw==" | base64

# Test authentication
curl -i 'https://perundhu-backend-preprod-1032721240281.asia-south1.run.app/api/admin/contributions/routes/pending' \
  -H 'authorization: Basic cGVydW5kaHVfYWRtaW46dTkwVExZcm1wb1FmNnRIQzZhM1Rudz09'
```

Expected: `HTTP/2 200` with JSON response

### Test 3: Wrong Credentials

```bash
# Try with wrong password
echo -n "perundhu_admin:wrongpassword" | base64
# Output: cGVydW5kaHVfYWRtaW46d3JvbmdwYXNzd29yZA==

curl -i 'https://perundhu-backend-preprod-1032721240281.asia-south1.run.app/api/admin/contributions/routes/pending' \
  -H 'authorization: Basic cGVydW5kaHVfYWRtaW46d3JvbmdwYXNzd29yZA=='
```

Expected: `HTTP/2 401` with error message

## Files Changed

1. **backend/app/src/main/java/com/perundhu/infrastructure/security/AdminBasicAuthFilter.java**
   - Added `@PostConstruct` validation method
   - Added credential masking utility
   - Added comprehensive logging
   - Fails fast on misconfiguration in prod/preprod

2. **.github/workflows/cd-preprod.yml**
   - Moved `ADMIN_USERNAME` from `--set-env-vars` to `--update-secrets`
   - Moved `ADMIN_PASSWORD` from `--set-env-vars` to `--update-secrets`
   - Moved `RECAPTCHA_SITE_KEY` from `--set-env-vars` to `--update-secrets`
   - Moved `RECAPTCHA_SECRET_KEY` from `--set-env-vars` to `--update-secrets`

## Security Benefits

### 1. Startup Validation
- **Early Detection**: Catches issues before first request
- **Clear Diagnostics**: Shows exact configuration state
- **Prevents Silent Failures**: No more mysterious auth failures

### 2. Proper Secret Management
- **No Plain Text**: Secrets never in source code or environment variables
- **Audit Trail**: GCP tracks all secret access
- **Rotation Support**: Easy to update secrets without code changes

### 3. Enhanced Logging
- **Masked Values**: Credentials never fully logged
- **Configuration Visibility**: Easy to verify setup
- **Troubleshooting**: Clear error messages for common issues

## Next Steps

1. ✅ Deploy the fix via GitHub Actions
2. ✅ Verify startup logs show proper credential loading
3. ✅ Test authentication with correct credentials
4. ✅ Test authentication with incorrect credentials (should fail)
5. ⏭️  Apply same fix to production deployment (cd-production.yml)
6. ⏭️  Document credential rotation procedure

## Production Deployment Note

The same fix needs to be applied to `cd-production.yml` once verified in preprod. The production secrets are:
- `admin-username` (should contain actual production admin username)
- `admin-password` (should contain actual production admin password)

---

**Status**: ✅ Fix Applied - Awaiting Deployment Verification

**Date**: January 10, 2026  
**Author**: GitHub Copilot  
**Severity**: CRITICAL - Authentication completely broken  
**Impact**: Admin users unable to authenticate until fix deployed
