# 🚀 PRODUCTION DEPLOYMENT RUNBOOK
**For**: Perundhu Bus Tracker Application  
**Effective**: January 12, 2026  
**Audience**: DevOps Team, Platform Engineers

---

## 📋 PRE-DEPLOYMENT CHECKLIST (48 Hours Before)

### Code & Build Ready
- [ ] All code merged to `master` branch
- [ ] Version tag created: `git tag -a v1.0.0 -m "Production Release"`
- [ ] Tag pushed: `git push origin v1.0.0`
- [ ] Docker images built and pushed to GCR
- [ ] All tests passing in CI pipeline
- [ ] No security vulnerabilities (SonarQube green)
- [ ] Code review approved

### Infrastructure Ready
- [ ] Production GCP project created and configured
- [ ] Terraform variables set in `terraform.tfvars`
- [ ] Terraform state bucket created and tested
- [ ] Infrastructure plan reviewed and approved
- [ ] Database backups configured and tested
- [ ] Network connectivity verified
- [ ] Service accounts and IAM roles configured

### Operations Ready
- [ ] Monitoring dashboards created and tested
- [ ] Alert policies configured with notification channels
- [ ] Log aggregation and retention configured
- [ ] Incident response team trained
- [ ] On-call schedule activated
- [ ] Communication plan prepared
- [ ] Rollback procedure tested

### Documentation Ready
- [ ] Runbook reviewed
- [ ] Troubleshooting guide prepared
- [ ] Change log documented
- [ ] Team communications prepared
- [ ] Customer notifications drafted

---

## 🚀 DEPLOYMENT EXECUTION (Day 1: Infrastructure)

### 09:00 - Deployment Window Opens

1. **Notify Team**
   ```bash
   # Send notification to team Slack channel
   # Subject: "Production Deployment Started - Perundhu v1.0.0"
   # Message: Deployment window opened, monitoring all systems
   ```

2. **Verify CI Pipeline Success**
   ```bash
   # Check that v1.0.0 tag triggered CI/CD
   gcloud builds list --filter="tags.* = 'v1.0.0'" --limit=1
   
   # Wait for CI to complete (should be ~10-15 minutes)
   ```

### 09:15 - Prepare Infrastructure

1. **Initialize Production Environment**
   ```bash
   cd infrastructure/terraform/environments/production
   
   # Initialize Terraform
   terraform init \
     -backend-config="bucket=YOUR_PROJECT_ID-terraform-state-production"
   
   # Validate configuration
   terraform validate
   ```

2. **Plan Infrastructure**
   ```bash
   # Create and review plan
   terraform plan \
     -var="project_id=YOUR_PRODUCTION_PROJECT" \
     -var="region=asia-south1" \
     -out=tfplan
   
   # Save plan for audit
   terraform show tfplan > deployment_$(date +%Y%m%d_%H%M%S).txt
   
   # Review plan output - should show ~20-25 resources to create
   ```

3. **Checkpoint - Approval Required**
   ```
   ⏸️ PAUSE HERE FOR APPROVAL
   - [ ] Tech Lead reviewed plan
   - [ ] No unexpected resource changes
   - [ ] All resource counts correct
   - [ ] Security groups properly configured
   - [ ] APPROVED - Ready to apply
   ```

### 09:30 - Apply Infrastructure

1. **Apply Terraform Configuration**
   ```bash
   # Apply infrastructure changes
   terraform apply tfplan
   
   # Expected duration: 15-25 minutes
   # Watch output for any errors
   ```

2. **Monitor Terraform Progress**
   ```bash
   # In another terminal, watch Cloud Build
   watch gcloud builds log $(gcloud builds list --limit=1 --format='value(id)')
   
   # Check service status
   watch gcloud sql instances list --project=YOUR_PROJECT
   ```

3. **Capture Outputs**
   ```bash
   # Save all outputs for reference
   terraform output -json > production_outputs.json
   
   # Extract key values
   export DB_INSTANCE=$(terraform output -raw db_instance_name)
   export DB_CONNECTION=$(terraform output -raw db_connection_name)
   export STORAGE_BUCKET=$(terraform output -raw images_bucket_name)
   export SERVICE_ACCOUNT=$(terraform output -raw backend_service_account_email)
   
   # Verify all outputs exist
   terraform output
   ```

### 09:50 - Verify Infrastructure

1. **Check Cloud SQL**
   ```bash
   # Verify instance is running
   gcloud sql instances describe $DB_INSTANCE \
     --project=YOUR_PROJECT
   
   # Expected: RUNNABLE status
   # Check backup configuration
   # Verify private IP assigned
   ```

