# 🚀 MTC Data Upload - Quick Reference

## TL;DR - Get Started in 2 Minutes

### Local Upload
```bash
# 1. One-time setup
chmod +x setup-mtc-upload.sh
./setup-mtc-upload.sh  # Choose option 1 (local)

# 2. Upload data
python scripts/upload_mtc_data.py --environment local

# Check logs
tail -f logs/mtc_upload.log
```

### Preprod Upload
```bash
# 1. Setup with credentials
./setup-mtc-upload.sh  # Choose option 2 (preprod)
# Edit .env.preprod with your credentials

# 2. Upload
source .env.preprod
python scripts/upload_mtc_data.py --environment preprod
```

### Production Upload (GCP)
```bash
# 1. Setup GCP
./setup-mtc-upload.sh  # Choose option 3 (prod)
# Follow GCP authentication steps

# 2. Upload
python scripts/upload_mtc_data.py --environment prod
```

---

## Features at a Glance

| Feature | Status | Details |
|---------|--------|---------|
| Multi-environment | ✅ | local, preprod, prod |
| GCP Secret Manager | ✅ | Production secrets only |
| Fuzzy location matching | ✅ | 80% similarity threshold |
| Transaction safety | ✅ | Auto-rollback on errors |
| Logging | ✅ | `logs/mtc_upload.log` |
| CLI arguments | ✅ | `--environment`, `--verbose` |

---

## Commands Reference

### Upload Script
```bash
# Basic (local)
python scripts/upload_mtc_data.py

# With environment selection
python scripts/upload_mtc_data.py --environment local
python scripts/upload_mtc_data.py --environment preprod
python scripts/upload_mtc_data.py --environment prod

# Verbose logging
python scripts/upload_mtc_data.py --environment local --verbose

# Help
python scripts/upload_mtc_data.py --help
```

### Setup Script
```bash
chmod +x setup-mtc-upload.sh
./setup-mtc-upload.sh

# Follow interactive prompts
```

### Check Data
```bash
# Verify checkpoint data
wc -l data/mtc_bus_timings.checkpoint.json

# Sample data
head -100 data/mtc_bus_timings.checkpoint.json | python -m json.tool

# Database checks
mysql -u perundhu_user -pperundhu_password -D perundhu << EOF
SELECT COUNT(*) as locations FROM locations;
SELECT COUNT(*) as buses FROM buses;
SELECT COUNT(*) as stops FROM stops;
EOF
```

---

## Environment Variables

### Local
```bash
# Auto-detected from: backend/app/src/main/resources/application-mysql-local.properties
# No setup needed
```

### Preprod
```bash
export PREPROD_DB_HOST=your-db-host
export PREPROD_DB_PORT=3306
export PREPROD_DB_USER=your-user
export PREPROD_DB_PASSWORD=your-password
```

### Production
```bash
export GCP_PROJECT_ID=perundhu-project
# Secrets: production-db-url, production-db-username, production-db-password
```

---

## Data Flow

```
data/mtc_bus_timings.checkpoint.json
    ↓
[Load timings] → route_number, origin_value, destination_value, timing
    ↓
[Get/Create locations] → origin_value, destination_value
    ↓ (80% fuzzy match)
locations table (id, name, lat, lng)
    ↓
[Create buses] → route_number, from_location_id, to_location_id
    ↓
buses table (id, bus_number, from_location_id, to_location_id)
    ↓
✓ COMPLETE
```

---

## Expected Output

