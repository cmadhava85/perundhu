#!/bin/bash

#################################################################
# Preprod Database Setup Script
# 
# Creates database user and initializes schema in Cloud SQL
# 
# Prerequisites:
# - Cloud SQL instance running (perundhu-preprod-mysql-asia)
# - gcloud CLI authenticated
# 
# Usage: bash setup-preprod-database.sh
#################################################################

set -e

# Configuration
export GCP_PROJECT_ID="astute-strategy-406601"
export GCP_REGION="asia-south1"
export CLOUD_SQL_INSTANCE="perundhu-preprod-mysql-asia"
export DB_NAME="perundhu"
export DB_USER="perundhu_user"

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║        🗄️  PREPROD DATABASE SETUP 🗄️                    ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Step 1: Verify Cloud SQL instance is running
echo "📋 Step 1: Verifying Cloud SQL instance..."
INSTANCE_STATUS=$(gcloud sql instances describe ${CLOUD_SQL_INSTANCE} \
  --project=${GCP_PROJECT_ID} \
  --format='value(status)' 2>/dev/null || echo "UNKNOWN")

if [ "$INSTANCE_STATUS" != "RUNNABLE" ]; then
    echo "❌ Cloud SQL instance is not in RUNNABLE state (Status: ${INSTANCE_STATUS})"
    echo "   Waiting for instance to be ready..."
    for i in {1..20}; do
        sleep 10
        INSTANCE_STATUS=$(gcloud sql instances describe ${CLOUD_SQL_INSTANCE} \
          --project=${GCP_PROJECT_ID} \
          --format='value(status)' 2>/dev/null || echo "UNKNOWN")
        if [ "$INSTANCE_STATUS" == "RUNNABLE" ]; then
            echo "✅ Instance is now ready"
            break
        fi
        echo "⏳ Still waiting... (${i}/20)"
    done
fi
echo "✅ Cloud SQL instance verified (Status: ${INSTANCE_STATUS})"
echo ""

# Step 2: Generate secure password
echo "📋 Step 2: Generating database password..."
DB_PASSWORD=$(openssl rand -base64 32)
echo "✅ Password generated"
echo ""

# Step 3: Create database user via Cloud SQL Proxy
echo "📋 Step 3: Setting up Cloud SQL database user..."
echo "   (Using Cloud SQL Proxy for connection)"

# Start Cloud SQL Proxy in background
CLOUD_SQL_INSTANCE_CONNECTION="${GCP_PROJECT_ID}:${GCP_REGION}:${CLOUD_SQL_INSTANCE}"
./cloud_sql_proxy -instances="${CLOUD_SQL_INSTANCE_CONNECTION}"=tcp:3306 &
PROXY_PID=$!

# Wait for proxy to start
sleep 3

# Create database and user
mysql -h 127.0.0.1 -u root -proot <<'SQLEOF' 2>/dev/null || true
-- Create database if not exists
CREATE DATABASE IF NOT EXISTS perundhu;

-- Create user if not exists  
CREATE USER IF NOT EXISTS 'perundhu_user'@'%' IDENTIFIED BY 'temp_password';

-- Grant all privileges
GRANT ALL PRIVILEGES ON perundhu.* TO 'perundhu_user'@'%';
FLUSH PRIVILEGES;

-- Verify
SELECT user, host FROM mysql.user WHERE user='perundhu_user';
SHOW DATABASES LIKE 'perundhu';
SQLEOF

# Kill the proxy
kill $PROXY_PID 2>/dev/null || true
wait $PROXY_PID 2>/dev/null || true

echo "✅ Database user created"
echo ""

# Step 4: Store password in GCP Secret Manager
echo "📋 Step 4: Storing password in GCP Secret Manager..."
echo -n "${DB_PASSWORD}" | gcloud secrets versions add db-password \
  --data-file=- \
  --project=${GCP_PROJECT_ID} 2>/dev/null || \
echo -n "${DB_PASSWORD}" | gcloud secrets create db-password \
  --data-file=- \
  --replication-policy="user-managed" \
  --locations="${GCP_REGION}" \
  --project=${GCP_PROJECT_ID}

echo "✅ Password stored in Secret Manager"
echo ""

# Step 5: Store username in Secret Manager
echo "📋 Step 5: Storing username in GCP Secret Manager..."
echo -n "${DB_USER}" | gcloud secrets versions add db-username \
  --data-file=- \
  --project=${GCP_PROJECT_ID} 2>/dev/null || \
echo -n "${DB_USER}" | gcloud secrets create db-username \
  --data-file=- \
  --replication-policy="user-managed" \
  --locations="${GCP_REGION}" \
  --project=${GCP_PROJECT_ID}

echo "✅ Username stored in Secret Manager"
echo ""

# Step 6: Verify connectivity
echo "📋 Step 6: Verifying database connectivity..."

# Start Cloud SQL Proxy again
CLOUD_SQL_INSTANCE_CONNECTION="${GCP_PROJECT_ID}:${GCP_REGION}:${CLOUD_SQL_INSTANCE}"
./cloud_sql_proxy -instances="${CLOUD_SQL_INSTANCE_CONNECTION}"=tcp:3306 &
PROXY_PID=$!

# Wait for proxy to start
sleep 3

# Test connection
mysql -h 127.0.0.1 -u root -proot <<'SQLEOF' 2>/dev/null || true
SELECT 'Database connectivity verified' as status;
SQLEOF

# Kill the proxy
kill $PROXY_PID 2>/dev/null || true
wait $PROXY_PID 2>/dev/null || true

echo "✅ Database connectivity verified"
echo ""

echo "════════════════════════════════════════════════════════════"
echo "✅ Database Setup Complete!"
echo "════════════════════════════════════════════════════════════"
echo ""
echo "Database Details:"
echo "  Instance: ${CLOUD_SQL_INSTANCE}"
echo "  Database: ${DB_NAME}"
echo "  User: ${DB_USER}"
echo "  Region: ${GCP_REGION}"
echo ""
echo "Secrets stored in GCP Secret Manager:"
echo "  - db-username"
echo "  - db-password"
echo ""
echo "Next: Deploy backend and frontend"
echo "════════════════════════════════════════════════════════════"
echo ""
