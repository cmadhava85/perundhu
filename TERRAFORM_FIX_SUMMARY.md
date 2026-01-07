# Terraform 409 Error - Resolution & Prevention

## What Happened

You encountered a Terraform error when running `terraform apply`:
```
Error: Error creating Network: googleapi: Error 409: The resource 'projects/astute-strategy-406601/global/networks/perundhu-preprod-vpc' already exists, alreadyExists
```

This occurred because:
1. The VPC network resource was already created in GCP (manually or by a previous process)
2. Terraform state didn't have a record of this resource
3. When Terraform tried to create it, GCP rejected with a 409 (Already Exists) error

## How We Fixed It

✅ **Imported existing VPC resources into Terraform state**

The following resources were successfully imported:
- `google_compute_network.vpc_network` - The VPC network itself
- `google_compute_router.router` - NAT router
- `google_vpc_access_connector.connector` - VPC connector for Cloud Run
- `google_compute_firewall.*` - All firewall rules
- `google_compute_global_address.private_ip_address` - Private IP range
- `google_service_networking_connection.private_vpc_connection` - Service peering connection

After import, Terraform state now matches the existing GCP infrastructure.

## Changes Made to Prevent Future Issues

### 1. **Updated VPC Module** (`infrastructure/terraform/modules/vpc/main.tf`)
   - ✅ Fixed hardcoded connector name → now uses variables
   - ✅ Added `prevent_destroy = true` to VPC network resource
   - This prevents accidental deletion of critical infrastructure

### 2. **Created Import Guide** (`infrastructure/terraform/IMPORT_GUIDE.md`)
   - Step-by-step instructions for importing resources
   - Covers all modules (VPC, Database, IAM, etc.)
   - Documents best practices and troubleshooting

### 3. **Added Terraform Validation Workflow** (`.github/workflows/tf-validate.yml`)
   - Automatically validates Terraform on every push to `main`/`master`
   - Detects "409 already exists" errors BEFORE deployment
   - Runs `terraform plan` to catch issues early
   - Provides clear guidance when issues are found

### 4. **Enhanced CD Pipeline** (`.github/workflows/cd-preprod-auto.yml`)
   - Added link to import guide in deployment summary
   - Better error context for infrastructure issues

## Next Steps

1. **Verify the infrastructure is healthy**
   ```bash
   cd infrastructure/terraform/environments/preprod
   terraform plan -var="project_id=astute-strategy-406601" -var="notification_email=alerts@perundhu.com"
   ```
   Expected: `No changes. Your infrastructure matches the configuration.`

2. **Proceed with your deployment** - The infrastructure is now tracked and safe

3. **Follow best practices going forward**:
   - Always use Terraform for infrastructure changes
   - Use `terraform plan` before `terraform apply`
   - Never manually create infrastructure in GCP
   - Let the CI/CD pipeline manage deployments

## Prevention: How to Avoid This in the Future

### ❌ DON'T:
- Manually create infrastructure in GCP console
- Deploy using gcloud commands directly
- Skip `terraform plan` reviews

### ✅ DO:
- Use Terraform configuration files for all infrastructure
- Test with `terraform plan` in local dev environment
- Commit Terraform changes to git with proper reviews
- Let GitHub Actions handle deployments via CI/CD
- Keep `terraform.tfstate` backed up in Google Cloud Storage
- Use `terraform import` if you inherit existing infrastructure

## State Lock Considerations

During the fix, you may have encountered state lock errors. These happen when:
- A deployment is already in progress
- A previous deployment crashed and left the lock
- Multiple developers are deploying simultaneously

**Solutions:**
```bash
# Check lock status
terraform state list

# Force unlock (use only if you're certain no one else is deploying)
terraform force-unlock <LOCK_ID>

# Apply without locks (for emergencies only)
terraform apply -lock=false
```

⚠️  **Avoid using `-lock=false` in production workflows** - it can cause state corruption.

## Useful Terraform Commands

```bash
cd infrastructure/terraform/environments/preprod

# Validate configuration without applying
terraform validate

# Show what would change (safe to run frequently)
terraform plan

# See current state
terraform state list
terraform state show 'module.vpc.google_compute_network.vpc_network'

# Refresh state from GCP (safe)
terraform refresh

# Import a resource
terraform import 'module.vpc.google_compute_network.vpc_network' 'projects/astute-strategy-406601/global/networks/perundhu-preprod-vpc'
```

## Questions?

Refer to:
- **Import procedures**: [infrastructure/terraform/IMPORT_GUIDE.md](../../infrastructure/terraform/IMPORT_GUIDE.md)
- **Module details**: `infrastructure/terraform/modules/*/main.tf`
- **Pipeline details**: `.github/workflows/cd-preprod-auto.yml`

---

**Last Updated**: 2026-01-07
**Status**: ✅ Resolved
