#!/bin/bash
# Check Tamil translations for Chennai and Madurai in production database

set -e

PROJECT_ID="perundhu-prod-001"
INSTANCE="perundhu-production-mysql-us"
REGION="us-central1"

echo "============================================================"
echo "TAMIL TRANSLATIONS CHECK - PRODUCTION DATABASE"
echo "============================================================"

# Retrieve credentials from Secret Manager
echo ""
echo "🔐 Retrieving credentials from Secret Manager..."
DB_USERNAME=$(gcloud secrets versions access latest --secret=db-username --project=$PROJECT_ID)
DB_NAME="perundhu"

echo "✅ Credentials retrieved"
echo ""
echo "🔌 Connecting to Cloud SQL instance: $INSTANCE"
echo "📊 Checking Tamil translations for Chennai and Madurai..."
echo ""

# Connect to Cloud SQL and run queries
gcloud sql connect $INSTANCE --user=$DB_USERNAME --project=$PROJECT_ID <<'SQL'

USE perundhu;

-- Check Tamil translations for Chennai and Madurai
SELECT 
    l.id, 
    l.name as english_name, 
    t.translated_value as tamil_name,
    CASE 
        WHEN t.translated_value IS NULL THEN '❌ MISSING'
        ELSE '✅ EXISTS'
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
    ROUND(COUNT(DISTINCT t.entity_id) * 100.0 / COUNT(*), 2) as percentage
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

echo ""
echo "============================================================"
echo "✅ Check complete"
echo "============================================================"
