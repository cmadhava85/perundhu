# Anti-Scraping Deployment Checklist

## Pre-Deployment (Local Testing)

### Backend Setup
- [ ] Run `./gradlew clean build` - compiles with Bucket4j dependency
- [ ] Verify no compilation errors
- [ ] Check `build/libs/app-*-SNAPSHOT.jar` exists

### Frontend Setup
- [ ] Run `npm install` - installs dependencies
- [ ] Run `npm run build` - builds with security headers
- [ ] Check `dist/` folder has optimized files
- [ ] Verify `robots.txt` copied to dist/

### Database
- [ ] Backup current database
- [ ] Verify Flyway migration files are in place
  - [ ] `app/src/main/resources/db/migration/V100_add_api_rate_limiting_table.sql`
- [ ] Test migration locally
  ```bash
  ./gradlew flywayMigrate -Dflyway.url=jdbc:mysql://localhost:3306/perundhu
  ```
- [ ] Verify tables created:
  ```sql
  SHOW TABLES LIKE 'api_rate%';
  SHOW TABLES LIKE 'suspicious%';
  ```

### Local Testing
- [ ] Start backend: `./gradlew bootRun`
- [ ] Test rate limiting:
  ```bash
  for i in {1..150}; do curl http://localhost:8080/api/buses; done
  # Expect 429 after 100 requests
  ```
- [ ] Test user-agent blocking:
  ```bash
  curl -H "User-Agent: Scrapy/2.0" http://localhost:8080/api/buses
  # Expect 403
  ```
- [ ] Test missing user-agent:
  ```bash
  curl -A "" http://localhost:8080/api/buses
  # Expect 403
  ```
- [ ] Test normal traffic works:
  ```bash
  curl -H "User-Agent: Mozilla/5.0" http://localhost:8080/api/buses
  # Expect 200
  ```
- [ ] Check logs for security events:
  ```bash
  tail -f logs/perundhu.log | grep SUSPICIOUS
  ```

### Configuration Verification
- [ ] Check environment variables set correctly
- [ ] Verify `rate-limit.enabled=true`
- [ ] Verify `security.ip-filtering.block-suspicious-agents=true`
- [ ] Confirm `security.api-key.enabled=false` (unless enabling API keys)

---

## Preprod Deployment

### Code Deployment
- [ ] Push changes to repository
- [ ] Merge to `preprod` branch
- [ ] Trigger CD pipeline
- [ ] Monitor Cloud Run deployment
  ```bash
  gcloud run logs read perundhu-backend-preprod --limit 50
  ```

### Database Migration
- [ ] Set `FLYWAY_ENABLED=true` in environment
- [ ] Deploy backend with migrations
  ```bash
  gcloud run deploy perundhu-backend-preprod ... --update-env-vars FLYWAY_ENABLED=true
  ```
- [ ] Verify migration succeeded:
  ```bash
  gcloud sql connect perundhu-preprod-mysql
  SELECT COUNT(*) FROM api_rate_limit;
  SELECT COUNT(*) FROM suspicious_activity;
  ```
- [ ] Set `FLYWAY_ENABLED=false` after migration completes

### Frontend Deployment
- [ ] Deploy frontend to Cloud Run
- [ ] Verify static files include `robots.txt`
- [ ] Test in browser (check Network tab for security headers)

### Infrastructure Updates
- [ ] Deploy Terraform changes:
  ```bash
  cd infrastructure
  terraform init
  terraform plan
  terraform apply
  ```
- [ ] Verify Cloud Armor policy created
  ```bash
  gcloud compute security-policies list
  gcloud compute security-policies rules list --policy-name=perundhu-scraper-protection
  ```
- [ ] Attach to load balancer (if needed)

### Preprod Testing (2-week period)

#### Week 1: Monitoring
- [ ] Monitor error logs for false positives
- [ ] Check Cloud Run metrics:
  - [ ] Response times (should be <100ms)
  - [ ] Error rate (should be <0.1%)
  - [ ] 429 responses (expected but rare for legitimate traffic)
- [ ] Check database for suspicious activity:
  ```sql
  SELECT reason, COUNT(*) as count 
  FROM suspicious_activity 
  GROUP BY reason 
  ORDER BY count DESC;
  ```
- [ ] Monitor Cloud Armor logs:
  ```bash
  gcloud logging read 'resource.type="http_load_balancer" AND jsonPayload.enforcement_level!="ALLOW"' --limit 50
  ```

#### Week 2: Adjustment
- [ ] Review any false positives
- [ ] Whitelist legitimate IPs if needed:
  ```bash
  export IP_WHITELIST="trusted.ip.1,trusted.ip.2"
  gcloud run deploy perundhu-backend-preprod ... --update-env-vars IP_WHITELIST=$IP_WHITELIST
  ```
- [ ] Adjust rate limits if needed:
  ```bash
  export RATE_LIMIT_READ=150  # increase from 100
  gcloud run deploy perundhu-backend-preprod ... --update-env-vars RATE_LIMIT_READ=$RATE_LIMIT_READ
  ```
- [ ] Test with curl/real traffic:
  ```bash
  curl -X GET https://perundhu-backend-preprod.run.app/api/buses
  ```

### Health Checks
- [ ] Verify `/health` endpoint responds:
  ```bash
  curl https://perundhu-backend-preprod.run.app/health
  ```
- [ ] Verify API endpoints work normally:
  ```bash
  curl https://perundhu-backend-preprod.run.app/api/buses
  curl https://perundhu-backend-preprod.run.app/api/routes
  curl https://perundhu-backend-preprod.run.app/api/schedules
  ```
- [ ] Check error rates in metrics dashboard
- [ ] Monitor memory/CPU usage (should be <5% increase)

