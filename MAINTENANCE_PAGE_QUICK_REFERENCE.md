# Maintenance Page - Quick Reference

## 🎯 What Problem Does This Solve?

**Before:** When database goes down → users see ugly 500 errors or blank pages  
**After:** When database goes down → users see beautiful "We'll be back soon!" page

## 📋 Maintenance Scenarios

| Scenario | Trigger | Auto? | Cost |
|----------|---------|-------|------|
| **Database Down** | Cloud SQL unreachable | ✅ Yes | $0 |
| **Scheduled Maintenance** | Admin sets flag | ❌ Manual | $0 |
| **Backend Startup** | Cold start, deployment | ✅ Yes | $0 |
| **Backend Unreachable** | Cloud Run down | ✅ Yes | $0 |

## 🚀 Quick Commands

### Enable Maintenance Mode (Manual)
```bash
# Via convenience endpoint
curl https://your-backend-url/api/v1/maintenance/admin/toggle?enable=true

# Via settings API
curl -X PUT https://your-backend-url/api/v1/admin/settings/update \
  -H "Content-Type: application/json" \
  -d '{"key": "enableMaintenanceMode", "value": "true"}'
```

### Disable Maintenance Mode
```bash
# Via convenience endpoint
curl https://your-backend-url/api/v1/maintenance/admin/toggle?enable=false

# Via settings API
curl -X PUT https://your-backend-url/api/v1/admin/settings/update \
  -H "Content-Type: application/json" \
  -d '{"key": "enableMaintenanceMode", "value": "false"}'
```

### Check Current Status
```bash
curl https://your-backend-url/api/v1/maintenance/status | jq
```

## 📱 User Experience

### What Users See

**Scenario 1: Database Down**
```
🗄️
Technical Difficulties

We're experiencing technical difficulties.
Our team is working to restore service.

🔄 Auto-refreshing...
```

**Scenario 2: Scheduled Maintenance**
```
🔧
Under Maintenance

We're performing scheduled maintenance to improve your experience.
We'll be back soon!

Expected to return: in 30 minutes

🔄 Auto-refreshing...
```

**Scenario 3: Backend Starting**
```
⚙️
Service Starting

The service is starting up.
Please wait a moment and try again.

🔄 Auto-refreshing...
```

## 🔬 How to Test

### Test 1: Enable/Disable Manual Mode
```bash
# 1. Enable
curl https://your-backend/api/v1/maintenance/admin/toggle?enable=true

# 2. Visit app in browser → Should see maintenance page

# 3. Disable
curl https://your-backend/api/v1/maintenance/admin/toggle?enable=false

# 4. Wait 30s or refresh → App loads normally
```

### Test 2: Simulate Database Outage (Staging Only!)
```bash
# Stop database (DON'T DO IN PRODUCTION!)
gcloud sql instances patch perundhu-production-db \
  --activation-policy=NEVER \
  --project=perundhu-prod-001

# Visit app → Should see "DATABASE_UNAVAILABLE" message

# Restart database
gcloud sql instances patch perundhu-production-db \
  --activation-policy=ALWAYS \
  --project=perundhu-prod-001

# Wait 30s → App recovers automatically
```

### Test 3: Cold Start Detection
```bash
# Scale backend to zero
gcloud run services update perundhu-backend \
  --min-instances=0 \
  --region=us-central1 \
  --project=perundhu-prod-001

# Wait 3-5 minutes for scale-down

# Visit app → Brief "BACKEND_NOT_READY" during cold start

# App recovers in 5-10 seconds
```

## 🎨 Customization

### Set Estimated Restore Time
```sql
-- Set ETA (1 hour from now)
UPDATE system_settings 
SET setting_value = '2026-04-01T10:00:00Z' 
WHERE setting_key = 'maintenanceEstimatedRestoreTime';

-- Clear ETA
UPDATE system_settings 
SET setting_value = NULL 
WHERE setting_key = 'maintenanceEstimatedRestoreTime';
```

### Translations

The maintenance page automatically uses Tamil or English based on the user's language preference.

**English:**
- "Under Maintenance"
- "We're performing scheduled maintenance..."
- "Auto-refreshing..."

**Tamil:**
- "பராமரிப்பு பணி"
- "இந்த சேவை தற்போது பராமரிப்பில் உள்ளது..."
- "தானாக புதுப்பிக்கப்படும்..."

## 💰 Cost Impact

**Total: $0.00/month**

