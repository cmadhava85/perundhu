# Import Existing Infrastructure into Terraform

This guide helps you import your existing GCP resources into Terraform without recreating them.

## Prerequisites

1. ✅ You have existing infrastructure running in GCP
2. ✅ You have Terraform installed locally
3. ✅ You have gcloud CLI configured and authenticated

## Current Infrastructure

Based on your setup, you have:
- **Cloud SQL**: `perundhu-preprod-mysql` (us-central1, MYSQL_8_0)
- **Service Account**: `perundhu@astute-strategy-406601.iam.gserviceaccount.com`
- **Secrets**: `preprod-db-password`, `preprod-jwt-secret`, `perundhu-preprod-db-password`
- **Cloud Run**: `perundhu-backend-preprod`, `perundhu-frontend-preprod` (asia-south1)

## Step-by-Step Import Process

### Step 1: Create terraform.tfvars

```bash
cd infrastructure/terraform/environments/preprod
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your email for notifications
```

### Step 2: Verify Terraform Modules Match Your Setup

Before importing, you need to ensure your Terraform configuration matches your existing resources. Check:

1. **Database tier** - Run this to see your current tier:
   ```bash
   gcloud sql instances describe perundhu-preprod-mysql --format="value(settings.tier)"
   ```

2. **Cloud Run settings** - Check memory, CPU, etc.:
   ```bash
   gcloud run services describe perundhu-backend-preprod --region=asia-south1 --format=yaml
   ```

### Step 3: Initialize Terraform

```bash
cd infrastructure/terraform/environments/preprod
terraform init
```

This creates the state bucket if needed.

### Step 4: Run Import Script

**Option A: Use the automated script**
```bash
cd infrastructure/terraform
./import-existing-resources.sh
```

**Option B: Import manually (recommended for first time)**

Import each resource one by one so you can see what's happening:

```bash
cd infrastructure/terraform/environments/preprod

# 1. Import Cloud SQL instance
terraform import 'module.database.google_sql_database_instance.mysql_instance' \
  'astute-strategy-406601/perundhu-preprod-mysql'

# 2. Import database
terraform import 'module.database.google_sql_database.database' \
  'astute-strategy-406601/perundhu-preprod-mysql/perundhu'

# 3. Import database user
terraform import 'module.database.google_sql_user.users' \
  'astute-strategy-406601/perundhu-preprod-mysql/perundhu_user'

# 4. Import service account
terraform import 'module.iam.google_service_account.backend' \
  'projects/astute-strategy-406601/serviceAccounts/perundhu@astute-strategy-406601.iam.gserviceaccount.com'

# 5. Import secrets
terraform import 'module.secrets.google_secret_manager_secret.db_password' \
  'projects/astute-strategy-406601/secrets/preprod-db-password'

terraform import 'module.secrets.google_secret_manager_secret.jwt_secret' \
  'projects/astute-strategy-406601/secrets/preprod-jwt-secret'

# 6. Import Cloud Run services (if managed by Terraform - skip for now if deployed via GitHub Actions)
# terraform import 'module.cloud_run.google_cloud_run_service.backend' \
#   'locations/asia-south1/namespaces/astute-strategy-406601/services/perundhu-backend-preprod'
```

### Step 5: Review Terraform Plan

After importing, run:

```bash
terraform plan
```

**Expected outcomes:**

✅ **Best case**: "No changes. Your infrastructure matches the configuration."

⚠️ **Common case**: Terraform shows differences. This means your `.tf` files don't exactly match your existing resources. 

**To fix differences:**

1. Look at what Terraform wants to change
2. Update your `.tf` files to match existing resources
3. Run `terraform plan` again
4. Repeat until plan shows "No changes"

### Step 6: Document State

Once imports are complete and plan shows no changes:

```bash
# Save the current state for reference
terraform show > current-state.txt
```

## Common Issues and Solutions

### Issue: "Resource already exists"
**Solution**: The resource is already imported. Skip it.

### Issue: Terraform wants to recreate resources
**Solution**: Your Terraform config doesn't match existing setup. Update the `.tf` files to match.

### Issue: Can't import Cloud Run service
**Solution**: Cloud Run services are deployed by CI/CD, not managed by Terraform. Remove them from your Terraform config or use data sources instead:

```hcl
data "google_cloud_run_service" "backend" {
  name     = "perundhu-backend-preprod"
  location = "asia-south1"
}
```

### Issue: Password mismatch
**Solution**: Terraform generates a random password, but you already have one. Either:
- Import the existing secret value
- Or update the existing password to match Terraform's generated one (requires downtime)

## What NOT to Import

Some resources should stay managed by CI/CD:
- ❌ Cloud Run services (deployed by GitHub Actions)
- ❌ Container images
- ❌ Deployment configurations

These change frequently and are better managed by your CD pipeline.

## Next Steps After Import

1. **Test carefully**: Run `terraform plan` frequently
2. **Don't apply yet**: Wait until plan shows zero changes
3. **Document**: Keep notes on what you imported
4. **Backup**: Keep a backup of your current setup before making Terraform changes

## Rollback Plan

If something goes wrong:
1. Your existing infrastructure is NOT affected by imports
2. Just delete the Terraform state: `rm -rf .terraform terraform.tfstate*`
3. Your resources continue working as before
4. GitHub Actions CD pipeline still works

## Questions?

Check the Terraform output carefully. Import is safe - it only records existing resources, doesn't modify them.