2. **Check Cloud Storage**
   ```bash
   # Verify storage bucket created
   gsutil ls gs://$(terraform output -raw images_bucket_name)
   
   # Check bucket permissions
   gsutil iam ch serviceAccount:$SERVICE_ACCOUNT:objectAdmin \
     gs://$(terraform output -raw images_bucket_name)
   ```

3. **Check VPC & Networking**
   ```bash
   # Verify VPC created
   gcloud compute networks describe perundhu-prod-vpc \
     --project=YOUR_PROJECT
   
   # Verify VPC connector
   gcloud compute networks vpc-access connectors list \
     --region=asia-south1 \
     --project=YOUR_PROJECT
   ```

4. **Check IAM & Service Accounts**
   ```bash
   # Verify service account created
   gcloud iam service-accounts describe $SERVICE_ACCOUNT \
     --project=YOUR_PROJECT
   
   # Verify IAM bindings
   gcloud projects get-iam-policy YOUR_PROJECT \
     --flatten="bindings[].members" \
     --filter="bindings.members:serviceAccount:$SERVICE_ACCOUNT"
   ```

### 10:10 - Configure Secrets

1. **Create Secret Manager Secrets**
   ```bash
   # Get database credentials from Terraform
   export DB_USER=$(terraform output -raw db_user)
   export DB_PASSWORD=$(terraform output -raw db_password)
   export DB_NAME=$(terraform output -raw db_name)
   
   # Create connection URL
   export DB_URL="jdbc:mysql://$DB_CONNECTION:3306/$DB_NAME?useSSL=true"
   
   # Create secrets (one by one with user confirmation)
   echo "Creating production-db-url..."
   echo -n "$DB_URL" | gcloud secrets create production-db-url \
     --data-file=- \
     --replication-policy="automatic" \
     --project=YOUR_PROJECT
   
   echo "Creating production-db-username..."
   echo -n "$DB_USER" | gcloud secrets create production-db-username \
     --data-file=- \
     --replication-policy="automatic" \
     --project=YOUR_PROJECT
   
   echo "Creating production-db-password..."
   echo -n "$DB_PASSWORD" | gcloud secrets create production-db-password \
     --data-file=- \
     --replication-policy="automatic" \
     --project=YOUR_PROJECT
   ```

2. **Grant Secret Access to Service Account**
   ```bash
   # Grant access to all secrets
   for SECRET in production-db-url production-db-username production-db-password \
                 production-jwt-secret production-data-encryption-key; do
     gcloud secrets add-iam-policy-binding $SECRET \
       --member="serviceAccount:$SERVICE_ACCOUNT" \
       --role="roles/secretmanager.secretAccessor" \
       --project=YOUR_PROJECT \
       --quiet
   done
   
   echo "✅ All secrets configured and service account granted access"
   ```

3. **Verify Secrets**
   ```bash
   # List all secrets
   gcloud secrets list --project=YOUR_PROJECT
   
   # Test access (as service account would)
   gcloud secrets versions access latest --secret="production-db-password" \
     --project=YOUR_PROJECT
   ```

### 10:20 - Run Database Migrations

1. **Apply Flyway Migrations**
   ```bash
   # Get secret values
   export SPRING_DATASOURCE_URL=$(gcloud secrets versions access latest \
     --secret="production-db-url" --project=YOUR_PROJECT)
   export SPRING_DATASOURCE_USERNAME=$(gcloud secrets versions access latest \
     --secret="production-db-username" --project=YOUR_PROJECT)
   export SPRING_DATASOURCE_PASSWORD=$(gcloud secrets versions access latest \
     --secret="production-db-password" --project=YOUR_PROJECT)
   
   # Run migrations from backend directory
   cd backend
   ./gradlew flywayMigrate \
     -Dspring.profiles.active=production \
     -Dspring.datasource.url=$SPRING_DATASOURCE_URL \
     -Dspring.datasource.username=$SPRING_DATASOURCE_USERNAME \
     -Dspring.datasource.password=$SPRING_DATASOURCE_PASSWORD
   ```

2. **Verify Migrations**
   ```bash
   # Check migration status
   ./gradlew flywayInfo \
     -Dspring.profiles.active=production \
     -Dspring.datasource.url=$SPRING_DATASOURCE_URL \
     -Dspring.datasource.username=$SPRING_DATASOURCE_USERNAME \
     -Dspring.datasource.password=$SPRING_DATASOURCE_PASSWORD
   
   # Expected: All migrations show SUCCESS
   # If any FAILED, investigate immediately and STOP deployment
   ```

