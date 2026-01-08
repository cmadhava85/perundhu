# 🔧 Terraform State Synchronization Fix

## Problem
The Terraform Apply step was failing with **409 Conflict** errors:
- ❌ `Error 409: Resource 'perundhu-preprod-backend' already exists.`
- ❌ `Error 409: Secret [db-username] already exists.`
- ❌ `Error 409: Secret [db-password] already exists.`

## Root Cause
The resources exist in Google Cloud Platform (GCP), but Terraform's **state file** doesn't know about them. This happens when:
1. Resources were created manually or in previous deployments
2. The state file was lost or reset
3. Resources exist from before Terraform management

When Terraform tries to apply, it sees no resources in state but finds them in GCP, resulting in "already exists" conflicts.

## Solution: Import Existing Resources

We imported the existing resources into Terraform state using the `terraform import` command. This tells Terraform "these resources already exist, manage them from now on."

### Resources Imported

✅ **Cloud Run Service**
- Resource: `module.cloud_run.google_cloud_run_service.backend`
- GCP ID: `asia-south1/astute-strategy-406601/perundhu-preprod-backend`
- Status: **IMPORTED** ✅

✅ **Secret Manager - Database Username**
- Resource: `module.secrets.google_secret_manager_secret.db_username`
- GCP ID: `projects/astute-strategy-406601/secrets/db-username`
- Status: **IMPORTED** ✅

✅ **Secret Manager - Database Password**
- Resource: `module.secrets.google_secret_manager_secret.db_password`
- GCP ID: `projects/astute-strategy-406601/secrets/db-password`
- Status: **IMPORTED** ✅

✅ **Secret Version - Database Username**
- Resource: `module.secrets.google_secret_manager_secret_version.db_username`
- Status: **IMPORTED** ✅

✅ **Secret Version - Database Password**
- Resource: `module.secrets.google_secret_manager_secret_version.db_password`
- Status: **IMPORTED** ✅

✅ **Cloud Run IAM Member (Public Access)**
- Resource: `module.cloud_run.google_cloud_run_service_iam_member.public_access`
- Status: **IMPORTED** ✅

## How Import Works

```bash
# Generic syntax
terraform import <resource_type> <resource_id_in_gcp>

# Example: Import Cloud Run service
terraform import module.cloud_run.google_cloud_run_service.backend \
  "asia-south1/astute-strategy-406601/perundhu-preprod-backend"

# Example: Import Secret Manager secret
terraform import module.secrets.google_secret_manager_secret.db_username \
  "projects/astute-strategy-406601/secrets/db-username"
```

### Import Script

Run the automated import script:
```bash
./import-existing-resources.sh
```

This script handles all imports and verifies the state.

## Verification

After import, the terraform plan now shows:
- ✅ No more "409 Resource already exists" errors
- ✅ Plan shows only expected changes (label updates, secret version rotation)
- ✅ State file is in sync with GCP resources

## Next Steps

1. **Review the plan** (if needed):
   ```bash
   cd infrastructure/terraform/environments/preprod
   terraform plan -var="database_name=perundhu" -var="database_user=perundhu_user"
   ```

2. **Apply changes** (in CI/CD pipeline):
   ```bash
   terraform apply
   ```

3. **Monitor the deployment** to ensure no conflicts occur.

## Key Takeaways

| Issue | Solution |
|-------|----------|
| Resources exist in GCP but not in Terraform state | Use `terraform import` to sync state |
| "409 Resource already exists" errors | Import command resolves the conflict |
| Multiple environments (preprod, prod) | Each needs independent state and imports |
| Sensitive secrets in state file | Use state encryption and secure storage |

## Troubleshooting

### If import fails:
```bash
# Check if resource exists in GCP
gcloud run services describe perundhu-preprod-backend --region asia-south1

# Check current state
terraform state list | grep backend

# Remove from state if needed (careful!)
terraform state rm module.cloud_run.google_cloud_run_service.backend

# Try import again
terraform import module.cloud_run.google_cloud_run_service.backend \
  "asia-south1/astute-strategy-406601/perundhu-preprod-backend"
```

### If state is corrupted:
```bash
# Backup current state
cp terraform.tfstate terraform.tfstate.backup

# Refresh state from GCP
terraform refresh

# Or re-import all resources
./import-existing-resources.sh
```

## Documentation
- [Terraform Import Documentation](https://www.terraform.io/cli/commands/import)
- [Google Cloud Run Resource](https://registry.terraform.io/providers/hashicorp/google/latest/docs/resources/cloud_run_service)
- [Google Secret Manager Resource](https://registry.terraform.io/providers/hashicorp/google/latest/docs/resources/secret_manager_secret)

---

**Status**: ✅ **FIXED** - All resources imported, state synchronized, pipeline ready to run
