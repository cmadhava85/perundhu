#!/bin/bash

# Comprehensive Backend API Test - Including Admin Endpoints
# Tests all endpoints with proper authentication

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
BACKEND_URL="${BACKEND_URL:-http://localhost:8080}"
API_KEY="perundhu-public-api-key-2024"
USER_AGENT="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36"
ADMIN_USERNAME="${ADMIN_USERNAME:-admin}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-admin123}"

# Test counters
TESTS_PASSED=0
TESTS_FAILED=0
AUTH_BASIC=""

echo "========================================"
echo "  Complete API Test Suite"
echo "========================================"
echo "Target: $BACKEND_URL"
echo ""

# Test helper
test_api() {
    local name="$1"
    local method="$2"
    local endpoint="$3"
    local expected="$4"
    shift 4
    
    echo -n "Testing: $name... "
    
    http_code=$(curl -s -o /dev/null -w "%{http_code}" \
        -X "$method" \
        -H "User-Agent: $USER_AGENT" \
        -H "X-API-Key: $API_KEY" \
        "$@" \
        "$BACKEND_URL$endpoint")
    
    if [ "$http_code" = "$expected" ]; then
        echo -e "${GREEN}✓ PASS${NC} ($http_code)"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}✗ FAIL${NC} (Expected: $expected, Got: $http_code)"
        ((TESTS_FAILED++))
    fi
}

# Test with auth header
test_api_auth() {
    local name="$1"
    local method="$2"
    local endpoint="$3"
    local expected="$4"
    shift 4
    
    echo -n "Testing: $name... "
    
    http_code=$(curl -s -o /dev/null -w "%{http_code}" \
        -X "$method" \
        -H "User-Agent: $USER_AGENT" \
        -H "X-API-Key: $API_KEY" \
        -H "Authorization: Basic $AUTH_BASIC" \
        "$@" \
        "$BACKEND_URL$endpoint")
    
    if [ "$http_code" = "$expected" ]; then
        echo -e "${GREEN}✓ PASS${NC} ($http_code)"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}✗ FAIL${NC} (Expected: $expected, Got: $http_code)"
        ((TESTS_FAILED++))
    fi
}

echo -e "${BLUE}=== 1. Health & Status ===${NC}"
test_api "Health Check" "GET" "/actuator/health" "200"
test_api "Info Endpoint" "GET" "/actuator/info" "200"

echo ""
echo -e "${BLUE}=== 2. Location Endpoints ===${NC}"
test_api "Get All Locations" "GET" "/api/v1/locations" "200"
test_api "Search Locations (Chennai)" "GET" "/api/v1/locations/search?q=chennai" "200"
test_api "Get Location by ID" "GET" "/api/v1/locations/1" "200"
test_api "Get TN Locations" "GET" "/api/v1/locations/state/tamil-nadu" "200"

echo ""
echo -e "${BLUE}=== 3. Bus Search & Details ===${NC}"
test_api "Search Buses" "GET" "/api/v1/buses/search?from=1&to=2" "200"
test_api "Get Bus by ID" "GET" "/api/v1/buses/1" "200"
test_api "Get Bus Details" "GET" "/api/v1/buses/1/details" "200"
test_api "Get Route Details" "GET" "/api/v1/buses/route/1" "200"

echo ""
echo -e "${BLUE}=== 4. Contribution Endpoints ===${NC}"
test_api "Validate Paste" "POST" "/api/v1/contributions/paste/validate" "200" \
    -H "Content-Type: application/json" \
    -H "X-Form-Timestamp: $(date +%s)000" \
    -d '{"text":"Route 123\nCity A → City B\n8:00 AM"}'

test_api "Submit Paste" "POST" "/api/v1/contributions/paste" "200" \
    -H "Content-Type: application/json" \
    -H "X-Form-Timestamp: $(date +%s)000" \
    -d '{"text":"Route TEST\nTest → Test\n9:00","sourceAttribution":"Test"}'

test_api "Submit Manual Route" "POST" "/api/v1/contributions/routes" "200" \
    -H "Content-Type: application/json" \
    -H "X-Form-Timestamp: $(date +%s)000" \
    -d '{"busNumber":"T123","fromLocation":"Chennai","toLocation":"Bangalore","departureTime":"06:00","busType":"ORDINARY","sourceAttribution":"Test"}'

echo ""
echo -e "${BLUE}=== 5. Duplicate Check ===${NC}"
test_api "Check Duplicates" "POST" "/api/v1/duplicates/check" "200" \
    -H "Content-Type: application/json" \
    -d '{"busNumber":"123","fromLocationId":1,"toLocationId":2,"departureTime":"08:00"}'

echo ""
echo -e "${BLUE}=== 6. Review Endpoints ===${NC}"
test_api "Review Feature Status" "GET" "/api/reviews/feature-status" "200"

echo ""
echo -e "${BLUE}=== 7. Bus Tracking ===${NC}"
test_api "Search Bus Tracking" "GET" "/api/v1/tracking/search?busNumber=123" "200"

echo ""
echo -e "${BLUE}=== 8. User Session ===${NC}"
test_api "Create User Session" "POST" "/api/v1/user/session" "200" \
    -H "Content-Type: application/json" \
    -d '{}'

echo ""
echo -e "${BLUE}=== 9. Timing Images ===${NC}"
test_api "Get Timing Stats" "GET" "/api/v1/timing-images/stats" "200"

