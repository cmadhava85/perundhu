# TERRAFORM PRODUCTION CONFIGURATION GUIDE

## Overview

Your Terraform infrastructure is configured and ready for production deployment on Google Cloud Platform. This guide walks you through finalizing the production environment setup.

---

## Current Terraform Structure

```
infrastructure/
├── terraform/
│   ├── environments/
│   │   ├── preprod/              # Staging environment (existing)
│   │   ├── production/           # Production environment (ready)
│   │   └── shared/               # Shared resources (API keys, etc.)
│   └── modules/                  # Reusable modules
│       ├── vpc/                  # Virtual Private Cloud
│       ├── database/             # Cloud SQL MySQL
│       ├── storage/              # Cloud Storage (images)
│       ├── secrets/              # Secret Manager
│       ├── iam/                  # Service Accounts & IAM
│       └── cloud_run/            # Cloud Run services
├── deploy.sh                     # Deployment script
├── Makefile                      # Build automation
└── README.md                     # Documentation
```

---

## STEP 1: Prepare Production Variables

### 1.1 Create terraform.tfvars

```bash
cd infrastructure/terraform/environments/production
cp terraform.tfvars.example terraform.tfvars
```

### 1.2 Edit terraform.tfvars

```hcl
# PRODUCTION ENVIRONMENT VARIABLES
# File: infrastructure/terraform/environments/production/terraform.tfvars

# Core Configuration
project_id  = "YOUR_PRODUCTION_GCP_PROJECT_ID"  # e.g., "perundhu-prod-001"
region      = "asia-south1"                     # Mumbai region (optimal for India)
zone        = "asia-south1-a"
environment = "production"
app_name    = "perundhu"

# Database Configuration
db_version       = "MYSQL_8_0"
db_instance_tier = "db-n1-standard-1"           # Production tier (2 vCPU, 3.75 GB RAM)
db_disk_size     = 100                          # 100 GB initial
db_disk_type     = "PD_SSD"                     # SSD for better performance

# Storage Configuration
storage_location = "ASIA"                       # For compliance & performance

# Application Configuration
domain_name    = "perundhu.app"                 # Your production domain
container_image = "gcr.io/YOUR_PROJECT_ID/perundhu-backend:1.0.0"

# Notification Configuration (Optional)
notification_email = "ops@yourcompany.com"      # Alert email address

# Feature Flags
enable_monitoring = true                        # Enable Cloud Monitoring
enable_logging    = true                        # Enable Cloud Logging
backup_enabled    = true                        # Enable automated backups
```

**Key Production Recommendations:**
- Use `db-n1-standard-1` or higher for production
- Start with 100GB storage, can scale up
- Enable all monitoring and logging
- Use SSD storage for better performance
- Set up proper notification email for alerts

---

## STEP 2: Create GCS Backend for Terraform State

### 2.1 Create State Bucket

```bash
# Set variables
PROJECT_ID="YOUR_PRODUCTION_GCP_PROJECT_ID"
REGION="asia-south1"

# Create bucket
gsutil mb -p $PROJECT_ID -l $REGION \
  gs://$PROJECT_ID-terraform-state-production

# Enable versioning for safety
gsutil versioning set on gs://$PROJECT_ID-terraform-state-production

# Restrict access (optional but recommended)
gsutil acl ch -u gs://$PROJECT_ID-terraform-state-production
```

### 2.2 Update Backend Configuration

The backend is already configured in `main.tf`:

```hcl
backend "gcs" {
  bucket = "perundhu-terraform-state-production"
  prefix = "production/state"
}
```

**Note**: Update bucket name to match your actual bucket if different.

---

## STEP 3: Initialize & Plan Production Infrastructure

### 3.1 Initialize Terraform

```bash
cd infrastructure/terraform/environments/production

terraform init \
  -backend-config="bucket=$PROJECT_ID-terraform-state-production" \
  -backend-config="prefix=production/state"
```

**Expected Output:**
```
Initializing the backend...
Successfully configured the backend "gcs"!
Terraform has been successfully initialized!
```

### 3.2 Validate Configuration

```bash
terraform validate
```

**Expected Output:**
```
Success! The configuration is valid.
```

### 3.3 Plan Infrastructure Deployment

```bash
terraform plan \
  -var="project_id=$PROJECT_ID" \
  -var="region=asia-south1" \
  -out=tfplan
```

