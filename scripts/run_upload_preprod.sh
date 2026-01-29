#!/bin/bash
# Run consolidated buses upload to preprod with duplicate detection

set -e

cd /Users/mchand69/Documents/perundhu

# Get credentials from Secret Manager
echo "🔐 Retrieving credentials..."
DB_USER=$(gcloud secrets versions access latest --secret="db-username" 2>/dev/null)
DB_PASS=$(gcloud secrets versions access latest --secret="db-password" 2>/dev/null)

# Check if Cloud SQL proxy is running
if ! lsof -i :3307 2>/dev/null | grep -q LISTEN; then
    echo "❌ Cloud SQL Proxy is not running on port 3307"
    echo "Start it with: ./cloud_sql_proxy -instances=astute-strategy-406601:asia-south1:perundhu-preprod-mysql=tcp:3307 &"
    exit 1
fi

echo "✅ Cloud SQL Proxy is running"

# Export environment variables
export DB_USERNAME="$DB_USER"
export DB_PASSWORD="$DB_PASS"
export DB_HOST_PREPROD="localhost"
export DB_PORT_PREPROD="3307"

# Activate virtual environment
source .venv/bin/activate

# Clear log file
> logs/consolidated_buses_upload_preprod.log

# Run upload
echo "🚀 Starting upload...  "
echo "📋 Log: logs/consolidated_buses_upload_preprod.log"

python scripts/unified_data_loader.py \
  --mode buses \
  --environment preprod \
  --data-file data/consolidated_buses.json \
  --operator MTC \
  >> logs/consolidated_buses_upload_preprod.log 2>&1 &

PID=$!
echo "✅ Upload started - PID: $PID"
echo ""
echo "Monitor with:"
echo "  tail -f logs/consolidated_buses_upload_preprod.log"
echo "  ps aux | grep $PID"
