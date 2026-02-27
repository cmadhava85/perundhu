#!/bin/bash

echo "╔════════════════════════════════════════════════════╗"
echo "║  PRODUCTION DUPLICATE CLEANUP                      ║"
echo "╚════════════════════════════════════════════════════╝"
echo ""

# Kill any existing proxies
echo "🧹 Cleaning up existing Cloud SQL proxies..."
killall -9 cloud-sql-proxy python3 2>/dev/null
sleep 2

# Start production proxy
echo "🚀 Starting Cloud SQL Proxy for PRODUCTION..."
/opt/homebrew/bin/cloud-sql-proxy perundhu-prod-001:us-central1:perundhu-production-mysql-us --port 3307 > /tmp/proxy-prod.log 2>&1 &
PROXY_PID=$!
sleep 8

# Check if proxy started
if ! ps -p $PROXY_PID > /dev/null; then
    echo "❌ Failed to start Cloud SQL Proxy"
    cat /tmp/proxy-prod.log
    exit 1
fi

echo "✅ Cloud SQL Proxy started (PID: $PROXY_PID)"
echo ""

# Run the cleanup script
cd /Users/mchand69/Documents/project/perundhu/scripts
python3 cleanup_prod_duplicates.py "$@"
RESULT=$?

# Cleanup
echo ""
echo "🧹 Stopping Cloud SQL Proxy..."
kill $PROXY_PID 2>/dev/null

exit $RESULT
