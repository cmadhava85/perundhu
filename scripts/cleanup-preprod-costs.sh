#!/bin/bash
# Cleanup PreProd Resources to Stop Billing
# Run this to bring preprod costs back to ~$2-3/month

set -e

PROJECT_ID="astute-strategy-406601"
REGION="us-central1"
DB_INSTANCE="perundhu-preprod-mysql-us"

echo "🧹 Cleaning up PreProd resources to reduce costs..."
echo ""

# 1. Stop Cloud SQL Database
echo "📊 Checking database status..."
DB_STATUS=$(gcloud sql instances describe $DB_INSTANCE \
  --project=$PROJECT_ID \
  --format="value(settings.activationPolicy)" 2>/dev/null || echo "NOT_FOUND")

if [ "$DB_STATUS" = "ALWAYS" ]; then
  echo "⚠️  Database is RUNNING (costing ~$18/month)"
  echo "Stopping database..."
  gcloud sql instances patch $DB_INSTANCE \
    --project=$PROJECT_ID \
    --activation-policy=NEVER \
    --quiet
  echo "✅ Database stopped (activation-policy=NEVER)"
elif [ "$DB_STATUS" = "NEVER" ]; then
  echo "✅ Database already stopped"
else
  echo "ℹ️  Database not found: $DB_INSTANCE"
fi

echo ""

# 2. Delete Cloud Run Services
echo "🚀 Checking Cloud Run services..."
SERVICES=$(gcloud run services list \
  --project=$PROJECT_ID \
  --region=$REGION \
  --format="value(name)" 2>/dev/null || echo "")

if [ -z "$SERVICES" ]; then
  echo "✅ No Cloud Run services found"
else
  echo "Found services:"
  echo "$SERVICES"
  echo ""
  for SERVICE in $SERVICES; do
    echo "Deleting $SERVICE..."
    gcloud run services delete $SERVICE \
      --project=$PROJECT_ID \
      --region=$REGION \
      --quiet
    echo "✅ Deleted $SERVICE"
  done
fi

echo ""

# 3. Clean up old Artifact Registry images
echo "📦 Checking Artifact Registry..."
REPO="perundhu"
OLD_IMAGES=$(gcloud artifacts docker images list \
  $REGION-docker.pkg.dev/$PROJECT_ID/$REPO \
  --format="value(package)" \
  --filter="createTime<-P30D" 2>/dev/null || echo "")

if [ -z "$OLD_IMAGES" ]; then
  echo "✅ No old images to clean (< 30 days)"
else
  echo "⚠️  Found old images (>30 days)"
  IMAGE_COUNT=$(echo "$OLD_IMAGES" | wc -l)
  echo "   $IMAGE_COUNT images to delete"
  # Don't auto-delete - just report
  echo "   Run manually:"
  echo "   gcloud artifacts docker images delete \\"
  echo "     $REGION-docker.pkg.dev/$PROJECT_ID/$REPO/<package>:<tag> --quiet"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✨ PreProd Cleanup Complete!"
echo ""
echo "Expected costs after cleanup:"
echo "  • Cloud SQL (stopped): $0/month"
echo "  • Cloud Run (deleted): $0/month"
echo "  • Artifact Registry: ~$1-2/month"
echo "  • DNS/Storage: ~$1/month"
echo "  ────────────────────────"
echo "  TOTAL: ~$2-3/month ✅"
echo ""
echo "To deploy preprod again:"
echo "  gh workflow run preprod-on-demand.yml"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
