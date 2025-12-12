#!/bin/bash
# Deploy GCP Cloud Monitoring Dashboard
# Usage: ./deploy-dashboard.sh [PROJECT_ID]

set -e

PROJECT_ID="${1:-perundhu-prod}"
DASHBOARD_FILE="gcp-dashboard.json"

echo "📊 Deploying Perundhu Monitoring Dashboard to project: $PROJECT_ID"

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "❌ gcloud CLI is not installed. Please install it first."
    exit 1
fi

# Check if logged in
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | head -1 &> /dev/null; then
    echo "❌ Not logged in to gcloud. Please run: gcloud auth login"
    exit 1
fi

# Set project
gcloud config set project "$PROJECT_ID"

# Create log-based metrics first
echo "📈 Creating log-based metrics..."

# API Requests Total
gcloud logging metrics create api_requests_total \
    --description="Total API requests" \
    --log-filter='resource.type="cloud_run_revision" AND jsonPayload.action="api_call"' \
    2>/dev/null || echo "  Metric 'api_requests_total' already exists"

# Slow Methods
gcloud logging metrics create slow_methods \
    --description="Count of slow method executions" \
    --log-filter='resource.type="cloud_run_revision" AND textPayload=~"SLOW METHOD"' \
    2>/dev/null || echo "  Metric 'slow_methods' already exists"

# Search Queries
gcloud logging metrics create search_queries \
    --description="Search query count" \
    --log-filter='resource.type="cloud_run_revision" AND jsonPayload.action="search"' \
    2>/dev/null || echo "  Metric 'search_queries' already exists"

# User Actions
gcloud logging metrics create user_actions \
    --description="User action tracking" \
    --log-filter='resource.type="cloud_run_revision" AND jsonPayload.category!=""' \
    2>/dev/null || echo "  Metric 'user_actions' already exists"

# Errors by Type
gcloud logging metrics create errors_by_type \
    --description="Error count by type" \
    --log-filter='resource.type="cloud_run_revision" AND severity="ERROR"' \
    2>/dev/null || echo "  Metric 'errors_by_type' already exists"

echo "✅ Log-based metrics created"

# Deploy dashboard
echo "📊 Creating dashboard..."

# Update the project name in the dashboard JSON
sed "s/perundhu-prod/$PROJECT_ID/g" "$DASHBOARD_FILE" > /tmp/dashboard-temp.json

# Create dashboard using API
ACCESS_TOKEN=$(gcloud auth print-access-token)

RESPONSE=$(curl -s -X POST \
    "https://monitoring.googleapis.com/v1/projects/$PROJECT_ID/dashboards" \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -H "Content-Type: application/json" \
    -d @/tmp/dashboard-temp.json)

if echo "$RESPONSE" | grep -q "error"; then
    echo "❌ Failed to create dashboard:"
    echo "$RESPONSE" | jq .
    
    # Try to update if it already exists
    DASHBOARD_NAME=$(echo "$RESPONSE" | jq -r '.error.details[0].metadata.dashboard_name // empty')
    if [ -n "$DASHBOARD_NAME" ]; then
        echo "🔄 Dashboard exists, updating..."
        curl -s -X PATCH \
            "https://monitoring.googleapis.com/v1/$DASHBOARD_NAME" \
            -H "Authorization: Bearer $ACCESS_TOKEN" \
            -H "Content-Type: application/json" \
            -d @/tmp/dashboard-temp.json
        echo "✅ Dashboard updated"
    fi
else
    echo "✅ Dashboard created successfully!"
    DASHBOARD_NAME=$(echo "$RESPONSE" | jq -r '.name')
    echo "   Dashboard: https://console.cloud.google.com/monitoring/dashboards/builder/${DASHBOARD_NAME##*/}?project=$PROJECT_ID"
fi

# Clean up
rm -f /tmp/dashboard-temp.json

echo ""
echo "🎉 Deployment complete!"
echo ""
echo "📊 View your dashboard:"
echo "   https://console.cloud.google.com/monitoring/dashboards?project=$PROJECT_ID"
echo ""
echo "📈 View log-based metrics:"
echo "   https://console.cloud.google.com/logs/metrics?project=$PROJECT_ID"