echo ""
echo -e "${BLUE}=== 10. Admin Authentication ===${NC}"

# Test admin login endpoint (session-based)
echo -n "Testing: Admin Login... "
login_response=$(curl -s -X POST "$BACKEND_URL/api/admin/auth/login" \
    -H "Content-Type: application/json" \
    -H "User-Agent: $USER_AGENT" \
    -H "X-API-Key: $API_KEY" \
    -d "{\"username\":\"$ADMIN_USERNAME\",\"password\":\"$ADMIN_PASSWORD\"}")

login_success=$(echo "$login_response" | jq -r '.success // false')

if [ "$login_success" = "true" ]; then
    echo -e "${GREEN}✓ PASS${NC} (Login successful)"
    ((TESTS_PASSED++))
    # Set up Basic Auth credentials for subsequent admin requests
    AUTH_BASIC=$(echo -n "$ADMIN_USERNAME:$ADMIN_PASSWORD" | base64)
else
    echo -e "${RED}✗ FAIL${NC} (Login failed)"
    echo "Response: $login_response"
    ((TESTS_FAILED++))
fi

# Test auth status (uses session from login or Basic Auth)
echo -n "Testing: Admin Auth Status... "
http_code=$(curl -s -o /dev/null -w "%{http_code}" \
    -H "User-Agent: $USER_AGENT" \
    -H "X-API-Key: $API_KEY" \
    -H "Authorization: Basic $AUTH_BASIC" \
    "$BACKEND_URL/api/admin/auth/status")

if [ "$http_code" = "200" ]; then
    echo -e "${GREEN}✓ PASS${NC} ($http_code)"
    ((TESTS_PASSED++))
else
    echo -e "${RED}✗ FAIL${NC} (Expected: 200, Got: $http_code)"
    ((TESTS_FAILED++))
fi

echo ""
echo -e "${BLUE}=== 11. Admin - Integration Endpoints ===${NC}"
test_api_auth "Get Approved Routes" "POST" "/api/admin/integration/approved-routes" "200" \
    -H "Content-Type: application/json" \
    -d '{"limit":10}'

test_api_auth "Integration Status" "GET" "/api/admin/integration/status" "200"

echo ""
echo -e "${BLUE}=== 12. Admin - Settings ===${NC}"
test_api_auth "Get System Settings" "GET" "/api/admin/settings" "200"

echo ""
echo -e "${BLUE}=== 13. Admin - Bus Management ===${NC}"
test_api_auth "List All Buses" "GET" "/api/admin/buses" "200"
test_api_auth "Search Buses (Admin)" "GET" "/api/admin/buses/search?query=123" "200"

echo ""
echo -e "${BLUE}=== 14. Admin - Timing Images ===${NC}"
test_api_auth "Get Pending Timing Images" "GET" "/api/admin/timing-images/pending" "200"

echo ""
echo -e "${BLUE}=== 15. Admin - Reviews ===${NC}"
test_api_auth "Get Pending Reviews" "GET" "/api/reviews/admin/pending" "200"

echo ""
echo -e "${BLUE}=== 16. Admin - Security ===${NC}"
test_api_auth "Get Security Stats" "GET" "/api/admin/security/stats" "200"

echo ""
echo -e "${BLUE}=== 17. Admin - Contributions ===${NC}"
test_api_auth "Get Pending Contributions" "GET" "/api/admin/contributions/pending" "200"
test_api_auth "Get Contribution Stats" "GET" "/api/admin/contributions/stats" "200"

echo ""
echo -e "${BLUE}=== 18. Security Tests ===${NC}"

# Test without token (should fail)
echo -n "Testing: Protected endpoint without token... "
http_code=$(curl -s -o /dev/null -w "%{http_code}" \
    -H "User-Agent: $USER_AGENT" \
    "$BACKEND_URL/api/admin/buses")

if [ "$http_code" = "401" ]; then
    echo -e "${GREEN}✓ PASS${NC} (Correctly blocked)"
    ((TESTS_PASSED++))
else
    echo -e "${RED}✗ FAIL${NC} (Expected 401, got $http_code)"
    ((TESTS_FAILED++))
fi

# Test suspicious user agent blocking
echo -n "Testing: Block suspicious user agent... "
http_code=$(curl -s -o /dev/null -w "%{http_code}" \
    -H "User-Agent: curl/8.7.1" \
    -X POST "$BACKEND_URL/api/v1/contributions/paste" \
    -H "Content-Type: application/json" \
    -d '{"text":"test"}')

if [ "$http_code" = "403" ]; then
    echo -e "${GREEN}✓ PASS${NC} (Correctly blocked)"
    ((TESTS_PASSED++))
else
    echo -e "${RED}✗ FAIL${NC} (Expected 403, got $http_code)"
    ((TESTS_FAILED++))
fi

# Admin logout
if [ -n "$AUTH_BASIC" ]; then
    echo ""
    echo -e "${BLUE}=== 19. Admin Logout ===${NC}"
    test_api_auth "Admin Logout" "POST" "/api/admin/auth/logout" "200"
fi

echo ""
echo "========================================"
echo "Test Summary"
echo "========================================"
echo -e "${GREEN}Passed: $TESTS_PASSED${NC}"
echo -e "${RED}Failed: $TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed! Backend is ready for deployment.${NC}"
    exit 0
else
    echo -e "${RED}✗ Some tests failed. Please review.${NC}"
    exit 1
fi
