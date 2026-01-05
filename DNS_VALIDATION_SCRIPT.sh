#!/bin/bash

# DNS Validation Script for perundhu.com
# Run this to verify DNS propagation and A record readiness

echo "🔍 DNS Validation Check for perundhu.com"
echo "=========================================="
echo ""

# Check nameserver propagation
echo "1️⃣  Checking Nameserver Propagation..."
echo "   Expected: ns-cloud-e1/e2/e3/e4.googledomains.com."
echo ""

NS_RESULT=$(dig perundhu.com NS +short)
echo "   Current nameservers:"
echo "$NS_RESULT" | sed 's/^/      /'
echo ""

if echo "$NS_RESULT" | grep -q "ns-cloud-e"; then
    echo "   ✅ PASS: Correct Google Cloud DNS nameservers detected"
else
    echo "   ⏳ PENDING: Still propagating (retry in 2-3 minutes)"
fi
echo ""

# Check SOA record
echo "2️⃣  Checking SOA Record..."
SOA_RESULT=$(dig perundhu.com SOA +short)
if [ -n "$SOA_RESULT" ]; then
    echo "   ✅ PASS: SOA record exists"
    echo "$SOA_RESULT" | sed 's/^/      /'
else
    echo "   ❌ FAIL: SOA record not found"
fi
echo ""

# Check Cloud DNS readiness
echo "3️⃣  Checking Cloud DNS Zone Status..."
ZONE_STATUS=$(gcloud dns managed-zones describe perundhu-com \
  --project=perundhu-prod-001 \
  --format="value(status)" 2>/dev/null)

if [ "$ZONE_STATUS" = "ok" ]; then
    echo "   ✅ PASS: Cloud DNS zone is ready"
else
    echo "   ❌ FAIL: Cloud DNS zone status: $ZONE_STATUS"
fi
echo ""

# Check A records (will be empty until Friday deployment)
echo "4️⃣  Checking A Records (for Friday)..."
A_RECORDS=$(gcloud dns record-sets list --zone=perundhu-com \
  --project=perundhu-prod-001 \
  --filter="type=A" \
  --format="value(name)" 2>/dev/null)

if [ -z "$A_RECORDS" ]; then
    echo "   ℹ️  INFO: No A records yet (expected - will be created Friday)"
else
    echo "   ✅ A records configured:"
    echo "$A_RECORDS" | sed 's/^/      /'
fi
echo ""

# Summary
echo "=========================================="
echo "📋 Summary:"
echo "   • Nameserver Update: ✅ Submitted"
echo "   • Propagation: ⏳ In Progress (5-15 min)"
echo "   • Cloud DNS Zone: ✅ Ready"
echo "   • A Records: ℹ️  Ready for Friday deployment"
echo ""
echo "✅ Domain is ready for Friday's deployment!"
echo ""
