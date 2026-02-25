# Migration Completion Guide - us-central1

## ✅ Completed Steps

### Infrastructure Migration (100% Complete)
- ✅ Cloud SQL instances created in us-central1
  - Production: `perundhu-production-mysql-us` (1.2GB data imported)
  - Preprod: `perundhu-preprod-mysql-us` (fresh database)
- ✅ Artifact Registries created in us-central1
- ✅ All Docker images built and pushed (4 images)
- ✅ All 4 Cloud Run services deployed successfully
  - Production Backend: https://perundhu-production-backend-202290873942.us-central1.run.app
  - Production Frontend: https://perundhu-production-frontend-202290873942.us-central1.run.app
  - Preprod Backend: https://perundhu-backend-preprod-1032721240281.us-central1.run.app
  - Preprod Frontend: https://perundhu-frontend-preprod-1032721240281.us-central1.run.app
- ✅ Domain mappings created
  - www.perundhu.com → perundhu-production-frontend
  - api.perundhu.com → perundhu-production-backend

---

## 📋 Step 1: Update DNS Records (Required - User Action)

### Login to Your Domain Registrar
Go to your domain registrar (GoDaddy, Namecheap, Cloudflare, etc.) and update DNS records.

### Before Making Changes
1. **Lower TTL to 300 seconds** (5 minutes) for quick rollback
2. **Document current DNS configuration** (take screenshots)
3. **Note current IP addresses** for rollback if needed

### DNS Changes Required

#### Delete These Records (if they exist):
```
Type: A
Name: www
Value: <old IP>

Type: A  
Name: api
Value: <old IP>
```

#### Add These CNAME Records:
```
Record 1:
  Type:  CNAME
  Name:  www
  Value: ghs.googlehosted.com.
  TTL:   300 (temporary for testing)

Record 2:
  Type:  CNAME
  Name:  api
  Value: ghs.googlehosted.com.
  TTL:   300 (temporary for testing)
```

**Important**: Make sure to include the trailing dot in `ghs.googlehosted.com.`

### Verify DNS Propagation
Run these commands every 5 minutes until you see CNAME records:

```bash
# Check DNS propagation
dig www.perundhu.com
dig api.perundhu.com

# Should show CNAME records pointing to ghs.googlehosted.com
```

**Expected output:**
```
www.perundhu.com.   300   IN   CNAME   ghs.googlehosted.com.
api.perundhu.com.   300   IN   CNAME   ghs.googlehosted.com.
```

---

## 🧪 Step 2: Test Domain Mappings (After DNS Propagation)

### Wait for SSL Certificate Provisioning
SSL certificates auto-provision after DNS propagates (~15 minutes).

### Check SSL Certificate Status

```bash
# Check domain mapping status
gcloud beta run domain-mappings describe \
  --domain=www.perundhu.com \
  --region=us-central1 \
  --project=perundhu-prod-001

gcloud beta run domain-mappings describe \
  --domain=api.perundhu.com \
  --region=us-central1 \
  --project=perundhu-prod-001
```

Look for `status.certificateStatus: ACTIVE`

### Test HTTPS Access

```bash
# Test frontend with verbose output
curl -I https://www.perundhu.com

# Should return: HTTP/2 200
# Look for: x-cloud-trace-context (confirms Cloud Run)

# Test backend API
curl -I https://api.perundhu.com/api/health

# Test API from frontend (CORS check)
curl -X GET https://api.perundhu.com/api/locations/autocomplete?query=Chennai \
  -H "Origin: https://www.perundhu.com" \
  -v
```

### Browser Testing Checklist

Open https://www.perundhu.com in browser:

- [ ] Website loads correctly (no SSL warnings)
- [ ] Search functionality works (autocomplete)
- [ ] Can view bus routes and schedules
- [ ] Can make bookings
- [ ] No console errors (F12 → Console)
- [ ] API calls successful (F12 → Network tab)
- [ ] Images and assets load correctly
- [ ] Mobile responsive view works

### Monitor for 24-48 Hours