**Review the plan for:**
- ✅ All required services being created
- ✅ Correct regions and zones
- ✅ Proper security configurations
- ✅ No destructive changes
- ✅ Expected resource count (~20-25 resources)

### 3.4 Save Plan Output

```bash
# Save for audit trail
terraform show tfplan > infrastructure_plan.txt

# Review before applying
cat infrastructure_plan.txt
```

---

## STEP 4: Apply Infrastructure

### 4.1 Apply Terraform Configuration

```bash
# Option 1: Interactive (requires approval)
terraform apply tfplan

# Option 2: Auto-approve (CI/CD pipeline)
terraform apply -auto-approve tfplan
```

**Expected Duration:** 15-25 minutes

**What Gets Created:**
- ✅ VPC and subnets
- ✅ Cloud SQL MySQL instance
- ✅ Service accounts and IAM roles
- ✅ Cloud Storage buckets
- ✅ Secret Manager secrets
- ✅ VPC connector for Cloud Run
- ✅ Cloud Run infrastructure

### 4.2 Monitor Deployment Progress

```bash
# Watch Cloud Build logs
gcloud builds log $(gcloud builds list --limit=1 --format='value(id)')

# Check resource status
gcloud sql instances list --project=$PROJECT_ID
gcloud storage buckets list --project=$PROJECT_ID
gcloud iam service-accounts list --project=$PROJECT_ID
```

### 4.3 Capture Terraform Outputs

```bash
# Display all outputs
terraform output

# Save outputs to file
terraform output -json > infrastructure_outputs.json

# Extract specific values
DB_CONNECTION=$(terraform output -raw db_connection_name)
STORAGE_BUCKET=$(terraform output -raw images_bucket_name)
SERVICE_URL=$(terraform output -raw cloud_run_service_url)
```

---

## STEP 5: Configure Database Secrets

### 5.1 Set Up Secret Manager Secrets

```bash
# Get database details from Terraform
export DB_CONNECTION=$(terraform output -raw db_connection_name)
export DB_NAME=$(terraform output -raw db_name)
export DB_USER=$(terraform output -raw db_user)
export DB_PASSWORD=$(terraform output -raw db_password)

# Create secrets in Google Secret Manager
echo -n "jdbc:mysql://$DB_CONNECTION:3306/$DB_NAME?useSSL=true" | \
  gcloud secrets create production-db-url \
    --data-file=- \
    --replication-policy="automatic" \
    --project=$PROJECT_ID

echo -n "$DB_USER" | \
  gcloud secrets create production-db-username \
    --data-file=- \
    --replication-policy="automatic" \
    --project=$PROJECT_ID

echo -n "$DB_PASSWORD" | \
  gcloud secrets create production-db-password \
    --data-file=- \
    --replication-policy="automatic" \
    --project=$PROJECT_ID
```

### 5.2 Grant IAM Access to Service Account

```bash
# Get service account email from Terraform
SERVICE_ACCOUNT=$(terraform output -raw backend_service_account_email)

# Grant access to secrets
for SECRET in production-db-url production-db-username production-db-password \
              production-jwt-secret production-data-encryption-key \
              production-recaptcha-secret; do
  gcloud secrets add-iam-policy-binding $SECRET \
    --member="serviceAccount:$SERVICE_ACCOUNT" \
    --role="roles/secretmanager.secretAccessor" \
    --project=$PROJECT_ID
done
```

---

## STEP 6: Database Migration

### 6.1 Apply Flyway Migrations

```bash
# Build backend with production profile
cd backend
./gradlew clean build -Dspring.profiles.active=production

# Run migrations
export SPRING_DATASOURCE_URL="jdbc:mysql://CLOUD_SQL_IP:3306/perundhu?useSSL=true"
export SPRING_DATASOURCE_USERNAME=$(gcloud secrets versions access latest --secret="production-db-username" --project=$PROJECT_ID)
export SPRING_DATASOURCE_PASSWORD=$(gcloud secrets versions access latest --secret="production-db-password" --project=$PROJECT_ID)

./gradlew flywayMigrate -Dspring.profiles.active=production
```

### 6.2 Verify Migrations

```bash
# Check migration status
./gradlew flywayInfo -Dspring.profiles.active=production

# Expected output: All migrations should show SUCCESS
```

---

## STEP 7: Verify Infrastructure

