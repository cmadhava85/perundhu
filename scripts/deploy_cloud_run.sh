#!/bin/bash
# ============================================================
# DEPLOY TO CLOUD RUN
# ============================================================

set -e

PROJECT_ID="perundhu-prod-001"
REGION="asia-south1"
REGISTRY="$REGION-docker.pkg.dev/$PROJECT_ID/perundhu-images"
CLOUD_SQL_INSTANCE="$PROJECT_ID:$REGION:perundhu-production-mysql"
VPC_CONNECTOR="projects/$PROJECT_ID/locations/$REGION/connectors/perundhu-connector"

cd /Users/mchand69/Documents/perundhu

echo ""
echo "==========================================="
echo "🚀 DEPLOY TO CLOUD RUN"
echo "==========================================="
echo ""

# Get latest image tags
if [ -f /tmp/backend_image.txt ]; then
    BACKEND_IMAGE=$(cat /tmp/backend_image.txt)
else
    BACKEND_IMAGE="$REGISTRY/backend:latest"
fi

if [ -f /tmp/frontend_image.txt ]; then
    FRONTEND_IMAGE=$(cat /tmp/frontend_image.txt)
else
    FRONTEND_IMAGE="$REGISTRY/frontend:latest"
fi

echo "Backend Image:  $BACKEND_IMAGE"
echo "Frontend Image: $FRONTEND_IMAGE"
echo ""

# ============================================================
# DEPLOY BACKEND
# ============================================================
echo "📍 Step 1: Deploying Backend to Cloud Run..."

gcloud run deploy perundhu-backend \
    --image=$BACKEND_IMAGE \
    --platform=managed \
    --region=$REGION \
    --project=$PROJECT_ID \
    --allow-unauthenticated \
    --memory=1Gi \
    --cpu=1 \
    --min-instances=0 \
    --max-instances=10 \
    --timeout=300 \
    --concurrency=80 \
    --port=8080 \
    --vpc-connector=$VPC_CONNECTOR \
    --vpc-egress=private-ranges-only \
    --add-cloudsql-instances=$CLOUD_SQL_INSTANCE \
    --set-env-vars="SPRING_PROFILES_ACTIVE=production" \
    --set-env-vars="GOOGLE_CLOUD_PROJECT=$PROJECT_ID" \
    --set-secrets="SPRING_DATASOURCE_URL=production-db-url:latest" \
    --set-secrets="SPRING_DATASOURCE_USERNAME=production-db-username:latest" \
    --set-secrets="SPRING_DATASOURCE_PASSWORD=production-db-password:latest" \
    --set-secrets="APP_JWT_SECRET=production-jwt-secret:latest" \
    --set-secrets="SECURITY_DATA_ENCRYPTION_KEY=production-data-encryption-key:latest" \
    --set-secrets="ADMIN_AUTH_USERNAME=admin-username:latest" \
    --set-secrets="ADMIN_AUTH_PASSWORD=admin-password:latest" \
    --set-secrets="RECAPTCHA_SITE_KEY=recaptcha-site-key:latest" \
    --set-secrets="RECAPTCHA_SECRET_KEY=recaptcha-secret-key:latest" \
    --set-secrets="GEMINI_API_KEY=gemini-api-key:latest" \
    --labels="app=perundhu,component=backend,environment=production"

BACKEND_URL=$(gcloud run services describe perundhu-backend --region=$REGION --project=$PROJECT_ID --format="value(status.url)")
echo "✅ Backend deployed: $BACKEND_URL"

# ============================================================
# DEPLOY FRONTEND
# ============================================================
echo ""
echo "📍 Step 2: Deploying Frontend to Cloud Run..."

gcloud run deploy perundhu-frontend \
    --image=$FRONTEND_IMAGE \
    --platform=managed \
    --region=$REGION \
    --project=$PROJECT_ID \
    --allow-unauthenticated \
    --memory=256Mi \
    --cpu=1 \
    --min-instances=0 \
    --max-instances=10 \
    --timeout=60 \
    --concurrency=100 \
    --port=80 \
    --set-env-vars="VITE_API_URL=$BACKEND_URL" \
    --labels="app=perundhu,component=frontend,environment=production"

FRONTEND_URL=$(gcloud run services describe perundhu-frontend --region=$REGION --project=$PROJECT_ID --format="value(status.url)")
echo "✅ Frontend deployed: $FRONTEND_URL"

# ============================================================
# VERIFY DEPLOYMENTS
# ============================================================
echo ""
echo "📍 Step 3: Verifying deployments..."

echo "   Testing backend health..."
BACKEND_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" "$BACKEND_URL/actuator/health" || echo "000")
if [ "$BACKEND_HEALTH" == "200" ]; then
    echo "   ✅ Backend health check passed"
else
    echo "   ⚠️  Backend health returned: $BACKEND_HEALTH"
fi

echo "   Testing frontend..."
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_URL" || echo "000")
if [ "$FRONTEND_STATUS" == "200" ]; then
    echo "   ✅ Frontend check passed"
else
    echo "   ⚠️  Frontend returned: $FRONTEND_STATUS"
fi

# ============================================================
# SUMMARY
# ============================================================
echo ""
echo "==========================================="
echo "✅ CLOUD RUN DEPLOYMENT COMPLETE"
echo "==========================================="
echo ""
echo "Services:"
echo "  Backend:  $BACKEND_URL"
echo "  Frontend: $FRONTEND_URL"
echo ""
echo "Next Steps:"
echo "  1. Configure DNS to point to Cloud Run URLs"
echo "  2. Set up custom domain mapping"
echo "  3. Run smoke tests"
echo ""
echo "Custom Domain Setup:"
echo "  gcloud run domain-mappings create --service=perundhu-frontend --domain=perundhu.com --region=$REGION"
echo "  gcloud run domain-mappings create --service=perundhu-backend --domain=api.perundhu.com --region=$REGION"
echo ""
echo "View logs:"
echo "  gcloud run services logs read perundhu-backend --region=$REGION --project=$PROJECT_ID"
echo "  gcloud run services logs read perundhu-frontend --region=$REGION --project=$PROJECT_ID"
echo ""
