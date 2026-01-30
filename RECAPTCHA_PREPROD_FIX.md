# reCAPTCHA Preprod Domain Issue - Fix Instructions

## Problem
reCAPTCHA is showing "Invalid domain" error in preprod because the reCAPTCHA Enterprise key is not configured to accept requests from the preprod frontend domain.

**Error Message:** 
```
Invalid domain for site key
OR
Invalid domain
```

**Preprod Frontend URL:** `https://perundhu-frontend-preprod-1032721240281.asia-south1.run.app`

## Root Cause
The reCAPTCHA Enterprise site key `6Lf-qkAsAAAAAMsufKTr2pb6mh9_OSEYcDyl7juE` is configured with domain restrictions that do not include the preprod Cloud Run domain.

## Temporary Fix (Applied)
✅ **Disabled reCAPTCHA in preprod** by setting `VITE_RECAPTCHA_ENABLED=false` in `frontend/.env.preprod`

This allows preprod testing to continue while the permanent fix is implemented.

## Permanent Fix (Action Required)

### Option 1: Add Preprod Domain to Existing Key (Recommended)
1. Open [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **Security → reCAPTCHA Enterprise**
3. Select project: `astute-strategy-406601`
4. Find the site key: `6Lf-qkAsAAAAAMsufKTr2pb6mh9_OSEYcDyl7juE`
5. Click **Edit**
6. Under **Domains**, add:
   - `perundhu-frontend-preprod-1032721240281.asia-south1.run.app`
   - Or use wildcard: `*.asia-south1.run.app` (if acceptable for security)
7. Click **Save**

### Option 2: Create Separate Preprod reCAPTCHA Key
1. Create a new reCAPTCHA Enterprise key specifically for preprod
2. Configure domains:
   - `perundhu-frontend-preprod-1032721240281.asia-south1.run.app`
   - `localhost` (for local preprod testing)
3. Update `frontend/.env.preprod`:
   ```bash
   VITE_RECAPTCHA_ENABLED=true
   VITE_RECAPTCHA_SITE_KEY=<new-preprod-key>
   ```
4. Store the new key in GitHub Secrets: `RECAPTCHA_SITE_KEY_PREPROD`
5. Update `.github/workflows/cd-preprod.yml` to use the new secret

### Option 3: Use Test Key (Development Only)
For development/testing purposes, use reCAPTCHA test keys:
- **Site key:** `6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI`
- **Secret key:** `6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe`

**Note:** Test keys always pass validation but should NOT be used in production.

## Verification Steps
After applying the permanent fix:

1. **Frontend rebuild required:**
   ```bash
   cd frontend
   npm run build:preprod
   ```

2. **Deploy to preprod:**
   - Push to master (triggers CD pipeline)
   - Or manually deploy: `gcloud run deploy perundhu-frontend-preprod`

3. **Test reCAPTCHA:**
   - Open: https://perundhu-frontend-preprod-1032721240281.asia-south1.run.app
   - Navigate to any contribution form (Report Issue, Image Upload, Add Route)
   - Submit the form
   - Verify no "Invalid domain" error appears
   - Check browser console for reCAPTCHA success logs

## Related Files
- Frontend config: `frontend/.env.preprod`
- reCAPTCHA service: `frontend/src/services/recaptchaService.ts`
- CD pipeline: `.github/workflows/cd-preprod.yml`

## Status
- [x] Temporary fix applied (reCAPTCHA disabled)
- [ ] Permanent fix (domain whitelisting) - **Action required**
- [ ] Re-enable reCAPTCHA in preprod after domain added
- [ ] Verify reCAPTCHA working in preprod

## References
- [reCAPTCHA Enterprise Docs](https://cloud.google.com/recaptcha-enterprise/docs/create-key-website)
- [Domain Configuration](https://cloud.google.com/recaptcha-enterprise/docs/domain-validation)
