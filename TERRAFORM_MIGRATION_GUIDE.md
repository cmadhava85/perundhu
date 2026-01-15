# Migrating Manual Cloud Resources to Terraform

This guide explains how to migrate the manually-created Cloud Function and Cloud Scheduler resources to Terraform management.

## Current State

You have manually created resources in GCP:
- Cloud Function: `sql-auto-stop` (deployed manually via gcloud)
- Service Account: `sql-auto-stop-sa`
- Cloud Scheduler Job: `sql-auto-stop-scheduler`

These are **not managed by Terraform** yet.

## Migration Approach

There are two options:

### Option 1: Import Existing Resources (Preserve Current Infrastructure)

This approach imports the existing resources into Terraform state without recreating them.

**Pros:**
- No downtime
- Existing resource configurations are preserved
- Scheduler continues running uninterrupted

**Cons:**
- Slightly more complex process
- Need to verify imported configuration

**Steps:**

1. Prepare Terraform (from deployment guide):
```bash
cd infrastructure/terraform/environments/preprod
bash ../../modules/sql-autostop/prepare-function.sh
# Update terraform.tfvars with the generated path
```

2. Import the Cloud Function:
```bash
terraform import google_cloudfunctions2_function.sql_autostop \
  projects/astute-strategy-406601/locations/asia-south1/functions/sql-auto-stop
```

3. Import the Service Account:
```bash
terraform import google_service_account.sql_autostop_sa \
  projects/astute-strategy-406601/sa/sql-auto-stop-sa@astute-strategy-406601.iam.gserviceaccount.com
```

4. Import the Cloud Scheduler Job:
```bash
terraform import google_cloud_scheduler_job.sql_autostop_scheduler \
  projects/astute-strategy-406601/locations/asia-south1/jobs/sql-auto-stop-scheduler
```

5. Import the Cloud Storage bucket:
```bash
terraform import google_storage_bucket.function_source \
  astute-strategy-406601-sql-autostop-source
```

6. Verify the import:
```bash
terraform plan
# Should show no changes if imports were successful
```

7. If Terraform shows drift (changes needed), decide:
   - Accept Terraform's configuration: `terraform apply`
   - Or manually adjust the imported configuration to match reality

### Option 2: Destroy and Recreate (Clean Start)

This approach destroys the manual resources and creates fresh Terraform-managed ones.

**Pros:**
- Clean break with manual configuration
- Ensures configuration matches Terraform code exactly

**Cons:**
- Brief service interruption (scheduler paused)
- Need to recreate all resources

**Steps:**

1. **Backup Configuration** (if needed):
```bash
# Document current scheduler schedule
gcloud scheduler jobs describe sql-auto-stop-scheduler \
  --location=asia-south1 \
  --format=json > sql-auto-stop-backup.json

# Document function configuration
gcloud functions describe sql-auto-stop \
  --region=asia-south1 \
  --format=json > function-backup.json
```

2. **Delete Manual Resources**:
```bash
# Delete Cloud Scheduler job
gcloud scheduler jobs delete sql-auto-stop-scheduler \
  --location=asia-south1 \
  --quiet

# Delete Cloud Function
gcloud functions delete sql-auto-stop \
  --region=asia-south1 \
  --quiet

# Delete Service Account
gcloud iam service-accounts delete sql-auto-stop-sa@astute-strategy-406601.iam.gserviceaccount.com \
  --quiet

# Delete Cloud Storage bucket
gsutil -m rm -r gs://astute-strategy-406601-sql-autostop-source
```

3. **Deploy with Terraform** (see main deployment guide):
```bash
cd infrastructure/terraform/environments/preprod
bash ../../modules/sql-autostop/prepare-function.sh
# Update terraform.tfvars with the generated path
terraform init
terraform plan
terraform apply
```

## Recommended Path: Option 1 (Import)

**We recommend Option 1 (import)** because:
1. ✅ No service interruption
2. ✅ Existing configuration is preserved
3. ✅ You can verify everything works before committing

## Post-Migration Checklist

After successful migration (either option):

- [ ] Terraform state contains Cloud Function resource
- [ ] Terraform state contains Cloud Scheduler job resource
- [ ] Terraform state contains Service Account resource
- [ ] `terraform plan` shows no pending changes
- [ ] Cloud Scheduler job is ENABLED
- [ ] Cloud Function responds to manual trigger: `gcloud functions call sql-auto-stop --region=asia-south1 --data '{}'`
- [ ] Function logs are accessible: `gcloud functions logs read sql-auto-stop --region=asia-south1 --limit=5`
- [ ] All changes are committed to version control

