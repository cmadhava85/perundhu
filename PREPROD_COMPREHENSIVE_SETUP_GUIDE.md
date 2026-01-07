# Preprod Comprehensive Setup Guide

**Date**: January 7, 2026  
**Objective**: Fix all preprod configuration issues and complete setup for deployment  
**Focus**: PREPROD ONLY - Production untouched  
**Status**: In Progress

---

## Current Issues Identified

### 1. **Database Connection Issues**
- ✅ Cloud SQL instance name: `perundhu-preprod-mysql-asia` (correct in application-preprod.properties)
- ❌ Issue: Preprod Flyway disabled by default in application-preprod.properties
- ❌ Issue: Database connection credentials not validated
- ❌ Issue: Connection timeouts might be occurring

### 2. **Configuration Contamination**
- ⚠️ Warning: `application-production.properties` uses Secret Manager (sm://)
- ⚠️ Warning: `application-preprod.properties` mixes env vars and Secret Manager
- **Status**: Currently on separate profiles - SAFE but needs cleaner approach

### 3. **Flyway Migration Issues**
- ❌ Disabled: `spring.flyway.enabled=${FLYWAY_ENABLED:false}`
- ⚠️ Needs: Explicit enabling during deployment
- ⚠️ Risk: Migrations won't run on startup without explicit configuration

### 4. **Terraform Separation**
- ✅ Good: Separate Terraform environments (preprod vs production)
- ✅ Good: Different tfvars files
- ⚠️ Warning: Need to verify prod files not referenced

---

## Phase 1: Verify & Fix Configuration

### Step 1.1: Validate Preprod Configuration Files

**Check application-preprod.properties:**
```bash
grep -n "spring.datasource.url\|spring.flyway.enabled\|DB_USERNAME\|DB_PASSWORD" \
  backend/app/src/main/resources/application-preprod.properties
```

**Expected Output:**
```
spring.datasource.url=jdbc:mysql://34.180.30.115:3306/perundhu?...
spring.datasource.username=${DB_USERNAME:${MYSQL_USERNAME:perundhu_user}}
spring.datasource.password=${DB_PASSWORD:${MYSQL_PASSWORD:}}
spring.flyway.enabled=${FLYWAY_ENABLED:false}
```

**Status**: ✅ Correct as of last check

### Step 1.2: Verify Production Isolation

**Check that production.properties uses Secret Manager only:**
```bash
grep "^spring.datasource\|^app.jwt\|^admin.auth\|^recaptcha" \
  backend/app/src/main/resources/application-production.properties | head -10
```

**Expected**: All should use `${sm://...}` format
**Status**: ✅ Correct - Production is isolated

### Step 1.3: Check Terraform Variables

**Verify preprod terraform.tfvars:**
```bash
cat infrastructure/terraform/environments/preprod/terraform.tfvars
```

**Must verify**:
- ✅ `project_id = "astute-strategy-406601"` (preprod project)
- ✅ `db_instance_name_suffix = "-asia"`
- ✅ NO references to prod project ID

**Status**: ✅ Correct as per previous check

---

## Phase 2: Build & Push Docker Image

### Step 2.1: Set Environment Variables

```bash
export GCP_PROJECT_ID="astute-strategy-406601"
export GCP_REGION="asia-south1"
export ARTIFACT_REGISTRY="${GCP_REGION}-docker.pkg.dev"
export BACKEND_IMAGE="${ARTIFACT_REGISTRY}/${GCP_PROJECT_ID}/perundhu/backend:preprod-$(date +%s)"
export BACKEND_IMAGE_LATEST="${ARTIFACT_REGISTRY}/${GCP_PROJECT_ID}/perundhu/backend:preprod-latest"
```

### Step 2.2: Configure Docker Authentication

```bash
gcloud auth configure-docker ${ARTIFACT_REGISTRY} --quiet
```

### Step 2.3: Build Backend Docker Image

```bash
cd /Users/mchand69/Documents/perundhu/backend

# Build JAR with preprod profile
./gradlew clean build -Dspring.profiles.active=preprod -x test --no-daemon 2>&1 | tail -30
```

**Expected**: Build succeeds with "BUILD SUCCESSFUL"

### Step 2.4: Build Docker Image

```bash
docker build -t ${BACKEND_IMAGE} -t ${BACKEND_IMAGE_LATEST} .
```

**Expected**: Docker image built successfully

### Step 2.5: Push to Artifact Registry

```bash
docker push ${BACKEND_IMAGE}
docker push ${BACKEND_IMAGE_LATEST}
```

**Expected**: Images pushed to Artifact Registry

---

## Phase 3: Terraform Provisioning

### Step 3.1: Prepare Terraform

```bash
cd infrastructure/terraform/environments/preprod

# Initialize Terraform
terraform init

# Verify no state references prod
terraform state list 2>&1 | head -5
```

**Expected**: If first time, state should be empty. No prod resources.

### Step 3.2: Plan Terraform

```bash
terraform plan \
  -var="project_id=astute-strategy-406601" \
  -var="notification_email=alerts@perundhu.com" \
  -var="db_version=MYSQL_8_0" \
  -var="db_instance_tier=db-f1-micro" \
  -var="db_instance_name_suffix=-asia" \
  -out=tfplan
```

**Critical Checks**:
- ❌ Should NOT show any changes to `perundhu-prod-*` resources
- ✅ Should show preprod Cloud SQL instance: `perundhu-preprod-mysql-asia`
- ✅ Should show preprod Cloud Run service
- ✅ Should show preprod VPC & networking

### Step 3.3: Apply Terraform

```bash
# Review the plan first
terraform show tfplan | grep "resource\|id\|name" | head -30

# Apply if correct
terraform apply tfplan
```

**Expected**: Infrastructure created in 5-10 minutes

### Step 3.4: Capture Outputs

```bash
# Get important outputs
terraform output -json | jq '.' > /tmp/preprod-outputs.json

# Get Cloud SQL instance connection string
CLOUD_SQL_INSTANCE=$(terraform output -raw sql_instance_connection_name 2>/dev/null || echo "astute-strategy-406601:asia-south1:perundhu-preprod-mysql-asia")
echo "Cloud SQL Connection: $CLOUD_SQL_INSTANCE"
```

---

## Phase 4: Prepare Database Secrets

### Step 4.1: Create Database User (if not exists)

```bash
# Connect to Cloud SQL instance temporarily to verify/create user
gcloud sql connect perundhu-preprod-mysql-asia \
  --user=root \
  --region=asia-south1 \
  --project=astute-strategy-406601
```

**In MySQL prompt:**
```sql
-- Check if user exists
SELECT User FROM mysql.user WHERE User='perundhu_user';

-- If not exists, create it
CREATE USER IF NOT EXISTS 'perundhu_user'@'%' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON perundhu.* TO 'perundhu_user'@'%';
FLUSH PRIVILEGES;

-- Verify database exists
CREATE DATABASE IF NOT EXISTS perundhu;
SHOW DATABASES;
```

### Step 4.2: Store Secrets in GCP Secret Manager

```bash
# Create/update database credentials in Secret Manager
echo -n "perundhu_user" | gcloud secrets create db-username --data-file=- --replication-policy="user-managed" --locations="asia-south1" --project=astute-strategy-406601 2>/dev/null || \
echo -n "perundhu_user" | gcloud secrets versions add db-username --data-file=- --project=astute-strategy-406601

# Store password (use actual secure password)
echo -n "your_secure_password" | gcloud secrets versions add db-password --data-file=- --project=astute-strategy-406601

# Verify secrets exist
gcloud secrets list --project=astute-strategy-406601 | grep db-
```

---

## Phase 5: Deploy Backend to Cloud Run

### Step 5.1: Retrieve Secrets for Deployment

```bash
DB_USERNAME=$(gcloud secrets versions access latest --secret=db-username --project=astute-strategy-406601)
DB_PASSWORD=$(gcloud secrets versions access latest --secret=db-password --project=astute-strategy-406601)
GEMINI_API_KEY=$(gcloud secrets versions access latest --secret=gemini-api-key --project=astute-strategy-406601 2>/dev/null || echo "YOUR_GEMINI_KEY")
```

### Step 5.2: Deploy Backend to Cloud Run

```bash
gcloud run deploy perundhu-backend-preprod \
  --image="${ARTIFACT_REGISTRY}/${GCP_PROJECT_ID}/perundhu/backend:preprod-latest" \
  --platform=managed \
  --region=asia-south1 \
  --allow-unauthenticated \
  --project=astute-strategy-406601 \
  --set-env-vars \
    SPRING_PROFILES_ACTIVE=preprod,\
    GCP_INSTANCE_CONNECTION_NAME=astute-strategy-406601:asia-south1:perundhu-preprod-mysql-asia,\
    DB_USERNAME=${DB_USERNAME},\
    DB_PASSWORD=${DB_PASSWORD},\
    GEMINI_API_KEY=${GEMINI_API_KEY},\
    FLYWAY_ENABLED=true,\
    SERVER_PORT=8080,\
    LOG_LEVEL_ROOT=INFO,\
    LOG_LEVEL_APP=INFO \
  --add-cloudsql-instances=astute-strategy-406601:asia-south1:perundhu-preprod-mysql-asia \
  --service-account=terraform@astute-strategy-406601.iam.gserviceaccount.com \
  --cpu=2 \
  --memory=2Gi \
  --timeout=3600s \
  --max-instances=10 \
  --min-instances=0
```

### Step 5.3: Monitor Deployment

```bash
# Wait for deployment to complete
sleep 30

# Check deployment status
gcloud run services describe perundhu-backend-preprod \
  --region=asia-south1 \
  --project=astute-strategy-406601 | grep -E "Status|URL|Created"

# Get service URL
BACKEND_URL=$(gcloud run services describe perundhu-backend-preprod \
  --region=asia-south1 \
  --project=astute-strategy-406601 \
  --format='value(status.url)')
echo "Backend URL: $BACKEND_URL"
```

### Step 5.4: Check Logs for Startup Issues

```bash
# Monitor logs for startup issues (wait 30 seconds after deployment)
sleep 30

gcloud run logs read perundhu-backend-preprod \
  --region=asia-south1 \
  --project=astute-strategy-406601 \
  --limit=100 \
  --format=text | grep -E "Started|ERROR|error|Failed|failed|Flyway|Migration" | head -30
```

**Expected Log Entries**:
- ✅ "Flyway Version:" - Migrations starting
- ✅ "Successfully validated 53 migrations" - Migrations validated
- ✅ "Executing migration V1__" - Migrations running
- ✅ "Started PerundhuApplication" - App started successfully

---

## Phase 6: Deploy Frontend to Cloud Run

### Step 6.1: Build Frontend Docker Image

```bash
cd /Users/mchand69/Documents/perundhu/frontend

# Build Next.js app
npm run build

# Build Docker image
docker build -t ${ARTIFACT_REGISTRY}/${GCP_PROJECT_ID}/perundhu/frontend:preprod-latest .

# Push to Artifact Registry
docker push ${ARTIFACT_REGISTRY}/${GCP_PROJECT_ID}/perundhu/frontend:preprod-latest
```

### Step 6.2: Deploy Frontend to Cloud Run

```bash
gcloud run deploy perundhu-frontend-preprod \
  --image="${ARTIFACT_REGISTRY}/${GCP_PROJECT_ID}/perundhu/frontend:preprod-latest" \
  --platform=managed \
  --region=asia-south1 \
  --allow-unauthenticated \
  --project=astute-strategy-406601 \
  --set-env-vars \
    NEXT_PUBLIC_API_URL="${BACKEND_URL}" \
  --cpu=1 \
  --memory=1Gi \
  --timeout=600s \
  --max-instances=10 \
  --min-instances=0
```

### Step 6.3: Get Frontend URL

```bash
FRONTEND_URL=$(gcloud run services describe perundhu-frontend-preprod \
  --region=asia-south1 \
  --project=astute-strategy-406601 \
  --format='value(status.url)')
echo "Frontend URL: $FRONTEND_URL"
```

---

## Phase 7: Verify Deployments

### Step 7.1: Test Backend Health

```bash
# Health check
curl -i "${BACKEND_URL}/actuator/health"

# Expected: HTTP 200 with {"status":"UP"}
```

### Step 7.2: Test Database Connectivity

```bash
# Query test endpoint
curl -i "${BACKEND_URL}/api/test/db-connection"

# Expected: HTTP 200 with database info
```

### Step 7.3: Test Frontend

```bash
# Open in browser
open "$FRONTEND_URL"

# Check that it loads without errors
```

### Step 7.4: Check Flyway Migrations

```bash
# Query Flyway history from database
gcloud sql connect perundhu-preprod-mysql-asia \
  --user=perundhu_user \
  --region=asia-south1 \
  --project=astute-strategy-406601 <<'EOF'
SELECT version, description, success, installed_on FROM flyway_schema_history LIMIT 5;
EOF
```

**Expected**: Recent migrations listed with success=1

---

## Phase 8: Setup GitHub Actions Pipeline (Optional)

The CD pipeline will automatically deploy on CI success. Manual trigger available if needed.

```bash
# Manual trigger if needed (after verifying manual deployment works)
gh workflow run cd-preprod-auto.yml \
  -r master \
  -f deploy_frontend=true \
  -f deploy_backend=true
```

---

## Troubleshooting Checklist

### Database Connection Failed
```bash
# Check if instance is running
gcloud sql instances describe perundhu-preprod-mysql-asia --project=astute-strategy-406601

# Check service account has Cloud SQL Client role
gcloud projects get-iam-policy astute-strategy-406601 \
  --flatten="bindings[].members" \
  --filter="bindings.members:terraform@astute-strategy-406601.iam.gserviceaccount.com"

# Expected: roles/cloudsql.client
```

### Flyway Migrations Failing
```bash
# Check Cloud Run logs
gcloud run logs read perundhu-backend-preprod \
  --region=asia-south1 \
  --project=astute-strategy-406601 \
  --limit=200 | grep -A5 "Flyway\|error\|Error"

# Common issues:
# - FLYWAY_ENABLED not set to true
# - Database connection timeout
# - Missing database user privileges
```

### Cloud SQL Proxy Connection Issues
```bash
# Verify instance connection string format
INSTANCE_CONN=$(gcloud sql instances describe perundhu-preprod-mysql-asia \
  --project=astute-strategy-406601 \
  --format='value(connectionName)')
echo "Instance Connection Name: $INSTANCE_CONN"

# Should output: astute-strategy-406601:asia-south1:perundhu-preprod-mysql-asia
```

---

## Success Criteria

- ✅ Backend Cloud Run service deployed and healthy
- ✅ Frontend Cloud Run service deployed and accessible
- ✅ Database connectivity verified
- ✅ Flyway migrations executed successfully
- ✅ Health check endpoints respond with 200 OK
- ✅ Frontend loads without errors
- ✅ Production configuration NOT modified

---

## Next Steps After Completion

1. **Smoke Testing**: Test core user flows in preprod
2. **Load Testing**: Validate performance before production
3. **Security Review**: Verify all secrets properly configured
4. **Production Deployment**: Once preprod validated, deploy to production separately

---

## Important Notes

- **Timeframe**: Allow 2-3 hours for complete setup
- **Do NOT Modify**: Any production files or resources
- **Rollback**: If issues, can easily redeploy with `gcloud run deploy` command
- **Monitoring**: Use `gcloud run logs read` for all troubleshooting

---

**Created**: January 7, 2026  
**Version**: 1.0  
**Status**: Ready to Execute
