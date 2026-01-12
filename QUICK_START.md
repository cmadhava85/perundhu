# GraphHopper Integration - Quick Start Guide

## ⚡ 5-Minute Setup

### Step 1: Download OSM Data (Do This Once)
```bash
# Create data folder
mkdir -p backend/data/graphhopper

# Download Tamil Nadu data (~30 min on 100 Mbps)
cd backend/data/graphhopper
wget https://download.geofabrik.de/asia/india/tamil-nadu-latest.osm.pbf

# Verify (~150-200 MB)
ls -lh tamil-nadu-latest.osm.pbf
```

### Step 2: Build Backend
```bash
cd backend
./gradlew clean build -x test
# Takes 2-3 minutes
```

### Step 3: Run Database Migrations
```bash
./gradlew flywayMigrate
# Creates route_validation_alerts table
```

### Step 4: Start Backend
```bash
SPRING_PROFILES_ACTIVE=graphhopper ./gradlew bootRun
# Watch for: "Ready to serve routes" in logs
# This takes 1-2 minutes on first start (GraphHopper compiles graph)
```

### Step 5: Test It
```bash
# In another terminal, test route submission:
curl -X POST http://localhost:8080/api/v1/contributions/routes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "busNumber": "TEST123",
    "busName": "Test Route",
    "fromLocationName": "Chennai",
    "toLocationName": "Madurai",
    "fromLatitude": 13.0827,
    "fromLongitude": 80.2707,
    "toLatitude": 9.9252,
    "toLongitude": 78.1198,
    "departureTime": "2024-01-15T08:00:00",
    "arrivalTime": "2024-01-15T10:00:00",
    "stops": []
  }'

# Response should include contribution ID
# This 2-hour claim for 160 km will trigger an alert (95% confidence)
```

### Step 6: Check Alert Was Created
```bash
# In database:
mysql -u root -p perundhu

SELECT id, contribution_id, validation_type, confidence_score, status 
FROM route_validation_alerts 
WHERE status = 'PENDING' LIMIT 5;

# Should show your alert!
```

### Step 7: Get Pending Alerts via API
```bash
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  http://localhost:8080/api/v1/admin/validation-alerts/pending
```

Done! ✅

## 📚 Documentation Map

| Document | Purpose | Read Time |
|----------|---------|-----------|
| **This file** | Quick start | 5 min |
| [GRAPHHOPPER_INTEGRATION.md](GRAPHHOPPER_INTEGRATION.md) | Full setup & arch | 30 min |
| [VALIDATION_ALERTS_API.md](VALIDATION_ALERTS_API.md) | REST API reference | 15 min |
| [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md) | Production deploy | 20 min |
| [TESTING_GUIDE.md](TESTING_GUIDE.md) | Test procedures | 25 min |
| [ARCHITECTURE_DIAGRAMS.md](ARCHITECTURE_DIAGRAMS.md) | System diagrams | 15 min |

## 🔍 Understanding the System (5 Minutes)

### What Happens When User Submits Route?

```
User submits: Chennai → Madurai in 2 hours (160 km)
     ↓
Backend validates:
  ✓ Format & required fields
  ✓ Coordinates are valid
  ✓ Times are in future
     ↓
GraphHopper calculates realistic time: 4 hours
     ↓
Compares: 2 hours vs 4 hours expected
  → Deviation: 50% too fast
  → Alert created with 95% confidence
     ↓
Contribution SAVED (even with alert)
  User can provide context if they want
     ↓
Admin sees alert in dashboard
     ↓
Admin reviews and decides:
  - APPROVE: Route is valid (user context confirmed)
  - DISMISS: False positive (update threshold)
  - REJECT: Route is invalid (prevent use)
  - ESCALATE: Needs investigation
```

### What Gets Validated?

| Aspect | Validates | Example |
|--------|-----------|---------|
| **Duration** | Is travel time realistic? | 2h for 160km = Alert |
| **Stop Order** | Are stops in logical sequence? | Stop in wrong city = Alert |
| **Speed** | Can bus actually go that fast? | 300 km/h = Alert |

### Confidence Scores Mean...

| Score | Interpretation |
|-------|-----------------|
| **90-100%** | Certain there's an issue |
| **75-89%** | Probably has an issue |
| **65-74%** | Questionable |
| **50-64%** | Uncertain |
| **< 50%** | Probably valid despite flag |

## 🆘 Troubleshooting

### GraphHopper Won't Start
```
Error: "Unable to load graph"

Fix:
# Check file exists
ls -lh backend/data/graphhopper/tamil-nadu-latest.osm.pbf

# If missing, download it
cd backend/data/graphhopper
wget https://download.geofabrik.de/asia/india/tamil-nadu-latest.osm.pbf
```

