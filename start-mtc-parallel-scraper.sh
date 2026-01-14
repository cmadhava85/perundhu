#!/bin/bash
#
# Start MTC Parallel Scraper
# This script runs 5 parallel workers with checkpoint support
# While keeping the original MTC scraper running
#

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}   MTC Parallel Scraper Launcher${NC}"
echo -e "${BLUE}============================================${NC}\n"

# Activate virtual environment
if [ -f ".venv/bin/activate" ]; then
    source .venv/bin/activate
    echo -e "${GREEN}✓${NC} Virtual environment activated"
else
    echo -e "${YELLOW}⚠${NC} Virtual environment not found, using system Python"
fi

# Default values
OUTPUT_DIR="${OUTPUT_DIR:-data/mtc_parallel}"
WORKERS="${WORKERS:-5}"
LOG_FILE="${LOG_FILE:-logs/mtc_parallel_$(date +%Y%m%d_%H%M%S).log}"

# Create logs directory
mkdir -p logs
mkdir -p "$OUTPUT_DIR"

echo -e "${GREEN}Configuration:${NC}"
echo -e "  Output dir:   $OUTPUT_DIR"
echo -e "  Workers:      $WORKERS"
echo -e "  Log file:     $LOG_FILE"
echo ""

# Check for existing process
ORIGINAL_PID=$(pgrep -f "mtc_bus_scraper_selenium.py --delay 0.6" | grep -v grep | head -1 || true)
if [ ! -z "$ORIGINAL_PID" ]; then
    echo -e "${GREEN}ℹ${NC} Original MTC scraper running (PID: $ORIGINAL_PID)"
    
    # Get process runtime
    PS_OUTPUT=$(ps -p "$ORIGINAL_PID" -o etime= 2>/dev/null || echo "unknown")
    echo -e "  Runtime: $PS_OUTPUT"
    echo -e "${YELLOW}➜${NC} Will continue in parallel..."
else
    echo -e "${YELLOW}⚠${NC} Original MTC scraper not found (it may have finished)"
fi

echo ""

# Check for existing checkpoint
CHECKPOINT_FILE="$OUTPUT_DIR/parallel_checkpoint.json"
if [ -f "$CHECKPOINT_FILE" ]; then
    echo -e "${YELLOW}ℹ${NC} Found existing checkpoint"
    
    # Show checkpoint info
    COMPLETED=$(python3 -c "import json; d=json.load(open('$CHECKPOINT_FILE')); print(len(d.get('completed_routes', [])))" 2>/dev/null || echo "?")
    FAILED=$(python3 -c "import json; d=json.load(open('$CHECKPOINT_FILE')); print(len(d.get('failed_routes', [])))" 2>/dev/null || echo "?")
    TIMINGS=$(python3 -c "import json; d=json.load(open('$CHECKPOINT_FILE')); print(len(d.get('all_timings', [])))" 2>/dev/null || echo "?")
    
    echo -e "  Completed batches: $COMPLETED"
    echo -e "  Failed batches: $FAILED"
    echo -e "  Total timings: $TIMINGS"
    echo ""
    echo -e "${GREEN}➜${NC} Will resume from checkpoint..."
else
    echo -e "${GREEN}ℹ${NC} No checkpoint found, starting fresh"
fi

echo ""
echo -e "${BLUE}Starting scraper...${NC}"
echo -e "${YELLOW}Press Ctrl+C to stop (progress will be saved)${NC}\n"

# Run the parallel scraper
python3 scripts/run_mtc_parallel.py \
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
    JSON_COUNT=$(find "$OUTPUT_DIR" -name "*.json" -type f ! -name "*checkpoint*" 2>/dev/null | wc -l | tr -d ' ')
    echo -e "${GREEN}Files created:${NC} $JSON_COUNT JSON files"
else
    echo ""
    echo -e "${YELLOW}============================================${NC}"
    echo -e "${YELLOW}   ⚠ Scraping Interrupted${NC}"
    echo -e "${YELLOW}============================================${NC}"
    echo -e "\nProgress saved to checkpoint"
    echo -e "Run this script again to resume from where it stopped"
fi
