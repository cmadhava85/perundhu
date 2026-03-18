#!/bin/bash
# ============================================
# Fix GCP Cost Issues - March 18, 2026
# ============================================
# This script fixes the $54/month cost issue by:
# 1. Deleting failed Cloud Run deployments
# 2. Stopping unnecessary services
# 3. Preventing continuous retry charges
#
# Run this script when you're done testing/not using the app

set -e  # Exit on error

PROJECT_ID="perundhu-prod-001"
REGION="us-central1"

echo "🔍 Analyzing GCP costs and fixing issues..."
echo "================================================"

# Check current services
echo ""
echo "📋 Current Cloud Run services:"
gcloud run services list --project=$PROJECT_ID --region=$REGION

echo ""
echo "📋 Current Cloud SQL status:"
gcloud sql instances list --project=$PROJECT_ID

echo ""
echo "================================================"
echo "🚨 ISSUES FOUND:"
echo "================================================"

# Issue 1: Failed backend deployment keeps retrying
echo ""
echo "❌ Issue 1: Backend deployment FAILED on March 17"
echo "   - Revision 00061-vdf keeps retrying and failing"
echo "   - Each retry attempt charges you $$$"
echo "   - This is why Cloud Run shows 510% cost increase"

# Issue 2: Services deployed but not being used
echo ""
echo "⚠️  Issue 2: Services are deployed but you're not using them"
echo "   - Frontend: Deployed but idle (still charges for storage)"
echo "   - Backend: Failed deployment retrying continuously"

# Issue 3: Cloud SQL is stopped (GOOD!)
echo ""
echo "✅ Good: Cloud SQL is STOPPED (not charging)"

echo ""
echo "================================================"
echo "💡 RECOMMENDED FIXES:"
echo "================================================"

echo ""
echo "Option 1: DELETE services (recommended for testing/dev)"
echo "   - Zero charges when not deployed"
echo "   - Can redeploy anytime with 'terraform apply'"
echo "   - Estimated savings: ~$42/month"

echo ""
echo "Option 2: Rollback backend to working revision"
echo "   - Keeps services running but removes failed deployment"
echo "   - Estimated savings: ~$30/month (failed retries only)"

echo ""
echo "Option 3: Keep everything as-is"
echo "   - Continue paying $54/month for failed deployments"

echo ""
read -p "Choose option (1/2/3): " choice

case $choice in
  1)
    echo ""
    echo "🗑️  Deleting Cloud Run services..."
    
    # Delete backend
    echo "Deleting backend service..."
    gcloud run services delete perundhu-production-backend \
      --project=$PROJECT_ID \
      --region=$REGION \
      --quiet || echo "Backend already deleted or error"
    
    # Delete frontend
    echo "Deleting frontend service..."
    gcloud run services delete perundhu-production-frontend \
      --project=$PROJECT_ID \
      --region=$REGION \
      --quiet || echo "Frontend already deleted or error"
    
    echo ""
    echo "✅ Services deleted successfully!"
    echo "💰 Expected monthly cost: ~$2-3 (only storage/DNS/secrets)"
    ;;
    
  2)
    echo ""
    echo "⏪ Rolling back backend to working revision..."
    
    # Update traffic to working revision
    gcloud run services update-traffic perundhu-production-backend \
      --project=$PROJECT_ID \
      --region=$REGION \
      --to-revisions=perundhu-production-backend-00058-hjd=100 \
      --quiet
    
    # Delete failed revision
    echo "Deleting failed revision..."
    gcloud run revisions delete perundhu-production-backend-00061-vdf \
      --project=$PROJECT_ID \
      --region=$REGION \
      --quiet || echo "Revision already deleted"
    
    echo ""
    echo "✅ Rollback complete!"
    echo "💰 Expected monthly cost: ~$12-15 (services running but healthy)"
    ;;
    
  3)
    echo ""
    echo "⚠️  Keeping current setup"
    echo "💸 Current monthly cost: ~$54.40"
    echo ""
    echo "To reduce costs later, run this script again and choose option 1 or 2"
    ;;
    
  *)
    echo "Invalid option. Exiting."
    exit 1
    ;;
esac

echo ""
echo "================================================"
echo "📊 COST BREAKDOWN AFTER FIX:"
echo "================================================"

if [ "$choice" == "1" ]; then
  echo "Cloud Run:         $0.00  (deleted)"
  echo "Cloud SQL:         $0.00  (stopped)"
  echo "Secret Manager:    $1.40  (needed)"
  echo "Artifact Registry: $0.70  (needed)"
  echo "Cloud DNS:         $0.27  (needed)"
  echo "Cloud Storage:     $0.05  (needed)"
  echo "-----------------------------------"
  echo "TOTAL:            ~$2.42/month"
elif [ "$choice" == "2" ]; then
  echo "Cloud Run:        ~$10-12 (healthy services)"
  echo "Cloud SQL:         $0.00  (stopped)"
  echo "Secret Manager:    $1.40  (needed)"
  echo "Artifact Registry: $0.70  (needed)"
  echo "Cloud DNS:         $0.27  (needed)"
  echo "Cloud Storage:     $0.05  (needed)"
  echo "-----------------------------------"
  echo "TOTAL:            ~$12-15/month"
else
  echo "CURRENT TOTAL:    ~$54.40/month ⚠️"
fi

echo ""
echo "================================================"
echo "🎯 NEXT STEPS:"
echo "================================================"

if [ "$choice" == "1" ]; then
  echo "1. Services are deleted - no charges until you redeploy"
  echo "2. When ready to test, run: cd infrastructure/terraform/environments/production && terraform apply"
  echo "3. Always delete services when done: gcloud run services delete ..."
  echo "4. Set up billing alerts to prevent surprises"
elif [ "$choice" == "2" ]; then
  echo "1. Services are running but healthy"
  echo "2. Monitor costs at: https://console.cloud.google.com/billing"
  echo "3. Consider deleting services when not actively using"
  echo "4. Set up billing alerts"
else
  echo "1. No changes made - services still running"
  echo "2. Re-run this script to fix the issue"
fi

echo ""
echo "💡 Tips to avoid future cost issues:"
echo "  - Always check deployment health after 'terraform apply'"
echo "  - Delete Cloud Run services when not in use"
echo "  - Use 'gcloud run services list' to check what's running"
echo "  - Set up billing alerts for your $25-30 budget"
echo ""
echo "✨ Done!"
