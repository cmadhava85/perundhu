#!/bin/bash

#################################################################
# Preprod Terraform Provisioning Script
# 
# This script provisions all infrastructure for preprod:
# - VPC and networking
# - Cloud SQL MySQL instance
# - Cloud Storage buckets
# - Service accounts and IAM roles
# - Secrets in Secret Manager
# 
# Prerequisites:
# - gcloud CLI authenticated with astute-strategy-406601 project
# - terraform CLI installed
# - Terraform backend state file location configured
# 
# Usage: bash provision-preprod-terraform.sh
#################################################################

set -e

PROJECT_ROOT="/Users/mchand69/Documents/perundhu"
TF_DIR="${PROJECT_ROOT}/infrastructure/terraform/environments/preprod"

# Configuration
export GCP_PROJECT_ID="astute-strategy-406601"
export GCP_REGION="asia-south1"
export NOTIFICATION_EMAIL="alerts@perundhu.com"

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║   🏗️  PREPROD TERRAFORM INFRASTRUCTURE PROVISIONING 🏗️    ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Change to Terraform directory
cd "${TF_DIR}"

# Step 1: Verify Terraform files
echo "📋 Step 1: Verifying Terraform configuration..."
if [ ! -f "terraform.tfvars" ]; then
    echo "❌ terraform.tfvars not found in ${TF_DIR}"
    exit 1
fi
if [ ! -f "main.tf" ]; then
    echo "❌ main.tf not found in ${TF_DIR}"
    exit 1
fi
echo "✅ Terraform configuration verified"
echo ""

# Step 2: Initialize Terraform
echo "📋 Step 2: Initializing Terraform..."
terraform init
echo "✅ Terraform initialized"
echo ""

# Step 3: Validate Terraform
echo "📋 Step 3: Validating Terraform configuration..."
terraform validate
echo "✅ Terraform configuration is valid"
echo ""

# Step 4: Plan Terraform
echo "📋 Step 4: Planning Terraform changes..."
echo "   Project: ${GCP_PROJECT_ID}"
echo "   Region: ${GCP_REGION}"
echo ""

terraform plan \
  -var="project_id=${GCP_PROJECT_ID}" \
  -var="notification_email=${NOTIFICATION_EMAIL}" \
  -var="db_version=MYSQL_8_0" \
  -var="db_instance_tier=db-f1-micro" \
  -var="db_instance_name_suffix=-asia" \
  -out=tfplan

echo ""
echo "📋 Step 5: Reviewing plan..."
echo ""
terraform show tfplan | grep -E "resource|to be created|No changes" | head -20
echo ""

# Step 6: Ask for confirmation
read -p "❓ Apply Terraform changes? (yes/no): " -r CONFIRM
if [[ ! $CONFIRM =~ ^[Yy][Ee][Ss]$ ]]; then
    echo "❌ Terraform apply cancelled"
    exit 1
fi

# Step 7: Apply Terraform
echo ""
echo "📋 Step 6: Applying Terraform changes..."
terraform apply tfplan
echo "✅ Terraform applied successfully"
echo ""

# Step 8: Capture outputs
echo "📋 Step 7: Capturing infrastructure outputs..."
terraform output -json > /tmp/preprod-terraform-outputs.json

# Extract important values
CLOUD_SQL_INSTANCE=$(terraform output -raw sql_instance_connection_name 2>/dev/null || echo "astute-strategy-406601:asia-south1:perundhu-preprod-mysql-asia")
CLOUD_SQL_IP=$(terraform output -raw sql_instance_private_ip 2>/dev/null || echo "N/A")

echo "✅ Outputs captured"
echo ""

# Step 9: Verify Cloud SQL instance
echo "📋 Step 8: Verifying Cloud SQL instance..."
gcloud sql instances describe perundhu-preprod-mysql-asia \
  --project=${GCP_PROJECT_ID} \
  --format='value(name,databaseVersion,currentDiskSize,status)' 2>/dev/null || echo "⏳ Instance still initializing"
echo ""

# Step 10: Summary
echo "════════════════════════════════════════════════════════════"
echo "✅ Preprod Infrastructure Provisioning Complete!"
echo "════════════════════════════════════════════════════════════"
echo ""
echo "Key Resources:"
echo "  Cloud SQL Instance: ${CLOUD_SQL_INSTANCE}"
echo "  Cloud SQL IP: ${CLOUD_SQL_IP}"
echo "  Project: ${GCP_PROJECT_ID}"
echo "  Region: ${GCP_REGION}"
echo ""
echo "Next Steps:"
echo "1. Create database user: ./setup-database.sh"
echo "2. Build & push Docker images:"
echo "   - bash build-preprod-backend.sh"
echo "   - bash build-preprod-frontend.sh"
echo "3. Deploy to Cloud Run:"
echo "   - bash deploy-preprod-backend.sh"
echo "   - bash deploy-preprod-frontend.sh"
echo ""
echo "════════════════════════════════════════════════════════════"
echo ""
