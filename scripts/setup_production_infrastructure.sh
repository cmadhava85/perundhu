#!/bin/bash
# ============================================================
# PRODUCTION INFRASTRUCTURE SETUP SCRIPT
# ============================================================
# This script sets up all missing infrastructure for production
# Run this ONCE before deploying Cloud Run services
# ============================================================

set -e

# Configuration
PROJECT_ID="perundhu-prod-001"
REGION="asia-south1"
CLOUD_SQL_INSTANCE="perundhu-production-mysql"

echo ""
echo "==========================================="
echo "🚀 PRODUCTION INFRASTRUCTURE SETUP"
echo "==========================================="
echo "Project: $PROJECT_ID"
echo "Region: $REGION"
echo ""

# Verify project access
echo "📍 Step 1: Verifying GCP project access..."
if ! gcloud projects describe $PROJECT_ID &>/dev/null; then
    echo "❌ Cannot access project $PROJECT_ID"
    echo "   Run: gcloud config set project $PROJECT_ID"
    exit 1
fi
echo "✅ Project access verified"

# Set project
gcloud config set project $PROJECT_ID --quiet

# ============================================================
# STEP 2: CREATE ARTIFACT REGISTRY
# ============================================================
echo ""
echo "📍 Step 2: Creating Artifact Registry..."

if gcloud artifacts repositories describe perundhu-images --location=$REGION &>/dev/null; then
    echo "✅ Artifact Registry 'perundhu-images' already exists"
else
    echo "   Creating Docker repository..."
    gcloud artifacts repositories create perundhu-images \
        --repository-format=docker \
        --location=$REGION \
        --description="Perundhu Docker images" \
        --project=$PROJECT_ID
    echo "✅ Artifact Registry created"
fi

# ============================================================
# STEP 3: CREATE VPC CONNECTOR
# ============================================================
echo ""
echo "📍 Step 3: Creating VPC Connector..."

if gcloud compute networks vpc-access connectors describe perundhu-connector --region=$REGION &>/dev/null; then
    echo "✅ VPC Connector 'perundhu-connector' already exists"
else
    echo "   Creating VPC connector (this may take 2-3 minutes)..."
    gcloud compute networks vpc-access connectors create perundhu-connector \
        --region=$REGION \
        --network=default \
        --range=10.8.0.0/28 \
        --min-instances=2 \
        --max-instances=3 \
        --machine-type=e2-micro \
        --project=$PROJECT_ID
    echo "✅ VPC Connector created"
fi

# ============================================================
# STEP 4: CREATE MISSING SECRETS
# ============================================================
echo ""
echo "📍 Step 4: Setting up Secret Manager secrets..."

# Generate secure values
DB_URL="jdbc:mysql:///$PROJECT_ID:$REGION:$CLOUD_SQL_INSTANCE/perundhu?cloudSqlInstance=$PROJECT_ID:$REGION:$CLOUD_SQL_INSTANCE&socketFactory=com.google.cloud.sql.mysql.SocketFactory&useSSL=false"
ENCRYPTION_KEY=$(openssl rand -base64 32)

# Function to create secret if it doesn't exist
create_secret_if_missing() {
    local SECRET_NAME=$1
    local SECRET_VALUE=$2
    local DESCRIPTION=$3
    
    if gcloud secrets describe $SECRET_NAME --project=$PROJECT_ID &>/dev/null; then
        echo "   ✓ Secret '$SECRET_NAME' already exists"
    else
        echo "   Creating secret '$SECRET_NAME'..."
        echo -n "$SECRET_VALUE" | gcloud secrets create $SECRET_NAME \
            --data-file=- \
            --project=$PROJECT_ID \
            --labels="environment=production,app=perundhu"
        echo "   ✅ Created: $SECRET_NAME"
    fi
}

# Check existing secrets and create missing ones
echo "   Checking required secrets..."

# production-db-url
if ! gcloud secrets describe production-db-url --project=$PROJECT_ID &>/dev/null; then
    echo ""
    echo "   ⚠️  Secret 'production-db-url' not found"
    echo "   Creating with Cloud SQL socket connection..."
    echo -n "$DB_URL" | gcloud secrets create production-db-url \
        --data-file=- \
        --project=$PROJECT_ID \
        --labels="environment=production,app=perundhu"
    echo "   ✅ Created: production-db-url"
else
    echo "   ✓ production-db-url exists"
fi

# production-db-username (copy from db-username if exists)
if ! gcloud secrets describe production-db-username --project=$PROJECT_ID &>/dev/null; then
    echo ""
    echo "   ⚠️  Secret 'production-db-username' not found"
    if gcloud secrets describe db-username --project=$PROJECT_ID &>/dev/null; then
        DB_USER=$(gcloud secrets versions access latest --secret=db-username --project=$PROJECT_ID)
        echo -n "$DB_USER" | gcloud secrets create production-db-username \
            --data-file=- \
            --project=$PROJECT_ID \
            --labels="environment=production,app=perundhu"
        echo "   ✅ Created: production-db-username (copied from db-username)"
    else
        echo -n "prod_user" | gcloud secrets create production-db-username \
            --data-file=- \
            --project=$PROJECT_ID \
            --labels="environment=production,app=perundhu"
        echo "   ✅ Created: production-db-username (default: prod_user)"
        echo "   ⚠️  UPDATE THIS with actual username!"
    fi
else
    echo "   ✓ production-db-username exists"
fi

