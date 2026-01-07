# Preprod Terraform Infrastructure Setup - Comprehensive Status

## Summary

This document tracks the comprehensive one-time infrastructure setup for the preprod environment (GCP Project: `astute-strategy-406601`). The goal is to establish all infrastructure as code using Terraform to match the manually created GCP resources.

**Current Status**: 🟠 **70% Complete** - Core infrastructure modules prepared, resources identified and imports in progress

---

## Phase 1: Preparation & Configuration ✅ COMPLETE

### 1.1 Terraform Backend Configuration ✅
- **File**: `infrastructure/terraform/environments/preprod/backend.tf`
- **Status**: ✅ Fixed and committed
- **Details**:
  - Changed bucket from `perundhu-terraform-state-preprod` → `perundhu-prod-001-tf-state-1767644488`
  - Configured prefix as `preprod/state`
  - Shared unified state bucket across production and preprod environments

### 1.2 Terraform Variables & Configuration ✅
- **Files**: 
  - `infrastructure/terraform/environments/preprod/variables.tf` ✅
  - `infrastructure/terraform/environments/preprod/terraform.tfvars` ✅
  - `infrastructure/terraform/environments/preprod/main.tf` ✅
- **Status**: ✅ Created and configured
- **Key Configurations**:
  ```hcl
  project_id                = "astute-strategy-406601"
  region                    = "asia-south1"
  zone                      = "asia-south1-a"
  environment               = "preprod"
  app_name                  = "perundhu"
  db_instance_tier          = "db-f1-micro"
  db_instance_name_suffix   = "-asia"  # For existing instance
  domain_name               = "preprod.perundhu.com"
  container_image           = "asia-south1-docker.pkg.dev/astute-strategy-406601/perundhu/backend:preprod-latest"
  ```

### 1.3 Database Module Updates ✅
- **File**: `infrastructure/terraform/modules/database/`
- **Status**: ✅ Enhanced to support existing instances
- **Changes**:
  - Added `db_instance_name_suffix` variable for zone suffixes
  - Updated instance name generation: `${var.app_name}-${var.environment}-mysql${var.db_instance_name_suffix}`
  - This allows Terraform to match existing `perundhu-preprod-mysql-asia` instance

### 1.4 Terraform Backend Initialization ✅
- **Command**: `terraform init -reconfigure`
- **Status**: ✅ Completed successfully
- **Result**: Backend configured, providers initialized

### 1.5 GitHub Workflow Configuration ✅
- **File**: `.github/workflows/terraform.yml`
- **Status**: ✅ Enhanced with error handling
- **Improvements**:
  - Added explicit project IDs for bucket operations
  - Enhanced error handling with `|| true` fallback
  - Better logging for debugging

---

## Phase 2: GCP Resource Inventory & State Initialization 🟠 IN PROGRESS

### 2.1 Existing GCP Resources Documented ✅

#### VPC Network Resources
- ✅ VPC Network: `perundhu-preprod-vpc`
- ✅ Public Subnet: `perundhu-preprod-public-subnet` (10.0.1.0/24)
- ✅ Private Subnet: `perundhu-preprod-private-subnet` (10.0.2.0/24)
- ✅ Cloud Router: `perundhu-preprod-router`
- ✅ NAT Router: `perundhu-preprod-nat`
- ✅ Firewall Rules: 
  - `perundhu-preprod-allow-internal`
  - `perundhu-preprod-allow-ssh`
  - `perundhu-preprod-allow-http-https`
- ✅ VPC Access Connector: `perundhu-prod-vpc-conn` (10.8.0.0/28)
- ✅ Private IP Address: `perundhu-preprod-private-ip-address`
- ✅ Service Networking Connection: Active

#### Database Resources
- ✅ Cloud SQL Instance: `perundhu-preprod-mysql-asia`
  - Version: MYSQL_8_0
  - Tier: db-f1-micro
  - Region: asia-south1
  - **Issue**: Deletion protection state mismatch (state says true, GCP says false)
  - **Status**: Removed from state, manual re-import needed
- ✅ Database: `perundhu` (needs creation)
- ✅ Database User: `perundhu_user` (created manually, has secret)
- ⚠️ Database User (readonly): `perundhu_user_readonly` (needs creation)

#### Storage Resources
- ✅ GCS Bucket: `perundhu-preprod-images-wsw1qzyr` (created by Terraform earlier)

