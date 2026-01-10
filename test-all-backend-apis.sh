#!/bin/bash

# Comprehensive Backend API Test Suite
# Tests all major endpoints before deployment

set -e

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

# Test counters
TESTS_PASSED=0
TESTS_FAILED=0
TESTS_SKIPPED=0

echo "========================================"
echo "  Backend API Test Suite - Complete"
echo "========================================"
echo "Target: $BACKEND_URL"
echo ""

# Test helper function
test_endpoint() {
    local name="$1"
    local method="$2"
    local endpoint="$3"
    local expected_status="$4"
    shift 4
    local extra_args=("$@")
    
    echo -n "Testing: $name... "
    
    http_code=$(curl -s -o /dev/null -w "%{http_code}" \
        -X "$method" \
        -H "User-Agent: $USER_AGENT" \
        -H "X-API-Key: $API_KEY" \
        "${extra_args[@]}" \
        "$BACKEND_URL$endpoint")
    
    if [ "$http_code" = "$expected_status" ]; then
        echo -e "${GREEN}✓ PASSED${NC} (HTTP $http_code)"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}✗ FAILED${NC} (Expected: $expected_status, Got: $http_code)"
        ((TESTS_FAILED++))
    fi
}

# Test with JSON response check
test_json_endpoint() {
    local name="$1"
    local method="$2"
    local endpoint="$3"
    local field_check="$4"
    shift 4
    local extra_args=("$@")
    
    echo -n "Testing: $name... "
    
    response=$(curl -s \
        -X "$method" \
        -H "User-Agent: $USER_AGENT" \
        -H "X-API-Key: $API_KEY" \
        "${extra_args[@]}" \
        "$BACKEND_URL$endpoint")
    
    http_code=$(echo "$response" | tail -c 4)
    
    if echo "$response" | jq -e "$field_check" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ PASSED${NC}"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}✗ FAILED${NC}"
        echo "  Response: $response"
        ((TESTS_FAILED++))
    fi
}

echo -e "${BLUE}=== Health & Status Endpoints ===${NC}"
test_endpoint "Health Check" "GET" "/actuator/health" "200"
test_endpoint "Info Endpoint" "GET" "/actuator/info" "200"

echo ""
echo -e "${BLUE}=== Location Endpoints ===${NC}"
test_endpoint "Get All Locations" "GET" "/api/v1/locations" "200"
test_endpoint "Get Tamil Nadu Locations" "GET" "/api/v1/locations/state/tamil-nadu" "200"
test_endpoint "Search Locations" "GET" "/api/v1/locations/search?q=chennai" "200"
test_endpoint "Get Location by ID" "GET" "/api/v1/locations/1" "200"

echo ""
echo -e "${BLUE}=== Bus Schedule Endpoints ===${NC}"
test_endpoint "Search Buses" "GET" "/api/v1/buses/search?from=1&to=2" "200"
test_endpoint "Get Bus by ID" "GET" "/api/v1/buses/1" "200"
test_endpoint "Get Bus Details" "GET" "/api/v1/buses/1/details" "200"
test_endpoint "Get Route Details" "GET" "/api/v1/buses/route/1" "200"

echo ""
echo -e "${BLUE}=== Contribution Endpoints (Anonymous) ===${NC}"

# Test paste contribution validation
test_endpoint "Validate Paste Text" "POST" "/api/v1/contributions/paste/validate" "200" \
    -H "Content-Type: application/json" \
    -H "X-Form-Timestamp: $(date +%s)000" \
    -d '{"text":"Route 123A\nCoimbatore → Salem\nMorning 7:30 AM"}'

# Test paste contribution submission
test_endpoint "Submit Paste Contribution" "POST" "/api/v1/contributions/paste" "200" \
    -H "Content-Type: application/json" \
    -H "X-Form-Timestamp: $(date +%s)000" \
    -d '{"text":"Route TEST\nTest City A → Test City B\n8:00 AM","sourceAttribution":"API Test"}'

