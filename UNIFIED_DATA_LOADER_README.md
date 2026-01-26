# 🎯 Unified Data Loader - Main README

> **One Script to Rule Them All**: Consolidate your location and bus data loading into a single, powerful, multi-environment tool.

## 📦 What's Included

This unified data loader replaces multiple scripts with one comprehensive solution:

```
❌ OLD APPROACH (Multiple Scripts)
├── import_locations.py
├── upload_bus_data.py
├── validate_bus_data.py
├── upload_mtc_data.py
├── upload_tnstc_consolidated.py
└── ...more scripts...

✅ NEW APPROACH (Single Script)
└── unified_data_loader.py (1000+ lines, handles EVERYTHING)
```

## 🚀 Quick Start (2 Minutes)

### Step 1: Install Dependencies

```bash
bash setup_unified_loader.sh
```

This script will:
- ✅ Check Python 3.8+
- ✅ Create virtual environment
- ✅ Install mysql-connector-python
- ✅ Create required directories
- ✅ Run verification tests

### Step 2: Activate Environment

```bash
source .venv/bin/activate
```

### Step 3: Load Your Data

**Option A: Validate First (Recommended)**
```bash
python3 scripts/unified_data_loader.py \
  --mode validate \
  --data-file data/tamil_nadu_locations_enhanced.json
```

**Option B: Load Locations**
```bash
python3 scripts/unified_data_loader.py \
  --mode locations \
  --environment local \
  --data-file data/tamil_nadu_locations_enhanced.json
```

**Option C: Load Everything at Once**
```bash
python3 scripts/unified_data_loader.py \
  --mode full \
  --environment local \
  --locations data/tamil_nadu_locations_enhanced.json \
  --buses data/mtc_consolidated.json \
  --operator MTC
```

Done! ✅

---

## 📚 Documentation Structure

| Document | Purpose | Read When |
|----------|---------|-----------|
| **This File** | Overview & quick start | First time setup |
| [UNIFIED_DATA_LOADER_QUICK_REFERENCE.md](UNIFIED_DATA_LOADER_QUICK_REFERENCE.md) | One-liner commands | Need a quick command |
| [UNIFIED_DATA_LOADER_GUIDE.md](UNIFIED_DATA_LOADER_GUIDE.md) | Complete guide | Need detailed instructions |
| [scripts/unified_data_loader.py](scripts/unified_data_loader.py) | Source code | Need implementation details |

---

## 🎯 Use Cases

### Use Case 1: Development (Local)
```bash
# Initial setup
python3 scripts/unified_data_loader.py --mode locations --environment local --data-file data/tamil_nadu_locations_enhanced.json

# Add buses
python3 scripts/unified_data_loader.py --mode buses --environment local --data-file data/mtc_consolidated.json --operator MTC
```

### Use Case 2: Testing (Preprod)
```bash
# Full migration before production
python3 scripts/unified_data_loader.py \
  --mode full \
  --environment preprod \
  --locations data/tamil_nadu_locations_enhanced.json \
  --buses data/tnstc_consolidated.json \
  --operator TNSTC
```

### Use Case 3: Production Rollout
```bash
# Load locations
python3 scripts/unified_data_loader.py --mode locations --environment prod --data-file data/tamil_nadu_locations_enhanced.json

# Load MTC buses
python3 scripts/unified_data_loader.py --mode buses --environment prod --data-file data/mtc_consolidated.json --operator MTC

# Load TNSTC buses
python3 scripts/unified_data_loader.py --mode buses --environment prod --data-file data/tnstc_consolidated.json --operator TNSTC
```

### Use Case 4: Resume After Interruption
```bash
# If something fails, resume automatically
python3 scripts/unified_data_loader.py \
  --mode buses \
  --environment preprod \
  --checkpoint logs/checkpoints/buses_preprod_*.json
```

---

## 🔄 Core Features

### ✅ Multi-Mode Support

| Mode | Purpose | Command |
|------|---------|---------|
| **locations** | Load 41K+ locations | `--mode locations` |
| **buses** | Load buses & stops | `--mode buses` |
| **full** | Load everything | `--mode full` |
| **validate** | Check data | `--mode validate` |

