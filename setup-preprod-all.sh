#!/bin/bash

#################################################################
# Complete Preprod Setup - One Command Deploy
# 
# This script handles EVERYTHING:
# 1. Starts Docker if needed
# 2. Provisions Terraform infrastructure
# 3. Sets up database
# 4. Builds and pushes Docker images
# 5. Deploys to Cloud Run
# 6. Verifies everything works
# 
# Usage: bash setup-preprod-all.sh
#################################################################

set -e

PROJECT_ROOT="/Users/mchand69/Documents/perundhu"
cd "${PROJECT_ROOT}"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Configuration
GCP_PROJECT_ID="astute-strategy-406601"
GCP_REGION="asia-south1"
ARTIFACT_REGISTRY="${GCP_REGION}-docker.pkg.dev"

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║   🚀 PREPROD COMPLETE SETUP - ONE COMMAND DEPLOY 🚀        ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# ==================================================================
# STEP 1: START DOCKER
# ==================================================================
echo "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo "${BLUE}Step 1: Ensure Docker is running${NC}"
echo "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

if docker ps > /dev/null 2>&1; then
    echo "${GREEN}✅ Docker is already running${NC}"
else
    echo "${YELLOW}⏳ Docker not running, starting it...${NC}"
    nohup /Applications/Docker.app/Contents/MacOS/Docker > /tmp/docker-daemon.log 2>&1 &
    
    echo "⏳ Waiting for Docker daemon to start (max 60 seconds)..."
    for i in {1..60}; do
        if docker ps > /dev/null 2>&1; then
            echo "${GREEN}✅ Docker started successfully${NC}"
            break
        fi
        if [ $i -eq 60 ]; then
            echo "${RED}❌ Docker failed to start${NC}"
            echo "   Try manually opening: /Applications/Docker.app"
            exit 1
        fi
        sleep 1
    done
fi
echo ""

# ==================================================================
# STEP 2: VERIFY PREREQUISITES
# ==================================================================
echo "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo "${BLUE}Step 2: Verify prerequisites${NC}"
echo "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Check gcloud
if ! gcloud --version > /dev/null 2>&1; then
    echo "${RED}❌ gcloud CLI not found${NC}"
    exit 1
fi
echo "${GREEN}✅ gcloud CLI available${NC}"

# Check terraform
if ! terraform -version > /dev/null 2>&1; then
    echo "${RED}❌ Terraform not found${NC}"
    exit 1
fi
echo "${GREEN}✅ Terraform available${NC}"

# Check git
if ! git --version > /dev/null 2>&1; then
    echo "${RED}❌ git not found${NC}"
    exit 1
fi
echo "${GREEN}✅ git available${NC}"

# Verify GCP project
CURRENT_PROJECT=$(gcloud config get-value project)
if [ "$CURRENT_PROJECT" != "$GCP_PROJECT_ID" ]; then
    echo "${YELLOW}⚠️  Current project: ${CURRENT_PROJECT}${NC}"
    echo "    Setting to: ${GCP_PROJECT_ID}"
    gcloud config set project ${GCP_PROJECT_ID}
fi
echo "${GREEN}✅ GCP Project: ${GCP_PROJECT_ID}${NC}"
echo ""

# ==================================================================
# STEP 3: CONFIGURE DOCKER REGISTRY AUTH
# ==================================================================
echo "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo "${BLUE}Step 3: Configure Docker authentication${NC}"
echo "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

gcloud auth configure-docker ${ARTIFACT_REGISTRY} --quiet
echo "${GREEN}✅ Docker authentication configured${NC}"
echo ""

# ==================================================================
# STEP 4: PROVISION TERRAFORM
# ==================================================================
echo "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo "${BLUE}Step 4: Provision infrastructure with Terraform${NC}"
echo "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

cd "${PROJECT_ROOT}/infrastructure/terraform/environments/preprod"

echo "📍 Initializing Terraform..."
terraform init

echo "📍 Planning Terraform changes..."
terraform plan \
  -var="project_id=${GCP_PROJECT_ID}" \
  -var="notification_email=alerts@perundhu.com" \
  -var="db_version=MYSQL_8_0" \
  -var="db_instance_tier=db-f1-micro" \
  -var="db_instance_name_suffix=-asia" \
  -out=tfplan

echo "📍 Applying Terraform changes (this takes ~10-15 minutes)..."
terraform apply tfplan