```bash
# Check Cloud Run logs for errors
gcloud run services logs read perundhu-production-backend \
  --region=us-central1 \
  --project=perundhu-prod-001 \
  --limit=100

gcloud run services logs read perundhu-production-frontend \
  --region=us-central1 \
  --project=perundhu-prod-001 \
  --limit=100

# Check error rates
gcloud run services describe perundhu-production-backend \
  --region=us-central1 \
  --project=perundhu-prod-001 \
  --format="value(status.conditions)"
```

---

## 💰 Step 3: Delete Load Balancer (After Successful Testing)

**⚠️ ONLY proceed if website works perfectly for 24-48 hours**

### Estimate Current Load Balancer Cost
- HTTPS Load Balancing Rules: ~$18/month
- Forwarding Rules: ~$18/month
- SSL Certificates: Included
- **Total Savings: $18-25/month**

### Delete Load Balancer Components

Execute these commands **in order**:

```bash
# 1. Delete HTTPS forwarding rule
gcloud compute forwarding-rules delete perundhu-frontend-lb-https \
  --global \
  --project=perundhu-prod-001 \
  --quiet

# 2. Delete HTTPS target proxy
gcloud compute target-https-proxies delete perundhu-frontend-lb-https-proxy \
  --global \
  --project=perundhu-prod-001 \
  --quiet

# 3. Delete URL map
gcloud compute url-maps delete perundhu-frontend-lb \
  --global \
  --project=perundhu-prod-001 \
  --quiet

# 4. Delete backend service
gcloud compute backend-services delete perundhu-frontend-backend \
  --global \
  --project=perundhu-prod-001 \
  --quiet

# 5. Delete managed SSL certificate
gcloud compute ssl-certificates delete perundhu-ssl-cert \
  --global \
  --project=perundhu-prod-001 \
  --quiet

# 6. Delete Network Endpoint Group (if exists)
gcloud compute network-endpoint-groups list --project=perundhu-prod-001

# If any NEGs exist for the load balancer, delete them:
# gcloud compute network-endpoint-groups delete <NEG_NAME> \
#   --region=asia-south1 \
#   --project=perundhu-prod-001 \
#   --quiet
```

### Verify Deletion

```bash
# Confirm all load balancer components are gone
gcloud compute forwarding-rules list --project=perundhu-prod-001
gcloud compute target-https-proxies list --project=perundhu-prod-001
gcloud compute url-maps list --project=perundhu-prod-001
gcloud compute backend-services list --project=perundhu-prod-001
gcloud compute ssl-certificates list --project=perundhu-prod-001
```

All commands should return empty results.

### Update TTL to Long-Term Values

After load balancer deletion, increase DNS TTL:

```
www.perundhu.com CNAME ghs.googlehosted.com. (TTL: 3600)
api.perundhu.com CNAME ghs.googlehosted.com. (TTL: 3600)
```

---

## 🧹 Step 4: Clean Up Old asia-south1 Resources (After 7 Days)

**⚠️ Wait 7 days after successful production operation before cleanup**

### Safety Checklist Before Cleanup
- [ ] Production running stable for 7+ days
- [ ] No increase in error rates
- [ ] Load balancer deleted successfully
- [ ] Cost reduced to target range ($18-28/month)
- [ ] Database backup verified in us-central1

### Stop Old Cloud Run Services

```bash
# Stop old production backend (asia-south1)
gcloud run services delete perundhu-production-backend \
  --region=asia-south1 \
  --project=perundhu-prod-001 \
  --quiet

# Stop old production frontend (asia-south1)
gcloud run services delete perundhu-production-frontend \
  --region=asia-south1 \
  --project=perundhu-prod-001 \
  --quiet

# Stop old preprod backend (asia-south1)
gcloud run services delete perundhu-backend-preprod \
  --region=asia-south1 \
  --project=astute-strategy-406601 \
  --quiet

# Stop old preprod frontend (asia-south1)  
gcloud run services delete perundhu-frontend-preprod \
  --region=asia-south1 \
  --project=astute-strategy-406601 \
  --quiet
```

### Delete Old Cloud SQL Instances

