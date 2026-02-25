#!/bin/bash
# Clean Up Old asia-south1 Resources
# Execute ONLY after 7+ days of successful operation in us-central1

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "=========================================="
echo "asia-south1 Resource Cleanup Script"
echo "=========================================="
echo ""
echo -e "${RED}WARNING: This will DELETE old resources in asia-south1!${NC}"
echo ""
echo "Prerequisites:"
echo "  ✓ Production stable for 7+ days in us-central1"
echo "  ✓ No errors or issues in new environment"
echo "  ✓ Cost reduced to \$18-28/month range"
echo "  ✓ Load balancer already deleted"
echo "  ✓ Final backup completed"
echo ""

# Confirmation prompt
read -p "Has it been 7+ days since migration? (yes/no): " CONFIRM
if [ "$CONFIRM" != "yes" ]; then
    echo "Please wait until 7 days have passed for safety."
    exit 0
fi

echo ""
read -p "Type 'CLEANUP-ASIA-SOUTH1' to confirm deletion: " CONFIRM2
if [ "$CONFIRM2" != "CLEANUP-ASIA-SOUTH1" ]; then
    echo "Confirmation text doesn't match. Aborted for safety."
    exit 0
fi

echo ""
echo -e "${BLUE}Starting cleanup process...${NC}"
echo ""

# ===========================================
# Section 1: Create Final Safety Backup
# ===========================================
echo "=========================================="
echo "Section 1: Creating Final Safety Backup"
echo "=========================================="
echo ""

# Check if old production database still exists
if gcloud sql instances describe perundhu-production-mysql --project=perundhu-prod-001 &>/dev/null; then
    echo "Creating final backup from perundhu-production-mysql (asia-south1)..."
    
    BACKUP_FILE="final-backup-asia-south1-$(date +%Y%m%d-%H%M%S).sql"
    
    gcloud sql export sql perundhu-production-mysql \
      "gs://perundhu-prod-001-db-backups/$BACKUP_FILE" \
      --database=RECOVER_YOUR_DATA \
      --project=perundhu-prod-001 \
      --quiet
    
    echo -e "${GREEN}✓ Final backup created: $BACKUP_FILE${NC}"
    echo "Waiting 10 seconds for backup to complete..."
    sleep 10
else
    echo -e "${YELLOW}⚠ Old production database not found (may already be deleted)${NC}"
fi

echo ""

# ===========================================
# Section 2: Delete Cloud Run Services
# ===========================================
echo "=========================================="
echo "Section 2: Deleting Cloud Run Services"
echo "=========================================="
echo ""

# Production backend (asia-south1)
echo "Deleting production backend (asia-south1)..."
if gcloud run services describe perundhu-production-backend --region=asia-south1 --project=perundhu-prod-001 &>/dev/null; then
    gcloud run services delete perundhu-production-backend \
      --region=asia-south1 \
      --project=perundhu-prod-001 \
      --quiet
    echo -e "${GREEN}✓ Production backend deleted${NC}"
else
    echo -e "${YELLOW}⚠ Production backend not found${NC}"
fi

# Production frontend (asia-south1)
echo "Deleting production frontend (asia-south1)..."
if gcloud run services describe perundhu-production-frontend --region=asia-south1 --project=perundhu-prod-001 &>/dev/null; then
    gcloud run services delete perundhu-production-frontend \
      --region=asia-south1 \
      --project=perundhu-prod-001 \
      --quiet
    echo -e "${GREEN}✓ Production frontend deleted${NC}"
else
    echo -e "${YELLOW}⚠ Production frontend not found${NC}"
fi

# Preprod backend (asia-south1)
echo "Deleting preprod backend (asia-south1)..."
if gcloud run services describe perundhu-backend-preprod --region=asia-south1 --project=astute-strategy-406601 &>/dev/null; then
    gcloud run services delete perundhu-backend-preprod \
      --region=asia-south1 \
      --project=astute-strategy-406601 \
      --quiet
    echo -e "${GREEN}✓ Preprod backend deleted${NC}"
else
    echo -e "${YELLOW}⚠ Preprod backend not found${NC}"
fi

# Preprod frontend (asia-south1)
echo "Deleting preprod frontend (asia-south1)..."
if gcloud run services describe perundhu-frontend-preprod --region=asia-south1 --project=astute-strategy-406601 &>/dev/null; then
    gcloud run services delete perundhu-frontend-preprod \
      --region=asia-south1 \
      --project=astute-strategy-406601 \
      --quiet
    echo -e "${GREEN}✓ Preprod frontend deleted${NC}"
else
    echo -e "${YELLOW}⚠ Preprod frontend not found${NC}"
fi

echo ""

# ===========================================
# Section 3: Delete Cloud SQL Instances
# ===========================================
echo "=========================================="
echo "Section 3: Deleting Cloud SQL Instances"
echo "=========================================="
echo ""