## Verification Steps

After migration, verify everything works correctly:

### 1. Check Terraform State

```bash
# Verify resources are in state
terraform state list | grep sql_autostop
```

Expected output:
```
module.sql_autostop.google_cloud_scheduler_job.sql_autostop_scheduler
module.sql_autostop.google_cloudfunctions2_function.sql_autostop
module.sql_autostop.google_service_account.sql_autostop_sa
module.sql_autostop.google_project_iam_member.sql_autostop_cloudsql_admin
module.sql_autostop.google_project_iam_member.sql_autostop_monitoring_viewer
module.sql_autostop.google_storage_bucket.function_source
module.sql_autostop.google_storage_object.function_zip
```

### 2. Test the Function

```bash
# Manual invocation
gcloud functions call sql-auto-stop \
  --region=asia-south1 \
  --data '{}'

# Check output in logs
gcloud functions logs read sql-auto-stop \
  --region=asia-south1 \
  --limit=5 \
  --follow
```

### 3. Verify Scheduler

```bash
# Check job status
gcloud scheduler jobs describe sql-auto-stop-scheduler \
  --location=asia-south1 \
  --format="value(state)"

# Expected output: ENABLED

# Manually trigger a test run
gcloud scheduler jobs run sql-auto-stop-scheduler \
  --location=asia-south1
```

### 4. Check Cloud SQL Status

```bash
# Verify the function can interact with Cloud SQL
gcloud sql instances describe perundhu-preprod-mysql \
  --format="value(state,activationPolicy)"

# Expected output:
# RUNNABLE ALWAYS  (if recently used)
# or
# STOPPED NEVER    (if idle and auto-stopped by function)
```

## Troubleshooting

### Import Failed: Resource Not Found

**Error:** `Error: Failed to fetch project information: Project not found`

**Solution:** Verify resource names and paths:
```bash
# List resources to confirm names
gcloud functions list --filter="name:sql-auto-stop" --format="value(name,status,runtime)"
gcloud scheduler jobs list --location=asia-south1 --filter="name:sql-auto-stop-scheduler"
gcloud iam service-accounts list --filter="displayName:SQL"
```

### Import Succeeded but Plan Shows Diff

This is normal when resources were created manually. The diff shows what Terraform wants to enforce:

**Check these common differences:**
- Memory/CPU limits
- Environment variables
- Timeout settings
- CORS configurations

**Options:**
1. **Accept Terraform's values:** `terraform apply` to update resources
2. **Preserve manual configuration:** Modify the module code to match current state

```hcl
# Example: If memory needs to be 512 instead of 256
service_config {
  available_memory_mb = 512  # Change from 256
  # ... rest of config
}
```

### Scheduler Job Import Problem

**Error:** Cannot import scheduler with `-target` option

**Solution:** Import all at once without filtering:
```bash
terraform import google_cloud_scheduler_job.sql_autostop_scheduler \
  projects/astute-strategy-406601/locations/asia-south1/jobs/sql-auto-stop-scheduler
```

## Next Steps

After successful migration:

1. **Document in Git:**
```bash
git add infrastructure/terraform/modules/sql-autostop/
git add infrastructure/terraform/environments/preprod/main.tf
git add infrastructure/terraform/environments/preprod/terraform.tfvars
git commit -m "feat: manage Cloud SQL auto-stop with Terraform

- Add sql-autostop module for Cloud Function and Cloud Scheduler
- Import manually-created resources into Terraform state
- Configure auto-stop scheduling every 30 minutes
- Saves ~$28/month when SQL instance is idle"
```

2. **Update Documentation:**
   - Link to this migration guide from README
   - Document auto-stop feature in main project docs
   - Add monitoring guidance to operations runbook

3. **Set Up Alerts (Optional):**
   - Monitor function execution failures
   - Alert if scheduler job is DISABLED
   - Track cost savings

## Related Resources

- [Terraform State Import](https://www.terraform.io/docs/cli/commands/import.html)
- [Managing Existing Resources](https://registry.terraform.io/providers/hashicorp/google/latest/docs#managing-existing-resources)
- [Cloud Function Resource Import](https://registry.terraform.io/providers/hashicorp/google/latest/docs/resources/cloudfunctions2_function#import)
- [Cloud Scheduler Resource Import](https://registry.terraform.io/providers/hashicorp/google/latest/docs/resources/cloud_scheduler_job#import)
