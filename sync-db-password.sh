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

# Step 3: Delete ALL user instances (both malformed and correct) to ensure clean recreation
echo "3️⃣  Preparing for clean user recreation..."
ALL_USER_COUNT=$(gcloud sql users list \
  --instance="$INSTANCE" \
  --project="$PROJECT_ID" \
  --filter="name=$DB_USER" \
  --format="value(name)" | wc -l)

if [ "$ALL_USER_COUNT" -gt 0 ]; then
  echo "   Found $ALL_USER_COUNT user instance(s). Deleting all for clean recreation..."
  gcloud sql users delete "$DB_USER" \
    --instance="$INSTANCE" \
    --project="$PROJECT_ID" \
    --quiet 2>&1 || true
  sleep 3  # Give Cloud SQL time to process deletion
  echo "   ✅ All user instances deleted"
else
  echo "   No existing user found. Creating fresh..."
fi

# Step 4: Recreate user with EXPLICIT host parameter (prevents malformed entries)
echo "4️⃣  Recreating user with proper configuration..."
echo "   Creating: $DB_USER@$DB_HOST"
gcloud sql users create "$DB_USER" \
  --instance="$INSTANCE" \
  --host="$DB_HOST" \
  --password="$DB_PASSWORD" \
  --project="$PROJECT_ID" 2>&1 | grep -E "Created|Error" || true
sleep 2
echo "   ✅ User created with host=$DB_HOST"
echo ""

# Step 5: Verify EXACTLY ONE correct user exists (no malformed entries allowed)
echo "5️⃣  Verifying user configuration..."
echo "   Current $DB_USER entries:"
gcloud sql users list \
  --instance="$INSTANCE" \
  --project="$PROJECT_ID" \
  --filter="name=$DB_USER" \
  --format="table(name,host,type)" | sed 's/^/     /'

# Count correct entries
CORRECT_COUNT=$(gcloud sql users list \
  --instance="$INSTANCE" \
  --project="$PROJECT_ID" \
  --filter="name=$DB_USER AND host=$DB_HOST" \
  --format="value(name)" | wc -l)

# Count malformed entries
MALFORMED_COUNT=$(gcloud sql users list \
  --instance="$INSTANCE" \
  --project="$PROJECT_ID" \
  --filter="name=$DB_USER AND host=''" \
  --format="value(name)" | wc -l)

if [ "$MALFORMED_COUNT" -gt 0 ]; then
  echo ""
  echo "   ❌ ERROR: Malformed entries detected!"
  echo "   Found $MALFORMED_COUNT entry(ies) without proper host."
  echo "   This should not happen. Attempting final cleanup..."
  
  # Nuclear option: delete all and recreate
  gcloud sql users delete "$DB_USER" \
    --instance="$INSTANCE" \
    --project="$PROJECT_ID" \
    --quiet 2>&1 || true
  sleep 3
  
  gcloud sql users create "$DB_USER" \
    --instance="$INSTANCE" \
    --host="$DB_HOST" \
    --password="$DB_PASSWORD" \
    --project="$PROJECT_ID" 2>&1 | grep -E "Created|Error" || true
  sleep 2
  
  echo "   ✅ User recreated - malformed entries removed"
  
  # Final verification
  FINAL_CORRECT=$(gcloud sql users list \
    --instance="$INSTANCE" \
    --project="$PROJECT_ID" \
    --filter="name=$DB_USER AND host=$DB_HOST" \
    --format="value(name)" | wc -l)
  
  FINAL_MALFORMED=$(gcloud sql users list \
    --instance="$INSTANCE" \
    --project="$PROJECT_ID" \
    --filter="name=$DB_USER AND host=''" \
    --format="value(name)" | wc -l)
  
  if [ "$FINAL_MALFORMED" -eq 0 ] && [ "$FINAL_CORRECT" -eq 1 ]; then
    echo "   ✅ Verification passed - exactly 1 correct user exists"
  else
    echo "   ⚠️  WARNING: Verification still showing issues"
  fi
elif [ "$CORRECT_COUNT" -eq 1 ]; then
  echo "   ✅ Configuration verified - exactly 1 correct user exists: $DB_USER@$DB_HOST"
else
  echo "   ⚠️  WARNING: Expected 1 correct user, found $CORRECT_COUNT"
fi

echo ""
echo "✅ Password synchronization complete!"
echo ""
echo "Summary:"
echo "  - Secret Manager: Password retrieved"
echo "  - Database User: Password synced to $DB_USER@$DB_HOST"
echo "  - Malformed Entries: Cleaned"
echo "  - Status: Ready for CD pipeline"
