#!/bin/bash

################################################################################
# MIGRATION EXECUTION MONITORING SCRIPT
# Purpose: Monitor V52/V53 migrations in real-time during deployment
# Usage: bash migration-monitor.sh
# Created: 2026-01-06
################################################################################

set -e

echo "╔════════════════════════════════════════════════════════════════════╗"
echo "║  MIGRATION EXECUTION MONITOR (Real-Time)                          ║"
echo "║  Tracks V52 & V53 execution, logs, and performance metrics        ║"
echo "╚════════════════════════════════════════════════════════════════════╝"
echo ""

# Configuration
DB_USER="${DB_USER:-root}"
DB_PASS="${DB_PASS:-root}"
DB_NAME="${DB_NAME:-perundhu}"
DB_HOST="${DB_HOST:-127.0.0.1}"
DB_PORT="${DB_PORT:-3306}"
MONITOR_INTERVAL="${MONITOR_INTERVAL:-2}" # seconds

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

################################################################################
# FUNCTIONS
################################################################################

get_running_queries() {
  mysql -u "$DB_USER" -p"$DB_PASS" -h "$DB_HOST" -P "$DB_PORT" \
    -e "SELECT ID, USER, HOST, DB, COMMAND, TIME, STATE, SUBSTR(INFO,1,80) as QUERY FROM INFORMATION_SCHEMA.PROCESSLIST WHERE COMMAND != 'Sleep' ORDER BY TIME DESC\G" 2>/dev/null || echo ""
}

get_migration_history() {
  mysql -u "$DB_USER" -p"$DB_PASS" -h "$DB_HOST" -P "$DB_PORT" "$DB_NAME" \
    -e "SELECT version, description, type, script, installed_on, execution_time, success FROM flyway_schema_history ORDER BY installed_rank DESC LIMIT 5;" 2>/dev/null || echo "No migration history"
}

get_table_stats() {
  mysql -u "$DB_USER" -p"$DB_PASS" -h "$DB_HOST" -P "$DB_PORT" \
    -e "SELECT TABLE_NAME, TABLE_ROWS, ROUND((DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024, 2) as SIZE_MB FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA='$DB_NAME' AND TABLE_NAME IN ('locations', 'translations');" 2>/dev/null || echo ""
}

get_translation_stats() {
  mysql -u "$DB_USER" -p"$DB_PASS" -h "$DB_HOST" -P "$DB_PORT" "$DB_NAME" \
    -e "SELECT 
      (SELECT COUNT(*) FROM locations) as total_locations,
      (SELECT COUNT(*) FROM translations WHERE entity_type='location' AND language_code='ta') as tamil_translations,
      (SELECT COUNT(*) FROM translations WHERE entity_type='location' AND language_code='ta' AND (translated_value IS NULL OR TRIM(translated_value)='')) as empty_translations,
      ROUND((SELECT COUNT(*) FROM translations WHERE entity_type='location' AND language_code='ta') * 100.0 / (SELECT COUNT(*) FROM locations), 2) as coverage_percent;" 2>/dev/null || echo ""
}

monitor_continuous() {
  local iteration=0
  local start_time=$(date +%s)
  
  echo -e "${BLUE}═══════════════════════════════════════════════════════════════════${NC}"
  echo -e "${BLUE}Starting continuous monitoring (Press Ctrl+C to stop)${NC}"
  echo -e "${BLUE}═══════════════════════════════════════════════════════════════════${NC}"
  echo ""
  
  while true; do
    ((iteration++))
    ELAPSED=$(($(date +%s) - start_time))
    
    clear
    
    echo "╔════════════════════════════════════════════════════════════════════╗"
    echo "║  MIGRATION MONITOR - Iteration $iteration (Elapsed: ${ELAPSED}s)                   ║"
    echo "║  Check PROCESSLIST to detect migration status                      ║"
    echo "╚════════════════════════════════════════════════════════════════════╝"
    echo ""
    
    # Check for running migrations
    RUNNING=$(get_running_queries)
    
    if echo "$RUNNING" | grep -qi "insert\|update\|delete\|alter"; then
      echo -e "${CYAN}RUNNING QUERIES (Migration In Progress):${NC}"
      echo "$RUNNING"
    else
      echo -e "${GREEN}No active queries detected${NC}"
    fi
    
    echo ""
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}TABLE STATISTICS:${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    get_table_stats
    
    echo ""
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}TRANSLATION COVERAGE:${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    get_translation_stats
    
    echo ""
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}RECENT MIGRATION HISTORY (Last 5):${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    get_migration_history
    
    echo ""
    echo -e "${YELLOW}Next check in ${MONITOR_INTERVAL}s... (Ctrl+C to exit)${NC}"
    sleep "$MONITOR_INTERVAL"
  done
}

show_debug_commands() {
  echo ""
  echo -e "${BLUE}═══════════════════════════════════════════════════════════════════${NC}"
  echo -e "${BLUE}DEBUG COMMANDS (Useful if migration hangs):${NC}"
  echo -e "${BLUE}═══════════════════════════════════════════════════════════════════${NC}"
  echo ""
  echo "1. Check running queries:"
  echo "   ${CYAN}mysql -u $DB_USER -p'$DB_PASS' -e 'SHOW PROCESSLIST;'${NC}"
  echo ""
  echo "2. Kill a hanging query (if needed):"
  echo "   ${CYAN}mysql -u $DB_USER -p'$DB_PASS' -e 'KILL QUERY <query_id>;'${NC}"
  echo ""
  echo "3. Check table lock status:"
  echo "   ${CYAN}mysql -u $DB_USER -p'$DB_PASS' -e 'SHOW OPEN TABLES;'${NC}"
  echo ""
  echo "4. Check InnoDB locks:"
  echo "   ${CYAN}mysql -u $DB_USER -p'$DB_PASS' -e 'SHOW ENGINE INNODB STATUS\G'${NC}"
  echo ""
  echo "5. Verify translation coverage:"
  echo "   ${CYAN}mysql -u $DB_USER -p'$DB_PASS' -D $DB_NAME -e 'SELECT COUNT(*) FROM translations WHERE entity_type=\"location\" AND language_code=\"ta\";'${NC}"
  echo ""
}

################################################################################
# MAIN
################################################################################

echo "Select monitoring mode:"
echo "  1) Continuous monitoring (auto-refresh)"
echo "  2) One-time status check"
echo "  3) Show debug commands only"
echo ""
read -p "Enter choice (1-3): " choice

case $choice in
  1)
    monitor_continuous
    ;;
  2)
    echo "Current Status:"
    echo ""
    echo "RUNNING QUERIES:"
    get_running_queries
    echo ""
    echo "TABLE STATISTICS:"
    get_table_stats
    echo ""
    echo "TRANSLATION COVERAGE:"
    get_translation_stats
    echo ""
    echo "MIGRATION HISTORY:"
    get_migration_history
    ;;
  3)
    show_debug_commands
    ;;
  *)
    echo "Invalid choice"
    exit 1
    ;;
esac
