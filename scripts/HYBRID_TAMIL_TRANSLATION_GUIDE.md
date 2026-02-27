# 🌏 HYBRID TAMIL TRANSLATION SETUP GUIDE

## What This Script Does

The `populate_tamil_translations_hybrid.py` script uses a cost-effective hybrid approach:

1. **Fetches locations** from your production database that need Tamil translations
2. **Queries OpenStreetMap** (100% FREE) for Tamil names
3. **Matches locations** using GPS coordinates (within 1km radius)
4. **Falls back to Google Translate** only for locations not found in OSM (~$1-2 cost)
5. **Inserts translations** into your database

---

## Cost Comparison

| Approach | Cost | Coverage |
|----------|------|----------|
| **Google Translate only** | $15-20 | 100% |
| **OSM only** | $0 | ~70-85% |
| **Hybrid (OSM + Google)** | $1-2 | ~95-100% |

**Recommended: Hybrid approach** ✅

---

## Prerequisites

### 1. Ensure Cloud SQL Proxy is Running

```bash
# Check if running
ps aux | grep cloud-sql-proxy | grep -v grep

# If not running, start it:
/opt/homebrew/bin/cloud-sql-proxy \
  perundhu-prod-001:us-central1:perundhu-production-mysql-us \
  --port 3307 \
  --quiet &

# Wait 5 seconds for it to start
sleep 5
```

### 2. (Optional) Install Google Translate (for hybrid mode)

```bash
# Skip this if you want OSM-only (100% FREE)
pip3 install google-cloud-translate --break-system-packages

# Set up Google Cloud credentials
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/credentials.json"
```

**Note:** If you skip Google Translate, the script will use **OSM only** (100% FREE, ~70-85% coverage)

---

## Usage

### Step 1: Test in Dry-Run Mode (Recommended)

```bash
cd /Users/mchand69/Documents/project/perundhu/scripts

# Dry-run to see what would happen (no database changes)
python3 populate_tamil_translations_hybrid.py
```

**Expected output:**
```
🌏 HYBRID TAMIL TRANSLATION POPULATOR
======================================================================

⚠️  DRY RUN MODE - Use --confirm to actually insert data

1. FETCHING LOCATIONS FROM DATABASE
======================================================================
✅ Found 25,000 locations needing Tamil translation

2. FETCHING TAMIL NAMES FROM OPENSTREETMAP (FREE)
======================================================================
🌍 Querying Overpass API for Tamil Nadu locations with Tamil names...
✅ Found 15,000 locations with Tamil names in OSM
✅ Cached 15,000 Tamil translations from OSM

3. MATCHING LOCATIONS WITH TAMIL TRANSLATIONS
======================================================================
✅ Generated 20,000 translations:
   • From OSM (FREE): 15,000
   • From Google Translate (PAID): 5,000
   • Failed: 0

4. INSERTING TRANSLATIONS INTO DATABASE
======================================================================
🔍 DRY RUN MODE - No data will be inserted

   Would insert 20,000 translations:
     • ID 1: சென்னை (OSM)
     • ID 2: கோயம்புத்தூர் (OSM)
     ...

📊 FINAL SUMMARY
======================================================================
Total locations processed: 25,000
New translations:
  • From OSM (FREE): 15,000
  • From Google Translate: 5,000
  • Inserted to DB: 0 (dry-run)

💰 Estimated Cost:
  • OSM queries: $0.00 (FREE)
  • Google Translate: ~$1.50
  • Total: ~$1.50

✅ Coverage: 80.0%
```

### Step 2: Run with OSM Only (100% FREE)

```bash
# Use only OpenStreetMap, skip Google Translate
python3 populate_tamil_translations_hybrid.py --osm-only --confirm
```

This will:
- ✅ Match ~70-85% of locations using OSM (FREE)
- ❌ Skip Google Translate
- 💰 **Total cost: $0**

### Step 3: Run Full Hybrid Mode (~$1-2 cost)

```bash
# Use OSM first, then Google Translate for gaps
python3 populate_tamil_translations_hybrid.py --confirm
```

This will:
- ✅ Match ~70-85% using OSM (FREE)
- ✅ Translate remaining ~15-30% using Google (~$1-2)
- 💰 **Total cost: $1-2**

---

## How It Works

### Matching Algorithm

1. **Exact Coordinate Match** (rounded to 3 decimals)
   - Database: `(13.088, 80.275)`
   - OSM: `(13.088, 80.275)`
   - ✅ Match!

2. **Nearby Match** (within 1km radius)
   - Database: `(13.0881, 80.2752)`
   - OSM: `(13.0879, 80.2748)` - distance = 0.05km
   - ✅ Match!

3. **No Match** → Google Translate (if enabled)
   - "Kilambakkam Bus Stand" → "கீழம்பாக்கம் பேருந்து நிலையம்"

### Sample Translations from OSM

| English Name | Tamil Name (from OSM) |
|--------------|----------------------|
| Chennai | சென்னை |
| Coimbatore | கோயம்புத்தூர் |
| Madurai | மதுரை |
| Tiruchirappalli | திருச்சிராப்பள்ளி |
| Salem | சேலம் |
| Tirunelveli | திருநெல்வேலி |
| Vellore | வேலூர் |
| Nagercoil | நாகர்கோவில் |

---

## Validation After Running

### Check Translation Count

```bash
# Connect to database
mysql -h 127.0.0.1 -P 3307 -u perundhu_user -p RECOVER_YOUR_DATA

# Count Tamil translations
SELECT COUNT(*) as tamil_count 
FROM translations 
WHERE entity_type = 'location' AND language_code = 'ta';

# Expected: 15,000-25,000 (depending on mode)
```

### Test Search API

```bash
# Test Tamil search
curl "http://localhost:8080/api/v1/locations/autocomplete?q=சென்னை&language=ta"

# Expected: Returns Chennai locations with Tamil names
```

---

## Troubleshooting

### Error: "Access denied for user 'perundhu_user'"

**Solution:** Cloud SQL Proxy not running or wrong credentials

```bash
# Restart proxy
pkill cloud-sql-proxy
/opt/homebrew/bin/cloud-sql-proxy \
  perundhu-prod-001:us-central1:perundhu-production-mysql-us \
  --port 3307 &
sleep 5
```

### Error: "Google Translate not installed"

**Solution:** This is OK! Script will use OSM-only mode (100% FREE)

To enable Google Translate:
```bash
pip3 install google-cloud-translate --break-system-packages
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/credentials.json"
```

### Low OSM Match Rate (<50%)

**Possible causes:**
- Database locations have inaccurate coordinates
- Locations are too specific (e.g., "Shop near X" instead of city name)

**Solution:** Google Translate will fill the gaps

---

## Recommendation

**For maximum cost savings:**

1. **First run:** OSM-only mode (FREE)
   ```bash
   python3 populate_tamil_translations_hybrid.py --osm-only --confirm
   ```

2. **Check coverage** in database

3. **If needed:** Run hybrid mode for remaining
   ```bash
   python3 populate_tamil_translations_hybrid.py --confirm
   ```

**Expected result:** 15,000-20,000 Tamil translations for $0-2 total cost! 🎉

---

## Next Steps After Translation

1. ✅ Verify translations in database
2. ✅ Test search API with Tamil queries
3. ✅ Deploy updated backend
4. ✅ Test frontend with Tamil language selected
5. ✅ Celebrate Tamil users can now search! 🎊