```bash
# Create final backup before deletion (safety measure)
gcloud sql export sql perundhu-production-mysql \
  gs://perundhu-prod-001-db-backups/final-backup-asia-south1-$(date +%Y%m%d-%H%M%S).sql \
  --database=RECOVER_YOUR_DATA \
  --project=perundhu-prod-001

# Wait for backup to complete, then delete
gcloud sql instances delete perundhu-production-mysql \
  --project=perundhu-prod-001 \
  --quiet

# Delete preprod instance (asia-south1)
gcloud sql instances delete perundhu-preprod-mysql \
  --project=astute-strategy-406601 \
  --quiet
```

### Delete Old Artifact Registry

```bash
# Delete old production artifact registry (asia-south1)
gcloud artifacts repositories delete perundhu-images \
  --location=asia-south1 \
  --project=perundhu-prod-001 \
  --quiet

# Delete old preprod artifact registry (asia-south1) if exists
gcloud artifacts repositories list \
  --location=asia-south1 \
  --project=astute-strategy-406601

# If preprod registry exists in asia-south1, delete it
```

### Clean Up VPC Connectors (if any)

```bash
# Check for VPC connectors in asia-south1
gcloud compute networks vpc-access connectors list \
  --region=asia-south1 \
  --project=perundhu-prod-001

gcloud compute networks vpc-access connectors list \
  --region=asia-south1 \
  --project=astute-strategy-406601

# Delete any connectors found
# gcloud compute networks vpc-access connectors delete <CONNECTOR_NAME> \
#   --region=asia-south1 \
#   --project=<PROJECT_ID> \
#   --quiet
```

### Verify Cleanup Complete

```bash
# Check no resources remain in asia-south1
echo "=== Production Resources in asia-south1 ==="
gcloud run services list --region=asia-south1 --project=perundhu-prod-001
gcloud sql instances list --filter="region:asia-south1" --project=perundhu-prod-001

echo "=== Preprod Resources in asia-south1 ==="
gcloud run services list --region=asia-south1 --project=astute-strategy-406601
gcloud sql instances list --filter="region:asia-south1" --project=astute-strategy-406601
```

---

## 💰 Step 5: Verify Cost Reduction

### Check Current Monthly Costs (After 1-2 Billing Cycles)

```bash
# Production project costs
gcloud billing accounts list
gcloud billing projects describe perundhu-prod-001 --format="value(billingAccountName)"

# Review in Cloud Console:
# https://console.cloud.google.com/billing/<BILLING_ID>/reports
```

### Expected Cost Breakdown (Monthly)

#### Production (perundhu-prod-001)
- Cloud Run Backend (2Gi/2CPU, min 1): $8-12/month
- Cloud Run Frontend (512Mi/1CPU, min 0): $2-4/month
- Cloud SQL db-f1-micro (us-central1): $3-4/month
- Artifact Registry storage: $0.50-1/month
- **Total Production: $13-19/month**

#### Preprod (astute-strategy-406601)
- Cloud Run Backend (2Gi/2CPU, min 0): $2-4/month
- Cloud Run Frontend (512Mi/1CPU, min 0): $1-2/month
- Cloud SQL db-f1-micro (us-central1): $2-3/month
- Artifact Registry storage: $0.50-1/month
- **Total Preprod: $5-9/month**

### **Grand Total: $18-28/month** ✅

### Cost Comparison

| Period | Production | Preprod | Total | Savings |
|--------|-----------|---------|-------|---------|
| **Original (asia-south1 + LB)** | $87-120 | $6-11 | $93-131 | - |
| **After First Optimization** | $41.50-55.50 | $6-11 | $47.50-66.50 | 49-52% |
| **After Migration (us-central1)** | $13-19 | $5-9 | $18-28 | **79-85%** |

**Total Savings: $65-103/month (79-85% reduction)** 🎉

---

## 📊 Monitoring and Alerts

### Set Up Budget Alerts

```bash
# Create budget alert for $30/month threshold
gcloud billing budgets create \
  --billing-account=<YOUR_BILLING_ACCOUNT_ID> \
  --display-name="Perundhu Production Budget" \
  --budget-amount=30 \
  --threshold-rule=percent=80 \
  --threshold-rule=percent=100 \
  --threshold-rule=percent=120
```

