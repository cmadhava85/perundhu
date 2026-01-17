#!/bin/bash

# GCP Budget Alerts Setup Script
# Sets up budget alerts for cost monitoring

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo "════════════════════════════════════════════════════════════════"
echo "           GCP BUDGET ALERTS SETUP"
echo "════════════════════════════════════════════════════════════════"
echo ""

# Get billing account
echo "Fetching billing account..."
BILLING_ACCOUNT=$(gcloud billing accounts list --format="value(name)" --limit=1)

if [ -z "$BILLING_ACCOUNT" ]; then
    echo -e "${RED}❌ No billing account found${NC}"
    echo "Please ensure you have access to a billing account"
    exit 1
fi

echo -e "${GREEN}✅ Billing Account: $BILLING_ACCOUNT${NC}"
echo ""

# PreProd Budget
echo "Creating PreProd budget alert ($10 threshold)..."
gcloud billing budgets create \
  --billing-account="$BILLING_ACCOUNT" \
  --display-name="Perundhu PreProd Monthly Budget" \
  --budget-amount=10 \
  --threshold-rule=percent=50 \
  --threshold-rule=percent=80 \
  --threshold-rule=percent=90 \
  --threshold-rule=percent=100 \
  --all-updates-rule-pubsub-topic=projects/astute-strategy-406601/topics/budget-alerts \
  2>/dev/null || echo -e "${YELLOW}⚠️  PreProd budget may already exist${NC}"

echo -e "${GREEN}✅ PreProd budget configured${NC}"
echo ""

# Production Budget
echo "Creating Production budget alert ($20 threshold)..."
gcloud billing budgets create \
  --billing-account="$BILLING_ACCOUNT" \
  --display-name="Perundhu Production Monthly Budget" \
  --budget-amount=20 \
  --threshold-rule=percent=50 \
  --threshold-rule=percent=80 \
  --threshold-rule=percent=90 \
  --threshold-rule=percent=100 \
  --all-updates-rule-pubsub-topic=projects/perundhu-prod-001/topics/budget-alerts \
  2>/dev/null || echo -e "${YELLOW}⚠️  Production budget may already exist${NC}"

echo -e "${GREEN}✅ Production budget configured${NC}"
echo ""

# Summary
echo "════════════════════════════════════════════════════════════════"
echo "                    SETUP COMPLETE"
echo "════════════════════════════════════════════════════════════════"
echo ""
echo "Budget alerts configured:"
echo "  • PreProd: $10/month (alerts at 50%, 80%, 90%, 100%)"
echo "  • Production: $20/month (alerts at 50%, 80%, 90%, 100%)"
echo ""
echo "View budgets:"
echo "  https://console.cloud.google.com/billing/budgets"
echo ""
echo "Configure email notifications:"
echo "  1. Go to billing budgets in GCP Console"
echo "  2. Click on each budget"
echo "  3. Add email recipients"
echo ""
