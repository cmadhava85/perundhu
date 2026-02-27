#!/bin/bash
# Quick cleanup script - runs the deduplication

cd /Users/mchand69/Documents/project/perundhu/scripts

# Kill stuck processes
killall -9 python3 2>/dev/null
killall -9 cloud-sql-proxy 2>/dev/null
sleep 2

echo "Starting complete cleanup..."

# Start proxy
cloud-sql-proxy perundhu-prod-001:us-central1:perundhu-production-mysql-us --port 3307 > /tmp/proxy.log 2>&1 &
PROXY_PID=$!
echo "Proxy started (PID: $PROXY_PID)"
sleep 5

# Run cleanup
venv/bin/python3 cleanup_and_deduplicate.py --env production --confirm | tee /tmp/cleanup_results.log

# Kill proxy
kill $PROXY_PID 2>/dev/null

echo ""
echo "===== RESULTS ====="
cat /tmp/cleanup_results.log | tail -20