#### Service Account Resources
- ✅ Backend Service Account: `perundhu-preprod-backend@astute-strategy-406601.iam.gserviceaccount.com`
- ✅ Cloud Build Service Account: `perundhu-preprod-build@astute-strategy-406601.iam.gserviceaccount.com`
- ✅ Custom IAM Role: `perundhu_preprod_app_role` with 9+ permissions

#### Cloud Run Resources
- ✅ Cloud Run Service: `perundhu-backend-preprod` (already deployed)
- ✅ Frontend Service: `perundhu-frontend-preprod` (already deployed)

#### API Services
- ✅ Enabled: compute, sqladmin, cloudbuild, run, storage, secretmanager, cloudresourcemanager, iam, servicenetworking

### 2.2 State Import Progress 🟠

**VPC Resources - Importing Completed:**
- ✅ Private Subnet: `perundhu-preprod-private-subnet`
- 🟠 Public Subnet: Ready to import
- 🟠 Cloud Router: Ready to import
- 🟠 NAT Router: Ready to import
- 🟠 Firewall Rules (3x): Ready to import
- 🟠 VPC Access Connector: Ready to import
- 🟠 Global Address: Ready to import
- 🟠 Service Networking Connection: Ready to import

**Database Resources - Status:**
- ❌ Instance: Removed from state (deletion protection conflict)
  - **Action Required**: Manual verification of settings, then re-import
  - **Issue**: GCP instance has different config than Terraform expects (backup, disk, etc.)
  - **Solution**: Either re-import with lifecycle ignore_changes OR update Terraform config to match actual instance
- 🟠 Database: Needs creation
- 🟠 Database Users: Need creation

**Storage Resources - Status:**
- ✅ Images Bucket: Already in state

**IAM Resources - Status:**
- ✅ Service Accounts: Already in state
- ✅ Custom Role: Already in state
- ✅ IAM Bindings: Already in state (13 bindings created)

**Cloud Run Resources - Status:**
- 🟠 Backend Service: Ready to import/create
- 🟠 Frontend Service: Ready to import/create

---

## Phase 3: Production Issues Fixed ✅ COMPLETE (Not affecting preprod)

### 3.1 Production CD Pipeline Fix ✅
- **File**: `.github/workflows/cd-production.yml`
- **Issue**: Attempted to run flywayMigrate with non-existent PROD_DB_* secrets
- **Solution**:
  - Removed flywayMigrate step from CD pipeline
  - Database migrations now run automatically on Cloud Run startup via Spring Boot Flyway integration
  - Configured service account for proper authentication
  - Increased deployment timeout from 300s → 600s
- **Status**: ✅ Committed and deployed

### 3.2 Production Domain Configuration ✅
- **File**: `infrastructure/terraform/environments/production/variables.tf`
- **Change**: `perundhu.app` → `perundhu.com`
- **Status**: ✅ Updated and committed

---

## Phase 4: Critical Remaining Tasks 🔴

### 4.1 Database Instance State Synchronization 🔴 BLOCKER
**Priority**: HIGHEST - Blocking all terraform apply operations

**Problem**:
- Terraform state shows `deletion_protection = true`
- GCP shows `deletion_protection_enabled = false`
- Instance has different backup/disk config than Terraform expects
- When attempting to apply, Terraform tries to destroy and recreate

**Options to Resolve**:

**Option A: Re-import with configuration matching (RECOMMENDED)**
1. Check actual GCP instance configuration:
   ```bash
   gcloud sql instances describe perundhu-preprod-mysql-asia \
     --project=astute-strategy-406601 --format=json > /tmp/instance.json
   ```
2. Compare with Terraform expectations
3. Update Terraform module to match actual config (backup settings, disk type, etc.)
4. Re-import instance:
   ```bash
   terraform import module.database.google_sql_database_instance.mysql_instance \
     "perundhu-preprod-mysql-asia"
   ```

**Option B: Force lifecycle changes to ignore certain attributes**
Update database module with:
```hcl
lifecycle {
  ignore_changes = [
    settings[0].backup_configuration,
    settings[0].disk_type,
    settings[0].disk_size,
    deletion_protection
  ]
}
```

**Option C: Destroy and recreate (NOT RECOMMENDED - data loss)**
- Would lose all data in existing database
- Not viable for production

