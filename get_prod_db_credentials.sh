#!/bin/bash
# Run this in Cloud Shell to get production database credentials
# Then use these in VS Code Database Client

PROJECT_ID="perundhu-prod-001"

echo "============================================================"
echo "PRODUCTION DATABASE CREDENTIALS"
echo "============================================================"
echo ""
echo "📝 Copy these values to VS Code Database Client:"
echo ""

echo "Username:"
gcloud secrets versions access latest --secret=db-username --project=$PROJECT_ID
echo ""

echo "Password:"
gcloud secrets versions access latest --secret=db-password --project=$PROJECT_ID
echo ""

echo "============================================================"
echo "VS Code Database Client Configuration:"
echo "============================================================"
echo "Connection Name: Perundhu Production"
echo "Database Type: MySQL"
echo "Host: 127.0.0.1"
echo "Port: 3307"
echo "Database: perundhu"
echo "SSL: Disabled"
echo "============================================================"
