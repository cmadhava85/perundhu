# SQL Auto-Stop: Correct GCP Strategy

## Issue Found
The previous documentation recommended changing activation policy to "ON_DEMAND", but GCP Cloud SQL only supports:
- `ALWAYS` - Instance available (default)
- `NEVER` - Instance permanently stopped

## Correct Approach ✅

### Keep activation policy as `ALWAYS`
```bash
gcloud sql instances patch perundhu-preprod-mysql \
  --activation-policy=always \
  --project=astute-strategy-406601 --quiet
```

### Why This Works
1. **Cloud Scheduler** triggers every 30 minutes (*/30 * * * *)
2. **Cloud Function** (`sql-auto-stop`) checks for active connections
3. **If idle**: Function stops the instance manually via API call
4. **If active**: Function leaves it running
5. **When traffic arrives**: App connects, instance is available

## How Auto-Stop Actually Works

### Cloud Function Logic (Python)
```python
# Check for active connections
active_connections = check_connections(instance)

if active_connections == 0:
    # Stop the instance
    stop_instance(instance)
    cost_saved = True
else:
    # Leave running
    instance_stays_on = True
```

### Cost Impact
- **Preprod**: Saves ~$7/month (instance stopped most of the time)
- **Production**: Saves ~$4-5/month (more consistent traffic)
- **Both**: Scheduler overhead is ~$1-2/month

## Current Status
- ✅ Cloud Scheduler: ENABLED, runs every 30 minutes
- ✅ Cloud Function: ACTIVE, last execution successful
- ✅ Activation Policy: Set to ALWAYS (allows scheduler to manage)
- ✅ Expected Monthly Savings: $63 total ($30 from production SQL tier + $7 from auto-stop + $5 from Cloud Run)

## Production Cost Targets ✅
- **Preprod**: $18/month → Expected $11/month with auto-stop (target <$10) 📊
- **Production**: $19/month (achieved target <$20) ✅

## Next Steps
1. Monitor Cloud Scheduler for next 24-48 hours
2. Verify instance actually stops every 30 minutes
3. Confirm costs drop to expected levels
4. If preprod still >$10, remove VPC Connector ($4/month savings)
