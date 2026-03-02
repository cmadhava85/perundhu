#!/bin/bash
# Production Data Upload - Using unified_data_loader with optimized batch sizes
set -e

echo "============================================================"
echo "PRODUCTION DATA UPLOAD (Batch Optimized)"
echo "============================================================"
echo ""

# START Cloud SQL Proxy
echo "🔌 Starting Cloud SQL Proxy..."
pkill -f "cloud-sql-proxy.*3307" 2>/dev/null || true
sleep 1
/opt/homebrew/bin/cloud-sql-proxy "perundhu-prod-001:us-central1:perundhu-production-mysql-us" \
    --port 3307 > /tmp/proxy-prod.log 2>&1 &
sleep 5
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

# Step 1: Upload Locations ONLY (small batches)
echo "📍 STEP 1/2: Uploading Locations..."
python3 scripts/unified_data_loader.py \
    --mode locations \
    --environment prod \
    --data-file data/tamil_nadu_locations_enhanced.json \
    --batch-size 250 \
    --enable-translation

echo ""
echo "✅ Locations uploaded"
echo ""

# Step 2: Upload Buses (small batches)  
echo "🚌 STEP 2/2: Uploading Buses and Stops..."
python3 scripts/unified_data_loader.py \
    --mode buses \
    --environment prod \
    --data-file data/consolidated_buses.json \
    --operator TNSTC \
    --batch-size 50 \
    --enable-translation

echo ""
echo "============================================================"
echo "🎉 PRODUCTION DATA UPLOAD COMPLETE!"
echo "============================================================"
