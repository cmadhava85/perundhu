#!/bin/bash
# ============================================================
# BUILD AND PUSH DOCKER IMAGES TO ARTIFACT REGISTRY
# ============================================================

set -e

PROJECT_ID="perundhu-prod-001"
REGION="asia-south1"
REGISTRY="$REGION-docker.pkg.dev/$PROJECT_ID/perundhu-images"
TAG=$(date +%Y%m%d-%H%M%S)

cd /Users/mchand69/Documents/perundhu

echo ""
echo "==========================================="
echo "🐳 BUILD AND PUSH DOCKER IMAGES"
echo "==========================================="
echo "Registry: $REGISTRY"
echo "Tag: $TAG"
echo ""

# Configure Docker for Artifact Registry
echo "📍 Step 1: Configuring Docker authentication..."
gcloud auth configure-docker $REGION-docker.pkg.dev --quiet
echo "✅ Docker configured"

# ============================================================
# BUILD BACKEND
# ============================================================
echo ""
echo "📍 Step 2: Building Backend Docker image..."

cd backend

# Build JAR first
echo "   Building JAR..."
./gradlew build -x test --quiet

# Build Docker image
BACKEND_IMAGE="$REGISTRY/backend:$TAG"
BACKEND_LATEST="$REGISTRY/backend:latest"

echo "   Building Docker image..."
docker build -t $BACKEND_IMAGE -t $BACKEND_LATEST \
    -f Dockerfile .

echo "   Pushing to Artifact Registry..."
docker push $BACKEND_IMAGE
docker push $BACKEND_LATEST

echo "✅ Backend image pushed: $BACKEND_IMAGE"

# ============================================================
# BUILD FRONTEND
# ============================================================
echo ""
echo "📍 Step 3: Building Frontend Docker image..."

cd ../frontend

# Build production bundle
echo "   Building production bundle..."
npm run build

# Build Docker image
FRONTEND_IMAGE="$REGISTRY/frontend:$TAG"
FRONTEND_LATEST="$REGISTRY/frontend:latest"

echo "   Building Docker image..."
docker build -t $FRONTEND_IMAGE -t $FRONTEND_LATEST \
    -f Dockerfile .

echo "   Pushing to Artifact Registry..."
docker push $FRONTEND_IMAGE
docker push $FRONTEND_LATEST

echo "✅ Frontend image pushed: $FRONTEND_IMAGE"

# ============================================================
# SUMMARY
# ============================================================
echo ""
echo "==========================================="
echo "✅ DOCKER IMAGES BUILT AND PUSHED"
echo "==========================================="
echo ""
echo "Backend:  $BACKEND_IMAGE"
echo "Frontend: $FRONTEND_IMAGE"
echo ""
echo "Next step: Deploy to Cloud Run"
echo "  ./scripts/deploy_cloud_run.sh"
echo ""

# Save image references for deployment
echo "$BACKEND_IMAGE" > /tmp/backend_image.txt
echo "$FRONTEND_IMAGE" > /tmp/frontend_image.txt
echo "Tag: $TAG saved to /tmp/*_image.txt"
