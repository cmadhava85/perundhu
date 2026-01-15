# Terraform SQL Auto-Stop Deployment Guide

This guide shows how to deploy the Cloud Function and Cloud Scheduler infrastructure using Terraform.

## Quick Start

### Step 1: Prepare Function Source Code

```bash
cd infrastructure/terraform/modules/sql-autostop
bash prepare-function.sh
```

This creates a zip file and outputs a command to add to your Terraform configuration.

**Example output:**
```
Add this to your terraform.tfvars for preprod environment:

  sql_autostop_function_source_path = "/tmp/sql-autostop-20260115-141530.zip"
```

### Step 2: Update terraform.tfvars

In `infrastructure/terraform/environments/preprod/terraform.tfvars`, update the function source path:

```hcl
sql_autostop_function_source_path = "/tmp/sql-autostop-20260115-141530.zip"
```

### Step 3: Initialize Terraform (if not already done)

```bash
cd infrastructure/terraform/environments/preprod
terraform init
```

### Step 4: Plan the Deployment

```bash
terraform plan -out=tfplan
```

Review the plan to ensure it will create:
- Cloud Function (`sql-auto-stop`)
- Service Account (`sql-auto-stop-sa`)
- Cloud Storage bucket for source code
- Cloud Scheduler job (`sql-auto-stop-scheduler`)
- IAM bindings (cloudsql.admin, monitoring.viewer)

### Step 5: Apply the Configuration

```bash
terraform apply tfplan
```

Terraform will:
1. Create the service account with appropriate permissions
2. Upload the function source code to Cloud Storage
3. Deploy the Cloud Function (Gen 2)
4. Create the Cloud Scheduler job
5. Output the function URI and other details

### Step 6: Verify Deployment

```bash
# Check Terraform outputs
terraform output sql_autostop_function_uri
terraform output sql_autostop_scheduler_job_name
terraform output sql_autostop_service_account_email

# Verify the function
gcloud functions describe sql-auto-stop --region=asia-south1

# Verify the scheduler
gcloud scheduler jobs describe sql-auto-stop-scheduler --location=asia-south1
```

## Managing the Deployment

### Enable/Disable Auto-Stop

Pause without destroying:
```bash
gcloud scheduler jobs pause sql-auto-stop-scheduler --location=asia-south1
gcloud scheduler jobs resume sql-auto-stop-scheduler --location=asia-south1
```

Or via Terraform (not implemented yet - requires custom variable):
```hcl
# Would need to add a scheduler_enabled variable
```

### Adjust Configuration via Terraform

Edit `terraform.tfvars` and modify any of these variables:

```hcl
sql_autostop_idle_minutes        = 60        # Change idle threshold
sql_autostop_cron_schedule       = "0 * * * *"  # Change frequency
sql_autostop_dry_run_mode        = true      # Test without stopping
```

Then apply:
```bash
terraform plan
terraform apply
```

### Update Function Code

If you update the Cloud Function code:

```bash
# Prepare new zip
bash infrastructure/terraform/modules/sql-autostop/prepare-function.sh

# Update path in terraform.tfvars
sql_autostop_function_source_path = "/tmp/sql-autostop-XXXXXXXX.zip"

# Apply changes
terraform plan
terraform apply
```

Terraform will upload the new code and redeploy the function.

### Destroy the Infrastructure

To remove all SQL auto-stop resources (keep manual infrastructure):

```bash
# Option 1: Remove just the sql_autostop module resources
terraform destroy -target=module.sql_autostop

# Option 2: Remove everything (not recommended)
terraform destroy
```

**Note:** The Cloud Storage bucket will be force-destroyed by default. The scheduler job will be deleted.

## Environment-Specific Notes

### Production Deployment

To deploy to production, use the production environment directory:

```bash
cd infrastructure/terraform/environments/production

# Create terraform.tfvars with production settings
cat > terraform.tfvars <<EOF
project_id = "your-production-project-id"
region = "asia-south1"
environment = "production"
sql_autostop_idle_minutes = 60  # Longer threshold for production
sql_autostop_dry_run_mode = false
sql_autostop_function_source_path = "/tmp/sql-autostop-XXXXXXXX.zip"
# ... other production configuration
EOF

terraform init
terraform plan
terraform apply
```

