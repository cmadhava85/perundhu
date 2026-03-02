#!/bin/bash

#################################################################
# Production Deployment Script
# Deploys backend and frontend to production environment
#################################################################

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PROD_PROJECT="perundhu-prod-001"
REGION="us-central1"
ARTIFACT_REGISTRY="${REGION}-docker.pkg.dev"

echo -e "${BLUE}"
echo "╔════════════════════════════════════════════════════════════╗"
echo "║          🚀 DEPLOYING TO PRODUCTION 🚀                    ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Deploy Backend
echo -e "${GREEN}🚀 Deploying Production Backend...${NC}"
gcloud run deploy perundhu-production-backend \
  --image="${ARTIFACT_REGISTRY}/${PROD_PROJECT}/perundhu/backend:latest" \
  --platform=managed \
  --region=${REGION} \
  --allow-unauthenticated \
  --project=${PROD_PROJECT} \
  --service-account=cloud-run-sa@${PROD_PROJECT}.iam.gserviceaccount.com \
  --add-cloudsql-instances="${PROD_PROJECT}:${REGION}:perundhu-production-mysql-us" \
  --set-env-vars="SPRING_PROFILES_ACTIVE=production,FLYWAY_ENABLED=true,SPRING_FLYWAY_ENABLED=true" \
  --set-secrets="DB_URL=production-db-url:latest,DB_USERNAME=db-username:latest,DB_PASSWORD=db-password:latest,JWT_SECRET=production-jwt-secret:latest,SECURITY_DATA_ENCRYPTION_KEY=production-data-encryption-key:latest,ADMIN_AUTH_USERNAME=admin-username:latest,ADMIN_AUTH_PASSWORD=admin-password:latest,GEMINI_API_KEY=gemini-api-key:latest,RECAPTCHA_SITE_KEY=recaptcha-site-key:latest,RECAPTCHA_SECRET_KEY=recaptcha-secret-key:latest" \
  --memory=1Gi \
  --cpu=1 \
  --min-instances=1 \
  --max-instances=10 \
  --concurrency=160 \
  --timeout=300s \
  --cpu-throttling \
  --execution-environment=gen2

echo -e "${GREEN}✅ Production backend deployed${NC}"

# Get backend URL  
PROD_BACKEND_URL=$(gcloud run services describe perundhu-production-backend \
  --region=${REGION} \
  --project=${PROD_PROJECT} \
  --format='value(status.url)')

echo -e "${GREEN}Backend URL: ${PROD_BACKEND_URL}${NC}"
echo ""

# Deploy Frontend
echo -e "${GREEN}🚀 Deploying Production Frontend...${NC}"
gcloud run deploy perundhu-production-frontend \
  --image="${ARTIFACT_REGISTRY}/${PROD_PROJECT}/perundhu/frontend:latest" \
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
  --execution-environment=gen2

echo -e "${GREEN}✅ Production frontend deployed${NC}"

# Get frontend URL
PROD_FRONTEND_URL=$(gcloud run services describe perundhu-production-frontend \
  --region=${REGION} \
  --project=${PROD_PROJECT} \
  --format='value(status.url)')

echo ""
echo -e "${BLUE}"
echo "╔════════════════════════════════════════════════════════════╗"
echo "║          ✅ PRODUCTION DEPLOYMENT COMPLETE                 ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo -e "${NC}"
echo -e "${GREEN}Frontend: ${PROD_FRONTEND_URL}${NC}"
echo -e "${GREEN}Backend:  ${PROD_BACKEND_URL}${NC}"
echo ""
