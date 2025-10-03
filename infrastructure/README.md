# Perundhu Infrastructure

This directory contains Terraform configurations for deploying Perundhu's infrastructure to Google Cloud Platform.

## Architecture Overview

The infrastructure includes:

- **VPC Network**: Private networking with public/private subnets
- **Cloud SQL MySQL**: Managed MySQL database with private IP
- **Redis**: Managed Redis instance for caching
- **Cloud Storage**: Buckets for images, backups, logs, and static assets
- **Pub/Sub**: Message queues for image processing, notifications, and analytics
- **Cloud Run**: Containerized backend application
- **Secret Manager**: Secure storage for sensitive configuration
- **IAM**: Service accounts and roles with least privilege
- **Monitoring**: Alerts, dashboards, and uptime checks

## Directory Structure

```
infrastructure/
├── terraform/
│   ├── environments/
│   │   └── preprod/          # PreProd environment
│   │       ├── main.tf
│   │       ├── variables.tf
│   │       ├── outputs.tf
│   │       └── terraform.tfvars.example
│   └── modules/              # Reusable Terraform modules
│       ├── vpc/
│       ├── database/
│       ├── pubsub/
│       ├── storage/
│       ├── redis/
│       ├── secrets/
│       ├── iam/
│       ├── cloud_run/
│       └── monitoring/
├── deploy.sh                 # Deployment script
└── README.md                # This file
```

## Prerequisites

1. **Google Cloud SDK**: Install and configure
   ```bash
   # Install gcloud CLI
   curl https://sdk.cloud.google.com | bash
   exec -l $SHELL
   
   # Authenticate
   gcloud auth login
   gcloud auth application-default login
   ```

2. **Terraform**: Version >= 1.0
   ```bash
   # Install Terraform
   brew install terraform  # macOS
   # or download from https://terraform.io/downloads
   ```

3. **GCP Project**: Create or use existing project
   ```bash
   gcloud projects create your-project-id
   gcloud config set project your-project-id
   ```

4. **Billing**: Ensure billing is enabled for your project

## Quick Start

### 1. Configure Environment

```bash
cd infrastructure/terraform/environments/preprod
cp terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars` with your values:

```hcl
project_id = "your-gcp-project-id"
region     = "us-central1"
notification_email = "admin@yourcompany.com"
```

### 2. Deploy Infrastructure

```bash
# From infrastructure/ directory
./deploy.sh -p your-gcp-project-id -e preprod
```

Or deploy manually:

```bash
cd terraform/environments/preprod
terraform init
terraform plan -var="project_id=your-gcp-project-id"
terraform apply
```

### 3. Note Configuration

After deployment, save these outputs for your application:

```bash
terraform output
```

## Configuration

### Environment Variables

Update your application with these environment variables (from Terraform outputs):

```bash
# Database
export GCP_INSTANCE_CONNECTION_NAME="project:region:instance"
export MYSQL_DATABASE="perundhu"
export MYSQL_USERNAME="perundhu_user"
export MYSQL_PASSWORD="<from-secret-manager>"

# Redis
export REDIS_HOST="10.x.x.x"
export REDIS_PORT="6379"
export REDIS_AUTH="<from-secret-manager>"

# Storage
export STORAGE_BUCKET_IMAGES="perundhu-preprod-images-xxxxxxxx"

# Pub/Sub
export PUBSUB_TOPIC_IMAGE_PROCESSING="perundhu-preprod-image-processing"
export PUBSUB_TOPIC_NOTIFICATIONS="perundhu-preprod-notifications"
```

### Application Properties

Update `application-preprod.properties`:

```properties
# Database (these will be set automatically in Cloud Run)
spring.datasource.url=jdbc:mysql://google/${MYSQL_DATABASE}?socketFactory=com.google.cloud.sql.mysql.SocketFactory&cloudSqlInstance=${GCP_INSTANCE_CONNECTION_NAME}
spring.datasource.username=${MYSQL_USERNAME}
spring.datasource.password=${MYSQL_PASSWORD}

# Redis
spring.redis.host=${REDIS_HOST}
spring.redis.port=${REDIS_PORT}
spring.redis.password=${REDIS_AUTH}

# Storage
app.storage.bucket.images=${STORAGE_BUCKET_IMAGES}
```

## Deployment Options

### Deploy Script Options

```bash
./deploy.sh [OPTIONS]

Options:
    -e, --environment ENV    Environment (default: preprod)
    -p, --project PROJECT    GCP Project ID (required)
    -r, --region REGION      GCP Region (default: us-central1)
    -y, --auto-approve      Auto approve changes
    -d, --destroy           Destroy infrastructure
    -h, --help              Show help
```

### Examples

```bash
# Deploy to preprod
./deploy.sh -p my-project -e preprod

# Auto-approve deployment
./deploy.sh -p my-project -e preprod -y

# Deploy to different region
./deploy.sh -p my-project -e preprod -r europe-west1

# Destroy infrastructure
./deploy.sh -p my-project -e preprod -d
```

## Security

### IAM Roles

The infrastructure creates service accounts with minimal required permissions:

- **Backend Service Account**: Access to Cloud SQL, Storage, Pub/Sub, Secrets
- **Cloud Build Service Account**: Deploy to Cloud Run

### Network Security

- Database uses private IP only
- Redis accessible only from VPC
- Cloud Run connects via VPC connector
- Firewall rules restrict access

### Secrets Management

- Database passwords stored in Secret Manager
- Redis auth tokens secured
- JWT secrets auto-generated
- API keys encrypted

## Monitoring

### Dashboards

Access monitoring dashboard:
```
https://console.cloud.google.com/monitoring/dashboards/custom/[dashboard-id]
```

### Alerts

Configured alerts for:
- Application uptime
- High error rates
- Database connection limits
- Redis memory usage

### Logs

View application logs:
```bash
gcloud logs read "resource.type=cloud_run_revision"
```

## Troubleshooting

### Common Issues

1. **API Not Enabled**
   ```bash
   gcloud services enable [api-name]
   ```

2. **Permissions Error**
   ```bash
   gcloud auth application-default login
   ```

3. **State Bucket Issues**
   ```bash
   gsutil mb gs://your-project-terraform-state-preprod
   ```

4. **Quota Exceeded**
   - Check quotas in GCP Console
   - Request quota increases if needed

### Debug Commands

```bash
# Check Terraform state
terraform show

# Validate configuration
terraform validate

# Check resources
terraform state list

# View specific resource
terraform state show [resource-name]
```

## Costs

### Estimated Monthly Costs (PreProd)

- Cloud SQL (db-f1-micro): ~$9
- Redis (1GB): ~$35
- Cloud Run (minimal usage): ~$5
- Cloud Storage: ~$2
- Networking: ~$5
- **Total**: ~$56/month

### Cost Optimization

- Use smaller instance sizes for preprod
- Enable automatic scaling
- Set up budget alerts
- Review usage regularly

## Maintenance

### Updates

```bash
# Update Terraform providers
terraform init -upgrade

# Apply updates
terraform plan
terraform apply
```

### Backups

- Database: Automated daily backups (7-day retention)
- Application data: Stored in Cloud Storage
- Terraform state: Versioned in GCS

### Disaster Recovery

- Database: Point-in-time recovery available
- Application: Stateless, quick redeployment
- Data: Geo-replicated storage

## Support

For issues:
1. Check Terraform logs
2. Verify GCP quotas and permissions
3. Review monitoring dashboards
4. Check application logs in Cloud Logging

## Next Steps

1. **Application Deployment**: Build and deploy your container
2. **Domain Setup**: Configure custom domain and SSL
3. **CI/CD**: Set up automated deployments
4. **Production**: Create production environment
5. **Scaling**: Configure auto-scaling policies
