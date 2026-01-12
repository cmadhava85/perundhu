# GraphHopper Route Validation - Deployment Checklist

## Pre-Deployment (Development & Testing)

### Step 1: Download OSM Data (⏱️ ~30 minutes download)
```bash
# Create data directory if it doesn't exist
mkdir -p backend/data/graphhopper

# Download Tamil Nadu OSM extract (~150 MB)
cd backend/data/graphhopper
wget https://download.geofabrik.de/asia/india/tamil-nadu-latest.osm.pbf

# Verify download
ls -lh tamil-nadu-latest.osm.pbf  # Should be ~150-200 MB
```

### Step 2: Build Backend with GraphHopper
```bash
cd backend

# Build (adds GraphHopper dependency)
./gradlew clean build

# Verify GraphHopper is included
jar -tf build/libs/perundhu-backend-*.jar | grep graphhopper
```

### Step 3: Run Database Migrations
```bash
# Option A: Via Gradle Flyway
./gradlew flywayMigrate \
  -Dflyway.url=jdbc:mysql://localhost:3306/perundhu \
  -Dflyway.user=root \
  -Dflyway.password=root

# Option B: Via Spring Boot startup (automatic if hibernate.ddl-auto=update)
# migrations run automatically when app starts
```

### Step 4: Start Backend with GraphHopper Profile
```bash
# Option A: Command line
./gradlew bootRun --args='--spring.profiles.active=graphhopper'

# Option B: Environment variable
export SPRING_PROFILES_ACTIVE=graphhopper
./gradlew bootRun

# Option C: Docker (if using)
docker run -e SPRING_PROFILES_ACTIVE=graphhopper \
  -v $(pwd)/data/graphhopper:/app/data/graphhopper \
  perundhu-backend:latest
```

### Step 5: Verify Startup Logs
Look for these messages:
```
INFO  : Initializing GraphHopper routing engine...
INFO  : GraphHopper profiles configured: bus, van, car, motorcycle, bike, foot
INFO  : Graph data folder: ./data/graphhopper
DEBUG : Processing graph file: ./data/graphhopper/tamil-nadu-latest.osm.pbf
```

On first startup, GraphHopper will compile the graph (takes 1-2 minutes for Tamil Nadu):
```
INFO  : Preparing graph...
INFO  : Compiling CH (Contraction Hierarchies)... [may take several minutes]
DEBUG : Graph compiled successfully
INFO  : Ready to serve routes
```

### Step 6: Test Route Submission
```bash
# Submit a test route with suspicious timing
curl -X POST http://localhost:8080/api/v1/contributions/routes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "busNumber": "TEST123",
    "busName": "Test Express",
    "fromLocationName": "Chennai",
    "toLocationName": "Madurai",
    "fromLatitude": 13.0827,
    "fromLongitude": 80.2707,
    "toLatitude": 9.9252,
    "toLongitude": 78.1198,
    "departureTime": "2024-01-15T08:00:00",
    "arrivalTime": "2024-01-15T10:00:00",
    "stops": [
      {
        "name": "Chengalpattu",
        "latitude": 12.6801,
        "longitude": 79.9864,
        "arrivalTime": "2024-01-15T08:45:00",
        "departureTime": "2024-01-15T08:50:00"
      }
    ]
  }'

# Response should include contribution ID
# Check if alert was created (2 hours for ~160 km is unrealistic)
```

### Step 7: Verify Alert Creation
```bash
# Check database directly
mysql -u root -p perundhu

SELECT * FROM route_validation_alerts WHERE status = 'PENDING' LIMIT 5;

# Should show an alert for the test route with high confidence score
```

### Step 8: Test Admin API
```bash
# Get pending alerts
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  "http://localhost:8080/api/v1/admin/validation-alerts/pending"

# Should return the test alert we just created

# Get statistics
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  "http://localhost:8080/api/v1/admin/validation-alerts/stats"

# Approve the test alert
curl -X POST \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"notes": "Test alert - confirmed working"}' \
  "http://localhost:8080/api/v1/admin/validation-alerts/{alertId}/approve"
```

## Pre-Production Deployment

### Step 1: Prepare Production Database
```sql
-- Ensure migrations are set to run
SET autocommit = 1;

-- Verify route_validation_alerts table exists
SHOW TABLES LIKE 'route_validation_alerts';

-- Expected columns:
DESCRIBE route_validation_alerts;
```

### Step 2: Optimize GraphHopper Configuration for Production
Edit `application-graphhopper.yml`:
```yaml
graphhopper:
  data-folder: /var/lib/perundhu/graphhopper  # Persistent volume
  # Disable graph rebuilding in production
  # (pre-build graphs on staging, copy to production)

logging:
  level:
    com.graphhopper: WARN  # Less verbose in production
```

### Step 3: Pre-build Graphs for Fast Startup
```bash
# On staging environment, build and cache the graphs
SPRING_PROFILES_ACTIVE=graphhopper ./gradlew bootRun
# Let it startup (5-30 seconds)
# Once logs show "Ready to serve routes", kill the process

# Copy compiled graphs to production
tar czf graphhopper-graphs.tar.gz data/graphhopper/
# Transfer to production and extract

# This way production startup skips the 1-2 minute graph compilation
```

### Step 4: Set Production Environment Variables
```bash
# For Kubernetes/Docker
export SPRING_PROFILES_ACTIVE=graphhopper
export DB_URL=jdbc:mysql://prod-db:3306/perundhu
export DB_USERNAME=perundhu_app
export DB_PASSWORD=$(cat /secrets/db-password)

# For Java system
export JAVA_OPTS="-Xmx2g -Xms1g"  # GraphHopper needs ~1.5-2 GB

# For GraphHopper (mount as persistent volume)
mkdir -p /data/graphhopper
# Mount volume: -v /persistent-storage/graphhopper:/data/graphhopper
```

