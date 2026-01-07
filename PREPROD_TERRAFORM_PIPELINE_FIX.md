# PreProd Terraform Pipeline - Configuration Fix

**Date**: January 6, 2026  
**Status**: ✅ FIXED  
**Commit**: 5fbdcb5

## Problem Identified

The preprod Terraform pipeline was configured with **production project settings** instead of preprod settings:

### What Was Wrong:

```yaml
# ❌ BEFORE (incorrect - using prod project)
Terraform State Bucket:  perundhu-prod-001-tf-state-1767644488 (production project)
Project ID:              perundhu-prod-001
Service Account:         cloud-run-sa@perundhu-prod-001.iam.gserviceaccount.com
Cloud Console URL:       https://console.cloud.google.com/run?project=perundhu-prod-001
```

### Error Manifestation:

When the preprod pipeline ran, it attempted to create/modify resources in the **production** GCP project using the **preprod** service account's credentials:

```
ERROR: perundhu@astute-strategy-406601.iam.gserviceaccount.com does not have 
storage.buckets.create access to the Google Cloud project perundhu-prod-001

Permission 'storage.buckets.create' denied on resource
```

This created a circular permission problem:
- Preprod service account credentials were authenticated to the **preprod** project
- But the pipeline tried to create buckets in the **production** project  
- Preprod service account has no permissions in production project

---

## Solution Applied

### Files Modified

#### 1. `infrastructure/terraform/environments/preprod/backend.tf`

**Change**: Updated state bucket to use preprod project

```diff
  terraform {
    backend "gcs" {
-     bucket = "perundhu-prod-001-tf-state-1767644488"
+     bucket = "astute-strategy-406601-tf-state"
      prefix = "preprod/state"
    }
  }
```

#### 2. `.github/workflows/terraform.yml`

**Changes**: Updated preprod pipeline to use preprod project settings

```diff
  # In terraform-plan-preprod job
- BUCKET_NAME="perundhu-prod-001-tf-state-1767644488"
- SERVICE_ACCOUNT="cloud-run-sa@perundhu-prod-001.iam.gserviceaccount.com"
- PROJECT_ID="perundhu-prod-001"

+ BUCKET_NAME="astute-strategy-406601-tf-state"
+ SERVICE_ACCOUNT="perundhu-preprod-backend@astute-strategy-406601.iam.gserviceaccount.com"
+ PROJECT_ID="astute-strategy-406601"
```

```diff
  # Terraform plan variables
- -var="project_id=perundhu-prod-001" \
+ -var="project_id=astute-strategy-406601" \
```

```diff
  # Cloud Console URL
- url: https://console.cloud.google.com/run?project=perundhu-prod-001
+ url: https://console.cloud.google.com/run?project=astute-strategy-406601
```

---

## Configuration Verification

### ✅ Correct Configuration After Fix

| Setting | Value | Project |
|---------|-------|---------|
| Terraform State Bucket | `astute-strategy-406601-tf-state` | Preprod ✅ |
| State Prefix | `preprod/state` | N/A |
| GCP Project ID | `astute-strategy-406601` | Preprod ✅ |
| Service Account | `perundhu-preprod-backend@...` | Preprod ✅ |
| Region | `asia-south1` | Preprod ✅ |
| Cloud Console URL | `...?project=astute-strategy-406601` | Preprod ✅ |

### Environment Mapping

```
Pipeline Job          →  GCP Project              →  Service Account
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
terraform-plan-preprod      astute-strategy-406601   perundhu-preprod-backend
terraform-apply-preprod     astute-strategy-406601   perundhu-preprod-backend
terraform-destroy-preprod   astute-strategy-406601   perundhu-preprod-backend

terraform-plan-production   perundhu-prod-001        cloud-run-sa
terraform-apply-production  perundhu-prod-001        cloud-run-sa
terraform-destroy-production perundhu-prod-001       cloud-run-sa
```

---

## What This Fixes

✅ **Permission Errors**: Preprod pipeline will now use the correct project and service account  
✅ **State Management**: Preprod state now stored in preprod project bucket  
✅ **Resource Isolation**: Resources created by preprod pipeline stay in preprod project  
✅ **Cloud Console Links**: Dashboard links now point to correct project  
✅ **Service Account Scope**: Service account permissions match the project being managed  

---

## Testing the Fix

To verify the pipeline now has correct settings:

1. **Check state bucket configuration:**
   ```bash
   cd infrastructure/terraform/environments/preprod
   grep "bucket" backend.tf
   # Should show: bucket = "astute-strategy-406601-tf-state"
   ```

2. **Verify workflow settings:**
   ```bash
   grep -A 10 "terraform-plan-preprod:" .github/workflows/terraform.yml | grep -E "BUCKET|PROJECT|SERVICE_ACCOUNT"
   # Should show preprod project settings
   ```

3. **Run terraform init with correct backend:**
   ```bash
   cd infrastructure/terraform/environments/preprod
   terraform init
   # Should connect to astute-strategy-406601-tf-state bucket
   ```

4. **Verify service account permissions:**
   ```bash
   # Check that perundhu-preprod-backend can access preprod state bucket
   gcloud storage buckets describe gs://astute-strategy-406601-tf-state \
     --project=astute-strategy-406601
   ```

---

## Next Steps

1. **Push changes** (✅ Done - commit 5fbdcb5)
2. **Trigger workflow manually** with:
   - Environment: `preprod`
   - Action: `plan`
   - This will now use correct bucket and project
3. **Monitor workflow output** for successful terraform init and plan
4. **Verify** no permission errors appear

---

## Related Documentation

- [Preprod Infrastructure Status](./PREPROD_TERRAFORM_SETUP_STATUS.md)
- [Config vs Deployed Verification](./CONFIG_vs_DEPLOYED_VERIFICATION.md)
- [Terraform Pipeline Documentation](./CI_CD_DOCUMENTATION.md)

---

## Summary

The preprod Terraform pipeline was pointing to production project resources, causing authentication and permission errors. This has been fixed by:

1. Updating the Terraform backend to use preprod state bucket
2. Changing the pipeline to use preprod project ID
3. Updating service account references to preprod service account
4. Fixing all console links to point to preprod project

**Result**: Preprod pipeline is now properly isolated and uses correct credentials for preprod project.
