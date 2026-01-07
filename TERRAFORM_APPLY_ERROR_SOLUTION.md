# Terraform Apply Errors - Complete Analysis & Solution

## Issue Reported
Terraform apply step failing with multiple **Error 409: Resource already exists** errors:
- `perundhu-preprod-backend` (Cloud Run service)
- `preprod-db-url` (Secret)
- `preprod-db-username` (Secret)
- `preprod-db-password` (Secret) 
- `preprod-jwt-secret` (Secret)

**Root Cause:** Terraform state in GCS doesn't reflect existing resources in GCP.

---

## Recommended Solution: Re-Create Resources

Since state is corrupted and imports are complex with modular architecture, the cleanest solution is:

1. **Delete existing resources from GCP** (except database - keep it!)
2. **Let Terraform create them fresh** via apply
3. **State will be automatically tracked**

### Step 1: Delete Conflicting Resources

```bash
# Delete Cloud Run service
gcloud run services delete perundhu-preprod-backend \
  --region=asia-south1 \
  --project=astute-strategy-406601 \
  --quiet

# Delete Secrets (keep data-encryption-key for now, it's safe)
for secret in preprod-db-url preprod-db-username preprod-db-password preprod-jwt-secret; do
  gcloud secrets delete "$secret" \
    --project=astute-strategy-406601 \
    --quiet || echo "Secret $secret not found"
done

# Clean up old secret if it exists
gcloud secrets delete perundhu-preprod-db-password \
  --project=astute-strategy-406601 \
  --quiet || echo "Old secret not found"
```

### Step 2: Verify Deletions

```bash
# Verify Cloud Run service is gone
gcloud run services list \
  --region=asia-south1 \
  --project=astute-strategy-406601 \
  --format="value(metadata.name)"
# Should NOT show: perundhu-preprod-backend

# Verify secrets are gone
gcloud secrets list \
  --project=astute-strategy-406601 \
  --filter="name:^preprod-*" \
  --format="value(name)"
# Should NOT show: preprod-db-url, preprod-db-username, preprod-db-password, preprod-jwt-secret
```

### Step 3: Run Terraform Apply

```bash
cd infrastructure/terraform/environments/preprod

terraform init

terraform plan -no-color \
  -var="project_id=astute-strategy-406601" \
  -var="region=asia-south1" \
  -var="zone=asia-south1-a" \
  -var="environment=preprod" \
  -var="app_name=perundhu" \
  -var="db_version=MYSQL_8_0" \
  -var="db_instance_tier=db-f1-micro" \
  -var="db_instance_name_suffix=-asia" \
  -var="notification_email=alerts@perundhu.com" \
  -out=tfplan

# Review the plan - should see resources being CREATED

terraform apply tfplan
```

### Step 4: Verify via GitHub Actions

1. Go to: [GitHub Actions - Terraform Infrastructure](https://github.com/cmadhava85/perundhu/actions/workflows/terraform.yml)
2. Click **Run workflow**
3. Select: `environment: preprod`, `action: plan`
4. Run workflow and verify plan shows new resources
5. Re-run with `action: apply`

---

## What Happens During Recreation

**Deleted & Recreated:**
- ✅ `perundhu-preprod-backend` Cloud Run service
- ✅ `preprod-db-url` Secret
- ✅ `preprod-db-username` Secret
- ✅ `preprod-db-password` Secret
- ✅ `preprod-jwt-secret` Secret

**Preserved (untouched):**
- ✅ `perundhu-preprod-mysql-asia` Cloud SQL instance (database itself is safe!)
- ✅ All VPC networking resources
- ✅ IAM roles and service accounts
- ✅ Storage buckets

**Why it's safe:**
- Cloud Run service: Can be recreated with exact same config → deployed app may have brief downtime (~30s)
- Secrets: Will be recreated with same values from database module
- Database: Never touched, all data preserved

---

## Why This Happens

1. **Previous Deployments**: Resources were created via manual `gcloud` commands or CI/CD
2. **State Loss/Corruption**: GCS state file doesn't reflect these resources
3. **Terraform Unaware**: Terraform thinks resources don't exist → tries to create them → conflict

---

## Prevention for Future

1. **Always use Terraform**: Don't create GCP resources manually
2. **Check state before apply**: Run `terraform plan` first
3. **Lock state**: Use state locking (already enabled in GCS)
4. **Use GitHub Actions**: Centralize all Terraform runs via workflow

---

## Alternative: Manual State Fix (Advanced)

If you want to keep the resources running without deletion:

```bash
cd infrastructure/terraform/environments/preprod

# Import Cloud Run service (use module path)
terraform import module.cloud_run.google_cloud_run_service.backend \
  "astute-strategy-406601/asia-south1/perundhu-preprod-backend"

# Import secrets (as separate resources in module)
# This is complex due to module architecture - may require code changes
```

However, this approach is **complex** and **error-prone** with modules. The deletion approach is cleaner.

---

## Execution Checklist

- [ ] Back up any critical data (database is safe, no action needed)
- [ ] Delete Cloud Run service: `gcloud run services delete perundhu-preprod-backend --quiet`
- [ ] Delete secrets: `for s in preprod-db-url preprod-db-username preprod-db-password preprod-jwt-secret; do gcloud secrets delete "$s" --quiet; done`
- [ ] Verify deletions with list commands
- [ ] Run Terraform plan locally
- [ ] Review plan output
- [ ] Run Terraform apply (or via GitHub Actions)
- [ ] Verify new resources are created
- [ ] Test application connectivity

---

## Related Files & Links

- **Workflow**: [.github/workflows/terraform.yml](.github/workflows/terraform.yml)
- **PreProd Config**: [infrastructure/terraform/environments/preprod/main.tf](infrastructure/terraform/environments/preprod/main.tf)
- **Cloud Run Module**: [infrastructure/terraform/modules/cloud_run/](infrastructure/terraform/modules/cloud_run/)
- **Secrets Module**: [infrastructure/terraform/modules/secrets/](infrastructure/terraform/modules/secrets/)
- **GCS State Bucket**: `astute-strategy-406601-tf-state/preprod/state`

---

## Need Help?

If `terraform apply` still fails after deletion:
1. Check for remaining resources: `gcloud run services list`, `gcloud secrets list`
2. Force delete: `gcloud run services delete --name --region --project --force`
3. Check state lock: `terraform state list` (or unlock if stuck)
4. Review full apply output for specific error