### Step 5: Configure Logging
```yaml
logging:
  level:
    com.perundhu.infrastructure.adapter.routing: INFO
    com.perundhu.application.service.RouteValidationAlertService: INFO
    com.graphhopper: WARN
  file:
    name: /var/log/perundhu/validation-alerts.log
    max-size: 100MB
    max-history: 30
```

### Step 6: Set Up Admin Access
```bash
# Ensure admin users have ADMIN role
UPDATE users SET role = 'ADMIN' WHERE email = 'admin@perundhu.local';

# Verify they can access admin APIs
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  "https://api.perundhu.local/api/v1/admin/validation-alerts/stats"
```

### Step 7: Configure Alerting
```yaml
# In application-prod.yml, add monitoring

management:
  endpoints:
    web:
      exposure:
        include: health,metrics,prometheus
  metrics:
    export:
      prometheus:
        enabled: true

# Monitor these metrics:
# - validation_alerts_created (counter)
# - validation_alerts_pending (gauge)
# - false_positive_rate (gauge)
# - graphhopper_routing_duration_ms (histogram)
```

### Step 8: Test Production Deployment

#### Test 1: Route Submission
```bash
# Create test route
curl -X POST https://api.perundhu.local/api/v1/contributions/routes \
  -H "Authorization: Bearer $USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ /* valid route data */ }'

# Should get 200 response with contribution ID
```

#### Test 2: Alert Creation
```bash
# Admin checks if alert was created
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  "https://api.perundhu.local/api/v1/admin/validation-alerts/pending"

# Should see alert if route was suspicious
```

#### Test 3: Load Test
```bash
# Simulate 100 route submissions
ab -n 100 -c 10 \
  -p route-data.json \
  -T application/json \
  -H "Authorization: Bearer $USER_TOKEN" \
  https://api.perundhu.local/api/v1/contributions/routes

# Monitor:
# - Response time (should be < 1 second)
# - Alert creation time (should be < 50 ms)
# - Memory usage (GraphHopper should stay at ~500 MB)
```

## Post-Deployment Monitoring

### Daily Tasks
- Check pending alerts in admin dashboard
- Monitor false positive rate (target < 20%)
- Review high-confidence alerts (> 75)
- Approve/dismiss/reject alerts

### Weekly Tasks
- Analyze validation type statistics
- Check for trends (are certain routes always flagged?)
- Review admin notes for patterns
- Adjust confidence thresholds if needed

### Monthly Tasks
- Generate validation report
- Calculate data quality metrics
- Compare false positive rates
- Plan threshold tuning

## Troubleshooting

### Issue: GraphHopper fails to startup
```
Error: "Unable to load graph"
```
**Solution:**
```bash
# Check if OSM file exists
ls -lh data/graphhopper/tamil-nadu-latest.osm.pbf

# If missing, download it:
wget https://download.geofabrik.de/asia/india/tamil-nadu-latest.osm.pbf

# If file is corrupted, re-download
rm data/graphhopper/tamil-nadu-latest.osm.pbf
wget https://download.geofabrik.de/asia/india/tamil-nadu-latest.osm.pbf

# Remove compiled graphs to force rebuild
rm -rf data/graphhopper/graph-cache/
```

### Issue: OutOfMemoryError during startup
```
java.lang.OutOfMemoryError: Java heap space
```
**Solution:**
```bash
# Increase JVM heap size
export JAVA_OPTS="-Xmx2g -Xms1g"
./gradlew bootRun
```

### Issue: Too many false positives (high alert volume)
```
false_positive_rate > 30%
```
**Solution:**
1. Increase `DURATION_TOLERANCE` from 1.25 to 1.50
2. Increase confidence threshold for alerts
3. Review dismissed alerts to identify patterns
4. Adjust `STOP_SEQUENCE` deviation threshold from 0.30 to 0.40

### Issue: Not catching obvious errors
```
Routes with 5-hour claims for 160 km not flagged
```
**Solution:**
1. Decrease `DURATION_TOLERANCE` from 1.25 to 1.10
2. Lower confidence thresholds for alerts
3. Check if GraphHopper is calculating correct distances
4. Verify vehicle type is correctly mapped

## Rollback Plan

If GraphHopper integration causes issues:

### Quick Rollback (keep data)
```bash
# 1. Revert to previous backend version
git revert <commit-hash>

# 2. Rebuild
./gradlew clean build

# 3. Restart app (skips routing validation, keeps alerts in DB)
SPRING_PROFILES_ACTIVE= ./gradlew bootRun
```

### Full Rollback (remove alerts)
```bash
# 1. Stop backend
docker stop perundhu-backend

# 2. Delete alerts table
mysql -u root -p perundhu -e "DROP TABLE route_validation_alerts;"

# 3. Revert migrations
./gradlew flywayUndo

# 4. Deploy previous version
```

## Success Criteria

✅ **Deployment is successful when:**
- GraphHopper initializes without errors (check logs)
- Route submissions complete in < 1 second
- Validation alerts are created for suspicious routes
- Admin API endpoints return correct data
- False positive rate is < 20%
- No performance degradation (queries still fast)
- No database issues (migrations succeed)

✅ **System is production-ready when:**
- Tested with 1000+ real routes
- False positive rate stable at < 15%
- Admin dashboard integrated with frontend
- Alert thresholds tuned to data patterns
- Monitoring alerts configured
- Documentation complete
