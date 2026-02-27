#!/bin/bash
# Sync Production Data to Preprod and Clean Duplicates

set -e

echo "╔════════════════════════════════════════════════════════════════════╗"
echo "║         PRODUCTION TO PREPROD DATA SYNC & CLEANUP                  ║"
echo "╚════════════════════════════════════════════════════════════════════╝"

BACKUP_BUCKET="gs://perundhu-db-backups-2026"
BACKUP_FILE="prod_to_preprod_$(date +%Y%m%d_%H%M%S).sql"

# Create backup bucket if it doesn't exist
echo "Ensuring backup bucket exists..."
gsutil mb -p perundhu-prod-001 -l us-central1 "$BACKUP_BUCKET" 2>/dev/null || echo "Bucket already exists"

# Step 1: Export from Production using gcloud
echo ""
echo "===== STEP 1: Export Production Database ====="
echo "Using gcloud SQL export (reliable, no auth issues)..."

gcloud sql export sql perundhu-production-mysql-us \
  "$BACKUP_BUCKET/$BACKUP_FILE" \
  --database=RECOVER_YOUR_DATA \
  --project=perundhu-prod-001

echo "✅ Production database exported to GCS: $BACKUP_BUCKET/$BACKUP_FILE"

# Step 2: Import to Preprod using gcloud
echo ""
echo "===== STEP 2: Import to Preprod Database ====="
echo "Importing data to preprod using gcloud SQL import..."

# First, drop and recreate database
pkill -f "cloud-sql-proxy" 2>/dev/null || true
sleep 2

echo "Starting Cloud SQL Proxy for preprod..."
cloud-sql-proxy astute-strategy-406601:us-central1:perundhu-preprod-mysql-us --port 3307 --quiet &
PREPROD_PROXY_PID=$!
echo "Preprod proxy started (PID: $PREPROD_PROXY_PID)"
sleep 5

echo "Getting preprod database password..."
PREPROD_PASSWORD=$(gcloud secrets versions access latest --secret=db-password --project=astute-strategy-406601)

echo "Preparing preprod database..."
python3 -c "
import mysql.connector
conn = mysql.connector.connect(
    host='127.0.0.1', 
    port=3307, 
    user='perundhu_user', 
    password='$PREPROD_PASSWORD'
)
cursor = conn.cursor()
cursor.execute('DROP DATABASE IF EXISTS perundhu')
cursor.execute('CREATE DATABASE perundhu CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci')
cursor.execute('DROP DATABASE IF EXISTS RECOVER_YOUR_DATA')
cursor.execute('CREATE DATABASE RECOVER_YOUR_DATA CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci')
conn.commit()
cursor.close()
conn.close()
print('✅ Databases prepared')
"

# Import using gcloud (imports to RECOVER_YOUR_DATA)
echo "Importing data from GCS..."
gcloud sql import sql perundhu-preprod-mysql-us \
  "$BACKUP_BUCKET/$BACKUP_FILE" \
  --database=RECOVER_YOUR_DATA \
  --project=astute-strategy-406601

# Copy from RECOVER_YOUR_DATA to perundhu
echo "Copying data to perundhu database..."
python3 -c "
import mysql.connector
conn = mysql.connector.connect(
    host='127.0.0.1', 
    port=3307, 
    user='perundhu_user', 
    password='$PREPROD_PASSWORD',
    database='RECOVER_YOUR_DATA'
)
cursor = conn.cursor()

# Get all tables
cursor.execute('SHOW TABLES')
tables = [t[0] for t in cursor.fetchall()]

print(f'Copying {len(tables)} tables to perundhu database...')

for table in tables:
    cursor.execute(f'CREATE TABLE perundhu.{table} LIKE RECOVER_YOUR_DATA.{table}')
    cursor.execute(f'INSERT INTO perundhu.{table} SELECT * FROM RECOVER_YOUR_DATA.{table}')
    print(f'  ✓ {table}')

cursor.execute('DROP DATABASE RECOVER_YOUR_DATA')
conn.commit()
cursor.close()
conn.close()
print('✅ All tables copied')
"

echo "✅ Data imported to preprod"

# Step 3: Clean up duplicates in preprod
echo ""
echo "===== STEP 3: Remove Duplicates in Preprod ====="
echo "Running deduplication script..."
python3 deduplicate_locations.py --env preprod --confirm

echo "✅ Preprod duplicates removed"

# Step 4: Clean up unused locations in preprod
echo ""
echo "===== STEP 4: Remove Unused Locations in Preprod ====="
echo "Running cleanup script..."
python3 cleanup_unused_locations.py --env preprod --confirm

echo "✅ Preprod unused locations removed"

# Step 5: Add Tamil translations
echo ""
echo "===== STEP 5: Add Tamil Translations to Preprod ====="
echo "Running Tamil translation script..."
export GOOGLE_CLOUD_PROJECT=astute-strategy-406601
python3 populate_tamil_translations_hybrid.py --env preprod --confirm 2>&1 | head -200

echo "✅ Tamil translations added to preprod"

# Cleanup
kill $PREPROD_PROXY_PID 2>/dev/null || true
echo ""
echo "Cleaning up GCS backup file..."
gsutil rm "$BACKUP_BUCKET/$BACKUP_FILE" || echo "⚠️  Failed to delete backup (kept for safety)"

echo ""
echo "╔════════════════════════════════════════════════════════════════════╗"
echo "║                    SYNC COMPLETE!                                   ║"
echo "╚════════════════════════════════════════════════════════════════════╝"
echo ""
echo "Summary:"
echo "  ✅ Production data exported"
echo "  ✅ Data imported to preprod"
echo "  ✅ Duplicates removed"
echo "  ✅ Unused locations cleaned"
echo "  ✅ Tamil translations added"
echo ""
echo "Preprod is now in sync with production (cleaned)"
