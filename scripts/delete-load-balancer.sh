#!/bin/bash
# Delete Load Balancer - Execute ONLY after 24-48 hours of successful testing
# This will save $18-25/month

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "=========================================="
echo "Load Balancer Deletion Script"
echo "=========================================="
echo ""
echo -e "${RED}WARNING: This will delete your load balancer!${NC}"
echo ""
echo "Prerequisites:"
echo "  ✓ Domain mappings working for 24-48 hours"
echo "  ✓ www.perundhu.com accessible via HTTPS"
echo "  ✓ www.perundhu.com/api working correctly (nginx proxy)"
echo "  ✓ No errors in Cloud Run logs"
echo "  ✓ All user flows tested successfully"
echo ""
echo "Estimated savings: \$18-25/month"
echo ""

# Confirmation prompt
read -p "Have you tested for 24-48 hours and ready to proceed? (yes/no): " CONFIRM
if [ "$CONFIRM" != "yes" ]; then
    echo "Aborted. Come back when ready!"
    exit 0
fi

echo ""
read -p "Type 'DELETE-LOAD-BALANCER' to confirm: " CONFIRM2
if [ "$CONFIRM2" != "DELETE-LOAD-BALANCER" ]; then
    echo "Confirmation text doesn't match. Aborted for safety."
    exit 0
fi

echo ""
echo "Starting load balancer deletion..."
echo ""

# Step 1: Delete forwarding rule
echo "Step 1: Deleting HTTPS forwarding rule..."
if gcloud compute forwarding-rules describe perundhu-frontend-lb-https --global --project=perundhu-prod-001 &>/dev/null; then
    gcloud compute forwarding-rules delete perundhu-frontend-lb-https \
      --global \
      --project=perundhu-prod-001 \
      --quiet
    echo -e "${GREEN}✓ HTTPS forwarding rule deleted${NC}"
else
    echo -e "${YELLOW}⚠ Forwarding rule not found (may already be deleted)${NC}"
fi

echo ""

# Step 2: Delete target HTTPS proxy
echo "Step 2: Deleting HTTPS target proxy..."
if gcloud compute target-https-proxies describe perundhu-frontend-lb-https-proxy --global --project=perundhu-prod-001 &>/dev/null; then
    gcloud compute target-https-proxies delete perundhu-frontend-lb-https-proxy \
      --global \
      --project=perundhu-prod-001 \
      --quiet
    echo -e "${GREEN}✓ HTTPS target proxy deleted${NC}"
else
    echo -e "${YELLOW}⚠ Target proxy not found (may already be deleted)${NC}"
fi

echo ""

# Step 3: Delete URL map
echo "Step 3: Deleting URL map..."
if gcloud compute url-maps describe perundhu-frontend-lb --global --project=perundhu-prod-001 &>/dev/null; then
    gcloud compute url-maps delete perundhu-frontend-lb \
      --global \
      --project=perundhu-prod-001 \
      --quiet
    echo -e "${GREEN}✓ URL map deleted${NC}"
else
    echo -e "${YELLOW}⚠ URL map not found (may already be deleted)${NC}"
fi

echo ""

# Step 4: Delete backend service
echo "Step 4: Deleting backend service..."
if gcloud compute backend-services describe perundhu-frontend-backend --global --project=perundhu-prod-001 &>/dev/null; then
    gcloud compute backend-services delete perundhu-frontend-backend \
      --global \
      --project=perundhu-prod-001 \
      --quiet
    echo -e "${GREEN}✓ Backend service deleted${NC}"
else
    echo -e "${YELLOW}⚠ Backend service not found (may already be deleted)${NC}"
fi

echo ""

# Step 5: Delete SSL certificate
echo "Step 5: Deleting managed SSL certificate..."
if gcloud compute ssl-certificates describe perundhu-ssl-cert --global --project=perundhu-prod-001 &>/dev/null; then
    gcloud compute ssl-certificates delete perundhu-ssl-cert \
      --global \
      --project=perundhu-prod-001 \
      --quiet
    echo -e "${GREEN}✓ SSL certificate deleted${NC}"
else
    echo -e "${YELLOW}⚠ SSL certificate not found (may already be deleted)${NC}"
fi

echo ""

