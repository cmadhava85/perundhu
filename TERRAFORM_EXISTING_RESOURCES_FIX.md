# Terraform Existing Resources Fix

## Problem
Terraform apply was failing with Error 409: Resource already exists:
```
Error creating Service: googleapi: Error 409: Resource 'perundhu-preprod-backend' already exists.
Error creating Secret: googleapi: Error 409: Secret [.../preprod-db-url] already exists.
Error creating Secret: googleapi: Error 409: Secret [.../preprod-db-username] already exists.
Error creating Secret: googleapi: Error 409: Secret [.../preprod-db-password] already exists.
Error creating Secret: googleapi: Error 409: Secret [.../preprod-jwt-secret] already exists.
```

## Root Cause
**State mismatch**: Resources exist in GCP but Terraform state file (in GCS) is out of sync.

**Existing GCP Resources:**
```
Cloud Run service: perundhu-preprod-backend
Secrets:
  - preprod-db-url
  - preprod-db-username
  - preprod-db-password
  - preprod-jwt-secret
  - preprod-data-encryption-key
```

## Solution

### Option 1: Clean State Reset (RECOMMENDED - Nuclear Option)
If the imported state gets corrupted or has schema mismatches, reset everything:

```bash
cd infrastructure/terraform/environments/preprod

# 1. Backup current state (optional but recommended)
gsutil cp gs://astute-strategy-406601-tf-state/preprod/state/terraform.tfstate \
  /tmp/terraform-state-backup.tfstate

# 2. Delete state file completely
terraform state list | while read resource; do
  terraform state rm "$resource" || true
done

# 3. Or force delete via GCS (if above doesn't work)
gsutil rm gs://astute-strategy-406601-tf-state/preprod/state/terraform.tfstate*

# 4. Re-initialize Terraform (creates fresh state)
rm -f .terraform.lock.hcl
terraform init

# 5. Run plan - Terraform will now try to CREATE resources
terraform plan -no-color \
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

### Option 2: Import Existing Resources (PREFERRED)
Import the existing resources into Terraform state:

```bash
cd infrastructure/terraform/environments/preprod
terraform init

# Import Cloud Run service (using module path)
terraform import module.cloud_run.google_cloud_run_service.backend \
  "astute-strategy-406601/asia-south1/perundhu-preprod-backend"

# Import Secrets (using module path)
terraform import module.secrets.google_secret_manager_secret.db_url \
  "projects/astute-strategy-406601/secrets/preprod-db-url"

terraform import module.secrets.google_secret_manager_secret.db_username \
  "projects/astute-strategy-406601/secrets/preprod-db-username"

terraform import module.secrets.google_secret_manager_secret.db_password \
  "projects/astute-strategy-406601/secrets/preprod-db-password"

terraform import module.secrets.google_secret_manager_secret.jwt_secret \
  "projects/astute-strategy-406601/secrets/preprod-jwt-secret"
```

### Option 3: Terraform Refresh (GENTLE)
```bash
cd infrastructure/terraform/environments/preprod

terraform init
terraform refresh \
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

## The Issue in Detail

1. **Terraform state** stored in GCS bucket: `astute-strategy-406601-tf-state/preprod/state`
2. **GCP resources** were created (either manually or via previous Terraform)
3. **State file** doesn't know about them
4. **Next apply** → Terraform tries to CREATE them → Error 409 (already exists)

## Fix Verification

After applying one of the fixes above, verify:

```bash
# Should see "No changes"
terraform plan -no-color \
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

Expected output: 
```
No changes. Your infrastructure matches the configuration.
```

## Workflow to Re-run Terraform

1. Go to: [GitHub Actions - Terraform Infrastructure](https://github.com/cmadhava85/perundhu/actions/workflows/terraform.yml)
2. Click **Run workflow**
3. Select environment: `preprod`
4. Select action: `plan`
5. Click **Run workflow**
6. Review plan output
7. If no errors, re-run with action: `apply`

## Prevention

- Don't use `gcloud` CLI to create resources managed by Terraform
- Always run `terraform plan` before `terraform apply`
- Use GitHub Actions to manage Terraform (avoids local state issues)
- Keep state file in GCS with proper backups

## Related Files
- [.github/workflows/terraform.yml](.github/workflows/terraform.yml) - Terraform CI/CD pipeline
- [infrastructure/terraform/environments/preprod/main.tf](infrastructure/terraform/environments/preprod/main.tf) - PreProd environment config
- [infrastructure/terraform/modules/secrets/main.tf](infrastructure/terraform/modules/secrets/main.tf) - Secrets definition
- [infrastructure/terraform/modules/cloud_run/main.tf](infrastructure/terraform/modules/cloud_run/main.tf) - Cloud Run definition

