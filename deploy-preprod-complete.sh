#!/bin/bash

#################################################################
# Master Preprod Deployment Orchestration Script
# 
# This script orchestrates the entire preprod deployment:
# 1. Terraform provisioning
# 2. Database setup
# 3. Docker build & push (backend + frontend)
# 4. Cloud Run deployment (backend + frontend)
# 5. Verification & health checks
# 
# Prerequisites:
# - Docker Desktop running
# - gcloud CLI authenticated
# - Terraform installed
# 
# Usage: bash deploy-preprod-complete.sh
#################################################################

set -e

PROJECT_ROOT="/Users/mchand69/Documents/perundhu"
cd "${PROJECT_ROOT}"

# Configuration
export GCP_PROJECT_ID="astute-strategy-406601"
export GCP_REGION="asia-south1"
DEPLOYMENT_LOG="/tmp/preprod-deployment-$(date +%Y%m%d-%H%M%S).log"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║     🚀 PREPROD COMPLETE DEPLOYMENT ORCHESTRATION 🚀       ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "Deployment log: ${DEPLOYMENT_LOG}"
echo ""

# Function to run step with logging
run_step() {
    local step_num=$1
    local step_name=$2
    local script=$3
    
    echo ""
    echo "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo "${BLUE}Step ${step_num}: ${step_name}${NC}"
    echo "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    
    if bash "${script}" | tee -a "${DEPLOYMENT_LOG}"; then
        echo "${GREEN}✅ Step ${step_num} completed successfully${NC}"
    else
        echo "${RED}❌ Step ${step_num} failed${NC}"
        echo "See log: ${DEPLOYMENT_LOG}"
        exit 1
    fi
}

# Preflight checks
echo "${YELLOW}Running preflight checks...${NC}"
echo ""

# Check Docker
if ! docker ps > /dev/null 2>&1; then
    echo "${RED}❌ Docker is not running${NC}"
    echo "   Please start Docker Desktop and retry"
    exit 1
fi
echo "${GREEN}✅ Docker is running${NC}"

# Check gcloud
if ! gcloud --version > /dev/null 2>&1; then
    echo "${RED}❌ gcloud CLI not found${NC}"
    exit 1
fi
echo "${GREEN}✅ gcloud CLI is available${NC}"

# Check terraform
if ! terraform -version > /dev/null 2>&1; then
    echo "${RED}❌ Terraform not found${NC}"
    exit 1
fi
echo "${GREEN}✅ Terraform is available${NC}"

echo ""
echo "${GREEN}All preflight checks passed!${NC}"
echo ""

# Ask user to confirm
echo "${YELLOW}⚠️  This will deploy to preprod (astute-strategy-406601)${NC}"
echo "Services:"
echo "  - perundhu-backend-preprod"
echo "  - perundhu-frontend-preprod"
echo "  - Cloud SQL: perundhu-preprod-mysql"
echo ""
read -p "${YELLOW}Continue with deployment? (yes/no): ${NC}" -r CONFIRM
if [[ ! $CONFIRM =~ ^[Yy][Ee][Ss]$ ]]; then
    echo "${RED}Deployment cancelled${NC}"
    exit 1
fi

echo ""
echo "════════════════════════════════════════════════════════════"
echo "${BLUE}Starting deployment...${NC}"
echo "════════════════════════════════════════════════════════════"
echo ""

DEPLOYMENT_START=$(date +%s)

# Step 1: Provision Terraform
run_step 1 "Terraform Provisioning" "provision-preprod-terraform.sh"

# Step 2: Setup Database
run_step 2 "Database Setup" "setup-preprod-database.sh"

# Step 3: Build Backend
run_step 3 "Build Backend Docker Image" "build-preprod-backend.sh"

# Step 4: Build Frontend
run_step 4 "Build Frontend Docker Image" "build-preprod-frontend.sh"

# Step 5: Deploy Backend
run_step 5 "Deploy Backend to Cloud Run" "deploy-preprod-backend.sh"

# Step 6: Deploy Frontend
run_step 6 "Deploy Frontend to Cloud Run" "deploy-preprod-frontend.sh"

# Calculate deployment time
DEPLOYMENT_END=$(date +%s)
DEPLOYMENT_TIME=$((DEPLOYMENT_END - DEPLOYMENT_START))
DEPLOYMENT_MINUTES=$((DEPLOYMENT_TIME / 60))
DEPLOYMENT_SECONDS=$((DEPLOYMENT_TIME % 60))

echo ""
echo "════════════════════════════════════════════════════════════"
echo "${GREEN}✅ PREPROD DEPLOYMENT COMPLETE!${NC}"
echo "════════════════════════════════════════════════════════════"
echo ""
echo "Deployment Summary:"
echo "  Project: ${GCP_PROJECT_ID}"
echo "  Region: ${GCP_REGION}"
echo "  Duration: ${DEPLOYMENT_MINUTES}m ${DEPLOYMENT_SECONDS}s"
echo "  Log: ${DEPLOYMENT_LOG}"
echo ""
echo "Deployed Services:"
echo "  Backend: perundhu-backend-preprod"
echo "  Frontend: perundhu-frontend-preprod"
echo "  Database: perundhu-preprod-mysql"
echo ""
echo "Next Steps:"
echo "1. Test the frontend URL in browser"
echo "2. Run smoke tests"
echo "3. Monitor logs: gcloud run logs read <SERVICE> --region=${GCP_REGION}"
echo ""
echo "To view full logs:"
echo "  cat ${DEPLOYMENT_LOG}"
echo ""
echo "════════════════════════════════════════════════════════════"
echo ""
