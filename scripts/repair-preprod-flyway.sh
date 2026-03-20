#!/bin/bash
# Repair preprod Flyway schema history
# This script connects to preprod database and removes the failed V119 migration

set -e

PROJECT="astute-strategy-406601"
INSTANCE="perundhu-preprod-mysql-us"
DATABASE="perundhu"

echo "🔧 Repairing preprod Flyway schema history..."
echo "================================================"

# Get database password
DB_PASS=$(gcloud secrets versions access latest --secret=db-password --project=$PROJECT 2>&1 || echo "")

if [ -z "$DB_PASS" ]; then
  echo "❌ Failed to get database password"
  exit 1
fi

echo "✅ Got database credentials"

# Create SQL repair script
SQL_SCRIPT="/tmp/repair_flyway.sql"
cat > $SQL_SCRIPT << 'EOSQL'
USE perundhu;

-- Show current failed migrations
SELECT 'Current failed migrations:' as status;
SELECT installed_rank, version, description, type, script, checksum, installed_on, execution_time, success
FROM fly way_schema_history
WHERE success = 0
ORDER BY installed_rank DESC;

-- Delete failed V119 migration
DELETE FROM flyway_schema_history WHERE version = '119' AND success = 0;

-- Verify deletion
SELECT 'After repair:' as status;
SELECT installed_rank, version, description, installed_on, success
FROM flyway_schema_history
WHERE version >= '118'
ORDER BY installed_rank  DESC
LIMIT 5;
EOSQL

echo "📄 Created repair SQL script"

# Execute repair using gcloud sql
echo "🔌 Connecting to database..."
gcloud sql connect $INSTANCE \
  --user=root \
  --project=$PROJECT \
  < $SQL_SCRIPT

echo ""
echo "✅ Flyway schema history repaired!"
echo ""
echo "Next steps:"
echo "1. Trigger preprod redeployment"
echo "2. The fixed V119 migration will now run successfully"

# Cleanup
rm -f $SQL_SCRIPT
