# Cloud Run Backend Deployment Fix - January 9, 2026

## Issue Summary
Backend service deployment was failing with:
- **Database Authentication Error**: `Access denied for user 'perundhu_user'@'cloudsqlproxy~34.96.40.108' (using password: YES)`
- **Missing Secret Error**: `Secret preprod-jwt-secret was not found`

## Root Causes Identified

### 1. Database Password Mismatch
**Problem**: The Cloud SQL password didn't match what was stored in Secret Manager
- Secret Manager had latest version 14 (updated at 2026-01-09T11:15:50Z)
- Cloud SQL user `perundhu_user` still had the old password
- Result: Application couldn't authenticate to database

**Solution**:
```bash
PASSWORD=$(gcloud secrets versions access latest --secret=db-password --project=astute-strategy-406601)
gcloud sql users set-password perundhu_user --instance=perundhu-preprod-mysql --password="$PASSWORD"
```

### 2. Missing JWT Secret
**Problem**: Cloud Run configuration referenced `preprod-jwt-secret` but only `JWT_SECRET_PREPROD` existed
- Terraform wasn't properly creating the secret with lowercase-hyphenated name
- Cloud Run service couldn't start due to missing secret reference

**Solution**:
```bash
JWT_VALUE=$(gcloud secrets versions access latest --secret=JWT_SECRET_PREPROD)
gcloud secrets create preprod-jwt-secret --replication-policy="automatic" --data-file=<(echo -n "$JWT_VALUE")
```

## Verification Results

### Before Fix
- Revision 00022-rxw: HealthCheckContainerError
- Revision 00023-4ck: Ready but couldn't start container
- Revision 00024-7n4: Ready but couldn't start container
- Traffic: Routed to old revision 00012-p47 (from Jan 8)

### After Fix
- Latest revision 00026-l6m: Ready and serving 100% traffic
- Logs: All INFO level - no authentication errors
- Database: Connection established successfully
- Service URL: https://perundhu-backend-preprod-1032721240281.asia-south1.run.app

## Timeline

| Time (UTC) | Event |
|-----------|-------|
| 2026-01-08T17:00:59 | Revision 00022-rxw failed with HealthCheckContainerError |
| 2026-01-09T04:00+ | Multiple deployment attempts with database auth failures |
| 2026-01-09T11:15:50 | Secret version 14 created (new password) |
| 2026-01-09T11:47:38 | Revision 00024-7n4 deployed but couldn't start |
| 2026-01-09T11:58:17 | Traffic routing failed - missing JWT secret |
| 2026-01-09T11:59:35 | Fixed password + created JWT secret = Service deployed successfully |

## Actions Taken

1. ✅ Reset Cloud SQL `perundhu_user` password to match latest secret version
2. ✅ Created missing `preprod-jwt-secret` by copying `JWT_SECRET_PREPROD` value
3. ✅ Redeployed Cloud Run service to refresh secret references
4. ✅ Routed 100% traffic to latest ready revision 00026-l6m
5. ✅ Verified service health in logs (no errors)

## Recommendations for Future Prevention

### 1. Update Terraform Configuration
Ensure Terraform creates secrets with consistent naming convention (lowercase-hyphenated).

**File**: `infrastructure/terraform/modules/secrets/main.tf`
- Standardize secret names across all environments
- Consider creating a secret naming standard policy

### 2. Enhanced Pre-deployment Checks
Add validation script to verify:
- All referenced secrets exist and have latest versions
- Cloud SQL user passwords match Secret Manager
- Service account has access to all required secrets

### 3. Secret Rotation Strategy
Implement automated secret rotation:
- Define clear password reset schedule
- Ensure all dependent services are updated atomically
- Add health checks before/after password changes

### 4. Monitoring Improvements
- Add alerts for secret access failures
- Track Cloud SQL password changes
- Monitor Cloud Run deployment health checks

## Files Modified
- None (manual fixes applied via gcloud CLI)

## Testing
- ✅ Service deployed and running
- ✅ Database connection working (verified by absence of auth errors)
- ✅ All startup logs showing INFO level (no errors)
- ✅ Latest revision serving 100% traffic

## Next Steps
1. Test API endpoints functionality
2. Run smoke tests against preprod environment
3. Monitor logs for any connectivity issues
4. Plan permanent infrastructure-as-code fixes