# Production database (asia-south1)
echo "Deleting production Cloud SQL (perundhu-production-mysql)..."
if gcloud sql instances describe perundhu-production-mysql --project=perundhu-prod-001 &>/dev/null; then
    gcloud sql instances delete perundhu-production-mysql \
      --project=perundhu-prod-001 \
      --quiet
    echo -e "${GREEN}✓ Production Cloud SQL deleted${NC}"
    echo "Waiting for deletion to complete (30 seconds)..."
    sleep 30
else
    echo -e "${YELLOW}⚠ Production Cloud SQL not found${NC}"
fi

# Preprod database (asia-south1)
echo "Deleting preprod Cloud SQL (perundhu-preprod-mysql)..."
if gcloud sql instances describe perundhu-preprod-mysql --project=astute-strategy-406601 &>/dev/null; then
    gcloud sql instances delete perundhu-preprod-mysql \
      --project=astute-strategy-406601 \
      --quiet
    echo -e "${GREEN}✓ Preprod Cloud SQL deleted${NC}"
    sleep 30
else
    echo -e "${YELLOW}⚠ Preprod Cloud SQL not found${NC}"
fi

echo ""

# ===========================================
# Section 4: Delete Artifact Registries
# ===========================================
echo "=========================================="
echo "Section 4: Deleting Artifact Registries"
echo "=========================================="
echo ""

# Production artifact registry (asia-south1)
echo "Deleting production artifact registry (perundhu-images)..."
if gcloud artifacts repositories describe perundhu-images --location=asia-south1 --project=perundhu-prod-001 &>/dev/null; then
    gcloud artifacts repositories delete perundhu-images \
      --location=asia-south1 \
      --project=perundhu-prod-001 \
      --quiet
    echo -e "${GREEN}✓ Production artifact registry deleted${NC}"
else
    echo -e "${YELLOW}⚠ Production artifact registry not found${NC}"
fi

# Preprod artifact registry (asia-south1) - check if exists
echo "Checking for preprod artifact registry in asia-south1..."
PREPROD_REPOS=$(gcloud artifacts repositories list --location=asia-south1 --project=astute-strategy-406601 --format="value(name)" 2>/dev/null || echo "")

if [ -n "$PREPROD_REPOS" ]; then
    echo "Found preprod repositories: $PREPROD_REPOS"
    while IFS= read -r repo; do
        if [ -n "$repo" ]; then
            echo "Deleting repository: $repo"
            gcloud artifacts repositories delete "$repo" \
              --location=asia-south1 \
              --project=astute-strategy-406601 \
              --quiet 2>/dev/null || echo "Failed to delete $repo"
        fi
    done <<< "$PREPROD_REPOS"
    echo -e "${GREEN}✓ Preprod artifact registries deleted${NC}"
else
    echo -e "${YELLOW}⚠ No preprod artifact registries found in asia-south1${NC}"
fi

echo ""

# ===========================================
# Section 5: Delete VPC Connectors
# ===========================================
echo "=========================================="
echo "Section 5: Deleting VPC Connectors"
echo "=========================================="
echo ""

# Check production VPC connectors
echo "Checking for production VPC connectors in asia-south1..."
PROD_CONNECTORS=$(gcloud compute networks vpc-access connectors list --region=asia-south1 --project=perundhu-prod-001 --format="value(name)" 2>/dev/null || echo "")

if [ -n "$PROD_CONNECTORS" ]; then
    echo "Found production VPC connectors: $PROD_CONNECTORS"
    while IFS= read -r connector; do
        if [ -n "$connector" ]; then
            echo "Deleting connector: $connector"
            gcloud compute networks vpc-access connectors delete "$connector" \
              --region=asia-south1 \
              --project=perundhu-prod-001 \
              --quiet 2>/dev/null || echo "Failed to delete $connector"
        fi
    done <<< "$PROD_CONNECTORS"
    echo -e "${GREEN}✓ Production VPC connectors deleted${NC}"
else
    echo -e "${GREEN}✓ No production VPC connectors found in asia-south1${NC}"
fi

# Check preprod VPC connectors
echo "Checking for preprod VPC connectors in asia-south1..."
PREPROD_CONNECTORS=$(gcloud compute networks vpc-access connectors list --region=asia-south1 --project=astute-strategy-406601 --format="value(name)" 2>/dev/null || echo "")

if [ -n "$PREPROD_CONNECTORS" ]; then
    echo "Found preprod VPC connectors: $PREPROD_CONNECTORS"
    while IFS= read -r connector; do
        if [ -n "$connector" ]; then
            echo "Deleting connector: $connector"
            gcloud compute networks vpc-access connectors delete "$connector" \
              --region=asia-south1 \
              --project=astute-strategy-406601 \
              --quiet 2>/dev/null || echo "Failed to delete $connector"
        fi
    done <<< "$PREPROD_CONNECTORS"
    echo -e "${GREEN}✓ Preprod VPC connectors deleted${NC}"
