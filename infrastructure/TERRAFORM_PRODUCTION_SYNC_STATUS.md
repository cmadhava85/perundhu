# Terraform Production Sync Status

**Last Updated**: February 23, 2026  
**Project**: perundhu-prod-001  
**Region**: asia-south1  

---

## Overview

This document tracks which production infrastructure is managed by Terraform vs. manually managed, and documents all cost optimization changes made.

---

## ✅ Resources Managed by Terraform (Synced)

### 1. **Cloud SQL MySQL Database** ✓
- **Instance**: `perundhu-production-mysql`
- **Configuration**: 
  - Tier: `db-f1-micro`
  - Disk: 10GB `PD_HDD`
  - Availability: `ZONAL`
  - Backups: **3 days retention** (optimized from 7)
  - Binary logs: **DISABLED** (optimized - no replica needed)
  - Transaction logs: **3 days** (optimized from 7)
- **Terraform State**: Synced ✓
- **File**: `modules/database/main.tf`
- **Cost Savings**: $0.50-1/month from backup/log optimization

### 2. **Backend Cloud Run** ✓
- **Service**: `perundhu-production-backend`
- **Configuration**:
  - CPU: 1 vCPU (optimized from 2)
  - Memory: 1Gi (optimized from 2Gi)
  - Min instances: 0 (scale to zero)
  - Max instances: 5 (optimized from 10)
  - Spring Profile: `production` (fixed)
- **Terraform State**: Synced ✓
- **File**: `modules/cloud_run/main.tf`
- **Cost Savings**: $6-10/month from resource reduction

### 3. **VPC Network** ✓
- **Network**: `perundhu-production-vpc`
- **Subnets**:
  - Public: `10.0.1.0/24`
  - Private: `10.0.2.0/24`
- **Router**: `perundhu-production-router` (exists, kept for future use)
- **VPC Connector**: **DISABLED/COMMENTED** (cost optimization)
- **Cloud NAT**: **DISABLED/COMMENTED** (deleted in production, $5-10/month savings)
- **Terraform State**: Synced ✓
- **File**: `modules/vpc/main.tf`
- **Cost Savings**: $33-38/month (VPC connectors + NAT)

### 4. **Cloud Storage** ✓
- **Bucket**: `perundhu-production-images`
- **Lifecycle**: Delete after 730 days
- **Terraform State**: Synced ✓
- **File**: `modules/storage/main.tf`

### 5. **IAM & Service Accounts** ✓
- **Backend SA**: `perundhu-production-backend@perundhu-prod-001.iam.gserviceaccount.com`
- **Cloud Build SA**: Configured
- **Terraform State**: Synced ✓
- **File**: `modules/iam/main.tf`

### 6. **Secret Manager** ✓
- **Secrets**: 
  - `db-password`
  - `db-username`
  - Shared secrets (gemini-api-key, recaptcha, etc.)
- **Terraform State**: Synced ✓
- **File**: `modules/secrets/main.tf`

---

## ⚠️ Resources NOT in Terraform (Manual Management Required)

### 1. **Frontend Cloud Run** ❌
- **Service**: `perundhu-production-frontend`
- **Configuration**:
  - CPU: 1 vCPU
  - Memory: 512Mi
  - Max instances: 10
  - Image: `asia-south1-docker.pkg.dev/perundhu-prod-001/perundhu-images/frontend:1.0.6`
  - Environment: Uses `api.perundhu.com` for backend
- **Management**: Manual via `gcloud run deploy` or Cloud Console
- **Reason**: Not originally provisioned via Terraform
- **Action**: Deploy manually, maintain via CI/CD

### 2. **Load Balancer Stack** ❌
- **Components**:
  - Global HTTPS Load Balancer: `perundhu-frontend-lb`
  - Frontend IP: `34.36.97.68`
  - SSL Certificates:
    - `perundhu-ssl-cert-main` (perundhu.com) - ACTIVE
    - `perundhu-api-ssl-cert` (api.perundhu.com) - PROVISIONING
  - URL Map: Routes to frontend & backend
  - Backend Services:
    - `perundhu-frontend-backend` (targets frontend Cloud Run)
    - `perundhu-backend-backend` (targets backend Cloud Run)
  - **Cloud CDN**: ENABLED (cost optimized, $3-8/month savings)
- **Management**: Manual via `gcloud compute` commands
- **Reason**: Complex multi-service setup, domain routing
- **Action**: Document current state, update via gcloud when needed

### 3. **Cloud DNS** ❌
- **Managed Zone**: `perundhu-com`
- **Records**:
  - `perundhu.com.` A → `34.36.97.68`
  - `www.perundhu.com.` CNAME → `perundhu.com.`
  - **`api.perundhu.com.` A → `34.36.97.68`** (newly added)
