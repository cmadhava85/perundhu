#!/bin/bash

# Comprehensive API Endpoint Testing Script
# Tests all major endpoints in the Perundhu application

BASE_URL="http://localhost:8080"
ADMIN_AUTH="Basic YWRtaW46YWRtaW4="

# Color codes for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Function to test an endpoint
test_endpoint() {
    local method=$1
    local path=$2
    local expected_status=$3
    local auth_header=$4
    local description=$5
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    if [ -n "$auth_header" ]; then
        response=$(curl -s -w "\n%{http_code}" -X "$method" "$BASE_URL$path" \
            -H "Authorization: $auth_header" \
            -H "Accept: application/json" 2>&1)
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" "$BASE_URL$path" \
            -H "Accept: application/json" 2>&1)
    fi
    
    status_code=$(echo "$response" | tail -n1)
    
    if [ "$status_code" = "$expected_status" ]; then
        echo -e "${GREEN}✓${NC} $description - Status: $status_code"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo -e "${RED}✗${NC} $description - Expected: $expected_status, Got: $status_code"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
}

echo "=========================================="
echo "  Perundhu API Endpoint Testing"
echo "=========================================="
echo ""

# Test 1: Health Check
echo -e "${YELLOW}Testing System Endpoints...${NC}"
test_endpoint "GET" "/actuator/health" "200" "" "Health Check"
echo ""

# Test 2: Public API Endpoints
echo -e "${YELLOW}Testing Public API Endpoints...${NC}"
test_endpoint "GET" "/api/v1/locations/autocomplete?q=Chennai" "200" "" "Location Autocomplete"
test_endpoint "GET" "/api/v1/locations" "200" "" "Get All Locations"
test_endpoint "GET" "/api/v1/bus-schedules/search?fromLocation=Chennai&toLocation=Madurai" "200" "" "Bus Schedule Search"
test_endpoint "GET" "/api/v1/bus-schedules/buses" "200" "" "Get All Buses"
test_endpoint "GET" "/api/v1/bus-schedules/public-stats" "200" "" "Public Stats"
test_endpoint "GET" "/api/v1/translations/languages" "200" "" "Supported Languages"
echo ""

# Test 3: Admin Endpoints - Without Auth (should fail)
echo -e "${YELLOW}Testing Admin Endpoints Security (without auth)...${NC}"
test_endpoint "GET" "/api/admin/contributions/routes" "401" "" "Admin Routes - No Auth"
test_endpoint "GET" "/api/admin/audit-logs" "401" "" "Admin Audit Logs - No Auth"
test_endpoint "GET" "/api/admin/settings" "401" "" "Admin Settings - No Auth"
echo ""

# Test 4: Admin Endpoints - With Auth (should work)
echo -e "${YELLOW}Testing Admin Endpoints (with auth)...${NC}"
test_endpoint "GET" "/api/admin/contributions/routes" "200" "$ADMIN_AUTH" "Admin - Route Contributions"
test_endpoint "GET" "/api/admin/contributions/routes/pending" "200" "$ADMIN_AUTH" "Admin - Pending Routes"
test_endpoint "GET" "/api/admin/contributions/images" "200" "$ADMIN_AUTH" "Admin - Image Contributions"
test_endpoint "GET" "/api/admin/contributions/images/pending" "200" "$ADMIN_AUTH" "Admin - Pending Images"
test_endpoint "GET" "/api/admin/audit-logs" "200" "$ADMIN_AUTH" "Admin - Audit Logs"
test_endpoint "GET" "/api/admin/settings" "200" "$ADMIN_AUTH" "Admin - Settings"
echo -e "${YELLOW}Note: /api/v1/contributions/admin/all requires additional security context (returns 403 from curl)${NC}"
echo ""

# Test 5: Contribution Endpoints (require security context - expect 403 from curl)
echo -e "${YELLOW}Testing Contribution Endpoints (security-protected)...${NC}"
test_endpoint "GET" "/api/v1/contributions/status" "403" "" "Contribution Status (expect 403 - security filters)"
test_endpoint "GET" "/api/v1/contributions/stats" "403" "" "Contribution Stats (expect 403 - security filters)"
echo ""

# Test 6: Route Issues (Admin only)
echo -e "${YELLOW}Testing Route Issue Admin Endpoints...${NC}"
test_endpoint "GET" "/api/v1/route-issues/admin/statistics" "200" "$ADMIN_AUTH" "Route Issue Statistics"
test_endpoint "GET" "/api/v1/route-issues/admin/pending" "200" "$ADMIN_AUTH" "Pending Route Issues"
echo ""

# Summary
echo "=========================================="
echo "  Test Summary"
echo "=========================================="
echo -e "Total Tests:  $TOTAL_TESTS"
echo -e "${GREEN}Passed:       $PASSED_TESTS${NC}"
echo -e "${RED}Failed:       $FAILED_TESTS${NC}"
echo ""

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}All tests passed! ✓${NC}"
    exit 0
else
    echo -e "${RED}Some tests failed. Please review the output above.${NC}"
    exit 1
fi
