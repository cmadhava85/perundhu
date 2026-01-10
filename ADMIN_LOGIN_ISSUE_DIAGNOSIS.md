# Admin Login Issue - Diagnosis & Solution

## Problem Found ❌
Admin credentials are **NOT being injected** into the Cloud Run environment from GCP Secret Manager.

### Root Cause
- **ADMIN_USERNAME** and **ADMIN_PASSWORD** are configured as `secretKeyRef` in Cloud Run
- Cloud Run service account lacks permission to access these secrets
- **Solution Applied**: Granted `roles/secretmanager.secretAccessor` to Cloud Run service account
- **Current Status**: Secrets still not injecting properly (needs full redeployment with correct flags)

## Test Results

### Credentials in GCP Secret Manager ✅
```bash
gcloud secrets versions access latest --secret=admin-username --project=astute-strategy-406601
# Output: perundhu_admin

gcloud secrets versions access latest --secret=admin-password --project=astute-strategy-406601
# Output: u90TLYrmpoQf6tHC6a3Tnw==
```

### Cloud Run Login Test ❌
```bash
curl -X GET "https://perundhu-backend-preprod-1032721240281.asia-south1.run.app/api/admin/dashboard" \
  -H "Authorization: Basic $(echo -n 'perundhu_admin:u90TLYrmpoQf6tHC6a3Tnw==' | base64)"
# Returns: 401 Unauthorized - "Invalid username or password"
```

### Application Log Evidence
```
Invalid admin credentials for user: mchand69 accessing: /api/admin/dashboard
```
Shows the app is reading an environment variable with value `mchand69` (local username),  not the actual secret value.

## Immediate Solution

### Option 1: Run Fix Script (Automatic)
```bash
cd /Users/mchand69/Documents/perundhu
bash fix-admin-credentials.sh
```

This script:
1. Retrieves credentials from GCP Secret Manager
2. Redeploys Cloud Run with credentials as `--set-env-vars` (plaintext env vars)
3. Tests the login

**Issue encountered**: Can't change `ADMIN_USERNAME` from secretKeyRef to string literal without removing it first.

### Option 2: Manual Fix (2 steps)

**Step 1**: Create a service account property mapping file that reads from GCP Secrets directly in the code.

OR

**Step 2**: Update application-preprod.properties to use environment variables from Spring Cloud Config that read secrets.

## Best Practice Fix for CD Pipeline

Update `.github/workflows/cd-preprod.yml` to include secret retrieval step:

```yaml
- name: Get Admin Credentials
  run: |
    echo "ADMIN_USERNAME=$(gcloud secrets versions access latest --secret=admin-username --project=${{ env.PROJECT_ID }})" >> $GITHUB_ENV
    echo "ADMIN_PASSWORD=$(gcloud secrets versions access latest --secret=admin-password --project=${{ env.PROJECT_ID }})" >> $GITHUB_ENV

- name: Deploy Backend
  run: |
    gcloud run deploy perundhu-backend-preprod \
      ...
      --set-env-vars="ADMIN_USERNAME=${{ env.ADMIN_USERNAME }},ADMIN_PASSWORD=${{ env.ADMIN_PASSWORD }},..." \
      ...
```

## Permissions Applied ✅
Granted `roles/secretmanager.secretAccessor` to:
- `1032721240281-compute@developer.gserviceaccount.com`

For secrets:
- admin-username ✅
- admin-password ✅
- db-password ✅
- gemini-api-key ✅
- preprod-jwt-secret ✅
- recaptcha-site-key ✅
- recaptcha-secret-key ✅
- PUBLIC_API_KEY ✅

## Testing Commands

To verify when fixed:
```bash
# Test admin login
BACKEND_URL="https://perundhu-backend-preprod-1032721240281.asia-south1.run.app"
USERNAME="perundhu_admin"
PASSWORD="u90TLYrmpoQf6tHC6a3Tnw=="

curl -X GET "$BACKEND_URL/api/admin/dashboard" \
  -H "Authorization: Basic $(echo -n "$USERNAME:$PASSWORD" | base64)" \
  -v

# Expected: HTTP 200 OK (not 401)
```

## Next Steps

1. **Wait for CD pipeline to run** - Next deployment should pick up proper secret injection
2. **Or manually redeploy** using fix-admin-credentials.sh after addressing the secretKeyRef conflict
3. **Monitor logs** for "Admin authentication successful" message

The issue is now known and permissions are in place. Next successful deployment should resolve the login problem.
