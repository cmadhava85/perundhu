# 🚀 PRODUCTION DEPLOYMENT GUIDE - JANUARY 2026
**Updated**: January 23, 2026  
**For**: Perundhu Bus Tracker Application  
**Target Domain**: perundhu.com (custom domain)  
**Environment**: Google Cloud Platform (GCP)  
**Architecture**: Cloud Run + Cloud SQL + Cloud Storage

---

## 📋 TABLE OF CONTENTS

1. [Pre-Deployment Planning](#pre-deployment-planning)
2. [Infrastructure Setup](#infrastructure-setup)
3. [Database Setup & Migrations](#database-setup--migrations)
4. [Application Deployment](#application-deployment)
5. [Domain Configuration](#domain-configuration)
6. [Verification & Testing](#verification--testing)
7. [Post-Deployment Monitoring](#post-deployment-monitoring)
8. [Troubleshooting & Rollback](#troubleshooting--rollback)

---

## PRE-DEPLOYMENT PLANNING

### Phase 0: Pre-Deployment (TODAY - Complete Within 24 Hours)

#### 0.1 Domain Verification ✅
```
Domain: perundhu.com
Status: ✅ Ready (provided by user)
Registrar: [Document where registered]
DNS Admin: [Assign person]
TTL Setting: 3600 (recommended for production)
```

**Actions**:
- [ ] Verify domain access in registrar console
- [ ] Confirm DNS admin has credentials
- [ ] Document DNS records location
- [ ] Take backup of current DNS records (screenshot)

#### 0.2 GCP Project Setup
```bash
# 1. Create GCP Project
gcloud projects create perundhu-production-2026 \
  --name="Perundhu Bus Tracker - Production" \
  --enable-cloud-apis

# Set as active project
gcloud config set project perundhu-production-2026

# Enable required APIs
gcloud services enable \
  compute.googleapis.com \
  sql.googleapis.com \
  run.googleapis.com \
  containerregistry.googleapis.com \
  storage-api.googleapis.com \
  secret.googleapis.com \
  cloudresourcemanager.googleapis.com \
  iam.googleapis.com \
  monitoring.googleapis.com \
  logging.googleapis.com

# Get Project ID
export PROJECT_ID=$(gcloud config get-value project)
echo "Project ID: $PROJECT_ID"
```

**Required Outputs**:
- [ ] Project ID: `______________________`
- [ ] Billing Account linked
- [ ] APIs enabled (11+ services)

#### 0.3 Secrets Preparation
Create file: `.secrets-production-env` (LOCAL ONLY - NOT IN GIT)

```bash
# Generate new secrets
export JWT_SECRET=$(openssl rand -base64 32)
export DB_PASSWORD=$(openssl rand -base64 24)
export APP_ENCRYPTION_KEY=$(openssl rand -base64 32)

# Create secrets file (SECURE - NEVER COMMIT)
cat > .secrets-production-env << 'EOF'
# ⚠️ PRODUCTION SECRETS - DO NOT COMMIT - DELETE AFTER DEPLOYMENT
PROJECT_ID="perundhu-production-2026"
REGION="asia-south1"
ZONE="asia-south1-a"

# Database
DB_INSTANCE="perundhu-prod-mysql"
DB_NAME="perundhu"
DB_USER="prod_user"
DB_PASSWORD="[WILL_BE_SET_BELOW]"

# Application
APP_ENCRYPTION_KEY="[WILL_BE_SET_BELOW]"
JWT_SIGNING_SECRET="[WILL_BE_SET_BELOW]"

# Domain
DOMAIN_NAME="perundhu.com"
API_DOMAIN="api.perundhu.com"

# Gemini API (⚠️ Generate fresh key)
GEMINI_API_KEY="[NEW_KEY_FROM_GOOGLE_CLOUD_CONSOLE]"

# reCAPTCHA (update existing)
RECAPTCHA_SECRET_KEY="[FROM_RECAPTCHA_CONSOLE]"

# Storage
IMAGE_BUCKET="perundhu-prod-images"

# Monitoring
MONITORING_EMAIL="your-email@example.com"
EOF

chmod 600 .secrets-production-env
```

**Actions**:
- [ ] Generate JWT secret
- [ ] Generate DB password
- [ ] Generate encryption key
- [ ] Create NEW Gemini API key (old one compromised)
- [ ] Obtain reCAPTCHA secret
- [ ] Document all secrets securely (password manager)

---

## INFRASTRUCTURE SETUP

### Phase 1: Infrastructure Deployment (Duration: 60-90 minutes)

#### 1.1 Prepare Terraform Variables

```bash
# Source secrets
source .secrets-production-env

# Navigate to production Terraform directory
cd infrastructure/terraform/environments/production

# Copy and edit terraform.tfvars
cp terraform.tfvars.example terraform.tfvars

# Edit with production values
cat > terraform.tfvars << 'EOF'
project_id              = "perundhu-production-2026"
region                  = "asia-south1"
zone                    = "asia-south1-a"
environment             = "production"
app_name                = "perundhu"

# Database
db_version              = "MYSQL_8_0"
db_instance_tier        = "db-n1-standard-1"
db_disk_size            = 100
db_disk_type            = "PD_SSD"
db_root_password        = "WILL_BE_GENERATED_BY_TERRAFORM"

# Cloud Run
run_region              = "asia-south1"
run_memory              = "2Gi"
run_cpu                 = "2"
run_max_instances       = 50
run_min_instances       = 1

# Storage
storage_location        = "ASIA"
enable_cdn              = true

# Domain
domain_name             = "perundhu.com"
api_subdomain           = "api"

# Monitoring & Logging
enable_monitoring       = true
enable_logging          = true
log_retention_days      = 30

# Backup Configuration
backup_enabled          = true
backup_retention_days   = 30

# Tags for cost tracking
labels = {
  environment = "production"
  project     = "perundhu"
  managed_by  = "terraform"
  cost_center = "operations"
}
EOF
```

#### 1.2 Initialize Terraform Backend

```bash
# Create GCS bucket for Terraform state
gsutil mb -p $PROJECT_ID -l asia-south1 \
  gs://${PROJECT_ID}-terraform-state

# Enable versioning (for disaster recovery)
gsutil versioning set on gs://${PROJECT_ID}-terraform-state

# Initialize Terraform with GCS backend
terraform init \
  -backend-config="bucket=${PROJECT_ID}-terraform-state" \
  -backend-config="prefix=production/state"
```

**Verification**:
```bash
# Check if state bucket was created
gsutil ls -b gs://${PROJECT_ID}-terraform-state
# Should return: gs://perundhu-production-2026-terraform-state/
```

#### 1.3 Validate & Plan Infrastructure

```bash
# Validate Terraform configuration
terraform validate

# Create and save deployment plan
terraform plan \
  -var="project_id=$PROJECT_ID" \
  -out=tfplan \
  | tee terraform-plan-$(date +%Y%m%d_%H%M%S).txt

# Review the plan output - should show:
# - 1 VPC with private subnets
# - 1 Cloud SQL instance (MySQL 8.0)
# - 1 Cloud Run backend service
# - 1 Cloud Run frontend service
# - 2 Load balancers
# - Cloud Storage bucket for images
# - Cloud Secret Manager secrets
# - Service accounts and IAM roles
```

**CHECKPOINT**: Review output before proceeding
- [ ] All resources properly configured
- [ ] No destructive changes
- [ ] Database backup retention set
- [ ] Security groups properly configured
- [ ] **APPROVAL REQUIRED** - Sign off: ________

#### 1.4 Apply Infrastructure

```bash
# Apply the infrastructure changes
terraform apply tfplan

# Monitor progress
watch terraform show
```

**Expected Duration**: 15-25 minutes

**Outputs to capture**:
```bash
# Save all outputs for reference
terraform output -json > production-outputs.json

# Extract key values
export DB_INSTANCE=$(terraform output -raw db_instance_name)
export DB_CONNECTION=$(terraform output -raw db_connection_name)
export DB_PRIVATE_IP=$(terraform output -raw db_private_ip)
export STORAGE_BUCKET=$(terraform output -raw images_bucket_name)
export SERVICE_ACCOUNT=$(terraform output -raw backend_service_account_email)
export BACKEND_SERVICE_NAME=$(terraform output -raw backend_service_name)
export FRONTEND_SERVICE_NAME=$(terraform output -raw frontend_service_name)

# Display all outputs
terraform output
```

#### 1.5 Verify Infrastructure

```bash
# Check Cloud SQL Instance
gcloud sql instances describe $DB_INSTANCE \
  --project=$PROJECT_ID

# Expected output includes:
# - State: RUNNABLE
# - DatabaseVersion: MYSQL_8_0
# - Region: asia-south1
# - PrivateNetwork: projects/PROJECT/global/networks/perundhu-vpc
```

**Verification Checklist**:
- [ ] Cloud SQL instance RUNNABLE
- [ ] Cloud Storage bucket created
- [ ] VPC network created
- [ ] Service accounts created
- [ ] Cloud Run services created (backend + frontend)
- [ ] Load balancers configured
- [ ] All security rules applied

---

## DATABASE SETUP & MIGRATIONS

### Phase 2: Database Initialization (Duration: 30-45 minutes)

#### 2.1 Setup Cloud SQL Proxy Connection

```bash
# Download Cloud SQL proxy (if not already installed)
curl -o cloud-sql-proxy \
  https://dl.google.com/cloudsql/cloud_sql_proxy.mac.64bit
chmod +x cloud-sql-proxy

# Start Cloud SQL proxy
./cloud-sql-proxy "$DB_CONNECTION" \
  --port=3306 \
  --max-connections=5 &

# Verify connection
mysql -h 127.0.0.1 -u root -p"$DB_PASSWORD" -e "SELECT VERSION();"
```

#### 2.2 Create Application Database & User

```bash
# Connect to database
mysql -h 127.0.0.1 -u root -p"$DB_PASSWORD" << 'SQL'

-- Create database
CREATE DATABASE IF NOT EXISTS perundhu CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create application user
CREATE USER IF NOT EXISTS 'prod_user'@'%' IDENTIFIED BY 'PRODUCTION_PASSWORD';

-- Grant privileges
GRANT ALL PRIVILEGES ON perundhu.* TO 'prod_user'@'%';

-- Create backup user (read-only)
CREATE USER IF NOT EXISTS 'backup_user'@'%' IDENTIFIED BY 'BACKUP_PASSWORD';
GRANT SELECT ON perundhu.* TO 'backup_user'@'%';

-- Apply changes
FLUSH PRIVILEGES;

-- Verify
SHOW DATABASES;
SELECT User, Host FROM mysql.user;

SQL
```

**Documentation**:
```
Database Credentials (store securely):
- Host: [DB_PRIVATE_IP]
- Port: 3306
- Database: perundhu
- Application User: prod_user / [PASSWORD]
- Backup User: backup_user / [PASSWORD]
```

#### 2.3 Apply Database Migrations

```bash
# Using Flyway (if configured in project)
./gradlew flywayMigrate \
  -Dflyway.url="jdbc:mysql://127.0.0.1:3306/perundhu" \
  -Dflyway.user="prod_user" \
  -Dflyway.password="$DB_PASSWORD" \
  -Dspring.profiles.active=production

# Verify migrations applied
mysql -h 127.0.0.1 -u prod_user -p"$DB_PASSWORD" perundhu << 'SQL'
SELECT * FROM flyway_schema_history ORDER BY version DESC LIMIT 10;
SELECT COUNT(*) as total_tables FROM information_schema.tables WHERE table_schema = 'perundhu';
SQL
```

#### 2.4 Verify Database Schema

```bash
# Check critical tables exist
mysql -h 127.0.0.1 -u prod_user -p"$DB_PASSWORD" perundhu << 'SQL'

-- List all tables
SHOW TABLES;

-- Check key tables
SELECT 'buses' as table_name, COUNT(*) as row_count FROM buses
UNION
SELECT 'locations', COUNT(*) FROM locations
UNION
SELECT 'users', COUNT(*) FROM users;

-- Check indexing
SHOW INDEX FROM buses;
SHOW INDEX FROM locations;

SQL
```

**Success Criteria**:
- [ ] All migrations applied successfully
- [ ] All tables created
- [ ] Indexes created
- [ ] Sample data loads correctly (if applicable)

---

## 🗄️ DATA LOADING & SEED DATA

### Phase 2.5: Load Location & Bus Data (Duration: 30-60 minutes)

**Purpose**: Load seed data (locations, routes, schedules) after schema migrations but before services go live

**Owner**: Database Administrator  
**Prerequisites**: Phase 2 complete (database migrations applied and verified)

#### 2.5.1 Overview
After database schema is ready, you need to populate it with seed data:
- **500+ locations** (Indian cities, towns, bus stations)
- **1000+ bus routes** (TNSTC, MTC, other operators)
- **5000+ bus stops** (per route with arrival/departure times)

#### 2.5.2 Pre-Load Verification

```bash
# 1. Verify tables are empty
gcloud sql connect perundhu-prod-mysql \
  --user=prod_user \
  --database=perundhu \
  --quiet

SELECT COUNT(*) FROM locations;  -- Should be 0
SELECT COUNT(*) FROM buses;      -- Should be 0
SELECT COUNT(*) FROM stops;      -- Should be 0
\q
```

#### 2.5.3 Create Pre-Load Backup (CRITICAL)

```bash
# Create backup before loading any data
BACKUP_NAME="pre-data-load-$(date +%Y%m%d-%H%M%S)"

gcloud sql backups create \
  --instance=perundhu-prod-mysql \
  --description="Before seed data loading" \
  $BACKUP_NAME

# Verify backup started
gcloud sql backups list --instance=perundhu-prod-mysql

# Save backup ID for potential rollback
echo "Backup ID: $BACKUP_NAME" >> deployment-log.txt
```

#### 2.5.4 Setup Python Environment

```bash
# Activate Python environment
cd /Users/mchand69/Documents/perundhu
source .venv/bin/activate

# Verify mysql-connector installed
python3 -c "import mysql.connector; print('✅ Ready')"

# If missing:
# pip install mysql-connector-python
```

#### 2.5.5 Set Production Environment Variables

```bash
# These enable the data loader to connect to production database
export DB_HOST_PROD="10.0.0.5"  # Cloud SQL private IP
export DB_PORT_PROD="3306"
export DB_USER_PROD="prod_user"
export DB_PASSWORD_PROD="$(gcloud secrets versions access latest --secret=prod-db-password)"
export DB_NAME_PROD="perundhu"

# Verify connection works
python3 -c "
import mysql.connector
import os
conn = mysql.connector.connect(
  host=os.getenv('DB_HOST_PROD'),
  port=int(os.getenv('DB_PORT_PROD')),
  user=os.getenv('DB_USER_PROD'),
  password=os.getenv('DB_PASSWORD_PROD'),
  database=os.getenv('DB_NAME_PROD')
)
print('✅ Database connection successful')
conn.close()
"
```

#### 2.5.6 Validate Data Files

```bash
# Validate locations file before loading
python3 scripts/unified_data_loader.py \
  --mode validate \
  --environment prod \
  --data-file data/tamil_nadu_locations_enhanced.json

# Expected output:
# 🔍 VALIDATION MODE
# 📋 Locations: 500 records
# ✅ All locations are valid
```

#### 2.5.7 Load Locations Data

```bash
# Load 500+ locations to database
python3 scripts/unified_data_loader.py \
  --mode locations \
  --environment prod \
  --data-file data/tamil_nadu_locations_enhanced.json

# Expected output:
# 📍 LOCATIONS MODE
# Environment: prod
# 🚀 Uploading 500 locations...
# ✅ Processed 500/500 locations
# ✅ Locations upload complete:
#    Inserted: 500
#    Skipped:  0
#    Errors:   0

# Time: ~5-10 minutes
```

#### 2.5.8 Load Bus Routes & Stops

```bash
# Load TNSTC buses (1000+ routes with 5000+ stops)
python3 scripts/unified_data_loader.py \
  --mode buses \
  --environment prod \
  --data-file data/tnstc_consolidated.json \
  --operator TNSTC

# Expected output:
# 🚌 BUSES MODE
# Environment: prod
# Operator: TNSTC
# 📂 Loading buses from: data/tnstc_consolidated.json
# 📋 Loading location map...
# ✅ Loaded 500 location mappings
# 🚀 Uploading 1000 buses with stops...
# ✅ Buses upload complete:
#    Buses inserted:  1000
#    Stops inserted:  5000
#    Errors:          0

# Time: ~10-20 minutes
```

#### 2.5.9 Verify Data Loaded

```bash
# Connect to database
gcloud sql connect perundhu-prod-mysql \
  --user=prod_user \
  --database=perundhu \
  --quiet

# Run verification counts
SELECT 'Locations' as entity, COUNT(*) as count FROM locations
UNION ALL
SELECT 'Buses', COUNT(*) FROM buses
UNION ALL
SELECT 'Stops', COUNT(*) FROM stops;

# Expected output:
# +-----------+-------+
# | entity    | count |
# +-----------+-------+
# | Locations | 500   |
# | Buses     | 1000  |
# | Stops     | 5000  |
# +-----------+-------+

# Check for data integrity
SELECT COUNT(*) FROM locations 
WHERE latitude NOT BETWEEN -90 AND 90;
-- Expected: 0 (no invalid coordinates)

\q
```

#### 2.5.10 Troubleshooting Data Loading

**Issue**: Connection Failed
```bash
# Verify environment variables
echo $DB_HOST_PROD
echo $DB_USER_PROD

# Use Cloud SQL Proxy if needed
./cloud_sql_proxy -instances=perundhu-production-2026:asia-south1:perundhu-prod-mysql=tcp:3306 &
export DB_HOST_PROD="localhost"
```

**Issue**: Duplicate Entry Errors
```bash
# Script automatically skips duplicates - this is expected
# If you need to reload, force overwrite with:
python3 scripts/unified_data_loader.py \
  --mode locations \
  --environment prod \
  --data-file data/tamil_nadu_locations_enhanced.json \
  --force-overwrite
```

**Issue**: Timeout or Slow Performance
```bash
# Resume from checkpoint
python3 scripts/unified_data_loader.py \
  --mode buses \
  --environment prod \
  --checkpoint data/migration_checkpoint.json

# Or retry with smaller batches
python3 scripts/unified_data_loader.py \
  --mode buses \
  --environment prod \
  --data-file data/tnstc_consolidated.json \
  --batch-size 100
```

**Issue**: Need to Rollback
```bash
# Restore from pre-load backup
gcloud sql backups restore $BACKUP_NAME \
  --backup-instance=perundhu-prod-mysql

# This restarts the instance and rolls back to backup snapshot
```

#### 2.5.11 Success Criteria - Phase 2.5 Complete When

- [ ] 500 locations verified in database
- [ ] 1000+ buses verified in database
- [ ] 5000+ stops verified in database
- [ ] No duplicate entries (SELECT COUNT GROUP BY)
- [ ] No invalid data (coordinates check)
- [ ] Foreign keys valid (no orphaned records)
- [ ] No errors in logs
- [ ] Database backup created successfully
- [ ] Data loader script completed without errors

#### 2.5.12 Documentation

- [ ] Data load completion logged in deployment-log.txt
- [ ] Backup ID recorded
- [ ] Data load command saved for audit trail
- [ ] Any issues/resolutions documented

**Full Reference**: See [PRODUCTION_DATA_LOADING_GUIDE.md](PRODUCTION_DATA_LOADING_GUIDE.md) for comprehensive details

---

## APPLICATION DEPLOYMENT

### Phase 3: Build & Push Docker Images (Duration: 45-60 minutes)

**Prerequisites**: Phase 2.5 (Data Loading) complete

#### 3.1 Update Backend Configuration

```bash
cd backend

# Create production configuration
cat > src/main/resources/application-production.properties << 'EOF'
# Spring Configuration
spring.application.name=perundhu-backend
spring.profiles.active=production

# Server Configuration
server.port=8080
server.shutdown=graceful
spring.lifecycle.timeout-per-shutdown-phase=60s

# Database Configuration
spring.datasource.url=jdbc:mysql://[DB_PRIVATE_IP]:3306/perundhu
spring.datasource.username=prod_user
spring.datasource.password=[DB_PASSWORD]
spring.datasource.hikari.maximum-pool-size=20
spring.datasource.hikari.minimum-idle=5
spring.datasource.hikari.idle-timeout=600000
spring.jpa.hibernate.ddl-auto=validate

# JPA/Hibernate Configuration
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.MySQL8Dialect
spring.jpa.properties.hibernate.format_sql=false
spring.jpa.show-sql=false
spring.jpa.properties.hibernate.jdbc.batch_size=20
spring.jpa.properties.hibernate.order_inserts=true
spring.jpa.properties.hibernate.order_updates=true

# Security Configuration
jwt.signing.secret=[JWT_SIGNING_SECRET]
jwt.expiration=86400000
app.encryption.key=[APP_ENCRYPTION_KEY]

# API Configuration
api.domain=api.perundhu.com
api.base-url=https://api.perundhu.com
frontend.url=https://perundhu.com

# Google Cloud Configuration
google.cloud.project.id=perundhu-production-2026
google.cloud.region=asia-south1

# Gemini AI Configuration
gemini.api.key=[GEMINI_API_KEY]
gemini.enabled=true

# reCAPTCHA Configuration
recaptcha.secret.key=[RECAPTCHA_SECRET_KEY]
recaptcha.site.key=[PUBLIC_RECAPTCHA_SITE_KEY]

# Actuator Configuration
management.endpoints.web.exposure.include=health,metrics,info
management.endpoint.health.show-details=when-authorized
management.metrics.export.gcp.enabled=true

# Logging Configuration
logging.level.root=INFO
logging.level.com.perundhu=DEBUG
logging.pattern.console=%d{yyyy-MM-dd HH:mm:ss} - %msg%n

# Cloud Logging
spring.cloud.gcp.logging.enabled=true

EOF
```

#### 3.2 Build Backend Docker Image

```bash
# Build backend
./gradlew clean build -x test \
  -Dspring.profiles.active=production

# Build Docker image
docker build \
  --build-arg GRADLE_BUILD_FLAGS="-x test" \
  -t gcr.io/$PROJECT_ID/perundhu-backend:1.0.0 \
  -t gcr.io/$PROJECT_ID/perundhu-backend:latest \
  .

# Scan for vulnerabilities (Trivy)
trivy image gcr.io/$PROJECT_ID/perundhu-backend:1.0.0

# Push to Google Container Registry
docker push gcr.io/$PROJECT_ID/perundhu-backend:1.0.0
docker push gcr.io/$PROJECT_ID/perundhu-backend:latest
```

**Verification**:
```bash
# Verify image in registry
gcloud container images list --project=$PROJECT_ID
gcloud container images describe \
  gcr.io/$PROJECT_ID/perundhu-backend:1.0.0
```

#### 3.3 Build Frontend Docker Image

```bash
cd ../frontend

# Create production environment file
cat > .env.production << 'EOF'
VITE_API_BASE_URL=https://api.perundhu.com
VITE_APP_NAME=Perundhu Bus Tracker
VITE_ENVIRONMENT=production
VITE_LOG_LEVEL=warn

# Gemini Integration
VITE_GEMINI_API_KEY=[GEMINI_API_KEY]

# reCAPTCHA
VITE_RECAPTCHA_SITE_KEY=[PUBLIC_RECAPTCHA_SITE_KEY]

# Analytics (optional)
VITE_ENABLE_ANALYTICS=true

# Feature Flags
VITE_ENABLE_ROUTE_MAPS=true
VITE_ENABLE_LIVE_TRACKING=true
VITE_ENABLE_VOICE_CONTRIBUTIONS=true

EOF

# Build frontend
npm run build

# Build Docker image
docker build \
  -t gcr.io/$PROJECT_ID/perundhu-frontend:1.0.0 \
  -t gcr.io/$PROJECT_ID/perundhu-frontend:latest \
  -f Dockerfile.prod \
  .

# Scan for vulnerabilities
trivy image gcr.io/$PROJECT_ID/perundhu-frontend:1.0.0

# Push to registry
docker push gcr.io/$PROJECT_ID/perundhu-frontend:1.0.0
docker push gcr.io/$PROJECT_ID/perundhu-frontend:latest
```

### Phase 4: Deploy to Cloud Run (Duration: 30-45 minutes)

#### 4.1 Deploy Backend Service

```bash
# Create service account (if not created by Terraform)
gcloud iam service-accounts create perundhu-backend-sa \
  --display-name="Perundhu Backend Service Account" \
  --project=$PROJECT_ID

# Grant necessary roles
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:perundhu-backend-sa@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/cloudsql.client"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:perundhu-backend-sa@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/storage.objectViewer"

# Deploy to Cloud Run
gcloud run deploy perundhu-backend \
  --image gcr.io/$PROJECT_ID/perundhu-backend:1.0.0 \
  --platform managed \
  --region asia-south1 \
  --service-account perundhu-backend-sa \
  --memory 2Gi \
  --cpu 2 \
  --timeout 60 \
  --max-instances 50 \
  --min-instances 1 \
  --set-env-vars "SPRING_PROFILES_ACTIVE=production" \
  --allow-unauthenticated \
  --project=$PROJECT_ID

# Get service URL
gcloud run services describe perundhu-backend \
  --region asia-south1 \
  --project=$PROJECT_ID \
  --format='value(status.url)'
```

#### 4.2 Deploy Frontend Service

```bash
# Create service account for frontend
gcloud iam service-accounts create perundhu-frontend-sa \
  --display-name="Perundhu Frontend Service Account" \
  --project=$PROJECT_ID

# Deploy to Cloud Run
gcloud run deploy perundhu-frontend \
  --image gcr.io/$PROJECT_ID/perundhu-frontend:1.0.0 \
  --platform managed \
  --region asia-south1 \
  --service-account perundhu-frontend-sa \
  --memory 512Mi \
  --cpu 1 \
  --timeout 60 \
  --max-instances 50 \
  --min-instances 1 \
  --allow-unauthenticated \
  --project=$PROJECT_ID

# Get service URL
gcloud run services describe perundhu-frontend \
  --region asia-south1 \
  --project=$PROJECT_ID \
  --format='value(status.url)'
```

**Verification Checklist**:
- [ ] Backend service deployed
- [ ] Frontend service deployed
- [ ] Services are in READY state
- [ ] Ingress set to allow all
- [ ] No deployment errors

---

## DOMAIN CONFIGURATION

### Phase 5: Custom Domain Setup (Duration: 20-30 minutes)

#### 5.1 Map Custom Domain to Cloud Run

```bash
# Create DNS records in GCP (Cloud DNS)
# OR update external DNS provider

# For Cloud DNS:
gcloud dns managed-zones create perundhu-prod \
  --dns-name=perundhu.com. \
  --description="Perundhu Production DNS Zone"

# Add A records for Cloud Run services
# Frontend: perundhu.com
gcloud dns record-sets create perundhu.com. \
  --rrdatas="[CLOUD_RUN_FRONTEND_IP]" \
  --ttl=300 \
  --type=A \
  --zone=perundhu-prod

# Backend API: api.perundhu.com
gcloud dns record-sets create api.perundhu.com. \
  --rrdatas="[CLOUD_RUN_BACKEND_IP]" \
  --ttl=300 \
  --type=A \
  --zone=perundhu-prod
```

#### 5.2 Map Custom Domain via Load Balancer

```bash
# Create SSL certificate for HTTPS
gcloud compute ssl-certificates create perundhu-prod-cert \
  --domains=perundhu.com,api.perundhu.com,www.perundhu.com \
  --global \
  --project=$PROJECT_ID

# Monitor certificate status
watch gcloud compute ssl-certificates describe perundhu-prod-cert \
  --global \
  --format='value(status)' \
  --project=$PROJECT_ID
```

#### 5.3 Update Domain Registrar DNS Records

**For your domain registrar (GoDaddy, Google Domains, etc.):**

```
FRONTEND (perundhu.com):
- Type: A
- Name: @
- Value: [Load_Balancer_IP]
- TTL: 300

API (api.perundhu.com):
- Type: A
- Name: api
- Value: [Load_Balancer_IP]
- TTL: 300

www (optional):
- Type: CNAME
- Name: www
- Value: perundhu.com
- TTL: 300
```

**Actions**:
1. Login to perundhu.com registrar account
2. Navigate to DNS settings
3. Update A records with Load Balancer IP
4. Set TTL to 300 (5 minutes) for faster updates
5. Wait 5-10 minutes for DNS propagation

**Verify DNS Resolution**:
```bash
# Check DNS resolution
nslookup perundhu.com
nslookup api.perundhu.com

# Should return Load Balancer IP
# Example: 34.x.x.x (GCP IP range)
```

---

## VERIFICATION & TESTING

### Phase 6: Health Checks & Smoke Testing (Duration: 30-45 minutes)

#### 6.1 Health Check Endpoints

```bash
# Backend health check
curl -v https://api.perundhu.com/actuator/health

# Expected Response:
# {
#   "status": "UP",
#   "components": {
#     "db": {"status": "UP"},
#     "diskSpace": {"status": "UP"},
#     "ping": {"status": "UP"}
#   }
# }

# Frontend availability
curl -v https://perundhu.com/

# Should return HTML with status 200
```

#### 6.2 API Smoke Tests

```bash
# Test bus search API
curl -X GET "https://api.perundhu.com/api/v1/buses/search" \
  -H "Content-Type: application/json" \
  -d '{"origin":"Chennai","destination":"Madurai","date":"2026-01-25"}'

# Test location endpoints
curl -X GET "https://api.perundhu.com/api/v1/locations/search?query=Chennai"

# Test authentication (if required)
curl -X POST "https://api.perundhu.com/api/v1/auth/health" \
  -H "Content-Type: application/json"
```

#### 6.3 Frontend Verification

```bash
# Check frontend loads
curl -s https://perundhu.com/ | grep -q "<title>" && echo "✅ Frontend loaded"

# Check static assets load
curl -I https://perundhu.com/index.html
curl -I https://perundhu.com/assets/main.js

# Check environment
curl https://perundhu.com/api/health 2>/dev/null | jq '.'
```

#### 6.4 Database Connectivity

```bash
# Test database connection through backend
curl -X GET https://api.perundhu.com/api/v1/actuator/db

# Should show database is connected
```

**Success Criteria**:
- [ ] Frontend accessible at https://perundhu.com
- [ ] API accessible at https://api.perundhu.com
- [ ] Health checks return UP status
- [ ] Database connected
- [ ] SSL certificates valid
- [ ] Response times < 500ms

---

## POST-DEPLOYMENT MONITORING

### Phase 7: Production Monitoring Setup (Duration: 20-30 minutes)

#### 7.1 Create Monitoring Dashboard

```bash
# Create custom dashboard
gcloud monitoring dashboards create --config-from-file=- << 'EOF'
{
  "displayName": "Perundhu Production Dashboard",
  "mosaicLayout": {
    "columns": 12,
    "tiles": [
      {
        "width": 6,
        "height": 4,
        "widget": {
          "title": "Cloud Run Request Count",
          "xyChart": {
            "dataSets": [{
              "timeSeriesQuery": {
                "timeSeriesFilter": {
                  "filter": "metric.type=\"run.googleapis.com/request_count\" resource.type=\"cloud_run_revision\"",
                  "aggregation": {
                    "alignmentPeriod": "60s",
                    "perSeriesAligner": "ALIGN_RATE"
                  }
                }
              }
            }]
          }
        }
      },
      {
        "width": 6,
        "height": 4,
        "widget": {
          "title": "Error Rate",
          "xyChart": {
            "dataSets": [{
              "timeSeriesQuery": {
                "timeSeriesFilter": {
                  "filter": "metric.type=\"run.googleapis.com/request_count\" metric.status=\"500\""
                }
              }
            }]
          }
        }
      }
    ]
  }
}
EOF
```

#### 7.2 Set Up Alert Policies

```bash
# Alert: High error rate (> 5%)
gcloud alpha monitoring policies create \
  --notification-channels=[CHANNEL_ID] \
  --display-name="High Error Rate - Perundhu Backend" \
  --condition-display-name="Error Rate > 5%" \
  --condition-threshold-value=5 \
  --condition-threshold-filter='metric.type="run.googleapis.com/request_count" resource.type="cloud_run_revision"'

# Alert: High latency (> 2000ms)
gcloud alpha monitoring policies create \
  --notification-channels=[CHANNEL_ID] \
  --display-name="High Latency - Perundhu Backend" \
  --condition-display-name="Latency > 2000ms" \
  --condition-threshold-value=2000

# Alert: Low availability (< 99%)
gcloud alpha monitoring policies create \
  --notification-channels=[CHANNEL_ID] \
  --display-name="Low Availability" \
  --condition-display-name="Availability < 99%"
```

#### 7.3 Enable Cloud Logging

```bash
# View application logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=perundhu-backend" \
  --limit 50 \
  --format json

# Create log sink for long-term storage
gcloud logging sinks create perundhu-prod-logs \
  gs://perundhu-prod-logs \
  --log-filter='resource.type="cloud_run_revision"'

# Create log-based metrics for monitoring
gcloud logging metrics create error_count \
  --log-filter='severity="ERROR"'
```

---

## TROUBLESHOOTING & ROLLBACK

### Common Issues & Solutions

#### Issue: DNS not resolving

**Symptoms**: `nslookup perundhu.com` returns NXDOMAIN

**Solutions**:
```bash
# 1. Verify nameservers updated at registrar
nslookup -type=NS perundhu.com

# 2. Wait for TTL to expire (up to 48 hours)
# 3. Clear DNS cache
# On macOS: sudo dscacheutil -flushcache
# On Linux: sudo systemctl restart systemd-resolved

# 4. Check Load Balancer IP
gcloud compute backend-services list
gcloud compute forwarding-rules list
```

#### Issue: Backend service not connecting to database

**Symptoms**: 502 Bad Gateway errors

**Solutions**:
```bash
# 1. Check Cloud SQL instance status
gcloud sql instances describe $DB_INSTANCE

# 2. Verify network connectivity
gcloud sql connect $DB_INSTANCE --user=root

# 3. Check VPC connectivity
gcloud compute networks describe perundhu-vpc

# 4. Review service logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=perundhu-backend" \
  --limit 50 \
  --format json | jq '.[] | "\(.timestamp) \(.jsonPayload.message)"'
```

#### Issue: SSL certificate not issued

**Symptoms**: "Certificate provisioning pending" after 24+ hours

**Solutions**:
```bash
# 1. Verify DNS TXT records created
nslookup -type=TXT _acme-challenge.perundhu.com

# 2. Check certificate status
gcloud compute ssl-certificates describe perundhu-prod-cert --global

# 3. Delete and recreate if stuck
gcloud compute ssl-certificates delete perundhu-prod-cert --global
# Wait 2 hours, then recreate
```

### Rollback Procedure

**If deployment fails and needs rollback:**

```bash
# 1. Revert to previous version
gcloud run deploy perundhu-backend \
  --image gcr.io/$PROJECT_ID/perundhu-backend:previous-version \
  --region asia-south1

gcloud run deploy perundhu-frontend \
  --image gcr.io/$PROJECT_ID/perundhu-frontend:previous-version \
  --region asia-south1

# 2. Rollback DNS if needed
# Update A records to point to previous IP

# 3. Rollback database (if schema changed)
# Use backup from before migration

# 4. Verify services restored
curl https://perundhu.com/actuator/health
curl https://api.perundhu.com/actuator/health

# 5. Document incident in runbook
```

---

## POST-DEPLOYMENT CHECKLIST

**After going live, complete these items:**

### Day 1 (Launch Day)
- [ ] Monitor error rates (< 1%)
- [ ] Monitor latency (< 500ms)
- [ ] Check database connections
- [ ] Verify backups are running
- [ ] Test manual failover
- [ ] Monitor logs for errors

### Week 1
- [ ] Review performance metrics
- [ ] Verify backup restoration works
- [ ] Confirm SSL certificate auto-renewal
- [ ] Test disaster recovery procedure
- [ ] Document any incidents
- [ ] Optimize slow queries (if any)

### Month 1
- [ ] Review cost optimization opportunities
- [ ] Analyze user behavior & performance
- [ ] Plan capacity for scale
- [ ] Schedule post-launch review
- [ ] Update runbooks based on learnings

---

## KEY RESOURCES

- **Terraform Code**: `infrastructure/terraform/environments/production/`
- **CI/CD Pipeline**: `.github/workflows/`
- **Backend Code**: `backend/src/main/`
- **Frontend Code**: `frontend/src/`
- **Documentation**: This file + PRODUCTION_DOCUMENTATION_INDEX.md

---

## SUPPORT & ESCALATION

| Issue | Contact | Response Time |
|-------|---------|----------------|
| Deployment emergency | On-call engineer | 15 min |
| Performance issues | DevOps team | 1 hour |
| Application bugs | Backend team | 2 hours |
| Infrastructure issues | Cloud platform team | 1 hour |

---

## SIGN-OFF

**Before launching, ensure all stakeholders sign off:**

- [ ] **Tech Lead**: Infrastructure reviewed & approved
- [ ] **DevOps Lead**: Deployment plan reviewed & approved
- [ ] **Security Lead**: Security review completed
- [ ] **QA Lead**: Testing completed
- [ ] **Product Owner**: Ready to launch

---

**Document Version**: 1.0  
**Last Updated**: January 23, 2026  
**Next Review**: 30 days post-launch  
**Owner**: DevOps / Infrastructure Team

🚀 **Ready to deploy to production!**