### Out of Memory
```
Error: java.lang.OutOfMemoryError: Java heap space

Fix:
export JAVA_OPTS="-Xmx2g"
./gradlew bootRun
```

### Slow Route Submission
```
Taking > 1 second per request

Normal on first few requests while GraphHopper initializes
Should drop to 50-200 ms once warmed up
If persistent, check machine resources
```

### No Alerts Being Created
```
Routes not triggering alerts

Possible causes:
1. GraphHopper not loaded (check logs for "Ready to serve routes")
2. Routes are actually realistic (working as intended!)
3. Validation scores below threshold (tuning needed)

Check logs:
grep "GraphHopper" /path/to/logs/
grep "validation" /path/to/logs/
```

## 📊 Monitoring

### Daily Checks
```bash
# Get pending alerts
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8080/api/v1/admin/validation-alerts/pending?page=0&size=10"

# Check stats
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8080/api/v1/admin/validation-alerts/stats"
```

### Expected Metrics
- **Pending alerts**: Should be < 20 (depends on volume)
- **False positive rate**: Target < 20%
- **High confidence alerts**: Most should be in top 25%

### If False Positive Rate Too High
Validation is too strict. Increase tolerance:
```java
// In GraphHopperRoutingAdapter.java
private static final double DURATION_TOLERANCE = 1.50; // was 1.25
```

### If Not Catching Errors
Validation is too lenient. Decrease tolerance:
```java
// In GraphHopperRoutingAdapter.java
private static final double DURATION_TOLERANCE = 1.10; // was 1.25
```

## 📈 Real Examples

### Example 1: Valid Route (Passes Validation)
```
Chennai → Bangalore: 350 km
Claimed time: 6 hours
Expected time: 5.5 hours (from GraphHopper)
Ratio: 6 / 5.5 = 1.09 (within 25% tolerance)
Result: ✅ PASS - No alert
```

### Example 2: Suspicious Route (Creates Alert)
```
Chennai → Bangalore: 350 km
Claimed time: 2 hours (impossible!)
Expected time: 5.5 hours
Ratio: 2 / 5.5 = 0.36 (way too fast)
Confidence: 95% (certain error)
Result: ⚠️ ALERT - Flagged for review
Admin action: Probably REJECT
```

### Example 3: Edge Case (Low Confidence Alert)
```
Chennai → Madurai: 160 km
Claimed time: 3 hours
Expected time: 4 hours
Ratio: 3 / 4 = 0.75 (25% faster, within tolerance)
Confidence: 55% (uncertain)
Result: ⚠️ ALERT - But borderline
Admin action: Review context
  - User notes: "Using new expressway"
  → APPROVE (legitimate edge case)
```

## 🎯 Key Points

1. **Routes are not blocked** - Alerts just flag suspicious entries
2. **Admins have final say** - They can approve even flagged routes
3. **System learns** - Dismissed false positives help tune thresholds
4. **Non-intrusive** - Existing code paths unchanged
5. **Fast** - 50-200 ms per validation

## 🚀 Next: Frontend Integration

Once backend is running, frontend can:

1. **Show validation alerts to users** during submission
2. **Let users provide evidence** if they think validation is wrong
3. **Display admin dashboard** with pending alerts
4. **Show validation statistics** for data quality monitoring

See [GRAPHHOPPER_INTEGRATION.md](GRAPHHOPPER_INTEGRATION.md) for full frontend integration guide.

## ✅ Checklist

- [ ] Downloaded OSM data
- [ ] Built backend
- [ ] Ran migrations
- [ ] Started backend (see "Ready to serve routes")
- [ ] Tested route submission
- [ ] Checked alert in database
- [ ] Verified admin API works
- [ ] Reviewed admin dashboard (upcoming feature)

All ✅? You're ready for production! 🎉

---

## 📞 Quick Links

- **Need help?** → Check [GRAPHHOPPER_INTEGRATION.md](GRAPHHOPPER_INTEGRATION.md) § Troubleshooting
- **API reference?** → See [VALIDATION_ALERTS_API.md](VALIDATION_ALERTS_API.md)
- **Deploying?** → Follow [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)
- **Testing?** → Read [TESTING_GUIDE.md](TESTING_GUIDE.md)
- **Architecture?** → Study [ARCHITECTURE_DIAGRAMS.md](ARCHITECTURE_DIAGRAMS.md)

---

*Last Updated: 2024-01-15*
*Status: Ready for Use*