### Successful Upload
```
2026-01-13 13:30:45 - INFO - Loading configuration for environment: local
2026-01-13 13:30:45 - INFO - Connecting to local database at localhost:3306
2026-01-13 13:30:45 - INFO - ✓ Database connection successful
2026-01-13 13:30:46 - INFO - Loaded 5332 timings from checkpoint
2026-01-13 13:30:46 - INFO - Starting upload of 5332 timing records
...
2026-01-13 13:32:15 - INFO - ✓ Timing data upload complete

============================================================
UPLOAD STATISTICS
============================================================
Locations created: 512
Locations skipped (duplicates): 1250
Buses created: 666
Stops created: 0
Connecting routes created: 0
Errors: 0
============================================================
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "Can't connect to MySQL server" | Check MySQL is running: `mysql.server start` |
| "Unknown database 'perundhu'" | Run setup script: `./setup-mtc-upload.sh` |
| "Failed to retrieve secret" | Check GCP auth: `gcloud auth list` |
| "Module 'mysql.connector' not found" | Install: `pip install mysql-connector-python` |
| "Permission denied: scripts/" | Make executable: `chmod +x setup-mtc-upload.sh` |

---

## Logs

```bash
# Real-time monitoring
tail -f logs/mtc_upload.log

# View last 50 lines
tail -50 logs/mtc_upload.log

# Search for errors
grep ERROR logs/mtc_upload.log

# Count created locations
grep "Created new location" logs/mtc_upload.log | wc -l

# Show upload summary
grep "UPLOAD STATISTICS" -A 20 logs/mtc_upload.log
```

---

## Example Workflows

### Scenario 1: Local Testing
```bash
# 1. Start MySQL
mysql.server start

# 2. Create database
mysql -u root -e "CREATE DATABASE IF NOT EXISTS perundhu;"

# 3. Run setup
./setup-mtc-upload.sh  # Choose 1

# 4. Upload
python scripts/upload_mtc_data.py --environment local --verbose

# 5. Verify
mysql -u perundhu_user -pperundhu_password perundhu -e "SELECT COUNT(*) FROM locations;"
```

### Scenario 2: Preprod Validation
```bash
# 1. Setup preprod
./setup-mtc-upload.sh  # Choose 2
# Edit .env.preprod with preprod credentials

# 2. Upload to preprod
source .env.preprod
python scripts/upload_mtc_data.py --environment preprod --verbose

# 3. Verify preprod database
mysql -h $PREPROD_DB_HOST -u $PREPROD_DB_USER -p$PREPROD_DB_PASSWORD -e "SELECT COUNT(*) FROM locations;"

# 4. If successful, proceed to production
```

### Scenario 3: Production Deployment
```bash
# 1. Authenticate with GCP
gcloud auth application-default login

# 2. Setup production
./setup-mtc-upload.sh  # Choose 3
# Follow GCP prompts

# 3. Backup production database (CRITICAL!)
gcloud sql backups create prod-backup-$(date +%Y%m%d_%H%M%S) \
  --instance=prod-db-instance

# 4. Upload to production
python scripts/upload_mtc_data.py --environment prod --verbose

# 5. Verify production
# Access Cloud Console → Cloud SQL → Query results
```

---

## Files Created

```
scripts/
  ├── upload_mtc_data.py          # Main upload script
  ├── mtc_bus_scraper_selenium.py # (existing) Scraper
  └── ...

logs/
  └── mtc_upload.log              # Upload logs

data/
  └── mtc_bus_timings.checkpoint.json  # (existing) Scraped data

setup-mtc-upload.sh               # Setup helper
MTC_DATA_UPLOAD_GUIDE.md          # Full documentation
MTC_DATA_UPLOAD_QUICK_REFERENCE.md # This file
```

---

## Next Steps

1. **Test locally first**
   ```bash
   python scripts/upload_mtc_data.py --environment local
   ```

2. **Verify data quality**
   ```bash
   # Check for duplicates, errors in logs
   grep "ERROR\|WARNING" logs/mtc_upload.log
   ```

3. **Then move to preprod**
   ```bash
   python scripts/upload_mtc_data.py --environment preprod
   ```

4. **Finally deploy to production**
   ```bash
   python scripts/upload_mtc_data.py --environment prod
   ```

---

## Support

- 📖 Full guide: `MTC_DATA_UPLOAD_GUIDE.md`
- 🐛 Issues: Check `logs/mtc_upload.log`
- 💻 Debug: Run with `--verbose` flag
- 🆘 Help: Review troubleshooting section above
