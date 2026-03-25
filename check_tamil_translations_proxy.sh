#!/bin/bash
# Check Tamil translations using cloud-sql-proxy (more reliable than gcloud sql connect)

set -e

PROJECT_ID="perundhu-prod-001"
INSTANCE="perundhu-prod-001:us-central1:perundhu-production-mysql-us"

echo "============================================================"
echo "TAMIL TRANSLATIONS CHECK - PRODUCTION DATABASE"
echo "============================================================"

# Retrieve credentials from Secret Manager
echo ""
echo "🔐 Retrieving credentials from Secret Manager..."
DB_USERNAME=$(gcloud secrets versions access latest --secret=db-username --project=perundhu-prod-001)
DB_PASSWORD=$(gcloud secrets versions access latest --secret=db-password --project=perundhu-prod-001)
DB_NAME="perundhu"

echo "✅ Credentials retrieved"
echo ""

# Kill any existing cloud-sql-proxy instances on port 3307
echo "🧹 Cleaning up existing proxies..."
pkill -f "cloud-sql-proxy.*3307" 2>/dev/null || true
sleep 2

# Start cloud-sql-proxy in background
echo "🔌 Starting Cloud SQL Proxy..."
cloud-sql-proxy "$INSTANCE" --port 3307 &
PROXY_PID=$!
echo "   Proxy PID: $PROXY_PID"

# Wait for proxy to be ready
echo "⏳ Waiting for proxy to be ready..."
sleep 5

echo ""
echo "📊 Checking Tamil translations for Chennai and Madurai..."
echo ""

# Run MySQL queries
mysql -h 127.0.0.1 -P 3307 -u "$DB_USERNAME" -p"$DB_PASSWORD" "$DB_NAME" <<'SQL'

-- Check Tamil translations for Chennai and Madurai
SELECT 
    l.id, 
    l.name as english_name, 
    t.translated_value as tamil_name,
    CASE 
        WHEN t.translated_value IS NULL THEN 'MISSING'
        ELSE 'EXISTS'
    END as status
FROM location l
LEFT JOIN translation t ON t.entity_id = l.id 
    AND t.entity_type = 'location' 
    AND t.language = 'ta'
WHERE l.name IN ('Chennai', 'Madurai')
ORDER BY l.id;

-- Quick stats on Tamil translations
SELECT 
    COUNT(*) as total_locations,
    COUNT(DISTINCT t.entity_id) as locations_with_tamil,
    ROUND(COUNT(DISTINCT t.entity_id) * 100.0 / COUNT(*), 2) as percentage_with_tamil
FROM location l
LEFT JOIN translation t ON t.entity_id = l.id 
    AND t.entity_type = 'location' 
    AND t.language = 'ta';

-- Sample of locations with Tamil
SELECT 
    l.id,
    l.name,
    t.translated_value as tamil_name
FROM location l
INNER JOIN translation t ON t.entity_id = l.id 
    AND t.entity_type = 'location' 
    AND t.language = 'ta'
LIMIT 10;

SQL

# Cleanup
echo ""
echo "🧹 Cleaning up proxy..."
kill $PROXY_PID 2>/dev/null || true

echo ""
echo "============================================================"
echo "✅ Check complete"
echo "============================================================"
