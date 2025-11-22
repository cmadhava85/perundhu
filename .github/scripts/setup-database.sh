#!/bin/bash
# Script to set up Cloud SQL database for Perundhu
# Run this once to create the database infrastructure

set -e

PROJECT_ID="astute-strategy-406601"
REGION="us-central1"
ENVIRONMENT="preprod"
INSTANCE_NAME="perundhu-${ENVIRONMENT}-mysql"
DB_NAME="perundhu"
DB_USER="perundhu_user"

echo "=================================================="
echo "Setting up Cloud SQL for Perundhu - ${ENVIRONMENT}"
echo "=================================================="
echo ""

# Generate a strong password
DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
echo "Generated database password: ${DB_PASSWORD}"
echo ""

echo "Step 1: Creating Cloud SQL instance..."
echo "This will take 5-10 minutes..."
gcloud sql instances create ${INSTANCE_NAME} \
  --database-version=MYSQL_8_0 \
  --tier=db-f1-micro \
  --region=${REGION} \
  --root-password="${DB_PASSWORD}" \
  --backup \
  --backup-start-time=03:00 \
  --maintenance-window-day=SUN \
  --maintenance-window-hour=04 \
  --enable-bin-log \
  --project=${PROJECT_ID} || echo "Instance might already exist"

echo ""
echo "Step 2: Creating database..."
gcloud sql databases create ${DB_NAME} \
  --instance=${INSTANCE_NAME} \
  --project=${PROJECT_ID} || echo "Database might already exist"

echo ""
echo "Step 3: Creating database user..."
gcloud sql users create ${DB_USER} \
  --instance=${INSTANCE_NAME} \
  --password="${DB_PASSWORD}" \
  --project=${PROJECT_ID} || echo "User might already exist"

echo ""
echo "Step 4: Storing password in Secret Manager..."
echo -n "${DB_PASSWORD}" | gcloud secrets create perundhu-${ENVIRONMENT}-db-password \
  --replication-policy=automatic \
  --data-file=- \
  --project=${PROJECT_ID} || \
  echo -n "${DB_PASSWORD}" | gcloud secrets versions add perundhu-${ENVIRONMENT}-db-password \
  --data-file=- \
  --project=${PROJECT_ID}

echo ""
echo "=================================================="
echo "✅ Database setup complete!"
echo "=================================================="
echo ""

CONNECTION_NAME="${PROJECT_ID}:${REGION}:${INSTANCE_NAME}"
DB_URL="jdbc:mysql://google/${DB_NAME}?socketFactory=com.google.cloud.sql.mysql.SocketFactory&cloudSqlInstance=${CONNECTION_NAME}&useSSL=false"

echo "Add these secrets to GitHub:"
echo "Go to: https://github.com/cmadhava85/perundhu/settings/secrets/actions"
echo ""
echo "1️⃣  PREPROD_DB_URL"
echo "${DB_URL}"
echo ""
echo "2️⃣  PREPROD_DB_USER"
echo "${DB_USER}"
echo ""
echo "3️⃣  PREPROD_DB_PASSWORD"
echo "${DB_PASSWORD}"
echo ""
echo "=================================================="
echo ""
echo "⚠️  IMPORTANT: Save the password above securely!"
echo "You can also retrieve it later with:"
echo "  gcloud secrets versions access latest --secret=perundhu-${ENVIRONMENT}-db-password --project=${PROJECT_ID}"
echo ""
