#!/bin/bash
# Production database cleanup script
# Removes all locations that don't have any bus routes

cd "$(dirname "$0")"

echo "========================================="
echo "Production Location Cleanup"
echo "========================================="
echo ""
echo "This script will:"
echo "1. Connect to production database (RECOVER_YOUR_DATA)"
echo "2. Find locations with no bus routes  "
echo "3. Delete unused locations"
echo ""

# Activate virtual environment
source venv/bin/activate

# Run cleanup
python3 cleanup_unused_locations.py --env production --confirm

echo ""
echo "Cleanup complete!"
echo "Check the output above for results"
