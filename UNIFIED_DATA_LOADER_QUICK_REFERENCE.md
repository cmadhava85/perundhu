# 📋 Unified Data Loader - Quick Reference

## One-Liner Cheat Sheet

```bash
# LOCATIONS
python3 scripts/unified_data_loader.py --mode locations --environment local --data-file data/tamil_nadu_locations_enhanced.json

# BUSES
python3 scripts/unified_data_loader.py --mode buses --environment preprod --data-file data/mtc_consolidated.json --operator MTC

# FULL MIGRATION
python3 scripts/unified_data_loader.py --mode full --environment prod --locations data/tamil_nadu_locations_enhanced.json --buses data/tnstc_consolidated.json --operator TNSTC

# VALIDATE
python3 scripts/unified_data_loader.py --mode validate --data-file data/buses.json

# RESUME
python3 scripts/unified_data_loader.py --mode buses --environment local --checkpoint data/migration_checkpoint.json
```

---

## Mode Quick Reference

| Mode | Purpose | Command |
|------|---------|---------|
| `locations` | Upload location data only | `--mode locations` |
| `buses` | Upload bus + stops data | `--mode buses` |
| `full` | Upload both locations & buses | `--mode full` |
| `validate` | Check data without uploading | `--mode validate` |

---

## Environment Quick Reference

| Environment | Default Host | Port | Use Case |
|------------|---------|------|----------|
| `local` | localhost | 3307 | Development |
| `preprod` | preprod-server.com | 3306 | Staging/Testing |
| `prod` | prod-server.com | 3306 | Production |

---

## Common Scenarios

### Scenario 1: First-time Setup (Local)

```bash
# 1. Validate locations
python3 scripts/unified_data_loader.py --mode validate --data-file data/tamil_nadu_locations_enhanced.json

# 2. Load locations
python3 scripts/unified_data_loader.py --mode locations --environment local --data-file data/tamil_nadu_locations_enhanced.json

# 3. Validate buses
python3 scripts/unified_data_loader.py --mode validate --data-file data/mtc_consolidated.json

# 4. Load buses
python3 scripts/unified_data_loader.py --mode buses --environment local --data-file data/mtc_consolidated.json --operator MTC

# 5. Verify
mysql -h localhost -P 3307 -u perundhu_user -p -e "SELECT COUNT(*) as locations FROM locations; SELECT COUNT(*) as buses FROM buses;"
```

### Scenario 2: Deploy to Preprod

```bash
# Full migration in one command
python3 scripts/unified_data_loader.py \
  --mode full \
  --environment preprod \
  --locations data/tamil_nadu_locations_enhanced.json \
  --buses data/tnstc_consolidated.json \
  --operator TNSTC \
  --verbose
```

### Scenario 3: Production Rollout

```bash
# 1. Validate all data first
python3 scripts/unified_data_loader.py --mode validate --data-file data/tamil_nadu_locations_enhanced.json
python3 scripts/unified_data_loader.py --mode validate --data-file data/mtc_consolidated.json
python3 scripts/unified_data_loader.py --mode validate --data-file data/tnstc_consolidated.json

# 2. Deploy to production with force-overwrite (if needed)
python3 scripts/unified_data_loader.py --mode full --environment prod \
  --locations data/tamil_nadu_locations_enhanced.json \
  --buses data/mtc_consolidated.json \
  --operator MTC

# 3. Load additional operator
python3 scripts/unified_data_loader.py --mode buses --environment prod \
  --data-file data/tnstc_consolidated.json \
  --operator TNSTC
```

### Scenario 4: Migration Failed, Resume

```bash
# If migration was interrupted:
# 1. Check checkpoint
ls -la logs/checkpoints/

# 2. Resume from checkpoint
python3 scripts/unified_data_loader.py \
  --mode buses \
  --environment preprod \
  --checkpoint logs/checkpoints/buses_preprod_*.json

# Or restart from beginning with adjusted batch size
python3 scripts/unified_data_loader.py \
  --mode buses \
  --environment preprod \
  --data-file data/mtc_consolidated.json \
  --batch-size 500
```

---

## Arguments Reference

### Required
- `--mode {locations|buses|full|validate}` - What to load

### Optional
- `--environment {local|preprod|prod}` - Target env (default: local)
- `--data-file PATH` - Data file path
- `--locations PATH` - Locations file (full mode)
- `--buses PATH` - Buses file (full mode)
- `--operator {MTC|TNSTC|...}` - Bus operator name
- `--checkpoint PATH` - Resume from checkpoint
- `--force-overwrite` - Overwrite existing data
- `--batch-size N` - Records per batch (default: 1000)
- `--dry-run` - Validate without uploading
- `--verbose` - Debug logging

---

## Status Check Commands

```bash
# Check locations count
mysql -h localhost -P 3307 -u perundhu_user -p -e "SELECT COUNT(*) as locations FROM locations;"

# Check buses count
mysql -h localhost -P 3307 -u perundhu_user -p -e "SELECT COUNT(*) as buses FROM buses;"

# Check stops count
mysql -h localhost -P 3307 -u perundhu_user -p -e "SELECT COUNT(*) as stops FROM stops;"

# Check by operator
mysql -h localhost -P 3307 -u perundhu_user -p -e "SELECT operator, COUNT(*) FROM buses GROUP BY operator;"

# View recent logs
tail -50 logs/unified_data_loader.log
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "Connection refused" | Start MySQL: `brew services start mysql@8.0` |
| "File not found" | Use absolute path: `/Users/mchand69/Documents/perundhu/data/...` |
| "Invalid data" | Run validate mode: `--mode validate` |
| "Duplicate errors" | Use `--force-overwrite` flag |
| "Out of memory" | Reduce batch size: `--batch-size 500` |
| "Permission denied" | Make script executable: `chmod +x scripts/unified_data_loader.py` |

---

## Log Locations

```bash
# Main log
logs/unified_data_loader.log

# Checkpoints
logs/checkpoints/
  ├── locations_local_*.json
  ├── buses_preprod_*.json
  └── full_prod_*.json
```

---

## Performance Tips

- Use `--batch-size 2000` for fast networks (local)
- Use `--batch-size 500` for slow networks (cloud)
- Run validation offline with `--mode validate --dry-run`
- Run during off-peak hours for production
- Check disk space: `df -h` (need ~2GB)

---

**Need help?** Check `UNIFIED_DATA_LOADER_GUIDE.md` for full documentation.
