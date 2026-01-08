#!/bin/bash
set -e

echo "🚀 Deploying preprod backend..."
gcloud run deploy perundhu-backend-preprod \
  --image=asia-south1-docker.pkg.dev/astute-strategy-406601/perundhu/backend:preprod-latest \
  --platform=managed \
  --region=asia-south1 \
  --allow-unauthenticated \
  --set-env-vars="SPRING_PROFILES_ACTIVE=preprod,DB_USERNAME=perundhu_user,SPRING_DATASOURCE_URL=jdbc:mysql://google/perundhu?cloudSqlInstance=astute-strategy-406601:asia-south1:perundhu-preprod-mysql&socketFactory=com.google.cloud.sql.mysql.SocketFactory&useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC,SPRING_DATASOURCE_DRIVER_CLASS_NAME=com.mysql.cj.jdbc.Driver,SPRING_DATASOURCE_USERNAME=perundhu_user,SPRING_FLYWAY_ENABLED=false" \
  --update-secrets="DB_PASSWORD=db-password:latest,SPRING_DATASOURCE_PASSWORD=db-password:latest" \
  --add-cloudsql-instances=astute-strategy-406601:asia-south1:perundhu-preprod-mysql \
  --memory=2Gi \
  --cpu=2 \
  --min-instances=0 \
  --max-instances=10 \
  --timeout=300s

echo "✅ Backend deployed. Now deploying frontend..."
gcloud run deploy perundhu-frontend-preprod \
  --image=asia-south1-docker.pkg.dev/astute-strategy-406601/perundhu/frontend:preprod-latest \
  --platform=managed \
  --region=asia-south1 \
  --allow-unauthenticated \
  --port=8080 \
  --memory=512Mi \
  --cpu=1 \
  --min-instances=0 \
  --max-instances=5

echo "✅ Frontend deployed. Verifying services..."
sleep 10

BACKEND_URL=$(gcloud run services describe perundhu-backend-preprod --region=asia-south1 --format='value(status.url)')
FRONTEND_URL=$(gcloud run services describe perundhu-frontend-preprod --region=asia-south1 --format='value(status.url)')

echo ""
echo "📍 Service URLs:"
echo "Backend:  $BACKEND_URL"
echo "Frontend: $FRONTEND_URL"
echo ""

echo "🏥 Running health checks..."
echo ""
echo "Backend health check:"
curl -sf "${BACKEND_URL}/actuator/health" && echo "✅ Backend healthy" || echo "❌ Backend health check failed"

echo ""
echo "Frontend check:"
curl -sf "${FRONTEND_URL}" > /dev/null && echo "✅ Frontend loaded" || echo "❌ Frontend check failed"

echo ""
echo "✅ Deployment complete!"