# Step 6: Check for Network Endpoint Groups
echo "Step 6: Checking for Network Endpoint Groups..."
NEG_LIST=$(gcloud compute network-endpoint-groups list --project=perundhu-prod-001 --format="value(name,zone)" 2>/dev/null || echo "")

if [ -n "$NEG_LIST" ]; then
    echo "Found Network Endpoint Groups:"
    echo "$NEG_LIST"
    echo ""
    read -p "Delete these NEGs? (yes/no): " DELETE_NEG
    
    if [ "$DELETE_NEG" == "yes" ]; then
        while IFS= read -r line; do
            NEG_NAME=$(echo "$line" | awk '{print $1}')
            NEG_ZONE=$(echo "$line" | awk '{print $2}')
            
            if [ -n "$NEG_NAME" ] && [ -n "$NEG_ZONE" ]; then
                echo "Deleting NEG: $NEG_NAME in zone $NEG_ZONE..."
                gcloud compute network-endpoint-groups delete "$NEG_NAME" \
                  --zone="$NEG_ZONE" \
                  --project=perundhu-prod-001 \
                  --quiet 2>/dev/null || echo "Failed to delete $NEG_NAME"
            fi
        done <<< "$NEG_LIST"
        echo -e "${GREEN}✓ Network Endpoint Groups deleted${NC}"
    else
        echo "Skipping NEG deletion"
    fi
else
    echo -e "${GREEN}✓ No Network Endpoint Groups found${NC}"
fi

echo ""

# Verification
echo "=========================================="
echo "Verification"
echo "=========================================="
echo ""

echo "Checking for remaining load balancer components..."

REMAINING=0

if gcloud compute forwarding-rules list --global --project=perundhu-prod-001 --format="value(name)" 2>/dev/null | grep -q "perundhu"; then
    echo -e "${RED}✗ Forwarding rules still exist${NC}"
    REMAINING=1
else
    echo -e "${GREEN}✓ No forwarding rules${NC}"
fi

if gcloud compute target-https-proxies list --global --project=perundhu-prod-001 --format="value(name)" 2>/dev/null | grep -q "perundhu"; then
    echo -e "${RED}✗ Target HTTPS proxies still exist${NC}"
    REMAINING=1
else
    echo -e "${GREEN}✓ No target proxies${NC}"
fi

if gcloud compute url-maps list --global --project=perundhu-prod-001 --format="value(name)" 2>/dev/null | grep -q "perundhu"; then
    echo -e "${RED}✗ URL maps still exist${NC}"
    REMAINING=1
else
    echo -e "${GREEN}✓ No URL maps${NC}"
fi

if gcloud compute backend-services list --global --project=perundhu-prod-001 --format="value(name)" 2>/dev/null | grep -q "perundhu"; then
    echo -e "${RED}✗ Backend services still exist${NC}"
    REMAINING=1
else
    echo -e "${GREEN}✓ No backend services${NC}"
fi

echo ""

if [ $REMAINING -eq 0 ]; then
    echo -e "${GREEN}=========================================="
    echo "✓ Load Balancer Deleted Successfully!"
    echo "==========================================${NC}"
    echo ""
    echo "Expected monthly savings: \$18-25"
    echo ""
    echo "Next steps:"
    echo "1. Update DNS TTL to 3600 seconds (1 hour)"
    echo "2. Monitor costs for 1-2 billing cycles"
    echo "3. Verify target cost: \$18-28/month"
    echo "4. After 7 days, run: ./scripts/cleanup-old-resources.sh"
    echo ""
    echo "Test website one more time:"
    echo "  https://www.perundhu.com"
    echo "  https://www.perundhu.com/api/health (via nginx proxy)"
else
    echo -e "${YELLOW}=========================================="
    echo "⚠ Some components still exist"
    echo "==========================================${NC}"
    echo ""
    echo "Run these commands to check:"
    echo "  gcloud compute forwarding-rules list --project=perundhu-prod-001"
    echo "  gcloud compute target-https-proxies list --project=perundhu-prod-001"
    echo "  gcloud compute url-maps list --project=perundhu-prod-001"
    echo "  gcloud compute backend-services list --project=perundhu-prod-001"
fi

echo ""
echo "=========================================="