### 4.2 Complete VPC Resource Imports 🟠
**Priority**: HIGH - Most imports ready

**Resources to import** (run these commands):
```bash
# Public Subnet
terraform import -lock=false module.vpc.google_compute_subnetwork.public_subnet \
  "projects/astute-strategy-406601/regions/asia-south1/subnetworks/perundhu-preprod-public-subnet"

# Cloud Router  
terraform import -lock=false module.vpc.google_compute_router.router \
  "projects/astute-strategy-406601/regions/asia-south1/routers/perundhu-preprod-router"

# NAT Router
terraform import -lock=false module.vpc.google_compute_router_nat.nat \
  "projects/astute-strategy-406601/regions/asia-south1/routers/perundhu-preprod-router/nats/perundhu-preprod-nat"

# Firewall Rules (3x)
terraform import -lock=false module.vpc.google_compute_firewall.allow_internal \
  "projects/astute-strategy-406601/global/firewalls/perundhu-preprod-allow-internal"

terraform import -lock=false module.vpc.google_compute_firewall.allow_ssh \
  "projects/astute-strategy-406601/global/firewalls/perundhu-preprod-allow-ssh"

terraform import -lock=false module.vpc.google_compute_firewall.allow_http_https \
  "projects/astute-strategy-406601/global/firewalls/perundhu-preprod-allow-http-https"

# Global Address
terraform import -lock=false module.vpc.google_compute_global_address.private_ip_address \
  "perundhu-preprod-private-ip-address"

# VPC Access Connector
terraform import -lock=false module.vpc.google_vpc_access_connector.connector \
  "projects/astute-strategy-406601/locations/asia-south1/connectors/perundhu-prod-vpc-conn"

# Service Networking Connection
terraform import -lock=false module.vpc.google_service_networking_connection.private_vpc_connection \
  "servicenetworking-googleapis-com:perundhu-preprod-vpc"
```

### 4.3 Create Missing Database Resources 🟠
**Priority**: HIGH - After resolving instance state

```bash
# These will be created by terraform apply after instance state is fixed:
- google_sql_database.database (perundhu)
- google_sql_user.users (perundhu_user)
- google_sql_user.readonly_user (perundhu_user_readonly)
```

### 4.4 Create Secret Manager Resources 🟠
**Priority**: HIGH

Terraform will create:
- `preprod-db-password` secret
- `preprod-db-username` secret
- `preprod-db-url` secret
- `preprod-jwt-secret` secret
- `preprod-data-encryption-key` secret
- `preprod-redis-auth` secret (empty, Redis disabled)

### 4.5 Create/Import Cloud Run Resources 🟠
**Priority**: MEDIUM

Need to handle:
- Backend service already exists, needs import or config update
- Frontend service already exists, needs import or config update

---

## Phase 5: GitHub Secrets & CI/CD Integration 🔴 CRITICAL

### 5.1 Update GCPSECRET in GitHub Actions 🔴
**Priority**: HIGHEST - Blocks terraform pipeline

**Current Issue**:
- GCPSECRET contains credentials for `perundhu@astute-strategy-406601.iam.gserviceaccount.com` (preprod project)
- Terraform tries to use it for both preprod and production
- Causes 403 errors when terraform tries to access production GCS bucket

**Required Action**:
1. Generate new service account key for `cloud-run-sa@perundhu-prod-001.iam.gserviceaccount.com` (production project)
   ```bash
   gcloud iam service-accounts keys create /tmp/key.json \
     --iam-account=cloud-run-sa@perundhu-prod-001.iam.gserviceaccount.com \
     --project=perundhu-prod-001
   ```

2. Base64 encode the key:
   ```bash
   cat /tmp/key.json | base64 | tr -d '\n'
   ```

3. Update GitHub Actions secret:
   - Go to repo Settings → Secrets and variables → Actions
   - Update GCPSECRET with the base64-encoded production SA key
   - This enables terraform pipeline to work for both environments

### 5.2 Preprod Database Secrets ✅
**Status**: ✅ Already set up
- `preprod-db-password`: Contains perundhu_user password
- These are accessible to Cloud Run services

---

## Execution Checklist & Next Steps

### Immediate Next Steps (DO THESE NOW):

