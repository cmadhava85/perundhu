#!/bin/bash
# Background scraper runner - runs until all city pairs are scraped

cd /Users/mchand69/Documents/perundhu

# Log file
LOG_FILE="data/tamilvandi_scraper.log"

echo "Starting Tamil Vandi scraper at $(date)" >> "$LOG_FILE"
echo "=======================================" >> "$LOG_FILE"

# Run scraper in batches
BATCH=1
while true; do
    echo "Starting batch $BATCH at $(date)" >> "$LOG_FILE"
    
    # Run 50 pairs per batch
    /Users/mchand69/Documents/perundhu/.venv/bin/python resume_tamilvandi_smart.py --limit 50 --delay 2.0 2>&1 | tee -a "$LOG_FILE"
    
    LAST_EXIT=$?
    echo "Batch $BATCH completed with exit code $LAST_EXIT at $(date)" >> "$LOG_FILE"
    
    # Check if all pairs are done by checking final status
    COMPLETED_COUNT=$(/Users/mchand69/Documents/perundhu/.venv/bin/python -c "
import json
from pathlib import Path

output_dir = Path('data/tamilvandi_all')
completed = 0
for json_file in output_dir.glob('*_to_*.json'):
    if 'checkpoint' not in json_file.name:
        try:
            with open(json_file) as f:
                data = json.load(f)
                if isinstance(data, list) and len(data) > 0:
                    completed += 1
        except:
            pass

print(completed)
" 2>/dev/null)
    
    echo "Current completed pairs: $COMPLETED_COUNT" >> "$LOG_FILE"
    
    # If very few pairs completed in this batch, we're likely done
    if [ "$COMPLETED_COUNT" -gt 1000 ]; then
        echo "✅ All (or most) pairs completed! Stopping." >> "$LOG_FILE"
        break
    fi
    
    BATCH=$((BATCH + 1))
    
    # Wait before next batch
    sleep 5
done

echo "Scraper finished at $(date)" >> "$LOG_FILE"
