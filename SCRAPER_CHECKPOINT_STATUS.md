# Scraper Checkpoint/Resume Status

**Date**: January 13, 2026  
**Status**: ✅ Both scrapers have checkpoint functionality

---

## ✅ MTC Bus Scraper - CHECKPOINT ENABLED

**File**: `scripts/mtc_bus_scraper_selenium.py`

### Checkpoint Features
- ✅ **Automatic checkpoint saving** after each route pair
- ✅ **Resume from interruption** - skips already processed pairs
- ✅ **Checkpoint file**: `{output}.checkpoint.json`
- ✅ **Tracks**: Processed (route, origin, destination) pairs

### How It Works
```python
# Checkpoint is automatically created at:
{output}.checkpoint.json

# Contains:
{
  "processed": [
    ["route_num", "origin_val", "dest_val"],
    ...
  ],
  "timings": [...],
  "saved_at": "timestamp"
}

# On restart: Loads checkpoint and skips processed pairs
```

### Usage
```bash
# First run
python scripts/mtc_bus_scraper_selenium.py --output data/mtc_timings

# If interrupted, just run again - it resumes!
python scripts/mtc_bus_scraper_selenium.py --output data/mtc_timings
# ✅ Skips already processed pairs
```

### Code Location
- **Load checkpoint**: Line 495-508
- **Save checkpoint**: Line 318-333
- **Check if processed**: Line 401 (skips if already done)

---

## ✅ TNSTC Bus Scraper - CHECKPOINT ENABLED

**File**: `scripts/tnstc_bus_scraper_selenium.py`

### Checkpoint Features
- ✅ **Automatic checkpoint saving** after each source-destination pair
- ✅ **Resume from interruption** - skips already processed pairs
- ✅ **Checkpoint file**: `{output}.checkpoint.json`
- ✅ **Tracks**: Processed (source, destination) pairs

### How It Works
```python
# Checkpoint is automatically created at:
{output}.checkpoint.json

# Contains:
{
  "processed": [
    ["SOURCE", "DESTINATION"],
    ...
  ],
  "routes": [...],
  "saved_at": "timestamp"
}

# On restart: Loads checkpoint and skips processed pairs
```

### Usage
```bash
# First run
python scripts/tnstc_bus_scraper_selenium.py \
  --source "CHENNAI" --dest "MADURAI" \
  --output data/tnstc_routes

# If interrupted, just run again - it resumes!
python scripts/tnstc_bus_scraper_selenium.py \
  --source "CHENNAI" --dest "MADURAI" \
  --output data/tnstc_routes
# ✅ Skips CHENNAI→MADURAI (already processed)
```

### Code Location
- **Load checkpoint**: Line 928-942
- **Save checkpoint**: Line 164-179
- **Check if processed**: Line 723 (skips if in processed_pairs)

---

## 📊 Current Checkpoint Files

```bash
# View all checkpoint files
find data -name "*.checkpoint.json"

# Recent checkpoints from TNSTC major cities run:
data/tnstc_major/worker_1_VIRUDUNAGAR_TIRUPPUR.checkpoint.json
data/tnstc_major/worker_2_MADURAI_VILLUPURAM.checkpoint.json
data/tnstc_major/worker_3_TIRUVALLUR_TRICHY.checkpoint.json
... (multiple workers)
```

---

## 🔍 Verification Test

### Test TNSTC Resume
```bash
# Run with 1 route
python scripts/tnstc_bus_scraper_selenium.py \
  --source "CHENNAI" --dest "MADURAI" \
  --limit-routes 1 \
  --output data/test_resume

# Checkpoint created: data/test_resume.checkpoint.json

# Run again - should skip CHENNAI→MADURAI
python scripts/tnstc_bus_scraper_selenium.py \
  --source "CHENNAI" --dest "MADURAI" \
  --limit-routes 1 \
  --output data/test_resume

# Expected output:
# ✅ "Skipping CHENNAI → MADURAI (already processed)"
```

### Test MTC Resume
```bash
# Run MTC scraper
python scripts/mtc_bus_scraper_selenium.py \
  --limit-routes 2 \
  --output data/test_mtc_resume

# Checkpoint created: data/test_mtc_resume.checkpoint.json

# Run again - should skip processed pairs
python scripts/mtc_bus_scraper_selenium.py \
  --limit-routes 2 \
  --output data/test_mtc_resume

# Expected output:
# ✅ "Skipping (already processed in checkpoint)"
```

---

## 🎯 Key Benefits

### No Data Loss
- ✅ If scraper crashes, progress is saved
- ✅ Network failures don't require full restart
- ✅ Can stop anytime with Ctrl+C

### Efficient Reruns
- ✅ Skips already completed work
- ✅ Only processes new/remaining pairs
- ✅ No duplicate data extraction

### Parallel Processing Safe
- ✅ Each worker has separate checkpoint file
- ✅ Workers don't interfere with each other
- ✅ Example: `worker_1_SOURCE_DEST.checkpoint.json`

---

## 📝 Implementation Details

### MTC Checkpoint Structure
```json
{
  "processed": [
    ["12", "ALWARPET", "THIRUVANMYUR"],
    ["12", "ALWARPET", "ASHOK_NAGAR"],
    ...
  ],
  "timings": [
    {
      "route_number": "12",
      "origin_name": "Alwarpet",
      "destination_name": "Thiruvanmyur",
      "timing": "06:00 AM",
      ...
    }
  ],
  "saved_at": "2026-01-13T19:42:41.727775"
}
```

### TNSTC Checkpoint Structure
```json
{
  "processed": [
    ["CHENNAI", "MADURAI"],
    ["MADURAI", "TRICHY"],
    ...
  ],
  "routes": [
    {
      "origin": "CHENNAI",
      "destination": "MADURAI",
      "departure_time": "09:30",
      ...
    }
  ],
  "saved_at": "2026-01-13T19:42:41.727775"
}
```

---

## ✅ Summary

**Status**: Both scrapers are production-ready with checkpoint support

| Feature | MTC | TNSTC |
|---------|-----|-------|
| Checkpoint Saving | ✅ Yes | ✅ Yes |
| Auto-Resume | ✅ Yes | ✅ Yes |
| Skip Processed | ✅ Yes | ✅ Yes |
| No Duplicates | ✅ Yes | ✅ Yes |
| Parallel Safe | ✅ Yes | ✅ Yes |

**Action Required**: None - both scrapers already resume where they left off! 🎉
