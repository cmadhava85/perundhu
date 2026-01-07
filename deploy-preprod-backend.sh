#!/bin/bash

#################################################################
# Preprod Backend Deployment to Cloud Run Script
# 
# Prerequisites:
# - Docker image already pushed to Artifact Registry
# - gcloud CLI authenticated
# - GCP project: astute-strategy-406601
# 
# Usage: bash deploy-preprod-backend.sh
#################################################################

set -e

PROJECT_ROOT="/Users/mchand69/Documents/perundhu"
cd "${PROJECT_ROOT}"

# Configuration
export GCP_PROJECT_ID="astute-strategy-406601"
export GCP_REGION="asia-south1"
export ARTIFACT_REGISTRY="${GCP_REGION}-docker.pkg.dev"
export BACKEND_IMAGE="${ARTIFACT_REGISTRY}/${GCP_PROJECT_ID}/perundhu/backend:preprod-latest"
export CLOUD_SQL_INSTANCE="astute-strategy-406601:asia-south1:perundhu-preprod-mysql-asia"
export SERVICE_ACCOUNT="terraform@${GCP_PROJECT_ID}.iam.gserviceaccount.com"

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║       ☁️  PREPROD BACKEND CLOUD RUN DEPLOYMENT ☁️         ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Step 1: Retrieve secrets from GCP Secret Manager
echo "📋 Step 1: Retrieving secrets from GCP Secret Manager..."
DB_USERNAME=$(gcloud secrets versions access latest --secret=db-username --project=${GCP_PROJECT_ID} 2>/dev/null || echo "perundhu_user")
DB_PASSWORD=$(gcloud secrets versions access latest --secret=db-password --project=${GCP_PROJECT_ID} 2>/dev/null || echo "")
GEMINI_API_KEY=$(gcloud secrets versions access latest --secret=gemini-api-key --project=${GCP_PROJECT_ID} 2>/dev/null || echo "")

if [ -z "$DB_PASSWORD" ]; then
    echo "❌ DB_PASSWORD not found in Secret Manager"
    echo "   Please create it: echo -n 'password' | gcloud secrets versions add db-password --data-file=-"
    exit 1
fi
echo "✅ Secrets retrieved"
echo ""

# Step 2: Deploy backend to Cloud Run
echo "📋 Step 2: Deploying backend to Cloud Run..."
echo "   Service: perundhu-backend-preprod"
echo "   Region: ${GCP_REGION}"
echo "   Image: ${BACKEND_IMAGE}"
echo ""

gcloud run deploy perundhu-backend-preprod \
  --image="${BACKEND_IMAGE}" \
  --platform=managed \
  --region=${GCP_REGION} \
  --allow-unauthenticated \
  --project=${GCP_PROJECT_ID} \
  --set-env-vars="SPRING_PROFILES_ACTIVE=preprod,SPRING_DATASOURCE_URL=jdbc:mysql://10.189.0.5:3306/perundhu?useSSL=false&allowPublicKeyRetrieval=true&connectTimeout=60000&socketTimeout=120000,DB_USERNAME=${DB_USERNAME},DB_PASSWORD=${DB_PASSWORD},GEMINI_API_KEY=${GEMINI_API_KEY},FLYWAY_ENABLED=false,SERVER_PORT=8080,LOG_LEVEL_ROOT=INFO,LOG_LEVEL_APP=INFO,DATA_ENCRYPTION_KEY_DISABLED=true" \
  --add-cloudsql-instances=${CLOUD_SQL_INSTANCE} \
  --cpu=2 \
  --memory=2Gi \
  --timeout=3600s \
  --max-instances=10 \
  --min-instances=0

echo "✅ Deployment started"
echo ""

# Step 3: Wait for deployment to be ready
echo "📋 Step 3: Waiting for deployment to be ready..."
sleep 30

# Step 4: Get service URL
echo "📋 Step 4: Getting service URL..."
BACKEND_URL=$(gcloud run services describe perundhu-backend-preprod \
  --region=${GCP_REGION} \
  --project=${GCP_PROJECT_ID} \
  --format='value(status.url)')

echo "✅ Service deployed"
echo "   URL: ${BACKEND_URL}"
echo ""

# Step 5: Check health
echo "📋 Step 5: Checking health endpoint..."
sleep 10
HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${BACKEND_URL}/actuator/health" 2>/dev/null || echo "000")

if [ "$HEALTH_STATUS" == "200" ]; then
    echo "✅ Health check passed (HTTP 200)"
else
    echo "⏳ Health check status: HTTP ${HEALTH_STATUS}"
    echo "   Monitoring logs..."
fi
echo ""

# Step 6: Show logs
echo "📋 Step 6: Recent deployment logs..."
gcloud run logs read perundhu-backend-preprod \
  --region=${GCP_REGION} \
  --project=${GCP_PROJECT_ID} \
  --limit=50 \
  --format=text 2>/dev/null | grep -E "Started|Flyway|Migration|ERROR" | head -20

echo ""
echo "════════════════════════════════════════════════════════════"
echo "✅ Backend Deployment Complete!"
echo "════════════════════════════════════════════════════════════"
echo "Backend URL: ${BACKEND_URL}"
echo "Service: perundhu-backend-preprod"
echo "Region: ${GCP_REGION}"
echo ""
echo "Next: Deploy frontend using deploy-preprod-frontend.sh"
echo "════════════════════════════════════════════════════════════"
echo ""
