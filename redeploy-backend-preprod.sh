#!/bin/bash

# Manual Backend Redeployment Script for Preprod
# This script rebuilds and redeploys the backend to Cloud Run preprod

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

# Main script
print_header "Preprod Backend Redeployment"

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

# Build the backend
print_header "Building Backend JAR"
cd backend
print_status "Running Gradle build..."
chmod +x gradlew
./gradlew clean build -x test --no-daemon
print_status "Backend JAR built successfully"
cd ..

# Build and push Docker image
print_header "Building and Pushing Docker Image"

# Generate image tag
COMMIT_SHA=$(git rev-parse --short HEAD)
BUILD_TIMESTAMP=$(date +%Y%m%d-%H%M%S)
TAG="${BUILD_TIMESTAMP}-${COMMIT_SHA}"
IMAGE="${ARTIFACT_REGISTRY}/${PROJECT_ID}/${IMAGE_NAME}:${TAG}"
IMAGE_LATEST="${ARTIFACT_REGISTRY}/${PROJECT_ID}/${IMAGE_NAME}:preprod-latest"

print_status "Authenticating with Docker registry..."
gcloud auth configure-docker $ARTIFACT_REGISTRY --quiet

print_status "Building Docker image..."
print_status "  Image: $IMAGE"

# Build with --no-cache to avoid cache issues
docker build --no-cache -t $IMAGE -t $IMAGE_LATEST ./backend

print_status "Docker image built successfully"

print_status "Pushing image to registry..."
docker push $IMAGE
docker push $IMAGE_LATEST
print_status "Image pushed successfully"

# Deploy to Cloud Run
print_header "Deploying to Cloud Run"

print_status "Deploying $SERVICE_NAME..."
gcloud run deploy $SERVICE_NAME \
    --image $IMAGE \
    --platform managed \
    --region $GCP_REGION \
    --allow-unauthenticated \
    --set-env-vars="SPRING_PROFILES_ACTIVE=preprod,GCP_INSTANCE_CONNECTION_NAME=astute-strategy-406601:asia-south1:perundhu-preprod-mysql,MYSQL_USERNAME=perundhu_user,GEMINI_API_ENABLED=true,CORS_ALLOWED_ORIGINS=https://perundhu-frontend-preprod-1032721240281.asia-south1.run.app" \
    --set-secrets="DB_PASSWORD=db-password:latest,MYSQL_PASSWORD=db-password:latest,DB_USERNAME=db-username:latest,GEMINI_API_KEY=gemini-api-key:latest,PUBLIC_API_KEY=PUBLIC_API_KEY:latest,RECAPTCHA_SITE_KEY=recaptcha-site-key:latest,RECAPTCHA_SECRET_KEY=recaptcha-secret-key:latest" \
    --add-cloudsql-instances=astute-strategy-406601:asia-south1:perundhu-preprod-mysql \
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
print_status "Waiting for service to be ready..."
for i in {1..30}; do
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" $SERVICE_URL/actuator/health || echo "000")
    if [ "$HTTP_CODE" -eq "200" ]; then
        print_status "Service is healthy!"
        break
    fi
    print_warning "Service not ready yet (HTTP $HTTP_CODE), waiting..."
    sleep 5
done

# Verify migrations ran
print_header "Verifying Database Migrations"
print_status "Check the backend logs for migration status:"
echo ""
echo "  gcloud run logs read $SERVICE_NAME --region=$GCP_REGION --limit=50"
echo ""

print_header "Redeployment Complete!"
echo ""
echo "✅ Backend redeployed successfully to preprod"
echo ""
echo "Service Details:"
echo "  Service: $SERVICE_NAME"
echo "  Region: $GCP_REGION"
echo "  URL: $SERVICE_URL"
echo "  Image: $IMAGE"
echo ""
echo "Next steps:"
echo "  1. Monitor logs: gcloud run logs read $SERVICE_NAME --region=$GCP_REGION"
echo "  2. Test health: curl $SERVICE_URL/actuator/health"
echo "  3. Verify migrations ran (check logs for Flyway messages)"
echo ""

