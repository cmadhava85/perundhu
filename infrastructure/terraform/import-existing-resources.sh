#!/bin/bash

# Script to import existing GCP resources into Terraform
# This allows us to manage existing infrastructure as code without recreating it

set -e

PROJECT_ID="astute-strategy-406601"
REGION="asia-south1"
DB_REGION="us-central1"
ENVIRONMENT="preprod"

echo "=========================================="
echo "Importing Existing GCP Resources into Terraform"
echo "=========================================="
echo ""
echo "Project: $PROJECT_ID"
echo "Environment: $ENVIRONMENT"
echo ""

# Change to the preprod environment directory
cd "$(dirname "$0")/environments/preprod"

# Initialize Terraform if not already done
echo "Initializing Terraform..."
terraform init

echo ""
echo "=========================================="
echo "Step 1: Import Cloud SQL Instance"
echo "=========================================="
echo ""

# Import Cloud SQL instance
SQL_INSTANCE="perundhu-preprod-mysql"
echo "Importing Cloud SQL instance: $SQL_INSTANCE"
terraform import 'module.database.google_sql_database_instance.mysql_instance' "$PROJECT_ID/$SQL_INSTANCE" || echo "Already imported or error"

# Import Cloud SQL database
echo "Importing Cloud SQL database: perundhu"
terraform import 'module.database.google_sql_database.database' "$PROJECT_ID/$SQL_INSTANCE/perundhu" || echo "Already imported or error"

# Import Cloud SQL user
echo "Importing Cloud SQL user: perundhu_user"
terraform import 'module.database.google_sql_user.users' "$PROJECT_ID/$SQL_INSTANCE/perundhu_user" || echo "Already imported or error"

echo ""
echo "=========================================="
echo "Step 2: Import Service Accounts"
echo "=========================================="
echo ""

# Import backend service account
SA_BACKEND="perundhu@${PROJECT_ID}.iam.gserviceaccount.com"
echo "Importing backend service account: $SA_BACKEND"
terraform import 'module.iam.google_service_account.backend' "projects/$PROJECT_ID/serviceAccounts/$SA_BACKEND" || echo "Already imported or error"

echo ""
echo "=========================================="
echo "Step 3: Import Secrets"
echo "=========================================="
echo ""

# Import secrets
echo "Importing secret: preprod-db-password"
terraform import 'module.secrets.google_secret_manager_secret.db_password' "projects/$PROJECT_ID/secrets/preprod-db-password" || echo "Already imported or error"

echo "Importing secret: preprod-jwt-secret"
terraform import 'module.secrets.google_secret_manager_secret.jwt_secret' "projects/$PROJECT_ID/secrets/preprod-jwt-secret" || echo "Already imported or error"

echo ""
echo "=========================================="
echo "Step 4: Import Cloud Run Services"
echo "=========================================="
echo ""

# Import Cloud Run backend service
echo "Importing Cloud Run backend service: perundhu-backend-preprod"
terraform import 'module.cloud_run.google_cloud_run_service.backend' "locations/$REGION/namespaces/$PROJECT_ID/services/perundhu-backend-preprod" || echo "Already imported or error"

# Import Cloud Run frontend service (if managed by Terraform)
echo "Importing Cloud Run frontend service: perundhu-frontend-preprod"
terraform import 'module.cloud_run.google_cloud_run_service.frontend' "locations/$REGION/namespaces/$PROJECT_ID/services/perundhu-frontend-preprod" || echo "Already imported or error"

echo ""
echo "=========================================="
echo "Step 5: Verify Import"
echo "=========================================="
echo ""

echo "Running terraform plan to verify imports..."
terraform plan

echo ""
echo "=========================================="
echo "Import Complete!"
echo "=========================================="
echo ""
echo "Next Steps:"
echo "1. Review the terraform plan output above"
echo "2. If there are differences, update your .tf files to match existing resources"
echo "3. Run 'terraform plan' again to ensure no changes are needed"
echo "4. Once plan shows 'No changes', your infrastructure is fully imported!"
echo ""
echo "Note: You may need to adjust some resource attributes in your .tf files"
echo "to exactly match the existing resources to avoid unwanted changes."
echo ""
