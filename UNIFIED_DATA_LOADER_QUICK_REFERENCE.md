# 📋 Unified Data Loader - Quick Reference

## One-Liner Cheat Sheet

```bash
# FULL BULK UPLOAD (single script, strict by default)
python3 scripts/bulk_upload_full.py --environment preprod

# FULL BULK UPLOAD WITH TAMIL TRANSLATION
python3 scripts/bulk_upload_full.py --environment preprod --enable-translation

# LOCATIONS
python3 scripts/unified_data_loader.py --mode locations --environment local --data-file data/tamil_nadu_locations_enhanced.json

# BUSES WITH TAMIL TRANSLATION
python3 scripts/unified_data_loader.py --mode buses --environment preprod --data-file data/mtc_consolidated.json --operator MTC --enable-translation

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

## Configuration Sources (Priority Order)

The data loader automatically loads configuration from multiple sources:

### 1. Spring Properties Files (Recommended for Cloud Run)
- **Location**: `backend/app/src/main/resources/application-{env}.properties`
- **Features**:
  - ✅ Nested placeholders: `${DB_USER:${MYSQL_USER:default}}`
  - ✅ GCP Secret Manager: `${sm://secret-name}`
  - ✅ Environment variables: `${ENV_VAR:default}`
  - ✅ JDBC URL parsing (TCP & Unix sockets)
- **Example**:
  ```properties
  spring.datasource.url=jdbc:mysql:///perundhu?socketFactory=com.google.cloud.sql.mysql.SocketFactory&cloudSqlInstance=project:region:instance
  spring.datasource.username=${DB_USERNAME:${MYSQL_USERNAME:perundhu_user}}
  spring.datasource.password=${sm://db-password}
  ```

### 2. Environment Variables (Fallback)
- **Format**: `DB_{PARAM}_{ENV}` (e.g., `DB_HOST_PREPROD`, `DB_USER_PROD`)
- **Example**:
  ```bash
  export DB_HOST_PREPROD="127.0.0.1"
  export DB_PORT_PREPROD="3307"
  export DB_USER_PREPROD="perundhu_user"
  export DB_PASSWORD_PREPROD="your_password"
  export DB_NAME_PREPROD="perundhu"
  ```

### Connection Types

**TCP Connection (Local/Development)**:
```bash
export DB_HOST_PREPROD="127.0.0.1"
export DB_PORT_PREPROD="3307"
```

**Unix Socket (Cloud Run with Cloud SQL)**:
```properties
# Properties file automatically parsed to: host=/cloudsql/project:region:instance, port=0
spring.datasource.url=jdbc:mysql:///database?socketFactory=...&cloudSqlInstance=project:region:instance
```

**GCP Secret Manager**:
```bash
export GCP_PROJECT_ID="your-project-id"  # Required for Secret Manager
```
```properties
spring.datasource.password=${sm://production-db-password}
```

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
# Single-command full migration (strict by default)
python3 scripts/bulk_upload_full.py --environment preprod

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
- `--strict` - Fail fast if any location or stop cannot be resolved
- `--enable-translation` - Enable Tamil translation for locations and buses
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
