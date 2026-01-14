#!/bin/bash
#
# Start TNSTC Parallel Scraper
# This script runs 5 parallel workers with checkpoint support
#

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}   TNSTC Parallel Scraper Launcher${NC}"
echo -e "${BLUE}============================================${NC}\n"

# Activate virtual environment
if [ -f ".venv/bin/activate" ]; then
    source .venv/bin/activate
    echo -e "${GREEN}✓${NC} Virtual environment activated"
else
    echo -e "${YELLOW}⚠${NC} Virtual environment not found, using system Python"
fi

# Default values
CITIES_FILE="${CITIES_FILE:-data/tnstc_cities.txt}"
OUTPUT_DIR="${OUTPUT_DIR:-data/tnstc_parallel}"
WORKERS="${WORKERS:-5}"
LOG_FILE="${LOG_FILE:-logs/tnstc_parallel_$(date +%Y%m%d_%H%M%S).log}"

# Create logs directory
mkdir -p logs
mkdir -p "$OUTPUT_DIR"

echo -e "${GREEN}Configuration:${NC}"
echo -e "  Cities file:  $CITIES_FILE"
echo -e "  Output dir:   $OUTPUT_DIR"
echo -e "  Workers:      $WORKERS"
echo -e "  Log file:     $LOG_FILE"
echo ""

# Check if cities file exists
if [ ! -f "$CITIES_FILE" ]; then
    echo -e "${YELLOW}⚠${NC} Cities file not found: $CITIES_FILE"
    echo "Creating sample cities file..."
    
    cat > "$CITIES_FILE" << 'EOF'
CHENNAI
MADURAI
COIMBATORE
SALEM
TIRUCHIRAPPALLI
EOF
    
    echo -e "${GREEN}✓${NC} Sample cities file created"
fi

# Check for existing checkpoint
CHECKPOINT_FILE="$OUTPUT_DIR/parallel_checkpoint.json"
if [ -f "$CHECKPOINT_FILE" ]; then
    echo -e "${YELLOW}ℹ${NC} Found existing checkpoint"
    
    # Show checkpoint info
    COMPLETED=$(python3 -c "import json; d=json.load(open('$CHECKPOINT_FILE')); print(len(d['completed_pairs']))" 2>/dev/null || echo "0")
    FAILED=$(python3 -c "import json; d=json.load(open('$CHECKPOINT_FILE')); print(len(d['failed_pairs']))" 2>/dev/null || echo "0")
    LAST_UPDATE=$(python3 -c "import json; d=json.load(open('$CHECKPOINT_FILE')); print(d.get('last_updated', 'N/A'))" 2>/dev/null || echo "N/A")
    
    echo -e "  Completed: $COMPLETED pairs"
    echo -e "  Failed: $FAILED pairs"
    echo -e "  Last updated: $LAST_UPDATE"
    echo ""
    echo -e "${GREEN}➜${NC} Will resume from checkpoint..."
else
    echo -e "${GREEN}ℹ${NC} No checkpoint found, starting fresh"
fi

echo ""
echo -e "${BLUE}Starting scraper...${NC}"
echo -e "${YELLOW}Press Ctrl+C to stop (progress will be saved)${NC}\n"

# Run the parallel scraper
python3 scripts/run_tnstc_parallel.py \
    --source-list "$CITIES_FILE" \
    --dest-list "$CITIES_FILE" \
    --output "$OUTPUT_DIR" \
    --workers "$WORKERS" \
    2>&1 | tee "$LOG_FILE"

# Check exit status
if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}============================================${NC}"
    echo -e "${GREEN}   ✓ Scraping Complete!${NC}"
    echo -e "${GREEN}============================================${NC}"
    echo -e "\n${GREEN}Output location:${NC} $OUTPUT_DIR"
    echo -e "${GREEN}Log file:${NC} $LOG_FILE"
    
    # Count total files
    JSON_COUNT=$(find "$OUTPUT_DIR" -name "*.json" -type f ! -name "*checkpoint*" | wc -l | tr -d ' ')
    echo -e "${GREEN}Files created:${NC} $JSON_COUNT JSON files"
else
    echo ""
    echo -e "${YELLOW}============================================${NC}"
    echo -e "${YELLOW}   ⚠ Scraping Interrupted${NC}"
    echo -e "${YELLOW}============================================${NC}"
    echo -e "\nProgress saved to checkpoint"
    echo -e "Run this script again to resume from where it stopped"
fi
