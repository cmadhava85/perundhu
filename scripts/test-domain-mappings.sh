#!/bin/bash
# Test Domain Mappings and SSL Certificates
# Run this after DNS propagation (5-60 minutes after DNS update)

set -e

echo "=========================================="
echo "Testing Domain Mappings - us-central1"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Check DNS Propagation
echo "Step 1: Checking DNS Propagation..."
echo "-----------------------------------"

echo -n "Checking www.perundhu.com DNS... "
WWW_DNS=$(dig +short www.perundhu.com CNAME)
if [[ "$WWW_DNS" == *"ghs.googlehosted.com"* ]]; then
    echo -e "${GREEN}✓ CNAME record found: $WWW_DNS${NC}"
else
    echo -e "${RED}✗ DNS not propagated yet. Current: $WWW_DNS${NC}"
    echo "Wait a few more minutes and try again."
    exit 1
fi

echo -e "${YELLOW}Note: api.perundhu.com not used. API proxied via www.perundhu.com/api${NC}"

echo ""

# Step 2: Check Cloud Run Domain Mapping Status
echo "Step 2: Checking Domain Mapping Status..."
echo "-----------------------------------"

echo "Frontend domain mapping (www.perundhu.com):"
gcloud beta run domain-mappings describe \
  --domain=www.perundhu.com \
  --region=us-central1 \
  --project=perundhu-prod-001 \
  --format="table(status.mappedRouteName,status.certificateStatus)" 2>/dev/null || echo "Not ready yet"

echo ""
echo -e "${YELLOW}Note: API served via www.perundhu.com/api (nginx proxy to backend)${NC}"

echo ""

# Step 3: Test HTTPS Connectivity
echo "Step 3: Testing HTTPS Connectivity..."
echo "-----------------------------------"

echo -n "Testing www.perundhu.com HTTPS... "
WWW_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://www.perundhu.com 2>/dev/null || echo "000")
if [ "$WWW_STATUS" == "200" ]; then
    echo -e "${GREEN}✓ HTTP 200 OK${NC}"
else
    echo -e "${RED}✗ HTTP $WWW_STATUS (SSL may still be provisioning)${NC}"
fi

echo -n "Testing API via www.perundhu.com/api/health... "
API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://www.perundhu.com/api/health 2>/dev/null || echo "000")
if [ "$API_STATUS" == "200" ]; then
    echo -e "${GREEN}✓ HTTP 200 OK (proxied through frontend)${NC}"
else
    echo -e "${RED}✗ HTTP $API_STATUS (check nginx proxy configuration)${NC}"
fi

echo ""

# Step 4: Verify Cloud Run Routing
echo "Step 4: Verifying Cloud Run Routing..."
echo "-----------------------------------"

echo "Checking frontend headers:"
curl -sI https://www.perundhu.com 2>/dev/null | grep -E "x-cloud-trace-context|server:" || echo "Headers not available yet"

echo ""
echo "Checking proxied API headers:"
curl -sI https://www.perundhu.com/api/health 2>/dev/null | grep -E "x-cloud-trace-context|server:" || echo "Headers not available yet"

echo ""

# Step 5: Test API Endpoint
echo "Step 5: Testing API Functionality..."
echo "-----------------------------------"

echo "Testing location autocomplete API via proxy:"
API_RESPONSE=$(curl -s https://www.perundhu.com/api/locations/autocomplete?query=Chennai 2>/dev/null || echo "ERROR")
if [[ "$API_RESPONSE" == *"Chennai"* ]] || [[ "$API_RESPONSE" == "["* ]]; then
    echo -e "${GREEN}✓ API working correctly (proxied through nginx)${NC}"
    echo "Sample response: ${API_RESPONSE:0:100}..."
else
    echo -e "${YELLOW}⚠ API response unexpected: $API_RESPONSE${NC}"
fi

echo ""

# Step 6: Test CORS from Frontend Origin
echo "Step 6: Testing CORS Configuration..."
echo "-----------------------------------"

echo "Testing CORS (same-origin via nginx proxy):"
echo -e "${GREEN}✓ CORS not needed - API served from same origin (www.perundhu.com)${NC}"
echo "  Frontend: https://www.perundhu.com"
echo "  API:      https://www.perundhu.com/api/*"

echo ""

# Summary
echo "=========================================="
echo "Test Summary"
echo "=========================================="

if [ "$WWW_STATUS" == "200" ] && [ "$API_STATUS" == "200" ]; then
    echo -e "${GREEN}✓ All tests passed!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Test the website in your browser: https://www.perundhu.com"
    echo "2. Verify all functionality works (search, booking, etc.)"
    echo "3. Monitor for 24-48 hours"
    echo "4. Run: ./scripts/delete-load-balancer.sh (after successful testing)"
else
    echo -e "${YELLOW}⚠ Some tests failed${NC}"
    echo ""
    echo "Possible reasons:"
    echo "1. SSL certificates still provisioning (wait 15-30 minutes)"
    echo "2. DNS not fully propagated globally"
    echo "3. Service configuration issue"
    echo ""
    echo "Check SSL status:"
    echo "  gcloud beta run domain-mappings describe --domain=www.perundhu.com --region=us-central1 --project=perundhu-prod-001"
fi

echo ""
echo "=========================================="
