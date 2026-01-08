#!/bin/bash

# Script to import existing GCP resources into Terraform state
# This fixes "409 Resource already exists" errors during apply

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}📦 Importing existing resources into Terraform state...${NC}\n"

# Navigate to preprod directory
cd infrastructure/terraform/environments/preprod

# Configuration
PROJECT_ID="astute-strategy-406601"
REGION="asia-south1"
ENVIRONMENT="preprod"
APP_NAME="perundhu"

echo -e "${YELLOW}Detected Configuration:${NC}"
echo "  Project: ${PROJECT_ID}"
echo "  Region: ${REGION}"
echo "  Environment: ${ENVIRONMENT}"
echo "  App Name: ${APP_NAME}\n"

# 1. Import Cloud Run Service (from cloud_run module)
echo -e "${YELLOW}1️⃣ Importing Cloud Run Service...${NC}"
if terraform import module.cloud_run.google_cloud_run_service.backend \
  "projects/${PROJECT_ID}/locations/${REGION}/services/${APP_NAME}-${ENVIRONMENT}-backend"; then
  echo -e "${GREEN}✓ Cloud Run service imported${NC}\n"
else
  echo -e "${YELLOW}⚠ Cloud Run service import failed (may already be in state)${NC}\n"
fi

# 2. Import Secret Manager - db-username (from secrets module)
echo -e "${YELLOW}2️⃣ Importing Secret: db-username${NC}"
if terraform import module.secrets.google_secret_manager_secret.db_username \
  "projects/${PROJECT_ID}/secrets/db-username"; then
  echo -e "${GREEN}✓ db-username secret imported${NC}\n"
else
  echo -e "${YELLOW}⚠ db-username secret import failed (may already be in state)${NC}\n"
fi

# 3. Import Secret Manager - db-password (from secrets module)
echo -e "${YELLOW}3️⃣ Importing Secret: db-password${NC}"
if terraform import module.secrets.google_secret_manager_secret.db_password \
  "projects/${PROJECT_ID}/secrets/db-password"; then
  echo -e "${GREEN}✓ db-password secret imported${NC}\n"
else
  echo -e "${YELLOW}⚠ db-password secret import failed (may already be in state)${NC}\n"
fi

# 4. Try to import secret versions (these may fail if already managed)
echo -e "${YELLOW}4️⃣ Attempting to import Secret Versions...${NC}"
if terraform import module.secrets.google_secret_manager_secret_version.db_username \
  "projects/${PROJECT_ID}/secrets/db-username/versions/latest" 2>/dev/null; then
  echo -e "${GREEN}✓ db-username version imported${NC}"
else
  echo -e "${YELLOW}⚠ db-username version already in state or not needed${NC}"
fi

if terraform import module.secrets.google_secret_manager_secret_version.db_password \
  "projects/${PROJECT_ID}/secrets/db-password/versions/latest" 2>/dev/null; then
  echo -e "${GREEN}✓ db-password version imported${NC}"
else
  echo -e "${YELLOW}⚠ db-password version already in state or not needed${NC}"
fi
echo ""

# Verify state
echo -e "${YELLOW}5️⃣ Verifying Terraform state...${NC}"
terraform state list | grep -E "(cloud_run|secret)" || echo "Checking state..."
echo ""

echo -e "${GREEN}✅ Import process complete!${NC}"
echo -e "${YELLOW}Next steps:${NC}"
echo "  1. Review the terraform plan: cd .. && terraform plan -var-file=preprod.tfvars"
echo "  2. If plan looks good, apply: terraform apply -var-file=preprod.tfvars"
