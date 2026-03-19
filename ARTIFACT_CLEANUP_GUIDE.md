# Artifact Registry Cleanup Guide

## Overview

Artifact Registry can accumulate hundreds of old Docker images, costing $0.10/GB/month in storage.
This guide explains how to automate cleanup to keep costs low.

## Current Retention Policy

| Environment | Keep Count | Reasoning | Est. Cost |
|-------------|------------|-----------|-----------|
| **PreProd** | 7 images | Frequent deploys, only need recent builds | ~$1-2/month |
| **Production** | 15 images | Need rollback history (~2 weeks) | ~$3-5/month |

## Automated Weekly Cleanup

A GitHub Actions workflow runs every Sunday at 2 AM EST to clean old images:

**File:** `.github/workflows/artifact-cleanup.yml`

- **Preprod**: Keeps newest 7 images
- **Production**: Keeps newest 15 images
- **Dry run by default**: Shows what would be deleted without actually deleting

## Manual Cleanup

### Via GitHub Actions UI

1. Go to **Actions** → **Artifact Registry - Cleanup Old Images**
2. Click **Run workflow**
3. Choose:
   - **Environment**: preprod / production / both
   - **Keep count**: Number of images to keep (default: 7)
   - **Dry run**: `true` (safe preview) or `false` (actually delete)
4. Check the summary to see what was/would be deleted

### Example: Clean PreProd (Dry Run)

```bash
gh workflow run artifact-cleanup.yml \
  -f environment=preprod \
  -f keep_count=7 \
  -f dry_run=true
```

### Example: Clean Both Environments (Actually Delete)

```bash
gh workflow run artifact-cleanup.yml \
  -f environment=both \
  -f keep_count=7 \
  -f dry_run=false
```

## Cost Savings Estimation

### Current Issue (Example)
- PreProd artifact registry: **200 GB** = **$20/month**
- Old images from months of testing accumulating

### After Cleanup
- PreProd with 7 images: **10-20 GB** = **$1-2/month**
- **Savings: ~$18-19/month**

### Overall Impact
If preprod was showing $40/month and production $21/month:
- PreProd after cleanup: **~$5-8/month** (artifact cleanup + services off)
- Production stays: **~$17-21/month**
- **New total: ~$22-29/month** ✅ Within budget

## Rollback Safety

### PreProd (7 images)
✅ **Safe** - You deploy frequently for testing, 7 recent builds is plenty

### Production (15 images)
✅ **Safe** - Assuming ~1 deploy/day, this gives you:
- 15 days of rollback history
- Can rollback 2+ weeks if needed
- Keeps stable releases

### If You Need More History

**Option 1:** Tag important releases before cleanup
```bash
# Tag current production version
gcloud artifacts docker tags create \
  us-central1-docker.pkg.dev/perundhu-prod-001/perundhu/backend:stable-2026-03-19 \
  --project=perundhu-prod-001
```

**Option 2:** Increase keep count for production
- Edit workflow: Change `KEEP_COUNT=15` to `KEEP_COUNT=30`
- Trade-off: ~$3-5/month more storage cost

## Best Practices

### 1. Run Dry Run First
Always preview what will be deleted:
```bash
gh workflow run artifact-cleanup.yml \
  -f environment=both \
  -f dry_run=true
```

### 2. Tag Major Releases
Before cleanup, tag important versions:
```bash
# Backend v1.0.31
gcloud artifacts docker tags create \
  us-central1-docker.pkg.dev/perundhu-prod-001/perundhu/backend:v1.0.31

# Frontend v1.0.31  
gcloud artifacts docker tags create \
  us-central1-docker.pkg.dev/perundhu-prod-001/perundhu/frontend:v1.0.31
```

### 3. Weekly Automation
The workflow runs automatically every Sunday - no action needed.

### 4. Monitor Storage
Check Artifact Registry size:
```bash
gcloud artifacts repositories describe perundhu \
  --project=perundhu-prod-001 \
  --location=us-central1 \
  --format="value(sizeBytes)"
```

## Troubleshooting

### Workflow Fails - Permission Denied
**Cause:** GitHub Actions service account needs permissions

**Fix:**
```bash
# Grant Artifact Registry Admin role
gcloud projects add-iam-policy-binding perundhu-prod-001 \
  --member="serviceAccount:github-actions@perundhu-prod-001.iam.gserviceaccount.com" \
  --role="roles/artifactregistry.admin"
```

### Images Not Deleting
**Cause 1:** Images are currently in use by Cloud Run
- Wait for Cloud Run to release the image
- Or, create new deployment first

**Cause 2:** Images have tags that prevent deletion
- Check tags: `gcloud artifacts docker tags list ...`
- Remove tags first if needed

### Storage Not Decreasing
**Cause:** Deleted images leave cached layers

**Fix:** Wait 24-48 hours for GCP to fully garbage collect storage

## Emergency: Delete Entire Repository

**⚠️ WARNING:** This deletes ALL images. Only use if registry is severely bloated.

```bash
# PreProd
gcloud artifacts repositories delete perundhu \
  --location=us-central1 \
  --project=astute-strategy-406601 \
  --quiet

# Recreate empty
gcloud artifacts repositories create perundhu \
  --location=us-central1 \
  --repository-format=docker \
  --project=astute-strategy-406601
```

After this, redeploy services to rebuild images.

## Cost Impact Summary

| Scenario | PreProd Cost | Prod Cost | Total |
|----------|--------------|-----------|-------|
| **Before Cleanup** | $40 (bloated registry + idle services) | $21 | $61 |
| **After Cleanup** | $5-8 (7 images + services off) | $17-21 (15 images) | $22-29 ✅ |
| **Monthly Savings** | ~$32-35 | ~$0-4 | ~$32-39 |

---

**Next Steps:**

1. Run dry-run to see what would be deleted:
   ```bash
   gh workflow run artifact-cleanup.yml -f environment=both -f dry_run=true
   ```

2. Review the summary in GitHub Actions

3. Run actual cleanup if satisfied:
   ```bash
   gh workflow run artifact-cleanup.yml -f environment=both -f dry_run=false
   ```

4. Monitor billing over next 2-3 days to confirm savings
