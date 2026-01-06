# GCP Artifact Registry Permission Error - Fix Guide

## Problem
The GitHub Actions pipeline is failing with:
```
denied: Permission "artifactregistry.repositories.uploadArtifacts" denied on resource 
"projects/perundhu-prod-001/locations/asia-south1/repositories/perundhu"
```

This occurs in both production and preprod deployment pipelines when trying to push Docker images to Google Artifact Registry.

## Root Cause
The GCP service account used by GitHub Actions (via `GCPSECRET`) lacks the required IAM roles to push images to Artifact Registry.

## Solution

### Option 1: Add IAM Roles to Service Account (Recommended)

If you have access to the GCP project, run these commands:

```bash
# Get your GCP project ID
PROJECT_ID="perundhu-prod-001"

# Get the service account email
SERVICE_ACCOUNT="$(gcloud config get-value project-id)-github@$(gcloud config get-value project-id).iam.gserviceaccount.com"
# Or use the exact service account email if you know it

# Add required roles
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SERVICE_ACCOUNT" \
  --role="roles/artifactregistry.writer"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SERVICE_ACCOUNT" \
  --role="roles/artifactregistry.reader"

# Or grant admin access for all artifact registry operations
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SERVICE_ACCOUNT" \
  --role="roles/artifactregistry.admin"

# Verify the roles were added
gcloud projects get-iam-policy $PROJECT_ID \
  --flatten="bindings[].members" \
  --filter="bindings.members:serviceAccount:*github*"
```

### Option 2: Use Workload Identity Federation (Advanced)

If you want to avoid storing service account keys in GitHub Secrets:

```bash
# 1. Create a GitHub Actions identity provider
gcloud iam workload-identity-pools create "github-actions" \
  --project="perundhu-prod-001" \
  --location="global" \
  --display-name="GitHub Actions"

# 2. Create workload identity provider
gcloud iam workload-identity-pools providers create-oidc "github-provider" \
  --project="perundhu-prod-001" \
  --location="global" \
  --workload-identity-pool="github-actions" \
  --display-name="GitHub Provider" \
  --attribute-mapping="google.subject=assertion.sub,assertion.aud=assertion.aud" \
  --issuer-uri="https://token.actions.githubusercontent.com"

# 3. Grant the service account permissions to be impersonated
gcloud iam service-accounts add-iam-policy-binding \
  "github-actions@perundhu-prod-001.iam.gserviceaccount.com" \
  --project="perundhu-prod-001" \
  --role="roles/iam.workloadIdentityUser" \
  --member="principalSet://iam.googleapis.com/projects/perundhu-prod-001/locations/global/workloadIdentityPools/github-actions/attribute.aud/cmadhava85/perundhu"
```

Then update the workflow to use Workload Identity instead of GCPSECRET.

### Option 3: Alternative - Use Artifact Registry Service Account Authentication

Create a service account specifically for Artifact Registry operations:

```bash
# Create a dedicated service account for artifact registry
gcloud iam service-accounts create github-ar-push \
  --project="perundhu-prod-001" \
  --display-name="GitHub Artifact Registry Push"

# Grant minimal required roles
gcloud projects add-iam-policy-binding "perundhu-prod-001" \
  --member="serviceAccount:github-ar-push@perundhu-prod-001.iam.gserviceaccount.com" \
  --role="roles/artifactregistry.writer"

# Create and download a key
gcloud iam service-accounts keys create ar-key.json \
  --iam-account="github-ar-push@perundhu-prod-001.iam.gserviceaccount.com"

# Convert to base64 and add to GitHub Secrets as GCPSECRET
cat ar-key.json | base64 -w 0
```

## Verification Steps

After applying the fix:

1. **Check Service Account Roles**
```bash
gcloud projects get-iam-policy perundhu-prod-001 \
  --flatten="bindings[].members" \
  --filter="bindings.members:serviceAccount:*github*" \
  --format="table(bindings.role)"
```

2. **Test Artifact Registry Access**
```bash
# Authenticate as the service account
gcloud auth activate-service-account --key-file=key.json

# Configure Docker
gcloud auth configure-docker asia-south1-docker.pkg.dev

# Test push
docker push asia-south1-docker.pkg.dev/perundhu-prod-001/perundhu/test:latest
```

3. **Re-run Failed Pipeline**
   - Go to GitHub Actions
   - Find the failed workflow
   - Click "Re-run all jobs"

## Required IAM Roles

For a GitHub Actions service account to push to Artifact Registry, it needs:

| Role | Permissions |
|------|-------------|
| `roles/artifactregistry.writer` | Upload & manage artifacts |
| `roles/artifactregistry.reader` | Read artifact metadata |
| `roles/storage.objectViewer` | View object metadata |

Or use the broader role:
- `roles/artifactregistry.admin` - Full Artifact Registry control

## Troubleshooting

### Still getting permission denied?

1. **Verify the service account has the roles:**
   ```bash
   gcloud projects get-iam-policy perundhu-prod-001 \
     --flatten="bindings[].members" \
     --format="value(bindings.role)" \
     --filter="bindings.members:serviceAccount:ACCOUNT_EMAIL"
   ```

2. **Check if GCPSECRET is up to date:**
   - The secret might be cached or outdated
   - Delete and recreate the `GCPSECRET` in GitHub Secrets
   - Re-run the workflow

3. **Verify Artifact Registry exists:**
   ```bash
   gcloud artifacts repositories list --project=perundhu-prod-001
   ```

4. **Check service account credentials:**
   ```bash
   # Decode GCPSECRET from GitHub
   echo "$GCPSECRET_BASE64" | base64 -d | jq .
   
   # Verify it's valid JSON and has service_account_email field
   ```

### Repository doesn't exist?

Create the Artifact Registry repository:

```bash
gcloud artifacts repositories create perundhu \
  --repository-format=docker \
  --location=asia-south1 \
  --project=perundhu-prod-001
```

## Prevention

To prevent this in the future:

1. **Document service account requirements** in onboarding docs
2. **Use Workload Identity Federation** instead of service account keys
3. **Implement GitHub secret rotation** policies
4. **Add IAM policy checks** to your infrastructure-as-code

## References

- [Artifact Registry Documentation](https://cloud.google.com/artifact-registry/docs)
- [IAM Roles for Artifact Registry](https://cloud.google.com/artifact-registry/docs/access-control)
- [GitHub Actions + GCP Authentication](https://github.com/google-github-actions/auth)
- [Workload Identity Federation Setup](https://cloud.google.com/docs/authentication/workload-identity-federation)

---

**Status**: Follow Option 1 for the quickest fix. Contact DevOps for implementation.