### 10:40 - Checkpoint: Infrastructure Complete ✅

**Infrastructure deployment complete at 10:40**

Status:
- ✅ GCP resources created
- ✅ Network configured
- ✅ Database running
- ✅ Storage buckets created
- ✅ Secrets configured
- ✅ Migrations applied

**Approval Gate**: Infrastructure tech lead signs off

---

## 🚀 DEPLOYMENT EXECUTION (Day 1: Application)

### 11:00 - Deploy Backend Service

1. **Get Latest Image**
   ```bash
   # Get production image tag
   export BACKEND_IMAGE="gcr.io/YOUR_PROJECT/perundhu-backend:1.0.0"
   
   # Verify image exists
   gcloud container images list --repository=gcr.io/YOUR_PROJECT
   gcloud container images describe $BACKEND_IMAGE
   ```

2. **Deploy to Cloud Run**
   ```bash
   # Deploy backend service
   gcloud run deploy perundhu-backend \
     --image=$BACKEND_IMAGE \
     --platform=managed \
     --region=asia-south1 \
     --memory=2Gi \
     --cpu=2 \
     --timeout=300s \
     --max-instances=10 \
     --min-instances=1 \
     --service-account=$SERVICE_ACCOUNT \
     --vpc-connector=perundhu-prod-connector \
     --no-allow-unauthenticated \
     --revision-suffix=v100 \
     --project=YOUR_PROJECT
   
   # Expected: Service deployed successfully
   # Revision created with suffix v100
   ```

3. **Monitor Deployment**
   ```bash
   # Watch deployment progress
   gcloud run operations list --platform=managed --region=asia-south1
   
   # Check service status
   gcloud run services describe perundhu-backend \
     --platform=managed \
     --region=asia-south1 \
     --project=YOUR_PROJECT
   
   # Expected: All revisions healthy
   # Traffic 100% to new revision
   ```

### 11:10 - Deploy Frontend Service

1. **Deploy Frontend**
   ```bash
   export FRONTEND_IMAGE="gcr.io/YOUR_PROJECT/perundhu-frontend:1.0.0"
   
   gcloud run deploy perundhu-frontend \
     --image=$FRONTEND_IMAGE \
     --platform=managed \
     --region=asia-south1 \
     --memory=256Mi \
     --cpu=1 \
     --timeout=60s \
     --max-instances=20 \
     --allow-unauthenticated \
     --revision-suffix=v100 \
     --project=YOUR_PROJECT
   ```

2. **Verify Frontend**
   ```bash
   # Get service URL
   FRONTEND_URL=$(gcloud run services describe perundhu-frontend \
     --platform=managed \
     --region=asia-south1 \
     --format='value(status.url)' \
     --project=YOUR_PROJECT)
   
   echo "Frontend URL: $FRONTEND_URL"
   
   # Test accessibility
   curl -I $FRONTEND_URL
   # Expected: 200 OK
   ```

### 11:20 - Configure Custom Domains

1. **Map Backend Domain**
   ```bash
   # Create domain mapping
   gcloud run domain-mappings create \
     --service=perundhu-backend \
     --domain=api.perundhu.app \
     --region=asia-south1 \
     --platform=managed \
     --project=YOUR_PROJECT
   
   # Expected: Mapping created, DNS records provided
   # Note: DNS propagation may take 10-30 minutes
   ```

2. **Map Frontend Domain**
   ```bash
   gcloud run domain-mappings create \
     --service=perundhu-frontend \
     --domain=perundhu.app \
     --region=asia-south1 \
     --platform=managed \
     --project=YOUR_PROJECT
   ```

3. **Get DNS Records**
   ```bash
   # Display DNS records for both domains
   gcloud run domain-mappings describe --domain=api.perundhu.app
   gcloud run domain-mappings describe --domain=perundhu.app
   
   # Note: Share these with DNS admin
   # Usually: CNAME to ghs.googleusercontent.com
   ```

### 11:30 - Smoke Tests

1. **Health Check - Backend**
   ```bash
   # May fail if DNS not propagated yet
   # Use internal IP if needed
   
   # Get internal IP
   BACKEND_IP=$(gcloud run services describe perundhu-backend \
     --platform=managed \
     --region=asia-south1 \
     --format='value(status.address.url)' \
     --project=YOUR_PROJECT)
   
   # Health check
   curl -I $BACKEND_IP/actuator/health \
     -H "Host: api.perundhu.app"
   
   # Expected: 200 OK
   ```

