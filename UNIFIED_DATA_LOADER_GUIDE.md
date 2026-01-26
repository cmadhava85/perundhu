# 🚀 Unified Data Loader - Complete Guide

**Single Script Solution for All Data Migration Needs**

## Overview

The `unified_data_loader.py` replaces multiple scripts:
- `import_locations.py` → `--mode locations`
- `upload_bus_data.py` → `--mode buses`
- `validate_bus_data.py` → `--mode validate`
- Custom scripts → `--mode full` (combines everything)

**Benefits:**
✅ Single entry point for all data loading  
✅ Multi-environment support (local, preprod, prod)  
✅ Checkpoint/resume capability  
✅ Built-in validation & error recovery  
✅ Unified logging & reporting  

---

## Installation & Setup

### 1. Install Dependencies

```bash
cd /Users/mchand69/Documents/perundhu
pip install mysql-connector-python
```

### 2. Verify Database Configuration

For **local** environment:
```bash
# Default configuration (no setup needed)
# Host: localhost, Port: 3307, User: perundhu_user, Password: perundhu_password
```

For **preprod/prod** environments:
```bash
# Set environment variables
export DB_HOST_PREPROD=preprod-db.example.com
export DB_PORT_PREPROD=3306
export DB_USER_PREPROD=db_user
export DB_PASSWORD_PREPROD=secure_password
export DB_NAME_PREPROD=perundhu

# Or load from config file
export DB_HOST_PROD=prod-db.example.com
# ... etc
```

---

## Quick Start Examples

### 1. Load Locations Only (Local)

```bash
cd /Users/mchand69/Documents/perundhu

# Validate first (recommended)
python3 scripts/unified_data_loader.py \
  --mode validate \
  --data-file data/tamil_nadu_locations_enhanced.json

# Upload
python3 scripts/unified_data_loader.py \
  --mode locations \
  --environment local \
  --data-file data/tamil_nadu_locations_enhanced.json
```

**Output:**
```
✅ Connected to perundhu @ localhost:3307
📂 Loading locations from: data/tamil_nadu_locations_enhanced.json
🚀 Uploading 41116 locations...
✅ Locations upload complete:
   Inserted: 41116
   Skipped:  0
   Errors:   0
```

---

### 2. Load Buses with Stops (Preprod)

```bash
# Validate buses data
python3 scripts/unified_data_loader.py \
  --mode validate \
  --data-file data/mtc_consolidated.json

# Upload to preprod
python3 scripts/unified_data_loader.py \
  --mode buses \
  --environment preprod \
  --data-file data/mtc_consolidated.json \
  --operator MTC

# With verbose logging
python3 scripts/unified_data_loader.py \
  --mode buses \
  --environment preprod \
  --data-file data/mtc_consolidated.json \
  --operator MTC \
  --verbose
```

**Output:**
```
📍 BUSES MODE
Environment: preprod
Operator: MTC

📋 Loading buses from: data/mtc_consolidated.json
📋 Loading location map...
✅ Loaded 41116 location mappings

🚀 Uploading 5000 buses with stops...
✅ Processed 100/5000 buses
✅ Processed 200/5000 buses
...
✅ Buses upload complete:
   Buses inserted:  5000
   Stops inserted:  45230
   Errors:          0
```

---

### 3. Full Migration: Locations + Buses (Production)

```bash
# Step 1: Validate all data
python3 scripts/unified_data_loader.py \
  --mode validate \
  --data-file data/tamil_nadu_locations_enhanced.json

python3 scripts/unified_data_loader.py \
  --mode validate \
  --data-file data/tnstc_consolidated.json

# Step 2: Full migration to production
python3 scripts/unified_data_loader.py \
  --mode full \
  --environment prod \
  --locations data/tamil_nadu_locations_enhanced.json \
  --buses data/tnstc_consolidated.json \
  --operator TNSTC \
  --force-overwrite
```

**Output:**
```
🔄 FULL MODE (Locations + Buses)
Environment: prod

📍 LOCATIONS MODE
📂 Loading locations from: data/tamil_nadu_locations_enhanced.json
🚀 Uploading 41116 locations...
✅ Locations upload complete:
   Inserted: 41116

🚌 BUSES MODE
📂 Loading buses from: data/tnstc_consolidated.json
🚀 Uploading 8500 buses with stops...
✅ Buses upload complete:
   Buses inserted:  8500
   Stops inserted:  76400
```

---

### 4. Dry Run (Validate Without Upload)

