#!/bin/bash
# Deploy Perundhu Backend to Preprod with Flyway Migrations
# This script deploys with Flyway ENABLED to run any pending migrations

set -e

PROJECT_ID="astute-strategy-406601"
REGION="asia-south1"
REGISTRY="asia-south1-docker.pkg.dev"
SQL_INSTANCE="astute-strategy-406601:asia-south1:perundhu-preprod-mysql"
SERVICE_NAME="perundhu-backend-preprod"

echo "🚀 Deploying Perundhu Backend Preprod with Database Migrations"
echo "================================================================"

# Build new image
echo ""
echo "📦 Building backend JAR..."
cd /Users/mchand69/Documents/perundhu/backend
chmod +x gradlew
./gradlew build -x test --no-daemon

# Build and push Docker image
echo ""
echo "🐳 Building and pushing Docker image..."
TAG="$(date +%Y%m%d-%H%M%S)-$(git rev-parse --short HEAD)"
IMAGE="${REGISTRY}/${PROJECT_ID}/perundhu/backend:${TAG}"
LATEST="${REGISTRY}/${PROJECT_ID}/perundhu/backend:preprod-latest"

docker build --platform=linux/amd64 -t $IMAGE -t $LATEST ./backend
docker push $IMAGE
docker push $LATEST

echo ""
echo "✅ Image pushed: $LATEST"
echo ""

# Deploy to Cloud Run with Flyway ENABLED
echo "🚀 Deploying to Cloud Run with Flyway migrations..."
gcloud run deploy $SERVICE_NAME \
  --image=$LATEST \
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

# Get service URL
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME \
  --region=$REGION \
  --format='value(status.url)')

echo "🌐 Service URL: $SERVICE_URL"
echo ""

# Wait for deployment to stabilize
echo "⏳ Waiting for deployment to stabilize..."
sleep 15

# Check health and run migrations status
echo ""
echo "🔍 Checking service health..."
curl -s "${SERVICE_URL}/actuator/health" | jq . || echo "Health check in progress..."

echo ""
echo "📊 Verification Steps:"
echo "1. Health Check: curl -s ${SERVICE_URL}/actuator/health | jq"
echo "2. Announcements: curl -s ${SERVICE_URL}/api/v1/announcements | jq"
echo "3. Check Logs: gcloud run services logs read $SERVICE_NAME --region=$REGION --limit=100"
echo ""
echo "✅ Deployment complete!"
