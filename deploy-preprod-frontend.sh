#!/bin/bash

#################################################################
# Preprod Frontend Deployment to Cloud Run Script
# 
# Prerequisites:
# - Docker image already pushed to Artifact Registry
# - Backend already deployed
# - gcloud CLI authenticated
# 
# Usage: bash deploy-preprod-frontend.sh
#################################################################

set -e

PROJECT_ROOT="/Users/mchand69/Documents/perundhu"
cd "${PROJECT_ROOT}"

# Configuration
export GCP_PROJECT_ID="astute-strategy-406601"
export GCP_REGION="asia-south1"
export ARTIFACT_REGISTRY="${GCP_REGION}-docker.pkg.dev"
export FRONTEND_IMAGE="${ARTIFACT_REGISTRY}/${GCP_PROJECT_ID}/perundhu/frontend:preprod-latest"

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║      🎨 PREPROD FRONTEND CLOUD RUN DEPLOYMENT 🎨         ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Step 1: Get backend URL
echo "📋 Step 1: Getting backend URL..."
BACKEND_URL=$(gcloud run services describe perundhu-backend-preprod \
  --region=${GCP_REGION} \
  --project=${GCP_PROJECT_ID} \
  --format='value(status.url)' 2>/dev/null || echo "")

if [ -z "$BACKEND_URL" ]; then
    echo "❌ Backend service not found"
    echo "   Please deploy backend first using: bash deploy-preprod-backend.sh"
    exit 1
fi
echo "✅ Backend URL: ${BACKEND_URL}"
echo ""

# Step 2: Deploy frontend to Cloud Run
echo "📋 Step 2: Deploying frontend to Cloud Run..."
echo "   Service: perundhu-frontend-preprod"
echo "   Region: ${GCP_REGION}"
echo "   Image: ${FRONTEND_IMAGE}"
echo "   API URL: ${BACKEND_URL}"
echo ""

gcloud run deploy perundhu-frontend-preprod \
  --image="${FRONTEND_IMAGE}" \
  --platform=managed \
  --region=${GCP_REGION} \
  --allow-unauthenticated \
  --project=${GCP_PROJECT_ID} \
  --set-env-vars="NEXT_PUBLIC_API_URL=${BACKEND_URL}" \
  --cpu=1 \
  --memory=1Gi \
  --timeout=600s \
  --max-instances=10 \
  --min-instances=0

echo "✅ Deployment started"
echo ""

# Step 3: Wait for deployment
echo "📋 Step 3: Waiting for deployment to be ready..."
sleep 30

# Step 4: Get service URL
echo "📋 Step 4: Getting service URL..."
FRONTEND_URL=$(gcloud run services describe perundhu-frontend-preprod \
  --region=${GCP_REGION} \
  --project=${GCP_PROJECT_ID} \
  --format='value(status.url)')

echo "✅ Service deployed"
echo "   URL: ${FRONTEND_URL}"
echo ""

# Step 5: Check health
echo "📋 Step 5: Checking health..."
sleep 5
curl -s -I "${FRONTEND_URL}" | head -5

echo ""
echo "════════════════════════════════════════════════════════════"
echo "✅ Frontend Deployment Complete!"
echo "════════════════════════════════════════════════════════════"
echo "Frontend URL: ${FRONTEND_URL}"
echo "Backend URL:  ${BACKEND_URL}"
echo "Service: perundhu-frontend-preprod"
echo "Region: ${GCP_REGION}"
echo ""
echo "Next: Run smoke tests and verify connectivity"
echo "════════════════════════════════════════════════════════════"
echo ""