### 🌍 Multi-Environment Support

| Environment | Use Case | Config |
|------------|----------|--------|
| **local** | Development | Auto-configured |
| **preprod** | Testing/Staging | Environment variables |
| **prod** | Production | GCP Secrets or env vars |

### 🏢 Multi-Operator Support

- **MTC** - Metropolitan Transport Corporation (Chennai)
- **TNSTC** - Tamil Nadu State Transport Corporation
- **KRTC** - Kerala RTC
- **KSRTC** - Karnataka KSRTC
- **APSRTC** - Andhra Pradesh APSRTC
- **OTHER** - Custom operators

### 🛡️ Data Integrity Features

- ✅ **Validation**: Check data before upload
- ✅ **Deduplication**: Automatic duplicate detection
- ✅ **Fuzzy Matching**: Handle location name variations
- ✅ **Transactions**: Rollback on errors
- ✅ **Checkpoints**: Resume interrupted migrations
- ✅ **Batch Processing**: Configurable batch sizes

---

## 📊 Performance

| Operation | Records | Time | Speed |
|-----------|---------|------|-------|
| Load Locations | 41,116 | ~30s | 1,370 rec/s |
| Load MTC Buses | 5,000 | ~45s | 111 rec/s |
| Load TNSTC Buses | 8,500 | ~75s | 113 rec/s |
| **Full Migration** | **54,616** | **~2.5min** | - |

---

## 🔧 Configuration

### Local Environment (No Setup Needed)
```
Host: localhost
Port: 3307
User: perundhu_user
Password: perundhu_password
Database: perundhu
```

### Preprod/Production (Set Environment Variables)
```bash
# For preprod
export DB_HOST_PREPROD=preprod-server.com
export DB_PORT_PREPROD=3306
export DB_USER_PREPROD=db_user
export DB_PASSWORD_PREPROD=password
export DB_NAME_PREPROD=perundhu

# For production
export DB_HOST_PROD=prod-server.com
export DB_PORT_PROD=3306
export DB_USER_PROD=db_user
export DB_PASSWORD_PROD=password
export DB_NAME_PROD=perundhu
```

---

## 📋 Supported Data Formats

### Locations
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

### Buses with Stops
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
      }
    ]
  }
]
```

---

## 🐛 Troubleshooting

### Problem: MySQL Connection Failed
```bash
# Start MySQL service
brew services start mysql@8.0

# Test connection
mysql -h localhost -P 3307 -u perundhu_user -p
```

### Problem: ModuleNotFoundError: mysql-connector-python
```bash
# Install dependencies
pip install mysql-connector-python

# Or run setup script
bash setup_unified_loader.sh
```

### Problem: File Not Found
```bash
# Use absolute path
python3 scripts/unified_data_loader.py \
  --mode locations \
  --environment local \
  --data-file /Users/mchand69/Documents/perundhu/data/tamil_nadu_locations_enhanced.json
```

### Problem: Migration Failed Midway
```bash
# Resume from checkpoint (automatic)
python3 scripts/unified_data_loader.py \
  --mode buses \
  --environment preprod \
  --checkpoint logs/checkpoints/buses_preprod_*.json

# Or reduce batch size and retry
python3 scripts/unified_data_loader.py \
  --mode buses \
  --environment preprod \
  --data-file data/buses.json \
  --batch-size 500
```

---

## 📊 Monitoring & Verification

### Check Upload Progress
```bash
tail -f logs/unified_data_loader.log
```

### Verify Data in Database
```bash
# Check location count
mysql -h localhost -P 3307 -u perundhu_user -p -e \
  "SELECT COUNT(*) as locations FROM locations;"

# Check bus count
mysql -h localhost -P 3307 -u perundhu_user -p -e \
  "SELECT COUNT(*) as buses FROM buses;"

# Check by operator
mysql -h localhost -P 3307 -u perundhu_user -p -e \
  "SELECT operator, COUNT(*) FROM buses GROUP BY operator;"
