#!/bin/bash
# Fix Terraform state for existing GCP resources
# This script imports existing resources into Terraform state

set -e

PROJECT_ID="astute-strategy-406601"
REGION="asia-south1"
ENVIRONMENT="preprod"

echo "🔧 Terraform State Import Script"
echo "================================"
echo "Project: $PROJECT_ID"
echo "Region: $REGION"
echo "Environment: $ENVIRONMENT"
echo ""

# Navigate to Terraform directory
TERRAFORM_DIR="infrastructure/terraform/environments/preprod"
if [ ! -d "$TERRAFORM_DIR" ]; then
  echo "❌ ERROR: $TERRAFORM_DIR not found"
  exit 1
fi

cd "$TERRAFORM_DIR"
echo "✅ Changed to: $TERRAFORM_DIR"
echo ""

# Initialize Terraform
echo "📦 Initializing Terraform..."
terraform init -input=false
echo "✅ Terraform initialized"
echo ""

# Import Cloud Run service
echo "📥 Importing Cloud Run service..."
echo "   Resource: google_cloud_run_service.backend"
echo "   GCP Name: perundhu-preprod-backend"
terraform import -input=false \
  google_cloud_run_service.backend \
  "astute-strategy-406601/asia-south1/perundhu-preprod-backend" \
  || echo "⚠️  Cloud Run import failed (may already exist in state)"
echo ""

# Import secrets - note: Secret Manager uses project/secret_id format
echo "📥 Importing Secrets..."

echo "   Secret: google_secret_manager_secret.db_url → preprod-db-url"
terraform import -input=false \
  google_secret_manager_secret.db_url \
  "projects/$PROJECT_ID/secrets/preprod-db-url" \
  || echo "⚠️  db_url import failed (may already exist)"
echo ""

echo "   Secret: google_secret_manager_secret.db_username → preprod-db-username"
terraform import -input=false \
  google_secret_manager_secret.db_username \
  "projects/$PROJECT_ID/secrets/preprod-db-username" \
  || echo "⚠️  db_username import failed (may already exist)"
echo ""

echo "   Secret: google_secret_manager_secret.db_password → preprod-db-password"
terraform import -input=false \
  google_secret_manager_secret.db_password \
  "projects/$PROJECT_ID/secrets/preprod-db-password" \
  || echo "⚠️  db_password import failed (may already exist)"
echo ""

echo "   Secret: google_secret_manager_secret.jwt_secret → preprod-jwt-secret"
terraform import -input=false \
  google_secret_manager_secret.jwt_secret \
  "projects/$PROJECT_ID/secrets/preprod-jwt-secret" \
  || echo "⚠️  jwt_secret import failed (may already exist)"
echo ""

# Verify state
echo "🔍 Verifying Terraform state..."
echo ""
echo "Resources in state:"
terraform state list 2>/dev/null | grep -E "google_cloud_run|google_secret" || echo "   (No resources found)"
echo ""

# Run plan to check for changes
echo "📋 Running Terraform plan to verify imports..."
terraform plan -no-color \
  -lock=false \
  -var="project_id=$PROJECT_ID" \
  -var="region=$REGION" \
  -var="zone=asia-south1-a" \
  -var="environment=$ENVIRONMENT" \
  -var="app_name=perundhu" \
  -var="db_version=MYSQL_8_0" \
  -var="db_instance_tier=db-f1-micro" \
  -var="db_instance_name_suffix=" \
  -var="notification_email=alerts@perundhu.com" \
  2>&1 | head -50
echo ""

echo "✅ Import script completed!"
echo ""
echo "📌 Next Steps:"
echo "   1. Review the plan output above"
echo "   2. If you see 'No changes', the imports were successful"
echo "   3. Run: terraform apply tfplan"
echo "   4. Push changes if needed: git push"
echo ""
