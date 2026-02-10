#!/bin/bash
# Quick script to run duplicate location cleanup in dry-run mode

echo "🔍 Checking for Cloud SQL Proxy..."
if lsof -i:3307 > /dev/null 2>&1; then
    echo "✅ Cloud SQL Proxy is running on port 3307"
else
    echo "❌ Cloud SQL Proxy not running. Starting it..."
    echo "Run this command first:"
    echo "./cloud_sql_proxy -instances=perundhu-db:asia-south1:perundhu-mysql-instance=tcp:3307 &"
    exit 1
fi

echo ""
echo "🔍 Running duplicate location analysis (DRY RUN)..."
echo ""

cd /Users/mchand69/Documents/perundhu
python3 cleanup_duplicate_locations.py --dry-run
