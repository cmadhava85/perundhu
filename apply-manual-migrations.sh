#!/bin/bash
# Manual migration script for preprod database
# Applies V60 and V61 migrations with system_settings table fixes

set -e

DB_USER="perundhu_user"
DB_PASSWORD=$(/usr/local/bin/gcloud secrets versions access latest --secret=db-password --project=astute-strategy-406601 2>/dev/null | tr -d '\n')
DB_HOST="127.0.0.1"
DB_NAME="perundhu"

echo "🔍 Database credentials retrieved"
echo "Host: $DB_HOST"
echo "Database: $DB_NAME"
echo "User: $DB_USER"
echo ""

# Export password for mysql command
export MYSQL_PWD="$DB_PASSWORD"

# Create migration SQL with all fixes
cat > /tmp/migrations.sql << 'SQL_EOF'
-- ========================================
-- V60: Add missing announcement columns
-- ========================================
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS title_fallback VARCHAR(255) NOT NULL DEFAULT '';
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS message_key VARCHAR(255) NOT NULL DEFAULT '';
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS message_fallback TEXT NOT NULL DEFAULT '';
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS link VARCHAR(500);
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS link_text_key VARCHAR(255);
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS link_text_fallback VARCHAR(255);
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS is_dismissible INT NOT NULL DEFAULT 1;
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS announcement_category VARCHAR(50);
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS display_banner INT NOT NULL DEFAULT 1;
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS display_modal INT NOT NULL DEFAULT 0;
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS starts_at DATETIME;
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS expires_at DATETIME;
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS view_count BIGINT NOT NULL DEFAULT 0;
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS dismiss_count BIGINT NOT NULL DEFAULT 0;
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS created_by VARCHAR(100);
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS updated_by VARCHAR(100);
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'DRAFT';
UPDATE announcements SET unique_id = CONCAT('announcement_', id) WHERE unique_id IS NULL OR unique_id = '';

-- ========================================
-- V61: Add missing locations columns
-- ========================================
ALTER TABLE locations ADD COLUMN IF NOT EXISTS osm_type VARCHAR(20);
ALTER TABLE locations ADD COLUMN IF NOT EXISTS osm_node_id BIGINT;
ALTER TABLE locations ADD COLUMN IF NOT EXISTS osm_way_id BIGINT;
ALTER TABLE locations ADD COLUMN IF NOT EXISTS last_osm_update DATETIME;
ALTER TABLE locations ADD COLUMN IF NOT EXISTS osm_tags JSON;
ALTER TABLE locations ADD COLUMN IF NOT EXISTS neighborhood VARCHAR(255);
ALTER TABLE locations ADD COLUMN IF NOT EXISTS state VARCHAR(100);
ALTER TABLE locations ADD COLUMN IF NOT EXISTS type VARCHAR(50);

-- ========================================
-- Additional: Fix system_settings table
-- ========================================
-- Ensure system_settings table has id column (primary key)
ALTER TABLE system_settings MODIFY COLUMN id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY;

-- Verify columns
SELECT 'V60 Announcements columns:' as check_type;
SHOW COLUMNS FROM announcements WHERE Field IN ('title_fallback', 'message_key', 'announcement_category', 'status');

SELECT 'V61 Locations columns:' as check_type;
SHOW COLUMNS FROM locations WHERE Field IN ('osm_type', 'last_osm_update', 'osm_tags');

SELECT 'System Settings table:' as check_type;
SHOW COLUMNS FROM system_settings LIMIT 3;

SELECT 'Migration Status: ✅ COMPLETED' as status;
SQL_EOF

echo "📝 Running migrations..."
echo ""

# Execute migrations
mysql -h "$DB_HOST" -u "$DB_USER" "$DB_NAME" < /tmp/migrations.sql

echo ""
echo "✅ Migrations completed successfully!"
echo ""
echo "📊 Verifying schema..."

# Verification query
mysql -h "$DB_HOST" -u "$DB_USER" "$DB_NAME" -e "
SELECT 'Announcements table columns' as check_type;
SELECT COUNT(*) as column_count FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='perundhu' AND TABLE_NAME='announcements' AND COLUMN_NAME IN ('title_fallback', 'message_key', 'announcement_category');

SELECT 'Locations table columns' as check_type;
SELECT COUNT(*) as column_count FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='perundhu' AND TABLE_NAME='locations' AND COLUMN_NAME IN ('last_osm_update', 'osm_type', 'osm_tags');

SELECT '✅ All migrations applied!' as status;
"

echo ""
echo "🎉 Database ready for deployment!"
echo ""
echo "Next step: Backend will start cleanly when redeploy with FLYWAY_ENABLED=false"

unset MYSQL_PWD
