#!/bin/bash

# GCP Cloud Run Backend Redeployment Script (No Docker Required)
# This uses gcloud CLI to redeploy the backend with the latest code changes

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
PROJECT_ID="astute-strategy-406601"
GCP_REGION="asia-south1"
SERVICE_NAME="perundhu-backend-preprod"
ARTIFACT_REGISTRY="asia-south1-docker.pkg.dev"
IMAGE_NAME="perundhu/backend"

# Functions
print_header() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}"
}

print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_header "GCP Cloud Run Backend Redeployment"

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    print_error "gcloud CLI is not installed. Please install it first."
    exit 1
fi

# Check if user is authenticated
print_status "Checking GCP authentication..."
if ! gcloud auth list --filter="status:ACTIVE" --format="value(account)" | grep -q "."; then
    print_error "Not authenticated with Google Cloud. Please run: gcloud auth login"
    exit 1
fi

# Set the project
print_status "Setting GCP project to $PROJECT_ID..."
gcloud config set project "$PROJECT_ID" --quiet

# Build the backend JAR
print_header "Building Backend JAR"
cd backend
print_status "Running Gradle build..."
chmod +x gradlew

# Build JAR
./gradlew clean build -x test --no-daemon

# Check if build was successful
if [ ! -f "build/libs/app.jar" ]; then
    print_error "Failed to build backend JAR"
    exit 1
fi

print_status "Backend JAR built successfully"
print_status "JAR location: $(pwd)/build/libs/app.jar"
cd ..

# Deploy using gcloud build submit
print_header "Deploying Backend to Cloud Run"

COMMIT_SHA=$(git rev-parse --short HEAD)
BUILD_TIMESTAMP=$(date +%Y%m%d-%H%M%S)
TAG="${BUILD_TIMESTAMP}-${COMMIT_SHA}"
IMAGE="${ARTIFACT_REGISTRY}/${PROJECT_ID}/${IMAGE_NAME}:${TAG}"
IMAGE_LATEST="${ARTIFACT_REGISTRY}/${PROJECT_ID}/${IMAGE_NAME}:preprod-latest"

print_status "Submitting build to Google Cloud Build..."
print_status "  Image: $IMAGE"
print_status "  Tag: $TAG"

# Submit the build to Cloud Build
gcloud builds submit backend \
    --region=$GCP_REGION \
    --config=backend/cloudbuild.yaml \
    --substitutions="_IMAGE_NAME=${IMAGE},_IMAGE_LATEST=${IMAGE_LATEST}"

if [ $? -ne 0 ]; then
    print_warning "Cloud Build submit failed. Checking if cloudbuild.yaml exists..."
    
    # If cloudbuild.yaml doesn't exist, use inline build
    print_status "Using inline Docker build..."
    gcloud builds submit backend \
        --region=$GCP_REGION \
        --substitutions="_IMAGE=${IMAGE},_IMAGE_LATEST=${IMAGE_LATEST}" \
        --tag="${IMAGE}" \
        --tag="${IMAGE_LATEST}"
fi

print_status "Image built and pushed successfully"

# Deploy to Cloud Run
print_header "Deploying to Cloud Run Service"

print_status "Deploying $SERVICE_NAME..."
gcloud run deploy $SERVICE_NAME \
    --image $IMAGE \
    --platform managed \
    --region $GCP_REGION \
    --allow-unauthenticated \
    --set-env-vars="SPRING_PROFILES_ACTIVE=preprod,GCP_INSTANCE_CONNECTION_NAME=astute-strategy-406601:asia-south1:perundhu-preprod-mysql-asia,DB_USERNAME=perundhu_user,MYSQL_USERNAME=perundhu_user,GEMINI_API_ENABLED=true,CORS_ALLOWED_ORIGINS=https://perundhu-frontend-preprod-1032721240281.asia-south1.run.app" \
    --set-secrets="DB_PASSWORD=preprod-db-password:latest,MYSQL_PASSWORD=preprod-db-password:latest,JWT_SECRET=JWT_SECRET_PREPROD:latest,DATA_ENCRYPTION_KEY=DATA_ENCRYPTION_KEY_PREPROD:latest,GEMINI_API_KEY=gemini-api-key:latest,PUBLIC_API_KEY=PUBLIC_API_KEY:latest" \
    --add-cloudsql-instances=astute-strategy-406601:asia-south1:perundhu-preprod-mysql-asia \
    --memory 1Gi \
    --cpu 1 \
    --min-instances 0 \
    --max-instances 10 \
    --concurrency 80 \
    --timeout 300s \
    --cpu-throttling \
    --labels="env=preprod" \
    --quiet

print_status "Backend deployed successfully!"

# Get the service URL
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region $GCP_REGION --format 'value(status.url)')
print_status "Service URL: $SERVICE_URL"

# Wait for service to be ready
print_header "Verifying Service Health"
print_status "Waiting for service to be ready..."

for i in {1..30}; do
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" $SERVICE_URL/actuator/health 2>/dev/null || echo "000")
    if [ "$HTTP_CODE" -eq "200" ]; then
        print_status "Service is healthy! (HTTP $HTTP_CODE)"
        break
    fi
    print_warning "Service not ready yet (HTTP $HTTP_CODE), waiting... ($i/30)"
    sleep 5
done

# Display final summary
print_header "Redeployment Complete!"
echo ""
echo "✅ Backend redeployed successfully to preprod"
echo ""
echo "Service Details:"
echo "  Service: $SERVICE_NAME"
echo "  Region: $GCP_REGION"
echo "  URL: $SERVICE_URL"
echo "  Image: $IMAGE"
echo "  Commit: $COMMIT_SHA"
echo ""
echo "Next steps:"
echo "  1. Monitor logs:"
echo "     gcloud run logs read $SERVICE_NAME --region=$GCP_REGION --limit=100"
echo ""
echo "  2. Test health endpoint:"
echo "     curl $SERVICE_URL/actuator/health"
echo ""
echo "  3. Verify migrations ran (search logs for 'Flyway'):"
echo "     gcloud run logs read $SERVICE_NAME --region=$GCP_REGION | grep -i flyway"
echo ""
echo "  4. Check for announcements table:"
echo "     Look for 'V29__create_announcements_table' in the logs"
echo ""