else
    echo -e "${GREEN}✓ No preprod VPC connectors found in asia-south1${NC}"
fi

echo ""

# ===========================================
# Section 6: Verification
# ===========================================
echo "=========================================="
echo "Section 6: Verification"
echo "=========================================="
echo ""

echo "Checking for remaining resources in asia-south1..."
echo ""

REMAINING=0

# Check Cloud Run services
echo "Cloud Run Services (asia-south1):"
PROD_RUN=$(gcloud run services list --region=asia-south1 --project=perundhu-prod-001 --format="value(name)" 2>/dev/null || echo "")
PREPROD_RUN=$(gcloud run services list --region=asia-south1 --project=astute-strategy-406601 --format="value(name)" 2>/dev/null || echo "")

if [ -z "$PROD_RUN" ] && [ -z "$PREPROD_RUN" ]; then
    echo -e "  ${GREEN}✓ No Cloud Run services${NC}"
else
    echo -e "  ${RED}✗ Some Cloud Run services still exist${NC}"
    [ -n "$PROD_RUN" ] && echo "    Production: $PROD_RUN"
    [ -n "$PREPROD_RUN" ] && echo "    Preprod: $PREPROD_RUN"
    REMAINING=1
fi

# Check Cloud SQL instances
echo "Cloud SQL Instances (asia-south1):"
PROD_SQL=$(gcloud sql instances list --filter="region:asia-south1" --project=perundhu-prod-001 --format="value(name)" 2>/dev/null || echo "")
PREPROD_SQL=$(gcloud sql instances list --filter="region:asia-south1" --project=astute-strategy-406601 --format="value(name)" 2>/dev/null || echo "")

if [ -z "$PROD_SQL" ] && [ -z "$PREPROD_SQL" ]; then
    echo -e "  ${GREEN}✓ No Cloud SQL instances${NC}"
else
    echo -e "  ${RED}✗ Some Cloud SQL instances still exist${NC}"
    [ -n "$PROD_SQL" ] && echo "    Production: $PROD_SQL"
    [ -n "$PREPROD_SQL" ] && echo "    Preprod: $PREPROD_SQL"
    REMAINING=1
fi

# Check Artifact Registries
echo "Artifact Registries (asia-south1):"
PROD_AR=$(gcloud artifacts repositories list --location=asia-south1 --project=perundhu-prod-001 --format="value(name)" 2>/dev/null || echo "")
PREPROD_AR=$(gcloud artifacts repositories list --location=asia-south1 --project=astute-strategy-406601 --format="value(name)" 2>/dev/null || echo "")

if [ -z "$PROD_AR" ] && [ -z "$PREPROD_AR" ]; then
    echo -e "  ${GREEN}✓ No artifact registries${NC}"
else
    echo -e "  ${RED}✗ Some artifact registries still exist${NC}"
    [ -n "$PROD_AR" ] && echo "    Production: $PROD_AR"
    [ -n "$PREPROD_AR" ] && echo "    Preprod: $PREPROD_AR"
    REMAINING=1
fi

echo ""

# ===========================================
# Final Summary
# ===========================================
if [ $REMAINING -eq 0 ]; then
    echo -e "${GREEN}=========================================="
    echo "✓ Cleanup Completed Successfully!"
    echo "==========================================${NC}"
    echo ""
    echo "All asia-south1 resources have been deleted."
    echo ""
    echo "Next steps:"
    echo "1. Verify cost reduction on next billing cycle"
    echo "2. Expected monthly cost: \$18-28"
    echo "3. Keep monitoring for another 30 days"
    echo ""
    echo "Active infrastructure (us-central1):"
    echo "  • Production Backend: https://perundhu-production-backend-202290873942.us-central1.run.app"
    echo "  • Production Frontend: https://perundhu-production-frontend-202290873942.us-central1.run.app"
    echo "  • Preprod Backend: https://perundhu-backend-preprod-1032721240281.us-central1.run.app"
    echo "  • Preprod Frontend: https://perundhu-frontend-preprod-1032721240281.us-central1.run.app"
    echo ""
    echo "Public URLs:"
    echo "  • https://www.perundhu.com"
    echo "  • https://www.perundhu.com/api (nginx proxy to backend)"
    echo ""
    echo "✅ Migration Complete! 🎉"
else
    echo -e "${YELLOW}=========================================="
    echo "⚠ Some resources still exist"
    echo "==========================================${NC}"
    echo ""
    echo "Please manually check and delete remaining resources."
    echo ""
    echo "Check commands:"
    echo "  gcloud run services list --region=asia-south1 --project=perundhu-prod-001"
    echo "  gcloud sql instances list --filter='region:asia-south1' --project=perundhu-prod-001"
    echo "  gcloud artifacts repositories list --location=asia-south1 --project=perundhu-prod-001"
fi

echo ""
echo "=========================================="
