#!/bin/bash
set -e

cd /Users/mchand69/Documents/project/perundhu/scripts

echo "╔════════════════════════════════════════════════════════════════════════════╗"
echo "║         COMPREHENSIVE DUPLICATE CHECK & CLEANUP - PROD & PREPROD          ║"
echo "╚════════════════════════════════════════════════════════════════════════════╝"

# Kill any stuck processes
echo ""
echo "Cleaning up any stuck processes..."
killall -9 python3 2>/dev/null || true
killall -9 cloud-sql-proxy 2>/dev/null || true
sleep 2

#=============================================================================
# STEP 1: CHECK PRODUCTION DUPLICATES
#=============================================================================
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 1: Checking Production Duplicates"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

cloud-sql-proxy perundhu-prod-001:us-central1:perundhu-production-mysql-us --port 3307 > /tmp/proxy_prod.log 2>&1 &
PROD_PROXY_PID=$!
sleep 5

venv/bin/python3 check_all_duplicates.py 2>&1 | grep -A 1000 "PRODUCTION" | grep -B 1000 "PREPROD" || true

kill $PROD_PROXY_PID 2>/dev/null || true
sleep 2

#=============================================================================
# STEP 2: CHECK PREPROD DUPLICATES  
#=============================================================================
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 2: Checking Preprod Duplicates"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

cloud-sql-proxy astute-strategy-406601:us-central1:perundhu-preprod-mysql-us --port 3307 > /tmp/proxy_preprod.log 2>&1 &
PREPROD_PROXY_PID=$!
sleep 5

venv/bin/python3 check_all_duplicates.py 2>&1 | grep -A 1000 "PREPROD" || true

kill $PREPROD_PROXY_PID 2>/dev/null || true
sleep 2

#=============================================================================
# STEP 3: ASK TO PROCEED WITH CLEANUP
#=============================================================================
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 3: Run Cleanup?"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Do you want to run the cleanup to remove all duplicates? (yes/no)"
read -r response

if [ "$response" != "yes" ]; then
    echo "Cleanup cancelled."
    exit 0
fi

#=============================================================================
# STEP 4: CLEANUP PRODUCTION
#=============================================================================
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 4: Cleaning Production"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

cloud-sql-proxy perundhu-prod-001:us-central1:perundhu-production-mysql-us --port 3307 > /tmp/proxy_prod.log 2>&1 &
PROD_PROXY_PID=$!
sleep 5

venv/bin/python3 cleanup_and_deduplicate.py --env production --confirm

kill $PROD_PROXY_PID 2>/dev/null || true
sleep 2

#=============================================================================
# STEP 5: CLEANUP PREPROD
#=============================================================================
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 5: Cleaning Preprod"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

cloud-sql-proxy astute-strategy-406601:us-central1:perundhu-preprod-mysql-us --port 3307 > /tmp/proxy_preprod.log 2>&1 &
PREPROD_PROXY_PID=$!
sleep 5

venv/bin/python3 cleanup_and_deduplicate.py --env preprod --confirm

kill $PREPROD_PROXY_PID 2>/dev/null || true

#=============================================================================
# DONE
#=============================================================================
echo ""
echo "╔════════════════════════════════════════════════════════════════════════════╗"
echo "║                              ✅ ALL DONE!                                  ║"
echo "╚════════════════════════════════════════════════════════════════════════════╝"
echo ""
echo "✅ Production cleaned"
echo "✅ Preprod cleaned"
echo "✅ All duplicates removed from both environments"
echo ""
