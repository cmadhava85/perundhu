#!/bin/bash
# Audit PreProd Infrastructure for Unused/Wasteful Resources
# Identifies resources that are deployed but not needed, causing extra billing

set -e

PROJECT_ID="astute-strategy-406601"
REGION="us-central1"

echo "🔍 Auditing PreProd Infrastructure for Cost Issues..."
echo "Project: $PROJECT_ID"
echo "Region: $REGION"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Summary of findings
ISSUES_FOUND=0
POTENTIAL_SAVINGS=0

# ============================================
# 1. Check Cloud SQL Status
# ============================================
echo "📊 1. Cloud SQL Database Status"
echo "───────────────────────────────"
DB_INSTANCE="perundhu-preprod-mysql-us"

if gcloud sql instances describe $DB_INSTANCE --project=$PROJECT_ID &>/dev/null; then
  DB_STATUS=$(gcloud sql instances describe $DB_INSTANCE \
    --project=$PROJECT_ID \
    --format="value(settings.activationPolicy)" 2>/dev/null)
  
  DB_TIER=$(gcloud sql instances describe $DB_INSTANCE \
    --project=$PROJECT_ID \
    --format="value(settings.tier)" 2>/dev/null)
  
  echo "✅ Database exists: $DB_INSTANCE"
  echo "   Tier: $DB_TIER"
  echo "   Status: $DB_STATUS"
  
  if [ "$DB_STATUS" = "ALWAYS" ]; then
    echo "   ⚠️  WARNING: Database is RUNNING (should be STOPPED)"
    echo "   💰 Cost: ~$18-20/month"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
    POTENTIAL_SAVINGS=$((POTENTIAL_SAVINGS + 18))
  else
    echo "   ✅ Database is stopped (activation-policy=NEVER)"
  fi
else
  echo "ℹ️  Database not found: $DB_INSTANCE"
fi
echo ""

# ============================================
# 2. Check Cloud Run Services
# ============================================
echo "🚀 2. Cloud Run Services"
echo "───────────────────────────────"
SERVICES=$(gcloud run services list \
  --project=$PROJECT_ID \
  --region=$REGION \
  --format="value(name)" 2>/dev/null || echo "")

if [ -z "$SERVICES" ]; then
  echo "✅ No Cloud Run services deployed"
else
  echo "⚠️  Found Cloud Run services:"
  SERVICE_COUNT=0
  for SERVICE in $SERVICES; do
    SERVICE_COUNT=$((SERVICE_COUNT + 1))
    MIN_INSTANCES=$(gcloud run services describe $SERVICE \
      --project=$PROJECT_ID \
      --region=$REGION \
      --format="value(spec.template.metadata.annotations['autoscaling.knative.dev/minScale'])" 2>/dev/null || echo "0")
    
    echo "   - $SERVICE (min_instances=$MIN_INSTANCES)"
    
    if [ "$MIN_INSTANCES" -gt 0 ]; then
      echo "     ⚠️  WARNING: Min instances > 0 (always-on cost)"
      ISSUES_FOUND=$((ISSUES_FOUND + 1))
      POTENTIAL_SAVINGS=$((POTENTIAL_SAVINGS + 5))
    fi
  done
  
  if [ $SERVICE_COUNT -gt 0 ]; then
    echo ""
    echo "   💰 Estimated cost: $((SERVICE_COUNT * 5))-$((SERVICE_COUNT * 10))/month"
    echo "   📝 These should be deleted when not testing"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
    POTENTIAL_SAVINGS=$((POTENTIAL_SAVINGS + 10))
  fi
fi
echo ""

# ============================================
# 3. Check VPC Connector (Biggest Cost Issue)
# ============================================
echo "🔌 3. VPC Connector Status"
echo "───────────────────────────────"
CONNECTORS=$(gcloud compute networks vpc-access connectors list \
  --region=$REGION \
  --project=$PROJECT_ID \
  --format="value(name)" 2>/dev/null || echo "")

if [ -z "$CONNECTORS" ]; then
  echo "✅ No VPC connectors deployed"
else
  echo "⚠️  Found VPC connectors (SHOULD BE DELETED):"
  for CONN in $CONNECTORS; do
    CONN_STATE=$(gcloud compute networks vpc-access connectors describe $CONN \
      --region=$REGION \
      --project=$PROJECT_ID \
      --format="value(state)" 2>/dev/null || echo "UNKNOWN")
    
    MIN=$(gcloud compute networks vpc-access connectors describe $CONN \
      --region=$REGION \
      --project=$PROJECT_ID \
      --format="value(minInstances)" 2>/dev/null || echo "?")
    
    MAX=$(gcloud compute networks vpc-access connectors describe $CONN \
      --region=$REGION \
      --project=$PROJECT_ID \
      --format="value(maxInstances)" 2>/dev/null || echo "?")
    
    echo "   - $CONN"
    echo "     State: $CONN_STATE"
    echo "     Instances: min=$MIN, max=$MAX"
    echo "     ⛔ UNUSED: Cloud Run uses public IP"
    echo "     💰 Cost: ~$14/month ($7 per instance * 2 min)"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
    POTENTIAL_SAVINGS=$((POTENTIAL_SAVINGS + 14))
  done
