#!/bin/bash

# Cleanup unused GCP services to reduce costs
# Run this script to remove all unused resources found in cost audit

set -e

PREPROD_PROJECT="astute-strategy-406601"
PROD_PROJECT="perundhu-prod-001"

echo "======================================"
echo "Cleaning up unused GCP services"
echo "======================================"

# 1. Delete unused Pub/Sub topics in preprod (NO CODE USES THESE)
echo ""
echo "1. Deleting 6 Pub/Sub topics in preprod..."
for topic in \
  perundhu-preprod-bus-locations \
  perundhu-preprod-image-processing \
  perundhu-preprod-dead-letter \
  perundhu-preprod-analytics \
  perundhu-preprod-notifications \
  perundhu-preprod-route-contributions
do
  echo "  Deleting $topic..."
  gcloud pubsub topics delete "$topic" \
    --project="$PREPROD_PROJECT" \
    --quiet || echo "    Failed or already deleted"
done

# 2. Delete old Container Registry images in production (using Artifact Registry now)
echo ""
echo "2. Deleting old Container Registry images in production..."
echo "  Listing images to delete..."
gcloud container images list-tags gcr.io/$PROD_PROJECT/perundhu-production-backend \
  --format="get(digest)" \
  --project="$PROD_PROJECT" | while read digest; do
  echo "    Deleting digest $digest..."
  gcloud container images delete "gcr.io/$PROD_PROJECT/perundhu-production-backend@sha256:$digest" \
    --quiet \
    --project="$PROD_PROJECT" || echo "      Failed or already deleted"
done

# 3. Disable unused APIs in both projects
echo ""
echo "3. Disabling unused APIs to prevent accidental usage..."

# Production disabled APIs
echo "  Production:"
for api in \
  bigquery.googleapis.com \
  bigqueryconnection.googleapis.com \
  bigquerydatapolicy.googleapis.com \
  bigquerydatatransfer.googleapis.com \
  bigquerymigration.googleapis.com \
  bigqueryreservation.googleapis.com \
  bigquerystorage.googleapis.com \
  datastore.googleapis.com \
  pubsub.googleapis.com \
  containerregistry.googleapis.com
do
  echo "    Disabling $api..."
  gcloud services disable "$api" \
    --project="$PROD_PROJECT" \
    --force \
    --quiet 2>&1 | grep -v "ERROR" || echo "      Skipped"
done

# Preprod disabled APIs
echo ""
echo "  Preprod:"
for api in \
  bigquery.googleapis.com \
  bigqueryconnection.googleapis.com \
  bigquerydatapolicy.googleapis.com \
  bigquerydatatransfer.googleapis.com \
  bigquerymigration.googleapis.com \
  bigqueryreservation.googleapis.com \
  bigquerystorage.googleapis.com \
  bigqueryunified.googleapis.com \
  cloudfunctions.googleapis.com \
  container.googleapis.com \
  containerfilesystem.googleapis.com \
  containerregistry.googleapis.com \
  datastore.googleapis.com \
  gkebackup.googleapis.com \
  memcache.googleapis.com \
  redis.googleapis.com \
  pubsub.googleapis.com \
  networkconnectivity.googleapis.com
do
  echo "    Disabling $api..."
  gcloud services disable "$api" \
    --project="$PREPROD_PROJECT" \
    --force \
    --quiet 2>&1 | grep -v "ERROR" || echo "      Skipped"
done

echo ""
echo "======================================"
echo "Cleanup complete!"
echo "======================================"
echo ""
echo "Expected savings:"
echo "  - Pub/Sub topics: ~\$1-3/month"
echo "  - Container Registry storage: ~\$0.50-1/month"
echo "  - API enablement overhead: ~\$0.10/month"
echo "  - Total: ~\$1.60-4.10/month"
echo ""
echo "Note: DNS API kept enabled (needed for perundhu.com domain)"
echo "Note: Compute API kept enabled (needed by Cloud Run)"