# Test manual route contribution
test_endpoint "Submit Manual Route" "POST" "/api/v1/contributions/routes" "200" \
    -H "Content-Type: application/json" \
    -H "X-Form-Timestamp: $(date +%s)000" \
    -d '{
        "busNumber":"TEST123",
        "fromLocation":"Chennai",
        "toLocation":"Bangalore",
        "departureTime":"06:00",
        "arrivalTime":"12:00",
        "busType":"ORDINARY",
        "sourceAttribution":"API Test"
    }'

echo ""
echo -e "${BLUE}=== Duplicate Check Endpoint ===${NC}"
test_endpoint "Check Duplicates" "POST" "/api/v1/duplicates/check" "200" \
    -H "Content-Type: application/json" \
    -d '{
        "busNumber":"123A",
        "fromLocationId":1,
        "toLocationId":2,
        "departureTime":"08:00"
    }'

echo ""
echo -e "${BLUE}=== Review Endpoints ===${NC}"
test_endpoint "Get Review Feature Status" "GET" "/api/reviews/feature-status" "200"

echo ""
echo -e "${BLUE}=== Bus Tracking Endpoints ===${NC}"
test_endpoint "Search Bus Tracking" "GET" "/api/v1/tracking/search?busNumber=123" "200"

echo ""
echo -e "${BLUE}=== User Session Endpoints ===${NC}"
test_endpoint "Create User Session" "POST" "/api/v1/user/session" "200" \
    -H "Content-Type: application/json" \
    -d '{}'

echo ""
echo -e "${BLUE}=== Admin Endpoints (Should be Protected) ===${NC}"
test_endpoint "Admin Login (No Credentials)" "POST" "/api/admin/auth/login" "400" \
    -H "Content-Type: application/json" \
    -d '{}'

test_endpoint "Admin Auth Status (Unauthorized)" "GET" "/api/admin/auth/status" "401"

echo ""
echo -e "${BLUE}=== Timing Image Endpoints ===${NC}"
test_endpoint "Get Timing Image Stats" "GET" "/api/v1/timing-images/stats" "200"

echo ""
echo -e "${BLUE}=== Security Test: Rate Limiting ===${NC}"
echo "Testing rate limiting (5 rapid requests)..."
for i in {1..5}; do
    http_code=$(curl -s -o /dev/null -w "%{http_code}" \
        -H "User-Agent: $USER_AGENT" \
        -H "X-API-Key: $API_KEY" \
        "$BACKEND_URL/api/v1/locations")
    echo -n "  Request $i: HTTP $http_code "
    if [ "$http_code" = "200" ] || [ "$http_code" = "429" ]; then
        echo -e "${GREEN}✓${NC}"
    else
        echo -e "${RED}✗${NC}"
    fi
done

echo ""
echo -e "${BLUE}=== Security Test: Suspicious User Agent ===${NC}"
http_code=$(curl -s -o /dev/null -w "%{http_code}" \
    -H "User-Agent: curl/8.7.1" \
    "$BACKEND_URL/api/v1/contributions/paste" \
    -X POST \
    -H "Content-Type: application/json" \
    -H "X-Form-Timestamp: $(date +%s)000" \
    -d '{"text":"test"}')

echo -n "Testing: Block suspicious user agent... "
if [ "$http_code" = "403" ]; then
    echo -e "${GREEN}✓ PASSED${NC} (Correctly blocked)"
    ((TESTS_PASSED++))
else
    echo -e "${RED}✗ FAILED${NC} (Expected 403, got $http_code)"
    ((TESTS_FAILED++))
fi

echo ""
echo "========================================"
echo "Test Summary"
echo "========================================"
echo -e "${GREEN}Passed: $TESTS_PASSED${NC}"
echo -e "${RED}Failed: $TESTS_FAILED${NC}"
echo -e "${YELLOW}Skipped: $TESTS_SKIPPED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed! Ready for deployment.${NC}"
    exit 0
else
    echo -e "${RED}✗ Some tests failed. Please review before deployment.${NC}"
    exit 1
fi
