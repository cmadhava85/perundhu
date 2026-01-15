# Cloud SQL Auto-Stop Function

Automatically stops Cloud SQL instances after 30 minutes of inactivity to save costs.

## Features

- ✅ Monitors database connections via Cloud Monitoring
- ✅ Stops SQL instance if no connections in last 30 minutes
- ✅ Skips if already stopped or has active connections
- ✅ Detailed logging and status responses
- ✅ Dry-run mode for testing

## Architecture

```
Cloud Scheduler (every 30 min)
    ↓
Cloud Function (checks connections)
    ↓
Cloud Monitoring API → Check connections
    ↓
Cloud SQL API → Stop instance if idle
```

## Deployment

### 1. Deploy the Cloud Function

```bash
cd cloud-functions/sql-auto-stop
chmod +x deploy.sh
./deploy.sh
```

This will:
- Create a service account with necessary permissions
- Deploy the Cloud Function to GCP
- Configure environment variables

### 2. Setup Cloud Scheduler

```bash
chmod +x setup-scheduler.sh
./setup-scheduler.sh
```

This will:
- Create a Cloud Scheduler job
- Schedule it to run every 30 minutes
- Configure it to call the Cloud Function

### 3. Test the Function

```bash
# Get the function URL
FUNCTION_URL=$(gcloud functions describe sql-auto-stop \
  --gen2 \
  --region=asia-south1 \
  --format="value(serviceConfig.uri)")

# Test it
curl $FUNCTION_URL
```

## Configuration

Environment variables (set in `deploy.sh`):

| Variable | Description | Default |
|----------|-------------|---------|
| `PROJECT_ID` | GCP project ID | `astute-strategy-406601` |
| `SQL_INSTANCE_NAME` | Cloud SQL instance name | `perundhu-preprod-mysql` |
| `IDLE_MINUTES` | Minutes of inactivity before stop | `30` |
| `DRY_RUN` | Test mode (won't actually stop) | `false` |

## Usage

### Manual Test
```bash
# Trigger the function manually
gcloud scheduler jobs run sql-auto-stop-scheduler --location=asia-south1

# View logs
gcloud functions logs read sql-auto-stop --region=asia-south1 --limit=20
```

### View Status
```bash
# Check Cloud SQL instance state
gcloud sql instances describe perundhu-preprod-mysql --format="value(state)"

# Check scheduler status
gcloud scheduler jobs describe sql-auto-stop-scheduler --location=asia-south1
```

### Pause/Resume
```bash
# Pause auto-stop (e.g., when actively developing)
gcloud scheduler jobs pause sql-auto-stop-scheduler --location=asia-south1

# Resume auto-stop
gcloud scheduler jobs resume sql-auto-stop-scheduler --location=asia-south1
```

## Response Format

The function returns JSON with status information:

**Active (won't stop):**
```json
{
  "status": "active",
  "message": "Instance has 5 active connections",
  "instance": "perundhu-preprod-mysql",
  "connections": 5,
  "idle_minutes": 30
}
```

**Stopped:**
```json
{
  "status": "stopped",
  "message": "Successfully stopped instance after 30 minutes of inactivity",
  "instance": "perundhu-preprod-mysql",
  "connections": 0,
  "idle_minutes": 30,
  "timestamp": "2026-01-15T10:30:00"
}
```

**Already stopped:**
```json
{
  "status": "skipped",
  "message": "Instance is already stopped",
  "instance": "perundhu-preprod-mysql",
  "state": "STOPPED"
}
```

## Cost

- **Cloud Function:** ~$0.40/month (720 invocations)
- **Cloud Scheduler:** ~$0.10/month (1 job)
- **Total:** ~$0.50/month

**Savings:** Stops Cloud SQL → saves $28.73/month

**Net Savings:** $28.23/month

## Integration with Cost Optimization Pipeline

To start the SQL instance via your existing pipeline:

```bash
# In your pipeline, add:
gcloud sql instances patch perundhu-preprod-mysql --activation-policy=ALWAYS

# Wait for it to be ready
sleep 120
```

The auto-stop function will handle stopping it after 30 minutes of inactivity.

## Troubleshooting

### Function not stopping instance
```bash
# Check logs
gcloud functions logs read sql-auto-stop --region=asia-south1 --limit=50

# Test with dry-run
curl "${FUNCTION_URL}?dry_run=true"
```

### Permission errors
```bash
# Re-grant permissions
./deploy.sh
```

### Can't check connections
The function safely assumes there are connections if it can't read metrics (won't accidentally stop a busy instance).

## Cleanup

```bash
# Delete scheduler job
gcloud scheduler jobs delete sql-auto-stop-scheduler --location=asia-south1 --quiet

# Delete function
gcloud functions delete sql-auto-stop --gen2 --region=asia-south1 --quiet

# Delete service account
gcloud iam service-accounts delete sql-auto-stop-sa@astute-strategy-406601.iam.gserviceaccount.com --quiet
```
