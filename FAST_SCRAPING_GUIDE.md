# Fast Parallel Scraping for Tamil Vandi

## Quick Start (5-10x faster than sequential)

### Step 1: Get Fresh Token (2 minutes)

1. Open Chrome and go to: https://www.tamilvandi.com/timings
2. Open DevTools: Press `F12` or `Cmd+Option+I`
3. Go to **Network** tab
4. Search any route (e.g., "Chennai" to "Madurai")
5. In Network tab, find request: `getSheetDataPaginated.ajax`
6. Click it → **Headers** tab → scroll to **Request Headers**
7. Find `authorization:` and copy the full value (starts with `wixcode-pub.`)

### Step 2: Run Parallel Scraper

```bash
# Export the token
export TOKEN="wixcode-pub.YOUR_TOKEN_HERE"

# Run parallel scraping (5 workers)
python3 scripts/run_parallel_scraper.py \
  --auth-token "$TOKEN" \
  --route-list tamilvandi_all_routes.txt \
  --workers 5 \
  --delay 0.3 \
  --output data/tamilvandi_parallel
```

## Speed Comparison

| Method | Time for 2,256 routes | Speed |
|--------|---------------------|-------|
| **Sequential (browser)** | ~3-4 hours | 1x |
| **Sequential (API only)** | ~1-2 hours | 2-3x |
| **Parallel (5 workers)** | ~20-30 mins | **5-8x** |

## Alternative: Test First

Test with just 10 routes to verify it works:

```bash
# Create test file with 10 routes
head -13 tamilvandi_all_routes.txt > test_routes.txt

# Run test
python3 scripts/run_parallel_scraper.py \
  --auth-token "$TOKEN" \
  --route-list test_routes.txt \
  --workers 3 \
  --delay 0.5 \
  --output data/test_parallel
```

## Files Created

- `data/tamilvandi_parallel.json` - All routes in JSON format
- `data/tamilvandi_parallel.csv` - All routes in CSV format
- `temp_chunks/` - Temporary files (auto-cleaned)

## Troubleshooting

### Token Expired Error
- Tokens expire after ~24 hours
- Get a fresh token using Step 1 above

### Workers Failing
- Reduce workers: `--workers 3`
- Increase delay: `--delay 0.5`

### Check Progress
```bash
# Watch temp files being created
watch -n 5 "ls -lh temp_chunks/*.json 2>/dev/null | wc -l"
```

## What's Happening

1. **Splits routes** into 5 chunks (~450 routes each)
2. **Runs 5 workers** in parallel, each processing one chunk
3. **Merges results** into final JSON/CSV files
4. **Deduplicates** routes across all workers
