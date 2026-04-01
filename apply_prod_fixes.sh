#!/bin/bash
# Apply data quality fixes to production database
# This script:
# 1. Starts Cloud SQL Proxy
# 2. Applies fixes (interstate cleanup + district standardization)
# 3. Cleans up

set -e

PROJECT="perundhu-prod-001"
REGION="us-central1"
INSTANCE="perundhu-production-mysql-us"
CONNECTION="${PROJECT}:${REGION}:${INSTANCE}"

echo "========================================"
echo "PRODUCTION DATA QUALITY FIX"
echo "========================================"
echo ""
echo "Project: $PROJECT"
echo "Instance: $INSTANCE"
echo ""

# Check if cloud_sql_proxy exists
if [ ! -f "./cloud_sql_proxy" ]; then
    echo "❌ cloud_sql_proxy not found in current directory"
    echo ""
    echo "Download it from:"
    echo "  https://cloud.google.com/sql/docs/mysql/connect-instance-cloud-shell#install-proxy"
    echo ""
    echo "Or run:"
    echo "  curl -o cloud_sql_proxy https://dl.google.com/cloudsql/cloud_sql_proxy.darwin.arm64"
    echo "  chmod +x cloud_sql_proxy"
    exit 1
fi

# Check gcloud authentication
echo "🔐 Checking authentication..."
if ! gcloud auth application-default print-access-token &>/dev/null; then
    echo "⚠️  Not authenticated. Running gcloud auth..."
    gcloud auth application-default login --project "$PROJECT"
fi

# Set active project
echo "Setting active project to $PROJECT..."
gcloud config set project "$PROJECT" --quiet
echo "✅ Authenticated"
echo ""

# Start Cloud SQL Proxy in background
echo "🚀 Starting Cloud SQL Proxy..."
./cloud_sql_proxy -instances="$CONNECTION"=tcp:3307 &
PROXY_PID=$!

# Wait for proxy to be ready
echo "⏳ Waiting for proxy to start..."
sleep 5

# Check if proxy is running
if ! ps -p $PROXY_PID > /dev/null; then
    echo "❌ Cloud SQL Proxy failed to start"
    exit 1
fi
echo "✅ Cloud SQL Proxy running (PID: $PROXY_PID)"
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🧹 Cleaning up..."
    if [ ! -z "$PROXY_PID" ]; then
        echo "⏹️  Stopping Cloud SQL Proxy (PID: $PROXY_PID)..."
        kill $PROXY_PID 2>/dev/null || true
        wait $PROXY_PID 2>/dev/null || true
        echo "✅ Cloud SQL Proxy stopped"
    fi
}

# Set trap to cleanup on exit
trap cleanup EXIT INT TERM

# Run the fixes
echo "========================================"
echo "APPLYING FIXES"
echo "========================================"
echo ""

# First, show preview
echo "📋 Preview of changes:"
echo ""
python3 apply_data_quality_fixes_prod.py

echo ""
echo "========================================"
read -p "Apply these changes to PRODUCTION? (yes/no): " -r REPLY
echo ""

if [[ $REPLY == "yes" ]]; then
    echo "✅ Applying fixes to production..."
    echo ""
    python3 apply_data_quality_fixes_prod.py --execute
    
    echo ""
    echo "========================================"
    echo "✅ PRODUCTION UPDATE COMPLETE"
    echo "========================================"
else
    echo "❌ Aborted - No changes made to production"
fi

# Cleanup will run automatically via trap
