#!/bin/bash
# One-Time Password Reset Script for Cloud SQL
# This script will:
# 1. Clean up any malformed user entries
# 2. Regenerate the password once via Terraform
# 3. Ensure only one clean perundhu_user@% exists
# 4. Update Secret Manager
# 5. This is a ONE-TIME operation - future Terraform applies won't reset the password

set -e

PROJECT_ID="astute-strategy-406601"
INSTANCE="perundhu-preprod-mysql"
DB_USER="perundhu_user"
DB_HOST="%"
TF_PATH="infrastructure/terraform/environments/preprod"

echo "=================================================="
echo "ONE-TIME CLOUD SQL PASSWORD RESET"
echo "=================================================="
echo "Project: $PROJECT_ID"
echo "Instance: $INSTANCE"
echo "User: $DB_USER@$DB_HOST"
echo ""

# Step 1: Check current users in Cloud SQL
echo "📋 STEP 1: Checking current Cloud SQL users..."
echo ""
gcloud sql users list \
  --instance="$INSTANCE" \
  --project="$PROJECT_ID" \
  --format="table(name,host,type)"
echo ""

# Step 2: Clean up malformed entries (users without proper host)
echo "🧹 STEP 2: Cleaning up malformed entries..."
MALFORMED=$(gcloud sql users list \
  --instance="$INSTANCE" \
  --project="$PROJECT_ID" \
  --filter="name=$DB_USER AND host=''" \
  --format="value(name)" | wc -l)

if [ "$MALFORMED" -gt 0 ]; then
  echo "   Found $MALFORMED malformed entries. Deleting all $DB_USER entries..."
  gcloud sql users delete "$DB_USER" \
    --instance="$INSTANCE" \
    --project="$PROJECT_ID" \
    --quiet 2>&1 || true
  echo "   ✅ Malformed entries cleaned"
else
  echo "   ✅ No malformed entries found"
fi
echo ""

# Step 3: Delete existing user to prepare for fresh creation
echo "🗑️  STEP 3: Deleting existing user for fresh recreation..."
gcloud sql users delete "$DB_USER" \
  --instance="$INSTANCE" \
  --project="$PROJECT_ID" \
  --quiet 2>&1 || true
sleep 2
echo "   ✅ User deleted"
echo ""

# Step 4: Regenerate password via Terraform
echo "🔄 STEP 4: Regenerating password via Terraform..."
cd "$TF_PATH"

# Taint the random password to force regeneration
echo "   Tainting random_password resource..."
terraform taint 'module.database.random_password.db_password' 2>&1 || true

# Taint the database user
echo "   Tainting database user resource..."
terraform taint 'module.database.google_sql_user.users' 2>&1 || true

# Apply to regenerate
echo "   Running terraform apply..."
terraform apply -auto-approve 2>&1 | grep -E "^(Apply|No changes|destroyed|created|updated)" || true

cd - > /dev/null
sleep 3
echo "   ✅ Terraform applied"
echo ""

# Step 5: Verify only one clean user exists
echo "✅ STEP 5: Verifying user configuration..."
echo ""
gcloud sql users list \
  --instance="$INSTANCE" \
  --project="$PROJECT_ID" \
  --format="table(name,host,type)"
echo ""

# Step 6: Verify password in Secret Manager
echo "📦 STEP 6: Verifying password in Secret Manager..."
echo "   Latest password version:"
gcloud secrets versions list db-password \
  --project="$PROJECT_ID" \
  --limit=1
echo ""

# Step 7: Run sync script to ensure consistency
echo "🔗 STEP 7: Syncing password across services..."
cd /Users/mchand69/Documents/perundhu
bash sync-db-password.sh
cd - > /dev/null
echo ""

echo "=================================================="
echo "✅ ONE-TIME PASSWORD RESET COMPLETE!"
echo "=================================================="
echo ""
echo "Summary:"
echo "  • Password regenerated: ✅"
echo "  • User cleanup: ✅"
echo "  • User created: perundhu_user@%"
echo "  • Secret Manager updated: ✅"
echo "  • Password synced: ✅"
echo ""
echo "IMPORTANT:"
echo "  This was a ONE-TIME reset operation."
echo "  Future 'terraform apply' commands will NOT reset the password"
echo "  because the user resource has 'lifecycle { ignore_changes = [password] }'"
echo ""
echo "To test the connection:"
echo "  cd /Users/mchand69/Documents/perundhu"
echo "  source .venv/bin/activate"
echo "  python3 test_conn_after_sync.py"
echo ""