### 7.1 Check All Resources

```bash
# Cloud SQL
gcloud sql instances describe perundhu-prod --project=$PROJECT_ID

# Cloud Storage
gcloud storage buckets describe gs://perundhu-prod-images-* --project=$PROJECT_ID

# Service Accounts
gcloud iam service-accounts list --project=$PROJECT_ID

# VPC Configuration
gcloud compute networks describe perundhu-prod-vpc --project=$PROJECT_ID

# Secrets
gcloud secrets list --project=$PROJECT_ID
```

### 7.2 Test Connectivity

```bash
# Test Cloud SQL connection
gcloud sql connect perundhu-prod \
  --user=perundhu_user \
  --project=$PROJECT_ID

# Test Storage access
gsutil ls gs://perundhu-prod-images-*

# Test Secret access
gcloud secrets versions access latest \
  --secret="production-db-password" \
  --project=$PROJECT_ID
```

---

## STEP 8: Configure Cloud Run

### 8.1 Deploy Backend Service

```bash
# Set required variables
export BACKEND_IMAGE="gcr.io/$PROJECT_ID/perundhu-backend:1.0.0"
export SERVICE_ACCOUNT=$(terraform output -raw backend_service_account_email)

# Deploy to Cloud Run
gcloud run deploy perundhu-backend \
  --image $BACKEND_IMAGE \
  --platform managed \
  --region asia-south1 \
  --memory 2Gi \
  --cpu 2 \
  --timeout 300s \
  --max-instances 10 \
  --min-instances 1 \
  --service-account $SERVICE_ACCOUNT \
  --vpc-connector perundhu-prod-connector \
  --ingress internal \
  --project=$PROJECT_ID
```

### 8.2 Deploy Frontend Service

```bash
export FRONTEND_IMAGE="gcr.io/$PROJECT_ID/perundhu-frontend:1.0.0"

gcloud run deploy perundhu-frontend \
  --image $FRONTEND_IMAGE \
  --platform managed \
  --region asia-south1 \
  --memory 256Mi \
  --cpu 1 \
  --timeout 60s \
  --max-instances 20 \
  --allow-unauthenticated \
  --project=$PROJECT_ID
```

### 8.3 Configure Custom Domain

```bash
# Backend domain
gcloud run domain-mappings create \
  --service perundhu-backend \
  --domain api.perundhu.app \
  --region asia-south1 \
  --project=$PROJECT_ID

# Frontend domain
gcloud run domain-mappings create \
  --service perundhu-frontend \
  --domain perundhu.app \
  --region asia-south1 \
  --project=$PROJECT_ID
```

---

## STEP 9: Post-Deployment Verification

### 9.1 Health Checks

```bash
# Check backend health
curl https://api.perundhu.app/actuator/health

# Check frontend availability
curl https://perundhu.app

# Check database connectivity
curl https://api.perundhu.app/api/buses/routes
```

### 9.2 View Logs

```bash
# Backend logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=perundhu-backend" \
  --limit 50 \
  --format json \
  --project=$PROJECT_ID

# Frontend logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=perundhu-frontend" \
  --limit 50 \
  --project=$PROJECT_ID
```

---

## STEP 10: Backup & Disaster Recovery

### 10.1 Configure Automated Backups

```bash
# Update Cloud SQL backup settings
gcloud sql backups create \
  --instance=perundhu-prod \
  --description="Manual backup - $(date)" \
  --project=$PROJECT_ID

# Automatic backups are configured via Terraform
# Check configuration:
gcloud sql instances describe perundhu-prod \
  --format="value(backupConfiguration)"
```

### 10.2 Test Backup Restoration

```bash
# List available backups
gcloud sql backups list \
  --instance=perundhu-prod \
  --project=$PROJECT_ID

# Test restore (don't actually restore in production):
# Create separate test instance and test restore procedure
```

---

## STEP 11: Monitoring & Alerts

### 11.1 Create Monitoring Dashboard

```bash
# View Cloud Monitoring
gcloud monitoring dashboards list --project=$PROJECT_ID

# Create alert policy
gcloud alpha monitoring policies create \
  --notification-channels=<CHANNEL_ID> \
  --display-name="Backend Error Rate Alert" \
  --project=$PROJECT_ID
```

### 11.2 Set Up Logging

