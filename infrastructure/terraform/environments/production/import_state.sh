#!/usr/bin/env bash
# ============================================================
# Production Terraform State Import Script
# Run this from: infrastructure/terraform/environments/production/
# Purpose: Rebuild the missing terraform.tfstate by importing
#          all existing GCP resources into Terraform state.
# ============================================================
set -e

PROJECT="perundhu-prod-001"
REGION="us-central1"
APP="perundhu"
ENV="production"

echo "=== Discovering resource IDs from GCP ==="

# --- Cloud SQL ---
DB_INSTANCE=$(gcloud sql instances list --project=$PROJECT --format="value(name)" --filter="name~production" 2>/dev/null | head -1)
echo "DB Instance: $DB_INSTANCE"

# --- Storage Bucket ---
BUCKET=$(gcloud storage buckets list --project=$PROJECT --format="value(name)" 2>/dev/null | grep "$APP-$ENV" | head -1)
echo "Bucket: $BUCKET"

# --- Service Accounts ---
BACKEND_SA=$(gcloud iam service-accounts list --project=$PROJECT --filter="email~$APP-$ENV-backend" --format="value(email)" 2>/dev/null | head -1)
CLOUDBUILD_SA=$(gcloud iam service-accounts list --project=$PROJECT --filter="email~$APP-$ENV-build" --format="value(email)" 2>/dev/null | head -1)
echo "Backend SA: $BACKEND_SA"
echo "CloudBuild SA: $CLOUDBUILD_SA"

echo ""
echo "=== Starting Terraform imports ==="

# --- Cloud Run Backend ---
echo "[1/12] Importing Cloud Run backend..."
terraform import \
  module.cloud_run.google_cloud_run_service.backend \
  "locations/$REGION/namespaces/$PROJECT/services/$APP-$ENV-backend" || echo "SKIP: cloud_run backend"

# --- Cloud SQL Instance ---
if [ -n "$DB_INSTANCE" ]; then
  echo "[2/12] Importing Cloud SQL instance: $DB_INSTANCE ..."
  terraform import \
    module.database.google_sql_database_instance.mysql_instance \
    "$DB_INSTANCE" || echo "SKIP: db instance"
fi

# --- Storage Bucket (if exists) ---
if [ -n "$BUCKET" ]; then
  echo "[3/12] Importing storage bucket: $BUCKET ..."
  terraform import \
    module.storage.google_storage_bucket.images_bucket \
    "$BUCKET" || echo "SKIP: storage bucket"
fi

# --- Service Accounts ---
if [ -n "$BACKEND_SA" ]; then
  echo "[4/12] Importing backend service account..."
  terraform import \
    module.iam.google_service_account.backend_service_account \
    "projects/$PROJECT/serviceAccounts/$BACKEND_SA" || echo "SKIP: backend SA"
fi

if [ -n "$CLOUDBUILD_SA" ]; then
  echo "[5/12] Importing cloudbuild service account..."
  terraform import \
    module.iam.google_service_account.cloudbuild_service_account \
    "projects/$PROJECT/serviceAccounts/$CLOUDBUILD_SA" || echo "SKIP: cloudbuild SA"
fi

# --- VPC Network ---
echo "[6/12] Importing VPC network..."
terraform import \
  module.vpc.google_compute_network.vpc_network \
  "projects/$PROJECT/global/networks/$APP-$ENV-vpc" || echo "SKIP: vpc"

# --- Subnets ---
echo "[7/12] Importing public subnet..."
terraform import \
  module.vpc.google_compute_subnetwork.public_subnet \
  "projects/$PROJECT/regions/$REGION/subnetworks/$APP-$ENV-public-subnet" || echo "SKIP: public subnet"

echo "[8/12] Importing private subnet..."
terraform import \
  module.vpc.google_compute_subnetwork.private_subnet \
  "projects/$PROJECT/regions/$REGION/subnetworks/$APP-$ENV-private-subnet" || echo "SKIP: private subnet"

# --- Cloud Router ---
echo "[9/12] Importing Cloud Router..."
terraform import \
  module.vpc.google_compute_router.router \
  "projects/$PROJECT/regions/$REGION/routers/$APP-$ENV-router" || echo "SKIP: router"

# --- Firewall Rules ---
echo "[10/12] Importing firewall rules..."
terraform import \
  'module.vpc.google_compute_firewall.rules["allow-http-https"]' \
  "projects/$PROJECT/global/firewalls/$APP-$ENV-allow-http-https" || echo "SKIP: fw http-https"

terraform import \
  'module.vpc.google_compute_firewall.rules["allow-ssh"]' \
  "projects/$PROJECT/global/firewalls/$APP-$ENV-allow-ssh" || echo "SKIP: fw ssh"

terraform import \
  'module.vpc.google_compute_firewall.rules["allow-internal"]' \
  "projects/$PROJECT/global/firewalls/$APP-$ENV-allow-internal" || echo "SKIP: fw internal"

# --- Private IP Address ---
echo "[11/12] Importing private IP address..."
terraform import \
  module.vpc.google_compute_global_address.private_ip_address \
  "projects/$PROJECT/global/addresses/$APP-$ENV-private-ip-address" || echo "SKIP: private ip"

# --- Custom IAM Role ---
echo "[12/12] Importing custom IAM role..."
terraform import \
  'module.iam.google_project_iam_custom_role.app_role[0]' \
  "projects/$PROJECT/roles/${APP}_${ENV}_app_role" || echo "SKIP: custom role"

echo ""
echo "=== Import complete. Run 'terraform plan' to validate state ==="