2. **Health Check - Frontend**
   ```bash
   # Get frontend URL
   FRONTEND_IP=$(gcloud run services describe perundhu-frontend \
     --platform=managed \
     --region=asia-south1 \
     --format='value(status.address.url)' \
     --project=YOUR_PROJECT)
   
   # Check HTML loads
   curl -I $FRONTEND_IP \
     -H "Host: perundhu.app"
   
   # Expected: 200 OK, HTML content returned
   ```

3. **API Tests**
   ```bash
   # Test core API endpoints
   # (Once DNS propagates)
   
   # Get available routes
   curl https://api.perundhu.app/api/buses/routes
   
   # Test search
   curl https://api.perundhu.app/api/search/locations?query=Chennai
   
   # Expected: 200 OK with JSON data
   ```

### 12:00 - DNS Verification

```bash
# Check DNS propagation
dig api.perundhu.app
dig perundhu.app

# If DNS not fully propagated yet:
# - Continue monitoring
# - Use internal Cloud Run URLs for testing
# - DNS typically propagates within 30 minutes
# - Max 24 hours for full global propagation
```

### 12:30 - Monitoring & Logging

1. **Enable Monitoring Dashboards**
   ```bash
   # Create or activate production dashboard
   gcloud monitoring dashboards create \
     --config-from-file=monitoring-config.json
   ```

2. **Configure Alerts**
   ```bash
   # Alert on backend errors
   gcloud alpha monitoring policies create \
     --notification-channels=<CHANNEL_ID> \
     --display-name="Backend Error Rate > 1%" \
     --project=YOUR_PROJECT
   
   # Alert on backend latency
   gcloud alpha monitoring policies create \
     --notification-channels=<CHANNEL_ID> \
     --display-name="Backend Latency > 1s" \
     --project=YOUR_PROJECT
   ```

3. **View Live Logs**
   ```bash
   # Watch backend logs
   gcloud logging read \
     "resource.type=cloud_run_revision AND resource.labels.service_name=perundhu-backend" \
     --limit=50 \
     --follow \
     --project=YOUR_PROJECT
   ```

### 13:00 - Checkpoint: Application Deployed ✅

**Application deployment complete at 13:00**

Status:
- ✅ Backend deployed to Cloud Run
- ✅ Frontend deployed to Cloud Run
- ✅ Custom domains configured (DNS pending)
- ✅ Health checks passing
- ✅ Monitoring and alerts configured
- ✅ Logs streaming correctly

**Approval Gate**: Application tech lead signs off

---

## 🔄 POST-DEPLOYMENT MONITORING (First 4 Hours)

### Hour 1: Intensive Monitoring

```bash
# Every 5 minutes:
1. Check error rates
   gcloud logging read \
     "resource.type=cloud_run_revision AND severity=ERROR" \
     --limit=10

2. Check latency metrics
   gcloud monitoring time-series list \
     --filter='resource.type=cloud_run_revision'

3. Check frontend loads
   curl https://perundhu.app (once DNS ready)

4. Check API response
   curl https://api.perundhu.app/actuator/health
```

### Hour 2-4: Regular Monitoring

```bash
# Every 15 minutes:
1. Review error logs
2. Check metrics dashboard
3. Monitor user traffic
4. Verify no increase in latency
5. Check database connections

# Alert conditions to watch:
- Error rate > 1%
- Latency > 1 second
- Database connection errors
- Memory usage > 80%
- CPU usage > 70%
```

### After 4 Hours: Resume Normal Operations

If no issues detected:
- ✅ Production deployment successful
- ✅ Continue monitoring daily
- ✅ Post-deployment review meeting scheduled
- ✅ Document any issues and fixes

---

## 🔧 TROUBLESHOOTING DURING DEPLOYMENT

### Issue: Terraform Apply Fails

```bash
# Check error message
# Common causes:
1. Quota limits exceeded
   - Request quota increase from GCP console

2. IAM permissions insufficient
   - Grant Editor role to deployment service account

3. API not enabled
   - Run: gcloud services enable <API_NAME>

# Retry:
terraform apply tfplan
```

### Issue: Database Migration Fails

```bash
# Check migration status
./gradlew flywayInfo

# If migration stuck:
1. Check database connectivity
2. Verify MySQL user permissions
3. Check Flyway table (flyway_schema_history)

# Manual fix:
gcloud sql connect perundhu-prod
mysql> SELECT * FROM flyway_schema_history;
```

