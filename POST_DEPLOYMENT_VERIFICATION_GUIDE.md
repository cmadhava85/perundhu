# ✅ POST-DEPLOYMENT VERIFICATION & MONITORING GUIDE
**For**: Perundhu Bus Tracker - Production Deployment  
**Domain**: https://perundhu.com  
**Date Created**: January 23, 2026  
**Duration**: Day 1-30 Post-Launch

---

## TABLE OF CONTENTS

1. [Immediate Post-Deployment (0-2 Hours)](#immediate-post-deployment-0-2-hours)
2. [Day 1 Verification](#day-1-verification)
3. [Week 1 Monitoring](#week-1-monitoring)
4. [Performance Optimization](#performance-optimization)
5. [Security Verification](#security-verification)
6. [User Acceptance Testing](#user-acceptance-testing)
7. [Post-Launch Monitoring Dashboard](#post-launch-monitoring-dashboard)

---

## IMMEDIATE POST-DEPLOYMENT (0-2 Hours)

### Phase 0: Critical Health Checks (First 30 Minutes)

#### 0.1 DNS Resolution Verification

```bash
# Global DNS check
nslookup perundhu.com
nslookup api.perundhu.com

# Detailed DNS lookup
dig +trace perundhu.com
dig +trace api.perundhu.com

# Expected: All should resolve to Load Balancer IP (34.x.x.x range)

# Verify with different DNS servers
nslookup perundhu.com 8.8.8.8  # Google DNS
nslookup perundhu.com 1.1.1.1  # Cloudflare DNS

# Flush local DNS cache (macOS)
sudo dscacheutil -flushcache
sudo killall -HUP mDNSResponder

# Check DNS propagation globally
# Use: https://dnschecker.org/
# Verify all regions show correct IP
```

**✅ Success Criteria**:
- [ ] All DNS lookups return Load Balancer IP
- [ ] No NXDOMAIN errors
- [ ] Consistent results across DNS servers
- [ ] Global propagation complete (www.dnschecker.org shows green)

#### 0.2 SSL/TLS Certificate Verification

```bash
# Check SSL certificate for frontend
openssl s_client -connect perundhu.com:443 -servername perundhu.com

# Expected output:
# - Certificate is valid
# - Subject CN: perundhu.com
# - Issuer: Google Internet Authority G3
# - Not Before: [DATE]
# - Not After: [DATE in future]
# - Subject Alternative Name: perundhu.com, api.perundhu.com, www.perundhu.com

# Check API SSL certificate
openssl s_client -connect api.perundhu.com:443 -servername api.perundhu.com

# Verify certificate chain
openssl s_client -connect perundhu.com:443 -showcerts

# Test SSL/TLS quality
# Use: https://www.ssllabs.com/ssltest/
# Expected: A+ rating
```

**✅ Success Criteria**:
- [ ] Certificate is valid (not self-signed)
- [ ] Domain names match (perundhu.com, api.perundhu.com)
- [ ] Certificate not expired
- [ ] No certificate chain warnings
- [ ] SSL Labs rating: A or A+

#### 0.3 HTTP Redirect Verification

```bash
# Verify HTTP → HTTPS redirect
curl -i https://perundhu.com/

# Expected: HTTP 200 (already HTTPS)

curl -i http://perundhu.com/

# Expected: HTTP 301 or 302 redirect to https://perundhu.com

# Check headers for security
curl -i https://perundhu.com/ | grep -i "strict-transport-security"

# Expected: Strict-Transport-Security: max-age=...
```

**✅ Success Criteria**:
- [ ] HTTPS frontend accessible at perundhu.com
- [ ] HTTP redirects to HTTPS
- [ ] HSTS header present
- [ ] No mixed content warnings

#### 0.4 Backend API Health Check

```bash
# Test backend health endpoint
curl -v https://api.perundhu.com/actuator/health

# Expected Response (HTTP 200):
# {
#   "status": "UP",
#   "components": {
#     "db": {
#       "status": "UP"
#     },
#     "diskSpace": {
#       "status": "UP"
#     },
#     "ping": {
#       "status": "UP"
#     }
#   }
# }

# If database is DOWN, investigate immediately
if curl -s https://api.perundhu.com/actuator/health | grep -q '"status":"DOWN"'; then
  echo "🚨 CRITICAL: Backend health check failed"
  # Trigger incident response
fi
```

**✅ Success Criteria**:
- [ ] API responds with HTTP 200
- [ ] All components show status UP
- [ ] Response time < 500ms
- [ ] Database connection verified

#### 0.5 Frontend Loading Verification

```bash
# Test frontend page load
curl -s https://perundhu.com/ | head -20

# Check for proper HTML response
if curl -s https://perundhu.com/ | grep -q "<title>"; then
  echo "✅ Frontend loaded successfully"
else
  echo "🚨 Frontend failed to load"
fi

# Check for static assets
curl -I https://perundhu.com/assets/main.js
curl -I https://perundhu.com/assets/main.css
curl -I https://perundhu.com/index.html

# Expected: HTTP 200 for all assets
```

**✅ Success Criteria**:
- [ ] Frontend HTML loads
- [ ] All static assets available (CSS, JS)
- [ ] Response time < 1 second
- [ ] No 404 errors

#### 0.6 Database Connectivity Check

```bash
# Test backend can connect to database
curl -s https://api.perundhu.com/api/v1/buses/search?origin=Chennai&destination=Madurai | head

# Expected: JSON response with bus data

# Or test basic connectivity
curl -s https://api.perundhu.com/actuator/db | jq '.'

# Expected: Database connection details
```

**✅ Success Criteria**:
- [ ] Database queries execute successfully
- [ ] Response time < 500ms for typical queries
- [ ] No connection pool errors
- [ ] Replication lag acceptable (< 1 second)

#### 0.7 Error Monitoring Verification

```bash
# Check error logs
gcloud logging read "resource.type=cloud_run_revision AND severity=ERROR" \
  --project=perundhu-production-2026 \
  --limit=10

# Expected: No critical errors in first 30 minutes

# Check error rate
gcloud monitoring time-series list \
  --filter='metric.type="run.googleapis.com/request_count" AND metric.response_code_class="5xx"' \
  --project=perundhu-production-2026

# Expected: Error rate < 1%
```

**✅ Success Criteria**:
- [ ] No critical errors in logs
- [ ] Error rate < 1%
- [ ] No database connection errors
- [ ] No authentication errors

### Phase 0 Summary: First 30 Minutes ✅

```
If ALL checks pass → Proceed to Day 1 Verification
If ANY check fails → STOP and investigate before proceeding
  - DNS issues → Contact domain registrar
  - SSL issues → Check certificate in GCP console
  - Backend issues → Check Cloud Run logs
  - Database issues → Check Cloud SQL status
```

---

## DAY 1 VERIFICATION

### 1.1 Morning Verification (Hour 1-2)

```bash
# Dashboard access check
# Navigate to: https://console.cloud.google.com

# Check Cloud Run services
gcloud run services list --region=asia-south1 --project=perundhu-production-2026

# Check Cloud SQL status
gcloud sql instances describe perundhu-prod-mysql --project=perundhu-production-2026

# Check load balancer status
gcloud compute backend-services list --global --project=perundhu-production-2026

# Review error logs
gcloud logging read --limit=50 --project=perundhu-production-2026

# Check metrics
gcloud monitoring metrics-descriptors list --project=perundhu-production-2026
```

**Key Metrics to Monitor**:
- [ ] Request count: increasing naturally
- [ ] Error rate: stable < 1%
- [ ] Latency (p99): < 2 seconds
- [ ] CPU utilization: 20-40% (normal)
- [ ] Memory utilization: 30-50% (normal)
- [ ] Database connections: stable

### 1.2 API Testing (Hour 2-4)

```bash
# Test core API endpoints
echo "Testing bus search..."
curl -s 'https://api.perundhu.com/api/v1/buses/search' \
  -H 'Content-Type: application/json' \
  -d '{"origin":"Chennai","destination":"Madurai","date":"2026-02-01"}' | jq '.[] | {bus_number, operator, fare, available_seats}' | head -5

echo "Testing location search..."
curl -s 'https://api.perundhu.com/api/v1/locations/search?query=Chennai' | jq '.[] | {id, name, city}' | head -5

echo "Testing routes..."
curl -s 'https://api.perundhu.com/api/v1/routes' | jq '.[] | {id, code, name}' | head -5

echo "Testing health..."
curl -s 'https://api.perundhu.com/actuator/health' | jq '.'
```

**✅ Success Criteria**:
- [ ] All endpoints respond with correct data
- [ ] Response times reasonable
- [ ] No missing data fields
- [ ] Proper error handling for invalid inputs

### 1.3 Frontend Testing (Hour 4-6)

```bash
# Test frontend functionality via browser
# Manual tests:
# 1. Navigate to https://perundhu.com
# 2. Verify page loads quickly (< 2 seconds)
# 3. Test search form:
#    - Select origin
#    - Select destination
#    - Select date
#    - Click search
# 4. Verify results display
# 5. Click on a bus result
# 6. Verify details page loads
# 7. Test responsive design (mobile view)
# 8. Check all images load
# 9. Test navigation menu
# 10. Test language switching (if applicable)

# Automated testing (if available)
npm run test:e2e

# Lighthouse performance check
lighthouse https://perundhu.com --output-path=./lighthouse-report.html
```

**✅ Success Criteria**:
- [ ] Page loads in < 2 seconds
- [ ] All UI elements visible and interactive
- [ ] Images load properly
- [ ] No console errors
- [ ] Lighthouse score > 80

### 1.4 Performance Baseline Measurement (Hour 6-8)

```bash
# Measure baseline performance
ab -n 100 -c 10 https://perundhu.com/

# Expected output shows:
# - Requests per second
# - Mean latency
# - Transfer rate

# More detailed testing
wrk -t4 -c100 -d30s https://perundhu.com/

# API performance test
wrk -t4 -c100 -d30s 'https://api.perundhu.com/api/v1/buses/search?origin=Chennai&destination=Madurai'
```

**✅ Baseline Metrics**:
- [ ] Frontend page load: < 1 second (p99)
- [ ] API response time: < 500ms (p99)
- [ ] Requests per second: > 100
- [ ] Error rate: < 0.1%

### 1.5 Database Verification (Hour 8-12)

```bash
# Check database size and growth
gcloud sql instances describe perundhu-prod-mysql \
  --format='value(currentDiskSize)' \
  --project=perundhu-production-2026

# Check replication status
gcloud sql instances describe perundhu-prod-mysql \
  --format='value(replicaConfiguration)' \
  --project=perundhu-production-2026

# Verify backups
gcloud sql backups list \
  --instance=perundhu-prod-mysql \
  --project=perundhu-production-2026
```

**✅ Database Health**:
- [ ] Disk usage < 50% (100 GB total)
- [ ] Replication lag < 1 second
- [ ] Automatic backup completed
- [ ] No slow queries (> 2 seconds)

### 1.6 Monitoring Dashboard Review

```bash
# Open GCP Console and view custom dashboard:
# https://console.cloud.google.com/monitoring/dashboards

# Check each metric:
# - Request count (should be steady)
# - Error rate (should be < 1%)
# - Latency (should be consistent)
# - CPU usage (should be 20-40%)
# - Memory usage (should be 30-50%)
# - Disk usage (should be growing slowly)

# Screenshot dashboard for record
```

**✅ Dashboard Metrics**:
- [ ] No red/critical alerts
- [ ] All metrics within expected ranges
- [ ] Trends are normal (no spikes)

---

## WEEK 1 MONITORING

### 2.1 Daily Checks (Repeat Daily)

```bash
# 08:00 AM - Morning Status Check
echo "=== MORNING STATUS CHECK ==="
date

# Backend status
curl -s https://api.perundhu.com/actuator/health | jq '.status'

# Frontend status
curl -I https://perundhu.com/ | grep HTTP

# Error count (last 24 hours)
gcloud logging read \
  'severity=ERROR' \
  --limit=1 \
  --format='count(resource)' \
  --project=perundhu-production-2026

# Latency p99 (last 24 hours)
gcloud monitoring time-series list \
  --filter='metric.type="run.googleapis.com/request_latencies" AND metric.response_code_class="2xx"' \
  --project=perundhu-production-2026
```

**Daily Checklist**:
- [ ] Backend health: UP
- [ ] Frontend responds: HTTP 200
- [ ] Error count acceptable: < 10/day
- [ ] No critical alerts
- [ ] Database status: RUNNABLE
- [ ] Disk usage trending: normal
- [ ] Backup: completed

### 2.2 Incident Response

```bash
# If issues detected, follow incident response:

INCIDENT RESPONSE CHECKLIST:

1. ALERT RECEIVED
   [ ] Acknowledge alert
   [ ] Create incident ticket
   [ ] Notify on-call team

2. INVESTIGATION
   [ ] Check Cloud Run logs
   [ ] Check Cloud SQL status
   [ ] Check monitoring dashboard
   [ ] Review error messages

3. ROOT CAUSE ANALYSIS
   [ ] Was there a deployment?
   [ ] Did metrics change suddenly?
   [ ] Any resource exhaustion?
   [ ] Any network issues?

4. MITIGATION
   [ ] If backend: scale up instances
   [ ] If database: check connections
   [ ] If code issue: prepare rollback
   [ ] Communicate status to stakeholders

5. RESOLUTION
   [ ] Issue resolved
   [ ] Metrics normalized
   [ ] All systems healthy
   [ ] Document incident

6. POST-INCIDENT
   [ ] Root cause documented
   [ ] Preventive measures planned
   [ ] Team debriefing scheduled
```

### 2.3 Weekly Performance Report

```bash
# Generate weekly performance report
echo "=== WEEK 1 PERFORMANCE REPORT ==="

# Total requests
gcloud logging read \
  'resource.type=cloud_run_revision' \
  --format='count(resource)' \
  --project=perundhu-production-2026

# Error rate
gcloud logging read \
  'severity=ERROR OR resource.type=cloud_run_revision AND severity>=ERROR' \
  --format='count(resource)' \
  --project=perundhu-production-2026

# Average latency
gcloud monitoring time-series list \
  --filter='metric.type="run.googleapis.com/request_latencies"' \
  --project=perundhu-production-2026

# Peak traffic hour
gcloud logging read \
  'resource.type=cloud_run_revision' \
  --format='value(timestamp)' \
  --project=perundhu-production-2026 | cut -d'T' -f2 | cut -d':' -f1 | sort | uniq -c | sort -rn | head -1

# Database growth
gcloud sql instances describe perundhu-prod-mysql \
  --format='value(currentDiskSize)' \
  --project=perundhu-production-2026
```

---

## PERFORMANCE OPTIMIZATION

### 3.1 Query Performance Analysis

```bash
# Enable query insights for slow queries
gcloud sql instances patch perundhu-prod-mysql \
  --insights-config-query-insights-enabled \
  --project=perundhu-production-2026

# Identify slow queries
gcloud sql operations list \
  --instance=perundhu-prod-mysql \
  --project=perundhu-production-2026
```

### 3.2 Cache Optimization

```bash
# Check frontend cache hit rate
curl -I https://perundhu.com/assets/main.js | grep "cache-control"

# Expected: cache-control: public, max-age=31536000 (1 year for versioned assets)

# Monitor cache effectiveness via CloudCDN
gcloud compute backend-services describe [BACKEND_SERVICE] \
  --global \
  --format='value(cdnPolicy)'
```

### 3.3 Image Optimization

```bash
# Verify images are optimized
curl -s https://perundhu.com/images/[image] -H "Accept-Encoding: gzip" | wc -c

# Should be < 100KB for typical bus/location images
# Verify gzip compression is active
curl -I https://perundhu.com/images/[image] | grep "content-encoding"

# Expected: content-encoding: gzip
```

### 3.4 Database Query Optimization

```bash
# After a week of data, analyze query patterns
# Find most-run queries that could be optimized

# MySQL Query Analysis:
mysql -h 127.0.0.1 -u prod_user -p"$DB_PASSWORD" perundhu << 'EOF'

-- Find tables needing maintenance
SELECT table_name, table_rows, data_length
FROM information_schema.tables
WHERE table_schema = 'perundhu'
ORDER BY table_rows DESC;

-- Check index usage
SELECT object_schema, object_name, count_read, count_write, count_delete, count_update
FROM performance_schema.table_io_waits_summary_by_table
WHERE object_schema = 'perundhu'
ORDER BY count_read DESC;

-- Check for missing indexes
SELECT * FROM information_schema.statistics
WHERE table_schema = 'perundhu'
GROUP BY table_name
HAVING COUNT(*) > 0;

EOF
```

---

## SECURITY VERIFICATION

### 4.1 SSL/TLS Security Check

```bash
# Verify SSL/TLS configuration
openssl s_client -connect api.perundhu.com:443 -showcerts 2>/dev/null | grep -A 10 "Server certificate"

# Expected: TLS 1.2 or 1.3 minimum
# Verify protocol version
openssl s_client -connect perundhu.com:443 -tls1_2 2>/dev/null | grep "Protocol"

# Test SSL Labs (external)
curl https://api.ssllabs.com/api/v3/analyze?host=perundhu.com
```

### 4.2 CORS Configuration Check

```bash
# Verify CORS headers
curl -I -H "Origin: https://perundhu.com" \
  https://api.perundhu.com/api/v1/buses/search

# Expected headers:
# Access-Control-Allow-Origin: https://perundhu.com
# Access-Control-Allow-Methods: GET, POST, OPTIONS
```

### 4.3 Security Headers Check

```bash
# Verify security headers present
curl -I https://perundhu.com/ | grep -i "security\|x-frame\|x-content\|strict\|csp"

# Expected headers:
# Strict-Transport-Security: max-age=31536000; includeSubDomains
# X-Frame-Options: DENY
# X-Content-Type-Options: nosniff
# X-XSS-Protection: 1; mode=block
```

### 4.4 Authentication & Authorization Check

```bash
# Test unauthenticated access (should work for public APIs)
curl -s https://api.perundhu.com/api/v1/buses/search -w "\n%{http_code}\n" | tail -1

# Expected: 200

# Test protected endpoints (should require auth if applicable)
curl -s https://api.perundhu.com/api/v1/bookings -w "\n%{http_code}\n" | tail -1

# Expected: 401 (Unauthorized) if not authenticated
```

---

## USER ACCEPTANCE TESTING

### 5.1 UAT Checklist

**Functional Testing**:
- [ ] User can search for buses
- [ ] Results display correctly
- [ ] Can filter by price/duration
- [ ] Can sort by departure time
- [ ] Can view bus details
- [ ] Can view route on map
- [ ] Can proceed to booking
- [ ] Can complete payment
- [ ] Booking confirmation sent
- [ ] Can view booking history

**Cross-Browser Testing**:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Chrome
- [ ] Mobile Safari

**Mobile Testing**:
- [ ] iPhone (iOS 15+)
- [ ] Android (Android 12+)
- [ ] Tablet orientation support
- [ ] Touch interactions
- [ ] Network throttling (3G/4G)

**Accessibility Testing**:
- [ ] Keyboard navigation
- [ ] Screen reader compatibility
- [ ] Color contrast ratios
- [ ] Font sizes readable
- [ ] Form labels present
- [ ] Error messages clear

### 5.2 User Feedback Collection

```bash
# Post-launch survey
# Questions for users:
# 1. Site loads quickly? (Yes/No)
# 2. Easy to search for buses? (1-5 scale)
# 3. Results relevant? (1-5 scale)
# 4. Booking process smooth? (1-5 scale)
# 5. Payment successful? (Yes/No)
# 6. Any issues encountered? (Free text)

# Collect feedback via:
# - In-app survey
# - Email
# - Social media
# - Support tickets
```

---

## POST-LAUNCH MONITORING DASHBOARD

### 6.1 Key Metrics to Track

```
REAL-TIME METRICS (Update every 5 minutes):
├── Requests/sec: [CURRENT]
├── Error rate: [CURRENT]%
├── Latency p99: [CURRENT]ms
├── CPU usage: [CURRENT]%
├── Memory usage: [CURRENT]%
└── Database connections: [CURRENT]

DAILY METRICS (Update every 24 hours):
├── Total requests: [COUNT]
├── Total errors: [COUNT]
├── Avg response time: [TIME]ms
├── Peak traffic hour: [HOUR]
├── Unique users: [COUNT]
└── Database size: [SIZE]

WEEKLY METRICS (Update every 7 days):
├── Uptime: [PERCENTAGE]%
├── Error rate: [PERCENTAGE]%
├── Bookings: [COUNT]
├── Revenue: [AMOUNT]
├── User growth: [PERCENTAGE]
└── Cost: $[AMOUNT]
```

### 6.2 Alert Thresholds

```
🚨 CRITICAL ALERTS (Notify immediately):
- Error rate > 5%
- Latency p99 > 5 seconds
- CPU > 90%
- Memory > 90%
- Disk > 85%
- Database connections > 150
- API response code 500+ > 10% of requests

⚠️  WARNING ALERTS (Notify within 1 hour):
- Error rate > 2%
- Latency p99 > 2 seconds
- CPU > 70%
- Memory > 70%
- Disk > 70%

ℹ️ INFO ALERTS (Log and review):
- Any changes in error types
- Performance trend changes
- New slow queries detected
```

### 6.3 Escalation Procedure

```
LEVEL 1 - On-Call Engineer
├── Acknowledge alert within 15 minutes
├── Basic troubleshooting
├── Check logs and metrics
└── Decision: Resolve or escalate

LEVEL 2 - DevOps Lead
├── If on-call unable to resolve
├── Check infrastructure
├── Possible scaling/restart
└── Decision: Resolve or escalate

LEVEL 3 - Engineering Manager
├── If issue not resolved in 1 hour
├── Major system failure
├── Potential data loss
└── May authorize rollback

LEVEL 4 - CTO/VP Engineering
├── If issue not resolved in 2 hours
├── Service completely unavailable
├── Business impact critical
└── Emergency procedures activated
```

---

## SUCCESS CRITERIA (Day 30)

### 30-Day Production Goals

```
AVAILABILITY:
✅ Uptime: > 99.5% (max 3.6 hours downtime/month)
✅ SLA met: Every week

PERFORMANCE:
✅ Latency p99: < 1 second
✅ Error rate: < 0.5%
✅ Page load: < 2 seconds

SCALABILITY:
✅ Handle 10x traffic spike
✅ Database: no query > 2 seconds
✅ Auto-scaling responsive: < 2 minutes

SECURITY:
✅ Zero critical vulnerabilities
✅ SSL A+ rating maintained
✅ OWASP Top 10 protected

BUSINESS:
✅ User growth: on target
✅ Booking conversion: on target
✅ Cost per transaction: < target

USER SATISFACTION:
✅ Support tickets: < 10/day
✅ User feedback: > 4.0/5.0 stars
✅ No major complaints
```

---

## SIGN-OFF

**Post-Launch Verification Sign-Off**:

- [ ] **Operations Lead**: `_____________ Date: _______`
- [ ] **DevOps Engineer**: `_____________ Date: _______`
- [ ] **Product Owner**: `_____________ Date: _______`

---

**Document Version**: 1.0  
**Created**: January 23, 2026  
**Review**: Daily (Week 1), Weekly (Month 1), Monthly thereafter  
**Owner**: Operations / Support Team

✅ **Production deployment verified and operational!**