fi
echo ""

# ============================================
# 4. Check Cloud Router & NAT Gateway
# ============================================
echo "🌐 4. Cloud Router & NAT Gateway"
echo "───────────────────────────────"
ROUTERS=$(gcloud compute routers list \
  --project=$PROJECT_ID \
  --format="value(name)" 2>/dev/null || echo "")

if [ -z "$ROUTERS" ]; then
  echo "✅ No cloud routers found"
else
  echo "ℹ️  Found routers:"
  for ROUTER in $ROUTERS; do
    ROUTER_REGION=$(gcloud compute routers describe $ROUTER \
      --project=$PROJECT_ID \
      --format="value(region.basename())" 2>/dev/null)
    
    NATS=$(gcloud compute routers nats list \
      --router=$ROUTER \
      --region=$ROUTER_REGION \
      --project=$PROJECT_ID \
      --format="value(name)" 2>/dev/null || echo "")
    
    echo "   - $ROUTER (region: $ROUTER_REGION)"
    
    if [ -z "$NATS" ]; then
      echo "     ✅ No NAT gateways attached (router is free)"
    else
      echo "     ⚠️  NAT gateways found:"
      for NAT in $NATS; do
        echo "        - $NAT"
        echo "          💰 Cost: ~$5-10/month"
        ISSUES_FOUND=$((ISSUES_FOUND + 1))
        POTENTIAL_SAVINGS=$((POTENTIAL_SAVINGS + 7))
      done
    fi
  done
fi
echo ""

# ============================================
# 5. Check Reserved IP Addresses
# ============================================
echo "📍 5. Reserved IP Addresses"
echo "───────────────────────────────"
IPS=$(gcloud compute addresses list \
  --project=$PROJECT_ID \
  --format="value(name,status,region)" 2>/dev/null || echo "")

if [ -z "$IPS" ]; then
  echo "✅ No reserved IP addresses"
else
  echo "ℹ️  Found IP addresses:"
  while IFS=$'\t' read -r NAME STATUS REGION; do
    echo "   - $NAME ($STATUS) in $REGION"
    
    if [ "$STATUS" = "RESERVED" ]; then
      echo "     ⚠️  WARNING: IP reserved but not in use"
      echo "     💰 Cost: ~$0.01-0.10/hour = $7-75/month"
      ISSUES_FOUND=$((ISSUES_FOUND + 1))
      POTENTIAL_SAVINGS=$((POTENTIAL_SAVINGS + 3))
    fi
  done <<< "$IPS"
fi
echo ""

# ============================================
# 6. Check Artifact Registry Storage
# ============================================
echo "📦 6. Artifact Registry Images"
echo "───────────────────────────────"
REPO="perundhu"
IMAGE_COUNT=$(gcloud artifacts docker images list \
  $REGION-docker.pkg.dev/$PROJECT_ID/$REPO \
  --format="value(package)" 2>/dev/null | wc -l || echo "0")

if [ "$IMAGE_COUNT" -gt 0 ]; then
  OLD_IMAGE_COUNT=$(gcloud artifacts docker images list \
    $REGION-docker.pkg.dev/$PROJECT_ID/$REPO \
    --filter="createTime<-P30D" \
    --format="value(package)" 2>/dev/null | wc -l || echo "0")
  
  echo "   Total images: $IMAGE_COUNT"
  echo "   Images >30 days old: $OLD_IMAGE_COUNT"
  
  if [ "$OLD_IMAGE_COUNT" -gt 10 ]; then
    echo "   ⚠️  Many old images accumulating"
    echo "   💰 Cost: ~$0.10/GB storage = ~$1-5/month"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
    POTENTIAL_SAVINGS=$((POTENTIAL_SAVINGS + 2))
  else
    echo "   ✅ Image retention looks good"
  fi
else
  echo "   ✅ No images or repo not found"
fi
echo ""

# ============================================
# Summary
# ============================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 AUDIT SUMMARY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Issues found: $ISSUES_FOUND"
echo "Potential monthly savings: ~\$$POTENTIAL_SAVINGS"
echo ""

if [ $ISSUES_FOUND -eq 0 ]; then
  echo "✨ Infrastructure looks optimized!"
  echo "Expected preprod cost: ~$2-3/month"
else
  echo "⚠️  Recommended Actions:"
  echo ""
  echo "1. Stop database if running:"
  echo "   gcloud sql instances patch perundhu-preprod-mysql-us \\"
  echo "     --activation-policy=NEVER --project=$PROJECT_ID"
  echo ""
  echo "2. Delete Cloud Run services when not testing:"
  echo "   gh workflow run preprod-cleanup.yml"
  echo ""
  echo "3. Delete VPC Connector (not needed):"
  echo "   gcloud compute networks vpc-access connectors delete <name> \\"
  echo "     --region=$REGION --project=$PROJECT_ID --quiet"
  echo ""
  echo "4. Or run all cleanup:"
  echo "   ./scripts/cleanup-preprod-costs.sh"
fi
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