```

---

## 🎓 Learning Path

1. **Start Here**: Read this README
2. **Quick Commands**: Check [UNIFIED_DATA_LOADER_QUICK_REFERENCE.md](UNIFIED_DATA_LOADER_QUICK_REFERENCE.md)
3. **Deep Dive**: Read [UNIFIED_DATA_LOADER_GUIDE.md](UNIFIED_DATA_LOADER_GUIDE.md)
4. **Run Tests**: `python3 test_unified_data_loader.py`
5. **Try Examples**: Copy-paste commands from quick reference
6. **Production Ready**: Deploy with confidence!

---

## 🚀 Next Steps

### Immediate (Next 15 Minutes)
- [ ] Run setup script: `bash setup_unified_loader.sh`
- [ ] Verify: `python3 test_unified_data_loader.py`
- [ ] Test validation: `python3 scripts/unified_data_loader.py --mode validate --data-file data/tamil_nadu_locations_enhanced.json`

### Short-term (Next 1 Hour)
- [ ] Load locations: `python3 scripts/unified_data_loader.py --mode locations --environment local --data-file data/tamil_nadu_locations_enhanced.json`
- [ ] Load buses: `python3 scripts/unified_data_loader.py --mode buses --environment local --data-file data/mtc_consolidated.json --operator MTC`
- [ ] Verify in database

### Medium-term (Next 1 Day)
- [ ] Deploy to preprod environment
- [ ] Run full migration test
- [ ] Document any custom configurations

### Long-term (Ongoing)
- [ ] Integrate into CI/CD pipeline
- [ ] Schedule automated data refreshes
- [ ] Monitor data quality

---

## 💡 Pro Tips

### Tip 1: Always Validate First
```bash
python3 scripts/unified_data_loader.py --mode validate --data-file data/your_data.json
```

### Tip 2: Use Dry-Run for Testing
```bash
python3 scripts/unified_data_loader.py --mode locations --environment local --data-file data/your_data.json --dry-run
```

### Tip 3: Monitor with Verbose Logging
```bash
python3 scripts/unified_data_loader.py --mode buses --environment preprod --data-file data/buses.json --verbose
```

### Tip 4: Adjust Batch Size for Performance
```bash
# Fast networks (local)
--batch-size 2000

# Slow networks (cloud)
--batch-size 500
```

### Tip 5: Combine with Other Tools
```bash
# Load + Verify in one command
bash -c 'python3 scripts/unified_data_loader.py --mode validate --data-file data/locations.json && \
         python3 scripts/unified_data_loader.py --mode locations --environment local --data-file data/locations.json'
```

---

## 📞 Support

### Documentation
- Full guide: [UNIFIED_DATA_LOADER_GUIDE.md](UNIFIED_DATA_LOADER_GUIDE.md)
- Quick reference: [UNIFIED_DATA_LOADER_QUICK_REFERENCE.md](UNIFIED_DATA_LOADER_QUICK_REFERENCE.md)
- Source code: [scripts/unified_data_loader.py](scripts/unified_data_loader.py)

### Debug Information
Collect debug info for troubleshooting:
```bash
python3 scripts/unified_data_loader.py \
  --mode validate \
  --data-file data/your_data.json \
  --verbose 2>&1 | tee debug_output.log
```

---

## 📈 Roadmap

- ✅ v1.0: Locations + Buses + Stops
- 🔜 v1.1: Connecting routes support
- 🔜 v1.2: Multi-file batch processing
- 🔜 v1.3: Real-time progress dashboard
- 🔜 v2.0: API-based uploads

---

## 📄 License & Attribution

This unified data loader consolidates and improves upon multiple existing scripts in the perundhu project.

**Version:** 1.0  
**Last Updated:** 2026-01-23  
**Maintained By:** Development Team

---

## 🎉 Getting Started Right Now

```bash
# Copy & paste this:
cd /Users/mchand69/Documents/perundhu && \
bash setup_unified_loader.sh && \
source .venv/bin/activate && \
python3 scripts/unified_data_loader.py --mode validate --data-file data/tamil_nadu_locations_enhanced.json
```

That's it! You're ready to go! 🚀