```bash
# Test locations without uploading
python3 scripts/unified_data_loader.py \
  --mode locations \
  --environment local \
  --data-file data/tamil_nadu_locations_enhanced.json \
  --dry-run

# Full dry run
python3 scripts/unified_data_loader.py \
  --mode full \
  --environment preprod \
  --locations data/tamil_nadu_locations_enhanced.json \
  --buses data/mtc_consolidated.json \
  --dry-run
```

---

### 5. Resume from Checkpoint

```bash
# If migration was interrupted, resume from checkpoint
python3 scripts/unified_data_loader.py \
  --mode buses \
  --environment preprod \
  --checkpoint data/migration_checkpoint.json

# Or retry with original file
python3 scripts/unified_data_loader.py \
  --mode buses \
  --environment preprod \
  --data-file data/mtc_consolidated.json \
  --batch-size 500
```

---

## Command Reference

### Required Arguments

| Argument | Description | Example |
|----------|-------------|---------|
| `--mode` | Data loading mode | `locations`, `buses`, `full`, `validate` |

### Optional Arguments

| Argument | Description | Default |
|----------|-------------|---------|
| `--environment` | Target environment | `local` |
| `--data-file` | Path to data file | - |
| `--locations` | Locations file (full mode) | - |
| `--buses` | Buses file (full mode) | - |
| `--operator` | Bus operator | - |
| `--checkpoint` | Resume from checkpoint | - |
| `--force-overwrite` | Force overwrite data | `false` |
| `--batch-size` | Records per batch | `1000` |
| `--dry-run` | Validate without upload | `false` |
| `--verbose` | Enable debug logging | `false` |

---

## Mode Reference

### ✅ Locations Mode

```bash
python3 scripts/unified_data_loader.py \
  --mode locations \
  --environment <local|preprod|prod> \
  --data-file <json|csv|jsonl_file>
```

**Features:**
- Supports JSON, CSV, JSONL formats
- Automatic duplicate detection
- Fuzzy matching for location names
- Batch processing (default 1000 records)

**Supported Formats:**

**JSON:**
```json
[
  {
    "name": "Besant Nagar",
    "latitude": 13.0003485,
    "longitude": 80.2657764,
    "district": "Chennai",
    "state": "Tamil Nadu",
    "osm_id": 11906447555,
    "type": "bus_stop"
  }
]
```

**CSV:**
```csv
name,latitude,longitude,district,state,osm_id,type
"Besant Nagar",13.0003485,80.2657764,"Chennai","Tamil Nadu",11906447555,"bus_stop"
```

**JSONL:**
```jsonl
{"name": "Besant Nagar", "latitude": 13.0003485, "longitude": 80.2657764, "district": "Chennai"}
{"name": "Vadapalani", "latitude": 13.0523, "longitude": 80.2319, "district": "Chennai"}
```

---

### 🚌 Buses Mode

```bash
python3 scripts/unified_data_loader.py \
  --mode buses \
  --environment <local|preprod|prod> \
  --data-file <buses_json> \
  --operator <MTC|TNSTC|KRTC|KSRTC|APSRTC>
```

**Features:**
- Automatic location resolution
- Stop sequencing & timing
- Fuzzy location matching
- Transaction support with rollback

**Bus JSON Format:**
```json
[
  {
    "name": "Besant Nagar - Vadapalani",
    "bus_number": "5E",
    "departure_time": "06:00",
    "arrival_time": "06:45",
    "capacity": 50,
    "category": "Regular",
    "stops": [
      {
        "name": "Besant Nagar",
        "arrival_time": null,
        "departure_time": "06:00",
        "stop_order": 0
      },
      {
        "name": "Cathedral Road",
        "arrival_time": "06:15",
        "departure_time": "06:16",
        "stop_order": 1
      },
      {
        "name": "Vadapalani",
        "arrival_time": "06:45",
        "departure_time": null,
        "stop_order": 2
      }
    ]
  }
]
```

---

### 🔍 Validate Mode

```bash
python3 scripts/unified_data_loader.py \
  --mode validate \
  --data-file <data_file>
```

**Checks:**
- ✅ Required fields presence
- ✅ Coordinate validity (-90 to 90 lat, -180 to 180 lon)
- ✅ Data format consistency
- ✅ No duplicate entries
- ✅ Reference integrity

**Output:**
```
📋 Locations: 41116 records
✅ All locations are valid
```

or

```
❌ Found 5 validation errors:
   - Location 123: invalid latitude 95.5
   - Location 456: name is required
   - Location 789: invalid longitude 181.2
```

---

### 🔄 Full Mode

```bash
python3 scripts/unified_data_loader.py \
  --mode full \
  --environment <local|preprod|prod> \
  --locations <locations_file> \
  --buses <buses_file> \
  --operator <bus_operator>
```

