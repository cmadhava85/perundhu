#!/bin/bash
# Preprod database cleanup script
# Removes all locations that don't have any bus routes

cd "$(dirname "$0")"

echo "========================================="
echo "Preprod Location Cleanup"
echo "========================================="
echo ""
echo "This script will:"
echo "1. Connect to preprod database"
echo "2. Find locations with no bus routes"
echo "3. Delete unused locations"
echo ""

# Kill any existing Cloud SQL Proxy for preprod
echo "Stopping any existing Cloud SQL Proxy..."
pkill -f "cloud-sql-proxy.*astute-strategy-406601"
sleep 2

# Start Cloud SQL Proxy for preprod
echo "Starting Cloud SQL Proxy for preprod..."
cloud-sql-proxy astute-strategy-406601:us-central1:perundhu-preprod-mysql-us --port 3307 &
PROXY_PID=$!
sleep 5

# Activate virtual environment
source venv/bin/activate

# Run cleanup
python3 cleanup_unused_locations.py --env preprod --confirm

# Stop proxy
echo ""
echo "Stopping Cloud SQL Proxy..."
kill $PROXY_PID

echo ""
echo "Cleanup complete!"
echo "Check the output above for results"
