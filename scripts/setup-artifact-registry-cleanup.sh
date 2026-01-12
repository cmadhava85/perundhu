#!/bin/bash
# ============================================
# Artifact Registry Cleanup Policy Setup
# ============================================
# COST OPTIMIZATION: Delete old container images to save storage costs
# Estimated Savings: $5-10/month

set -e

PROJECT_ID="astute-strategy-406601"
LOCATION="asia-south1"
REPOSITORY="perundhu"

echo "🗑️  Setting up Artifact Registry cleanup policy..."
echo "Repository: ${REPOSITORY}"
echo "Location: ${LOCATION}"
echo "Project: ${PROJECT_ID}"
echo ""

# Create cleanup policy: Keep only last 5 images
gcloud artifacts repositories set-cleanup-policies ${REPOSITORY} \
  --project=${PROJECT_ID} \
  --location=${LOCATION} \
  --policy='{
    "name": "keep-recent-images",
    "action": "KEEP",
    "mostRecentVersions": {
      "keepCount": 5
    }
  }' \
  --dry-run

echo ""
echo "⚠️  Dry run complete. Review the above output."
echo ""
read -p "Apply cleanup policy? (y/N): " confirm

if [[ "$confirm" != "y" && "$confirm" != "Y" ]]; then
    echo "❌ Aborted. No changes made."
    exit 0
fi

# Apply cleanup policy
gcloud artifacts repositories set-cleanup-policies ${REPOSITORY} \
  --project=${PROJECT_ID} \
  --location=${LOCATION} \
  --policy='{
    "name": "keep-recent-images",
    "action": "KEEP",
    "mostRecentVersions": {
      "keepCount": 5
    }
  }'

echo ""
echo "✅ Cleanup policy applied successfully!"
echo ""
echo "📊 Current repository info:"
gcloud artifacts repositories describe ${REPOSITORY} \
  --project=${PROJECT_ID} \
  --location=${LOCATION}

echo ""
echo "💡 Old images will be automatically deleted within 24 hours."
echo "💰 Expected savings: $5-10/month in storage costs"
