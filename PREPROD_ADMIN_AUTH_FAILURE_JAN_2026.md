# Preprod Admin Authentication Failure - January 10, 2026

## 🔴 Critical Issue

**Status**: FAILING  
**Environment**: Preprod (Cloud Run)  
**Severity**: HIGH - Admin authentication completely broken

## Problem Summary

Admin authentication is failing with HTTP 401 "Invalid username or password" despite:
- ✅ Credentials in Basic Auth token match GCP secrets exactly
- ✅ Secrets exist and have correct values
- ✅ CD pipeline updated to use `--update-secrets`

## Test Evidence

### Test Command
```bash
curl 'https://perundhu-backend-preprod-1032721240281.asia-south1.run.app/api/admin/contributions/routes/pending' \
  -H 'authorization: Basic cGVydW5kaHVfYWRtaW46dTkwVExZcm1wb1FmNnRIQzZhM1Rudz09'
```

### Response
```json
HTTP/2 401
{
  "error":"UNAUTHORIZED",
  "message":"Invalid username or password",
  "status":401
}
```

### Log Output
```
2026-01-10 17:16:05 WARN [c.p.i.security.AdminBasicAuthFilter] : 
Invalid admin credentials for user: perundhu_admin accessing: /api/admin/contributions/routes/pending
```

## Verified Facts

### 1. Basic Auth Token is Correct
```bash
$ echo "cGVydW5kaHVfYWRtaW46dTkwVExZcm1wb1FmNnRIQzZhM1Rudz09" | base64 -d
perundhu_admin:u90TLYrmpoQf6tHC6a3Tnw==
```

### 2. GCP Secrets Match
```bash
$ gcloud secrets versions access latest --secret=admin-username --project=astute-strategy-406601
perundhu_admin

$ gcloud secrets versions access latest --secret=admin-password --project=astute-strategy-406601
u90TLYrmpoQf6tHC6a3Tnw==
```

### 3. CD Pipeline Configuration is Correct
File: `.github/workflows/cd-preprod.yml` (line ~354)
```yaml
--update-secrets="ADMIN_USERNAME=admin-username:latest,ADMIN_PASSWORD=admin-password:latest,..."
```

## Possible Root Causes

### 1. Deployed Code Doesn't Have Latest Fix ⚠️ MOST LIKELY
The currently deployed backend may not include the latest admin credential fixes:
- Missing `@PostConstruct` validation in `AdminBasicAuthFilter.java`
- Old version still uses `--set-env-vars` instead of `--update-secrets`

**Solution**: Trigger a new deployment

### 2. Whitespace in Secret Values
The secrets might have trailing whitespace or newlines:

**Check**:
```bash
# Check for hidden characters
gcloud secrets versions access latest --secret=admin-username --project=astute-strategy-406601 | od -c
gcloud secrets versions access latest --secret=admin-password --project=astute-strategy-406601 | od -c
```

**Fix if needed**:
```bash
# Recreate secrets without whitespace
echo -n "perundhu_admin" | gcloud secrets versions add admin-username \
  --data-file=- \
  --project=astute-strategy-406601

echo -n "u90TLYrmpoQf6tHC6a3Tnw==" | gcloud secrets versions add admin-password \
  --data-file=- \
  --project=astute-strategy-406601
```

### 3. Secrets Not Injected into Container
Cloud Run might not be injecting secrets properly.

**Check**:
```bash
# Verify secrets are configured
gcloud run services describe perundhu-backend-preprod \
  --region=asia-south1 \
  --format=yaml | grep -A 10 "secretKeyRef"
```

**Expected**:
```yaml
- name: ADMIN_USERNAME
  valueFrom:
    secretKeyRef:
      key: latest
      name: admin-username
- name: ADMIN_PASSWORD
  valueFrom:
    secretKeyRef:
      key: latest
      name: admin-password
```

### 4. Service Account Lacks Permission
The Cloud Run service account might not have access to secrets.

**Check and Fix**:
```bash
# Get service account
SERVICE_ACCOUNT=$(gcloud run services describe perundhu-backend-preprod \
  --region=asia-south1 \
  --format='value(spec.template.spec.serviceAccountName)')

echo "Service Account: $SERVICE_ACCOUNT"

# Grant access
gcloud secrets add-iam-policy-binding admin-username \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role="roles/secretmanager.secretAccessor" \
  --project=astute-strategy-406601

gcloud secrets add-iam-policy-binding admin-password \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role="roles/secretmanager.secretAccessor" \
  --project=astute-strategy-406601
```

### 5. Character Encoding Issue
The password contains `=` characters (Base64 padding) which might be getting URL-encoded or escaped.

**Verification**: The constant-time comparison in `AdminBasicAuthFilter.java` compares byte-by-byte, so encoding should match.

## Immediate Action Plan

### Step 1: Verify Latest Code is Deployed
```bash
# Check current image
gcloud run services describe perundhu-backend-preprod \
  --region=asia-south1 \
  --format='get(spec.template.spec.containers[0].image)'

# Check when it was last updated
gcloud run services describe perundhu-backend-preprod \
  --region=asia-south1 \
  --format='get(metadata.annotations.run.googleapis.com/launchStage,status.observedGeneration,status.latestCreatedRevisionName)'
```

### Step 2: Trigger New Deployment
If the deployment is old (before the admin fix), trigger a new deployment:

**Option A: Via GitHub Actions**
1. Go to https://github.com/cmadhava85/perundhu/actions
2. Run the "CD - Preprod Deployment" workflow manually

