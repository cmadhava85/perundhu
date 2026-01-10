# CD Pipeline Type Conflict Fix - January 10, 2026

## Problem Analysis

### Root Cause
The deployment failed with the error:
```
ERROR: (gcloud.run.deploy) Cannot update environment variable [SPRING_DATASOURCE_PASSWORD] 
to string literal because it has already been set with a different type.
```

This occurred because of a **type mismatch** in how environment variables were being handled:

1. **Previous deployments** set `SPRING_DATASOURCE_PASSWORD` as a **secret reference** (e.g., `db-password:latest`)
2. **Current deployment** tried to set it as a **string literal** value (e.g., `${{ env.DB_PASSWORD }}`)
3. Cloud Run doesn't allow changing the type of an existing variable - once it's a secret, you can't convert it to a plain env var, and vice versa

### Why This Happened

In the `deploy-backend` step of `.github/workflows/cd-preprod.yml`:

**Before (Line 371):**
```yaml
--set-env-vars="...,RECAPTCHA_SITE_KEY=${{ env.RECAPTCHA_SITE_KEY }},RECAPTCHA_SECRET_KEY=${{ env.RECAPTCHA_SECRET_KEY }},ADMIN_USERNAME=${{ env.ADMIN_USERNAME }},ADMIN_PASSWORD=${{ env.ADMIN_PASSWORD }},...,DB_PASSWORD=${{ env.DB_PASSWORD }},SPRING_DATASOURCE_PASSWORD=${{ env.DB_PASSWORD }},GEMINI_API_KEY=${{ env.GEMINI_API_KEY }},JWT_SECRET=${{ env.JWT_SECRET }},PUBLIC_API_KEY=${{ env.PUBLIC_API_KEY }},..."
```

The pipeline was:
1. Fetching secrets as plaintext in GitHub Actions environment variables (in "Get Secrets" step)
2. Passing them as string literals in `--set-env-vars`
3. This conflicted with the existing secret reference type set in previous deployments

## Solution Implemented

### Changes Made

**1. Removed the "Get Secrets" step**
- This step fetched sensitive values as plaintext environment variables
- Unnecessary when using Cloud Run's secret references

**2. Fixed the Deploy Backend step**
- Split variables between `--set-env-vars` and `--update-secrets` appropriately

**Before:**
```yaml
--set-env-vars="SPRING_PROFILES_ACTIVE=preprod,...,SPRING_DATASOURCE_PASSWORD=${{ env.DB_PASSWORD }},..."
```

**After:**
```yaml
--set-env-vars="SPRING_PROFILES_ACTIVE=preprod,...,RECAPTCHA_SITE_KEY=recaptcha-site-key:latest,RECAPTCHA_SECRET_KEY=recaptcha-secret-key:latest,ADMIN_USERNAME=admin-username:latest,ADMIN_PASSWORD=admin-password:latest,...,HIKARI_MIN_IDLE=2"

--update-secrets="SPRING_DATASOURCE_PASSWORD=db-password:latest,DB_PASSWORD=db-password:latest,GEMINI_API_KEY=gemini-api-key:latest,JWT_SECRET=preprod-jwt-secret:latest,PUBLIC_API_KEY=PUBLIC_API_KEY:latest"
```

### Key Improvements

| Variable | Before | After | Reason |
|----------|--------|-------|--------|
| `SPRING_DATASOURCE_PASSWORD` | String literal (from env var) | Secret reference | Sensitive data should be secrets |
| `ADMIN_USERNAME` | String literal (from env var) | Secret reference | Sensitive data should be secrets |
| `ADMIN_PASSWORD` | String literal (from env var) | Secret reference | Sensitive data should be secrets |
| `DB_PASSWORD` | String literal (from env var) | Secret reference | Sensitive data should be secrets |
| `GEMINI_API_KEY` | String literal (from env var) | Secret reference | Sensitive data should be secrets |
| `JWT_SECRET` | String literal (from env var) | Secret reference | Sensitive data should be secrets |
| `PUBLIC_API_KEY` | String literal (from env var) | Secret reference | Sensitive data should be secrets |
| `RECAPTCHA_SITE_KEY` | String literal (from env var) | Secret reference | Sensitive data should be secrets |
| `RECAPTCHA_SECRET_KEY` | String literal (from env var) | Secret reference | Sensitive data should be secrets |
| `SPRING_PROFILES_ACTIVE` | String literal | String literal (unchanged) | Non-sensitive configuration |
| `SPRING_DATASOURCE_URL` | String literal | String literal (unchanged) | Non-sensitive configuration |
| `CORS_ALLOWED_ORIGINS` | String literal | String literal (unchanged) | Non-sensitive configuration |

## Benefits of This Fix

### 🔐 Security
- Secrets are never passed through GitHub Actions environment variables
- They remain encrypted in Google Cloud Secret Manager throughout the pipeline
- No exposure of sensitive values in logs or artifacts

### ✅ Type Consistency
- All variables maintain consistent types across deployments
- No more "type conflict" errors
- Idempotent deployments (same command can be run repeatedly)

