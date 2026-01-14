# Generic Bus Data Upload Guide

## Overview

**`upload_bus_data.py`** is a generic, multi-operator bus data upload script supporting:
- ✅ **MTC** (Metropolitan Transport Corporation)
- ✅ **TNSTC** (Tamil Nadu State Transport Corporation)
- ✅ **Future operators** (easily extensible)

---

## Quick Start

### Upload MTC Data (Local)
```bash
python scripts/upload_bus_data.py --operator MTC --environment local
```

### Upload TNSTC Data (Preprod)
```bash
python scripts/upload_bus_data.py --operator TNSTC --environment preprod
```

### Production Upload
```bash
python scripts/upload_bus_data.py --operator MTC --environment prod
```

---

## Command-Line Options

| Option | Choices | Default | Description |
|--------|---------|---------|-------------|
| `--operator`, `-o` | `MTC`, `TNSTC` | `MTC` | Bus operator to upload |
| `--environment`, `-e` | `local`, `preprod`, `prod` | `local` | Target environment |
| `--dry-run` | Flag | Off | Validate without uploading |
| `--help`, `-h` | Flag | - | Show help message |

---

## Supported Operators

### Current Operators

#### **MTC** (Metropolitan Transport Corporation)
- **Checkpoint File:** `data/mtc_bus_timings.checkpoint.json`
- **Category:** `MTC`
- **Data Format:** `{ "all_timings": [...] }`

#### **TNSTC** (Tamil Nadu State Transport Corporation)
- **Checkpoint File:** `data/tnstc_bus_timings.checkpoint.json`
- **Category:** `TNSTC`
- **Data Format:** `{ "all_timings": [...] }`

---

## Adding New Operators

### 1. **Update `OPERATOR_CONFIGS` in Script**

Edit `scripts/upload_bus_data.py`:

```python
OPERATOR_CONFIGS = {
    'MTC': { ... },
    'TNSTC': { ... },
    'SETC': {  # NEW OPERATOR
        'category': 'SETC',
        'checkpoint_file': 'data/setc_bus_timings.checkpoint.json',
        'data_key': 'all_timings',
        'display_name': 'State Express Transport Corporation (SETC)'
    }
}
```

### 2. **Create Checkpoint File**

Structure: `data/setc_bus_timings.checkpoint.json`

```json
{
  "all_timings": [
    {
      "route_number": "115",
      "origin_value": "CHENNAI",
      "destination_value": "BANGALORE",
      "timing": "05:30-09:00"
    }
  ]
}
```

### 3. **Upload**

```bash
python scripts/upload_bus_data.py --operator SETC --environment local
```

---

## Data Flow

```
Checkpoint JSON (operator-specific)
    ↓
[Parse] route_number, origin, destination, timing
    ↓
[Fuzzy Match] Check existing locations (80% similarity)
    ↓
[Create/Reuse] locations table
    ↓
[Create] buses table (with category = operator)
    ↓
[Create] stops table (origin + destination)
    ↓
[Generate] connecting_routes (multi-leg journeys)
    ↓
✓ Complete
```

---

## Environment Configuration

### Local (Development)
- **Host:** `localhost:3306`
- **User:** `perundhu_user`
- **Password:** `perundhu_password`
- **Source:** `application-mysql-local.properties`

### Preprod (Staging)
- **Host:** `PREPROD_DB_HOST` (env var)
- **User:** `PREPROD_DB_USER` (env var)
- **Password:** `PREPROD_DB_PASSWORD` (env var)
- **Source:** Environment variables

### Production
- **Host:** GCP Secret Manager (`production-db-url`)
- **User:** GCP Secret Manager (`production-db-username`)
- **Password:** GCP Secret Manager (`production-db-password`)
- **Source:** Google Cloud Secret Manager

---

## Features

### ✅ **Fuzzy Location Matching** (80% Threshold)
Prevents duplicates:
- "BROADWAY" vs "BRODWAY" → Matched ✅
- "BROADWAY" vs "PERAMBUR" → Different ❌