# production-db-password (copy from db-password if exists)
if ! gcloud secrets describe production-db-password --project=$PROJECT_ID &>/dev/null; then
    echo ""
    echo "   ⚠️  Secret 'production-db-password' not found"
    if gcloud secrets describe db-password --project=$PROJECT_ID &>/dev/null; then
        DB_PASS=$(gcloud secrets versions access latest --secret=db-password --project=$PROJECT_ID)
        echo -n "$DB_PASS" | gcloud secrets create production-db-password \
            --data-file=- \
            --project=$PROJECT_ID \
            --labels="environment=production,app=perundhu"
        echo "   ✅ Created: production-db-password (copied from db-password)"
    else
        echo "   ❌ Cannot create production-db-password - need actual password"
        echo "   Run manually:"
        echo "   echo -n 'YOUR_PASSWORD' | gcloud secrets create production-db-password --data-file=- --project=$PROJECT_ID"
    fi
else
    echo "   ✓ production-db-password exists"
fi

# production-data-encryption-key
if ! gcloud secrets describe production-data-encryption-key --project=$PROJECT_ID &>/dev/null; then
    echo ""
    echo "   ⚠️  Secret 'production-data-encryption-key' not found"
    echo "   Generating secure encryption key..."
    echo -n "$ENCRYPTION_KEY" | gcloud secrets create production-data-encryption-key \
        --data-file=- \
        --project=$PROJECT_ID \
        --labels="environment=production,app=perundhu"
    echo "   ✅ Created: production-data-encryption-key"
else
    echo "   ✓ production-data-encryption-key exists"
fi

echo "✅ Secrets configured"

# ============================================================
# STEP 5: RESTART CLOUD SQL (OPTIONAL)
# ============================================================
echo ""
echo "📍 Step 5: Cloud SQL Instance Status..."

SQL_STATUS=$(gcloud sql instances describe $CLOUD_SQL_INSTANCE --project=$PROJECT_ID --format="value(state)" 2>/dev/null || echo "NOT_FOUND")

if [ "$SQL_STATUS" == "STOPPED" ]; then
    echo "   Cloud SQL is currently STOPPED"
    read -p "   Do you want to START it now? (yes/no): " START_SQL
    if [ "$START_SQL" == "yes" ]; then
        echo "   Starting Cloud SQL instance..."
        gcloud sql instances patch $CLOUD_SQL_INSTANCE \
            --activation-policy=ALWAYS \
            --project=$PROJECT_ID
        echo "   ⏳ Waiting for instance to start (may take 2-3 minutes)..."
        sleep 30
        
        # Wait for instance to be RUNNABLE
        for i in {1..10}; do
            STATUS=$(gcloud sql instances describe $CLOUD_SQL_INSTANCE --project=$PROJECT_ID --format="value(state)")
            if [ "$STATUS" == "RUNNABLE" ]; then
                echo "   ✅ Cloud SQL is now RUNNING"
                break
            fi
            echo "   ... waiting ($i/10)"
            sleep 15
        done
    else
        echo "   ⏸️  Skipped - Cloud SQL remains STOPPED"
        echo "   Start manually when ready:"
        echo "   gcloud sql instances patch $CLOUD_SQL_INSTANCE --activation-policy=ALWAYS --project=$PROJECT_ID"
    fi
elif [ "$SQL_STATUS" == "RUNNABLE" ]; then
    echo "   ✅ Cloud SQL is already RUNNING"
else
    echo "   ⚠️  Cloud SQL status: $SQL_STATUS"
fi

# ============================================================
# STEP 6: ENABLE REQUIRED APIs
# ============================================================
echo ""
echo "📍 Step 6: Enabling required GCP APIs..."

APIS=(
    "run.googleapis.com"
    "sqladmin.googleapis.com"
    "secretmanager.googleapis.com"
    "artifactregistry.googleapis.com"
    "vpcaccess.googleapis.com"
    "cloudbuild.googleapis.com"
    "dns.googleapis.com"
)

for API in "${APIS[@]}"; do
    if gcloud services list --enabled --filter="name:$API" --format="value(name)" | grep -q "$API"; then
        echo "   ✓ $API"
    else
        echo "   Enabling $API..."
        gcloud services enable $API --project=$PROJECT_ID --quiet
        echo "   ✅ $API enabled"
    fi
done

# ============================================================
# SUMMARY
# ============================================================
echo ""
echo "==========================================="
echo "✅ INFRASTRUCTURE SETUP COMPLETE"
echo "==========================================="
echo ""
echo "Created/Verified:"
echo "  • Artifact Registry: asia-south1-docker.pkg.dev/$PROJECT_ID/perundhu-images"
echo "  • VPC Connector: perundhu-connector"
echo "  • Secrets: production-db-url, production-db-username, production-db-password, production-data-encryption-key"
echo "  • APIs: Cloud Run, Cloud SQL, Secret Manager, Artifact Registry, VPC Access, Cloud Build, DNS"
echo ""
echo "Next Steps:"
echo "  1. Build Docker images:  ./scripts/build_and_push_images.sh"
echo "  2. Deploy to Cloud Run:  ./scripts/deploy_cloud_run.sh"
echo "  3. Configure DNS:        See PRODUCTION_DEPLOYMENT_START_HERE_JAN_2026.md"
echo ""
echo "Quick verification:"
echo "  gcloud artifacts repositories list --location=$REGION --project=$PROJECT_ID"
echo "  gcloud compute networks vpc-access connectors list --region=$REGION --project=$PROJECT_ID"
echo "  gcloud secrets list --project=$PROJECT_ID"
echo ""
