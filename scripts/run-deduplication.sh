#!/bin/bash

# Quick Location Deduplication Script
# Run this to identify and fix duplicate locations in the database

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$SCRIPT_DIR/.."

echo "🔍 Location Deduplication & Fixing"
echo "===================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Step 1: Check if deduplicate script exists
if [ ! -f "$SCRIPT_DIR/deduplicate-locations.py" ]; then
    echo -e "${RED}❌ deduplicate-locations.py not found${NC}"
    exit 1
fi

# Step 2: Analyze current duplicates
echo -e "${BLUE}📊 STEP 1: Analyzing current duplicates...${NC}"
echo ""

python3 "$SCRIPT_DIR/deduplicate-locations.py" 2>&1 | tee /tmp/dedup_analysis.log

# Store result for later use
DEDUP_OUTPUT=$(cat /tmp/dedup_analysis.log)

# Step 3: Check for enhanced fetcher
echo ""
echo -e "${BLUE}📡 STEP 2: Preparing enhanced location fetcher...${NC}"
echo ""

if [ ! -f "$SCRIPT_DIR/enhanced-fetch-locations.py" ]; then
    echo -e "${RED}❌ enhanced-fetch-locations.py not found${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Enhanced fetcher ready${NC}"

# Step 4: Offer to regenerate data
echo ""
echo -e "${YELLOW}Choose next action:${NC}"
echo "1) Regenerate location data (removes duplicates)"
echo "2) View detailed duplicate analysis only"
echo "3) Cancel"
echo ""
read -p "Enter choice (1-3): " CHOICE

case $CHOICE in
    1)
        echo ""
        echo -e "${BLUE}🚀 Regenerating location data with deduplication...${NC}"
        echo ""
        python3 "$SCRIPT_DIR/enhanced-fetch-locations.py"
        
        echo ""
        echo -e "${GREEN}✅ Location data regenerated${NC}"
        echo ""
        echo -e "${YELLOW}Next steps:${NC}"
        echo "1. Review the generated migration file in backend/app/src/main/resources/db/migration/"
        echo "2. Run: cd $PROJECT_ROOT/backend && ./gradlew flywayMigrate"
        echo "3. Verify: SELECT COUNT(*) FROM locations;"
        ;;
    2)
        echo ""
        echo -e "${BLUE}📊 Detailed Analysis:${NC}"
        echo ""
        echo "$DEDUP_OUTPUT"
        ;;
    3)
        echo -e "${YELLOW}Cancelled${NC}"
        exit 0
        ;;
    *)
        echo -e "${RED}Invalid choice${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}Done!${NC}"
