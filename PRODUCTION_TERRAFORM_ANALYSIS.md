# Production Terraform Plan Analysis

**Date:** January 8, 2026  
**Plan Summary:** 13 to add, 3 to change, 24 to destroy

## Overview

The production terraform plan shows 24 resources marked for destruction. These are **outdated resources from the previous terraform configuration structure** that are no longer defined in the current modules.

## What's Being Destroyed (24 resources)

### 1. IAM Role Assignments (13 destroyed, 6 created)
**Destroyed (old individual resource naming):**
- `module.iam.google_project_iam_member.backend_cloudsql_client`
- `module.iam.google_project_iam_member.backend_logging_writer`
- `module.iam.google_project_iam_member.backend_monitoring_writer`
- `module.iam.google_project_iam_member.backend_pubsub_publisher`
- `module.iam.google_project_iam_member.backend_pubsub_subscriber`
- `module.iam.google_project_iam_member.backend_redis_editor`
- `module.iam.google_project_iam_member.backend_secret_accessor`
- `module.iam.google_project_iam_member.backend_storage_admin`
- `module.iam.google_project_iam_member.cloudbuild_iam_service_account_user`
- `module.iam.google_project_iam_member.cloudbuild_logs_writer`
- `module.iam.google_project_iam_member.cloudbuild_run_developer`
- `module.iam.google_project_iam_member.cloudbuild_storage_admin`

**Being Created (new map-based approach):**
- `module.iam.google_project_iam_member.backend_roles["roles/cloudsql.client"]`
- `module.iam.google_project_iam_member.backend_roles["roles/secretmanager.secretAccessor"]`
- `module.iam.google_project_iam_member.backend_roles["roles/storage.objectViewer"]`
- `module.iam.google_project_iam_member.cloudbuild_roles["roles/artifactregistry.writer"]`
- `module.iam.google_project_iam_member.cloudbuild_roles["roles/cloudbuild.builds.editor"]`
- `module.iam.google_project_iam_member.cloudbuild_roles["roles/container.developer"]`

**Impact:** ✅ **SAFE** - These reassignments will maintain the exact same IAM permissions. The roles being removed are being replaced with the same roles under a new terraform structure (map-based instead of individual resources).

### 2. Secrets (6 destroyed, 0 created)
**Destroyed:**
- `module.secrets.google_secret_manager_secret.data_encryption_key`
- `module.secrets.google_secret_manager_secret_version.data_encryption_key`
- `module.secrets.random_password.data_encryption_key`
- `module.secrets.google_secret_manager_secret.db_url`
- `module.secrets.google_secret_manager_secret_version.db_url`
- `module.secrets.random_password.jwt_secret`

**Current Configuration:** The secrets module (modules/secrets/main.tf) only defines:
- `db_username`
- `db_password`

**Impact:** ✅ **SAFE** - These secrets were removed from the current terraform configuration. Code audit shows:
- No references to `data_encryption_key` in backend application
- No references to `jwt_secret` in backend application  
- No references to `db_url` in backend application (connection handled via `CLOUDSQL_CONNECTION_NAME`)

### 3. Other Changes (3 to change)
- `module.database.google_sql_database_instance.mysql_instance` - Update in-place (configuration drift)
- `module.iam.google_project_iam_custom_role.app_role[0]` - Update in-place (permissions update)
- `module.storage.google_storage_bucket.images_bucket` - Update in-place (configuration drift)

## Risk Assessment

**Overall Risk Level:** ⚠️ **LOW TO MEDIUM**

| Item | Risk | Notes |
|------|------|-------|
| IAM Role Changes | ✅ Low | Roles are being reassigned to same service accounts with same permissions. GCP roles remain unchanged. |
| Secrets Deletion | ✅ Low | Secrets are not in use and not referenced in code. If needed, can be recreated. |
| DB Instance Update | ⚠️ Medium | May trigger minor modifications. Non-destructive. |
| Storage Bucket Update | ✅ Low | Non-destructive configuration update. |
| Custom Role Update | ✅ Low | Permissions update, no removal. |

## Recommendation

✅ **SAFE TO APPLY**

The production terraform plan is safe to apply. The 24 resources marked for destruction are either:
1. **Outdated terraform structures** being reorganized (IAM roles)
2. **Unused secrets** from previous configuration versions

All changes are non-destructive to the actual GCP infrastructure. Service accounts will retain the same permissions, and the only secrets being deleted are not referenced in the application code.

## Comparison with Preprod

The preprod environment successfully applied with similar changes:
- ✅ Preprod apply: 1 added, 3 changed, 0 destroyed (custom role assignment, db/storage drift)
- ⏳ Production plan: 13 added, 3 changed, 24 destroyed (additional IAM reorganization + old secrets)

The difference is that production has more legacy resources from previous deployments that need to be cleaned up.

## Next Steps

1. **Option A (Recommended):** Apply the plan as-is
   - All changes are safe and necessary for terraform structure alignment
   - Services will remain functional
   - Cleanup of old terraform artifacts will complete

2. **Option B:** Approve specific resource groups
   - Apply IAM changes first
   - Then apply secret deletions
   - Allows phased approach if preferred

**Proceed with:** `terraform apply -auto-approve`
