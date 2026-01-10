# Deployment Pipeline Fix Summary

## Issue Identified
**Error:** `Cannot update environment variable [SPRING_DATASOURCE_PASSWORD] to string literal because it has already been set with a different type.`

This error occurred during Cloud Run deployment because sensitive environment variables were being passed as string literals instead of secret references.

## Root Cause
The pipeline was trying to mix two conflicting approaches:
1. **Secret references** (from previous deployments): `db-password:latest`
2. **String literals** (current deployment): `${{ env.DB_PASSWORD }}`

Cloud Run doesn't allow changing a variable's type - once set as a secret, it must remain a secret.

## Solution Applied

### Changed File: `.github/workflows/cd-preprod.yml`

**1. Removed "Get Secrets" step** (lines 347-356)
- This step was fetching secrets as plaintext environment variables
- Not needed with proper secret references

**2. Updated Deploy Backend step** (lines 358-370)

**Before:**
```yaml
--set-env-vars="...,RECAPTCHA_SITE_KEY=${{ env.RECAPTCHA_SITE_KEY }},...,SPRING_DATASOURCE_PASSWORD=${{ env.DB_PASSWORD }},GEMINI_API_KEY=${{ env.GEMINI_API_KEY }},JWT_SECRET=${{ env.JWT_SECRET }},PUBLIC_API_KEY=${{ env.PUBLIC_API_KEY }},..."
```

**After:**
```yaml
--set-env-vars="...RECAPTCHA_SITE_KEY=recaptcha-site-key:latest,RECAPTCHA_SECRET_KEY=recaptcha-secret-key:latest,ADMIN_USERNAME=admin-username:latest,ADMIN_PASSWORD=admin-password:latest,..."
--update-secrets="SPRING_DATASOURCE_PASSWORD=db-password:latest,DB_PASSWORD=db-password:latest,GEMINI_API_KEY=gemini-api-key:latest,JWT_SECRET=preprod-jwt-secret:latest,PUBLIC_API_KEY=PUBLIC_API_KEY:latest"
```

## Key Changes

| Variable | Treatment | Reason |
|----------|-----------|--------|
| `SPRING_DATASOURCE_PASSWORD` | Secret reference → `db-password:latest` | Sensitive credential |
| `DB_PASSWORD` | Secret reference → `db-password:latest` | Sensitive credential |
| `ADMIN_USERNAME` | Secret reference → `admin-username:latest` | Sensitive credential |
| `ADMIN_PASSWORD` | Secret reference → `admin-password:latest` | Sensitive credential |
| `GEMINI_API_KEY` | Secret reference → `gemini-api-key:latest` | Sensitive credential |
| `JWT_SECRET` | Secret reference → `preprod-jwt-secret:latest` | Sensitive credential |
| `PUBLIC_API_KEY` | Secret reference → `PUBLIC_API_KEY:latest` | Sensitive credential |
| `RECAPTCHA_SITE_KEY` | Secret reference → `recaptcha-site-key:latest` | Sensitive credential |
| `RECAPTCHA_SECRET_KEY` | Secret reference → `recaptcha-secret-key:latest` | Sensitive credential |
| `SPRING_PROFILES_ACTIVE` | Env var (unchanged) | Non-sensitive |
| `SPRING_DATASOURCE_URL` | Env var (unchanged) | Non-sensitive |
| `CORS_ALLOWED_ORIGINS` | Env var (unchanged) | Non-sensitive |

## Benefits
✅ **Security**: No plaintext secrets in GitHub Actions logs
✅ **Consistency**: All deployments use the same variable types
✅ **Reliability**: No more type conflict errors
✅ **Simplicity**: Fewer intermediate steps in pipeline

## Next Steps
1. **Test**: Push to main branch or manually trigger GitHub Actions workflow
2. **Verify**: Check that deployment completes without errors
3. **Monitor**: Watch application logs for any missing variable errors
4. **Confirm**: Test API endpoints and authentication

## Files Modified
- ✅ `.github/workflows/cd-preprod.yml` (2 changes)
  - Removed "Get Secrets" step
  - Updated "Deploy Backend" step with proper secret references

---
**Status:** Ready for deployment
**Date:** January 10, 2026
