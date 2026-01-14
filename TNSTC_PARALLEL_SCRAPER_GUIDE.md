# 🚀 TNSTC Parallel Scraper - Quick Start Guide

## Overview
Parallel TNSTC bus route scraper with **automatic checkpoint/resume** support and **5 concurrent workers** for fast data collection.

## Features
✅ **5 Parallel Workers** - Scrapes 5 routes simultaneously
✅ **Auto-Resume** - Continues from last position if interrupted
✅ **Checkpoint System** - Progress saved every 5 completed pairs
✅ **Error Handling** - Retries failed pairs
✅ **Resource Efficient** - Manages 5 browser instances

---

## Quick Start

### Option 1: Using the Launcher Script (Easiest)

```bash
# In a NEW terminal window (keep MTC scraper running in the other one)
cd /Users/mchand69/Documents/perundhu
./start-tnstc-scraper.sh
```

That's it! The script will:
- Load virtual environment automatically
- Use the default city list (25 Tamil Nadu cities)
- Run 5 parallel workers
- Save progress with checkpoints
- Resume automatically if interrupted

### Option 2: Custom Configuration

```bash
# Custom workers count (e.g., 10 workers for faster scraping)
WORKERS=10 ./start-tnstc-scraper.sh

# Custom cities file
CITIES_FILE=my_cities.txt ./start-tnstc-scraper.sh

# Custom output directory
OUTPUT_DIR=data/my_tnstc_data ./start-tnstc-scraper.sh
```

### Option 3: Direct Python Script

```bash
# Single route pair
python scripts/run_tnstc_parallel.py \
    --source "MADURAI" \
    --dest "CHENNAI"

# All combinations from city list with 5 workers
python scripts/run_tnstc_parallel.py \
    --source-list data/tnstc_cities.txt \
    --dest-list data/tnstc_cities.txt \
    --workers 5

# With custom output
python scripts/run_tnstc_parallel.py \
    --source-list data/tnstc_cities.txt \
    --dest-list data/tnstc_cities.txt \
    --output data/tnstc_january \
    --workers 10
```

---

## 📊 Monitoring Progress

### Check Running Workers
```bash
# See all running TNSTC scrapers
ps aux | grep "tnstc_bus_scraper_selenium.py"
```

### View Checkpoint Status
```bash
# See current progress
python3 -c "
import json
d = json.load(open('data/tnstc_parallel/parallel_checkpoint.json'))
print(f'Completed: {len(d[\"completed_pairs\"])} pairs')
print(f'Failed: {len(d[\"failed_pairs\"])} pairs')
print(f'Last update: {d[\"last_updated\"]}')
"
```

### Count Scraped Files
```bash
# Count JSON files created
find data/tnstc_parallel -name "*.json" -type f ! -name "*checkpoint*" | wc -l

# Show recent files
ls -lht data/tnstc_parallel/*.json | head -10
```

### Tail Log File
```bash
# Watch real-time progress
tail -f logs/tnstc_parallel_*.log
```

---

## 🔄 Resume After Interruption

If you stop the scraper (Ctrl+C) or if it crashes:

```bash
# Just run the same command again - it will resume!
./start-tnstc-scraper.sh
```

The checkpoint system automatically:
- Tracks completed route pairs
- Skips already scraped pairs
- Continues from where it stopped
- Saves progress every 5 completions

---

## 📁 Output Structure

```
data/tnstc_parallel/
├── parallel_checkpoint.json          # Progress tracker
├── worker_1_CHENNAI_MADURAI.json    # Individual route data
├── worker_1_CHENNAI_MADURAI.csv
├── worker_2_MADURAI_COIMBATORE.json
├── worker_2_MADURAI_COIMBATORE.csv
└── ... (one JSON+CSV per route pair)

logs/
└── tnstc_parallel_20260113_120000.log  # Timestamped logs
```

---

## 🎯 Performance Expectations

### With 5 Workers:
- **Speed**: ~1-2 minutes per route pair
- **Throughput**: ~2.5-5 route pairs per minute
- **25 cities** (600 pairs): ~2-4 hours
- **Memory**: ~1.5 GB RAM (5 Chrome instances)

### With 10 Workers:
- **Speed**: 2x faster
- **Throughput**: ~5-10 route pairs per minute
- **Memory**: ~3 GB RAM

---

## 🔧 Configuration

### Adjusting Worker Count

```bash
# For faster scraping (if you have good CPU/RAM)
WORKERS=10 ./start-tnstc-scraper.sh

# For slower but safer (less resource usage)
WORKERS=3 ./start-tnstc-scraper.sh
```

### Custom City List

Create your own `my_cities.txt`:
```text
CHENNAI
MADURAI
COIMBATORE
SALEM
```

Then run:
```bash
CITIES_FILE=my_cities.txt ./start-tnstc-scraper.sh
```