Why free?
- Uses existing Cloud Run / Cloud SQL
- 1 lightweight query per check (`SELECT 1`)
- Polls only every 30 seconds
- Stops polling when not in maintenance
- Well within Cloud Run free tier (2M requests/month)

## 🔧 Troubleshooting

### Issue: Maintenance page not showing when it should

**Solution 1:** Check if endpoint is whitelisted
```java
// In SecurityFilterChainManager.java
private static final String[] PUBLIC_ROUTES = {
    "/api/v1/maintenance/**",  // This line must exist
    // ...
};
```

**Solution 2:** Check database setting
```sql
SELECT * FROM system_settings 
WHERE setting_key = 'enableMaintenanceMode';

-- Should return: { setting_value: 'true' }
```

**Solution 3:** Check backend logs
```bash
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=perundhu-backend" \
  --limit 50 \
  --project=perundhu-prod-001 \
  --format="table(timestamp, textPayload)"
```

### Issue: Maintenance page showing when everything is fine

**Solution 1:** Disable maintenance mode
```bash
curl https://your-backend/api/v1/maintenance/admin/toggle?enable=false
```

**Solution 2:** Check database connectivity
```bash
# Check if backend can reach database
gcloud sql operations list --instance=perundhu-production-db --project=perundhu-prod-001
```

**Solution 3:** Check Spring Boot health
```bash
curl https://your-backend/actuator/health/readiness
```

### Issue: Frontend not auto-refreshing

**Reason:** Polling only works when browser tab is **focused** (to save backend costs)

**Solution:** Click on the tab to bring it into focus, wait up to 30 seconds

## 📊 Monitoring

### Check Maintenance Status Endpoint Usage
```bash
# View recent maintenance checks
gcloud logging read 'jsonPayload.url=~"/api/v1/maintenance/status"' \
  --limit=20 \
  --project=perundhu-prod-001 \
  --format="table(timestamp, httpRequest.status)"
```

### Alert on Database Downtime (Optional)
```bash
# Create alert policy (free tier)
gcloud alpha monitoring policies create \
  --notification-channels=YOUR_CHANNEL_ID \
  --display-name="Database Unavailable" \
  --condition-display-name="Maintenance endpoint returns 503" \
  --condition-threshold-value=3 \
  --condition-threshold-duration=300s
```

## 📄 Related Files

- **Implementation Guide:** `/MAINTENANCE_PAGE_IMPLEMENTATION_GUIDE.md`
- **Backend Controller:** `/backend/app/src/main/java/com/perundhu/adapter/in/rest/MaintenanceController.java`
- **Frontend Component:** `/frontend/src/components/MaintenancePage.tsx`
- **React Hook:** `/frontend/src/hooks/useMaintenanceStatus.ts`

## 🎯 Best Practices

1. **Before deploying breaking changes:**
   ```bash
   # Enable maintenance mode first
   curl https://your-backend/api/v1/maintenance/admin/toggle?enable=true
   
   # Deploy your changes
   
   # Disable maintenance mode
   curl https://your-backend/api/v1/maintenance/admin/toggle?enable=false
   ```

2. **When doing database migrations:**
   ```bash
   # Set maintenance mode + ETA
   curl https://your-backend/api/v1/maintenance/admin/toggle?enable=true
   
   # Run Flyway migrations
   
   # Wait for completion
   
   # Disable maintenance mode
   curl https://your-backend/api/v1/maintenance/admin/toggle?enable=false
   ```

3. **For scheduled downtime:**
   - Set `enableMaintenanceMode` = true 5 minutes before
   - Set `maintenanceEstimatedRestoreTime` to inform users
   - Perform maintenance
   - Disable maintenance mode when done

## ✅ Deployment Checklist

Before deploying to production:

- [ ] Backend: `MaintenanceController.java` deployed
- [ ] Backend: Security config updated (whitelist `/api/v1/maintenance/**`)
- [ ] Frontend: `MaintenancePage.tsx`, `MaintenancePage.css` deployed
- [ ] Frontend: `useMaintenanceStatus.ts` deployed
- [ ] Frontend: `App.tsx` updated with `MaintenanceWrapper`
- [ ] Database: `maintenanceEstimatedRestoreTime` setting exists (optional)
- [ ] Test: Manual enable/disable works
- [ ] Test: Status endpoint returns 200 when healthy
- [ ] Test: Status endpoint returns 503 when in maintenance

---

**Questions?** Check the full implementation guide: `MAINTENANCE_PAGE_IMPLEMENTATION_GUIDE.md`
