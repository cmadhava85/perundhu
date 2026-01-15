# SQL Auto-Stop Module for Terraform

This module manages the Cloud Function and Cloud Scheduler infrastructure for automatically stopping idle Cloud SQL instances in GCP.

## Overview

The module creates:
- **Cloud Function (Gen 2)**: Monitors SQL instance connections and stops idle instances
- **Service Account**: Dedicated account with `cloudsql.admin` and `monitoring.viewer` roles
- **Cloud Storage Bucket**: Stores the function source code
- **Cloud Scheduler Job**: Triggers the function on a configurable cron schedule (default: every 30 minutes)

## Architecture

```
Cloud Scheduler (every 30 min)
    ↓
Cloud Function (sql-auto-stop)
    ├─ Checks SQL instance state
    ├─ Queries active connections (via Cloud Monitoring)
    └─ Stops instance if idle → Cloud SQL instance paused
```

## Prerequisites

1. Cloud Function source code must be zipped and available
2. The function requires Python 3.11 runtime
3. GCP APIs must be enabled: `cloudfunctions.googleapis.com`, `cloudscheduler.googleapis.com`, `sqladmin.googleapis.com`, `monitoring.googleapis.com`

## Variables

### Required
- `project_id` - GCP Project ID
- `function_source_path` - Path to zipped Cloud Function source code

### Optional
- `region` (default: `asia-south1`)
- `sql_instance_name` (default: `perundhu-preprod-mysql`)
- `idle_minutes_threshold` (default: `30`)
- `dry_run_mode` (default: `false`)
- `cron_schedule` (default: `*/30 * * * *`)
- `schedule_interval_minutes` (default: `30`)
- `time_zone` (default: `Asia/Kolkata`)

## Outputs

- `function_name` - Name of the Cloud Function
- `function_uri` - HTTP URI of the Cloud Function
- `service_account_email` - Email of the function's service account
- `scheduler_job_name` - Name of the Cloud Scheduler job
- `scheduler_job_state` - State of the scheduler job (ENABLED/DISABLED)
- `source_bucket_name` - Cloud Storage bucket containing function code

## Usage

### Using in an Environment

In your environment's `main.tf`:

```hcl
module "sql_autostop" {
  source = "../../modules/sql-autostop"

  project_id                 = var.project_id
  region                     = var.region
  sql_instance_name          = module.database.db_instance_name
  idle_minutes_threshold     = var.sql_autostop_idle_minutes
  dry_run_mode               = var.sql_autostop_dry_run_mode
  cron_schedule              = var.sql_autostop_cron_schedule
  schedule_interval_minutes  = var.sql_autostop_schedule_interval_minutes
  time_zone                  = var.sql_autostop_time_zone
  function_source_path       = var.sql_autostop_function_source_path

  depends_on = [module.database]
}
```

### Preparing Function Source Code

Before applying Terraform, prepare the Cloud Function source:

```bash
# Create a zip file with the function code
cd cloud-functions/sql-autostop
zip -r /tmp/sql-autostop.zip main.py requirements.txt

# Use the path in terraform.tfvars or variables
sql_autostop_function_source_path = "/tmp/sql-autostop.zip"
```

## Configuration

### Enable/Disable Auto-Stop

Pause the scheduler without destroying infrastructure:
```bash
gcloud scheduler jobs pause sql-auto-stop-scheduler --location=asia-south1
gcloud scheduler jobs resume sql-auto-stop-scheduler --location=asia-south1
```

### Dry Run Mode

Test the function without stopping instances:
```hcl
sql_autostop_dry_run_mode = true
```

With dry-run enabled, the function logs what it would do but doesn't actually stop the instance.

### Adjust Idle Threshold

Change how long to wait before stopping:
```hcl
sql_autostop_idle_minutes = 15  # Stop after 15 minutes of no activity
```

### Change Schedule

Modify how frequently the function runs:
```hcl
sql_autostop_cron_schedule = "0 * * * *"  # Run hourly instead of every 30 min
```

## Cost Impact

**Monthly Savings (when instance is idle):**
- Prevents continuous Cloud SQL instance costs (~$28.73/month for db-f1-micro)
- Cloud Function invocations: ~$0.40/month (assuming 48 daily invocations)
- Cloud Scheduler: <$0.10/month

**Net monthly savings:** ~$28/month when SQL is idle

## Troubleshooting

### Check Function Logs

```bash
gcloud functions logs read sql-auto-stop --region=asia-south1 --limit=50
```

### Test the Function Manually

```bash
gcloud functions call sql-auto-stop \
  --region=asia-south1 \
  --data '{}'
```

### Verify Scheduler Job

```bash
gcloud scheduler jobs describe sql-auto-stop-scheduler --location=asia-south1
gcloud scheduler jobs run sql-auto-stop-scheduler --location=asia-south1
```

### Check Cloud SQL Instance

```bash
gcloud sql instances describe perundhu-preprod-mysql
```

## Integration with Cost Optimization Pipeline

The auto-stop mechanism integrates with your existing cost optimization pipeline:

1. **Pipeline starts SQL instance:**
   ```bash
   gcloud sql instances patch perundhu-preprod-mysql --activation-policy=ALWAYS
   ```

2. **Cloud Function monitors idle time** (runs every 30 minutes)

3. **Function auto-stops instance after idle threshold:**
   ```bash
   gcloud sql instances patch perundhu-preprod-mysql --activation-policy=NEVER
   ```

This automation ensures your SQL instance is only running when actively used.

## State Management

The module stores Terraform state in GCS as configured in the environment backend.

To import existing manually-created resources:

```bash
# If you created these resources manually before Terraform:
terraform import google_cloudfunctions2_function.sql_autostop \
  projects/astute-strategy-406601/locations/asia-south1/functions/sql-auto-stop

terraform import google_cloud_scheduler_job.sql_autostop_scheduler \
  projects/astute-strategy-406601/locations/asia-south1/jobs/sql-auto-stop-scheduler
```

## Related Documentation

- [Cloud Functions Documentation](https://cloud.google.com/functions/docs)
- [Cloud Scheduler Documentation](https://cloud.google.com/scheduler/docs)
- [Cloud SQL Administration](https://cloud.google.com/sql/docs/mysql/admin-api)
- [Cloud Monitoring API](https://cloud.google.com/monitoring/api/v3)