```bash
# Verify logs are flowing
gcloud logging sinks list --project=$PROJECT_ID

# Create log sink for long-term storage
gcloud logging sinks create perundhu-logs \
  gs://perundhu-prod-logs/ \
  --log-filter='resource.type="cloud_run_revision"' \
  --project=$PROJECT_ID
```

---

## Terraform Variable Reference

### Required Variables (terraform.tfvars)

| Variable | Description | Example |
|----------|-------------|---------|
| `project_id` | GCP Project ID | `perundhu-prod-001` |
| `region` | GCP Region | `asia-south1` |
| `zone` | GCP Zone | `asia-south1-a` |
| `environment` | Environment name | `production` |
| `app_name` | Application name | `perundhu` |

### Optional Variables (Defaults Available)

| Variable | Default | Production Value |
|----------|---------|-----------------|
| `db_version` | `MYSQL_8_0` | `MYSQL_8_0` |
| `db_instance_tier` | `db-n1-standard-1` | `db-n1-standard-1` |
| `db_disk_size` | `100` | `100-500` |
| `domain_name` | `perundhu.app` | `perundhu.app` |

---

## Useful Terraform Commands

```bash
# Validate configuration
terraform validate

# Plan changes
terraform plan -var="project_id=$PROJECT_ID"

# Apply changes
terraform apply -var="project_id=$PROJECT_ID"

# View outputs
terraform output

# Show specific output
terraform output -raw backend_service_account_email

# Destroy infrastructure (BE CAREFUL!)
terraform destroy -var="project_id=$PROJECT_ID"

# Refresh state
terraform refresh

# Import existing resource
terraform import google_sql_database_instance.database projects/$PROJECT_ID/instances/perundhu-prod

# Format configuration
terraform fmt -recursive

# Lock file
terraform lock

# Show state
terraform state list
terraform state show google_sql_database_instance.database
```

---

## Troubleshooting

### Issue: Backend bucket not found

**Solution:**
```bash
# Verify bucket exists
gsutil ls -b gs://$PROJECT_ID-terraform-state-production

# If not found, create it
gsutil mb -p $PROJECT_ID -l asia-south1 \
  gs://$PROJECT_ID-terraform-state-production
```

### Issue: Service account permission denied

**Solution:**
```bash
# Ensure user has owner/editor role on project
gcloud projects get-iam-policy $PROJECT_ID \
  --flatten="bindings[].members" \
  --filter="bindings.members:user@example.com"

# Grant owner role if needed
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member=user@example.com \
  --role=roles/owner
```

### Issue: VPC connector not creating

**Solution:**
```bash
# Ensure Serverless VPC Access API is enabled
gcloud services enable vpcaccess.googleapis.com --project=$PROJECT_ID

# Check connector status
gcloud compute networks vpc-access connectors list --region=asia-south1
```

### Issue: Cloud SQL connection fails

**Solution:**
```bash
# Verify private IP configured
gcloud sql instances describe perundhu-prod \
  --format="value(ipAddresses[0].ipAddress)"

# Check authorization networks
gcloud sql instances describe perundhu-prod \
  --format="value(settings.ipConfiguration.authorizedNetworks)"
```

---

## Rollback Procedure

If you need to rollback the infrastructure:

```bash
# Option 1: Revert to previous Terraform state
terraform state pull > backup.tfstate
# Edit state or use: terraform destroy

# Option 2: Destroy and recreate
terraform destroy -var="project_id=$PROJECT_ID"

# Option 3: Selective rollback
terraform destroy -target=google_sql_database_instance.database
```

---

## Security Best Practices

1. **Keep State Secure**: Terraform state contains sensitive data
   - Bucket versioning enabled ✓
   - Encryption enabled ✓
   - Access restricted via IAM ✓

2. **Secret Management**: Use Secret Manager, never in code
3. **Network Security**: Private databases only
4. **IAM Roles**: Follow principle of least privilege
5. **Audit Logging**: Enable Cloud Audit Logs
6. **Backup Strategy**: Test restore procedure regularly

---

## Support & Resources

- [Terraform Google Cloud Documentation](https://registry.terraform.io/providers/hashicorp/google/latest/docs)
- [GCP Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Cloud SQL Documentation](https://cloud.google.com/sql/docs)
- [Project README](../README.md)

---

**Last Updated**: January 5, 2026  
**Version**: 1.0  
**Status**: Ready for Production

