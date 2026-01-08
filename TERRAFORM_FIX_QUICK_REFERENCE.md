# 🚀 Database Connection Fix - Quick Reference

## What Was Wrong?

Your Terraform pipeline was failing because **database variables were missing** from the environment configuration.

## What Was Fixed?

### 1. **Added Missing Variables**
- ✅ `database_name = "perundhu"`
- ✅ `database_user = "perundhu_user"`

Added to:
- `infrastructure/terraform/environments/preprod/variables.tf`
- `infrastructure/terraform/environments/production/variables.tf`

### 2. **Updated Module References**
- ✅ Pass variables to database module in main.tf
- ✅ Both preprod and production environments

### 3. **Fixed Terraform Pipeline**
- ✅ Preprod terraform plan now includes database variables
- ✅ Production terraform plan now includes database variables
- ✅ `.github/workflows/terraform.yml` updated

### 4. **Enhanced Secret Management**
- ✅ Secrets now properly rotate versions
- ✅ No downtime when updating credentials

## Verification Status

```
✅ terraform validate (preprod): Success!
✅ terraform validate (production): Success!
✅ terraform plan (preprod): Success! All variables resolved
✅ No syntax or compilation errors
```

## Database Setup After Fix

| Component | Value |
|-----------|-------|
| Database Name | `perundhu` |
| Database User | `perundhu_user` |
| Instance Name (Preprod) | `perundhu-preprod-mysql` |
| Instance Name (Prod) | `perundhu-production-mysql` |
| MySQL Version | 8.0 |
| Region | asia-south1 |
| Network Type | Private IP (VPC) |
| Connection Method | Cloud SQL Proxy |

## To Deploy Now

### Option 1: Via GitHub Actions Workflow
```bash
# Push your code or manually trigger the workflow
git push origin master

# Or use GitHub UI:
# 1. Go to Actions
# 2. Select "Terraform Infrastructure"
# 3. Click "Run workflow"
# 4. Select "preprod" and "plan"
```

### Option 2: Via CLI
```bash
cd infrastructure/terraform/environments/preprod

# Validate
terraform validate

# Plan
terraform plan \
  -var="project_id=astute-strategy-406601" \
  -var="database_name=perundhu" \
  -var="database_user=perundhu_user"

# Apply (when ready)
terraform apply tfplan
```

## What Changed in Each File

### 1. `variables.tf` (Preprod & Production)
```diff
+ variable "database_name" { ... }
+ variable "database_user" { ... }
```

### 2. `main.tf` (Preprod & Production)
```diff
module "database" {
  ...
+ database_name = var.database_name
+ database_user = var.database_user
}
```

### 3. `.github/workflows/terraform.yml`
```diff
terraform plan \
+ -var="database_name=perundhu" \
+ -var="database_user=perundhu_user" \
```

### 4. `terraform/modules/secrets/main.tf`
```diff
lifecycle {
+ create_before_destroy = true
}
```

## Testing Connection After Deployment

```bash
# 1. Check instance exists
gcloud sql instances describe perundhu-preprod-mysql \
  --project=astute-strategy-406601

# 2. Start Cloud SQL Proxy
cloud_sql_proxy \
  -instances=astute-strategy-406601:asia-south1:perundhu-preprod-mysql=tcp:3306 &

# 3. Test connection
mysql -h 127.0.0.1 -P 3306 \
  -u perundhu_user -p \
  -e "SELECT 1 as connection_test;"

# 4. Verify database exists
mysql -h 127.0.0.1 -P 3306 \
  -u perundhu_user -p \
  -e "SHOW DATABASES LIKE 'perundhu';"
```

## Common Issues & Fixes

| Issue | Cause | Fix |
|-------|-------|-----|
| "Value for undeclared variable" | Variables missing from variables.tf | ✅ Fixed - variables added |
| "Plan step fails" | Database vars not passed to terraform | ✅ Fixed - vars added to workflow |
| "Cloud SQL instance not created" | VPC connectivity issue | Check servicenetworking API enabled |
| "Connection timeout" | Firewall blocking access | Verify security groups allow 3306 |
| "Authentication failed" | Wrong credentials | Check Secret Manager has correct values |

## Important Notes

⚠️ **Secrets Rotation**:
- If `db-username` or `db-password` secrets already exist, Terraform will create new versions
- No manual updates needed - Cloud Run automatically uses latest version
- Old versions are kept as backup

⚠️ **State Management**:
- Terraform state stored in: `gs://astute-strategy-406601-tf-state/preprod/state/`
- State is locked during operations (auto-released after 2 hours)
- Don't modify state manually

⚠️ **Costs**:
- Preprod uses `db-f1-micro` (smallest/cheapest tier)
- HDD storage (cheaper than SSD) - 10GB initial
- Auto-scales up to 20GB if needed

## Need More Help?

See detailed documentation: `TERRAFORM_DATABASE_CONNECTION_FIX.md`

For Cloud SQL details: `CLOUD_SQL_COMPLETE_REFERENCE.md`

For deployment steps: `PREPROD_DEPLOYMENT_GUIDE.md`

---

**All systems ready for deployment!** ✅
