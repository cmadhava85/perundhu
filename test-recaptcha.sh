#!/bin/bash

# Test script for reCAPTCHA implementation
# Tests both local development (recaptcha.enabled=false) and preprod (recaptcha.enabled=true)

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "========================================"
echo "  reCAPTCHA Implementation Test Suite"
echo "========================================"
echo ""

# Configuration
BACKEND_URL="${BACKEND_URL:-http://localhost:8080}"
API_KEY="perundhu-public-api-key-2024"
USER_AGENT="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36"

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Function to run a test
run_test() {
    local test_name="$1"
    local expected_result="$2"
    shift 2
    local curl_args=("$@")
    
    echo -n "Testing: $test_name... "
    
    response=$(curl -s "${curl_args[@]}")
    success=$(echo "$response" | jq -r '.success // "null"')
    error=$(echo "$response" | jq -r '.error // ""')
    
    # Handle both boolean false and error responses
    if [ "$expected_result" = "false" ] && ([ "$success" = "false" ] || [ "$error" != "" ]); then
        echo -e "${GREEN}✓ PASSED${NC}"
        ((TESTS_PASSED++))
        return 0
    elif [ "$success" = "$expected_result" ]; then
        echo -e "${GREEN}✓ PASSED${NC}"
        ((TESTS_PASSED++))
        return 0
    else
        echo -e "${RED}✗ FAILED${NC}"
        echo "  Expected: $expected_result"
        echo "  Got: $success"
        echo "  Error: $error"
        echo "  Response: $response"
        ((TESTS_FAILED++))
        return 1
    fi
}

echo "Target: $BACKEND_URL"
echo ""

# Test 1: No reCAPTCHA token, no user agent (should fail - suspicious user agent)
echo "Test Group: Security Validation"
echo "--------------------------------"

run_test "Suspicious user agent (curl)" "false" \
    -X POST "$BACKEND_URL/api/v1/contributions/paste" \
    -H "Content-Type: application/json" \
    -H "X-Form-Timestamp: $(date +%s)000" \
    -H "X-API-Key: $API_KEY" \
    -d '{"text":"Route 123A\nCoimbatore → Salem\nMorning 7:30 AM","sourceAttribution":"Test"}'

# Test 2: Valid browser user agent, no reCAPTCHA token (should pass in dev mode)
run_test "Valid request without reCAPTCHA token (dev mode)" "true" \
    -X POST "$BACKEND_URL/api/v1/contributions/paste" \
    -H "Content-Type: application/json" \
    -H "User-Agent: $USER_AGENT" \
    -H "X-Form-Timestamp: $(date +%s)000" \
    -H "X-API-Key: $API_KEY" \
    -d '{"text":"Route 123A\nCoimbatore → Salem\nMorning 7:30 AM","sourceAttribution":"Test"}'

echo ""
echo "Test Group: reCAPTCHA Token Handling"
echo "-------------------------------------"

# Test 3: With fake reCAPTCHA token in header (should pass in dev, fail in prod)
run_test "Request with fake reCAPTCHA token in header" "true" \
    -X POST "$BACKEND_URL/api/v1/contributions/paste" \
    -H "Content-Type: application/json" \
    -H "User-Agent: $USER_AGENT" \
    -H "X-Form-Timestamp: $(date +%s)000" \
    -H "X-API-Key: $API_KEY" \
    -H "X-Recaptcha-Token: FAKE_TOKEN_12345" \
    -d '{"text":"Route 456B\nChennai → Bangalore\nDaily 6:00 AM","sourceAttribution":"Test with token"}'

# Test 4: Missing required fields
echo ""
echo "Test Group: Input Validation"
echo "-----------------------------"

run_test "Missing text field" "false" \
    -X POST "$BACKEND_URL/api/v1/contributions/paste" \
    -H "Content-Type: application/json" \
    -H "User-Agent: $USER_AGENT" \
    -H "X-Form-Timestamp: $(date +%s)000" \
    -H "X-API-Key: $API_KEY" \
    -d '{"sourceAttribution":"Test"}'

# Test 5: Empty text
run_test "Empty text field" "false" \
    -X POST "$BACKEND_URL/api/v1/contributions/paste" \
    -H "Content-Type: application/json" \
    -H "User-Agent: $USER_AGENT" \
    -H "X-Form-Timestamp: $(date +%s)000" \
    -H "X-API-Key: $API_KEY" \
    -d '{"text":"","sourceAttribution":"Test"}'

# Test 6: Valid multi-line route data
echo ""
echo "Test Group: Data Extraction"
echo "---------------------------"

run_test "Multi-line route with timings" "true" \
    -X POST "$BACKEND_URL/api/v1/contributions/paste" \
    -H "Content-Type: application/json" \
    -H "User-Agent: $USER_AGENT" \
    -H "X-Form-Timestamp: $(date +%s)000" \
    -H "X-API-Key: $API_KEY" \
    -d '{
        "text":"Route 789C\nMadurai → Trichy\nDeparture: 8:00 AM, 2:00 PM\nStops: Dindigul, Karur",
        "sourceAttribution":"Test submission"
    }'

# Summary
echo ""
echo "========================================"
echo "Test Summary"
echo "========================================"
echo -e "${GREEN}Passed: $TESTS_PASSED${NC}"
echo -e "${RED}Failed: $TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}✗ Some tests failed${NC}"
    exit 1
fi
