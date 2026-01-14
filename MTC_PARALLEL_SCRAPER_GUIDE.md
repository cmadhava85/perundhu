# 🚀 MTC Parallel Scraper - Quick Start Guide

## Overview
Parallel MTC bus timing scraper with **5 concurrent workers** and **automatic checkpoint/resume support**.
Runs alongside the original MTC scraper without interfering.

## Features
✅ **5 Parallel Workers** - Processes routes in parallel
✅ **Auto-Resume** - Continues from last position if interrupted
✅ **Checkpoint Every 5 Batches** - Progress saved automatically
✅ **Non-Blocking** - Runs alongside original scraper (doesn't interfere)
✅ **Efficient** - Shares data with original process via checkpoints

---

## Quick Start

### In a NEW Terminal Window

```bash
cd /Users/mchand69/Documents/perundhu
./start-mtc-parallel-scraper.sh
```

That's it! The script will:
- Activate virtual environment automatically
- Keep the original MTC scraper running
- Start 5 parallel workers
- Save progress with checkpoints
- Resume automatically if interrupted

---

## Customize Worker Count

```bash
# Use 10 workers for faster scraping
WORKERS=10 ./start-mtc-parallel-scraper.sh

# Use 3 workers for lighter resource usage
WORKERS=3 ./start-mtc-parallel-scraper.sh
```

---

## Monitor Progress

### Check Parallel Scrapers Running
```bash
# See all MTC processes
ps aux | grep mtc_bus_scraper_selenium.py | grep -v grep
```

### View Checkpoint Status
```bash
# See current parallel progress
cat data/mtc_parallel/parallel_checkpoint.json | python3 -m json.tool | head -30
```

### Count Output Files
```bash
# Count created JSON files
find data/mtc_parallel -name "*.json" ! -name "*checkpoint*" | wc -l
```

### Tail Log File
```bash
# Watch real-time progress
tail -f logs/mtc_parallel_*.log
```

---

## Original Scraper Status

```bash
# Check if original scraper still running
ps aux | grep "mtc_bus_scraper_selenium.py --delay 0.6" | grep -v grep

# Check original checkpoint
cat data/mtc_bus_timings.checkpoint.json | wc -l
```

---

## 🔄 Resume After Interruption

If you stop the parallel scraper (Ctrl+C):

```bash
# Just run the same command again - it will resume!
./start-mtc-parallel-scraper.sh
```

The checkpoint automatically:
- Tracks completed batches
- Skips already processed routes
- Merges results together
- Saves progress every 5 completions

---

## 📊 Performance

### With 5 Workers:
- **Speed**: Parallel batch processing
- **Memory**: ~1.5 GB (5 Chrome instances)
- **Runtime**: ~2-3 hours (depends on MTC site speed)

### With 10 Workers:
- **Speed**: 2x faster (if system can handle)
- **Memory**: ~3 GB
- **Runtime**: ~1-1.5 hours

---

## 📁 Output Structure

```
data/mtc_parallel/
├── parallel_checkpoint.json          # Progress tracker
├── worker_1_batch.json               # Batch results
├── worker_1_batch.csv
├── worker_2_batch.json
└── worker_*.json/csv                 # One per worker batch
```

---

## ⚙️ How It Works (Parallel Strategy)

1. **Original Scraper** (Running since 10:18 AM)
   - Continues fetching all routes sequentially
   - Saves to `data/mtc_bus_timings.checkpoint.json`

2. **Parallel Scraper** (New - runs in new terminal)
   - Divides routes into batches
   - 5 workers process batches simultaneously
   - Saves to `data/mtc_parallel/parallel_checkpoint.json`

3. **After Both Complete**
   - Merge both outputs for complete data
   - Cross-check for duplicates
   - Combine into final dataset

---

## 🛑 Stopping

### Graceful Stop
Press `Ctrl+C` once - will:
1. Stop accepting new batches
2. Finish current batches
3. Save checkpoint
4. Exit cleanly

### Force Stop (Not Recommended)
Press `Ctrl+C` twice - kills immediately
- May lose progress since last checkpoint

---

## 🐛 Troubleshooting

### Problem: "Permission denied"
```bash
chmod +x start-mtc-parallel-scraper.sh scripts/run_mtc_parallel.py
```

### Problem: "Too many Chrome processes"
```bash
# Kill all Chrome instances
pkill -f "Chrome"

# Reduce worker count
WORKERS=3 ./start-mtc-parallel-scraper.sh
```

### Problem: Workers failing
Check individual worker logs:
```bash
# Tail the main log
tail -f logs/mtc_parallel_*.log

# Check stderr
cat data/mtc_parallel/worker_*.log 2>/dev/null
```

---

## 📊 Combining Results (After Both Complete)

```bash
# Merge parallel results
python3 << 'EOF'
import json
import glob

all_timings = []

# Load parallel worker results
for file in glob.glob('data/mtc_parallel/worker_*.json'):
    with open(file) as f:
        try:
            timings = json.load(f)
            if isinstance(timings, list):
                all_timings.extend(timings)
        except:
            pass

# Remove duplicates by route+origin+dest+timing
seen = set()
unique = []
for timing in all_timings:
    key = (timing.get('route_number'), timing.get('origin_value'), 
           timing.get('destination_value'), timing.get('timing'))
    if key not in seen:
        seen.add(key)
        unique.append(timing)

with open('data/mtc_all_timings_merged.json', 'w') as f:
    json.dump(unique, f, indent=2)

print(f"✓ Merged {len(all_timings)} timings → {len(unique)} unique timings")
EOF
```

---

## 💡 Pro Tips

1. **Run in Background** (if laptop will sleep)
   ```bash
   nohup ./start-mtc-parallel-scraper.sh > mtc_parallel.log 2>&1 &
   ```

2. **Keep Mac Awake**
   ```bash
   # In another terminal
   caffeinate -i
   ```

3. **Monitor System**
   ```bash
   # Watch CPU/RAM
   htop
   ```

4. **Start Small for Testing**
   ```bash
   # Test with 2 workers on a few routes
   WORKERS=2 python3 scripts/run_mtc_parallel.py --workers 2
   ```

---

## ✅ Ready!

Open a **NEW terminal** and run:
```bash
cd /Users/mchand69/Documents/perundhu && ./start-mtc-parallel-scraper.sh
```

The parallel scraper will:
✅ Start 5 workers immediately
✅ Process routes in parallel
✅ Save checkpoints every 5 batches
✅ Resume automatically if interrupted
✅ Merge with original scraper results

**Both scrapers working together!** 🎉
