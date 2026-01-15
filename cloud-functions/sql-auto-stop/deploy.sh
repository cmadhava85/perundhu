#!/bin/bash

# Deploy Cloud Function for SQL Auto-Stop
# This function monitors Cloud SQL instances and stops them after 30 minutes of inactivity

set -e

# Configuration
PROJECT_ID="astute-strategy-406601"
REGION="asia-south1"
FUNCTION_NAME="sql-auto-stop"
SQL_INSTANCE="perundhu-preprod-mysql"
IDLE_MINUTES="30"
SERVICE_ACCOUNT="sql-auto-stop-sa@${PROJECT_ID}.iam.gserviceaccount.com"

echo "🚀 Deploying SQL Auto-Stop Cloud Function..."
echo ""
echo "Configuration:"
echo "  Project: ${PROJECT_ID}"
echo "  Region: ${REGION}"
echo "  Function: ${FUNCTION_NAME}"
echo "  SQL Instance: ${SQL_INSTANCE}"
echo "  Idle Threshold: ${IDLE_MINUTES} minutes"
echo ""

# Step 1: Create service account if it doesn't exist
echo "📝 Creating service account..."
if ! gcloud iam service-accounts describe ${SERVICE_ACCOUNT} --project=${PROJECT_ID} &>/dev/null; then
    gcloud iam service-accounts create sql-auto-stop-sa \
        --display-name="SQL Auto-Stop Function" \
        --project=${PROJECT_ID}
    echo "✅ Service account created"
else
    echo "ℹ️  Service account already exists"
fi

# Step 2: Grant necessary permissions
echo "🔑 Granting permissions..."
gcloud projects add-iam-policy-binding ${PROJECT_ID} \
    --member="serviceAccount:${SERVICE_ACCOUNT}" \
    --role="roles/cloudsql.admin" \
    --condition=None

gcloud projects add-iam-policy-binding ${PROJECT_ID} \
    --member="serviceAccount:${SERVICE_ACCOUNT}" \
    --role="roles/monitoring.viewer" \
    --condition=None

echo "✅ Permissions granted"

# Step 3: Deploy the Cloud Function
echo "📦 Deploying Cloud Function..."
gcloud functions deploy ${FUNCTION_NAME} \
    --gen2 \
    --runtime=python311 \
    --region=${REGION} \
    --source=. \
    --entry-point=auto_stop_idle_sql \
    --trigger-http \
    --allow-unauthenticated \
    --service-account=${SERVICE_ACCOUNT} \
    --set-env-vars="PROJECT_ID=${PROJECT_ID},SQL_INSTANCE_NAME=${SQL_INSTANCE},IDLE_MINUTES=${IDLE_MINUTES},DRY_RUN=false" \
    --timeout=540s \
    --memory=256MB \
    --max-instances=1 \
    --project=${PROJECT_ID}

echo "✅ Cloud Function deployed"

# Step 4: Get the function URL
FUNCTION_URL=$(gcloud functions describe ${FUNCTION_NAME} \
    --gen2 \
    --region=${REGION} \
    --project=${PROJECT_ID} \
    --format="value(serviceConfig.uri)")

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📍 Function URL: ${FUNCTION_URL}"
echo ""
echo "Next steps:"
echo "1. Test the function: curl ${FUNCTION_URL}"
echo "2. Set up Cloud Scheduler (run: ./setup-scheduler.sh)"
echo ""