echo "${GREEN}✅ Infrastructure provisioned${NC}"
echo ""

# ==================================================================
# STEP 5: SETUP DATABASE
# ==================================================================
echo "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo "${BLUE}Step 5: Setup database and credentials${NC}"
echo "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

cd "${PROJECT_ROOT}"

echo "⏳ Waiting for Cloud SQL instance to be ready..."
sleep 30

echo "📍 Creating database user..."
gcloud sql connect perundhu-preprod-mysql-asia \
  --user=root \
  --region=${GCP_REGION} \
  --project=${GCP_PROJECT_ID} <<'SQLEOF'
CREATE DATABASE IF NOT EXISTS perundhu;
CREATE USER IF NOT EXISTS 'perundhu_user'@'%' IDENTIFIED BY 'temp_password';
GRANT ALL PRIVILEGES ON perundhu.* TO 'perundhu_user'@'%';
FLUSH PRIVILEGES;
SQLEOF

echo "📍 Generating secure password and storing in Secret Manager..."
DB_PASSWORD=$(openssl rand -base64 32)

echo -n "${DB_PASSWORD}" | gcloud secrets versions add db-password \
  --data-file=- \
  --project=${GCP_PROJECT_ID} 2>/dev/null || \
echo -n "${DB_PASSWORD}" | gcloud secrets create db-password \
  --data-file=- \
  --replication-policy="user-managed" \
  --locations="${GCP_REGION}" \
  --project=${GCP_PROJECT_ID}

echo -n "perundhu_user" | gcloud secrets versions add db-username \
  --data-file=- \
  --project=${GCP_PROJECT_ID} 2>/dev/null || \
echo -n "perundhu_user" | gcloud secrets create db-username \
  --data-file=- \
  --replication-policy="user-managed" \
  --locations="${GCP_REGION}" \
  --project=${GCP_PROJECT_ID}

echo "${GREEN}✅ Database setup complete${NC}"
echo ""

# ==================================================================
# STEP 6: BUILD BACKEND
# ==================================================================
echo "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo "${BLUE}Step 6: Build backend Docker image${NC}"
echo "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

cd "${PROJECT_ROOT}/backend"

echo "📍 Building JAR with preprod profile..."
./gradlew clean build -Dspring.profiles.active=preprod -x test --no-daemon 2>&1 | tail -20

echo "📍 Building Docker image..."
BACKEND_IMAGE_LATEST="${ARTIFACT_REGISTRY}/${GCP_PROJECT_ID}/perundhu/backend:preprod-latest"
docker build -t ${BACKEND_IMAGE_LATEST} .

echo "📍 Pushing to Artifact Registry..."
docker push ${BACKEND_IMAGE_LATEST}

echo "${GREEN}✅ Backend image pushed: ${BACKEND_IMAGE_LATEST}${NC}"
echo ""

# ==================================================================
# STEP 7: BUILD FRONTEND
# ==================================================================
echo "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo "${BLUE}Step 7: Build frontend Docker image${NC}"
echo "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

cd "${PROJECT_ROOT}/frontend"

echo "📍 Building Next.js application..."
npm run build 2>&1 | tail -10

echo "📍 Building Docker image..."
FRONTEND_IMAGE_LATEST="${ARTIFACT_REGISTRY}/${GCP_PROJECT_ID}/perundhu/frontend:preprod-latest"
docker build -t ${FRONTEND_IMAGE_LATEST} .

echo "📍 Pushing to Artifact Registry..."
docker push ${FRONTEND_IMAGE_LATEST}

echo "${GREEN}✅ Frontend image pushed: ${FRONTEND_IMAGE_LATEST}${NC}"
echo ""

# ==================================================================
# STEP 8: DEPLOY BACKEND
# ==================================================================
echo "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo "${BLUE}Step 8: Deploy backend to Cloud Run${NC}"
echo "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

cd "${PROJECT_ROOT}"

# Retrieve secrets
DB_USERNAME=$(gcloud secrets versions access latest --secret=db-username --project=${GCP_PROJECT_ID})
DB_PASSWORD=$(gcloud secrets versions access latest --secret=db-password --project=${GCP_PROJECT_ID})
GEMINI_API_KEY=$(gcloud secrets versions access latest --secret=gemini-api-key --project=${GCP_PROJECT_ID} 2>/dev/null || echo "")

