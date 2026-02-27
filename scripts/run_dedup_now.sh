#!/bin/bash
set -e

cd /Users/mchand69/Documents/project/perundhu/scripts

echo "Killing stuck processes..."
killall -9 python3 2>/dev/null || true
killall -9 cloud-sql-proxy 2>/dev/null || true
sleep 2

echo "Starting Cloud SQL Proxy..."
cloud-sql-proxy perundhu-prod-001:us-central1:perundhu-production-mysql-us --port 3307 > /tmp/proxy.log 2>&1 &
PROXY_PID=$!
sleep 5

echo "Running cleanup and deduplication..."
venv/bin/python3 cleanup_and_deduplicate.py --env production --confirm

echo ""
echo "Stopping proxy..."
kill $PROXY_PID 2>/dev/null || true

echo ""
echo "✅ Complete!"
