#!/bin/bash

# Setup Cloud Scheduler to run the SQL auto-stop function every 30 minutes

set -e

# Configuration
PROJECT_ID="astute-strategy-406601"
REGION="asia-south1"
FUNCTION_NAME="sql-auto-stop"
SCHEDULER_JOB_NAME="sql-auto-stop-scheduler"

echo "⏰ Setting up Cloud Scheduler..."
echo ""

# Get the function URL
FUNCTION_URL=$(gcloud functions describe ${FUNCTION_NAME} \
    --gen2 \
    --region=${REGION} \
    --project=${PROJECT_ID} \
    --format="value(serviceConfig.uri)")

if [ -z "$FUNCTION_URL" ]; then
    echo "❌ Error: Could not find Cloud Function URL"
    echo "Please deploy the function first: ./deploy.sh"
    exit 1
fi

echo "Function URL: ${FUNCTION_URL}"
echo ""

# Delete existing job if it exists
if gcloud scheduler jobs describe ${SCHEDULER_JOB_NAME} --location=${REGION} --project=${PROJECT_ID} &>/dev/null; then
    echo "🗑️  Deleting existing scheduler job..."
    gcloud scheduler jobs delete ${SCHEDULER_JOB_NAME} \
        --location=${REGION} \
        --project=${PROJECT_ID} \
        --quiet
fi

# Create the scheduler job
echo "📅 Creating scheduler job..."
gcloud scheduler jobs create http ${SCHEDULER_JOB_NAME} \
    --location=${REGION} \
    --schedule="*/30 * * * *" \
    --uri="${FUNCTION_URL}" \
    --http-method=GET \
    --time-zone="Asia/Kolkata" \
    --description="Auto-stop idle Cloud SQL instances every 30 minutes" \
    --project=${PROJECT_ID}

echo ""
echo "✅ Scheduler setup complete!"
echo ""
echo "📊 Schedule: Every 30 minutes"
echo "🕐 Next run: Check with 'gcloud scheduler jobs describe ${SCHEDULER_JOB_NAME} --location=${REGION}'"
echo ""
echo "Commands:"
echo "  Test now:  gcloud scheduler jobs run ${SCHEDULER_JOB_NAME} --location=${REGION}"
echo "  View logs: gcloud functions logs read ${FUNCTION_NAME} --region=${REGION} --limit=50"
echo "  Pause:     gcloud scheduler jobs pause ${SCHEDULER_JOB_NAME} --location=${REGION}"
echo "  Resume:    gcloud scheduler jobs resume ${SCHEDULER_JOB_NAME} --location=${REGION}"
echo ""
