# Terraform Cost Reduction Guide

## Overview
This guide explains how to apply cost reduction changes through Terraform to reduce your GCP monthly bill from **$60/month → ~$2/month**.

## Changes Made

### 1. VPC Connector - DISABLED (Saves $14/month)
**File**: `infrastructure/terraform/modules/vpc/main.tf`
- Commented out the `google_vpc_access_connector` resource
- Cloud Run will now connect to Cloud SQL via public IP instead of private networking
- Updated outputs to handle optional connector gracefully

### 2. Cloud Run - Scale to Zero (Saves $6/month)
**File**: `infrastructure/terraform/environments/production/terraform.tfvars`
- Already set: `cloud_run_min_instances = 0`
- Cloud Run will scale to zero when not in use

### 3. Cloud SQL Database - STOPPED (Saves $34/month)
**File**: `infrastructure/terraform/environments/production/terraform.tfvars`
- Already set: `db_activation_policy = "NEVER"`
- Database will be stopped and not incur compute charges

### 4. Cloud Run VPC Connector - Made Optional
**File**: `infrastructure/terraform/modules/cloud_run/main.tf`
- Updated to only set VPC connector annotation if connector exists
- Allows Cloud Run to deploy without VPC connector

## Cost Breakdown

| Service | Before | After | Savings |
|---------|--------|-------|---------|
| Cloud SQL | $34.31 | $0.00 | $34.31 |
| VPC Connector | $13.90 | $0.00 | $13.90 |
| Cloud Run | $6.11 | $0.11 | $6.00 |
| Artifact Registry | $4.21 | $0.00* | $4.21 |
| Networking | $5.12 | ~$1.50 | $3.62 |
| Other Services | $2.69 | $2.00 | $0.69 |
| **TOTAL** | **$60.00** | **~$2-3** | **~$58** |

*Clean manually using commands below

## How to Apply Changes

### Step 1: Review Changes
```bash
cd infrastructure/terraform/environments/production
terraform init
terraform plan
```

**Expected changes**:
- **Destroy**: `google_vpc_access_connector.connector` (VPC connector will be deleted)
- **Modify**: `google_cloud_run_service.backend` (remove VPC connector annotation)
- Database and Cloud Run scaling already configured

### Step 2: Apply Changes
```bash
terraform apply
```

**⚠️ Important Notes**:
1. **VPC Service Controls**: If you get access denied errors, you may need to:
   - Temporarily disable VPC Service Controls, OR
   - Apply changes using direct `gcloud` commands (see below)

2. **Database Connection**: After removing VPC connector:
   - Cloud SQL must allow public connections
   - Update Cloud SQL authorized networks if needed:
     ```bash
     gcloud sql instances patch perundhu-prod-001-mysql \
       --authorized-networks=0.0.0.0/0 \
       --project=perundhu-prod-001
     ```

### Step 3: Verify Deployment
```bash
# Check Cloud Run service
gcloud run services describe perundhu-backend-prod \
  --region=asia-south1 \
  --project=perundhu-prod-001

# Verify no VPC connector annotation
gcloud run services describe perundhu-backend-prod \
  --region=asia-south1 \
  --project=perundhu-prod-001 \
  --format="value(metadata.annotations)"
```

## Alternative: Direct gcloud Commands

If Terraform is blocked by VPC Service Controls, use these direct commands:

### 1. Delete VPC Connector
```bash
gcloud compute networks vpc-access connectors delete perundhu-prod-vpc-conn \
  --region=asia-south1 \
  --project=perundhu-prod-001 \
  --quiet
```

### 2. Update Cloud Run (remove VPC connector)
```bash
gcloud run services update perundhu-backend-prod \
  --region=asia-south1 \
  --project=perundhu-prod-001 \
  --clear-vpc-connector \
  --min-instances=0 \
  --max-instances=5
```

### 3. Stop Database (if not already stopped)
```bash
gcloud sql instances patch perundhu-prod-001-mysql \
  --activation-policy=NEVER \
  --project=perundhu-prod-001
```

### 4. Clean Artifact Registry (saves $4/month)
```bash
# List repositories
gcloud artifacts repositories list \
  --project=perundhu-prod-001

# If repositories exist, delete old images
# Keep only last 3 versions
gcloud artifacts packages list \
  --repository=perundhu \
  --location=asia-south1 \
  --project=perundhu-prod-001

# Delete specific versions (example)
gcloud artifacts versions delete VERSION \
  --package=backend \
  --repository=perundhu \
  --location=asia-south1 \
  --project=perundhu-prod-001 \
  --quiet
```

## Re-enabling Services Later

When you need to re-enable services:

### 1. Re-enable VPC Connector via Terraform
In `infrastructure/terraform/modules/vpc/main.tf`:
- Uncomment the `google_vpc_access_connector` resource

### 2. Start Database
Update `terraform.tfvars`:
```hcl
db_activation_policy = "ALWAYS"
```

Then apply:
```bash
terraform apply
```

Or via gcloud:
```bash
gcloud sql instances patch perundhu-prod-001-mysql \
  --activation-policy=ALWAYS \
  --project=perundhu-prod-001
```

### 3. Scale Cloud Run (if needed)
Update `terraform.tfvars`:
```hcl
cloud_run_min_instances = 1
```

## Monitoring Costs

After applying changes, monitor costs in GCP Console:
1. Go to **Billing** → **Cost breakdown**
2. Wait 24-48 hours for charges to reflect
3. Expected monthly cost: **$2-3/month**

## Summary

✅ **Terraform files updated** - Ready to apply
✅ **VPC Connector disabled** - Saves $14/month
✅ **Cloud Run scales to zero** - Saves $6/month  
✅ **Database stopped** - Saves $34/month
✅ **Cloud Run made VPC-optional** - Works without connector

**Next Step**: Run `terraform plan` and `terraform apply` in production environment.
