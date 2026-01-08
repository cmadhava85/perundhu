#!/bin/bash
# Fix Terraform state by importing existing GCP resources
# This targets only the resources that are causing conflicts

set -e

PROJECT_ID="astute-strategy-406601"
REGION="asia-south1"
ENVIRONMENT="preprod"

echo "🔧 Terraform State Import - Targeted Fix"
echo "========================================"
echo ""

# Navigate to Terraform directory
cd infrastructure/terraform/environments/preprod

echo "📦 Initializing Terraform..."
terraform init -input=false > /dev/null 2>&1
echo "✅ Done"
echo ""

# Function to import with better error handling
import_resource() {
  local module_path=$1
  local gcp_id=$2
  local description=$3
  
  echo "📥 Importing: $description"
  if terraform import -input=false "$module_path" "$gcp_id" 2>&1 | grep -q "Import prepared"; then
    echo "✅ Success"
  else
    echo "⚠️  Already exists or not found (may be fine)"
  fi
  echo ""
}

echo "🎯 Importing conflicting resources..."
echo ""

# Import Cloud Run service
import_resource \
  "module.cloud_run.google_cloud_run_service.backend" \
  "astute-strategy-406601/asia-south1/perundhu-preprod-backend" \
  "Cloud Run service: perundhu-preprod-backend"

# Import Secrets
import_resource \
  "module.secrets.google_secret_manager_secret.db_url" \
  "projects/$PROJECT_ID/secrets/preprod-db-url" \
  "Secret: preprod-db-url"

import_resource \
  "module.secrets.google_secret_manager_secret.db_username" \
  "projects/$PROJECT_ID/secrets/preprod-db-username" \
  "Secret: preprod-db-username"

import_resource \
  "module.secrets.google_secret_manager_secret.db_password" \
  "projects/$PROJECT_ID/secrets/preprod-db-password" \
  "Secret: preprod-db-password"

import_resource \
  "module.secrets.google_secret_manager_secret.jwt_secret" \
  "projects/$PROJECT_ID/secrets/preprod-jwt-secret" \
  "Secret: preprod-jwt-secret"

import_resource \
  "module.secrets.google_secret_manager_secret.data_encryption_key" \
  "projects/$PROJECT_ID/secrets/preprod-data-encryption-key" \
  "Secret: preprod-data-encryption-key"

echo ""
echo "🔍 Checking state after imports..."
terraform state list | grep -E "cloud_run|secret_manager|secret\." | head -20
echo ""

echo "✅ Import complete!"
echo ""
echo "📋 Running plan to verify..."
terraform plan -no-color \
  -var="project_id=$PROJECT_ID" \
  -var="region=$REGION" \
  -var="zone=asia-south1-a" \
  -var="environment=$ENVIRONMENT" \
  -var="app_name=perundhu" \
  -var="db_version=MYSQL_8_0" \
  -var="db_instance_tier=db-f1-micro" \
  -var="db_instance_name_suffix=" \
  -var="notification_email=alerts@perundhu.com" 2>&1 | tail -15

echo ""
echo "✨ Done! If you see 'No changes', the imports were successful."
echo "   Otherwise, check the plan output above for any issues."
echo ""