**Option B: Via Command Line**
```bash
cd /Users/mchand69/Documents/perundhu
git add -A
git commit -m "fix: Redeploy with admin credential fixes"
git push origin master
```

### Step 3: Verify Secrets Have No Whitespace
```bash
# Check for non-printable characters
printf '%s' "$(gcloud secrets versions access latest --secret=admin-username --project=astute-strategy-406601)" | xxd

printf '%s' "$(gcloud secrets versions access latest --secret=admin-password --project=astute-strategy-406601)" | xxd
```

If whitespace is found, recreate:
```bash
echo -n "perundhu_admin" | gcloud secrets versions add admin-username --data-file=- --project=astute-strategy-406601
echo -n "u90TLYrmpoQf6tHC6a3Tnw==" | gcloud secrets versions add admin-password --data-file=- --project=astute-strategy-406601
```

### Step 4: Force Redeploy Current Image
```bash
gcloud run services update-traffic perundhu-backend-preprod \
  --to-latest \
  --region=asia-south1 \
  --project=astute-strategy-406601
```

### Step 5: Check New Deployment Logs
```bash
# Wait 2-3 minutes for deployment, then check logs
gcloud run services logs read perundhu-backend-preprod \
  --region=asia-south1 \
  --project=astute-strategy-406601 \
  --limit=200 | grep -A 10 "ADMIN AUTHENTICATION CONFIGURATION VALIDATION"
```

**Expected output (if fix is deployed)**:
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

### Step 6: Test Again
```bash
curl -i 'https://perundhu-backend-preprod-1032721240281.asia-south1.run.app/api/admin/contributions/routes/pending' \
  -H 'Authorization: Basic cGVydW5kaHVfYWRtaW46dTkwVExZcm1wb1FmNnRIQzZhM1Rudz09'
```

**Expected**: HTTP 200 with data

## Diagnostic Commands

### Check Startup Validation Logs
```bash
gcloud run services logs read perundhu-backend-preprod \
  --region=asia-south1 \
  --limit=500 | grep -E "(ADMIN|validation|credentials)" | tail -30
```

### Check Recent Authentication Attempts
```bash
gcloud run services logs read perundhu-backend-preprod \
  --region=asia-south1 \
  --limit=100 | grep -i "authentication" | tail -20
```

### Check Secret Configuration in Cloud Run
```bash
gcloud run services describe perundhu-backend-preprod \
  --region=asia-south1 \
  --format=yaml > /tmp/preprod-config.yaml

cat /tmp/preprod-config.yaml | grep -A 20 "env:"
```

### Check Service Account Permissions
```bash
SERVICE_ACCOUNT=$(gcloud run services describe perundhu-backend-preprod \
  --region=asia-south1 \
  --format='value(spec.template.spec.serviceAccountName)')

gcloud secrets get-iam-policy admin-username --project=astute-strategy-406601
gcloud secrets get-iam-policy admin-password --project=astute-strategy-406601
```

## Files Involved

1. **AdminBasicAuthFilter.java** - The authentication filter
   - Path: `backend/app/src/main/java/com/perundhu/infrastructure/security/AdminBasicAuthFilter.java`
   - Contains: Credential validation logic, startup validation

2. **CD Pipeline** - Deployment configuration
   - Path: `.github/workflows/cd-preprod.yml`
   - Line ~354: `--update-secrets` configuration

3. **Application Properties** - Spring configuration
   - Path: `backend/app/src/main/resources/application-preprod.properties`
   - Lines 162-166: Admin auth configuration

## Success Criteria

### ✅ Authentication Working
- [ ] Startup logs show "Admin credentials validated successfully"
- [ ] No ":latest" literal strings in credentials
- [ ] Test curl returns HTTP 200 with data
- [ ] Frontend admin login works
- [ ] Logs show "Admin authentication successful" (not "Invalid credentials")

### ❌ Authentication Still Broken
- [ ] Startup logs show "ADMIN PASSWORD CONTAINS ':latest'"
- [ ] Test curl returns HTTP 401
- [ ] Logs show "Invalid admin credentials"
- [ ] Frontend login fails with 401

## Timeline

- **January 10, 2026 12:09 UTC**: Backend build successful with admin fix
- **January 10, 2026 12:16 UTC**: Changes pushed to repository
- **January 10, 2026 17:16 UTC**: Test showed HTTP 401 - Auth still failing
- **Current Status**: Waiting for proper deployment with latest code

## Next Steps

1. ✅ Identify issue (DONE - old deployment or whitespace)
2. ⏳ Redeploy with latest code (IN PROGRESS)
3. ⏳ Verify secrets have no whitespace
4. ⏳ Test authentication again
5. ⏳ Update documentation with working credentials

## Related Documentation

- [PREPROD_ADMIN_LOGIN_TEST_GUIDE.md](PREPROD_ADMIN_LOGIN_TEST_GUIDE.md) - Testing guide
- [ADMIN_CREDENTIALS_FIX_JAN_2026.md](ADMIN_CREDENTIALS_FIX_JAN_2026.md) - Previous fix documentation
- [ADMIN_CREDENTIAL_DEBUG_GUIDE.md](ADMIN_CREDENTIAL_DEBUG_GUIDE.md) - Debugging steps

---

**Last Updated**: January 10, 2026 17:30 UTC  
**Status**: 🔴 BROKEN - Authentication Failing  
**Owner**: DevOps Team  
**Priority**: P0 - Critical
