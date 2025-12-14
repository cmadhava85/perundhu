#!/bin/bash
# Grant necessary IAM permissions for Terraform to manage GCP resources
# Run this script with a user account that has Owner or IAM Admin role

set -e

# Configuration
PROJECT_ID="${GCP_PROJECT_ID:-astute-strategy-406601}"
TERRAFORM_SA_EMAIL="${TERRAFORM_SA_EMAIL:-}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Terraform IAM Permissions Setup ===${NC}"
echo "Project: $PROJECT_ID"

# Check if logged in
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" &>/dev/null; then
    echo -e "${RED}Error: Not logged into gcloud. Run 'gcloud auth login' first.${NC}"
    exit 1
fi

# Get current user
CURRENT_USER=$(gcloud auth list --filter=status:ACTIVE --format="value(account)")
echo "Running as: $CURRENT_USER"

# If no service account specified, ask user
if [ -z "$TERRAFORM_SA_EMAIL" ]; then
    echo ""
    echo -e "${YELLOW}Available service accounts:${NC}"
    gcloud iam service-accounts list --project="$PROJECT_ID" --format="table(email,displayName)" 2>/dev/null || true
    
    echo ""
    read -p "Enter Terraform service account email (or press Enter to use current user): " TERRAFORM_SA_EMAIL
    
    if [ -z "$TERRAFORM_SA_EMAIL" ]; then
        MEMBER="user:$CURRENT_USER"
        echo "Using current user: $CURRENT_USER"
    else
        MEMBER="serviceAccount:$TERRAFORM_SA_EMAIL"
        echo "Using service account: $TERRAFORM_SA_EMAIL"
    fi
else
    MEMBER="serviceAccount:$TERRAFORM_SA_EMAIL"
fi

echo ""
echo -e "${GREEN}Granting IAM roles...${NC}"

# Define roles needed for Terraform operations
declare -a ROLES=(
    # Logging
    "roles/logging.configWriter"
    "roles/logging.admin"
    
    # Pub/Sub
    "roles/pubsub.admin"
    
    # Compute/VPC
    "roles/compute.networkAdmin"
    "roles/compute.securityAdmin"
    
    # Storage
    "roles/storage.admin"
    
    # Cloud Run
    "roles/run.admin"
    
    # Secret Manager
    "roles/secretmanager.admin"
    
    # IAM (for creating service accounts)
    "roles/iam.serviceAccountAdmin"
    "roles/iam.serviceAccountUser"
    "roles/resourcemanager.projectIamAdmin"
    
    # Cloud SQL
    "roles/cloudsql.admin"
    
    # Monitoring
    "roles/monitoring.admin"
    
    # Service Usage (for enabling APIs)
    "roles/serviceusage.serviceUsageAdmin"
)

# Grant each role
for ROLE in "${ROLES[@]}"; do
    echo -n "  Granting $ROLE... "
    if gcloud projects add-iam-policy-binding "$PROJECT_ID" \
        --member="$MEMBER" \
        --role="$ROLE" \
        --condition=None \
        --quiet 2>/dev/null; then
        echo -e "${GREEN}✓${NC}"
    else
        echo -e "${YELLOW}⚠ (may already exist or insufficient permissions)${NC}"
    fi
done

echo ""
echo -e "${GREEN}=== Enabling Required APIs ===${NC}"

declare -a APIS=(
    "compute.googleapis.com"
    "run.googleapis.com"
    "sqladmin.googleapis.com"
    "secretmanager.googleapis.com"
    "pubsub.googleapis.com"
    "logging.googleapis.com"
    "monitoring.googleapis.com"
    "storage.googleapis.com"
    "iam.googleapis.com"
    "cloudresourcemanager.googleapis.com"
    "serviceusage.googleapis.com"
)

for API in "${APIS[@]}"; do
    echo -n "  Enabling $API... "
    if gcloud services enable "$API" --project="$PROJECT_ID" --quiet 2>/dev/null; then
        echo -e "${GREEN}✓${NC}"
    else
        echo -e "${YELLOW}⚠${NC}"
    fi
done

echo ""
echo -e "${GREEN}=== Setup Complete ===${NC}"
echo ""
echo "You can now run Terraform commands:"
echo "  cd infrastructure/terraform/environments/preprod"
echo "  terraform init"
echo "  terraform plan"
echo "  terraform apply"
echo ""
echo -e "${YELLOW}Note: If using a service account, make sure to:${NC}"
echo "  1. Download the key: gcloud iam service-accounts keys create key.json --iam-account=$TERRAFORM_SA_EMAIL"
echo "  2. Set GOOGLE_APPLICATION_CREDENTIALS=path/to/key.json"
echo "  3. Or use workload identity for CI/CD"