---

## 🛑 Stopping the Scraper

### Graceful Stop
Press `Ctrl+C` once - it will:
1. Stop accepting new tasks
2. Finish current tasks
3. Save checkpoint
4. Exit cleanly

### Force Stop (Not Recommended)
Press `Ctrl+C` twice - kills immediately
- May lose progress since last checkpoint

---

## 🐛 Troubleshooting

### Problem: "Permission denied"
```bash
# Fix script permissions
chmod +x start-tnstc-scraper.sh scripts/run_tnstc_parallel.py
```

### Problem: "ChromeDriver not found"
```bash
# Install ChromeDriver (if not already installed)
brew install chromedriver  # macOS
```

### Problem: "Too many Chrome processes"
```bash
# Kill all Chrome instances
pkill -f "Chrome"

# Reduce worker count
WORKERS=3 ./start-tnstc-scraper.sh
```

### Problem: All pairs showing as failed
```bash
# Check a specific log for errors
cat data/tnstc_parallel/worker_1_CHENNAI_MADURAI.log

# Test single pair manually
python scripts/tnstc_bus_scraper_selenium.py \
    --source "CHENNAI" \
    --dest "MADURAI" \
    --show-browser
```

---

## 📦 Merging Output Files

After scraping completes, merge all JSON files:

```bash
# Merge all JSON files into one
python3 << 'EOF'
import json
import glob

all_routes = []
for file in glob.glob('data/tnstc_parallel/worker_*.json'):
    with open(file) as f:
        routes = json.load(f)
        all_routes.extend(routes)

with open('data/tnstc_all_routes_merged.json', 'w') as f:
    json.dump(all_routes, f, indent=2)

print(f"✓ Merged {len(all_routes)} routes into tnstc_all_routes_merged.json")
EOF
```

---

## 💡 Pro Tips

1. **Run in Background**
   ```bash
   nohup ./start-tnstc-scraper.sh > tnstc.log 2>&1 &
   ```

2. **Keep Mac Awake**
   ```bash
   # In another terminal
   caffeinate -i
   ```

3. **Monitor System Resources**
   ```bash
   # Watch CPU/RAM usage
   htop  # or `top` on macOS
   ```

4. **Start Small for Testing**
   ```bash
   # Test with just 2 cities first
   echo -e "CHENNAI\nMADURAI" > test_cities.txt
   CITIES_FILE=test_cities.txt WORKERS=2 ./start-tnstc-scraper.sh
   ```

5. **Retry Failed Pairs**
   After completion, the checkpoint will show failed pairs. You can:
   - Re-run the same command (it will retry failed pairs)
   - Or manually check the failed pairs in the checkpoint

---

## 🔍 Comparison: Sequential vs Parallel

### Without Parallel (Original Script):
```bash
# One route at a time
python scripts/tnstc_bus_scraper_selenium.py \
    --source-list cities.txt \
    --dest-list cities.txt
```
- ⏱️ **25 cities (600 pairs)**: ~10-20 hours
- 💾 **Memory**: ~500 MB
- ❌ **No resume**: Must start over if interrupted

### With Parallel (New Script):
```bash
# 5 routes simultaneously
./start-tnstc-scraper.sh
```
- ⏱️ **25 cities (600 pairs)**: ~2-4 hours (5x faster)
- 💾 **Memory**: ~1.5 GB
- ✅ **Auto-resume**: Continues from checkpoint

---

## 📊 Example Output

```
============================================
🚀 Starting parallel TNSTC scraper
   Workers: 5
   Total pairs: 600
   Already completed: 0
   Pending: 600
============================================

✅ [Worker 1] CHENNAI -> MADURAI: 12 routes
✅ [Worker 2] CHENNAI -> COIMBATORE: 15 routes
✅ [Worker 3] CHENNAI -> SALEM: 8 routes
✅ [Worker 4] MADURAI -> CHENNAI: 11 routes
✅ [Worker 5] MADURAI -> COIMBATORE: 9 routes

📊 Progress: 5/600 (0.8%) | Total routes: 55

...

============================================
🏁 SCRAPING COMPLETE
   Total pairs processed: 600
   ✅ Successful: 585
   ❌ Failed: 15
   📦 Total routes scraped: 8,432
   📁 Output directory: data/tnstc_parallel
============================================
```

---

## 🚀 Ready to Start!

**Open a NEW terminal window** (keep MTC scraper running in the current one):

```bash
cd /Users/mchand69/Documents/perundhu
./start-tnstc-scraper.sh
```

The scraper will:
✅ Start 5 parallel workers
✅ Save progress every 5 completions  
✅ Resume automatically if interrupted
✅ Complete 25x25 = 600 route pairs in 2-4 hours

**Happy scraping!** 🎉
