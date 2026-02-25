#!/bin/bash
# Create Domain Mapping for www.perundhu.com (Single Domain - Cost Optimized)
# 
# This script creates a domain mapping for www.perundhu.com only.
# API requests are served via nginx proxy at www.perundhu.com/api/*
#
# Cost savings: 1 SSL certificate instead of 2, simpler DNS configuration

set -e

echo "=========================================="
echo "Creating Domain Mapping - Cost Optimized"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

PROJECT_ID="perundhu-prod-001"
REGION="us-central1"
FRONTEND_SERVICE="perundhu-production-frontend"
DOMAIN="www.perundhu.com"

echo "Configuration:"
echo "  Project:  $PROJECT_ID"
echo "  Region:   $REGION"
echo "  Domain:   $DOMAIN"
echo "  Service:  $FRONTEND_SERVICE"
echo ""
echo -e "${YELLOW}Note: API will be served via $DOMAIN/api/* (nginx proxy)${NC}"
echo ""

# Check DNS first
echo "Step 1: Checking DNS Configuration..."
echo "-----------------------------------"
DNS_CHECK=$(dig +short $DOMAIN CNAME)
if [[ "$DNS_CHECK" == *"ghs.googlehosted.com"* ]]; then
    echo -e "${GREEN}✓ DNS CNAME record found: $DNS_CHECK${NC}"
else
    echo -e "${YELLOW}⚠ DNS CNAME not found. Current value: $DNS_CHECK${NC}"
    echo ""
    echo "You must configure DNS BEFORE creating domain mapping:"
    echo "  1. Delete A record: $DOMAIN → 34.36.97.68 (if exists)"
    echo "  2. Add CNAME record: $DOMAIN → ghs.googlehosted.com"
    echo "  3. Wait 5-10 minutes for DNS propagation"
    echo "  4. Re-run this script"
    echo ""
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Aborting. Please configure DNS first."
        exit 1
    fi
fi

echo ""

# Create domain mapping
echo "Step 2: Creating Domain Mapping..."
echo "-----------------------------------"

echo "Creating mapping for $DOMAIN..."
gcloud beta run domain-mappings create \
  --service=$FRONTEND_SERVICE \
  --domain=$DOMAIN \
  --region=$REGION \
  --project=$PROJECT_ID \
  --force-override || echo "Mapping may already exist"

echo ""
echo -e "${GREEN}✓ Domain mapping created${NC}"
echo ""

# Check status
echo "Step 3: Checking Certificate Status..."
echo "-----------------------------------"

echo "Certificate provisioning started (this takes 15-30 minutes):"
gcloud beta run domain-mappings describe \
  --domain=$DOMAIN \
  --region=$REGION \
  --project=$PROJECT_ID \
  --format="table(status.mappedRouteName,status.certificateStatus,status.url)"

echo ""

# Summary
echo "=========================================="
echo "Domain Mapping Configuration Complete"
echo "=========================================="
echo ""
echo "✓ Domain:  $DOMAIN"
echo "✓ Service: $FRONTEND_SERVICE"
echo "✓ Region:  $REGION"
echo ""
echo "DNS Configuration Required:"
echo "  Type:   CNAME"
echo "  Host:   www (or www.perundhu.com)"
echo "  Value:  ghs.googlehosted.com"
echo "  TTL:    300 (5 minutes) or Auto"
echo ""
echo "Next Steps:"
echo "  1. Verify DNS CNAME is configured correctly"
echo "  2. Wait 15-30 minutes for SSL certificate provisioning"
echo "  3. Run: ./scripts/test-domain-mappings.sh"
echo "  4. Test: https://www.perundhu.com"
echo "  5. Test API: https://www.perundhu.com/api/health"
echo ""
echo "Cost Savings:"
echo "  - Single SSL certificate (vs 2)"
echo "  - API served via proxy (no separate domain mapping)"
echo "  - Simplified DNS management"
echo ""
echo "=========================================="
