# Database Connection Optimization Guide

## Problem Summary
You were experiencing `CommunicationsException: Communications link failure` and `Connection is closed` errors intermittently. The root cause: **stale connection pool** when the application was idle between requests.

When you restarted the server, it worked because HikariCP created a fresh connection pool with new, valid connections.

---

## Why This Happens

### Connection Lifecycle Issues
1. **Cloud SQL Closes Idle Connections**: Cloud SQL closes connections that haven't sent data for ~30 minutes
2. **HikariCP Doesn't Validate**: By default, HikariCP reuses old connections without testing if they're still valid
3. **Connection Accumulation**: Old connections aren't retired (no max-lifetime), so pool gets stale over time
4. **Small Pool Size**: Only 5 connections meant any spike could exhaust the pool

### Timeline
```
T0:      Application starts → HikariCP creates 1-5 connections
T5m:     Requests succeed → Connections are used
T10m:    Traffic drops → Connections go idle  
T30m:    Cloud SQL closes idle connections
T31m:    New request comes in → Tries to use stale connection → FAIL
```

---

## Solutions Implemented

### 1. **Connection Validation** ✅
```properties
spring.datasource.hikari.connection-test-query=SELECT 1
spring.datasource.hikari.validation-timeout=5000
```
**Effect**: Tests each connection before using it. If stale, discards and creates new one.

### 2. **Shorter Idle Timeout** ✅
```properties
# Before
spring.datasource.hikari.idle-timeout=120000  # 120 seconds

# After
spring.datasource.hikari.idle-timeout=60000   # 60 seconds
```
**Effect**: Retires stale connections before Cloud SQL closes them (theoretical: <30min, practical: error happens around 60s idle)

### 3. **Max Lifetime** ✅
```properties
spring.datasource.hikari.max-lifetime=300000  # 5 minutes
```
**Effect**: All connections are recreated every 5 minutes, ensuring they never get too old.

### 4. **Increased Pool Size** ✅
```properties
# Before
spring.datasource.hikari.maximum-pool-size=5

# After
spring.datasource.hikari.maximum-pool-size=8
```
**Effect**: More capacity to handle traffic spikes without exhausting connections. Still cost-optimized.

### 5. **Increased Minimum Idle** ✅
```properties
# Before
spring.datasource.hikari.minimum-idle=1

# After
spring.datasource.hikari.minimum-idle=2
```
**Effect**: Always keeps 2 warm connections ready, reducing cold-start latency.

### 6. **Leak Detection** ✅
```properties
spring.datasource.hikari.leak-detection-threshold=60000  # 60 seconds
```
**Effect**: Logs warnings if connections are held >60s without being returned, helps debug issues.

---

## Configuration Summary

| Setting | Before | After | Why |
|---------|--------|-------|-----|
| `maximum-pool-size` | 5 | 8 | More capacity |
| `minimum-idle` | 1 | 2 | Better concurrency |
| `idle-timeout` | 120s | 60s | Retire before Cloud SQL closes |
| `max-lifetime` | None | 300s (5m) | Force connection refresh |
| `connection-test-query` | None | SELECT 1 | Validate before use |
| `validation-timeout` | None | 5s | Quick validation |
| `leak-detection-threshold` | 0 (off) | 60s | Detect held connections |

---

## Environment Variables to Control

Set these in your Cloud Run deployment to fine-tune:

```bash
gcloud run deploy perundhu-backend-preprod \
  --set-env-vars="\
HIKARI_MAX_POOL_SIZE=8,\
HIKARI_MIN_IDLE=2,\
HIKARI_TIMEOUT=45000"
```

**Tuning Guide**:
- **Increase `HIKARI_MAX_POOL_SIZE`** if you see "Cannot get a connection" errors under load
- **Decrease `HIKARI_MIN_IDLE`** to save memory (but may increase latency)
- **Reduce cost**: Set `HIKARI_MAX_POOL_SIZE=5` and scale with Cloud Run traffic

---

## Best Practices Going Forward

### 1. **Monitor Connection Pool Health**
Add logging to track pool state:
```properties
logging.level.com.zaxxer.hikari=DEBUG
```
Watch for:
- Connection creation failures
- Timeout errors
- Leaked connections

### 2. **Test After Cost-Cutting Restarts**
When you stop/start servers:
```bash
# Wait 30-60 seconds for Cloud SQL to warm up
sleep 60

# Make a test request
curl https://your-backend/api/v1/locations
```

### 3. **Use Connection Pooling Metrics**
Enable in your monitoring:
```properties
# In Spring Boot Actuator
management.endpoints.web.exposure.include=health,metrics,hikaricp
```

### 4. **Set Up Alerts**
Monitor these metrics:
- `hikaricp.connections.active` - should not constantly max out
- `hikaricp.connections.idle` - should be > 0 when idle
- `hikaricp.connections.pending` - should be 0 or low
- Connection creation time > 5s = warning

### 5. **Cloud SQL Specific**
In Google Cloud Console → Cloud SQL:
- Set **Idle in transaction session kill timeout** to 5 minutes (default 0 = never kill)
- Enable **Binary Log** for monitoring
- Set appropriate **Backup window** to avoid connection drops

---

## Testing the Fix

### After deployment, run:
```bash
# Test rapid requests
for i in {1..100}; do
  curl -s "https://your-backend/api/v1/locations" > /dev/null
  echo "Request $i: OK"
done

# Wait for idle period (60+ seconds)
sleep 70

# Test after idle - should NOT fail now
curl https://your-backend/api/v1/locations
```

Expected: ✅ All requests succeed, including after idle period

---

## Fallback: If Issues Continue

If you still see connection errors after these changes:

1. **Increase pool further**: 
   ```bash
   HIKARI_MAX_POOL_SIZE=12
   ```

2. **Enable verbose logging**:
   ```properties
   logging.level.com.mysql.cj.jdbc=DEBUG
   logging.level.com.zaxxer.hikari=DEBUG
   ```

3. **Check Cloud SQL quotas**: 
   ```bash
   gcloud sql instances describe perundhu-preprod-mysql --format="value(settings.ipConfiguration)"
   ```

4. **Use Cloud SQL Proxy explicitly** (if not using socket):
   - Ensure Cloud SQL Auth Proxy is running
   - Check proxy logs for connection issues

---

## Cost Impact

These changes **increase memory by ~5-10MB** but virtually eliminate connection errors:
- **8 connections × ~1.5MB per connection** = ~12MB (vs 5-7.5MB before)
- **Faster error recovery** saves support overhead
- **Better user experience** = no 500 errors

For cost-cutting deployment: This trade-off is worth it!

---

## Files Modified

- `application-preprod.properties` - HikariCP & Hibernate configuration

**Deploy via**: GitHub Actions after committing these changes.
