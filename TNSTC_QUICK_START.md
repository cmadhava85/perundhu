# 🎯 Quick Command Reference

## Start TNSTC Parallel Scraper (5 Workers)

**Open a NEW terminal window and run:**

```bash
cd /Users/mchand69/Documents/perundhu
./start-tnstc-scraper.sh
```

## What It Does

✅ **5 Parallel Workers** - Scrapes 5 different routes simultaneously
✅ **Auto-Resume** - If stopped/crashed, run same command to continue
✅ **Checkpoint Every 5 Pairs** - Progress saved automatically
✅ **25 Cities** - Chennai, Madurai, Coimbatore, Salem, etc.
✅ **~600 Route Pairs** - All combinations of 25x25 cities
✅ **2-4 Hours Total** - Much faster than sequential

## Monitor Progress

```bash
# Check running workers
ps aux | grep "tnstc_bus_scraper_selenium.py" | grep -v grep

# Count files created
find data/tnstc_parallel -name "*.json" ! -name "*checkpoint*" | wc -l

# View checkpoint status
cat data/tnstc_parallel/parallel_checkpoint.json | python3 -m json.tool
```

## Stop Gracefully

Press `Ctrl+C` once - will save checkpoint and exit cleanly

## Resume After Stop

Just run the same command again:
```bash
./start-tnstc-scraper.sh
```

It will skip completed pairs and continue from where it stopped!

## Files Created

- **`scripts/run_tnstc_parallel.py`** - Parallel runner with checkpoint
- **`start-tnstc-scraper.sh`** - Convenient launcher script  
- **`data/tnstc_cities.txt`** - 25 Tamil Nadu cities
- **`TNSTC_PARALLEL_SCRAPER_GUIDE.md`** - Full documentation

## Adjust Workers

```bash
# Use 10 workers (faster, more CPU/RAM)
WORKERS=10 ./start-tnstc-scraper.sh

# Use 3 workers (slower, less resources)
WORKERS=3 ./start-tnstc-scraper.sh
```

## Output Location

```
data/tnstc_parallel/
├── parallel_checkpoint.json
├── worker_1_CHENNAI_MADURAI.json
├── worker_2_MADURAI_COIMBATORE.json
└── ... (one JSON+CSV per route pair)
```

## 🚀 Ready!

Open a new terminal and run:
```bash
cd /Users/mchand69/Documents/perundhu && ./start-tnstc-scraper.sh
```
