# Terraform Cloud SQL Authorization Issue - FIX GUIDE

**Date**: February 12, 2026  
**Issue**: Error 403: The client is not authorized to make this request  
**Status**: ✅ FIXED with variable declarations and import instructions

---

## Problem Summary

Terraform encountered two issues:

1. **Undeclared Variables** (✅ FIXED)
   - `db_activation_policy` was used but not declared in variables.tf
   - `use_public_ip` was used by the database module but not passed from main.tf

2. **Authorization Error** (⏳ NEEDS IMPORT)
   - Cloud SQL instance `perundhu-production-mysql` already exists in GCP
   - Service account doesn't have permission to manage it
   - Terraform needs to import the existing resource

---

## What Was Fixed

### 1. Added Missing Variable Declaration ✅
**File**: `infrastructure/terraform/environments/production/variables.tf`

```hcl
variable "db_activation_policy" {
  description = "Database activation policy (ALWAYS, NEVER, or ON_DEMAND)"
  type        = string
  default     = "ALWAYS"
}

variable "use_public_ip" {
  description = "Use public IP instead of private IP for Cloud SQL (for cost savings)"
  type        = bool
  default     = true
}
```

### 2. Updated Main Terraform Configuration ✅
**File**: `infrastructure/terraform/environments/production/main.tf`

Added missing variable passing to database module:
- `use_public_ip = var.use_public_ip`
- `db_activation_policy = var.db_activation_policy`

### 3. Updated Terraform Variables ✅
**File**: `infrastructure/terraform/environments/production/terraform.tfvars`

Added configuration:
```hcl
use_public_ip = true  # Use public IP for cost savings (no VPC Connector needed)
```

---

## Solution: Import Existing Cloud SQL Instance

The Cloud SQL instance already exists in GCP. You have TWO options:

### Option A: Import Existing Resource (RECOMMENDED)

This tells Terraform to manage the existing instance:

```bash
cd /Users/mchand69/Documents/perundhu/infrastructure/terraform/environments/production

# Import the existing Cloud SQL instance
terraform import module.database.google_sql_database_instance.mysql_instance \
  projects/perundhu-prod-001/instances/perundhu-production-mysql
```

**Expected output**:
```
google_sql_database_instance.mysql_instance: Importing from ID "projects/perundhu-prod-001/instances/perundhu-production-mysql"...
google_sql_database_instance.mysql_instance: Import successful!

Import successful! Resources imported.
```

### Option B: Use Data Source Instead (ALTERNATIVE)

If you want Terraform to only read the instance (not manage it), use a data source:

**File**: `infrastructure/terraform/modules/database/main.tf`

Replace the resource with a data source:

```hcl
# Instead of creating/managing the instance, read the existing one
data "google_sql_database_instance" "mysql_instance" {
  name    = "${var.app_name}-${var.environment}-mysql${var.db_instance_name_suffix}"
  project = var.project_id
}
```

Then update outputs to reference the data source instead of the resource.

---

## After Importing: Validate and Plan

Once you've imported the resource:

```bash
# Validate configuration
terraform validate
# Output: Success! The configuration is valid.

# Create a new plan
terraform plan -out=tfplan
# This should show minimal changes

# Apply the plan
terraform apply tfplan
```

---

## Step-by-Step Fix Instructions

### Step 1: Verify Variable Fixes ✅
```bash
cd /Users/mchand69/Documents/perundhu/infrastructure/terraform/environments/production

# Check that variables are declared
grep -A 3 "db_activation_policy" variables.tf
grep -A 3 "use_public_ip" variables.tf

# Expected: Both variables should be found
```

### Step 2: Validate Configuration ✅
```bash
terraform validate

# Expected: Success! The configuration is valid.
```

### Step 3: Import Existing Cloud SQL Instance ⏳
```bash
# Import the existing instance
terraform import module.database.google_sql_database_instance.mysql_instance \
  projects/perundhu-prod-001/instances/perundhu-production-mysql

# Expected: "Import successful!"
```

### Step 4: Create New Plan
```bash
terraform plan -out=tfplan

# Expected: May show minor updates to match Terraform configuration
# (activation_policy, backup settings, etc.)
```

### Step 5: Apply Plan
```bash
terraform apply tfplan

# Expected: "Apply complete! Resources: X added, X changed, X destroyed."
```

---

## Troubleshooting

### If Import Fails: "Resource not found"

**Cause**: Instance name mismatch or wrong project  
**Solution**: Verify instance exists:

```bash
gcloud sql instances list --project=perundhu-prod-001

# Look for: perundhu-production-mysql
```

### If Authorization Error Persists

**Cause**: Service account lacks Cloud SQL permissions  
**Solution**: Grant permissions to service account:

```bash
# Get service account email
SA_EMAIL="cloud-run-sa@perundhu-prod-001.iam.gserviceaccount.com"

# Grant Cloud SQL Client role
gcloud projects add-iam-policy-binding perundhu-prod-001 \
  --member=serviceAccount:$SA_EMAIL \
  --role=roles/cloudsql.client

# Grant Cloud SQL Instance User role
gcloud projects add-iam-policy-binding perundhu-prod-001 \
  --member=serviceAccount:$SA_EMAIL \
  --role=roles/cloudsql.instanceUser
```

### If Activation Policy Mismatch

**Issue**: Terraform wants to change `activation_policy` to "NEVER" but current is "ALWAYS"

**Solution**: Either:

1. Update tfvars to match current state:
   ```hcl
   db_activation_policy = "ALWAYS"  # Match current state
   ```

2. Or let Terraform update it (if you want to stop/start database for cost savings):
   ```hcl
   db_activation_policy = "NEVER"   # Terraform will update this
   ```

---

## Verification

After successful import and apply:

```bash
# Verify resource is imported
terraform state list | grep mysql_instance
# Expected: module.database.google_sql_database_instance.mysql_instance

# Check resource details
terraform state show module.database.google_sql_database_instance.mysql_instance
# Expected: Shows all Cloud SQL instance details

# Verify instance in GCP
gcloud sql instances describe perundhu-production-mysql --project=perundhu-prod-001
# Expected: Shows instance configuration
```

---

## Next Steps

1. ✅ **Done**: Fixed variable declarations
2. ⏳ **TODO**: Import existing Cloud SQL instance (follow Step 3 above)
3. ⏳ **TODO**: Create and apply Terraform plan
4. ⏳ **TODO**: Build and deploy Docker images
5. ⏳ **TODO**: Deploy to Cloud Run

---

## Summary of Changes

| File | Change | Status |
|------|--------|--------|
| variables.tf | Added `db_activation_policy` variable | ✅ Done |
| variables.tf | Added `use_public_ip` variable | ✅ Done |
| main.tf | Added `use_public_ip` to database module | ✅ Done |
| main.tf | Added `db_activation_policy` to database module | ✅ Done |
| terraform.tfvars | Added `use_public_ip = true` | ✅ Done |
| (manual) | Import existing Cloud SQL instance | ⏳ Ready |

---

## Questions?

- **Cloud SQL documentation**: https://cloud.google.com/sql/docs/mysql
- **Terraform Google Provider**: https://registry.terraform.io/providers/hashicorp/google/latest/docs/resources/sql_database_instance
- **Terraform Import**: https://www.terraform.io/cli/commands/import
