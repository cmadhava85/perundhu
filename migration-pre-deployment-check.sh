#!/bin/bash

################################################################################
# MIGRATION PRE-DEPLOYMENT VALIDATION SCRIPT
# Purpose: Verify migrations won't hang/fail in preprod
# Usage: bash migration-pre-deployment-check.sh
# Created: 2026-01-06
################################################################################

set -e

echo "╔════════════════════════════════════════════════════════════════════╗"
echo "║  TAMIL TRANSLATION MIGRATION - PRE-DEPLOYMENT VALIDATION           ║"
echo "║  Database: MySQL 9.2+  |  Locations: 21,528  |  Translations: V52/V53║"
echo "╚════════════════════════════════════════════════════════════════════╝"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DB_USER="${DB_USER:-root}"
DB_PASS="${DB_PASS:-root}"
DB_NAME="${DB_NAME:-perundhu}"
DB_HOST="${DB_HOST:-127.0.0.1}"
DB_PORT="${DB_PORT:-3306}"

# Counters
PASSED=0
FAILED=0
WARNINGS=0

################################################################################
# UTILITY FUNCTIONS
################################################################################

log_pass() {
  echo -e "${GREEN}✓ PASS${NC}: $1"
  ((PASSED++))
}

log_fail() {
  echo -e "${RED}✗ FAIL${NC}: $1"
  ((FAILED++))
}

log_warn() {
  echo -e "${YELLOW}⚠ WARN${NC}: $1"
  ((WARNINGS++))
}

log_info() {
  echo -e "${BLUE}ℹ INFO${NC}: $1"
}

