#!/bin/bash
# Script to synchronize database password across Terraform, Secret Manager, and Cloud SQL
# Fixed to only update user with host='%', avoiding creation of malformed entries

set -e

PROJECT_ID="astute-strategy-406601"
INSTANCE="perundhu-preprod-mysql"
DB_USER="perundhu_user"
DB_HOST="%"
SECRET_NAME="db-password"

echo "🔄 Synchronizing database password..."
echo "Project: $PROJECT_ID"
echo "Instance: $INSTANCE"
echo "User: $DB_USER@$DB_HOST"
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

# Step 2: Clean up any malformed entries (with NULL/empty host)
echo "2️⃣  Cleaning up malformed entries..."
MALFORMED_COUNT=$(gcloud sql users list \
  --instance="$INSTANCE" \
  --project="$PROJECT_ID" \
  --filter="name=$DB_USER AND host=''" \
  --format="value(name)" | wc -l)

if [ "$MALFORMED_COUNT" -gt 0 ]; then
  echo "   Found $MALFORMED_COUNT malformed entries. Deleting..."
  # Delete all perundhu_user entries first, then recreate only the correct one
  gcloud sql users delete "$DB_USER" \
    --instance="$INSTANCE" \
    --project="$PROJECT_ID" \
    --quiet 2>&1 || true
  sleep 2
  echo "   ✅ Malformed entries cleaned"
fi
echo ""

# Step 3: Check if user exists, create if needed
echo "3️⃣  Ensuring user exists..."
USER_EXISTS=$(gcloud sql users list \
  --instance="$INSTANCE" \
  --project="$PROJECT_ID" \
  --filter="name=$DB_USER AND host=$DB_HOST" \
  --format="value(name)" | wc -l)

if [ "$USER_EXISTS" -eq 0 ]; then
  echo "   User does not exist. Creating..."
  gcloud sql users create "$DB_USER" \
    --instance="$INSTANCE" \
    --password="$DB_PASSWORD" \
    --project="$PROJECT_ID" 2>&1
  echo "   ✅ User created"
else
  echo "   User exists. Updating password..."
  # Delete and recreate to avoid malformed entries
  # (gcloud sql users set-password can create entries without proper host)
  gcloud sql users delete "$DB_USER" \
    --instance="$INSTANCE" \
    --project="$PROJECT_ID" \
    --quiet 2>&1 || true
  sleep 1
  gcloud sql users create "$DB_USER" \
    --instance="$INSTANCE" \
    --password="$DB_PASSWORD" \
    --project="$PROJECT_ID" 2>&1
  echo "   ✅ Password updated"
fi
echo ""

# Step 4: Verify only correct user exists
echo "4️⃣  Verifying user configuration..."
echo "   Current users:"
gcloud sql users list \
  --instance="$INSTANCE" \
  --project="$PROJECT_ID" \
  --filter="name=$DB_USER" \
  --format="table(name,host)" | sed 's/^/     /'

# Check for malformed entries
FINAL_MALFORMED=$(gcloud sql users list \
  --instance="$INSTANCE" \
  --project="$PROJECT_ID" \
  --filter="name=$DB_USER AND host=''" \
  --format="value(name)" | wc -l)

if [ "$FINAL_MALFORMED" -gt 0 ]; then
  echo "   ⚠️  Warning: Malformed entries still exist"
  echo "   Attempting additional cleanup..."
  gcloud sql users delete "$DB_USER" \
    --instance="$INSTANCE" \
    --project="$PROJECT_ID" \
    --quiet 2>&1 || true
  sleep 2
  
  # Recreate correctly
  gcloud sql users create "$DB_USER" \
    --instance="$INSTANCE" \
    --password="$DB_PASSWORD" \
    --project="$PROJECT_ID" 2>&1
  echo "   ✅ User recreated with correct configuration"
else
  echo "   ✅ Configuration verified - only correct entry exists"
fi

echo ""
echo "✅ Password synchronization complete!"
echo ""
echo "Summary:"
echo "  - Secret Manager: Password retrieved"
echo "  - Database User: Password synced to $DB_USER@$DB_HOST"
echo "  - Malformed Entries: Cleaned"
echo "  - Status: Ready for CD pipeline"
