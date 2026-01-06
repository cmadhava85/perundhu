# GitHub Actions Authentication Fix - Complete Setup

## ✅ Status: READY TO IMPLEMENT

The GCP service account and IAM permissions have been set up successfully.

## What Was Done

1. **✅ Created GitHub Actions Service Account**
   - Service Account Email: `github-actions@perundhu-prod-001.iam.gserviceaccount.com`
   - Display Name: "GitHub Actions CI/CD"

2. **✅ Granted Required IAM Roles**
   - `roles/artifactregistry.writer` - Push Docker images
   - `roles/artifactregistry.reader` - Read artifact metadata
   - `roles/run.admin` - Deploy to Cloud Run
   - `roles/cloudsql.admin` - Manage database migrations
   - `roles/secretmanager.secretAccessor` - Access secrets

3. **✅ Created Service Account Key**
   - Key ID: `eb4d25a178ffd42e989539bfdd67eb5de2bb9e96`
   - Key Type: JSON (standard for GitHub Actions)

## Next Steps: Update GitHub Secrets

### Step 1: Get the Encoded Key

The service account key has been created and encoded to base64. To retrieve it:

```bash
# On your local machine, run:
gcloud iam service-accounts keys list \
  --iam-account=github-actions@perundhu-prod-001.iam.gserviceaccount.com \
  --format="get(name)" \
  --project=perundhu-prod-001 | head -1

# Then download the key and encode it:
gcloud iam service-accounts keys create ./key.json \
  --iam-account=github-actions@perundhu-prod-001.iam.gserviceaccount.com \
  --project=perundhu-prod-001

# Convert to base64
cat key.json | base64 -w 0 | pbcopy  # macOS
# or
cat key.json | base64 -w 0  # Linux (copy manually)
```

### Step 2: Update GitHub Secrets

1. Go to: https://github.com/cmadhava85/perundhu/settings/secrets/actions

2. **Update the existing `GCPSECRET` secret:**
   - Click "Update"
   - Paste the base64-encoded key from Step 1
   - Click "Update secret"

3. **Verify the secret was updated:**
   - The "Last updated" timestamp should be recent

### Step 3: Re-run Failed Pipelines

Once the secret is updated:

1. Go to: https://github.com/cmadhava85/perundhu/actions
2. Find the failed workflow (CD Pipeline or Docker Build)
3. Click the workflow name
4. Click "Re-run all jobs"

The pipeline should now succeed.

## Verification Checklist

After updating the secret, verify everything is working:

```bash
# 1. Test authentication
gcloud auth activate-service-account --key-file=key.json

# 2. Configure Docker
gcloud auth configure-docker asia-south1-docker.pkg.dev

# 3. Check artifact registry access
gcloud artifacts repositories list --project=perundhu-prod-001

# 4. Test push (dry-run)
docker pull alpine:latest
docker tag alpine:latest asia-south1-docker.pkg.dev/perundhu-prod-001/perundhu/test:v0.0.1
docker push asia-south1-docker.pkg.dev/perundhu-prod-001/perundhu/test:v0.0.1
```

## Troubleshooting

### Still Getting Permission Denied?

1. **Clear GitHub Actions cache:**
   - The old credentials might be cached
   - Try deleting the secret and recreating it with exact same name

2. **Verify service account has roles:**
   ```bash
   gcloud projects get-iam-policy perundhu-prod-001 \
     --flatten="bindings[].members" \
     --filter="bindings.members:serviceAccount:github-actions*" \
     --format="table(bindings.role)"
   ```

3. **Check artifact registry repository:**
   ```bash
   gcloud artifacts repositories describe perundhu \
     --repository-format=docker \
     --location=asia-south1 \
     --project=perundhu-prod-001
   ```

### Key Rotation

If you need to rotate the key:

```bash
# 1. List existing keys
gcloud iam service-accounts keys list \
  --iam-account=github-actions@perundhu-prod-001.iam.gserviceaccount.com

# 2. Create a new key
gcloud iam service-accounts keys create new-key.json \
  --iam-account=github-actions@perundhu-prod-001.iam.gserviceaccount.com

# 3. Delete the old key (use the KEY_ID from step 1)
gcloud iam service-accounts keys delete KEY_ID \
  --iam-account=github-actions@perundhu-prod-001.iam.gserviceaccount.com

# 4. Update GitHub secret with new key (base64 encoded)
```

## Service Account Details

| Property | Value |
|----------|-------|
| Email | github-actions@perundhu-prod-001.iam.gserviceaccount.com |
| Project ID | perundhu-prod-001 |
| Service Account ID | github-actions |
| Display Name | GitHub Actions CI/CD |
| Status | Active |

### Assigned Roles

- `roles/artifactregistry.writer` - Write to Artifact Registry
- `roles/artifactregistry.reader` - Read from Artifact Registry
- `roles/run.admin` - Full Cloud Run admin access
- `roles/cloudsql.admin` - Full Cloud SQL admin access
- `roles/secretmanager.secretAccessor` - Access secrets from Secret Manager

## Security Best Practices

1. **Rotate keys quarterly** - Set calendar reminder
2. **Monitor key usage** - Check GCP audit logs regularly
3. **Limit permissions** - Only grant necessary roles
4. **Use Workload Identity** - Eventually migrate to Workload Identity Federation for key-less auth
5. **Audit service account** - Review bindings regularly

## Related Documentation

- [Google Cloud Service Accounts](https://cloud.google.com/iam/docs/service-accounts)
- [Artifact Registry IAM Roles](https://cloud.google.com/artifact-registry/docs/access-control)
- [GitHub Actions + GCP Auth](https://github.com/google-github-actions/auth)

---

**Created**: January 5, 2026
**Status**: ✅ Ready for Implementation
**Next Action**: Update GitHub Secrets with the encoded key
