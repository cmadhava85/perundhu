#!/bin/bash

# Comprehensive endpoint testing script
# Tests all public endpoints for CORS and IP filtering issues

BACKEND_URL="https://perundhu-backend-preprod-1032721240281.asia-south1.run.app"
BACKEND_URL_ALT="https://perundhu-backend-preprod-c6qn3mz4wa-el.a.run.app"
FRONTEND_URL="https://perundhu-frontend-preprod-1032721240281.asia-south1.run.app"

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

test_count=0
pass_count=0
fail_count=0

test_endpoint() {
  local name=$1
  local method=$2
  local endpoint=$3
  local data=$4
  local expected_status=$5
  
  ((test_count++))
  
  echo -e "\n${BLUE}Test $test_count: $name${NC}"
  echo "Method: $method, Endpoint: $endpoint"
  
  if [ "$method" = "GET" ]; then
    response=$(curl -s -w "\n%{http_code}" "$BACKEND_URL$endpoint" \
      -H "Origin: $FRONTEND_URL" \
      -H "User-Agent: Mozilla/5.0" 2>&1)
  else
    response=$(curl -s -w "\n%{http_code}" -X $method "$BACKEND_URL$endpoint" \
      -H "Origin: $FRONTEND_URL" \
      -H "Content-Type: application/json" \
      -H "User-Agent: Mozilla/5.0" \
      -d "$data" 2>&1)
  fi
  
  http_code=$(echo "$response" | tail -n1)
  body=$(echo "$response" | head -n -1)
  
  # Check for 403 IP blocking error
  if echo "$body" | grep -q "Request blocked for security reasons"; then
    echo -e "${RED}✗ BLOCKED by IP Filter: HTTP $http_code${NC}"
    echo "  Message: Request blocked for security reasons"
    ((fail_count++))
    return 1
  fi
  
  # Check for 401/403 auth errors
  if [[ "$http_code" == "401" || "$http_code" == "403" ]]; then
    # Some endpoints require auth - check if expected
    if [[ "$expected_status" == "$http_code" ]]; then
      echo -e "${GREEN}✓ HTTP $http_code (expected auth required)${NC}"
      ((pass_count++))
      return 0
    else
      echo -e "${RED}✗ HTTP $http_code${NC}"
      echo "  Error: $(echo "$body" | jq -r '.message // .error // .' 2>/dev/null | head -c 100)"
      ((fail_count++))
      return 1
    fi
  fi
  
  # Accept 2xx and 4xx responses (except 403 blocked)
  if [[ "$http_code" =~ ^[24] ]]; then
    echo -e "${GREEN}✓ HTTP $http_code${NC}"
    ((pass_count++))
    return 0
  else
    echo -e "${RED}✗ HTTP $http_code${NC}"
    echo "  Response: $(echo "$body" | head -c 100)"
    ((fail_count++))
    return 1
  fi
}

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║        Testing All Public Endpoints for Issues             ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo "Backend: $BACKEND_URL"
echo "Frontend: $FRONTEND_URL"
echo ""

# Test GET endpoints (should be allowed)
echo -e "\n${YELLOW}=== READ-ONLY ENDPOINTS (GET) ===${NC}"
test_endpoint "List Bus Schedules" "GET" "/api/v1/bus-schedules/search?origin=Coimbatore&destination=Salem"
test_endpoint "List Buses" "GET" "/api/v1/buses?active=true&limit=10"
test_endpoint "List Stops" "GET" "/api/v1/stops?city=Coimbatore&limit=10"
test_endpoint "Search Locations" "GET" "/api/v1/locations/search?q=Coimbatore"
test_endpoint "List Images" "GET" "/api/images?limit=10"
test_endpoint "Health Check" "GET" "/actuator/health"

# Test POST validation endpoints (should be allowed for cross-origin POST)
echo -e "\n${YELLOW}=== VALIDATION ENDPOINTS (POST - Preview/Analysis Only) ===${NC}"
test_endpoint "Paste Validation" "POST" "/api/v1/contributions/paste/validate" '{"text":"Route 123A\nCoimbatore → Salem"}' 200
test_endpoint "Image Analysis" "POST" "/api/v1/contributions/analyze-image" '{"imageUrl":"https://example.com/image.jpg"}' 200
test_endpoint "Voice Transcribe" "POST" "/api/v1/contributions/voice/transcribe" '{}' 200
test_endpoint "Analytics Query" "POST" "/api/v1/analytics/search" '{"query":"route"}' 200

# Test state-changing POST endpoints (should be allowed from frontend origin)
echo -e "\n${YELLOW}=== CONTRIBUTION ENDPOINTS (POST - State-Changing) ===${NC}"
test_endpoint "Add Route Contribution" "POST" "/api/v1/contributions/routes" '{"routeNumber":"123A"}' 200
test_endpoint "Add Stop to Route" "POST" "/api/v1/contributions/routes/stops" '{"routeId":1,"stopId":1}' 200
test_endpoint "Add Bus Contribution" "POST" "/api/v1/contributions/buses" '{"type":"bus"}' 200
test_endpoint "Add Stop Contribution" "POST" "/api/v1/contributions/stops" '{"name":"Coimbatore"}' 200
test_endpoint "Report Route Issue" "POST" "/api/v1/route-issues/report" '{"routeId":1,"issue":"Timing"}' 200

# Test admin endpoints (should require auth)
echo -e "\n${YELLOW}=== ADMIN ENDPOINTS (Should Require Auth) ===${NC}"
test_endpoint "Admin Auth Login" "POST" "/api/admin/auth/login" '{"username":"admin","password":"admin123"}' 200
test_endpoint "Admin Routes (should fail)" "GET" "/api/admin/contributions/routes" "" 401

echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                    Test Summary                             ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo "Total Tests:  $test_count"
echo -e "Passed: ${GREEN}$pass_count${NC}"
echo -e "Failed: ${RED}$fail_count${NC}"
echo ""

if [ $fail_count -eq 0 ]; then
  echo -e "${GREEN}✓ All tests passed!${NC}"
  exit 0
else
  echo -e "${RED}✗ Some tests failed. Issues detected:${NC}"
  echo ""
  echo "Possible causes:"
  echo "  1. IP filtering blocking cross-origin POST requests"
  echo "  2. Missing endpoint in validation endpoints list"
  echo "  3. Backend not deployed with latest CORS/IP filter fix"
  echo ""
  exit 1
fi
