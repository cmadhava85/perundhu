#!/bin/bash

# Production Infrastructure Cost Optimization Script
# Run this script to apply immediate cost-saving optimizations

set -e

PROJECT_ID="perundhu-prod-001"
REGION="asia-south1"

echo "============================================"
echo "Production Cost Optimization Script"
echo "============================================"
echo ""
echo "This script will apply the following optimizations:"
echo "1. Reduce backend Cloud Run resources (2 CPU → 1 CPU, 2Gi → 1Gi)"
echo "2. Cap frontend max instances (20 → 10)"
echo "3. Reduce Cloud SQL backup retention (7 days → 3 days)"
echo "4. Backend requires rebuild with new HikariCP settings"
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    echo "Aborted."
    exit 1
fi

echo ""
echo "============================================"
echo "Step 1: Updating Backend Cloud Run Service"
echo "============================================"
echo "Reducing CPU: 2 → 1"
echo "Reducing Memory: 2Gi → 1Gi"
echo ""

gcloud run services update perundhu-production-backend \
  --project=$PROJECT_ID \
  --region=$REGION \
  --cpu=1 \
  --memory=1Gi \
  --quiet

echo "✅ Backend resources updated"
echo ""

echo "============================================"
echo "Step 2: Updating Frontend Max Instances"
echo "============================================"
echo "Reducing max instances: 20 → 10"
echo ""

gcloud run services update perundhu-production-frontend \
  --project=$PROJECT_ID \
  --region=$REGION \
  --max-instances=10 \
  --quiet

echo "✅ Frontend max instances capped at 10"
echo ""

echo "============================================"
echo "Step 3: Optimizing Cloud SQL Backups"
echo "============================================"
echo "Reducing backup retention: 7 days → 3 days"
echo "Reducing transaction log retention: 7 days → 3 days"
echo ""

gcloud sql instances patch perundhu-production-mysql \
  --project=$PROJECT_ID \
  --backup-retention-count=3 \
  --transaction-log-retention-days=3 \
  --quiet

echo "✅ Cloud SQL backup retention reduced"
echo ""

echo "============================================"
echo "Step 4: Backend Rebuild Required"
echo "============================================"
echo "⚠️  IMPORTANT: The HikariCP connection pool size has been reduced in"
echo "    application-production.properties (50 → 10, 30 → 8)"
echo ""
echo "You must rebuild and redeploy the backend for this change to take effect:"
echo ""
echo "    cd backend"
echo "    docker build --platform linux/amd64 \\"
echo "      -t asia-south1-docker.pkg.dev/$PROJECT_ID/perundhu-images/backend:1.0.3 \\"
echo "      -t asia-south1-docker.pkg.dev/$PROJECT_ID/perundhu-images/backend:latest ."
echo "    docker push asia-south1-docker.pkg.dev/$PROJECT_ID/perundhu-images/backend:1.0.3"
echo "    docker push asia-south1-docker.pkg.dev/$PROJECT_ID/perundhu-images/backend:latest"
echo ""
echo "    gcloud run services update perundhu-production-backend \\"
echo "      --region=$REGION \\"
echo "      --image=asia-south1-docker.pkg.dev/$PROJECT_ID/perundhu-images/backend:1.0.3"
echo ""

echo "============================================"
echo "Summary of Applied Optimizations"
echo "============================================"
echo "✅ Backend: 2 CPU → 1 CPU, 2Gi → 1Gi"
echo "✅ Frontend: Max instances 20 → 10"
echo "✅ Cloud SQL: Backup retention 7 → 3 days"
echo "⏳ Backend HikariCP: Awaiting rebuild (pool 50→10)"
echo ""
echo "Estimated Monthly Savings: \$8-15"
echo ""
echo "============================================"
echo "Optional: Disable Binary Logs (if no replica)"
echo "============================================"
echo "If you don't plan to use read replicas, you can disable binary logs:"
echo ""
echo "    gcloud sql instances patch perundhu-production-mysql \\"
echo "      --project=$PROJECT_ID \\"
echo "      --no-enable-bin-log"
echo ""
echo "⚠️  WARNING: Disabling binary logs removes point-in-time recovery capability."
echo "    Only disable if you're okay with backup-only recovery."
echo ""
echo "Additional Savings: ~\$0.50/month + reduced I/O costs"
echo ""

echo "============================================"
echo "Monitoring Recommendations"
echo "============================================"
echo ""
echo "After applying optimizations, monitor these metrics for 1 week:"
echo ""
echo "1. Cloud SQL Active Connections:"
echo "   - Should be < 50 total"
echo "   - Run: gcloud sql operations list --instance=perundhu-production-mysql"
echo ""
echo "2. Backend Response Times:"
echo "   - Should be < 500ms p95"
echo "   - Check in Cloud Console: Cloud Run → perundhu-production-backend → Metrics"
echo ""
echo "3. Backend Error Rates:"
echo "   - Should be < 0.1%"
echo "   - Check in Cloud Logging or Cloud Run metrics"
echo ""
echo "4. Backend CPU/Memory Usage:"
echo "   - CPU should be < 70%"
echo "   - Memory should be < 80%"
echo "   - If consistently high, consider reverting CPU/memory changes"
echo ""

echo "============================================"
echo "Rollback Commands (if issues occur)"
echo "============================================"
echo ""
echo "# Restore backend resources:"
echo "gcloud run services update perundhu-production-backend \\"
echo "  --region=$REGION \\"
echo "  --cpu=2 \\"
echo "  --memory=2Gi"
echo ""
echo "# Restore frontend max instances:"
echo "gcloud run services update perundhu-production-frontend \\"
echo "  --region=$REGION \\"
echo "  --max-instances=20"
echo ""
echo "# Restore Cloud SQL backups:"
echo "gcloud sql instances patch perundhu-production-mysql \\"
echo "  --backup-retention-count=7 \\"
echo "  --transaction-log-retention-days=7"
echo ""

echo "============================================"
echo "✅ Cost Optimization Complete!"
echo "============================================"
echo ""
echo "Next steps:"
echo "1. Rebuild and redeploy backend with new HikariCP settings"
echo "2. Monitor metrics for 1 week"
echo "3. Review full report: PRODUCTION_COST_OPTIMIZATION_REPORT.md"
echo "4. Consider Phase 2 optimization (load balancer removal) next month"
echo ""