---

## Production Deployment

### Pre-Production Checklist
- [ ] All preprod tests passed
- [ ] No false positives in 2-week testing
- [ ] Rate limits appropriate for production traffic
- [ ] Cloud Armor rules tested and verified
- [ ] Alerting configured for security events
- [ ] Incident response plan documented
- [ ] Rollback plan prepared

### Production Code Deployment
- [ ] Merge preprod → main (master)
- [ ] Tag release: `v1.0.0-anti-scraping`
- [ ] Trigger production pipeline
- [ ] Monitor deployment in Cloud Run
- [ ] Verify health checks pass

### Production Database Setup
- [ ] Backup production database
- [ ] Set `FLYWAY_ENABLED=true`
- [ ] Deploy with migrations
- [ ] Verify tables created:
  ```sql
  SHOW TABLES LIKE 'api_rate%';
  SELECT COUNT(*) FROM api_rate_limit;
  SELECT COUNT(*) FROM suspicious_activity;
  ```

### Production Infrastructure
- [ ] Apply Terraform to production (if needed)
- [ ] Verify Cloud Armor attached to production LB
- [ ] Test production endpoints:
  ```bash
  curl -v https://perundhu.app/api/buses
  # Check response headers for X-RateLimit-*
  ```

### Production Verification
- [ ] Health check: `https://perundhu.app/health`
- [ ] API test: `https://perundhu.app/api/buses`
- [ ] robots.txt accessible: `https://perundhu.app/robots.txt`
- [ ] Security headers present:
  ```bash
  curl -I https://perundhu.app
  # Should see X-Frame-Options, X-Content-Type-Options, etc
  ```

---

## Monitoring & Alerting

### Set Up Alerts
- [ ] Alert on 429 response count > 100/hour
- [ ] Alert on 403 response count > 50/hour
- [ ] Alert on suspicious_activity insert > threshold
- [ ] Alert on rate_limit INSERT/UPDATE frequency
- [ ] Alert on backend latency > 1000ms
- [ ] Alert on 5xx errors > 1%

### Create Dashboard
- [ ] Rate limit hits per IP
- [ ] Blocked requests by reason
- [ ] Geographic distribution of requests
- [ ] Top blocked user agents
- [ ] Response time distribution
- [ ] Error rates by endpoint

### Configure Logging
- [ ] Cloud Logging filters configured
- [ ] Security events routed to separate channel
- [ ] Log retention: 90 days minimum
- [ ] Log analysis: Review weekly

---

## Post-Deployment (Ongoing)

### Daily (First Week)
- [ ] Check error logs for issues
- [ ] Monitor 429 and 403 response rates
- [ ] Verify legitimate traffic not blocked
- [ ] Check system resources (CPU, memory)

### Weekly (First Month)
- [ ] Review security event logs
- [ ] Analyze suspicious activity patterns
- [ ] Check for false positives
- [ ] Update incident log
- [ ] Review and adjust thresholds if needed

### Monthly
- [ ] Comprehensive log analysis
- [ ] Identify new scraper patterns
- [ ] Update blocked user-agent list if needed
- [ ] Review Cloud Armor effectiveness
- [ ] Check for performance degradation
- [ ] Security audit of rules

### Quarterly
- [ ] Full security review
- [ ] Threat landscape assessment
- [ ] Rule effectiveness analysis
- [ ] Update documentation
- [ ] Plan next improvements

---

## Rollback Plan (if needed)

### Quick Rollback (< 5 minutes)
1. Disable rate limiting:
   ```bash
   gcloud run deploy perundhu-backend ... --update-env-vars RATE_LIMIT_ENABLED=false
   ```

2. Disable user-agent blocking:
   ```bash
   gcloud run deploy perundhu-backend ... --update-env-vars BLOCK_SUSPICIOUS_AGENTS=false
   ```

3. Remove Cloud Armor policy:
   ```bash
   terraform destroy -auto-approve
   ```

### Complete Rollback (< 30 minutes)
1. Revert to previous backend version
2. Revert to previous frontend version
3. Remove Terraform resources
4. Optional: Drop migration tables (keep for safety)

### Verification After Rollback
- [ ] Health check passes
- [ ] API endpoints respond
- [ ] No rate limiting errors (429)
- [ ] Frontend loads normally
- [ ] Users report normal access

---

## Success Criteria

### Performance
- [ ] Response time < 100ms (90th percentile)
- [ ] CPU usage < 5% increase
- [ ] Memory usage < 50MB increase
- [ ] No increase in error rates

### Security
- [ ] Scrapers blocked (429/403 responses)
- [ ] Suspicious activity logged
- [ ] Rate limits enforced
- [ ] Cloud Armor rules active

### User Experience
- [ ] Legitimate users unaffected
- [ ] No false positives (< 0.1%)
- [ ] Transparent to normal users
- [ ] Mobile users work normally

---

## Sign-Off

- [ ] Development Complete: ___________ Date: ______
- [ ] QA Testing Complete: ___________ Date: ______
- [ ] Preprod Testing Complete: ___________ Date: ______
- [ ] Ready for Production: ___________ Date: ______
- [ ] Production Deployed: ___________ Date: ______
- [ ] 7-Day Monitoring Complete: ___________ Date: ______

---

## Documentation

- [ ] README updated with security info
- [ ] runbook created for operations
- [ ] Incident response guide created
- [ ] Training completed for team
- [ ] Change log updated

---

## Contact Information

- **On-call Support**: [Team Contact]
- **Escalation**: [Manager Contact]
- **Infrastructure**: [DevOps Contact]
- **Security**: [Security Contact]

---

*Last Updated: January 15, 2026*
*Status: Ready for Deployment*
