#!/bin/bash
# Run consolidated buses/locations upload to PRODUCTION with duplicate detection
# ⚠️  CAUTION: This script works with PRODUCTION database!

set -e

cd /Users/mchand69/Documents/perundhu

echo ""
echo "==========================================="
echo "⚠️  PRODUCTION DATABASE UPLOAD"
echo "==========================================="
echo ""

# Confirm production operation
read -p "Are you sure you want to upload to PRODUCTION? (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
    echo "❌ Aborted."
    exit 1
fi

# Get credentials from Secret Manager (production project)
echo "🔐 Retrieving credentials from Secret Manager..."
PROJECT_ID="perundhu-prod-001"

# Production secrets (adjust names as needed)
DB_USER=$(gcloud secrets versions access latest --secret="production-db-username" --project=$PROJECT_ID 2>/dev/null || echo "prod_user")
DB_PASS=$(gcloud secrets versions access latest --secret="production-db-password" --project=$PROJECT_ID 2>/dev/null)

if [ -z "$DB_PASS" ]; then
    echo "❌ Could not retrieve production database password from Secret Manager"
    echo "   Ensure secret 'production-db-password' exists in project $PROJECT_ID"
    exit 1
fi

# Check if Cloud SQL proxy is running on port 3308 (use different port for prod)
PROD_PORT=3308
if ! lsof -i :$PROD_PORT 2>/dev/null | grep -q LISTEN; then
    echo "❌ Cloud SQL Proxy is not running on port $PROD_PORT"
    echo ""
    echo "Start it with:"
    echo "  ./cloud_sql_proxy -instances=$PROJECT_ID:asia-south1:perundhu-prod-mysql=tcp:$PROD_PORT &"
    echo ""
    exit 1
fi

echo "✅ Cloud SQL Proxy is running on port $PROD_PORT"

# Export environment variables
export DB_USERNAME="$DB_USER"
export DB_PASSWORD="$DB_PASS"
export DB_HOST_PROD="127.0.0.1"
export DB_PORT_PROD="$PROD_PORT"

# Activate virtual environment
source .venv/bin/activate

# Create logs directory if needed
mkdir -p logs

# Clear log file
LOG_FILE="logs/production_upload_$(date +%Y%m%d_%H%M%S).log"

echo ""
echo "🚀 Starting PRODUCTION upload..."
echo "📋 Log: $LOG_FILE"
echo ""

# Default: full mode (locations + buses)
MODE="${1:-full}"

python scripts/unified_data_loader.py \
  --mode $MODE \
  --environment prod \
  --locations data/tamil_nadu_locations_enhanced.json \
  --buses data/consolidated_buses.json \
  --batch-size 500 \
  2>&1 | tee "$LOG_FILE"

echo ""
echo "✅ Upload completed! Check log: $LOG_FILE"
echo ""
echo "Verify with:"
echo "  mysql -h 127.0.0.1 -P $PROD_PORT -u $DB_USER -p perundhu -e 'SELECT COUNT(*) FROM buses; SELECT COUNT(*) FROM locations;'"
