#!/bin/bash
# Production Data Upload - Step by Step with Small Batches
set -e

echo "============================================================"
echo "PRODUCTION DATA UPLOAD (Optimized for large datasets)"
echo "============================================================"
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
fi
echo "✅ Cloud SQL Proxy ready"
echo ""

# Set production database connection
export DB_HOST_PROD="127.0.0.1"
export DB_PORT_PROD="3307"
export DB_USER_PROD=$(gcloud secrets versions access latest --secret=db-username --project=perundhu-prod-001 2>/dev/null)
export DB_PASSWORD_PROD=$(gcloud secrets versions access latest --secret=db-password --project=perundhu-prod-001 2>/dev/null)
export DB_NAME_PROD="perundhu"

# Activate virtual environment
source .venv/bin/activate

# Step 1: Upload LOCATIONS ONLY (with smaller batch size)
echo "📍 STEP 1/2: Uploading Locations..."
echo "   File: tamil_nadu_locations_enhanced.json (41,374 locations)"
echo "   Batch size: 500 (optimized for stability)"
echo ""

python3 scripts/bulk_upload_locations.py \
    --environment prod \
    --file data/tamil_nadu_locations_enhanced.json \
    --batch-size 500 \
    --enable-translation

LOCATIONS_STATUS=$?

if [ $LOCATIONS_STATUS -ne 0 ]; then
    echo "❌ Locations upload failed"
    exit 1
fi

echo ""
echo "✅ STEP 1 COMPLETE: Locations uploaded successfully"
echo ""
echo "============================================================"
echo ""

# Step 2: Upload BUSES (with stops)
echo "🚌 STEP 2/2: Uploading Buses and Stops..."
echo "   File: consolidated_buses.json"
echo "   Operator: TNSTC"
echo "   Batch size: 100 (includes stops)"
echo ""

python3 scripts/bulk_upload_buses.py \
    --environment prod \
    --file data/consolidated_buses.json \
    --operator TNSTC \
    --batch-size 100 \
    --enable-translation

BUSES_STATUS=$?

if [ $BUSES_STATUS -ne 0 ]; then
    echo "❌ Buses upload failed"
    exit 1
fi

echo ""
echo "✅ STEP 2 COMPLETE: Buses and stops uploaded successfully"
echo ""
echo "============================================================"
echo "🎉 PRODUCTION DATA UPLOAD COMPLETE!"
echo "============================================================"
echo ""
echo "Summary:"
echo "  ✅ Locations: Uploaded with Tamil translations"
echo "  ✅ Buses: Uploaded with routes and operators"
echo "  ✅ Stops: Uploaded with timing information"
echo ""
echo "Next steps:"
echo "  1. Verify data: Check database record counts"
echo "  2. Test API: Test autocomplete and search endpoints"
echo "  3. Monitor: Check Cloud Run logs for any issues"
echo ""