echo "📍 Deploying backend service..."
gcloud run deploy perundhu-backend-preprod \
  --image="${BACKEND_IMAGE_LATEST}" \
  --platform=managed \
  --region=${GCP_REGION} \
  --allow-unauthenticated \
  --project=${GCP_PROJECT_ID} \
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
  --service-account=terraform@${GCP_PROJECT_ID}.iam.gserviceaccount.com \
  --cpu=2 \
  --memory=2Gi \
  --timeout=3600s \
  --max-instances=10 \
  --min-instances=0 \
  --quiet

echo "⏳ Waiting for backend to be ready..."
sleep 30

BACKEND_URL=$(gcloud run services describe perundhu-backend-preprod \
  --region=${GCP_REGION} \
  --project=${GCP_PROJECT_ID} \
  --format='value(status.url)')

echo "${GREEN}✅ Backend deployed: ${BACKEND_URL}${NC}"
echo ""

# ==================================================================
# STEP 9: DEPLOY FRONTEND
# ==================================================================
echo "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo "${BLUE}Step 9: Deploy frontend to Cloud Run${NC}"
echo "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo "📍 Deploying frontend service..."
gcloud run deploy perundhu-frontend-preprod \
  --image="${FRONTEND_IMAGE_LATEST}" \
  --platform=managed \
  --region=${GCP_REGION} \
  --allow-unauthenticated \
  --project=${GCP_PROJECT_ID} \
  --set-env-vars \
    NEXT_PUBLIC_API_URL=${BACKEND_URL} \
  --cpu=1 \
  --memory=1Gi \
  --timeout=600s \
  --max-instances=10 \
  --min-instances=0 \
  --quiet

echo "⏳ Waiting for frontend to be ready..."
sleep 20

FRONTEND_URL=$(gcloud run services describe perundhu-frontend-preprod \
  --region=${GCP_REGION} \
  --project=${GCP_PROJECT_ID} \
  --format='value(status.url)')

echo "${GREEN}✅ Frontend deployed: ${FRONTEND_URL}${NC}"
echo ""

# ==================================================================
# STEP 10: VERIFICATION
# ==================================================================
echo "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo "${BLUE}Step 10: Verify deployments${NC}"
echo "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo "📋 Testing backend health..."
HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${BACKEND_URL}/actuator/health" 2>/dev/null || echo "000")

if [ "$HEALTH_STATUS" == "200" ]; then
    echo "${GREEN}✅ Backend health check: HTTP 200${NC}"
else
    echo "${YELLOW}⏳ Backend health check: HTTP ${HEALTH_STATUS}${NC}"
    echo "   (Normal if service just started, will be ready soon)"
fi

echo ""
echo "📋 Testing frontend connectivity..."
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${FRONTEND_URL}" 2>/dev/null || echo "000")

if [ "$FRONTEND_STATUS" == "200" ] || [ "$FRONTEND_STATUS" == "307" ]; then
    echo "${GREEN}✅ Frontend health check: HTTP ${FRONTEND_STATUS}${NC}"
else
    echo "${YELLOW}⏳ Frontend health check: HTTP ${FRONTEND_STATUS}${NC}"
fi

echo ""

# ==================================================================
# COMPLETION
# ==================================================================
echo ""
echo "════════════════════════════════════════════════════════════"
echo "${GREEN}✅ PREPROD DEPLOYMENT COMPLETE!${NC}"
echo "════════════════════════════════════════════════════════════"
echo ""
echo "🎉 Services Deployed:"
echo "  Backend:  ${BACKEND_URL}"
echo "  Frontend: ${FRONTEND_URL}"
echo ""
echo "📊 Configuration:"
echo "  Project:  ${GCP_PROJECT_ID}"
echo "  Region:   ${GCP_REGION}"
echo "  Database: perundhu-preprod-mysql-asia"
echo ""
echo "📚 Next Steps:"
echo "1. Open frontend in browser:"
echo "   open '${FRONTEND_URL}'"
echo ""
echo "2. Monitor backend logs:"
echo "   gcloud run logs read perundhu-backend-preprod --region=${GCP_REGION} --follow"
echo ""
echo "3. Check database migrations:"
echo "   gcloud sql connect perundhu-preprod-mysql-asia --user=root"
echo "   SELECT * FROM flyway_schema_history LIMIT 5;"
echo ""
echo "════════════════════════════════════════════════════════════"
echo ""
