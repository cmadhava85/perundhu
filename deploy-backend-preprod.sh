#!/bin/bash

#############################################################################
# Backend Deployment Script for Preprod Environment
# Deploys perundhu backend to Google Cloud Run
#############################################################################

set -e

# Configuration
PROJECT_ID="astute-strategy-406601"
REGION="asia-south1"
SERVICE_NAME="perundhu-backend-preprod"
IMAGE_REPO="asia-south1-docker.pkg.dev"
IMAGE_TAG="preprod-latest"
IMAGE="${IMAGE_REPO}/${PROJECT_ID}/perundhu/backend:${IMAGE_TAG}"
DB_INSTANCE="astute-strategy-406601:asia-south1:perundhu-preprod-mysql-asia"
DB_USER="perundhu_user"

echo "╔════════════════════════════════════════════════════════════════════════╗"
echo "║                                                                        ║"
echo "║              🚀 DEPLOYING BACKEND TO CLOUD RUN 🚀                    ║"
echo "║                                                                        ║"
echo "╚════════════════════════════════════════════════════════════════════════╝"
echo ""
echo "📋 Configuration:"
echo "  • Project ID: $PROJECT_ID"
echo "  • Region: $REGION"
echo "  • Service: $SERVICE_NAME"
echo "  • Image: $IMAGE"
echo "  • Database: $DB_INSTANCE"
echo ""

# Deploy to Cloud Run
echo "🔄 Deploying backend..."
gcloud run deploy ${SERVICE_NAME} \
  --image=${IMAGE} \
  --platform=managed \
  --region=${REGION} \
  --project=${PROJECT_ID} \
  --allow-unauthenticated \
  --set-env-vars="\
SPRING_PROFILES_ACTIVE=preprod,\
GCP_INSTANCE_CONNECTION_NAME=${DB_INSTANCE},\
DB_USERNAME=${DB_USER},\
MYSQL_USERNAME=${DB_USER},\
GEMINI_API_ENABLED=true,\
CORS_ALLOWED_ORIGINS=https://perundhu-frontend-preprod-1032721240281.asia-south1.run.app" \
  --set-secrets="\
DB_PASSWORD=preprod-db-password:latest,\
MYSQL_PASSWORD=preprod-db-password:latest,\
JWT_SECRET=JWT_SECRET_PREPROD:latest,\
DATA_ENCRYPTION_KEY=DATA_ENCRYPTION_KEY_PREPROD:latest,\
GEMINI_API_KEY=gemini-api-key:latest,\
PUBLIC_API_KEY=PUBLIC_API_KEY:latest" \
  --add-cloudsql-instances=${DB_INSTANCE} \
  --memory=1Gi \
  --cpu=1 \
  --min-instances=0 \
  --max-instances=10 \
  --concurrency=80 \
  --timeout=1200s \
  --cpu-throttling \
  --no-gen2 \
  --labels="env=preprod"

echo ""
echo "✅ Deployment completed successfully!"
echo ""
echo "📊 Service Details:"
gcloud run services describe ${SERVICE_NAME} \
  --region=${REGION} \
  --project=${PROJECT_ID} \
  --format='value(status.url)'

echo ""
echo "🔗 Service URL:"
SERVICE_URL=$(gcloud run services describe ${SERVICE_NAME} \
  --region=${REGION} \
  --project=${PROJECT_ID} \
  --format='value(status.url)')
echo "   $SERVICE_URL"
echo ""
echo "🏥 Health Check:"
curl -s "${SERVICE_URL}/actuator/health" | jq . || echo "Connection failed"
echo ""
echo "✨ Backend is ready for testing!"