### Issue: Cloud Run Deployment Fails

```bash
# Check recent deployments
gcloud run revisions list --platform=managed

# Check deployment logs
gcloud builds log $(gcloud builds list --limit=1 --format='value(id)')

# Common fixes:
1. Image not found: Push image to GCR
2. Service account missing: Grant IAM roles
3. VPC issues: Verify VPC connector
```

### Issue: DNS Not Propagating

```bash
# This is normal, takes 10-30 minutes typically

# Workaround: Use internal IP during testing
BACKEND_IP=$(gcloud run services describe perundhu-backend \
  --format='value(status.address.url)')

# Test with Host header
curl -H "Host: api.perundhu.app" $BACKEND_IP
```

---

## ⏮️ ROLLBACK PROCEDURE (If Critical Issue Found)

### Emergency Rollback (< 5 Minutes)

```bash
# Get previous working image tag
PREVIOUS_IMAGE="gcr.io/YOUR_PROJECT/perundhu-backend:0.9.9"

# Immediate rollback
gcloud run deploy perundhu-backend \
  --image=$PREVIOUS_IMAGE \
  --region=asia-south1 \
  --platform=managed \
  --project=YOUR_PROJECT

# Verify health
curl https://api.perundhu.app/actuator/health
```

### Full Rollback (If Infrastructure Issue)

```bash
# Option 1: Revert Cloud Run revision
gcloud run services update-traffic perundhu-backend \
  --to-revisions PREVIOUS_REVISION_ID=100 \
  --region=asia-south1

# Option 2: Complete Terraform rollback
cd infrastructure/terraform/environments/production
terraform destroy -var="project_id=YOUR_PROJECT"

# Recreate from backup
# (Requires recent backup to exist)
```

### Communication During Rollback

```
⚠️ INCIDENT ALERT TO TEAM
Subject: Production Rollback in Progress
- Issue: [Describe issue]
- Action: Rolling back to previous version
- ETA: [Time estimate]
- Status: Will update every 5 minutes
```

---

## ✅ POST-DEPLOYMENT CHECKLIST (Day 2-7)

### Daily Checks
- [ ] Zero critical errors in logs
- [ ] All API endpoints responding <500ms
- [ ] Database backups completing successfully
- [ ] No memory leaks or increasing resource usage
- [ ] User reports of functionality working
- [ ] No DDoS or suspicious traffic patterns

### Weekly Review
- [ ] All monitoring alerts functional
- [ ] Performance metrics within SLA
- [ ] Security logs reviewed
- [ ] Database optimization opportunities identified
- [ ] Cost review (no unexpected charges)
- [ ] Incident post-mortem if any issues occurred

### Optimization
- [ ] Auto-scaling policies adjusted based on traffic
- [ ] Database indexes created if needed
- [ ] Cache configuration optimized
- [ ] CDN configured for static assets
- [ ] Rate limiting tuned
- [ ] Cost optimization recommendations

---

## 📞 ESCALATION CONTACTS

**Critical Issues** (P1 - requires immediate action):
- On-Call Engineer: [Phone]
- Tech Lead: [Phone]
- CTO: [Phone]

**High Priority** (P2 - within 1 hour):
- DevOps Lead: [Email]
- Backend Lead: [Email]
- Frontend Lead: [Email]

**Communication**:
- Slack: #production-incidents
- Status Page: [URL]
- Customer Updates: [Email template]

---

## 📝 DOCUMENTATION REFERENCES

- [Production Readiness Checklist](./PRODUCTION_READINESS_CHECKLIST.md)
- [Terraform Configuration Guide](./TERRAFORM_PRODUCTION_GUIDE.md)
- [Troubleshooting Guide](./TROUBLESHOOTING.md)
- [Operations Manual](./OPERATIONS_MANUAL.md)
- [Incident Response Plan](./INCIDENT_RESPONSE.md)

---

## 🎉 SUCCESS CRITERIA

**Deployment is successful when:**

✅ All infrastructure provisioned  
✅ Applications deployed and healthy  
✅ DNS mapping active (both domains)  
✅ SSL certificates auto-provisioned  
✅ Health checks passing  
✅ No critical errors in logs  
✅ Monitoring and alerts working  
✅ Stakeholder approval received  
✅ Zero P1 incidents in first 24 hours  
✅ Error rate < 1%  

---

**Runbook Version**: 1.0  
**Last Updated**: January 5, 2026  
**Next Review**: January 19, 2026  
**Owner**: DevOps Team

