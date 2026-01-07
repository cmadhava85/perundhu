# Terraform Pipeline IAM Permission Fix

## Problem
The Terraform pipeline fails with:
```
ERROR: (gcloud.storage.buckets.create) HTTPError 403: perundhu@astute-strategy-406601.iam.gserviceaccount.com 
does not have storage.buckets.create access to the Google Cloud project.
```

## Root Cause
The `GCPSECRET` GitHub secret contains credentials for `perundhu@astute-strategy-406601.iam.gserviceaccount.com`, which:
- Belongs to the old **preprod project** (`astute-strategy-406601`)
- Lacks permissions in the **production project** (`perundhu-prod-001`)
- Cannot create GCS buckets in the production project

## Solution

### Step 1: Create Service Account Key
Generate a key for the correct production service account:

```bash
gcloud iam service-accounts keys create /tmp/gha-key.json \
  --iam-account=cloud-run-sa@perundhu-prod-001.iam.gserviceaccount.com \
  --project=perundhu-prod-001
```

### Step 2: Grant Required Permissions
Add necessary IAM roles to the service account:

```bash
# Storage Admin role (includes bucket.create permissions)
gcloud projects add-iam-policy-binding perundhu-prod-001 \
  --member="serviceAccount:cloud-run-sa@perundhu-prod-001.iam.gserviceaccount.com" \
  --role="roles/storage.admin"

# Editor role (for Terraform resources)
gcloud projects add-iam-policy-binding perundhu-prod-001 \
  --member="serviceAccount:cloud-run-sa@perundhu-prod-001.iam.gserviceaccount.com" \
  --role="roles/editor"
```

### Step 3: Update GitHub Secret
Base64 encode the key and update `GCPSECRET`:

```bash
# Display and copy the key (for manual update)
cat /tmp/gha-key.json | base64

# Or pipe to clipboard (macOS)
cat /tmp/gha-key.json | base64 | pbcopy
```

**In GitHub:**
1. Go to **Settings → Secrets and variables → Actions**
2. Find and edit the `GCPSECRET` secret
3. Replace the entire value with the new base64-encoded key
4. Click **Update secret**

### Step 4: Clean Up
```bash
rm /tmp/gha-key.json
```

## Verification
After updating the secret, the pipeline should:
1. ✅ Successfully authenticate with GCP
2. ✅ Create the Terraform state bucket (if it doesn't exist)
3. ✅ Run `terraform init` and `terraform plan` without permission errors

## Files Updated
- ✅ `.github/workflows/terraform.yml` - Added explicit project IDs and error handling

## Related
- Service Account: `cloud-run-sa@perundhu-prod-001.iam.gserviceaccount.com`
- Project: `perundhu-prod-001`
- Bucket: `gs://perundhu-prod-001-tf-state-1767644488`
