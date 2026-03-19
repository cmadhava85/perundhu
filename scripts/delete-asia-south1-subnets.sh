#!/bin/bash

# Delete default subnets in asia-south1 (unused region from migration)
# These don't cost money but good housekeeping to prevent accidental deployments

set -e

PROD_PROJECT="perundhu-prod-001"
PREPROD_PROJECT="astute-strategy-406601"
REGION="asia-south1"

echo "======================================"
echo "Cleaning up asia-south1 resources"
echo "======================================"

# Production
echo ""
echo "1. Deleting default subnet in production ($PROD_PROJECT)..."
if gcloud compute networks subnets delete default \
  --region="$REGION" \
  --project="$PROD_PROJECT" \
  --quiet; then
  echo "  ✅ Deleted: default subnet in $REGION (production)"
else
  echo "  ⚠️  Already deleted or not found (production)"
fi

# Preprod
echo ""
echo "2. Deleting default subnet in preprod ($PREPROD_PROJECT)..."
if gcloud compute networks subnets delete default \
  --region="$REGION" \
  --project="$PREPROD_PROJECT" \
  --quiet; then
  echo "  ✅ Deleted: default subnet in $REGION (preprod)"
else
  echo "  ⚠️  Already deleted or not found (preprod)"
fi

echo ""
echo "======================================"
echo "asia-south1 cleanup complete!"
echo "======================================"
echo ""
echo "Note: Default subnets don't cost money by themselves,"
echo "but removing them prevents accidental deployments to asia-south1."
echo ""
echo "All services now restricted to us-central1 region only."
