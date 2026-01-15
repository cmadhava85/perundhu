# Terraform SQL Auto-Stop Quick Reference

## 📋 File Structure

```
infrastructure/terraform/
├── modules/sql-autostop/           ← NEW MODULE
│   ├── main.tf                     (Cloud Function + Scheduler)
│   ├── variables.tf                (Configuration inputs)
│   ├── outputs.tf                  (Exports for other modules)
│   ├── README.md                   (Module documentation)
│   └── prepare-function.sh         (Helper script)
│
└── environments/preprod/
    ├── main.tf                     (UPDATED - added module)
    ├── variables.tf                (UPDATED - added variables)
    ├── outputs.tf                  (UPDATED - added outputs)
    └── terraform.tfvars            (UPDATED - added config)

Project Root:
├── TERRAFORM_SQL_AUTOSTOP_SUMMARY.md   ← THIS FILE'S OVERVIEW
├── TERRAFORM_SQL_AUTOSTOP_DEPLOYMENT.md ← DEPLOYMENT GUIDE
└── TERRAFORM_MIGRATION_GUIDE.md         ← IMPORT EXISTING RESOURCES
```

## 🚀 5-Minute Quick Start

```bash
# Step 1: Prepare function code (one-time)
cd infrastructure/terraform/modules/sql-autostop
bash prepare-function.sh

# Step 2: Update terraform.tfvars with path from Step 1

# Step 3: Deploy
cd ../../../environments/preprod
terraform plan
terraform apply
```

Done! ✓ Cloud Function and Scheduler are now managed by Terraform.

## 📊 Key Resources Created

| Resource | Type | Name | Purpose |
|----------|------|------|---------|
| Cloud Function | `cloudfunctions2_function` | `sql-auto-stop` | Monitors and stops idle SQL |
| Service Account | `google_service_account` | `sql-auto-stop-sa` | Function authentication |
| IAM Role 1 | `project_iam_member` | `cloudsql.admin` | Stop SQL instances |
| IAM Role 2 | `project_iam_member` | `monitoring.viewer` | Check connections |
| Cloud Scheduler | `cloud_scheduler_job` | `sql-auto-stop-scheduler` | Triggers every 30 min |
| Cloud Storage | `storage_bucket` | `{project}-sql-autostop-source` | Stores function code |

## 🔧 Common Commands

### View Output Values
```bash
terraform output sql_autostop_function_uri
terraform output sql_autostop_scheduler_state
```

### Check Function Status
```bash
gcloud functions describe sql-auto-stop --region=asia-south1
gcloud functions logs read sql-auto-stop --region=asia-south1 --limit=10
```

### Test Function
```bash
gcloud functions call sql-auto-stop --region=asia-south1 --data '{}'
```

### View Scheduler
```bash
gcloud scheduler jobs describe sql-auto-stop-scheduler --location=asia-south1
gcloud scheduler jobs run sql-auto-stop-scheduler --location=asia-south1
```

### Check SQL Instance
```bash
gcloud sql instances describe perundhu-preprod-mysql --format="value(state,activationPolicy)"
```

## 🎯 Configuration Options

### In `terraform.tfvars`:

```hcl
sql_autostop_idle_minutes = 30          # When to stop (minutes)
sql_autostop_dry_run_mode = false       # Test without stopping
sql_autostop_cron_schedule = "*/30 * * * *"  # How often (cron)
sql_autostop_time_zone = "Asia/Kolkata" # Scheduler timezone
sql_autostop_function_source_path = "..." # Path to zipped code
```

### Available Cron Schedules:

```
"0 * * * *"     = Every hour
"*/30 * * * *"  = Every 30 minutes (default)
"*/15 * * * *"  = Every 15 minutes
"0 2 * * *"     = Daily at 2 AM (IST)
"0 */4 * * *"   = Every 4 hours
```

## 💰 Cost Savings

