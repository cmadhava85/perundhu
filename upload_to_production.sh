#!/bin/bash
# Production Data Upload Script
# Uploads locations, buses, stops with Tamil translations to production database

set -e

echo "============================================================"
echo "PRODUCTION DATA UPLOAD"
echo "============================================================"
echo ""
echo "This will upload:"
echo "  • Locations: tamil_nadu_locations_enhanced.json (7.8MB)"
echo "  • Buses: consolidated_buses.json (19MB)"  
echo "  • Stops: Included in buses"
echo "  • Tamil translations: Enabled"
echo ""
echo "Target: Production Database (perundhu-prod-001)"
echo ""

# START Cloud SQL Proxy if not running
echo "🔌 Checking Cloud SQL Proxy..."
if ! nc -z 127.0.0.1 3307 2>/dev/null; then
    echo "   Starting Cloud SQL Proxy on port 3307..."
    pkill -f "cloud-sql-proxy.*3307" 2>/dev/null || true
    sleep 1
    /opt/homebrew/bin/cloud-sql-proxy "perundhu-prod-001:us-central1:perundhu-production-mysql-us" \
        --port 3307 > /tmp/proxy-prod-upload.log 2>&1 &
    sleep 5
    if nc -z 127.0.0.1 3307 2>/dev/null; then
        echo "✅ Cloud SQL Proxy started"
    else
        echo "❌ Failed to start Cloud SQL Proxy"
        cat /tmp/proxy-prod-upload.log
        exit 1
    fi
else
    echo "✅ Cloud SQL Proxy already running on port 3307"
fi
echo ""

# Set production database connection via TCP (Cloud SQL Proxy)
echo "🔑 Retrieving credentials from Secret Manager..."
export DB_HOST_PROD="127.0.0.1"
export DB_PORT_PROD="3307"
export DB_USER_PROD=$(gcloud secrets versions access latest --secret=db-username --project=perundhu-prod-001 2>/dev/null)
export DB_PASSWORD_PROD=$(gcloud secrets versions access latest --secret=db-password --project=perundhu-prod-001 2>/dev/null)
export DB_NAME_PROD="perundhu"
echo "✅ Credentials retrieved"
echo ""

# Activate virtual environment
source .venv/bin/activate

# Run bulk upload to production
echo "🚀 Starting data upload..."
python3 scripts/bulk_upload_full.py \
    --environment prod \
    --locations data/tamil_nadu_locations_enhanced.json \
    --buses data/consolidated_buses.json \
    --operator TNSTC \
    --enable-translation

echo ""
echo "============================================================"
echo "✅ Upload script executed"
echo "Check output above for results"
echo "============================================================"
