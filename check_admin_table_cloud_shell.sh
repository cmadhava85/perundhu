#!/bin/bash
# Run this script in Cloud Shell to check admin_users table in production
# Cloud Shell has authorized access through VPC Service Controls

set -e

PROJECT_ID="perundhu-prod-001"
INSTANCE="perundhu-production-mysql-us"
REGION="us-central1"

echo "============================================================"
echo "PRODUCTION ADMIN USERS TABLE CHECK (Cloud Shell)"
echo "============================================================"

# Retrieve credentials from Secret Manager
echo ""
echo "🔐 Retrieving credentials from Secret Manager..."
DB_USERNAME=$(gcloud secrets versions access latest --secret=db-username --project=$PROJECT_ID)
DB_PASSWORD=$(gcloud secrets versions access latest --secret=db-password --project=$PROJECT_ID)
DB_NAME="perundhu"

echo "✅ Credentials retrieved"
echo ""
echo "🔌 Connecting to Cloud SQL instance: $INSTANCE"

# Connect to Cloud SQL and run queries
gcloud sql connect $INSTANCE --user=$DB_USERNAME --database=$DB_NAME --project=$PROJECT_ID <<'SQL'

-- Show table structure
DESCRIBE admin_users;

-- Count admin users
SELECT 
    'Total Admin Users' AS metric, 
    COUNT(*) AS count 
FROM admin_users;

-- List all admin users (excluding password hash)
SELECT 
    id,
    username,
    email,
    full_name,
    enabled,
    roles,
    created_at,
    updated_at,
    last_login_at
FROM admin_users
ORDER BY id;

-- Check if default admin exists
SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN 'Default admin (perundhu_admin) EXISTS'
        ELSE 'Default admin does NOT exist'
    END AS status
FROM admin_users
WHERE username = 'perundhu_admin';

SQL

echo ""
echo "============================================================"
echo "✅ Admin users check complete"
echo "============================================================"
echo ""
echo "📝 Default credentials from migration:"
echo "   Username: perundhu_admin"
echo "   Password: Admin123!@#Change (CHANGE THIS!)"
echo ""
echo "⚠️  IMPORTANT: Change the default password immediately if not already done!"
echo "   Use: PUT /api/admin/users/perundhu_admin with new password"
