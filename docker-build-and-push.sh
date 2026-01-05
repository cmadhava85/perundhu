#!/bin/bash

# Perundhu Docker Build & Push Script
# Run this once Docker Desktop is running: bash docker-build-and-push.sh

set -e

PROJECT_ID="perundhu-prod-001"
REGION="asia-south1"
REGISTRY="${REGION}-docker.pkg.dev"

echo "========================================"
echo "🐳 Perundhu Docker Build & Push"
echo "========================================"
echo ""

# Verify Docker is running
echo "Checking Docker..."
docker ps > /dev/null 2>&1 || { echo "❌ Docker is not running. Please start Docker Desktop and retry."; exit 1; }
echo "✅ Docker is running"
echo ""

# Configure Docker auth
echo "Configuring Docker authentication..."
gcloud auth configure-docker ${REGISTRY} --quiet
echo "✅ Docker authentication configured"
echo ""

# ============================================
# BACKEND IMAGE
# ============================================
echo "========================================"
echo "📦 Building Backend Image"
echo "========================================"
cd /Users/mchand69/Documents/perundhu/backend

echo "Building backend JAR..."
./gradlew clean build -Dspring.profiles.active=production -x test -q
echo "✅ Backend JAR built"

echo ""
echo "Building Docker image..."
docker build -t ${REGISTRY}/${PROJECT_ID}/perundhu/backend:1.0.0 .
docker tag ${REGISTRY}/${PROJECT_ID}/perundhu/backend:1.0.0 ${REGISTRY}/${PROJECT_ID}/perundhu/backend:latest
echo "✅ Backend image built"

echo ""
echo "Pushing to GCR..."
docker push ${REGISTRY}/${PROJECT_ID}/perundhu/backend:1.0.0
docker push ${REGISTRY}/${PROJECT_ID}/perundhu/backend:latest
echo "✅ Backend image pushed"

# ============================================
# FRONTEND IMAGE
# ============================================
echo ""
echo "========================================"
echo "🎨 Building Frontend Image"
echo "========================================"
cd /Users/mchand69/Documents/perundhu/frontend

echo "Installing dependencies and building..."
npm run build
echo "✅ Frontend built"

echo ""
echo "Building Docker image..."
docker build -t ${REGISTRY}/${PROJECT_ID}/perundhu/frontend:1.0.0 .
docker tag ${REGISTRY}/${PROJECT_ID}/perundhu/frontend:1.0.0 ${REGISTRY}/${PROJECT_ID}/perundhu/frontend:latest
echo "✅ Frontend image built"

echo ""
echo "Pushing to GCR..."
docker push ${REGISTRY}/${PROJECT_ID}/perundhu/frontend:1.0.0
docker push ${REGISTRY}/${PROJECT_ID}/perundhu/frontend:latest
echo "✅ Frontend image pushed"

# ============================================
# VERIFICATION
# ============================================
echo ""
echo "========================================"
echo "✅ Build & Push Complete!"
echo "========================================"
echo ""
echo "Images in GCR:"
echo "  Backend:  ${REGISTRY}/${PROJECT_ID}/perundhu/backend:1.0.0"
echo "  Frontend: ${REGISTRY}/${PROJECT_ID}/perundhu/frontend:1.0.0"
echo ""
echo "Next steps:"
echo "  1. Deploy to Cloud Run (Friday, Jan 12)"
echo "  2. Configure domain mappings"
echo "  3. Run smoke tests"
echo ""
