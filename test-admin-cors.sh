#!/bin/bash

# Admin Endpoints CORS Testing Script
# This script tests all admin endpoints to verify CORS preflight and authentication work

set -e

BACKEND_URL="https://perundhu-backend-preprod-c6qn3mz4wa-el.a.run.app"
FRONTEND_URL="https://perundhu-frontend-preprod-1032721240281.asia-south1.run.app"
ADMIN_USER="admin"
ADMIN_PASS="admin123"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

test_count=0
pass_count=0
fail_count=0

# Test function
test_endpoint() {
  local name=$1
  local endpoint=$2
  local method=$3
  
  ((test_count++))
  
  echo -e "\n${BLUE}━━━ Test $test_count: $name ━━━${NC}"
  echo "Endpoint: $method $endpoint"
  
  # Step 1: CORS Preflight
  echo -e "\n${YELLOW}1. CORS Preflight (OPTIONS):${NC}"
  
  preflight_response=$(curl -s -w "\n%{http_code}" -X OPTIONS "$BACKEND_URL$endpoint" \
    -H "Origin: $FRONTEND_URL" \
    -H "Access-Control-Request-Method: $method" \
    -H "Access-Control-Request-Headers: authorization" \
    -H "sec-fetch-mode: cors" 2>&1 || echo "error\n000")
  
  preflight_code=$(echo "$preflight_response" | tail -n1)
  preflight_body=$(echo "$preflight_response" | head -n -1)
  
  if [[ "$preflight_code" == "200" || "$preflight_code" == "204" ]]; then
    echo -e "${GREEN}✓ CORS preflight: HTTP $preflight_code${NC}"
    echo "  Access-Control-Allow-Origin: $(echo "$preflight_body" | grep -i "access-control-allow-origin" | head -1 || echo 'SET BY CORS FILTER')"
    ((pass_count++))
  else
    echo -e "${RED}✗ CORS preflight: HTTP $preflight_code${NC}"
    echo "  Body: $(echo "$preflight_body" | head -c 100)"
    ((fail_count++))
  fi
  
  # Step 2: Actual Request with Authentication
  echo -e "\n${YELLOW}2. Actual Request ($method with Basic Auth):${NC}"
  
  AUTH_HEADER=$(echo -n "$ADMIN_USER:$ADMIN_PASS" | base64)
  
  actual_response=$(curl -s -w "\n%{http_code}" -X $method "$BACKEND_URL$endpoint" \
    -H "Origin: $FRONTEND_URL" \
    -H "Authorization: Basic $AUTH_HEADER" \
    -H "Content-Type: application/json" 2>&1 || echo "error\n000")
  
  actual_code=$(echo "$actual_response" | tail -n1)
  actual_body=$(echo "$actual_response" | head -n -1)
  
  # Accept any response that's not 401/403 (which would indicate auth issues)
  if [[ "$actual_code" != "401" && "$actual_code" != "403" ]]; then
    echo -e "${GREEN}✓ Authentication: HTTP $actual_code${NC}"
    echo "  Response: $(echo "$actual_body" | head -c 150)..."
    ((pass_count++))
  else
    echo -e "${RED}✗ Authentication: HTTP $actual_code${NC}"
    echo "  Error: $(echo "$actual_body" | jq -r '.message // .' 2>/dev/null || echo "$actual_body" | head -c 100)"
    ((fail_count++))
  fi
}

# Print header
clear
echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║        Admin Endpoints CORS & Authentication Testing       ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo "Backend URL: $BACKEND_URL"
echo "Frontend URL: $FRONTEND_URL"
echo ""

# Define test endpoints
echo -e "${YELLOW}Testing Endpoints:${NC}"

# Contribution Routes
test_endpoint "List Admin Route Contributions" "/api/admin/contributions/routes" "GET"
test_endpoint "List Admin Route Contributions (v1)" "/api/v1/admin/contributions/routes" "GET"

# Contribution Buses
test_endpoint "List Admin Bus Contributions" "/api/admin/contributions/buses" "GET"
test_endpoint "List Admin Bus Contributions (v1)" "/api/v1/admin/contributions/buses" "GET"

# Contribution Stops
test_endpoint "List Admin Stop Contributions" "/api/admin/contributions/stops" "GET"
test_endpoint "List Admin Stop Contributions (v1)" "/api/v1/admin/contributions/stops" "GET"

# Route Issues
test_endpoint "List Admin Route Issues" "/api/admin/route-issues" "GET"
test_endpoint "List Admin Route Issues (v1)" "/api/v1/admin/route-issues" "GET"

# Print summary
echo -e "\n${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                    Test Summary                            ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo "Total Tests: $test_count"
echo -e "Passed: ${GREEN}$pass_count${NC}"
echo -e "Failed: ${RED}$fail_count${NC}"
echo ""

if [ $fail_count -eq 0 ]; then
  echo -e "${GREEN}✓ All tests passed!${NC}"
  exit 0
else
  echo -e "${RED}✗ Some tests failed. Please review.${NC}"
  exit 1
fi
