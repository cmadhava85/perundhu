#!/bin/bash

#################################################################
# Complete Deployment Script - Preprod & Production
# 
# This script:
# 1. Builds backend and frontend Docker images
# 2. Pushes to Artifact Registry (both preprod and production)
# 3. Deploys to Preprod environment
# 4. Deploys to Production environment
# 
# Prerequisites:
# - Docker installed and running
# - gcloud CLI authenticated
# - Java 21 and Node.js 18 installed
# 
# Usage: bash deploy-all-environments.sh
#################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PREPROD_PROJECT="astute-strategy-406601"
PROD_PROJECT="perundhu-prod-001"
REGION="us-central1"
ARTIFACT_REGISTRY="${REGION}-docker.pkg.dev"

# Get version tag
VERSION="manual-$(date +%Y%m%d-%H%M%S)"
GIT_SHA=$(git rev-parse --short HEAD 2>/dev/null || echo "local")

echo -e "${BLUE}"
echo "╔════════════════════════════════════════════════════════════╗"
echo "║     🚀 COMPLETE DEPLOYMENT - PREPROD & PRODUCTION 🚀      ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo -e "${NC}"
echo -e "${YELLOW}Version: ${VERSION}${NC}"
echo -e "${YELLOW}Git SHA: ${GIT_SHA}${NC}"
echo ""

