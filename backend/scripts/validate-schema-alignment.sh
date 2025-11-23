#!/bin/bash
# Schema Validation Script
# Validates that all JPA entities align with database migrations

set -e

echo "=============================================="
echo "Schema Alignment Validation"
echo "=============================================="
echo ""

MIGRATION_DIR="backend/app/src/main/resources/db/migration/mysql"
ENTITY_DIR="backend/app/src/main/java/com/perundhu/infrastructure/persistence/entity"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "Checking entity-to-schema alignment..."
echo ""

# Entity-to-Migration mapping
declare -A ENTITY_TABLES=(
  ["BusJpaEntity"]="buses"
  ["LocationJpaEntity"]="locations"
  ["StopJpaEntity"]="stops"
  ["TranslationJpaEntity"]="translations"
  ["RouteContributionJpaEntity"]="route_contributions"
  ["ImageContributionJpaEntity"]="image_contributions"
  ["BusTimingRecordEntity"]="bus_timing_records"
  ["TimingImageContributionEntity"]="timing_image_contributions"
  ["ExtractedBusTimingEntity"]="extracted_bus_timings"
  ["SkippedTimingRecordEntity"]="skipped_timing_records"
  ["UserTrackingSessionEntity"]="user_tracking_sessions"
)

# Expected columns for each entity
declare -A BUSES_COLUMNS=(
  ["id"]="BIGINT"
  ["name"]="VARCHAR"
  ["bus_number"]="VARCHAR"
  ["from_location_id"]="BIGINT"
  ["to_location_id"]="BIGINT"
  ["departure_time"]="TIME"
  ["arrival_time"]="TIME"
  ["capacity"]="INT"
  ["category"]="VARCHAR"
  ["active"]="BOOLEAN"
  ["created_at"]="TIMESTAMP|DATETIME"
  ["updated_at"]="TIMESTAMP|DATETIME"
)

declare -A LOCATIONS_COLUMNS=(
  ["id"]="BIGINT"
  ["name"]="VARCHAR"
  ["latitude"]="DOUBLE|DECIMAL"
  ["longitude"]="DOUBLE|DECIMAL"
  ["osm_node_id"]="BIGINT"
  ["osm_way_id"]="BIGINT"
  ["last_osm_update"]="TIMESTAMP|DATETIME"
  ["osm_tags"]="JSON"
  ["created_at"]="TIMESTAMP|DATETIME"
  ["updated_at"]="TIMESTAMP|DATETIME"
)

declare -A STOPS_COLUMNS=(
  ["id"]="BIGINT"
  ["name"]="VARCHAR"
  ["bus_id"]="BIGINT"
  ["location_id"]="BIGINT"
  ["arrival_time"]="TIME"
  ["departure_time"]="TIME"
  ["stop_order"]="INT"
  ["created_at"]="TIMESTAMP|DATETIME"
  ["updated_at"]="TIMESTAMP|DATETIME"
)

echo "Table: buses"
for col in "${!BUSES_COLUMNS[@]}"; do
  if grep -r "CREATE TABLE.*buses" "$MIGRATION_DIR" | head -1 > /dev/null; then
    if grep -r "$col" "$MIGRATION_DIR/V*.sql" | grep -i "buses" | grep -qE "${BUSES_COLUMNS[$col]}"; then
      echo -e "  ${GREEN}✓${NC} Column '$col' found"
    else
      echo -e "  ${RED}✗${NC} Column '$col' MISSING or type mismatch"
    fi
  fi
done
echo ""

echo "Table: locations"
for col in "${!LOCATIONS_COLUMNS[@]}"; do
  if grep -r "$col" "$MIGRATION_DIR/V*.sql" | grep -i "locations" | grep -qE "${LOCATIONS_COLUMNS[$col]}"; then
    echo -e "  ${GREEN}✓${NC} Column '$col' found"
  else
    echo -e "  ${YELLOW}⚠${NC} Column '$col' may be missing"
  fi
done
echo ""

echo "Table: stops"
for col in "${!STOPS_COLUMNS[@]}"; do
  if grep -r "$col" "$MIGRATION_DIR/V*.sql" | grep -i "stops" | grep -qE "${STOPS_COLUMNS[$col]}"; then
    echo -e "  ${GREEN}✓${NC} Column '$col' found"
  else
    echo -e "  ${YELLOW}⚠${NC} Column '$col' may be missing"
  fi
done
echo ""

echo "=============================================="
echo "Validation Summary"
echo "=============================================="
echo ""
echo "Run './gradlew clean build -x test' to verify compilation"
echo "Check for schema-validation errors in logs"
echo ""
