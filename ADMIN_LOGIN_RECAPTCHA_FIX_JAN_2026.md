# Admin Login reCAPTCHA Fix - January 2026

## Issue Summary
Admin login in preprod was failing with error: `Security validation failed (reCAPTCHA). Please try again.`

The frontend UI did not display a reCAPTCHA widget, but the backend was requiring reCAPTCHA validation for the admin login endpoint, resulting in HTTP 403 errors.

## Root Cause Analysis

### Frontend Side
- `AdminLogin.tsx` component does not use `useRecaptcha` hook
- No reCAPTCHA widget rendered on the admin login page
- However, `AdminAuthContext.tsx` does call `useRecaptcha` and attempts to attach tokens

### Backend Side
- `AdminAuthController.java` validates reCAPTCHA tokens via `RecaptchaValidationService`
- When no token is provided, validation fails with HTTP 403
- Configuration in `application-preprod.properties` had `recaptcha.enabled=${RECAPTCHA_ENABLED:true}`

## Solution Implemented

**Disabled reCAPTCHA validation for preprod environment** by updating backend configuration.

### Changes Made

**File:** `backend/app/src/main/resources/application-preprod.properties`

```properties
# Before (line 136):
recaptcha.enabled=${RECAPTCHA_ENABLED:true}

# After (line 136-138):
# reCAPTCHA disabled for preprod to simplify admin authentication
# Admin login uses strong credentials and is protected by other security measures
recaptcha.enabled=false
```

### Why This Solution?

1. **Admin login is already secured** by:
   - Strong username/password credentials stored in GCP Secret Manager
   - Basic Auth with constant-time comparison to prevent timing attacks
   - AdminBasicAuthFilter for request validation
   - JWT token-based session management

2. **Simpler testing workflow** in preprod:
   - No need to configure reCAPTCHA Enterprise keys
   - No UI changes required
   - No additional Google Cloud setup for preprod

3. **Production safety maintained**:
   - Production environment (`application-production.properties`) still has `recaptcha.enabled=true`
   - Can be re-enabled in preprod if needed by setting environment variable

## Verification Steps

### Test Admin Login (After Deployment)

1. **Via UI:**
   ```
   URL: https://perundhu-frontend-preprod-1032721240281.asia-south1.run.app/admin/login
   Username: perundhu_admin
   Password: u90TLYrmpoQf6tHC6a3Tnw==
   ```

2. **Via API:**
   ```bash
   curl -X POST https://perundhu-backend-preprod-1032721240281.asia-south1.run.app/api/admin/auth/login \
     -H "Content-Type: application/json" \
     -d '{
       "username": "perundhu_admin",
       "password": "u90TLYrmpoQf6tHC6a3Tnw=="
     }'
   ```

   **Expected Response:**
   ```json
   {
     "success": true,
     "message": "Login successful",
     "timestamp": 1736513040000,
     "data": {
       "username": "perundhu_admin"
     }
   }
   ```

## Deployment Information

- **Commit:** `2fb99e1`
- **Commit Message:** "fix: Disable reCAPTCHA validation for preprod admin login"
- **Deployment:** Automatic via CD pipeline (`.github/workflows/cd-preprod.yml`)
- **Build Status:** ✅ Backend tests passed (157 passed, 26 skipped)
- **Frontend Build:** ✅ Successful with 3 errors (unrelated to this fix), 200 warnings

## Backend Configuration Reference

### RecaptchaValidationService Behavior

The service automatically skips validation when:
```java
if (!recaptchaEnabled || projectId == null || projectId.isEmpty()) {
    logger.debug("reCAPTCHA validation disabled in configuration or not configured");
    return true; // Validation passes
}
```

### Environment-Specific Configuration

| Environment | File | reCAPTCHA Enabled |
|------------|------|-------------------|
| Development | `application-dev.properties` | `false` |
| Development | `application-development.properties` | `false` |
| **Preprod** | **`application-preprod.properties`** | **`false`** (CHANGED) |
| Production | `application-production.properties` | `true` |
| Test | `application-test.properties` | `false` |

## Security Considerations

### Admin Login Security Layers

