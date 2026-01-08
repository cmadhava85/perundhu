#!/bin/bash
# Deploy Perundhu Backend to Preprod (Corrected with all environment variables)
# This script deploys with proper CORS and security configuration

set -e

PROJECT_ID="astute-strategy-406601"
REGION="asia-south1"
REGISTRY="asia-south1-docker.pkg.dev"
SQL_INSTANCE="astute-strategy-406601:asia-south1:perundhu-preprod-mysql"
SERVICE_NAME="perundhu-backend-preprod"

# Get the latest image tag
IMAGE_TAG=$(gcloud container images list-tags \
  ${REGISTRY}/${PROJECT_ID}/perundhu/backend \
  --filter="tags:preprod-latest" \
  --format="get(digest)" \
  --limit=1)

if [ -z "$IMAGE_TAG" ]; then
  echo "❌ No preprod-latest image found. Please build and push the image first."
  exit 1
fi

IMAGE="${REGISTRY}/${PROJECT_ID}/perundhu/backend:preprod-latest"

echo "🚀 Deploying $SERVICE_NAME to $REGION"
echo "📦 Image: $IMAGE"
echo ""

# Deploy with all environment variables properly set
gcloud run deploy $SERVICE_NAME \
  --image=$IMAGE \
  --platform=managed \
  --region=$REGION \
  --allow-unauthenticated \
  --set-env-vars=\
"SPRING_PROFILES_ACTIVE=preprod,\
SPRING_DATASOURCE_URL=jdbc:mysql://google/perundhu?cloudSqlInstance=${SQL_INSTANCE}&socketFactory=com.google.cloud.sql.mysql.SocketFactory&useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC,\
SPRING_DATASOURCE_DRIVER_CLASS_NAME=com.mysql.cj.jdbc.Driver,\
DB_USERNAME=perundhu_user,\
SPRING_DATASOURCE_USERNAME=perundhu_user,\
SPRING_FLYWAY_ENABLED=true,\
SERVER_PORT=8080,\
LOG_LEVEL_ROOT=INFO,\
LOG_LEVEL_APP=INFO,\
RATE_LIMIT_ENABLED=true,\
RATE_LIMIT_READ=100,\
RATE_LIMIT_WRITE=20,\
RATE_LIMIT_UPLOAD=10,\
ORIGIN_VALIDATION_ENABLED=true,\
ORIGIN_STRICT_MODE=false,\
HONEYPOT_ENABLED=true,\
RECAPTCHA_ENABLED=false,\
API_KEY_ENABLED=false,\
ADMIN_AUTH_ENABLED=true,\
GEMINI_API_ENABLED=true,\
DATA_ENCRYPTION_ENABLED=false,\
CORS_ALLOWED_ORIGINS=https://perundhu-frontend-preprod-1032721240281.asia-south1.run.app,\
GCP_PROJECT_ID=${PROJECT_ID}" \
  --update-secrets=\
"DB_PASSWORD=db-password:latest,\
SPRING_DATASOURCE_PASSWORD=db-password:latest,\
GEMINI_API_KEY=gemini-api-key:latest,\
ADMIN_USERNAME=admin-username:latest,\
ADMIN_PASSWORD=admin-password:latest" \
  --add-cloudsql-instances=$SQL_INSTANCE \
  --memory=2Gi \
  --cpu=2 \
  --min-instances=0 \
  --max-instances=10 \
  --timeout=300s

echo ""
echo "✅ Backend deployed successfully!"
echo ""

# Get the service URL
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME \
  --region=$REGION \
  --format='value(status.url)')

echo "🌐 Service URL: $SERVICE_URL"
echo ""
echo "📋 Verification Steps:"
echo "1. Health Check: curl -s $SERVICE_URL/actuator/health | jq"
echo "2. Announcements: curl -s $SERVICE_URL/api/v1/announcements | jq"
echo "3. Check Logs: gcloud run logs read $SERVICE_NAME --region=$REGION --limit=50"
echo ""
echo "🔍 View Environment Variables:"
echo "   gcloud run services describe $SERVICE_NAME --region=$REGION --format='value(spec.template.spec.containers[0].env[*].{name:name,value:value})'"
