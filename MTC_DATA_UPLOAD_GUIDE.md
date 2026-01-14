# MTC Data Upload Configuration Guide

## Overview
This guide explains how to configure and run the MTC data upload script for local, preprod, and production environments.

## Features
✅ **Multi-environment support** - local, preprod, production  
✅ **GCP Secret Manager integration** - Production secrets management  
✅ **Fuzzy location matching** - Prevents duplicate location entries (80% similarity threshold)  
✅ **Transaction safety** - Automatic rollback on errors  
✅ **Comprehensive logging** - `logs/mtc_upload.log` and console output  
✅ **Flexible configuration** - Environment variables or config files  

---

## Environment Setup

### Prerequisites
```bash
# Install Python dependencies
pip install mysql-connector-python google-cloud-secret-manager

# Ensure MySQL client tools available
# For macOS:
brew install mysql-client
```

---

## LOCAL Environment Setup

### 1. MySQL Local Setup
```bash
# Start MySQL locally
mysql.server start

# Create database
mysql -u root -p
CREATE DATABASE perundhu;
CREATE USER 'perundhu_user'@'localhost' IDENTIFIED BY 'perundhu_password';
GRANT ALL PRIVILEGES ON perundhu.* TO 'perundhu_user'@'localhost';
FLUSH PRIVILEGES;
```

### 2. Run Migrations (optional)
```bash
cd backend
./gradlew flywayMigrate -Dflyway.configFiles=app/src/main/resources/application-mysql-local.properties
```

### 3. Upload Data
```bash
cd /path/to/perundhu

# Activate virtual environment
source .venv/bin/activate

# Run upload to local
python scripts/upload_mtc_data.py --environment local --verbose

# Output: logs/mtc_upload.log
```

### Local Config (Auto-detected)
The script reads from: `backend/app/src/main/resources/application-mysql-local.properties`
```properties
spring.datasource.url=jdbc:mysql://localhost:3306/perundhu
spring.datasource.username=perundhu_user
spring.datasource.password=perundhu_password
```

---

## PREPROD Environment Setup

### 1. Environment Variables
Create `.env.preprod` file in project root:
```bash
# Database connection
PREPROD_DB_HOST=preprod-db.example.com
PREPROD_DB_PORT=3306
PREPROD_DB_USER=preprod_user
PREPROD_DB_PASSWORD=your_secure_password

# Optional SSL
DB_SSL_CA=/path/to/ca-cert.pem
```

### 2. Load Environment
```bash
# Load before running upload
source .env.preprod

# Verify connection
mysql -h $PREPROD_DB_HOST -u $PREPROD_DB_USER -p$PREPROD_DB_PASSWORD -D perundhu_preprod -e "SELECT 1;"
```

### 3. Upload Data
```bash
source .env.preprod
python scripts/upload_mtc_data.py --environment preprod --verbose
```

---

## PRODUCTION Environment Setup (GCP)

### 1. GCP Project Setup
```bash
# Install Google Cloud SDK
curl https://sdk.cloud.google.com | bash
exec -l $SHELL
gcloud init

# Set project
gcloud config set project perundhu-project
```

### 2. Create Secrets in GCP Secret Manager
```bash
# Create database connection secrets
echo -n "prod-db.example.com" | gcloud secrets create production-db-url --data-file=-
echo -n "prod_user" | gcloud secrets create production-db-username --data-file=-
echo -n "your_secure_password" | gcloud secrets create production-db-password --data-file=-

# Verify secrets
gcloud secrets list | grep production-db
```

### 3. Grant Service Account Permissions
```bash
# Get service account email
gcloud iam service-accounts list

# Grant Secret Accessor role
gcloud secrets add-iam-policy-binding production-db-password \
  --member=serviceAccount:SERVICE_ACCOUNT_EMAIL \
  --role=roles/secretmanager.secretAccessor
```

### 4. Authentication
```bash
# Option A: Use Application Default Credentials (Recommended)
gcloud auth application-default login

# Option B: Use service account key
gcloud auth activate-service-account --key-file=path/to/key.json

# Verify authentication
gcloud auth list
```

### 5. Upload Data
```bash
# Set environment variables
export GCP_PROJECT_ID=perundhu-project

# Run upload
python scripts/upload_mtc_data.py --environment prod --verbose

# Or in Cloud Run / Cloud Functions:
# The service account automatically has access to secrets
```

---

## Running the Upload Script

### Basic Usage
```bash
# Upload to local (default)
python scripts/upload_mtc_data.py

# Upload to preprod
python scripts/upload_mtc_data.py --environment preprod

# Upload to production
python scripts/upload_mtc_data.py --environment prod
```

### With Verbose Logging
```bash
python scripts/upload_mtc_data.py --environment local --verbose

# Output Example:
# 2026-01-13 13:30:45,123 - root - INFO - Loading configuration for environment: local
# 2026-01-13 13:30:45,456 - root - INFO - Connecting to local database at localhost:3306
# 2026-01-13 13:30:45,789 - root - INFO - ✓ Database connection successful
# 2026-01-13 13:30:46,012 - root - INFO - Loaded 5332 timings from checkpoint
# 2026-01-13 13:30:46,234 - root - INFO - Starting upload of 5332 timing records
```

---

## Data Mapping