### ✅ **Multi-Operator Support**
- Separate categories in database
- Independent checkpoint files
- Cross-operator connections supported

### ✅ **Connecting Routes**
Automatically generates multi-leg journeys:
```
Tambaram → Koyambedu (MTC Bus 45C)
Koyambedu → Manali (MTC Bus 52)
= Connecting route created
```

### ✅ **Transaction Safety**
- Auto-commit on success
- Auto-rollback on error
- Database consistency guaranteed

---

## Statistics Output

```
============================================================
UPLOAD STATISTICS
============================================================
Operator: MTC
Locations created: 512
Locations skipped (duplicates): 1250
Buses created: 666
Stops created: 1332 (origin + destination per route)
Connecting routes created: 2845
Errors: 0
============================================================
```

---

## Troubleshooting

### Issue: "Checkpoint file not found"
**Solution:** Verify file path matches operator config
```bash
ls -la data/mtc_bus_timings.checkpoint.json
ls -la data/tnstc_bus_timings.checkpoint.json
```

### Issue: "Connection failed"
**Solution:** Check database running
```bash
mysql.server start  # macOS
sudo service mysql start  # Linux
```

### Issue: "Unsupported operator"
**Solution:** Add operator to `OPERATOR_CONFIGS` in script

### Issue: "Duplicate key error"
**Solution:** Script already handled - check `buses_created: 0` in stats

---

## Log Files

- **Location:** `logs/bus_upload.log`
- **View:** `tail -f logs/bus_upload.log`
- **Search errors:** `grep ERROR logs/bus_upload.log`

---

## Database Schema

### locations
```sql
id, name, latitude, longitude, created_at, updated_at
```

### buses
```sql
id, bus_number, from_location_id, to_location_id,
departure_time, arrival_time, category, active, created_at, updated_at
```

### stops
```sql
id, name, bus_id, location_id, arrival_time, departure_time,
stop_order, created_at, updated_at
```

### connecting_routes
```sql
id, first_bus_id, second_bus_id, connection_point_id,
wait_time_minutes, created_at, updated_at
```

---

## Comparison: Old vs New

| Feature | Old (MTC-only) | New (Generic) |
|---------|----------------|---------------|
| Operators | MTC only | MTC, TNSTC, extensible |
| Script name | `upload_mtc_data.py` | `upload_bus_data.py` |
| Operator param | N/A | `--operator MTC/TNSTC` |
| Checkpoint | Hardcoded | Operator-specific config |
| Category | Always "MTC" | Dynamic per operator |
| Extensibility | Requires rewrite | Add to config dict |

---

## Examples

### Dry Run (Validation Only)
```bash
python scripts/upload_bus_data.py --operator MTC --dry-run
```

### Upload Both Operators
```bash
# Upload MTC first
python scripts/upload_bus_data.py --operator MTC --environment local

# Then upload TNSTC
python scripts/upload_bus_data.py --operator TNSTC --environment local
```

### Production Deployment
```bash
# 1. Backup database
gcloud sql backups create --instance=prod-db

# 2. Upload MTC
python scripts/upload_bus_data.py --operator MTC --environment prod

# 3. Upload TNSTC
python scripts/upload_bus_data.py --operator TNSTC --environment prod
```

---

## Next Steps

1. ✅ **Test locally:** `python scripts/upload_bus_data.py --operator MTC --environment local`
2. ✅ **Verify data:** Check database tables (locations, buses, stops)
3. ✅ **Test TNSTC:** `python scripts/upload_bus_data.py --operator TNSTC --environment local`
4. ✅ **Deploy preprod:** Test with preprod environment
5. ✅ **Production:** Deploy to production with backups

---

## Summary

✅ **Generic script ready** - Supports MTC, TNSTC, future operators
✅ **Backward compatible** - Existing MTC data uploads work
✅ **Easily extensible** - Add new operators in 3 steps
✅ **Production-grade** - Fuzzy matching, transactions, GCP secrets
✅ **Multi-environment** - Local, preprod, production supported

**Start uploading:** `python scripts/upload_bus_data.py --operator MTC --environment local` 🚀
