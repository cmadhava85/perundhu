# Admin Credential Validation Guide for Preprod

## Current Status ✅
The admin credentials ARE being read from GCP Secret Manager correctly:

```
Admin Username: perundhu_admin
Admin Password: u90TLYrmpoQf6tHC6a3Tnw==
```

## How Login Works in Preprod

### 1. **Configuration Flow**
```
GCP Secret Manager
    ↓
Cloud Run Environment Variables (ADMIN_USERNAME, ADMIN_PASSWORD)
    ↓
Spring Boot application-preprod.properties
    ↓
AdminBasicAuthFilter.java (validates credentials)
```

### 2. **Application Configuration**
File: `backend/app/src/main/resources/application-preprod.properties`

```properties
admin.auth.username=${ADMIN_USERNAME:admin}          # Reads from env var
admin.auth.password=${ADMIN_PASSWORD:password}       # Reads from env var
admin.auth.enabled=true                              # Authentication enabled
```

### 3. **CD Pipeline Configuration**
File: `.github/workflows/cd-preprod.yml` (line 359)

```yaml
--update-secrets="ADMIN_USERNAME=admin-username:latest,ADMIN_PASSWORD=admin-password:latest"
```

This means:
- `ADMIN_USERNAME` env var ← Gets value from `admin-username` secret in GCP
- `ADMIN_PASSWORD` env var ← Gets value from `admin-password` secret in GCP

## How to Validate the Credentials Are Correct

### Method 1: Check GCP Secret Values ✅ (Already Verified)
```bash
# Check username secret
gcloud secrets versions access latest --secret=admin-username --project=astute-strategy-406601
# Output: perundhu_admin

# Check password secret  
gcloud secrets versions access latest --secret=admin-password --project=astute-strategy-406601
# Output: u90TLYrmpoQf6tHC6a3Tnw==
```

### Method 2: Check Cloud Run Environment Variables
```bash
# Get the current Cloud Run service environment
gcloud run services describe perundhu-backend-preprod \
  --platform=managed \
  --region=asia-south1 \
  --project=astute-strategy-406601 \
  --format='value(spec.template.spec.containers[0].env)'
```

**Look for:**
- `ADMIN_USERNAME=perundhu_admin`
- `ADMIN_PASSWORD=u90TLYrmpoQf6tHC6a3Tnw==`

### Method 3: Test Login Endpoint Directly
```bash
# Using the credentials from secret manager
USERNAME="perundhu_admin"
PASSWORD="u90TLYrmpoQf6tHC6a3Tnw=="

# Try Basic Auth
curl -X GET https://perundhu-backend-preprod-1032721240281.asia-south1.run.app/api/admin/dashboard \
  -H "Authorization: Basic $(echo -n "$USERNAME:$PASSWORD" | base64)" \
  -v

# If successful: ✅ 200 OK
# If failed: ❌ 401 Unauthorized
```

### Method 4: Check Application Logs
```bash
# View Cloud Run logs
gcloud run services logs read perundhu-backend-preprod \
  --platform=managed \
  --region=asia-south1 \
  --limit=50

# Look for these log messages:
# ✅ "Admin authentication successful via Basic auth"
# ❌ "Admin password not configured"
# ❌ "Invalid credentials"
```

## Troubleshooting Guide

### Issue: "Admin password not configured!"
This means `ADMIN_PASSWORD` environment variable is NOT being set.

**Check:**
1. Are secrets being passed to Cloud Run in CD pipeline?
   - File: `.github/workflows/cd-preprod.yml` line 359
   - Should have: `--update-secrets="...ADMIN_PASSWORD=admin-password:latest..."`

2. Does the `admin-password` secret exist?
   ```bash
   gcloud secrets describe admin-password --project=astute-strategy-406601
   ```

3. Redeploy to pick up the secrets:
   ```bash
   gcloud run deploy perundhu-backend-preprod \
     --image=YOUR_IMAGE \
     --update-secrets="ADMIN_PASSWORD=admin-password:latest" \
     --region=asia-south1
   ```

### Issue: "Invalid credentials" when logging in
Possible causes:
1. **Wrong password in secret** - The secret has changed but you're using old password
2. **Special characters in password** - Make sure no URL encoding issues
3. **Basic Auth format** - Ensure format is `Base64(username:password)`

**Solution:**
1. Verify the exact password stored:
   ```bash
   gcloud secrets versions access latest --secret=admin-password --project=astute-strategy-406601
   ```

2. Try logging in with that exact value:
   ```bash
   curl -X GET https://perundhu-backend-preprod-1032721240281.asia-south1.run.app/api/admin/dashboard \
     -H "Authorization: Basic $(echo -n 'perundhu_admin:u90TLYrmpoQf6tHC6a3Tnw==' | base64)"
   ```

### Issue: Can't access admin endpoints
The filter checks for these endpoint patterns:
- `/api/admin/**`
- `/api/v1/admin/**`

**Verify:**
1. Are you hitting an admin endpoint?
2. Is authentication enabled? (Check: `admin.auth.enabled=true`)
3. Are you sending Authorization header?

## Login Methods Supported

### 1. Basic Authentication (Recommended for Production)
```bash
curl -X GET https://backend-url/api/admin/dashboard \
  -H "Authorization: Basic BASE64_ENCODED_CREDENTIALS"
```

Where `BASE64_ENCODED_CREDENTIALS = Base64(username:password)`

Example:
```bash
echo -n "perundhu_admin:u90TLYrmpoQf6tHC6a3Tnw==" | base64
# Output: cGVydW5kaHVfYWRtaW46dTkwVExZcm1wb1FmNnRIQzZhM1RuZz09
```

### 2. Bearer Token (For Development)
If using JWT tokens:
```bash
curl -X GET https://backend-url/api/admin/dashboard \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Configuration Summary

| Config Item | Current Value | Source |
|-------------|---------------|--------|
| **Admin Username** | perundhu_admin | GCP Secret: admin-username |
| **Admin Password** | u90TLYrmpoQf6tHC6a3Tnw== | GCP Secret: admin-password |
| **Auth Enabled** | true | application-preprod.properties |
| **Auth Type** | HTTP Basic Auth | AdminBasicAuthFilter.java |
| **Protected Endpoints** | /api/admin/**, /api/v1/admin/** | AdminBasicAuthFilter.java |

## Quick Validation Checklist ✅

- [x] Secrets exist in GCP Secret Manager
- [x] Secrets have values (not empty)
- [x] CD pipeline passes secrets to Cloud Run
- [x] Cloud Run service has ADMIN_USERNAME and ADMIN_PASSWORD env vars
- [x] Application reads from environment variables
- [ ] Login works with `perundhu_admin:u90TLYrmpoQf6tHC6a3Tnw==`

## Next Steps if Login Still Fails

1. **Check Cloud Run logs** (Method 4 above)
2. **Verify endpoint URL** - Make sure you're using correct backend URL
3. **Test with curl** (Method 3 above) before using UI
4. **Check Basic Auth encoding** - Might have special characters issue
5. **Verify character encoding** - Password might have special characters that need escaping
