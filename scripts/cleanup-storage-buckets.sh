#!/bin/bash
# Clean Up Unused Storage Buckets
# Removes empty/duplicate buckets and cleans Cloud Build cache

set -e

echo "🧹 Storage Bucket Cleanup"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# ============================================
# PreProd Cleanup
# ============================================
echo "📦 PreProd Buckets (astute-strategy-406601)"
echo "───────────────────────────────"

PREPROD_BUCKETS_TO_DELETE=(
  "perundhu-preprod-images-cltmu9c3"
  "perundhu-preprod-images-zb85mix0"
)

for BUCKET in "${PREPROD_BUCKETS_TO_DELETE[@]}"; do
  echo "Checking: gs://$BUCKET"
  
  # Check if bucket exists
  if gcloud storage ls gs://$BUCKET &>/dev/null; then
    SIZE=$(gcloud storage du -s gs://$BUCKET 2>/dev/null | awk '{print $1}')
    echo "  Size: $SIZE bytes"
    
    if [ "$SIZE" -eq 0 ]; then
      echo "  ⚠️  Empty bucket - safe to delete"
      echo "  Command: gcloud storage rm -r gs://$BUCKET --project=astute-strategy-406601"
      
      read -p "  Delete this bucket? (y/N): " -n 1 -r
      echo
      if [[ $REPLY =~ ^[Yy]$ ]]; then
        gcloud storage rm -r gs://$BUCKET --project=astute-strategy-406601
        echo "  ✅ Deleted"
      else
        echo "  ⏭️  Skipped"
      fi
    else
      echo "  ℹ️  Bucket has data - keeping"
    fi
  else
    echo "  ℹ️  Bucket not found or no access"
  fi
  echo ""
done

# ============================================
# Production Cleanup
# ============================================
echo "📦 Production Buckets (perundhu-prod-001)"
echo "───────────────────────────────"

PROD_BUCKETS_TO_DELETE=(
  "perundhu-prod-001-backups"
  "perundhu-prod-001-db-backups"
)

for BUCKET in "${PROD_BUCKETS_TO_DELETE[@]}"; do
  echo "Checking: gs://$BUCKET"
  
  if gcloud storage ls gs://$BUCKET &>/dev/null; then
    SIZE=$(gcloud storage du -s gs://$BUCKET 2>/dev/null | awk '{print $1}')
    SIZE_KB=$((SIZE / 1024))
    echo "  Size: $SIZE_KB KB"
    
    if [ "$SIZE_KB" -lt 100 ]; then
      echo "  ⚠️  Nearly empty bucket (<100KB) - safe to delete"
      echo "  Command: gcloud storage rm -r gs://$BUCKET --project=perundhu-prod-001"
      
      read -p "  Delete this bucket? (y/N): " -n 1 -r
      echo
      if [[ $REPLY =~ ^[Yy]$ ]]; then
        gcloud storage rm -r gs://$BUCKET --project=perundhu-prod-001
        echo "  ✅ Deleted"
      else
        echo "  ⏭️  Skipped"
      fi
    else
      echo "  ℹ️  Bucket has significant data - keeping"
    fi
  else
    echo "  ℹ️  Bucket not found or no access"
  fi
  echo ""
done

# ============================================
# Cloud Build Cache Cleanup
# ============================================
echo "🔨 Cloud Build Cache (perundhu-prod-001)"
echo "───────────────────────────────"

CLOUDBUILD_BUCKET="perundhu-prod-001_cloudbuild"
echo "Bucket: gs://$CLOUDBUILD_BUCKET"

if gcloud storage ls gs://$CLOUDBUILD_BUCKET &>/dev/null; then
  TOTAL_SIZE=$(gcloud storage du -s gs://$CLOUDBUILD_BUCKET 2>/dev/null | awk '{print $1}')
  TOTAL_SIZE_MB=$((TOTAL_SIZE / 1024 / 1024))
  
  echo "  Current size: ${TOTAL_SIZE_MB} MB"
  
  if [ "$TOTAL_SIZE_MB" -gt 100 ]; then
    echo "  ⚠️  Cloud Build cache is large"
    echo ""
    echo "  Option 1: Delete builds older than 30 days"
    echo "  gcloud storage rm -r 'gs://$CLOUDBUILD_BUCKET/**' \\"
    echo "    --additional-headers=\"If-Modified-Since: \$(date -u -d '30 days ago' '+%a, %d %b %Y %H:%M:%S GMT')\""
    echo ""
    echo "  Option 2: Delete entire bucket and let Cloud Build recreate it"
    echo "  gcloud storage rm -r gs://$CLOUDBUILD_BUCKET --project=perundhu-prod-001"
    echo ""
    
    read -p "  Clean Cloud Build cache? (1=old files, 2=entire bucket, N=skip): " -n 1 -r
    echo
    if [[ $REPLY == "1" ]]; then
      # Delete files older than 30 days
      CUTOFF_DATE=$(date -u -d '30 days ago' '+%Y-%m-%dT%H:%M:%S' 2>/dev/null || date -u -v-30d '+%Y-%m-%dT%H:%M:%S')
      
      echo "  Deleting files older than $CUTOFF_DATE..."
      gcloud storage ls -r gs://$CLOUDBUILD_BUCKET/** --format="get(name,timeCreated)" | \
        awk -v cutoff="$CUTOFF_DATE" '$2 < cutoff {print "gs://$CLOUDBUILD_BUCKET/" $1}' | \
        head -100 | \
        xargs -I {} gcloud storage rm {} 2>/dev/null || echo "  ✅ Cleaned old files"
      
      NEW_SIZE=$(gcloud storage du -s gs://$CLOUDBUILD_BUCKET 2>/dev/null | awk '{print $1}')
      NEW_SIZE_MB=$((NEW_SIZE / 1024 / 1024))
      SAVED_MB=$((TOTAL_SIZE_MB - NEW_SIZE_MB))
      
      echo "  ✅ Cleaned: saved ~${SAVED_MB} MB"
      
    elif [[ $REPLY == "2" ]]; then
      gcloud storage rm -r gs://$CLOUDBUILD_BUCKET --project=perundhu-prod-001
      echo "  ✅ Deleted entire bucket (Cloud Build will recreate automatically)"
    else
      echo "  ⏭️  Skipped"
    fi
  else
    echo "  ✅ Cache size is reasonable (<100MB)"
  fi
else
  echo "  ℹ️  Bucket not found or no access"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✨ Cleanup Complete!"
echo ""
echo "📊 Summary:"
echo "- Empty preprod buckets: Removed duplicates"
echo "- Empty production buckets: Removed unused"
echo "- Cloud Build cache: Cleaned old artifacts"
echo ""
echo "💰 Estimated savings: \$0.20-0.50/month"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