log_section() {
  echo ""
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BLUE}$1${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

run_mysql_query() {
  local query="$1"
  mysql -u "$DB_USER" -p"$DB_PASS" -h "$DB_HOST" -P "$DB_PORT" "$DB_NAME" -e "$query" 2>/dev/null || echo "QUERY_FAILED"
}

################################################################################
# 1. DATABASE CONNECTIVITY CHECK
################################################################################

log_section "1. DATABASE CONNECTIVITY CHECK"

if mysql -u "$DB_USER" -p"$DB_PASS" -h "$DB_HOST" -P "$DB_PORT" -e "SELECT 1" &>/dev/null; then
  log_pass "MySQL connection successful"
else
  log_fail "Cannot connect to MySQL at $DB_HOST:$DB_PORT"
  exit 1
fi

# Check database exists
if mysql -u "$DB_USER" -p"$DB_PASS" -h "$DB_HOST" -P "$DB_PORT" -e "USE $DB_NAME" &>/dev/null; then
  log_pass "Database '$DB_NAME' exists"
else
  log_fail "Database '$DB_NAME' not found"
  exit 1
fi

################################################################################
# 2. TABLE STRUCTURE VALIDATION
################################################################################

log_section "2. TABLE STRUCTURE VALIDATION"

# Check locations table
RESULT=$(run_mysql_query "SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA='$DB_NAME' AND TABLE_NAME='locations'")
if [ "$RESULT" -eq 1 ]; then
  log_pass "locations table exists"
else
  log_fail "locations table not found"
  exit 1
fi

# Check translations table
RESULT=$(run_mysql_query "SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA='$DB_NAME' AND TABLE_NAME='translations'")
if [ "$RESULT" -eq 1 ]; then
  log_pass "translations table exists"
else
  log_fail "translations table not found"
  exit 1
fi

# Check for required columns
RESULT=$(run_mysql_query "SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='$DB_NAME' AND TABLE_NAME='locations' AND COLUMN_NAME='id'")
[ "$RESULT" -eq 1 ] && log_pass "locations.id column exists" || log_fail "locations.id column missing"

RESULT=$(run_mysql_query "SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='$DB_NAME' AND TABLE_NAME='translations' AND COLUMN_NAME='entity_id'")
[ "$RESULT" -eq 1 ] && log_pass "translations.entity_id column exists" || log_fail "translations.entity_id column missing"

################################################################################
# 3. DATA VOLUME CHECK
################################################################################

log_section "3. DATA VOLUME CHECK"

# Count locations
LOC_COUNT=$(run_mysql_query "SELECT COUNT(*) as count FROM locations" | tail -1)
if [ "$LOC_COUNT" -gt 0 ]; then
  log_pass "Database contains $LOC_COUNT locations"
  if [ "$LOC_COUNT" -lt 10000 ]; then
    log_warn "Location count ($LOC_COUNT) is less than expected (21,528+)"
  fi
else
  log_fail "No locations found in database"
  exit 1
fi

# Count existing Tamil translations
TRANS_COUNT=$(run_mysql_query "SELECT COUNT(*) as count FROM translations WHERE entity_type='location' AND language_code='ta'" | tail -1)
log_info "Current Tamil translations: $TRANS_COUNT"

# Count empty translations
EMPTY_TRANS=$(run_mysql_query "SELECT COUNT(*) as count FROM translations WHERE entity_type='location' AND language_code='ta' AND (translated_value IS NULL OR translated_value='' OR TRIM(translated_value)='')" | tail -1)
if [ "$EMPTY_TRANS" -gt 0 ]; then
  log_warn "Found $EMPTY_TRANS empty Tamil translations (will be cleaned in V53)"
else
  log_pass "No empty Tamil translations found"
fi

################################################################################
# 4. INDEX HEALTH CHECK
################################################################################

log_section "4. INDEX HEALTH CHECK"

# Check primary key on locations
RESULT=$(run_mysql_query "SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA='$DB_NAME' AND TABLE_NAME='locations' AND INDEX_NAME='PRIMARY'" | tail -1)
if [ "$RESULT" -gt 0 ]; then
  log_pass "locations table has primary key"
else
  log_warn "locations table PRIMARY KEY not found - migration may be slow"
fi

# Check indexes on translations
RESULT=$(run_mysql_query "SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA='$DB_NAME' AND TABLE_NAME='translations' AND INDEX_NAME='PRIMARY'" | tail -1)
if [ "$RESULT" -gt 0 ]; then
  log_pass "translations table has primary key"
else
  log_fail "translations table PRIMARY KEY not found"
fi

# Check entity_type index
RESULT=$(run_mysql_query "SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA='$DB_NAME' AND TABLE_NAME='translations' AND COLUMN_NAME='entity_type'" | tail -1)
if [ "$RESULT" -gt 0 ]; then
  log_pass "translations.entity_type column is indexed"
else
  log_warn "translations.entity_type column not indexed - consider adding for performance"
fi

# Check language_code index
RESULT=$(run_mysql_query "SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA='$DB_NAME' AND TABLE_NAME='translations' AND COLUMN_NAME='language_code'" | tail -1)
if [ "$RESULT" -gt 0 ]; then
  log_pass "translations.language_code column is indexed"
else
  log_warn "translations.language_code column not indexed - consider adding for performance"
fi

################################################################################
# 5. MYSQL CONFIGURATION CHECK
################################################################################

log_section "5. MYSQL CONFIGURATION CHECK"

# Check max_execution_time
RESULT=$(run_mysql_query "SELECT @@max_execution_time")
log_info "max_execution_time: $RESULT ms"
if [ "${RESULT}" -lt 30000 ]; then
  log_warn "max_execution_time ($RESULT) is less than 30000ms - migrations may timeout"
fi

# Check net_read_timeout
RESULT=$(run_mysql_query "SELECT @@net_read_timeout")
log_info "net_read_timeout: $RESULT seconds"

# Check net_write_timeout
RESULT=$(run_mysql_query "SELECT @@net_write_timeout")
log_info "net_write_timeout: $RESULT seconds"

# Check tmp_table_size
RESULT=$(run_mysql_query "SELECT @@tmp_table_size")
log_info "tmp_table_size: $RESULT bytes ($(( RESULT / 1048576 ))MB)"
if [ "$RESULT" -lt 268435456 ]; then
  log_warn "tmp_table_size ($RESULT) is less than 256MB - may impact V53 migration"
fi

################################################################################
# 6. MIGRATION SIMULATION - V52
################################################################################

log_section "6. MIGRATION SIMULATION - V52 (Execute Time Test)"

log_info "Estimating V52 migration execution time..."
START_TIME=$(date +%s%N | cut -b1-13)

# Simulate V52 query (small subset)
RESULT=$(run_mysql_query "
SELECT COUNT(*) as sim_result FROM locations l
WHERE l.name IN ('Chennai', 'Coimbatore', 'Madurai', 'Trichy', 'Salem')
AND NOT EXISTS (
  SELECT 1 FROM translations t
  WHERE t.entity_type='location' AND t.entity_id=l.id AND t.language_code='ta'
)
" | tail -1)

END_TIME=$(date +%s%N | cut -b1-13)
ELAPSED=$((END_TIME - START_TIME))

log_info "V52 simulation found $RESULT matching locations (query time: ${ELAPSED}ms)"
if [ "$ELAPSED" -lt 100 ]; then
  log_pass "V52 query is fast (<100ms)"
elif [ "$ELAPSED" -lt 500 ]; then
  log_warn "V52 query is moderate (${ELAPSED}ms) - acceptable but monitor in preprod"
else
  log_warn "V52 query is slow (${ELAPSED}ms) - may need index optimization"
fi

################################################################################
# 7. MIGRATION SIMULATION - V53
################################################################################

log_section "7. MIGRATION SIMULATION - V53 (Execute Time Test)"

log_info "Estimating V53 migration execution time..."
START_TIME=$(date +%s%N | cut -b1-13)

# Simulate V53 LEFT JOIN check
RESULT=$(run_mysql_query "
SELECT COUNT(*) as sim_result FROM locations l
LEFT JOIN translations t ON (
  t.entity_type='location' AND t.entity_id=l.id AND t.language_code='ta'
)
WHERE t.id IS NULL
LIMIT 1000
" | tail -1)

END_TIME=$(date +%s%N | cut -b1-13)
ELAPSED=$((END_TIME - START_TIME))

log_info "V53 simulation found $RESULT locations without Tamil translations (query time: ${ELAPSED}ms)"
if [ "$ELAPSED" -lt 500 ]; then
  log_pass "V53 query is fast (<500ms)"
elif [ "$ELAPSED" -lt 2000 ]; then
  log_warn "V53 query is moderate (${ELAPSED}ms) - expected range, monitor in preprod"
else
  log_warn "V53 query is slow (${ELAPSED}ms) - may need optimization before deploying"
fi

################################################################################
# 8. FLYWAY MIGRATION HISTORY CHECK
################################################################################

log_section "8. FLYWAY MIGRATION HISTORY CHECK"

# Check if flyway_schema_history exists
RESULT=$(run_mysql_query "SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA='$DB_NAME' AND TABLE_NAME='flyway_schema_history'")
if [ "$RESULT" -eq 1 ]; then
  log_pass "Flyway schema history table exists"
  
  # Check last migration
  LAST_MIGRATION=$(run_mysql_query "SELECT script FROM flyway_schema_history ORDER BY installed_rank DESC LIMIT 1" | tail -1)
  log_info "Last applied migration: $LAST_MIGRATION"
  
  # Check V52 status
  RESULT=$(run_mysql_query "SELECT success FROM flyway_schema_history WHERE script LIKE '%V52%' LIMIT 1" | tail -1)
  if [ "$RESULT" == "1" ]; then
    log_pass "V52 migration was successfully applied"
  elif [ "$RESULT" == "0" ]; then
    log_warn "V52 migration exists but marked as failed"
  else
    log_info "V52 migration not yet applied (normal for fresh deployments)"
  fi
else
  log_warn "Flyway schema history table not found - new Flyway setup"
fi

################################################################################
# 9. DISK SPACE CHECK
################################################################################

log_section "9. DISK SPACE CHECK"

# Get MySQL data directory
MYSQL_DATA_DIR=$(run_mysql_query "SELECT @@datadir" | tail -1)
if [ -d "$MYSQL_DATA_DIR" ]; then
  AVAILABLE_SPACE=$(df "$MYSQL_DATA_DIR" | tail -1 | awk '{print $4}')
  REQUIRED_SPACE=$((LOC_COUNT * 100)) # Rough estimate: 100 bytes per location
  
  if [ "$AVAILABLE_SPACE" -gt "$REQUIRED_SPACE" ]; then
    log_pass "Sufficient disk space available ($AVAILABLE_SPACE KB)"
  else
    log_warn "Limited disk space ($AVAILABLE_SPACE KB available, $REQUIRED_SPACE KB required)"
  fi
else
  log_warn "Cannot determine MySQL data directory"
fi

################################################################################
# 10. DEPLOYMENT READINESS SUMMARY
################################################################################

log_section "10. DEPLOYMENT READINESS SUMMARY"

echo ""
echo "Test Results:"
echo "  ✓ Passed:  $PASSED"
echo "  ✗ Failed:  $FAILED"
echo "  ⚠ Warnings: $WARNINGS"
echo ""

if [ "$FAILED" -eq 0 ]; then
  echo -e "${GREEN}═══════════════════════════════════════════════════════════════════${NC}"
  echo -e "${GREEN}✓ ALL CHECKS PASSED - SAFE TO DEPLOY${NC}"
  echo -e "${GREEN}═══════════════════════════════════════════════════════════════════${NC}"
  echo ""
  echo "Deployment Recommendations:"
  echo "  1. Monitor Flyway logs during migration"
  echo "  2. Migration V52: Expected <1 second"
  echo "  3. Migration V53: Expected 2-3 seconds"
  echo "  4. If migration hangs, check: SHOW PROCESSLIST;"
  echo "  5. Estimated total migration time: <5 seconds"
  echo ""
  
  if [ "$WARNINGS" -gt 0 ]; then
    echo "Address these warnings before production deployment:"
    echo "  - Add recommended database indexes"
    echo "  - Verify tmp_table_size if V53 seems slow"
    echo "  - Ensure network connectivity is stable"
  fi
  
  exit 0
else
  echo -e "${RED}═══════════════════════════════════════════════════════════════════${NC}"
  echo -e "${RED}✗ DEPLOYMENT BLOCKED - FIX FAILURES BEFORE PROCEEDING${NC}"
  echo -e "${RED}═══════════════════════════════════════════════════════════════════${NC}"
  exit 1
fi
