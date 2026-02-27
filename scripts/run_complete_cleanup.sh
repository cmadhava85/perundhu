#!/bin/bash
# Complete cleanup: Remove unused locations AND duplicates
# This script fixes the duplicate location issue

cd "$(dirname "$0")"

echo "========================================="
echo "Complete Location Cleanup & Deduplication"
echo "========================================="
echo ""
echo "This script will:"
echo "1. Remove all locations with NO bus routes"
echo "2. Remove duplicate names (keep one with most routes)"
echo ""

# Kill any existing processes
pkill -9 -f cleanup_unused_locations.py 2>/dev/null
pkill -9 -f cloud-sql-proxy 2>/dev/null
sleep 2

#============================
# PRODUCTION
#============================
echo "===== PRODUCTION ====="
echo ""

# Start proxy
echo "Starting Cloud SQL Proxy..."
cloud-sql-proxy perundhu-prod-001:us-central1:perundhu-production-mysql-us --port 3307 &
PROXY_PID=$!
sleep 5

# Run cleanup
source venv/bin/activate
python3 cleanup_and_deduplicate.py --env production --confirm

# Stop proxy
kill $PROXY_PID 2>/dev/null
sleep 2

#============================
# PREPROD
#============================
echo ""
echo ""
echo "===== PREPROD ====="
echo ""

# Start proxy
echo "Starting Cloud SQL Proxy..."
cloud-sql-proxy astute-strategy-406601:us-central1:perundhu-preprod-mysql-us --port 3307 &
PROXY_PID=$!
sleep 5

# Run cleanup
python3 cleanup_and_deduplicate.py --env preprod --confirm

# Stop proxy
kill $PROXY_PID 2>/dev/null

echo ""
echo "========================================="
echo "✅ ALL DONE!"
echo "========================================="
echo ""
echo "Results:"
echo "- Removed all locations with no routes"
echo "- Removed all duplicate location names"
echo "- Users will now see unique locations only"
echo ""
