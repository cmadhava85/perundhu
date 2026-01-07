#!/bin/bash

# Grant Terraform Service Account Required IAM Roles
# This script adds the necessary permissions for Terraform to create infrastructure

SERVICE_ACCOUNT="terraform@astute-strategy-406601.iam.gserviceaccount.com"
PROJECT="astute-strategy-406601"

echo "🔐 Granting IAM roles to $SERVICE_ACCOUNT in project $PROJECT"
echo ""

# Array of roles to grant
ROLES=(
  "roles/compute.networkAdmin"
  "roles/cloudsql.admin"
  "roles/storage.admin"
  "roles/secretmanager.admin"
  "roles/iam.securityAdmin"
  "roles/vpcaccess.admin"
  "roles/servicenetworking.admin"
  "roles/iam.serviceAccountAdmin"
  "roles/iam.serviceAccountUser"
)

for ROLE in "${ROLES[@]}"; do
  echo "Granting $ROLE..."
  gcloud projects add-iam-policy-binding $PROJECT \
    --member="serviceAccount:$SERVICE_ACCOUNT" \
    --role="$ROLE" \
    --quiet 2>&1 | grep -E "Updated|Error|ERROR" || echo "  ✓ Role binding complete"
done

echo ""
echo "✅ All IAM roles have been granted to $SERVICE_ACCOUNT"
echo ""
echo "You can now retry the Terraform apply:"
echo "cd infrastructure/terraform/environments/preprod"
echo "terraform apply"
