#!/bin/bash

#################################################################
# Preprod Backend Docker Build & Push Script
# 
# Prerequisites:
# - Docker Desktop must be running
# - gcloud CLI authenticated with astute-strategy-406601 project
# 
# Usage: bash build-preprod-backend.sh
#################################################################

set -e

PROJECT_ROOT="/Users/mchand69/Documents/perundhu"
cd "${PROJECT_ROOT}"

# Set environment variables
export GCP_PROJECT_ID="astute-strategy-406601"
export GCP_REGION="asia-south1"
export ARTIFACT_REGISTRY="${GCP_REGION}-docker.pkg.dev"
export BACKEND_IMAGE="${ARTIFACT_REGISTRY}/${GCP_PROJECT_ID}/perundhu/backend:preprod-$(date +%s)"
export BACKEND_IMAGE_LATEST="${ARTIFACT_REGISTRY}/${GCP_PROJECT_ID}/perundhu/backend:preprod-latest"

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║       🐳  PREPROD BACKEND DOCKER BUILD & PUSH 🐳          ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Step 1: Verify Docker is running
echo "📋 Step 1: Checking Docker..."
if ! docker ps > /dev/null 2>&1; then
    echo "❌ Docker is not running."
    echo "   Please start Docker Desktop and retry."
    exit 1
fi
echo "✅ Docker is running"
echo ""

# Step 2: Configure Docker authentication
echo "📋 Step 2: Configuring Docker authentication..."
gcloud auth configure-docker ${ARTIFACT_REGISTRY} --quiet
echo "✅ Docker authentication configured"
echo ""

# Step 3: Build JAR
echo "📋 Step 3: Building backend JAR with preprod profile..."
cd "${PROJECT_ROOT}/backend"
./gradlew clean build -Dspring.profiles.active=preprod -x test --no-daemon
echo "✅ Backend JAR built"
echo ""

# Step 4: Build Docker image
echo "📋 Step 4: Building Docker image..."
docker build --platform=linux/amd64 -t ${BACKEND_IMAGE_LATEST} .
echo "✅ Docker image built"
echo "   Image: ${BACKEND_IMAGE_LATEST}"
echo ""

# Step 5: Push to Artifact Registry
echo "📋 Step 5: Pushing to Artifact Registry..."
docker push ${BACKEND_IMAGE_LATEST}
echo "✅ Pushed to Artifact Registry"
echo ""

# Step 6: Verification
echo "📋 Step 6: Verifying image..."
docker images | grep perundhu/backend | head -5
echo ""

# Save image name for deployment
echo "✅ Build complete!"
echo ""
echo "════════════════════════════════════════════════════════════"
echo "Image Details:"
echo "════════════════════════════════════════════════════════════"
echo "Latest Tag: ${BACKEND_IMAGE_LATEST}"
echo ""
echo "Next: Deploy to Cloud Run using deploy-preprod-backend.sh"
echo "════════════════════════════════════════════════════════════"
echo ""