- **Management**: Via Cloud DNS console or `gcloud dns`
- **Reason**: DNS management separate from infrastructure
- **Action**: Update DNS records as needed

### 4. **Artifact Registry** ❌
- **Repository**: `perundhu-images`
- **Cleanup Policy**: 
  - Delete images older than 30 days
  - Keep 10 most recent tagged versions
- **Management**: Manual via `gcloud artifacts`
- **Reason**: CI/CD managed
- **Cost Savings**: $1-2/month from cleanup policy

### 5. **Cloud Build Resources** ❌
- **Bucket**: `perundhu-prod-001_cloudbuild`
- **Lifecycle Policy**: Delete files after 30 days
- **Management**: Manual via `gsutil lifecycle`
- **Cost Savings**: $0.50/month from lifecycle policy

---

## 📊 Cost Optimization Summary

### Total Monthly Cost Reduction: $45-65/month (52-55%)

| Optimization | Status | Terraform | Savings |
|-------------|---------|-----------|---------|
| HikariCP connection pool (50→10) | ✅ Deployed | ❌ App config | $5-10/month |
| Backend resources (2CPU→1CPU, 2Gi→1Gi) | ✅ Deployed | ✅ Synced | $3-5/month |
| Frontend max instances (20→10) | ✅ Deployed | ❌ Not in TF | $2-4/month |
| SQL backups (7→3 days) | ✅ Applied | ✅ Synced | $0.20/month |
| SQL binary logs disabled | ✅ Applied | ✅ Synced | $0.30/month |
| VPC Connector #1 deleted | ✅ Deleted | ✅ Commented | $14/month |
| VPC Connector #2 deleted | ✅ Deleted | ✅ Commented | $14/month |
| Cloud NAT deleted | ✅ Deleted | ✅ Commented | $5-10/month |
| Artifact Registry cleanup | ✅ Applied | ❌ Manual | $1-2/month |
| Cloud Build lifecycle | ✅ Applied | ❌ Manual | $0.50/month |
| Cloud CDN enabled | ✅ Enabled | ❌ Not in TF | $3-8/month |

**Infrastructure Cost:**
- **Before**: $87-120/month
- **After**: $41.50-55.50/month
- **Saved**: 52-55% reduction

---

## 🔄 Terraform Configuration Files Status

### Updated Files (Synced with Production):

1. **`environments/production/terraform.tfvars`** ✅
   - Updated `db_binary_log_enabled: false`
   - Updated `db_retained_backups_count: 3`
   - Updated `db_transaction_log_retention_days: 3`
   - Updated `cloud_run_memory_limit: "1024Mi"`
   - Added cost optimization comments

2. **`modules/vpc/main.tf`** ✅
   - Commented out VPC Connector (already was commented)
   - **Commented out Cloud NAT** (new - matches deleted resource)
   - Kept router for future use

3. **`modules/cloud_run/main.tf`** ✅
   - Fixed `SPRING_PROFILES_ACTIVE` to use `var.environment`
   - Commented out HIKARI env vars (managed in application.properties)
   - Added documentation about connection pool management

4. **`modules/database/main.tf`** ✅
   - Already correct, matches production configuration
   - Binary log settings: controlled by terraform.tfvars

---

## 🚀 Deployment & Sync Workflow

### For Terraform-Managed Resources:

```bash
cd infrastructure/terraform/environments/production

# Review changes
terraform plan

# Apply changes
terraform apply

# Verify in GCP
gcloud sql instances describe perundhu-production-mysql --project=perundhu-prod-001
gcloud run services describe perundhu-production-backend --region=asia-south1
```

### For Manual Resources:

**Frontend Deployment:**
```bash
# Build and deploy frontend
cd frontend
docker build -t asia-south1-docker.pkg.dev/perundhu-prod-001/perundhu-images/frontend:1.0.X .
docker push asia-south1-docker.pkg.dev/perundhu-prod-001/perundhu-images/frontend:1.0.X

gcloud run services update perundhu-production-frontend \
  --image=asia-south1-docker.pkg.dev/perundhu-prod-001/perundhu-images/frontend:1.0.X \
  --region=asia-south1 \
  --project=perundhu-prod-001
```

**Load Balancer Updates:**
```bash
# Export current config
gcloud compute url-maps export perundhu-frontend-lb \
  --destination=/tmp/urlmap.yaml \
  --global \
  --project=perundhu-prod-001

# Edit /tmp/urlmap.yaml as needed

# Import updated config
gcloud compute url-maps import perundhu-frontend-lb \
  --source=/tmp/urlmap.yaml \
  --global \
  --project=perundhu-prod-001
```

**DNS Updates:**
```bash
# Add/update A record
gcloud dns record-sets create api.perundhu.com. \
  --zone=perundhu-com \
  --type=A \
  --ttl=300 \
  --rrdatas=34.36.97.68 \
  --project=perundhu-prod-001
```