### Monitor Service Health

```bash
# Check service status daily
gcloud run services list --region=us-central1 --project=perundhu-prod-001
gcloud run services list --region=us-central1 --project=astute-strategy-406601

# Check database status
gcloud sql instances list --project=perundhu-prod-001
gcloud sql instances list --project=astute-strategy-406601
```

---

## 🔄 Rollback Plan (Emergency Only)

If critical issues occur within first 7 days:

### 1. Revert DNS Records
Update DNS back to load balancer IP addresses (restore from screenshots).

### 2. Restart Old Services
Old resources should still exist in asia-south1 for 7-day safety period.

```bash
# Redeploy to old asia-south1 services if they still exist
gcloud run services update-traffic perundhu-production-backend \
  --to-latest \
  --region=asia-south1 \
  --project=perundhu-prod-001
```

### 3. Investigation
Check logs to understand what went wrong before retrying migration.

---

## ✅ Success Criteria

Mark migration as complete when:

- [ ] DNS propagated successfully (CNAME records active)
- [ ] SSL certificates provisioned (HTTPS working)
- [ ] Website accessible at www.perundhu.com (no errors)
- [ ] API accessible at api.perundhu.com (CORS working)
- [ ] All user flows tested and working
- [ ] No increase in error rates
- [ ] Stable operation for 24-48 hours
- [ ] Load balancer deleted successfully
- [ ] Cost reduced to $18-28/month range
- [ ] Old asia-south1 resources cleaned up (after 7 days)

---

## 📞 Support and Troubleshooting

### Common Issues

**Issue: SSL certificate not provisioning**
- Wait 15-30 minutes after DNS propagation
- Verify DNS CNAME records are correct
- Check: `gcloud beta run domain-mappings describe --domain=www.perundhu.com`

**Issue: CORS errors after DNS switch**
- Verify CORS origins in backend properties include new domain
- Check [backend/app/src/main/resources/application-production.properties](backend/app/src/main/resources/application-production.properties) Line 151

**Issue: Higher than expected costs**
- Check Cloud Run min-instances (production backend should be 1, others 0)
- Verify old asia-south1 resources are stopped
- Check for unexpected data transfer costs

### Useful Commands

```bash
# Check all resources in us-central1
gcloud run services list --region=us-central1 --project=perundhu-prod-001
gcloud sql instances list --filter="region:us-central1" --project=perundhu-prod-001

# View recent logs
gcloud run services logs read perundhu-production-backend --region=us-central1 --project=perundhu-prod-001 --limit=50

# Check service configuration
gcloud run services describe perundhu-production-backend --region=us-central1 --project=perundhu-prod-001

# Test API directly
curl https://api.perundhu.com/api/health -v
```

---

## 🎯 Next Steps Summary

1. **RIGHT NOW**: Update DNS CNAME records at your domain registrar
2. **Wait 5-60 min**: DNS propagation + SSL certificate provisioning
3. **Test thoroughly**: 24-48 hours of stability testing
4. **Delete load balancer**: Execute deletion commands above
5. **Monitor costs**: Verify $18-28/month target achieved
6. **Wait 7 days**: Safety period before cleanup
7. **Clean up**: Delete old asia-south1 resources

**Timeline**: Complete migration should take 7-10 days from DNS update to full cleanup.

---

## 📝 Files Updated During Migration

All configuration files have been updated to us-central1:

- [infrastructure/terraform/environments/production/terraform.tfvars](infrastructure/terraform/environments/production/terraform.tfvars)
- [backend/app/src/main/resources/application-production.properties](backend/app/src/main/resources/application-production.properties)
- [backend/app/src/main/resources/application-preprod.properties](backend/app/src/main/resources/application-preprod.properties)
- [frontend/.env.production](frontend/.env.production)
- [frontend/.env.preprod](frontend/.env.preprod)
- [frontend/.env.development](frontend/.env.development)
- All deployment scripts in `scripts/` directory

---

**Migration Status**: ✅ Infrastructure Complete - Awaiting DNS Update

Good luck! 🚀
