# Custom Domain Setup for Perundhu

This guide explains how to set up vanity URLs (custom domains) for your Cloud Run services.

## Prerequisites

1. **Domain ownership**: You must own `perundhu.app` domain
2. **Domain verification**: Verify domain with Google Cloud
3. **DNS access**: Ability to add DNS records

## Domain Structure

### PreProd Environment
- Frontend: `preprod.perundhu.app`
- Backend API: `api-preprod.perundhu.app`

### Production Environment
- Frontend: `www.perundhu.app` or `perundhu.app`
- Backend API: `api.perundhu.app`

## Setup Steps

### 1. Verify Domain with Google Cloud

```bash
# Navigate to Google Cloud Console
# https://console.cloud.google.com/appengine/settings/domains

# Or use gcloud CLI
gcloud domains verify perundhu.app
```

This will give you a TXT record to add to your DNS.

### 2. Add DNS Verification Record

Add the verification TXT record to your domain's DNS settings:

```
Type: TXT
Name: @
Value: google-site-verification=<your-verification-code>
TTL: 3600
```

### 3. Map Custom Domain to Cloud Run

#### Option A: Using gcloud CLI (Recommended)

```bash
# Map backend domain
gcloud run domain-mappings create \
  --service perundhu-backend-preprod \
  --domain api-preprod.perundhu.app \
  --region asia-south1 \
  --project astute-strategy-406601

# Map frontend domain
gcloud run domain-mappings create \
  --service perundhu-frontend-preprod \
  --domain preprod.perundhu.app \
  --region asia-south1 \
  --project astute-strategy-406601
```

#### Option B: Using Terraform (Automated)

The Terraform configuration is already set up. Just apply:

```bash
cd infrastructure/terraform/environments/preprod

# Initialize if not done
terraform init

# Plan to see changes
terraform plan \
  -var="project_id=astute-strategy-406601" \
  -var="notification_email=your-email@example.com"

# Apply changes
terraform apply \
  -var="project_id=astute-strategy-406601" \
  -var="notification_email=your-email@example.com"
```

### 4. Add DNS Records

After mapping, Google Cloud will provide you with DNS records. Add these to your domain:

#### For `api-preprod.perundhu.app`:

```
Type: CNAME
Name: api-preprod
Value: ghs.googlehosted.com
TTL: 3600
```

#### For `preprod.perundhu.app`:

```
Type: CNAME
Name: preprod
Value: ghs.googlehosted.com
TTL: 3600
```

**Note**: If using root domain (`perundhu.app`), use A records instead:

```
Type: A
Name: @
Value: 216.239.32.21
       216.239.34.21
       216.239.36.21
       216.239.38.21
TTL: 3600
```

### 5. Verify Domain Mapping Status

```bash
# Check backend mapping
gcloud run domain-mappings describe \
  --domain api-preprod.perundhu.app \
  --region asia-south1

# Check frontend mapping
gcloud run domain-mappings describe \
  --domain preprod.perundhu.app \
  --region asia-south1
```

### 6. Update Frontend Environment Variables

After DNS propagation, update the preprod environment file:

**frontend/.env.preprod**:
```env
VITE_API_URL=https://api-preprod.perundhu.app
VITE_API_BASE_URL=https://api-preprod.perundhu.app
```

### 7. Redeploy Frontend

Trigger a new deployment to use the custom domain:

```bash
# Trigger CI/CD pipeline
git commit --allow-empty -m "chore: trigger deployment for custom domain"
git push

# Or manually trigger workflow from GitHub Actions
```

## SSL/TLS Certificates

Google Cloud automatically provisions and manages SSL certificates for custom domains. This process can take **15-60 minutes**.

### Check Certificate Status

```bash
gcloud run domain-mappings describe \
  --domain api-preprod.perundhu.app \
  --region asia-south1 \
  --format="value(status.conditions)"
```

Look for `CertificateProvisioned: True`

## DNS Propagation

DNS changes can take **24-48 hours** to fully propagate globally, but typically complete within **1-2 hours**.

### Check DNS Propagation

```bash
# Check if DNS is resolving
dig preprod.perundhu.app
dig api-preprod.perundhu.app

# Test with specific DNS server
dig @8.8.8.8 preprod.perundhu.app
```

## Troubleshooting

### Domain not verified

```bash
# List verified domains
gcloud domains list-user-verified

# Re-verify if needed
gcloud domains verify perundhu.app
```

### Certificate not provisioning

1. Verify DNS records are correct
2. Wait 15-60 minutes for automatic provisioning
3. Check Cloud Run domain mapping status
4. Ensure domain verification is complete

### 404 or connection errors

1. Verify DNS records point to `ghs.googlehosted.com`
2. Check Cloud Run service is running
3. Ensure IAM permissions allow `allUsers` access
4. Wait for DNS propagation (1-2 hours)

### Force Certificate Renewal

```bash
# Delete and recreate mapping
gcloud run domain-mappings delete \
  --domain api-preprod.perundhu.app \
  --region asia-south1

# Wait 5 minutes, then recreate
gcloud run domain-mappings create \
  --service perundhu-backend-preprod \
  --domain api-preprod.perundhu.app \
  --region asia-south1
```

## Production Setup

For production, use the same steps but with production domains:

```bash
# Production backend
gcloud run domain-mappings create \
  --service perundhu-backend-production \
  --domain api.perundhu.app \
  --region asia-south1

# Production frontend
gcloud run domain-mappings create \
  --service perundhu-frontend-production \
  --domain www.perundhu.app \
  --region asia-south1
```

### Root Domain Redirect

To redirect `perundhu.app` → `www.perundhu.app`, set up DNS:

```
Type: A
Name: @
Value: 216.239.32.21 (and other Google IPs)

Type: CNAME
Name: www
Value: ghs.googlehosted.com
```

Then configure Cloud Run to handle redirects in nginx or application code.

## Monitoring

After setup, monitor:

1. **SSL certificate expiry**: Auto-renewed by Google
2. **DNS health**: Use monitoring tools
3. **Traffic**: Cloud Monitoring for request metrics

## Quick Commands Reference

```bash
# List all domain mappings
gcloud run domain-mappings list --region asia-south1

# Describe specific mapping
gcloud run domain-mappings describe --domain preprod.perundhu.app --region asia-south1

# Delete mapping
gcloud run domain-mappings delete --domain preprod.perundhu.app --region asia-south1

# List Cloud Run services
gcloud run services list --region asia-south1
```

## Next Steps

1. ✅ Verify domain ownership
2. ✅ Map domains using gcloud or Terraform
3. ✅ Add DNS records (CNAME)
4. ⏳ Wait for SSL certificate provisioning (15-60 min)
5. ⏳ Wait for DNS propagation (1-2 hours)
6. ✅ Update frontend environment variables
7. ✅ Deploy and test

---

**Note**: Changes to custom domains require redeployment of the frontend to update the hardcoded API URLs in the built JavaScript bundles.