**Sequence:**
1. Load & validate locations
2. Upload locations to database
3. Load & validate buses
4. Resolve location IDs for buses
5. Upload buses & stops
6. Report summary

---

## Environment Configuration

### Local Environment

```bash
# No configuration needed - uses defaults
Host: localhost
Port: 3307
User: perundhu_user
Password: perundhu_password
Database: perundhu
```

### Preprod Environment

```bash
# Set environment variables
export DB_HOST_PREPROD=preprod-server.com
export DB_PORT_PREPROD=3306
export DB_USER_PREPROD=preprod_user
export DB_PASSWORD_PREPROD=$(grep DB_PASSWORD_PREPROD ~/.env | cut -d= -f2)
export DB_NAME_PREPROD=perundhu_preprod
export DB_SSL_CA_PREPROD=/path/to/ca-cert.pem
```

### Production Environment

```bash
# Set environment variables (or use GCP Secret Manager)
export DB_HOST_PROD=prod-server.com
export DB_PORT_PROD=3306
export DB_USER_PROD=prod_user
export DB_PASSWORD_PROD=$(grep DB_PASSWORD_PROD ~/.secrets | cut -d= -f2)
export DB_NAME_PROD=perundhu_prod
export DB_SSL_CA_PROD=/path/to/ca-cert.pem

# Alternative: Load from GCP Secret Manager (auto-detected)
export GCP_PROJECT_ID=perundhu-project
# Script will automatically fetch secrets
```

---

## Data Files Location

```
/Users/mchand69/Documents/perundhu/data/
├── tamil_nadu_locations_enhanced.json       # 41,116 locations
├── mtc_consolidated.json                    # MTC buses
├── tnstc_consolidated.json                  # TNSTC buses
└── migration_checkpoint.json                # Resumption checkpoint
```

---

## Logging & Troubleshooting

### Log Files

```bash
# View logs
tail -f logs/unified_data_loader.log

# Full log path
cat logs/unified_data_loader.log

# Last 100 lines
tail -100 logs/unified_data_loader.log
```

### Common Issues & Solutions

#### ❌ "Database connection failed"

```bash
# Check MySQL service
brew services list | grep mysql

# Start MySQL (if not running)
brew services start mysql@8.0

# Test connection
mysql -h localhost -P 3307 -u perundhu_user -p -e "SELECT 1"
```

#### ❌ "Cannot resolve location"

```bash
# Enable verbose logging
python3 scripts/unified_data_loader.py \
  --mode buses \
  --environment local \
  --data-file data/buses.json \
  --verbose
```

#### ❌ "File not found"

```bash
# Verify file path
ls -lah data/tamil_nadu_locations_enhanced.json

# Use absolute path if needed
python3 scripts/unified_data_loader.py \
  --mode locations \
  --environment local \
  --data-file /Users/mchand69/Documents/perundhu/data/tamil_nadu_locations_enhanced.json
```

#### ❌ "Validation errors"

```bash
# Validate first to see all issues
python3 scripts/unified_data_loader.py \
  --mode validate \
  --data-file data/buses.json

# Fix errors in source file, then retry
```

---

## Performance Tuning

### Batch Size Adjustment

```bash
# For slow networks, reduce batch size
python3 scripts/unified_data_loader.py \
  --mode locations \
  --environment prod \
  --data-file data/tamil_nadu_locations_enhanced.json \
  --batch-size 500

# For fast networks, increase batch size
python3 scripts/unified_data_loader.py \
  --mode buses \
  --environment local \
  --data-file data/mtc_consolidated.json \
  --batch-size 2000
```

### Expected Performance

| Operation | Records | Time | Speed |
|-----------|---------|------|-------|
| Locations | 41,116 | ~30s | 1,370 rec/s |
| MTC Buses | 5,000 | ~45s | 111 rec/s |
| TNSTC Buses | 8,500 | ~75s | 113 rec/s |
| Full Migration | 54,616 | ~2.5min | - |

---

## Advanced Usage

### A. Multi-Operator Setup

```bash
# Load MTC buses
python3 scripts/unified_data_loader.py \
  --mode buses \
  --environment prod \
  --data-file data/mtc_consolidated.json \
  --operator MTC

# Load TNSTC buses
python3 scripts/unified_data_loader.py \
  --mode buses \
  --environment prod \
  --data-file data/tnstc_consolidated.json \
  --operator TNSTC

# Verify both loaded
mysql -h prod-server.com -u prod_user -p -e \
  "SELECT operator, COUNT(*) as count FROM buses GROUP BY operator;"
```