### Input Data Structure (from checkpoint)
```json
{
  "all_timings": [
    {
      "route_number": "1",
      "origin_value": "BROADWAY",
      "destination_value": "PERAMBUR",
      "timing": "06:00-23:00"
    }
  ]
}
```

### Database Tables
```
locations (id, name, latitude, longitude, ...)
        ↓
buses (id, bus_number, from_location_id, to_location_id, ...)
        ↓
stops (id, bus_id, location_id, stop_order, ...)
        ↓
connecting_routes (first_bus_id, second_bus_id, connection_point_id)
```

---

## Duplicate Location Handling

### Similarity Matching
- **Threshold**: 80% text similarity
- **Algorithm**: SequenceMatcher (Python difflib)
- **Behavior**: 
  - "BROADWAY" → "BROADWAY" (exact match, uses existing)
  - "BROADWAY" → "BRODWAY" (typo, uses existing if >80% match)
  - "BROADWAY" → "PERAMBUR" (different location, creates new)

### Example
```
Input: "BROADWAY"
Existing: "BROADWAY" → FOUND (100% match) → Reuse
Existing: "BRODWAY" → FOUND (83% match) → Reuse
Existing: "PERAMBUR" → NOT FOUND → CREATE NEW
```

---

## Error Handling & Troubleshooting

### Connection Errors
```bash
# Error: "Can't connect to MySQL server"
# Solution: Verify MySQL is running and credentials are correct

mysql -u perundhu_user -p -h localhost -P 3306
```

### Secret Manager Errors (Production)
```bash
# Error: "Failed to retrieve secret 'production-db-password'"
# Solution 1: Verify secret exists
gcloud secrets list | grep production-db

# Solution 2: Check service account permissions
gcloud secrets get-iam-policy production-db-password

# Solution 3: Verify authentication
gcloud auth list
```

### Duplicate Location Warnings
```
# These are informational, not errors:
INFO - Found similar location 'BROADWAY' (~100%)
INFO - Using existing location 'BROADWAY' (ID: 42)
INFO - Locations skipped (duplicates): 1250
```

---

## Statistics & Output

### Upload Statistics (printed after completion)
```
============================================================
UPLOAD STATISTICS
============================================================
Locations created: 512
Locations skipped (duplicates): 1250
Buses created: 666
Stops created: 8920
Connecting routes created: 142
Errors: 0
============================================================
```

### Log File
```bash
# View upload logs
tail -f logs/mtc_upload.log

# Search for errors
grep ERROR logs/mtc_upload.log

# Check upload progress
grep "Created bus route" logs/mtc_upload.log | wc -l
```

---

## Production Deployment

### Via Cloud Run
```dockerfile
# Dockerfile
FROM python:3.13-slim
WORKDIR /app
COPY scripts/ scripts/
COPY data/ data/
COPY requirements.txt .
RUN pip install -r requirements.txt
CMD ["python", "scripts/upload_mtc_data.py", "--environment", "prod"]
```

```bash
# Deploy
gcloud run deploy mtc-data-uploader \
  --source . \
  --runtime python313 \
  --region us-central1 \
  --service-account=perundhu-sa@perundhu-project.iam.gserviceaccount.com
```

### Via Cloud Scheduler (Automatic Upload)
```bash
# Create scheduled job (daily at 2 AM UTC)
gcloud scheduler jobs create http mtc-upload-daily \
  --location=us-central1 \
  --schedule="0 2 * * *" \
  --uri=https://region-perundhu-project.cloudfunctions.net/upload-mtc \
  --oidc-service-account-email=perundhu-sa@perundhu-project.iam.gserviceaccount.com
```

---

## Best Practices

1. **Always backup database before production upload**
   ```bash
   mysqldump -u user -p database > backup_$(date +%Y%m%d_%H%M%S).sql
   ```

2. **Test on preprod first**
   ```bash
   # 1. Test on local
   python scripts/upload_mtc_data.py --environment local
   # 2. Test on preprod
   python scripts/upload_mtc_data.py --environment preprod
   # 3. Upload to production
   python scripts/upload_mtc_data.py --environment prod
   ```

3. **Monitor upload progress**
   ```bash
   # In another terminal
   tail -f logs/mtc_upload.log
   ```

4. **Verify data integrity after upload**
   ```sql
   SELECT COUNT(*) as total_locations FROM locations;
   SELECT COUNT(*) as total_buses FROM buses;
   SELECT COUNT(*) as total_stops FROM stops;
   ```

---

## Rollback Procedure

### If Upload Fails
```bash
# Errors are logged to logs/mtc_upload.log
# Database changes are automatically rolled back
# Check log for details:
grep ERROR logs/mtc_upload.log

# Re-run to retry:
python scripts/upload_mtc_data.py --environment local --verbose
```

### Manual Rollback (if needed)
```sql
-- DO NOT run unless absolutely necessary!
-- This will delete recently uploaded data

-- Delete bus stops (most recent first)
DELETE FROM stops WHERE created_at >= '2026-01-13 13:00:00';

-- Delete buses
DELETE FROM buses WHERE created_at >= '2026-01-13 13:00:00';

-- Delete locations (be careful!)
DELETE FROM locations WHERE created_at >= '2026-01-13 13:00:00';
```

---

## Support

For issues or questions:
1. Check `logs/mtc_upload.log` for detailed errors
2. Run with `--verbose` flag for debug info
3. Review this guide's troubleshooting section
4. Contact development team with logs attached