### Switching Between Environments

The module supports both preprod and production:

```bash
# Switch to production
cd infrastructure/terraform/environments/production

# Switch back to preprod
cd infrastructure/terraform/environments/preprod
```

Each environment has its own state file in GCS:
- Preprod: `astute-strategy-406601-tf-state/preprod/state`
- Production: `astute-strategy-406601-tf-state/production/state`

## Troubleshooting

### Function Source Path Error

**Error:** `Error: open /tmp/sql-autostop.zip: no such file or directory`

**Solution:** Run the prepare script and update the path in terraform.tfvars:
```bash
bash infrastructure/terraform/modules/sql-autostop/prepare-function.sh
```

### Cloud Storage Bucket Already Exists

**Error:** `Error: googleapi: Error 409: Bucket already exists`

**Solution:** This can happen if a previous deployment's bucket wasn't fully destroyed:
```bash
# Manually delete the bucket (if no longer needed)
gsutil -m rm -r gs://astute-strategy-406601-sql-autostop-source

# Then retry Terraform apply
terraform apply
```

### Scheduler Job Already Exists

**Error:** `Error: googleapi: Error 409: Requested entity already exists`

**Solution:** If you created this manually before and want to import it:
```bash
terraform import google_cloud_scheduler_job.sql_autostop_scheduler \
  projects/astute-strategy-406601/locations/asia-south1/jobs/sql-auto-stop-scheduler
```

### Function Not Triggering

**Diagnostic steps:**

1. Check scheduler state:
```bash
gcloud scheduler jobs describe sql-auto-stop-scheduler --location=asia-south1
```

2. Force a manual trigger:
```bash
gcloud scheduler jobs run sql-auto-stop-scheduler --location=asia-south1
```

3. Check function logs:
```bash
gcloud functions logs read sql-auto-stop --region=asia-south1 --limit=50
```

4. Test function directly:
```bash
gcloud functions call sql-auto-stop --region=asia-south1 --data '{}'
```

### Permission Errors

**Error:** `Error 403: Permission denied`

**Solution:** Verify IAM roles are assigned:
```bash
# Check service account roles
gcloud projects get-iam-policy astute-strategy-406601 \
  --flatten="bindings[].members" \
  --filter="bindings.members:sql-auto-stop-sa@*"

# Should see roles/cloudsql.admin and roles/monitoring.viewer
```

## Monitoring

### View Function Executions

```bash
gcloud functions logs read sql-auto-stop --region=asia-south1 --limit=20 --follow
```

### Check SQL Instance Status

```bash
gcloud sql instances describe perundhu-preprod-mysql
```

Look for:
- `state`: RUNNABLE (running) or STOPPED (stopped by function)
- `databaseVersion`: MySQL version
- `currentDiskSize`: Current disk usage

### View Scheduler Execution History

```bash
gcloud scheduler jobs describe sql-auto-stop-scheduler \
  --location=asia-south1 \
  --format="yaml"
```

## Cost Breakdown

**Monthly Cost (with auto-stop):**

| Resource | Cost |
|----------|------|
| Cloud SQL instance (STOPPED) | ~$0 (no hourly charges) |
| Cloud Function executions (48/day) | ~$0.40 |
| Cloud Scheduler | ~$0.07 |
| Cloud Storage (small code bucket) | ~$0.02 |
| **Total** | **~$0.50/month** |

**Savings vs. Always-On:**
- Cloud SQL always-on: $28.73/month
- With auto-stop: $0.50/month
- **Net savings: $28.23/month** ✓

## Related Documentation

- [Terraform Google Provider - Cloud Functions](https://registry.terraform.io/providers/hashicorp/google/latest/docs/resources/cloudfunctions2_function)
- [Terraform Google Provider - Cloud Scheduler](https://registry.terraform.io/providers/hashicorp/google/latest/docs/resources/cloud_scheduler_job)
- [Cloud SQL Administration API](https://cloud.google.com/sql/docs/mysql/admin-api)
- [Cloud Monitoring Metrics](https://cloud.google.com/monitoring/api/metrics_gcp#gcp-cloudsql)
