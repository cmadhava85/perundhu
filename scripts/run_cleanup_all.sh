#!/bin/bash
# Combined cleanup script for both production and preprod
# Removes all locations that don't have any bus routes

cd "$(dirname "$0")"

echo "========================================="
echo "Location Cleanup - Production & Preprod"
echo "========================================="
echo ""

# ======================
# PRODUCTION CLEANUP
# ======================
echo ""
echo "===== STEP 1: Production Cleanup ====="
echo ""

# Kill any existing proxies
pkill -f cloud-sql-proxy
sleep 2

# Start Cloud SQL Proxy for production
echo "Starting Cloud SQL Proxy for production..."
cloud-sql-proxy perundhu-prod-001:us-central1:perundhu-production-mysql-us --port 3307 &
PROXY_PID=$!
sleep 5

# Activate virtual environment
source venv/bin/activate

# Run cleanup for production
echo "Running production cleanup..."
python3 cleanup_unused_locations.py --env production --confirm

# Stop proxy
kill $PROXY_PID
sleep 2

# ======================
# PREPROD CLEANUP
# ======================
echo ""
echo ""
echo "===== STEP 2: Preprod Cleanup ====="
echo ""

# Start Cloud SQL Proxy for preprod
echo "Starting Cloud SQL Proxy for preprod..."
cloud-sql-proxy astute-strategy-406601:us-central1:perundhu-preprod-mysql-us --port 3307 &
PROXY_PID=$!
sleep 5

# Run cleanup for preprod
echo "Running preprod cleanup..."
python3 cleanup_unused_locations.py --env preprod --confirm

# Stop proxy
kill $PROXY_PID

# ======================
# SUMMARY
# ======================
echo ""
echo ""
echo "========================================="
echo "All Cleanups Complete!"
echo "========================================="
echo ""
echo "Summary:"
echo "✅ Production database cleaned"
echo "✅ Preprod database cleaned"
echo ""
echo "All locations without bus routes have been removed."
echo "Users will now only see locations that have actual routes."
