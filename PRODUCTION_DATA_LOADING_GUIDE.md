# 🗄️ PRODUCTION DATA LOADING & SEED DATA GUIDE
**Date**: January 23, 2026  
**For**: Perundhu Production Deployment  
**Domain**: perundhu.com  

---

## 📋 TABLE OF CONTENTS

1. [Overview](#overview)
2. [Pre-Loading Preparation](#pre-loading-preparation)
3. [Data Sources & Files](#data-sources--files)
4. [Unified Data Loader Setup](#unified-data-loader-setup)
5. [Loading Procedures](#loading-procedures)
6. [Data Validation](#data-validation)
7. [Verification & Rollback](#verification--rollback)
8. [Post-Loading Monitoring](#post-loading-monitoring)
9. [Troubleshooting](#troubleshooting)

---

## 🎯 OVERVIEW

### Purpose
This guide covers loading initial seed data (locations, bus routes, schedules) into production database after schema migrations are complete but before services go live.

### What Gets Loaded
- **Locations**: Tamil Nadu cities, towns, bus stations (500+ locations)
- **Buses**: Routes from TNSTC, MTC, and other operators
- **Stops**: Bus stops per route with arrival/departure times
- **Schedules**: Bus schedules and frequency information

### Timeline
**Phase 2.5** in deployment sequence:
1. ✅ Phase 0-2: Pre-deployment, Infrastructure, Database schema migrations
2. 👉 **Phase 2.5: Data Loading** ← You are here
3. ⏳ Phase 3: Build Docker images
4. ⏳ Phase 4: Deploy to Cloud Run

### Expected Duration
**Total**: 30-60 minutes
- Setup & validation: 10-15 min
- Location loading: 5-10 min
- Bus loading: 10-20 min
- Verification: 5-10 min

---

## 🔧 PRE-LOADING PREPARATION

### Prerequisites

#### 1️⃣ Database Must Be Ready
```bash
# Verify database and all migrations are complete
gcloud sql connect perundhu-prod-mysql \
  --user=prod_user \
  --database=perundhu \
  --quiet

# In Cloud Shell (after connecting):
SHOW TABLES;  -- Should show 8+ tables
SELECT COUNT(*) FROM locations;  -- Should be empty (0)
SELECT COUNT(*) FROM buses;      -- Should be empty (0)
```

**Expected Output**:
```
Tables in perundhu database:
+---------------------------+
| Tables_in_perundhu        |
+---------------------------+
| users                     |
| locations                 |
| buses                     |
| stops                      |
| routes                    |
| schedules                 |
| bookings                  |
| analytics                 |
+---------------------------+
8 rows in set
```

#### 2️⃣ Data Files Ready
```bash
# Check all data files exist
cd /Users/mchand69/Documents/perundhu

ls -lh data/*.json | grep -E 'locations|consolidated'
# Expected:
# -rw-r--r--  tamil_nadu_locations_enhanced.json       ~2MB
# -rw-r--r--  tnstc_consolidated.json                  ~5MB
# -rw-r--r--  mtc_consolidated.json                    ~4MB
```

#### 3️⃣ Python Environment Ready
```bash
# Activate Python environment
cd /Users/mchand69/Documents/perundhu
source .venv/bin/activate

# Verify mysql.connector is installed
python3 -c "import mysql.connector; print('✅ mysql-connector ready')"

# If missing, install:
pip install mysql-connector-python
```

#### 4️⃣ Environment Variables Set (for production)
```bash
# For production database connection
export DB_HOST_PROD="10.0.0.5"  # Private IP of Cloud SQL
export DB_PORT_PROD="3306"
export DB_USER_PROD="prod_user"
export DB_PASSWORD_PROD="<secure-password>"
export DB_NAME_PROD="perundhu"
export DB_SSL_CA_PROD="/path/to/server-ca.pem"  # If required
```

**Or for local testing**:
```bash
export DB_HOST_LOCAL="localhost"
export DB_PORT_LOCAL="3307"
export DB_USER_LOCAL="perundhu_user"
export DB_PASSWORD_LOCAL="perundhu_password"
export DB_NAME_LOCAL="perundhu"
```

#### 5️⃣ Backup Pre-Loading Database
```bash
# Create backup BEFORE loading data
gcloud sql backups create \
  --instance=perundhu-prod-mysql \
  pre-data-load-backup

# Verify backup started
gcloud sql backups describe <BACKUP_ID> \
  --instance=perundhu-prod-mysql
```

---

## 📂 DATA SOURCES & FILES

### File Structure
```
/Users/mchand69/Documents/perundhu/
├── data/
│   ├── tamil_nadu_locations_enhanced.json      (Locations seed data)
│   ├── tnstc_consolidated.json                 (TNSTC routes & buses)
│   ├── mtc_consolidated.json                   (MTC routes & buses)
│   └── ...other operator data
├── scripts/
│   ├── unified_data_loader.py                  ⭐ Main loader
│   ├── upload_tnstc_consolidated.py            (TNSTC wrapper)
│   ├── upload_mtc_data.py                      (MTC wrapper)
│   └── validate-locations-upload.py            (Validation)
└── logs/
    └── unified_data_loader.log                 (Loading logs)
```

### Data Format

#### Locations JSON Format
```json
[
  {
    "name": "Chennai Central",
    "latitude": 13.0827,
    "longitude": 80.2798,
    "district": "Chennai",
    "state": "Tamil Nadu",
    "type": "Bus Station",
    "osm_id": 123456,
    "priority": 1
  },
  {
    "name": "Bangalore International Airport",
    "latitude": 13.1939,
    "longitude": 77.7064,
    "district": "Bangalore",
    "state": "Karnataka",
    "type": "Airport",
    "priority": 2
  }
]
```

#### Buses JSON Format (Consolidated)
```json
{
  "routes": [
    {
      "name": "Chennai - Bangalore Express",
      "bus_number": "TN-001-ABC",
      "from_location_id": 1,
      "to_location_id": 2,
      "departure_time": "14:00",
      "arrival_time": "20:00",
      "capacity": 50,
      "category": "AC",
      "stops": [
        {
          "location": "Chennai Central",
          "arrival_time": "14:00",
          "departure_time": "14:15",
          "stop_order": 0
        },
        {
          "location": "Koyambedu",
          "arrival_time": "14:45",
          "departure_time": "15:00",
          "stop_order": 1
        }
      ]
    }
  ]
}
```

### Data File Sizes & Counts

| File | Size | Locations | Buses | Stops |
|------|------|-----------|-------|-------|
| tamil_nadu_locations_enhanced.json | ~2 MB | 500+ | - | - |
| tnstc_consolidated.json | ~5 MB | - | 1000+ | 5000+ |
| mtc_consolidated.json | ~4 MB | - | 800+ | 4000+ |
| **Total** | ~11 MB | 500+ | 1800+ | 9000+ |

---

## ⚙️ UNIFIED DATA LOADER SETUP

### What Is It?
A production-ready Python script (`unified_data_loader.py`) that:
- ✅ Loads locations from JSON/CSV/JSONL files
- ✅ Loads buses with stops maintaining relationships
- ✅ Validates data before uploading
- ✅ Supports multiple environments (local, preprod, prod)
- ✅ Provides checkpoint/resume capability
- ✅ Prevents duplicate entries
- ✅ Logs all operations with detailed reporting

### Features

#### Mode: Locations
Loads location data with deduplication
```
Input: Locations JSON file
Process: Validate → Deduplicate → Insert
Output: Location records in database
```

#### Mode: Buses
Loads buses with stops and location references
```
Input: Buses JSON file
Process: Load locations → Validate → Insert buses → Insert stops
Output: Bus records with stop relationships
```

#### Mode: Full
Loads locations and buses in coordinated sequence
```
Input: Locations file + Buses file
Process: Locations → Buses
Output: Complete data set
```

#### Mode: Validate
Validates data without uploading
```
Input: JSON file
Process: Check syntax → Validate required fields → Check constraints
Output: Validation report with errors
```

### Script Location
```
/Users/mchand69/Documents/perundhu/scripts/unified_data_loader.py
```

### Required Modules
```bash
# Already installed in .venv:
- mysql.connector
- json
- csv
- logging
- pathlib
- dataclasses
```

---

## 🚀 LOADING PROCEDURES

### Step 1: Validate Test (Local Environment)

**Purpose**: Test script works before production run

```bash
# Navigate to project directory
cd /Users/mchand69/Documents/perundhu

# Activate environment
source .venv/bin/activate

# Run validation on locations
python3 scripts/unified_data_loader.py \
  --mode validate \
  --environment local \
  --data-file data/tamil_nadu_locations_enhanced.json

# Expected output:
# 🔍 VALIDATION MODE
# ============================================================
# 📋 Locations: 500 records
# ✅ All locations are valid
```

### Step 2: Test Load to Local Database

**Purpose**: Dry run on local database before production

```bash
# Make sure local MySQL is running
# Connection: localhost:3307, user: perundhu_user

# Load locations to local database
python3 scripts/unified_data_loader.py \
  --mode locations \
  --environment local \
  --data-file data/tamil_nadu_locations_enhanced.json

# Expected output:
# 📍 LOCATIONS MODE
# ============================================================
# Environment: local
# 📂 Loading locations from: data/tamil_nadu_locations_enhanced.json
# ✅ Loaded 500 locations
# 🚀 Uploading 500 locations...
# ✅ Processed 500/500 locations
# ✅ Locations upload complete:
#    Inserted: 480
#    Skipped:  20
#    Errors:   0
```

### Step 3: Verify Local Load

```bash
# Connect to local database
mysql -h localhost -P 3307 -u perundhu_user -p perundhu

# Check locations
SELECT COUNT(*) as total_locations FROM locations;
SELECT COUNT(DISTINCT district) as districts FROM locations;
SELECT * FROM locations LIMIT 3\G

# Expected output:
# total_locations: 500
# districts: 27
```

### Step 4: Production Load - Phase 2.5

**⚠️ PRODUCTION LOAD - Follow exactly**

#### Prerequisite Verification
```bash
# 1. Verify migrations complete on production
gcloud sql connect perundhu-prod-mysql \
  --user=prod_user \
  --database=perundhu \
  --quiet

# In Cloud Shell:
SELECT COUNT(*) FROM locations;  -- Should be 0
SELECT COUNT(*) FROM buses;      -- Should be 0
\q  -- Quit
```

#### Baseline Backup (CRITICAL)
```bash
# Create backup with timestamp
BACKUP_NAME="pre-data-load-$(date +%Y%m%d-%H%M%S)"
gcloud sql backups create \
  --instance=perundhu-prod-mysql \
  --description="Before seed data loading" \
  $BACKUP_NAME

# Verify it started
gcloud sql backups list --instance=perundhu-prod-mysql

# Expected output:
# NAME                           STATUS     WINDOW_START
# pre-data-load-20260123-143000  SUCCESSFUL 2026-01-23T14:30:00Z
```

#### Set Production Environment Variables
```bash
# Get from Cloud Secret Manager
gcloud secrets versions access latest --secret=prod-db-host
  → Copy the host (e.g., 10.0.0.5)

# Set environment variables
export DB_HOST_PROD="10.0.0.5"
export DB_PORT_PROD="3306"
export DB_USER_PROD="prod_user"
# Get from Secret Manager:
export DB_PASSWORD_PROD=$(gcloud secrets versions access latest --secret=prod-db-password)
export DB_NAME_PROD="perundhu"

# Verify connection from VM/Cloud Shell
gcloud sql connect perundhu-prod-mysql --user=prod_user
```

#### Load Locations (Production)
```bash
# Activate Python environment
cd /Users/mchand69/Documents/perundhu
source .venv/bin/activate

# LOAD LOCATIONS FIRST
python3 scripts/unified_data_loader.py \
  --mode locations \
  --environment prod \
  --data-file data/tamil_nadu_locations_enhanced.json

# Expected output:
# 📍 LOCATIONS MODE
# ============================================================
# Environment: prod
# 📂 Loading locations from: data/tamil_nadu_locations_enhanced.json
# ✅ Loaded 500 locations
# 🚀 Uploading 500 locations...
# ✅ Processed 500/500 locations
# ✅ Locations upload complete:
#    Inserted: 500
#    Skipped:  0
#    Errors:   0
```

**Time**: ~5-10 minutes

#### Load TNSTC Buses (Production)
```bash
# LOAD TNSTC BUSES
python3 scripts/unified_data_loader.py \
  --mode buses \
  --environment prod \
  --data-file data/tnstc_consolidated.json \
  --operator TNSTC

# Expected output:
# 🚌 BUSES MODE
# ============================================================
# Environment: prod
# Operator: TNSTC
# 📂 Loading buses from: data/tnstc_consolidated.json
# ✅ Loaded 1000 buses
# 📋 Loading location map...
# ✅ Loaded 500 location mappings
# 🚀 Uploading 1000 buses with stops...
# ✅ Processed 100/1000 buses
# ✅ Processed 200/1000 buses
# ... (progress continues)
# ✅ Buses upload complete:
#    Buses inserted:  1000
#    Stops inserted:  5000
#    Errors:          0
```

**Time**: ~10-20 minutes

#### Load MTC Buses (Production) - Optional
```bash
# If you want MTC data as well
python3 scripts/unified_data_loader.py \
  --mode buses \
  --environment prod \
  --data-file data/mtc_consolidated.json \
  --operator MTC

# Expected output: Similar to TNSTC above
```

**Time**: ~10-15 minutes

#### Alternative: Full Mode (All at Once)
```bash
# Load locations and buses together
python3 scripts/unified_data_loader.py \
  --mode full \
  --environment prod \
  --locations data/tamil_nadu_locations_enhanced.json \
  --buses data/tnstc_consolidated.json \
  --operator TNSTC

# Expected output:
# 🔄 FULL MODE (Locations + Buses)
# ============================================================
# Environment: prod
# 📍 Loading locations...
# ✅ Locations upload complete: 500 inserted, 0 skipped, 0 errors
# 🚌 Loading buses...
# ✅ Buses upload complete: 1000 buses inserted, 5000 stops
```

---

## ✅ DATA VALIDATION

### Validation Before Upload

#### Check Data File Format
```bash
# Validate locations file format
python3 scripts/unified_data_loader.py \
  --mode validate \
  --environment prod \
  --data-file data/tamil_nadu_locations_enhanced.json

# Expected output:
# 🔍 VALIDATION MODE
# ============================================================
# 📋 Locations: 500 records
# ✅ All locations are valid
```

#### Check Data File Format (Buses)
```bash
# Validate buses file format
python3 scripts/unified_data_loader.py \
  --mode validate \
  --environment prod \
  --data-file data/tnstc_consolidated.json

# Expected output:
# 🔍 VALIDATION MODE
# ============================================================
# 📋 Buses: 1000 records
# ✅ All buses are valid
```

### Validation After Upload

#### Count Verification
```bash
# Connect to production database
gcloud sql connect perundhu-prod-mysql \
  --user=prod_user \
  --database=perundhu \
  --quiet

# Check counts
SELECT 'Locations' as entity, COUNT(*) as count FROM locations
UNION ALL
SELECT 'Buses', COUNT(*) FROM buses
UNION ALL
SELECT 'Stops', COUNT(*) FROM stops;

# Expected output:
# +--------+-------+
# | entity | count |
# +--------+-------+
# | Locations | 500 |
# | Buses | 1000 |
# | Stops | 5000 |
# +--------+-------+
```

#### Data Integrity Check
```sql
-- Check for invalid coordinates
SELECT COUNT(*) FROM locations 
WHERE latitude NOT BETWEEN -90 AND 90 
OR longitude NOT BETWEEN -180 AND 180;
-- Expected: 0 rows

-- Check for null required fields
SELECT COUNT(*) FROM locations WHERE name IS NULL;
-- Expected: 0 rows

SELECT COUNT(*) FROM buses WHERE bus_number IS NULL;
-- Expected: 0 rows

-- Check for orphaned stops (stops without buses)
SELECT COUNT(*) FROM stops 
WHERE bus_id NOT IN (SELECT id FROM buses);
-- Expected: 0 rows

-- Check for orphaned buses (no from_location)
SELECT COUNT(*) FROM buses WHERE from_location_id IS NULL;
-- Expected: 0 rows (or acceptable number)
```

#### Sample Data Spot Check
```sql
-- View sample locations with different types
SELECT name, latitude, longitude, district, type FROM locations 
WHERE type IS NOT NULL 
LIMIT 5;

-- View sample bus routes
SELECT name, bus_number, category, capacity FROM buses LIMIT 5;

-- View sample bus stops for first bus
SELECT * FROM stops 
WHERE bus_id = 1 
ORDER BY stop_order;
```

---

## 🔄 VERIFICATION & ROLLBACK

### Verification Checklist

#### Post-Load Verification (30 minutes after load)
```bash
# 1. Check database connectivity
gcloud sql connect perundhu-prod-mysql --user=prod_user
SELECT 1;  -- Simple query
-- Expected: Returns 1 connection OK

# 2. Check table sizes
SELECT 
  TABLE_NAME, 
  TABLE_ROWS, 
  ROUND((DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024, 2) as size_mb
FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = 'perundhu'
ORDER BY TABLE_ROWS DESC;

# 3. Check for errors in application logs
gcloud logging read "resource.type=cloudsql_database AND severity=ERROR" \
  --limit 50 --project perundhu-production-2026

# 4. Verify no duplicate locations
SELECT COUNT(*), name, district FROM locations 
GROUP BY name, district 
HAVING COUNT(*) > 1;
-- Expected: 0 rows (no duplicates)

\q
```

### Rollback Procedure (If Data Issues Found)

#### Option 1: Partial Rollback (Remove Recent Data)
```bash
# If only specific operator data has issues:
# Remove TNSTC buses and stops
mysql -h <host> -u prod_user -p perundhu

DELETE FROM stops 
WHERE bus_id IN (
  SELECT id FROM buses WHERE category = 'TNSTC'
);

DELETE FROM buses WHERE category = 'TNSTC';

COMMIT;

-- Verify
SELECT COUNT(*) FROM buses;
-- Should show reduced count

\q
```

#### Option 2: Full Rollback (Restore from Backup)
```bash
# If data corruption detected:

# List available backups
gcloud sql backups list --instance=perundhu-prod-mysql

# Find "pre-data-load" backup - note the ID
# Example: pre-data-load-20260123-143000

# Restore from backup
gcloud sql backups restore <BACKUP_ID> \
  --backup-instance=perundhu-prod-mysql

# This will:
# 1. Stop the instance (brief downtime ~30 seconds)
# 2. Restore database to backup point
# 3. Restart the instance

# Monitor restoration progress
gcloud sql operations list --instance=perundhu-prod-mysql

# Verify restoration complete
gcloud sql connect perundhu-prod-mysql --user=prod_user

SELECT COUNT(*) FROM locations;  -- Should be 0 (before data load)
SELECT COUNT(*) FROM buses;      -- Should be 0
\q
```

**Estimated Time**: 10-15 minutes

---

## 👁️ POST-LOADING MONITORING

### Real-Time Monitoring (First 24 hours)

#### Monitor Data Activity
```bash
# Check for new data transactions
gcloud logging read "resource.type=cloudsql_database" \
  --limit 100 \
  --project perundhu-production-2026 \
  --format="table(timestamp,jsonPayload.query_time_ms,jsonPayload.rows_affected)"
```

#### Monitor Query Performance
```bash
# Check slow queries after data load
gcloud logging read "severity=WARNING AND 'slow query'" \
  --limit 50 \
  --project perundhu-production-2026
```

#### Monitor Disk Usage
```bash
# Check database size after data load
gcloud sql instances describe perundhu-prod-mysql \
  --project perundhu-production-2026 \
  --format="value(currentDiskSize,maxDiskSize)"

# Expected:
# Current: ~500MB (after ~1000 buses with 5000 stops)
# Max: 500GB (Cloud SQL auto-grow setting)
```

### Metrics to Track

| Metric | Expected | Alert If |
|--------|----------|----------|
| Disk Used | ~500 MB | > 100 GB |
| Query Latency (p95) | < 100 ms | > 500 ms |
| Errors/min | 0 | > 0 |
| Connections | 3-5 | > 20 active |
| Replication Lag | < 100 ms | > 1 sec |

### Daily Check (Post-Load Week 1)

```bash
# Day 1, 2, 3, ... after loading

# 1. Table row counts
gcloud sql connect perundhu-prod-mysql --user=prod_user

SELECT 
  'locations' as table_name, COUNT(*) as rows FROM locations
UNION ALL
SELECT 'buses', COUNT(*) FROM buses
UNION ALL
SELECT 'stops', COUNT(*) FROM stops
UNION ALL
SELECT 'users', COUNT(*) FROM users
UNION ALL
SELECT 'bookings', COUNT(*) FROM bookings;

# Expected:
# locations: 500
# buses: 1000+
# stops: 5000+
# users: Fresh production (may be 0)
# bookings: 0 (production just started)

# 2. No error entries
SELECT COUNT(*) FROM system_log WHERE level = 'ERROR';
-- Expected: 0

\q

# 3. Application API check
curl -s https://api.perundhu.com/locations \
  -H "Authorization: Bearer $JWT_TOKEN" | jq '.data | length'
-- Expected: 500

curl -s https://api.perundhu.com/buses/search?from=1&to=2 \
  -H "Authorization: Bearer $JWT_TOKEN" | jq '.data | length'
-- Expected: >= 1 (showing available buses)
```

---

## 🔧 TROUBLESHOOTING

### Issue 1: MySQL Connector Import Error
```
❌ ERROR: mysql.connector module not found
```

**Solution**:
```bash
# Install mysql-connector-python
source .venv/bin/activate
pip install mysql-connector-python

# Verify installation
python3 -c "import mysql.connector; print('✅ Ready')"
```

### Issue 2: Database Connection Failed
```
❌ Database connection failed: Cannot connect to production database
```

**Causes & Solutions**:

**A. Wrong credentials**
```bash
# Verify environment variables
echo $DB_HOST_PROD
echo $DB_PORT_PROD
echo $DB_USER_PROD
# Should show correct values, not empty

# Test connection manually
gcloud sql connect perundhu-prod-mysql --user=prod_user
```

**B. Network connectivity issue**
```bash
# Check if Cloud SQL instance is running
gcloud sql instances describe perundhu-prod-mysql \
  --project perundhu-production-2026 \
  --format="value(state)"
# Should show: RUNNABLE

# Check VPC connectivity (if in same network)
gcloud compute ssh <vm-name> --zone=asia-south1-a
ping 10.0.0.5  # Cloud SQL private IP
```

**C. Cloud SQL Proxy needed (if connecting from outside VPC)**
```bash
# Download and start Cloud SQL Proxy
./cloud_sql_proxy -instances=perundhu-production-2026:asia-south1:perundhu-prod-mysql=tcp:3306 &

# Then connect via localhost
export DB_HOST_PROD="localhost"
export DB_PORT_PROD="3306"
```

### Issue 3: Duplicate Location/Bus Cannot Insert
```
❌ ERROR: Duplicate entry 'Chennai Central' for key 'locations.name_district'
```

**Solution**:
```bash
# The script has duplicate prevention built-in
# Locations already in DB are skipped (expected)

# If you need to replace records:
python3 scripts/unified_data_loader.py \
  --mode locations \
  --environment prod \
  --data-file data/tamil_nadu_locations_enhanced.json \
  --force-overwrite  # Use this flag

# Or manually clear first:
mysql -u prod_user -p perundhu
TRUNCATE TABLE stops;
TRUNCATE TABLE buses;
TRUNCATE TABLE locations;
\q

# Then reload
```

### Issue 4: Load Takes Too Long / Times Out
```
⚠️ Load process takes > 1 hour or connection times out
```

**Solution**:
```bash
# Use checkpoint/resume capability
# Script saves progress every batch

# If interrupted, resume:
python3 scripts/unified_data_loader.py \
  --mode buses \
  --environment prod \
  --checkpoint data/migration_checkpoint.json

# Or retry with smaller batch size:
python3 scripts/unified_data_loader.py \
  --mode buses \
  --environment prod \
  --data-file data/tnstc_consolidated.json \
  --batch-size 100  # Smaller batches
```

### Issue 5: Validation Shows Errors
```
❌ Found 10 validation errors:
   - Location 1: invalid latitude 95.5 (out of range)
   - Location 3: name is required
```

**Solution**:
```bash
# Check data file for issues
# Edit data file to fix invalid values
# Common issues:
# - Coordinates out of valid range (-90 to 90 latitude, -180 to 180 longitude)
# - Missing required fields (name, latitude, longitude)
# - Invalid data types

# After fixing:
python3 scripts/unified_data_loader.py \
  --mode validate \
  --environment prod \
  --data-file data/tamil_nadu_locations_enhanced.json

# Should show: ✅ All locations are valid
```

### Issue 6: Database Performance Degraded After Load
```
⚠️ API responses slow (> 1 second) after data loading
```

**Solution**:
```sql
-- 1. Check query performance
EXPLAIN SELECT * FROM locations WHERE district = 'Chennai';
EXPLAIN SELECT * FROM buses WHERE from_location_id = 1;

-- 2. Add missing indexes if needed
CREATE INDEX idx_locations_district ON locations(district);
CREATE INDEX idx_buses_from_location ON buses(from_location_id);
CREATE INDEX idx_stops_bus_id ON stops(bus_id);

-- 3. Analyze tables for statistics
ANALYZE TABLE locations;
ANALYZE TABLE buses;
ANALYZE TABLE stops;

-- 4. Check if autovacuum is running
-- CloudSQL handles this automatically, but verify in monitoring
```

### Issue 7: Out of Disk Space
```
❌ ERROR: The table 'perundhu/buses' is full; can't write data
```

**Solution**:
```bash
# Check current disk usage
gcloud sql instances describe perundhu-prod-mysql \
  --format="value(currentDiskSize,maxDiskSize)"

# If near limit, increase
gcloud sql instances patch perundhu-prod-mysql \
  --database-flags=max_allowed_packet=1024M

# Or scale up instance
gcloud sql instances patch perundhu-prod-mysql \
  --tier=db-n1-standard-2  # Larger machine

# Monitor:
gcloud monitoring time-series list \
  --filter="resource.database_id=perundhu-prod-mysql AND metric.type=cloudsql.googleapis.com/database/disk/utilization"
```

---

## 📊 SUCCESS CRITERIA

### Post-Load Verification Checklist

- [ ] **Locations Loaded**: 500 locations in database (verified via SELECT COUNT)
- [ ] **Buses Loaded**: 1000+ buses in database (verified via SELECT COUNT)
- [ ] **Stops Loaded**: 5000+ stops in database (verified via SELECT COUNT)
- [ ] **No Duplicates**: 0 duplicate entries (verified via GROUP BY COUNT HAVING > 1)
- [ ] **Data Integrity**: All foreign keys valid (verified via FK checks)
- [ ] **Coordinates Valid**: All latitudes -90 to 90, longitudes -180 to 180
- [ ] **API Responding**: /locations endpoint returns data
- [ ] **API Responding**: /buses/search endpoint finds buses
- [ ] **Database Performance**: Queries return in < 200ms (p95)
- [ ] **No Errors in Logs**: 0 ERROR level log entries
- [ ] **Backup Exists**: Pre-load backup available for rollback

### Performance Targets

| Operation | Target | Actual |
|-----------|--------|--------|
| Locations load | < 10 min | ___ |
| Buses load | < 20 min | ___ |
| SELECT locations query | < 100 ms | ___ |
| SELECT buses query | < 200 ms | ___ |
| Disk used | < 1 GB | ___ |

---

## 📋 DATA LOADING CHECKLIST

**Use this before, during, and after data loading:**

### Before Loading
- [ ] Database ready (all migrations complete)
- [ ] Data files validated
- [ ] Python environment prepared
- [ ] Environment variables configured
- [ ] Pre-load backup created
- [ ] Team notified of loading window

### During Loading
- [ ] Monitor script output for errors
- [ ] Watch database size growth
- [ ] Check application logs for issues
- [ ] Verify each load phase completes
- [ ] Document any warnings or issues

### After Loading
- [ ] Verify row counts
- [ ] Check data integrity
- [ ] Test API endpoints
- [ ] Monitor performance metrics
- [ ] Document in deployment log
- [ ] Sign off on data load completion

---

## 🔗 INTEGRATION WITH DEPLOYMENT

### Timing in Full Deployment
```
Phase 0: Pre-Deployment Planning          (24 hours before)
Phase 1: Infrastructure Setup             (Day before, 60-90 min)
Phase 2: Database Setup & Migrations      (Day before, 30-45 min)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👉 Phase 2.5: DATA LOADING (NEW)         (Before go-live, 30-60 min)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Phase 3: Build Docker Images              (Day of launch, 45-60 min)
Phase 4: Deploy to Cloud Run               (Day of launch, 30-45 min)
Phase 5: Domain Configuration             (Go-live, 20-30 min)
Phase 6: Health Checks & Testing          (Post-launch, 30-45 min)
```

### Sequence in PRODUCTION_DEPLOYMENT_GUIDE
This phase comes after:
- ✅ Phase 2: Database migrations complete
- ✅ DB user accounts created (prod_user, backup_user)
- ✅ Database tables verified empty

And before:
- ⏳ Phase 3: Docker image builds
- ⏳ Phase 4: Cloud Run deployment
- ⏳ Phase 5: Domain & DNS configuration

---

## 📞 SUPPORT & REFERENCES

### Related Documentation
- [PRODUCTION_DATABASE_DEPLOYMENT_GUIDE.md](PRODUCTION_DATABASE_DEPLOYMENT_GUIDE.md) - Database setup
- [PRODUCTION_DEPLOYMENT_GUIDE_UPDATED_JAN_2026.md](PRODUCTION_DEPLOYMENT_GUIDE_UPDATED_JAN_2026.md) - Full deployment
- [scripts/unified_data_loader.py](scripts/unified_data_loader.py) - Main script

### Helpful Commands Reference
```bash
# Check tables
SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA='perundhu';

# Count records
SELECT COUNT(*) FROM locations;
SELECT COUNT(*) FROM buses;
SELECT COUNT(*) FROM stops;

# Find sample data
SELECT * FROM locations LIMIT 3;
SELECT * FROM buses LIMIT 3;

# Check performance
EXPLAIN SELECT * FROM buses WHERE from_location_id = 1;

# Restore from backup
gcloud sql backups restore <BACKUP_ID> --backup-instance=perundhu-prod-mysql
```

---

## ✅ SIGN-OFF

**Data Loading Phase Complete When**:
- ✅ All seed data loaded successfully
- ✅ Data integrity verified
- ✅ API endpoints responding with data
- ✅ No errors in database or application logs
- ✅ Performance within acceptable ranges

**Approved By**:
- Database Administrator: __________________ Date: __________
- DevOps Lead: __________________ Date: __________
- QA Lead: __________________ Date: __________

**Readiness for Next Phase**: ✅ YES / ❌ NO

---

**Document Version**: 1.0  
**Last Updated**: January 23, 2026  
**Status**: ✅ READY FOR PRODUCTION  
