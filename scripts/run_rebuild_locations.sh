#!/bin/bash

echo "╔════════════════════════════════════════════════════╗"
echo "║  REBUILD PRODUCTION LOCATIONS FROM ACTUAL DATA     ║"
echo "╚════════════════════════════════════════════════════╝"
echo ""

# Kill any existing proxies
echo "🧹 Cleaning up existing Cloud SQL proxies..."
killall -9 cloud-sql-proxy 2>/dev/null
sleep 2

# Start production proxy
echo "🚀 Starting Cloud SQL Proxy for PRODUCTION..."
/opt/homebrew/bin/cloud-sql-proxy perundhu-prod-001:us-central1:perundhu-production-mysql-us --port 3307 > /tmp/proxy-prod.log 2>&1 &
PROXY_PID=$!
sleep 10

# Check if proxy started
if ! ps -p $PROXY_PID > /dev/null; then
    echo "❌ Failed to start Cloud SQL Proxy"
    cat /tmp/proxy-prod.log
    exit 1
fi

echo "✅ Cloud SQL Proxy started (PID: $PROXY_PID)"
echo ""

# Run the rebuild script
cd /Users/mchand69/Documents/project/perundhu/scripts
python3 rebuild_locations_from_data.py --confirm 2>&1 | tee rebuild_locations.log
RESULT=$?

# Cleanup
echo ""
echo "🧹 Stopping Cloud SQL Proxy..."
kill $PROXY_PID 2>/dev/null

if [ $RESULT -eq 0 ]; then
    echo ""
    echo "✅ SUCCESS! Locations rebuilt from actual data."
    echo "   Log saved to: rebuild_locations.log"
else
    echo ""
    echo "❌ FAILED! Check rebuild_locations.log for details."
fi

exit $RESULT