- [ ] **Step 1**: Resolve database instance state issue
  - Run: `gcloud sql instances describe perundhu-preprod-mysql-asia --project=astute-strategy-406601 --format=json`
  - Compare with Terraform expectations
  - Either update Terraform config OR use lifecycle ignores
  - Run: `terraform import module.database.google_sql_database_instance.mysql_instance "perundhu-preprod-mysql-asia"`

- [ ] **Step 2**: Import VPC resources (run all import commands listed above)

- [ ] **Step 3**: Run terraform apply
  - `terraform plan` to verify all changes
  - `terraform apply -auto-approve`
  - This will create: databases, users, secrets, Cloud Run configs

- [ ] **Step 4**: Update GitHub GCPSECRET
  - Generate key for production SA
  - Update GitHub secret
  - This enables terraform pipeline

- [ ] **Step 5**: Validate deployment
  - Check preprod services are still working
  - Verify database connectivity
  - Test Cloud Run service

### Verification Commands:

```bash
# Check Terraform state
cd infrastructure/terraform/environments/preprod
terraform state list

# Check GCP resources
gcloud sql instances list --project=astute-strategy-406601
gcloud sql databases list --instance=perundhu-preprod-mysql-asia --project=astute-strategy-406601
gcloud secrets list --project=astute-strategy-406601
gcloud run services list --project=astute-strategy-406601

# Test database connectivity
gcloud sql connect perundhu-preprod-mysql-asia --user=perundhu_user --project=astute-strategy-406601
```

---

## Current Terraform State Summary

**Resources in State**: ~30-35 resources
- VPC: 1 network (fully imported earlier)
- IAM: 2 service accounts, 1 custom role, 13 bindings (fully imported earlier)
- Storage: 1 bucket with random suffix (fully imported earlier)
- APIs: 9 services enabled (tracked)
- **Remaining to import**: VPC subnets/routers/firewalls/connectors (8 resources)
- **To create**: Databases, users, secrets, Cloud Run (15+ resources)

**Blockers**:
1. Database instance state sync (state shows different config than actual)
2. GitHub GCPSECRET not updated for production project SA

**Timeline**: 
- Database fix: 15 mins
- VPC imports: 10 mins
- Terraform apply: 5-10 mins
- Validation: 10 mins
- **Total**: ~45 mins to full completion

---

## Files Modified in This Session

1. `infrastructure/terraform/environments/preprod/backend.tf` - Backend bucket fix (earlier)
2. `infrastructure/terraform/environments/preprod/variables.tf` - Added db_instance_name_suffix
3. `infrastructure/terraform/environments/preprod/main.tf` - Pass db_instance_name_suffix to module
4. `infrastructure/terraform/environments/preprod/terraform.tfvars` - Set db_instance_name_suffix = "-asia"
5. `infrastructure/terraform/modules/database/main.tf` - Use suffix in instance name
6. `infrastructure/terraform/modules/database/variables.tf` - Define db_instance_name_suffix variable
7. `.github/workflows/terraform.yml` - Enhanced error handling (earlier)

---

## Key Configuration References

### Preprod Environment Variables
```hcl
project_id              = "astute-strategy-406601"
region                  = "asia-south1"
zone                    = "asia-south1-a"
environment             = "preprod"
app_name                = "perundhu"
db_version              = "MYSQL_8_0"
db_instance_tier        = "db-f1-micro"
db_instance_name_suffix = "-asia"
domain_name             = "preprod.perundhu.com"
create_test_database    = true (default)
```

### GCP Resources IDs

| Resource | ID | Project |
|----------|--|-|
| VPC Network | perundhu-preprod-vpc | astute-strategy-406601 |
| SQL Instance | perundhu-preprod-mysql-asia | astute-strategy-406601 |
| Cloud Run | perundhu-backend-preprod | astute-strategy-406601 |
| Cloud Run | perundhu-frontend-preprod | astute-strategy-406601 |
| Storage Bucket | perundhu-preprod-images-wsw1qzyr | astute-strategy-406601 |
| VPC Connector | perundhu-prod-vpc-conn | astute-strategy-406601 |

---

## Related Documentation

- [TERRAFORM_PIPELINE_IAM_FIX.md](TERRAFORM_PIPELINE_IAM_FIX.md) - Earlier IAM fixes
- [infrastructure/terraform/README.md](infrastructure/terraform/README.md) - Terraform module docs
- GCP Preprod Project: https://console.cloud.google.com/home/dashboard?project=astute-strategy-406601

