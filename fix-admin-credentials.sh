#!/bin/bash

# Fix script to redeploy Cloud Run with proper admin credentials

PROJECT_ID="astute-strategy-406601"
REGION="asia-south1"
SERVICE="perundhu-backend-preprod"
IMAGE="asia-south1-docker.pkg.dev/astute-strategy-406601/perundhu/backend:preprod-latest"

echo "🔧 Fixing admin credentials in Cloud Run..."
echo ""

# Get the admin credentials from Secret Manager
echo "📥 Retrieving credentials from GCP Secret Manager..."
ADMIN_USERNAME=$(gcloud secrets versions access latest --secret=admin-username --project=$PROJECT_ID 2>/dev/null)
ADMIN_PASSWORD=$(gcloud secrets versions access latest --secret=admin-password --project=$PROJECT_ID 2>/dev/null)

if [ -z "$ADMIN_USERNAME" ] || [ -z "$ADMIN_PASSWORD" ]; then
    echo "❌ Failed to retrieve credentials from Secret Manager"
    exit 1
fi

echo "✅ Retrieved credentials:"
echo "   Username: $ADMIN_USERNAME"
echo "   Password: [REDACTED]"
echo ""

# Redeploy with credentials as environment variables
echo "🚀 Redeploying Cloud Run service..."
gcloud run deploy $SERVICE \
    --image=$IMAGE \
    --platform=managed \
    --region=$REGION \
    --project=$PROJECT_ID \
    --set-env-vars="ADMIN_USERNAME=$ADMIN_USERNAME,ADMIN_PASSWORD=$ADMIN_PASSWORD,SPRING_PROFILES_ACTIVE=preprod,DB_USERNAME=perundhu_user,SPRING_DATASOURCE_URL=jdbc:mysql://google/perundhu?cloudSqlInstance=$PROJECT_ID:$REGION:perundhu-preprod-mysql&socketFactory=com.google.cloud.sql.mysql.SocketFactory&useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC&autocommit=false,SPRING_DATASOURCE_DRIVER_CLASS_NAME=com.mysql.cj.jdbc.Driver,SPRING_DATASOURCE_USERNAME=perundhu_user,FLYWAY_ENABLED=false,CORS_ALLOWED_ORIGINS=https://perundhu-frontend-preprod-1032721240281.asia-south1.run.app,LOG_LEVEL_ROOT=INFO,LOG_LEVEL_APP=INFO,RATE_LIMIT_ENABLED=true,ORIGIN_VALIDATION_ENABLED=true,HONEYPOT_ENABLED=true,RECAPTCHA_ENABLED=true,GEMINI_API_ENABLED=true,HIKARI_MIN_IDLE=2" \
    --update-secrets="DB_PASSWORD=db-password:latest,SPRING_DATASOURCE_PASSWORD=db-password:latest,GEMINI_API_KEY=gemini-api-key:latest,JWT_SECRET=preprod-jwt-secret:latest,PUBLIC_API_KEY=PUBLIC_API_KEY:latest,RECAPTCHA_SITE_KEY=recaptcha-site-key:latest,RECAPTCHA_SECRET_KEY=recaptcha-secret-key:latest" \
    --add-cloudsql-instances="$PROJECT_ID:$REGION:perundhu-preprod-mysql" \
    --memory=2Gi \
    --cpu=2 \
    --min-instances=0 \
    --max-instances=3 \
    --timeout=300s

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Deployment successful!"
    echo ""
    echo "🧪 Testing admin login..."
    sleep 5
    
    BACKEND_URL="https://perundhu-backend-preprod-1032721240281.asia-south1.run.app"
    AUTH_HEADER="Basic $(echo -n "$ADMIN_USERNAME:$ADMIN_PASSWORD" | base64)"
    
    RESPONSE=$(curl -s -X GET "$BACKEND_URL/api/admin/dashboard" \
        -H "Authorization: $AUTH_HEADER" \
        -w "\nHTTP_STATUS:%{http_code}")
    
    HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS:" | cut -d: -f2)
    
    if [ "$HTTP_STATUS" = "200" ]; then
        echo "✅ Admin login successful! (HTTP 200)"
    else
        echo "⚠️  Admin login returned HTTP $HTTP_STATUS"
        echo "Response:"
        echo "$RESPONSE" | head -5
    fi
else
    echo "❌ Deployment failed!"
    exit 1
fi
