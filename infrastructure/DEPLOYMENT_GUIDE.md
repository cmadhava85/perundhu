# Perundhu GCP Infrastructure Deployment Guide

## Overview
This guide walks you through deploying the Perundhu bus tracking application infrastructure to Google Cloud Platform using Terraform.

## Prerequisites

### 1. Install Required Tools
```bash
# Install Google Cloud CLI
brew install --cask google-cloud-sdk

# Install Terraform
brew install terraform

# Install Docker (for building containers)
brew install --cask docker
```

### 2. GCP Project Setup
```bash
# Authenticate with Google Cloud
gcloud auth login
gcloud auth application-default login

# Set your project ID
export PROJECT_ID="your-project-id"
gcloud config set project $PROJECT_ID

# Enable billing for your project (required)
gcloud billing projects link $PROJECT_ID --billing-account=YOUR_BILLING_ACCOUNT_ID
```

## Quick Deployment

### Option 1: Automated Deployment
```bash
cd infrastructure
chmod +x deploy.sh
./deploy.sh
```

### Option 2: Manual Deployment
```bash
cd infrastructure

# Initialize and deploy infrastructure
make init
make plan
make apply

# Deploy application
make deploy-app
```

## Environment Configuration

### Update Variables
Edit `terraform/environments/preprod/terraform.tfvars`:
```hcl
project_id = "your-actual-project-id"
region     = "us-central1"
environment = "preprod"

# Database configuration
db_instance_tier = "db-f1-micro"  # For cost optimization
db_disk_size    = 20              # GB

# Application configuration
app_name         = "perundhu"
domain_name     = "your-domain.com"  # Optional
```

## Infrastructure Components

The Terraform configuration creates:

- **VPC Network**: Private networking with public/private subnets
- **Cloud SQL MySQL**: Managed database with automated backups
- **Redis Cache**: Managed Redis for caching
- **Pub/Sub**: Message queuing for real-time updates
- **Cloud Storage**: File storage for assets
- **Cloud Run**: Containerized application deployment
- **IAM**: Service accounts with least-privilege access
- **Secret Manager**: Secure credential storage
- **Cloud Monitoring**: Comprehensive observability

## Application Deployment

### Backend Deployment
```bash
# Build and deploy backend
make deploy-backend

# The backend will be available at:
# https://perundhu-backend-{hash}-uc.a.run.app
```

### Frontend Deployment
```bash
# Build and deploy frontend
make deploy-frontend

# The frontend will be available at:
# https://perundhu-frontend-{hash}-uc.a.run.app
```

## Database Migration
```bash
# Run database migrations
make db-migrate

# Or manually:
cd backend
./gradlew flywayMigrate
```

## Monitoring & Operations

### View Logs
```bash
# Infrastructure logs
make logs

# Application logs
gcloud logging read "resource.type=cloud_run_revision" --limit=50
```

### Health Checks
```bash
# Check infrastructure status
make status

# Check application health
curl https://your-backend-url/actuator/health
```

### Scaling
```bash
# Scale Cloud Run service
gcloud run services update perundhu-backend \
  --min-instances=1 \
  --max-instances=10 \
  --region=us-central1
```

## Cost Optimization

### Development Environment
- Use `db-f1-micro` for Cloud SQL
- Set Cloud Run to scale to zero
- Use `e2-micro` for any VMs
- Enable automatic disk deletion

### Production Considerations
- Upgrade to `db-n1-standard-1` or higher
- Set minimum instances for Cloud Run
- Enable Cloud SQL High Availability
- Use Cloud CDN for static assets

## Security Features

- **Private VPC**: All resources in private network
- **IAM**: Service accounts with minimal permissions
- **Secret Manager**: Secure credential storage
- **SSL/TLS**: Automatic HTTPS certificates
- **VPC Service Controls**: Additional network security

## Troubleshooting

### Common Issues

1. **Permission Denied**
   ```bash
   gcloud auth application-default login
   gcloud config set project YOUR_PROJECT_ID
   ```

2. **API Not Enabled**
   ```bash
   make enable-apis
   ```

3. **Terraform State Issues**
   ```bash
   make clean
   make init
   ```

4. **Database Connection**
   - Check VPC connector configuration
   - Verify service account permissions
   - Check Secret Manager access

### Debug Commands
```bash
# Check resource status
make status

# View detailed logs
make logs

# Validate configuration
make validate

# Plan changes
make plan
```

## Cleanup

### Destroy Resources
```bash
# WARNING: This will delete everything!
make destroy

# Or step by step:
terraform destroy -target=module.monitoring
terraform destroy -target=module.cloud_run
terraform destroy -target=module.database
terraform destroy
```

## Support

For issues or questions:
1. Check the Terraform logs: `make logs`
2. Validate your configuration: `make validate`
3. Review the GCP Console for resource status
4. Check this documentation for common solutions

## Next Steps

1. **Domain Setup**: Configure your custom domain
2. **CI/CD**: Set up automated deployments
3. **Monitoring**: Configure alerts and dashboards
4. **Backup**: Verify database backup schedule
5. **Security**: Review IAM permissions and network rules

---

**Project Structure Reference:**
- `terraform/environments/preprod/`: Environment-specific configuration
- `terraform/modules/`: Reusable infrastructure modules
- `deploy.sh`: Automated deployment script
- `Makefile`: Common operations and shortcuts