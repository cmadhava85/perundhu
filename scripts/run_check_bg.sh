#!/bin/bash

# Run duplicate check in background
cd /Users/mchand69/Documents/project/perundhu/scripts

echo "Starting production duplicate check in background..."

# Kill any existing proxy
killall -9 cloud-sql-proxy 2>/dev/null
sleep 2

# Start proxy
/opt/homebrew/bin/cloud-sql-proxy perundhu-prod-001:us-central1:perundhu-production-mysql-us --port 3307 > /tmp/proxy-prod.log 2>&1 &
PROXY_PID=$!
sleep 10

# Run check
python3 quick_check_duplicates.py > /tmp/duplicate_check.log 2>&1
RESULT=$?

# Kill proxy
kill $PROXY_PID 2>/dev/null

echo "Done! Check results:"
echo "  - Summary: /tmp/duplicate_check.log"
echo "  - Details: /Users/mchand69/Documents/project/perundhu/scripts/production_duplicates.txt"

exit $RESULT