# Step 1: Build Backend JAR
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}📦 Step 1: Building Backend JAR...${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"

cd backend
chmod +x gradlew
./gradlew clean build -x test -x spotbugsMain -x spotbugsTest --no-daemon
cd ..

echo -e "${GREEN}✅ Backend JAR built successfully${NC}"
echo ""

# Step 2: Configure Docker for Artifact Registry
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}🔧 Step 2: Configuring Docker for Artifact Registry...${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"

gcloud auth configure-docker ${ARTIFACT_REGISTRY} --quiet

echo -e "${GREEN}✅ Docker configured${NC}"
echo ""

# Step 3: Get Google Maps API Key
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}🔑 Step 3: Retrieving Google Maps API Key...${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"

GOOGLE_MAPS_API_KEY=$(gcloud secrets versions access latest --secret=google-maps-api-key --project=${PREPROD_PROJECT} 2>/dev/null || echo "")

if [ -n "$GOOGLE_MAPS_API_KEY" ]; then
    echo -e "${GREEN}✅ Google Maps API Key retrieved${NC}"
else
    echo -e "${YELLOW}⚠️  Google Maps API Key not found - continuing without it${NC}"
fi
echo ""

# Step 4: Build and Push Preprod Backend Image
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}🐳 Step 4: Building & Pushing Preprod Backend Image...${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"

PREPROD_BACKEND_IMAGE="${ARTIFACT_REGISTRY}/${PREPROD_PROJECT}/perundhu-preprod-us/backend:${VERSION}"
PREPROD_BACKEND_LATEST="${ARTIFACT_REGISTRY}/${PREPROD_PROJECT}/perundhu-preprod-us/backend:preprod-latest"

echo "Building image: ${PREPROD_BACKEND_IMAGE}"
docker build --platform=linux/amd64 -t ${PREPROD_BACKEND_IMAGE} -t ${PREPROD_BACKEND_LATEST} ./backend
docker push ${PREPROD_BACKEND_IMAGE}
docker push ${PREPROD_BACKEND_LATEST}

echo -e "${GREEN}✅ Preprod backend image pushed${NC}"
echo ""

# Step 5: Build and Push Preprod Frontend Image
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}🎨 Step 5: Building & Pushing Preprod Frontend Image...${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"

# Create preprod frontend env file
cat > ./frontend/.env.local << EOF
VITE_API_URL=https://perundhu-backend-preprod-1032721240281.asia-south1.run.app
VITE_API_BASE_URL=https://perundhu-backend-preprod-1032721240281.asia-south1.run.app
VITE_GOOGLE_MAPS_API_KEY=${GOOGLE_MAPS_API_KEY}
EOF

cp ./frontend/.env.local ./frontend/.env.production.local

PREPROD_FRONTEND_IMAGE="${ARTIFACT_REGISTRY}/${PREPROD_PROJECT}/perundhu-preprod-us/frontend:${VERSION}"
PREPROD_FRONTEND_LATEST="${ARTIFACT_REGISTRY}/${PREPROD_PROJECT}/perundhu-preprod-us/frontend:preprod-latest"

echo "Building image: ${PREPROD_FRONTEND_IMAGE}"
docker build --platform=linux/amd64 -t ${PREPROD_FRONTEND_IMAGE} -t ${PREPROD_FRONTEND_LATEST} ./frontend
docker push ${PREPROD_FRONTEND_IMAGE}
docker push ${PREPROD_FRONTEND_LATEST}

echo -e "${GREEN}✅ Preprod frontend image pushed${NC}"
echo ""

# Step 6: Build and Push Production Backend Image
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}🐳 Step 6: Building & Pushing Production Backend Image...${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"

PROD_BACKEND_IMAGE="${ARTIFACT_REGISTRY}/${PROD_PROJECT}/perundhu/backend:${VERSION}"
PROD_BACKEND_LATEST="${ARTIFACT_REGISTRY}/${PROD_PROJECT}/perundhu/backend:latest"

echo "Building image: ${PROD_BACKEND_IMAGE}"
docker build --platform=linux/amd64 -t ${PROD_BACKEND_IMAGE} -t ${PROD_BACKEND_LATEST} ./backend
docker push ${PROD_BACKEND_IMAGE}
docker push ${PROD_BACKEND_LATEST}

echo -e "${GREEN}✅ Production backend image pushed${NC}"
echo ""

# Step 7: Build and Push Production Frontend Image
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}🎨 Step 7: Building & Pushing Production Frontend Image...${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"

# Create production frontend env file
cat > ./frontend/.env.production.local << EOF
VITE_APP_VERSION=${VERSION}
VITE_GOOGLE_MAPS_API_KEY=${GOOGLE_MAPS_API_KEY}
EOF

PROD_FRONTEND_IMAGE="${ARTIFACT_REGISTRY}/${PROD_PROJECT}/perundhu/frontend:${VERSION}"
PROD_FRONTEND_LATEST="${ARTIFACT_REGISTRY}/${PROD_PROJECT}/perundhu/frontend:latest"

echo "Building image: ${PROD_FRONTEND_IMAGE}"
docker build --platform=linux/amd64 -t ${PROD_FRONTEND_IMAGE} -t ${PROD_FRONTEND_LATEST} ./frontend
docker push ${PROD_FRONTEND_IMAGE}
docker push ${PROD_FRONTEND_LATEST}

echo -e "${GREEN}✅ Production frontend image pushed${NC}"
echo ""

#################################################################
# PREPROD DEPLOYMENT
#################################################################

echo -e "${BLUE}"
echo "╔════════════════════════════════════════════════════════════╗"
echo "║            ☁️  DEPLOYING TO PREPROD ☁️                    ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Step 8: Deploy Preprod Backend
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}🚀 Step 8: Deploying Preprod Backend to Cloud Run...${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"

gcloud run deploy perundhu-backend-preprod \
  --image="${PREPROD_BACKEND_LATEST}" \
  --platform=managed \
  --region=${REGION} \
  --allow-unauthenticated \
  --project=${PREPROD_PROJECT} \
  --set-env-vars="SPRING_PROFILES_ACTIVE=preprod,SPRING_DATASOURCE_URL=jdbc:mysql:///perundhu?socketFactory=com.google.cloud.sql.mysql.SocketFactory&cloudSqlInstance=${PREPROD_PROJECT}:${REGION}:perundhu-preprod-mysql-us&connectTimeout=60000&socketTimeout=120000&autocommit=false,FLYWAY_ENABLED=false,SERVER_PORT=8080,LOG_LEVEL_ROOT=INFO,LOG_LEVEL_APP=INFO,HIKARI_MIN_IDLE=2" \
  --set-secrets="DB_USERNAME=db-username:latest,DB_PASSWORD=db-password:latest,GEMINI_API_KEY=gemini-api-key:latest,PUBLIC_API_KEY=PUBLIC_API_KEY:latest,RECAPTCHA_SITE_KEY=recaptcha-site-key:latest,RECAPTCHA_SECRET_KEY=recaptcha-secret-key:latest" \
  --add-cloudsql-instances="${PREPROD_PROJECT}:${REGION}:perundhu-preprod-mysql-us" \
  --cpu=2 \
  --memory=2Gi \
  --timeout=3600s \
  --max-instances=10 \
  --min-instances=0

echo -e "${GREEN}✅ Preprod backend deployed${NC}"
echo ""

# Get preprod backend URL
PREPROD_BACKEND_URL=$(gcloud run services describe perundhu-backend-preprod \
  --region=${REGION} \
  --project=${PREPROD_PROJECT} \
  --format='value(status.url)')

echo -e "${GREEN}Preprod Backend URL: ${PREPROD_BACKEND_URL}${NC}"
echo ""

# Step 9: Deploy Preprod Frontend
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}🚀 Step 9: Deploying Preprod Frontend to Cloud Run...${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"

gcloud run deploy perundhu-frontend-preprod \
  --image="${PREPROD_FRONTEND_LATEST}" \
  --platform=managed \
  --region=${REGION} \
  --allow-unauthenticated \
  --project=${PREPROD_PROJECT} \
  --set-env-vars="NEXT_PUBLIC_API_URL=${PREPROD_BACKEND_URL}" \
  --cpu=1 \
  --memory=1Gi \
  --timeout=600s \
  --max-instances=10 \
  --min-instances=0

echo -e "${GREEN}✅ Preprod frontend deployed${NC}"
echo ""

PREPROD_FRONTEND_URL=$(gcloud run services describe perundhu-frontend-preprod \
  --region=${REGION} \
  --project=${PREPROD_PROJECT} \
  --format='value(status.url)')

echo -e "${GREEN}Preprod Frontend URL: ${PREPROD_FRONTEND_URL}${NC}"
echo ""

#################################################################
# PRODUCTION DEPLOYMENT
#################################################################

echo -e "${BLUE}"
echo "╔════════════════════════════════════════════════════════════╗"
echo "║          🚀 DEPLOYING TO PRODUCTION 🚀                    ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Step 10: Deploy Production Backend
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}🚀 Step 10: Deploying Production Backend to Cloud Run...${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"

gcloud run deploy perundhu-production-backend \
  --image="${PROD_BACKEND_LATEST}" \
  --platform=managed \
  --region=${REGION} \
  --allow-unauthenticated \
  --project=${PROD_PROJECT} \
  --service-account=cloud-run-sa@${PROD_PROJECT}.iam.gserviceaccount.com \
  --add-cloudsql-instances="${PROD_PROJECT}:${REGION}:perundhu-production-mysql-us" \
  --set-env-vars="SPRING_PROFILES_ACTIVE=production,FLYWAY_ENABLED=true,SPRING_FLYWAY_ENABLED=true" \
  --set-secrets="DB_URL=production-db-url:latest,DB_USERNAME=db-username:latest,DB_PASSWORD=db-password:latest,JWT_SECRET=production-jwt-secret:latest,SECURITY_DATA_ENCRYPTION_KEY=production-data-encryption-key:latest,ADMIN_USERNAME=admin-username:latest,ADMIN_PASSWORD=admin-password:latest,GEMINI_API_KEY=gemini-api-key:latest,RECAPTCHA_SITE_KEY=recaptcha-site-key:latest,RECAPTCHA_SECRET_KEY=recaptcha-secret-key:latest" \
  --memory=1Gi \
  --cpu=1 \
  --min-instances=1 \
  --max-instances=10 \
  --concurrency=160 \
  --timeout=300s \
  --cpu-throttling \
  --execution-environment=gen2 \
  --labels="version=${VERSION},env=production"

echo -e "${GREEN}✅ Production backend deployed${NC}"
echo ""

# Get production backend URL
PROD_BACKEND_URL=$(gcloud run services describe perundhu-production-backend \
  --region=${REGION} \
  --project=${PROD_PROJECT} \
  --format='value(status.url)')

echo -e "${GREEN}Production Backend URL: ${PROD_BACKEND_URL}${NC}"
echo ""

# Step 11: Deploy Production Frontend
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}🚀 Step 11: Deploying Production Frontend to Cloud Run...${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"

gcloud run deploy perundhu-production-frontend \
  --image="${PROD_FRONTEND_LATEST}" \
  --platform=managed \
  --region=${REGION} \
  --allow-unauthenticated \
  --project=${PROD_PROJECT} \
  --set-env-vars="VITE_API_URL=${PROD_BACKEND_URL}" \
  --port=8080 \
  --memory=512Mi \
  --cpu=1 \
  --min-instances=0 \
  --max-instances=20 \
  --concurrency=80 \
  --timeout=60s \
  --cpu-throttling \
  --execution-environment=gen2 \
  --labels="version=${VERSION},env=production"

echo -e "${GREEN}✅ Production frontend deployed${NC}"
echo ""

PROD_FRONTEND_URL=$(gcloud run services describe perundhu-production-frontend \
  --region=${REGION} \
  --project=${PROD_PROJECT} \
  --format='value(status.url)')

echo -e "${GREEN}Production Frontend URL: ${PROD_FRONTEND_URL}${NC}"
echo ""

#################################################################
# DEPLOYMENT SUMMARY
#################################################################

echo -e "${BLUE}"
echo "╔════════════════════════════════════════════════════════════╗"
echo "║          ✅ DEPLOYMENT COMPLETE - ALL ENVIRONMENTS         ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo -e "${NC}"
echo ""
echo -e "${GREEN}═══════════════════ PREPROD ENVIRONMENT ═══════════════════${NC}"
echo -e "Frontend: ${YELLOW}${PREPROD_FRONTEND_URL}${NC}"
echo -e "Backend:  ${YELLOW}${PREPROD_BACKEND_URL}${NC}"
echo ""
echo -e "${GREEN}════════════════ PRODUCTION ENVIRONMENT ═══════════════════${NC}"
echo -e "Frontend: ${YELLOW}${PROD_FRONTEND_URL}${NC}"
echo -e "Backend:  ${YELLOW}${PROD_BACKEND_URL}${NC}"
echo ""
echo -e "${GREEN}Version: ${VERSION}${NC}"
echo -e "${GREEN}Git SHA: ${GIT_SHA}${NC}"
echo ""
echo -e "${BLUE}Next Steps:${NC}"
echo "1. Test preprod: ${PREPROD_FRONTEND_URL}"
echo "2. Test production: https://perundhu.com (or ${PROD_FRONTEND_URL})"
echo "3. Monitor logs: gcloud logging"
echo "4. Check health endpoints"
echo ""
echo -e "${GREEN}════════════════════════════════════════════════════════════${NC}"
