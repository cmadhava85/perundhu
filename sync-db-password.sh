#!/bin/bash
# Script to synchronize database password across Terraform, Secret Manager, and Cloud SQL

set -e

PROJECT_ID="astute-strategy-406601"
INSTANCE="perundhu-preprod-mysql"
DB_USER="perundhu_user"
SECRET_NAME="db-password"

echo "🔄 Synchronizing database password..."
echo "Project: $PROJECT_ID"
echo "Instance: $INSTANCE"
echo "User: $DB_USER"
echo ""

# Step 1: Get password from Secret Manager
echo "1️⃣  Retrieving password from Secret Manager..."
DB_PASSWORD=$(gcloud secrets versions access latest --secret=$SECRET_NAME --project=$PROJECT_ID 2>/dev/null)

if [ -z "$DB_PASSWORD" ]; then
  echo "❌ Failed to retrieve password from Secret Manager"
  exit 1
fi

echo "✅ Retrieved password (${#DB_PASSWORD} characters)"
echo ""

# Step 2: Set database user password
echo "2️⃣  Setting database user password..."
echo "   Command: gcloud sql users set-password $DB_USER --instance=$INSTANCE --password=***"

# Use echo with heredoc to avoid interactive prompts
gcloud sql users set-password "$DB_USER" \
  --instance="$INSTANCE" \
  --password="$DB_PASSWORD" \
  --project="$PROJECT_ID" 2>&1 <<< ""

echo "✅ Database user password updated"
echo ""

# Step 3: Verify the user exists and is configured
echo "3️⃣  Verifying user configuration..."
gcloud sql users list \
  --instance="$INSTANCE" \
  --project="$PROJECT_ID" \
  --filter="name=$DB_USER" \
  --format="table(name,host)"

echo ""
echo "✅ Password synchronization complete!"
echo ""
echo "Summary:"
echo "  - Secret Manager: Password synced"
echo "  - Database User: Password updated"
echo "  - Configuration: Ready for CD pipeline"