**Cloud CDN Management:**
```bash
# Enable CDN
gcloud compute backend-services update perundhu-frontend-backend \
  --enable-cdn --global --project=perundhu-prod-001

# Invalidate cache
gcloud compute url-maps invalidate-cdn-cache perundhu-frontend-lb \
  --path="/*" --global --project=perundhu-prod-001
```

---

## ⚡ Terraform State Cleanup Needed

### Read Replica (Ghost Resource):
The Terraform state contains references to a read replica that doesn't exist in production.

**To clean up:**
```bash
cd infrastructure/terraform/environments/production

# Remove from state (if read replica is not needed)
terraform state rm 'module.database.google_sql_database_instance.read_replica[0]'

# Verify cleanup
terraform state list | grep replica
```

---

## 📋 Production Configuration Checklist

Before running `terraform apply`, verify:

- [ ] `db_binary_log_enabled = false` (optimized)
- [ ] `db_retained_backups_count = 3` (optimized)
- [ ] `db_transaction_log_retention_days = 3` (optimized)
- [ ] `cloud_run_memory_limit = "1024Mi"` (backend)
- [ ] `cloud_run_max_instances = 5` (backend)
- [ ] VPC Connector commented out in `modules/vpc/main.tf`
- [ ] Cloud NAT commented out in `modules/vpc/main.tf`
- [ ] `SPRING_PROFILES_ACTIVE` uses `var.environment` in Cloud Run

After applying:

- [ ] Verify backend Cloud Run has correct resources
- [ ] Verify SQL backups are 3-day retention
- [ ] Verify no VPC connectors exist
- [ ] Verify no Cloud NAT exists
- [ ] Frontend deployment separate (not affected)
- [ ] Load balancer unchanged (not in Terraform)

---

## 🎯 Future Terraform Additions (Optional)

To bring more resources under Terraform management:

### 1. Frontend Cloud Run
```hcl
# Add to main.tf
module "frontend_cloud_run" {
  source = "../../modules/cloud_run_frontend"
  # ... configuration
}
```

### 2. Load Balancer Stack
```hcl
# Complex - requires:
# - google_compute_global_address
# - google_compute_backend_service (x2)
# - google_compute_url_map
# - google_compute_target_https_proxy
# - google_compute_global_forwarding_rule
# - google_compute_ssl_certificate
```

### 3. DNS Records
```hcl
resource "google_dns_record_set" "api" {
  name = "api.perundhu.com."
  type = "A"
  ttl  = 300
  managed_zone = "perundhu-com"
  rrdatas = ["34.36.97.68"]
}
```

**Recommendation**: Keep load balancer and frontend manual for now. Complex multi-service routing is easier to manage via console/gcloud for production stability.

---

## 📞 Support & Maintenance

**For Infrastructure Changes:**
1. Check if resource is in Terraform (see "Resources Managed by Terraform")
2. If YES: Update terraform.tfvars → terraform plan → terraform apply
3. If NO: Use manual gcloud commands documented above

**For Cost Monitoring:**
- Check GCP Billing dashboard weekly
- Expected monthly cost: $41.50-55.50
- Alert if cost exceeds $70/month

**For Terraform Issues:**
- State file: `infrastructure/terraform/environments/production/terraform.tfstate`
- Backup: Committed to git (local backend)
- Recovery: Restore from git history

---

## ✅ Verification Commands

**Quick health check:**
```bash
# SQL instance
gcloud sql instances describe perundhu-production-mysql --project=perundhu-prod-001 \
  --format="value(settings.tier,settings.backupConfiguration.retainedBackups,settings.backupConfiguration.binaryLogEnabled)"

# Backend Cloud Run
gcloud run services describe perundhu-production-backend --region=asia-south1 --project=perundhu-prod-001 \
  --format="value(spec.template.spec.containers[0].resources.limits.cpu,spec.template.spec.containers[0].resources.limits.memory)"

# No VPC connectors
gcloud compute networks vpc-access connectors list --region=asia-south1 --project=perundhu-prod-001

# No Cloud NAT
gcloud compute routers nats list --router=perundhu-production-router --region=asia-south1 --project=perundhu-prod-001

# Cloud CDN enabled
gcloud compute backend-services describe perundhu-frontend-backend --global --project=perundhu-prod-001 --format="value(enableCDN)"
```

Expected outputs:
- SQL: `db-f1-micro`, `3`, `False`
- Backend: `1`, `1Gi`
- VPC Connectors: Empty
- Cloud NAT: Empty
- CDN: `True`

---

**Document Version**: 1.0  
**Status**: ✅ Production synced with Terraform where applicable  
**Next Review**: March 2026 (monthly check)
