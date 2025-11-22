#!/bin/bash
# Quick reference for GitHub Secrets configuration
# Add these to: GitHub Repo → Settings → Secrets and variables → Actions

PROJECT_ID="astute-strategy-406601"
REGION="us-central1"
ENVIRONMENT="preprod"

DB_NAME="perundhu"
DB_USER="perundhu_user"
DB_CONNECTION_NAME="${PROJECT_ID}:${REGION}:perundhu-${ENVIRONMENT}-mysql"
DB_URL="jdbc:mysql://google/${DB_NAME}?socketFactory=com.google.cloud.sql.mysql.SocketFactory&cloudSqlInstance=${DB_CONNECTION_NAME}&useSSL=false"

echo "=================================================="
echo "GitHub Secrets - Copy & Paste These Values"
echo "=================================================="
echo ""

echo "1️⃣  PREPROD_DB_URL"
echo "${DB_URL}"
echo ""

echo "2️⃣  PREPROD_DB_USER"
echo "${DB_USER}"
echo ""

echo "3️⃣  PREPROD_DB_PASSWORD"
echo "Run this command to get the password:"
echo "  gcloud secrets versions access latest --secret=perundhu-${ENVIRONMENT}-db-password --project=${PROJECT_ID}"
echo ""

echo "✅ GCPSECRET - Already configured"
echo ""

echo "=================================================="
echo "To add secrets to GitHub:"
echo "1. Go to: https://github.com/cmadhava85/perundhu/settings/secrets/actions"
echo "2. Click 'New repository secret'"
echo "3. Add each secret above"
echo "=================================================="
