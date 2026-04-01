#!/bin/bash
# Quick script to run the production database query for connecting routes test data

echo "================================================================"
echo "  CONNECTING ROUTES - PRODUCTION DATA TEST FINDER"
echo "================================================================"
echo ""
echo "This script will:"
echo "  1. Connect to your production database"
echo "  2. Find actual bus routes that can form connecting routes"
echo "  3. Generate test cases with real data"
echo "  4. Create an executable test script"
echo ""
echo "Prerequisites:"
echo "  ✓ Cloud SQL Proxy running on port 3307"
echo "  ✓ Database credentials available"
echo ""

# Check if Cloud SQL Proxy is running
if ! lsof -i :3307 > /dev/null 2>&1; then
    echo "⚠️  WARNING: Cloud SQL Proxy doesn't appear to be running on port 3307"
    echo ""
    echo "Start it with:"
    echo "  ./cloud_sql_proxy -instances=perundhu-prod-001:us-central1:perundhu-production-db=tcp:3307"
    echo ""
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Exiting..."
        exit 1
    fi
fi

# Check if Python script exists
if [ ! -f "query_prod_connecting_routes_test_data.py" ]; then
    echo "❌ Error: query_prod_connecting_routes_test_data.py not found"
    exit 1
fi

# Run the Python script
echo "Starting data query..."
echo ""

python3 query_prod_connecting_routes_test_data.py

exit_code=$?

echo ""
if [ $exit_code -eq 0 ]; then
    echo "================================================================"
    echo "  ✅ SUCCESS - Test data found and script generated!"
    echo "================================================================"
    echo ""
    if [ -f "test_connecting_routes_actual_data.sh" ]; then
        echo "Next step: Run the generated test script"
        echo "  ./test_connecting_routes_actual_data.sh"
    fi
else
    echo "================================================================"
    echo "  ❌ FAILED - See errors above"
    echo "================================================================"
fi