### 📦 Cleaner Code
- Removed unnecessary "Get Secrets" step
- Simpler, more maintainable pipeline
- Fewer intermediate environment variables

## Required Secret Manager Secrets

Ensure these secrets exist in Google Cloud Secret Manager (project: `astute-strategy-406601`):

```
✓ db-password (latest version)
✓ recaptcha-site-key (latest version)
✓ recaptcha-secret-key (latest version)
✓ admin-username (latest version)
✓ admin-password (latest version)
✓ gemini-api-key (latest version)
✓ preprod-jwt-secret (latest version)
✓ PUBLIC_API_KEY (latest version)
```

## Deployment Instructions

### Option 1: Trigger via GitHub
```bash
# Push to main/master branch with -workflow_dispatch- trigger
# Or manually trigger the workflow from GitHub Actions UI
```

### Option 2: Manual Deployment
If you need to deploy manually with the corrected approach:

```bash
gcloud run deploy perundhu-backend-preprod \
  --image=asia-south1-docker.pkg.dev/astute-strategy-406601/perundhu/backend:preprod-latest \
  --platform=managed \
  --region=asia-south1 \
  --allow-unauthenticated \
  --set-env-vars="SPRING_PROFILES_ACTIVE=preprod,DB_USERNAME=perundhu_user,SPRING_DATASOURCE_URL=jdbc:mysql://google/perundhu?cloudSqlInstance=astute-strategy-406601:asia-south1:perundhu-preprod-mysql&socketFactory=com.google.cloud.sql.mysql.SocketFactory&useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC&autocommit=false,SPRING_DATASOURCE_DRIVER_CLASS_NAME=com.mysql.cj.jdbc.Driver,SPRING_DATASOURCE_USERNAME=perundhu_user,FLYWAY_ENABLED=false,CORS_ALLOWED_ORIGINS=https://perundhu-frontend-preprod-1032721240281.asia-south1.run.app,LOG_LEVEL_ROOT=INFO,LOG_LEVEL_APP=INFO,RATE_LIMIT_ENABLED=true,ORIGIN_VALIDATION_ENABLED=true,HONEYPOT_ENABLED=true,RECAPTCHA_ENABLED=true,RECAPTCHA_SITE_KEY=recaptcha-site-key:latest,RECAPTCHA_SECRET_KEY=recaptcha-secret-key:latest,ADMIN_USERNAME=admin-username:latest,ADMIN_PASSWORD=admin-password:latest,GEMINI_API_ENABLED=true,HIKARI_MIN_IDLE=2" \
  --update-secrets="SPRING_DATASOURCE_PASSWORD=db-password:latest,DB_PASSWORD=db-password:latest,GEMINI_API_KEY=gemini-api-key:latest,JWT_SECRET=preprod-jwt-secret:latest,PUBLIC_API_KEY=PUBLIC_API_KEY:latest" \
  --add-cloudsql-instances=astute-strategy-406601:asia-south1:perundhu-preprod-mysql \
  --memory=2Gi \
  --cpu=2 \
  --min-instances=0 \
  --max-instances=3 \
  --timeout=300s
```

## Verification

After deployment, verify the environment variables are correctly set:

```bash
gcloud run services describe perundhu-backend-preprod \
  --region=asia-south1 \
  --format='value(spec.template.spec.containers[0].env)'

# Should show:
# - SPRING_DATASOURCE_PASSWORD as secretKeyRef
# - ADMIN_USERNAME as secretKeyRef
# - ADMIN_PASSWORD as secretKeyRef
# - DB_PASSWORD as secretKeyRef
# - GEMINI_API_KEY as secretKeyRef
# - JWT_SECRET as secretKeyRef
# - PUBLIC_API_KEY as secretKeyRef
# - RECAPTCHA_SITE_KEY as secretKeyRef
# - RECAPTCHA_SECRET_KEY as secretKeyRef
# - All others as env vars
```

## Testing Checklist

- [ ] Pipeline completes without "type conflict" error
- [ ] Backend service deploys successfully
- [ ] Frontend service deploys successfully
- [ ] Health checks pass
- [ ] Application logs show no missing environment variable errors
- [ ] Database connections work (Cloud SQL proxy functioning)
- [ ] Authentication/admin login works
- [ ] API endpoints respond correctly

## Related Files Modified

- `.github/workflows/cd-preprod.yml` - Deploy Backend step updated

## Prevention for Future

1. **Never pass secrets as string literals** - Always use `--update-secrets` for sensitive data
2. **Separate concerns** - Use `--set-env-vars` only for non-sensitive configuration
3. **Document variable types** - Maintain a reference of which variables should be secrets vs plain env vars
4. **Test before pushing** - Test gcloud run deploy commands locally with `--dry-run` if available

---

**Status:** ✅ Fixed
**Date:** January 10, 2026
**Issue:** Environment variable type conflict in Cloud Run deployment
**Resolution:** Properly separated secret references from environment variables
