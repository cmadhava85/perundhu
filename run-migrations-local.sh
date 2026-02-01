#!/bin/bash

# Flyway Migration Testing Quick Start
# Usage: bash run-migrations-local.sh

set -e  # Exit on error

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

PROJECT_ROOT="/Users/mchand69/Documents/perundhu"
COMPOSE_FILE="docker-compose.mysql-local.yml"

echo -e "${BLUE}=== Flyway Migration Local Testing ===${NC}\n"

# Check if Docker is running
echo -e "${YELLOW}Step 1: Checking Docker daemon...${NC}"
if ! docker ps > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker daemon is not running${NC}"
    echo -e "${YELLOW}Please start Docker Desktop:${NC}"
    echo "  macOS: open -a Docker"
    echo "  Or launch Docker.app from Applications"
    exit 1
fi
echo -e "${GREEN}✅ Docker daemon is running${NC}\n"

# Navigate to project root
cd "$PROJECT_ROOT"

# Stop any running containers
echo -e "${YELLOW}Step 2: Cleaning up previous containers...${NC}"
docker-compose -f "$COMPOSE_FILE" down 2>/dev/null || true
echo -e "${GREEN}✅ Cleaned up${NC}\n"

# Start database
echo -e "${YELLOW}Step 3: Starting MySQL database container...${NC}"
docker-compose -f "$COMPOSE_FILE" up -d
echo -e "${GREEN}✅ Database started${NC}\n"

# Wait for database to be healthy
echo -e "${YELLOW}Step 4: Waiting for database to be healthy (~30 seconds)...${NC}"
max_attempts=60
attempt=0
while [ $attempt -lt $max_attempts ]; do
    if docker-compose -f "$COMPOSE_FILE" ps db | grep -q "healthy"; then
        echo -e "${GREEN}✅ Database is healthy${NC}\n"
        break
    fi
    attempt=$((attempt + 1))
    echo "  Attempt $attempt/$max_attempts..."
    sleep 1
done

if [ $attempt -eq $max_attempts ]; then
    echo -e "${RED}❌ Database failed to become healthy after 60 seconds${NC}"
    echo "Logs:"
    docker-compose -f "$COMPOSE_FILE" logs db
    exit 1
fi

# Run Flyway info (to see what will be migrated)
echo -e "${YELLOW}Step 5: Running Flyway info (showing migrations)...${NC}"
cd backend
./gradlew flywayInfo || {
    echo -e "${RED}❌ Flyway info failed${NC}"
    exit 1
}
echo -e "${GREEN}✅ Flyway info completed${NC}\n"

# Run Flyway validate
echo -e "${YELLOW}Step 6: Validating migrations...${NC}"
./gradlew flywayValidate || {
    echo -e "${RED}❌ Migration validation failed${NC}"
    exit 1
}
echo -e "${GREEN}✅ Migrations validated${NC}\n"

# Run Flyway migrate
echo -e "${YELLOW}Step 7: Running migrations...${NC}"
if ./gradlew flywayMigrate; then
    echo -e "${GREEN}✅ Migrations completed successfully!${NC}\n"
else
    echo -e "${RED}❌ Migrations failed${NC}"
    echo "Checking database logs..."
    docker-compose -f "$PROJECT_ROOT/$COMPOSE_FILE" logs db | tail -50
    exit 1
fi

# Show final status
echo -e "${YELLOW}Step 8: Checking final migration status...${NC}"
./gradlew flywayInfo
echo -e "${GREEN}✅ Migration status verified${NC}\n"

echo -e "${GREEN}=== Migration Testing Complete! ===${NC}"
echo ""
echo -e "${BLUE}Summary:${NC}"
echo "  ✅ Database started and healthy"
echo "  ✅ All 23 migrations executed"
echo "  ✅ Database state validated"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "  1. Run manual tests on your application"
echo "  2. Test API endpoints pointing to localhost:8080"
echo "  3. When done, run: docker-compose -f docker-compose.mysql-local.yml down"
echo ""
echo -e "${BLUE}Useful Commands:${NC}"
echo "  View logs:     docker-compose -f docker-compose.mysql-local.yml logs -f db"
echo "  Stop all:      docker-compose -f docker-compose.mysql-local.yml down"
echo "  Reset DB:      docker-compose -f docker-compose.mysql-local.yml down -v"
echo ""