| Scenario | Monthly Cost |
|----------|---|
| Always-on Cloud SQL | $28.73 |
| Cloud SQL (auto-stopped) | $0.00 |
| Auto-stop overhead (function + scheduler) | $0.50 |
| **Net savings when idle** | **$28.23** |

## 🔐 Permissions

Service account `sql-auto-stop-sa` has:
- ✅ `roles/cloudsql.admin` - To stop instances
- ✅ `roles/monitoring.viewer` - To check connections
- ❌ No other permissions (least privilege)

## 📝 Important Notes

### Before First Deploy
- [ ] Run `prepare-function.sh` to create zip
- [ ] Update `terraform.tfvars` with generated path
- [ ] Run `terraform plan` to review changes

### After Deploy
- [ ] Verify `terraform output` shows function URI
- [ ] Test function with `gcloud functions call`
- [ ] Check scheduler status is ENABLED
- [ ] Verify SQL instance can be queried

### Configuration Changes
To adjust settings:
1. Edit `terraform.tfvars`
2. Run `terraform plan`
3. Review changes
4. Run `terraform apply`

No need to redeploy or restart anything.

## 🐛 Troubleshooting

### Function source path error?
```bash
cd infrastructure/terraform/modules/sql-autostop
bash prepare-function.sh
# Copy the path from output
```

### Scheduler not triggering?
```bash
# Check job status
gcloud scheduler jobs describe sql-auto-stop-scheduler \
  --location=asia-south1

# Force manual run
gcloud scheduler jobs run sql-auto-stop-scheduler \
  --location=asia-south1
```

### Function not stopping SQL?
```bash
# Check function logs
gcloud functions logs read sql-auto-stop \
  --region=asia-south1 --limit=20 --follow

# Check if dry-run is enabled
terraform output | grep dry_run
```

### Want to disable without deleting?
```bash
# Pause scheduler (resources still exist in Terraform)
gcloud scheduler jobs pause sql-auto-stop-scheduler \
  --location=asia-south1

# Resume later
gcloud scheduler jobs resume sql-auto-stop-scheduler \
  --location=asia-south1
```

## 📚 Related Documentation

- [Full Deployment Guide](TERRAFORM_SQL_AUTOSTOP_DEPLOYMENT.md)
- [Migration Guide](TERRAFORM_MIGRATION_GUIDE.md)
- [Summary](TERRAFORM_SQL_AUTOSTOP_SUMMARY.md)
- [Module README](infrastructure/terraform/modules/sql-autostop/README.md)

## ✅ Deployment Checklist

- [ ] Function source zipped with `prepare-function.sh`
- [ ] Path added to `terraform.tfvars`
- [ ] `terraform plan` reviewed
- [ ] `terraform apply` completed
- [ ] `terraform output` shows function URI
- [ ] Function test succeeds
- [ ] Scheduler is ENABLED
- [ ] Cloud SQL instance responds
- [ ] Changes committed to git

## 🔄 Environment-Specific Usage

### Preprod (Development/Testing)
```hcl
sql_autostop_idle_minutes = 30         # Stop faster for dev
sql_autostop_dry_run_mode = false      # Actually stop
```

### Production (When Needed)
```hcl
sql_autostop_idle_minutes = 60         # Longer threshold
sql_autostop_dry_run_mode = true       # Test mode initially
```

## 🎓 Understanding the Module

The module creates a system that:

1. **Every 30 minutes** (Cloud Scheduler job triggers)
2. **Cloud Function runs** which:
   - Checks if Cloud SQL instance is running
   - Queries Cloud Monitoring for active connections
   - If **no connections for 30 minutes** → stops the instance
   - Logs the action and status

3. **When your pipeline needs SQL:**
   - Start instance: `gcloud sql instances patch ... --activation-policy=ALWAYS`
   - Use instance normally
   - Function auto-stops after idle threshold

This is **fully automated** after the initial Terraform deployment.

---

**Last Updated:** January 15, 2026
**Status:** Ready for Deployment
**Tested:** Yes ✓