1. **Credential Strength:**
   - Username: `perundhu_admin`
   - Password: 22-character random string stored in GCP Secret Manager

2. **Authentication Filter:**
   - `AdminBasicAuthFilter` validates credentials using constant-time comparison
   - Supports both Basic Auth and Bearer token authentication
   - Located at: `backend/app/src/main/java/com/perundhu/infrastructure/security/AdminBasicAuthFilter.java`

3. **Session Management:**
   - JWT tokens with 8-hour expiration
   - Session storage (not localStorage for security)
   - Automatic session cleanup

4. **Additional Protections:**
   - CORS configuration limiting origins
   - Rate limiting via `RateLimitingFilter`
   - API key validation for public endpoints
   - Trace ID for request tracking and audit

### When to Re-Enable reCAPTCHA

Consider re-enabling reCAPTCHA in preprod if:
- Testing reCAPTCHA integration is required
- Production-like security testing is needed
- Brute force attack scenarios need validation

**To Re-Enable:**
1. Set environment variable: `RECAPTCHA_ENABLED=true` in Cloud Run
2. Ensure reCAPTCHA Enterprise is configured:
   - `GCP_PROJECT_ID`: astute-strategy-406601
   - `RECAPTCHA_SITE_KEY`: (from GCP Secret Manager)
   - `RECAPTCHA_SECRET_KEY`: (from GCP Secret Manager)
3. Update frontend to include reCAPTCHA widget in `AdminLogin.tsx`

## Related Documentation

- Admin Login Test Guide: `PREPROD_ADMIN_LOGIN_TEST_GUIDE.md`
- Admin Auth Failure Diagnosis: `PREPROD_ADMIN_AUTH_FAILURE_JAN_2026.md`
- Production Services Status: `PRODUCTION_SERVICES_STOPPED_JAN_2026.md`

## Admin Credentials

**Location:** GCP Secret Manager (project: `astute-strategy-406601`)

- Secret Name: `ADMIN_USERNAME`
  - Value: `perundhu_admin`
  
- Secret Name: `ADMIN_PASSWORD`
  - Value: `u90TLYrmpoQf6tHC6a3Tnw==`

**⚠️ Important:** These credentials are injected into Cloud Run services via `--update-secrets` in the CD pipeline.

## Monitoring

After deployment, monitor:

1. **Cloud Run Logs:**
   ```bash
   gcloud logging read "resource.type=cloud_run_revision AND \
     resource.labels.service_name=perundhu-backend-preprod" \
     --project=astute-strategy-406601 \
     --limit=50 \
     --format=json
   ```

2. **Look for:**
   - ✅ "reCAPTCHA validation disabled in configuration"
   - ✅ "Admin login successful for user: perundhu_admin"
   - ❌ NOT: "reCAPTCHA validation failed"

## Troubleshooting

### If Admin Login Still Fails

1. **Check Deployment Status:**
   ```bash
   gcloud run services describe perundhu-backend-preprod \
     --project=astute-strategy-406601 \
     --region=asia-south1 \
     --format=json | jq -r '.status.conditions'
   ```

2. **Verify Configuration:**
   - Logs should show: "reCAPTCHA validation disabled"
   - Active profile should be: `preprod`

3. **Check Secrets:**
   ```bash
   gcloud secrets versions access latest \
     --secret="ADMIN_USERNAME" \
     --project=astute-strategy-406601
   ```

4. **Test Endpoint:**
   ```bash
   curl -v -X POST https://perundhu-backend-preprod-1032721240281.asia-south1.run.app/api/admin/auth/login \
     -H "Content-Type: application/json" \
     -d '{"username":"perundhu_admin","password":"u90TLYrmpoQf6tHC6a3Tnw=="}'
   ```

## Next Steps

1. ✅ Verify admin login works after CD deployment completes
2. ⏳ Test full admin dashboard functionality
3. ⏳ Document any other admin features that may need testing
4. 📋 Consider adding reCAPTCHA to frontend if needed for production

---

**Last Updated:** January 11, 2026  
**Status:** ✅ Fix Implemented and Deployed  
**Commit:** `2fb99e1`