### B. Incremental Updates

```bash
# Update only new locations
python3 scripts/unified_data_loader.py \
  --mode locations \
  --environment preprod \
  --data-file data/new_locations_2025.json

# Skip already existing ones (default behavior)
# Or force overwrite with --force-overwrite
python3 scripts/unified_data_loader.py \
  --mode locations \
  --environment preprod \
  --data-file data/all_locations_updated.json \
  --force-overwrite
```

### C. Scheduled Migrations

```bash
#!/bin/bash
# schedule_migration.sh - Run daily at 2 AM

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="logs/migration_${TIMESTAMP}.log"

python3 scripts/unified_data_loader.py \
  --mode full \
  --environment preprod \
  --locations data/tamil_nadu_locations_enhanced.json \
  --buses data/buses_latest.json \
  >> $LOG_FILE 2>&1

# Email results
if [ $? -eq 0 ]; then
  echo "✅ Migration successful" | mail -s "Data Migration Success" admin@example.com
else
  echo "❌ Migration failed" | mail -s "Data Migration Failed" admin@example.com
  cat $LOG_FILE | mail -s "Migration Error Log" admin@example.com
fi
```

---

## Checkpoint & Recovery

### Automatic Checkpointing

The script automatically creates checkpoints:
```
logs/checkpoints/
├── locations_local_20250123_143022.json
├── buses_preprod_20250123_145533.json
└── full_prod_20250123_150145.json
```

### Resume Migration

```bash
# Resume specific checkpoint
python3 scripts/unified_data_loader.py \
  --mode buses \
  --environment preprod \
  --checkpoint logs/checkpoints/buses_preprod_20250123_145533.json

# Check checkpoint status
cat logs/checkpoints/buses_preprod_20250123_145533.json
```

---

## Data Quality Assurance

### Pre-Migration Checklist

- [ ] Validate all data files exist
- [ ] Run `--mode validate` on each file
- [ ] Check disk space (min 1GB)
- [ ] Verify database backup exists
- [ ] Test connection to target environment
- [ ] Review error logs from validation

### Post-Migration Verification

```bash
# Check records were inserted
mysql -h localhost -P 3307 -u perundhu_user -p -e \
  "SELECT 'Locations' as type, COUNT(*) as count FROM locations
   UNION ALL
   SELECT 'Buses', COUNT(*) FROM buses
   UNION ALL
   SELECT 'Stops', COUNT(*) FROM stops;"

# Expected output:
# type       | count
# -----------+-------
# Locations  | 41116
# Buses      | 13500 (MTC + TNSTC combined)
# Stops      | 121600 (approx 9 stops per bus)
```

---

## FAQ

**Q: Can I upload to production directly?**  
A: Yes, but recommended flow: local → preprod → prod with validation at each stage.

**Q: What if location names have typos?**  
A: The script uses fuzzy matching (60% confidence). Enable `--verbose` to see matches.

**Q: How do I handle duplicate locations?**  
A: By default, duplicates are skipped. Use `--force-overwrite` to update.

**Q: Can I stop and resume?**  
A: Yes, checkpoints are automatic. Press Ctrl+C to stop, then use `--checkpoint` to resume.

**Q: What about data migration from old database?**  
A: Export as JSON/CSV and load with this script.

**Q: Do I need to restart the app after uploading?**  
A: No, the app reads from database. Data changes are immediate (after app cache refresh).

---

## Support & Reporting Issues

### Debug Information

```bash
# Collect debug info for troubleshooting
python3 scripts/unified_data_loader.py \
  --mode validate \
  --data-file data/buses.json \
  --verbose 2>&1 | tee debug_output.log
```

### Report Issues

Include:
1. Full command executed
2. Complete error message
3. Last 50 lines of log file
4. Data sample (first 10 records)

---

## Maintenance

### Cleanup Old Logs

```bash
# Keep last 30 days of logs
find logs -name "*.log" -mtime +30 -delete
find logs/checkpoints -name "*.json" -mtime +7 -delete
```

### Database Maintenance

```bash
# Optimize tables after bulk insert
mysql -h localhost -P 3307 -u perundhu_user -p -e \
  "OPTIMIZE TABLE locations, buses, stops;"

# Check for duplicates
mysql -h localhost -P 3307 -u perundhu_user -p -e \
  "SELECT name, COUNT(*) as cnt FROM locations GROUP BY name HAVING cnt > 1 LIMIT 10;"
```

---

**Version:** 1.0  
**Last Updated:** 2026-01-23  
**Maintained By:** Development Team
