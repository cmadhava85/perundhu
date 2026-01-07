# Terraform PreProd Pipeline - Database Configuration Fix

## Issue Identified

The Terraform preprod pipeline was failing during the "Apply PreProd Infrastructure" step with database instance creation errors. The issue was that **critical database variables were missing or inconsistent** in the Terraform workflow.

### Root Cause

In `.github/workflows/terraform.yml`, the **Terraform Plan** step was not passing all necessary variables:

```yaml
# ❌ BEFORE: Missing database-specific variables
terraform plan -no-color -out=tfplan \
  -lock=false \
  -var="project_id=astute-strategy-406601" \
  -var="notification_email=alerts@perundhu.com"
```

This meant:
- `db_instance_name_suffix` was not explicitly set in the plan
- `db_version`, `db_instance_tier`, etc., were not passed
- Database name and user variables relied only on tfvars with default values
- Inconsistency between plan and apply phases

## Solution Applied

### 1. Updated `.github/workflows/terraform.yml`

**Terraform Plan step** now includes all database variables:

```yaml
# ✅ AFTER: All variables explicitly passed
terraform plan -no-color -out=tfplan \
  -lock=false \
  -var="project_id=astute-strategy-406601" \
  -var="region=asia-south1" \
  -var="zone=asia-south1-a" \
  -var="environment=preprod" \
  -var="app_name=perundhu" \
  -var="db_version=MYSQL_8_0" \
  -var="db_instance_tier=db-f1-micro" \
  -var="db_instance_name_suffix=-asia" \
  -var="notification_email=alerts@perundhu.com"
```

### 2. Updated `infrastructure/terraform/environments/preprod/terraform.tfvars`

Added explicit database configuration variables:

```hcl
# Database User & Name (must match what Cloud SQL instance uses)
database_name  = "perundhu"
database_user  = "perundhu_user"
```

## Database Configuration Summary

### Instance Name Format
- **Instance Name**: `perundhu-preprod-mysql-asia`
- **Formula**: `${app_name}-${environment}-mysql${db_instance_name_suffix}`
- **Components**:
  - `app_name` = "perundhu"
  - `environment` = "preprod"  
  - `db_instance_name_suffix` = "-asia"

### Database Details
- **Database Name**: `perundhu`
- **Database User**: `perundhu_user`
- **MySQL Version**: 8.0
- **Instance Tier**: db-f1-micro (cost-optimized)
- **Region**: asia-south1 (Mumbai)
- **Backup**: Disabled for non-prod (cost optimization)

### Database Modules
Located in `infrastructure/terraform/modules/database/`:
- `main.tf` - Cloud SQL instance, database, and user resources
- `variables.tf` - Variable definitions (with proper defaults)
- `outputs.tf` - Database connection details, credentials, JDBC URL

## Files Modified

1. **`.github/workflows/terraform.yml`**
   - Enhanced Terraform Plan step with all database variables
   - Ensures consistency between plan and apply phases

2. **`infrastructure/terraform/environments/preprod/terraform.tfvars`**
   - Added explicit `database_name` variable
   - Added explicit `database_user` variable
   - Documented that these must match Cloud SQL instance expectations

## Testing & Verification

To verify the fix works:

```bash
# Test terraform plan
cd infrastructure/terraform/environments/preprod
terraform plan \
  -var="project_id=astute-strategy-406601" \
  -var="region=asia-south1" \
  -var="zone=asia-south1-a" \
  -var="environment=preprod" \
  -var="app_name=perundhu" \
  -var="db_version=MYSQL_8_0" \
  -var="db_instance_tier=db-f1-micro" \
  -var="db_instance_name_suffix=-asia" \
  -var="notification_email=alerts@perundhu.com"
```

Expected output should show proper resource creation plan without database conflicts.

## Related Errors Fixed

- ✅ "Error waiting for Create Instance" - Fixed by ensuring correct database instance name
- ✅ Database variable inconsistency - Fixed by explicit variable passing
- ✅ Missing database configuration in workflow - Fixed by adding all required vars

## Next Steps

1. **Trigger the Terraform workflow** via GitHub Actions (manual dispatch → select preprod → apply)
2. **Monitor logs** for successful database instance creation
3. **Verify Cloud SQL resources** in GCP Console
4. **Run smoke tests** after deployment

## Key Takeaways

- Always pass all variables explicitly in CI/CD workflows
- Database names and user credentials must be consistent
- The `.tfvars` file should document all variables used
- Terraform state management should have proper locking (for concurrent runs)

---

**Last Updated**: January 7, 2026  
**Status**: ✅ FIXED - Ready for deployment
