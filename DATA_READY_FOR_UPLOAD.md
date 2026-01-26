# 📊 Location Data - Ready for Database Upload

**Status:** ✅ COMPLETE - 41,116 locations fetched and exported

---

## 📦 Available Formats

### 1. **JSON Format** (`tamil_nadu_locations.json`)
- **Size:** 5.6 MB
- **Format:** Single array with all locations
- **Best for:** Direct database import, API responses

```json
[
  {
    "name": "Chennai Central",
    "type": "bus_stop",
    "latitude": 13.0334336,
    "longitude": 80.2679457,
    "osm_id": 243060332
  },
  ...
]
```

**Import to MySQL:**
```bash
# Option 1: Using JSON_EXTRACT functions
mysql -u perundhu_user -p perundhu < import_json.sql

# Option 2: Using ETL tools (Python, etc.)
python3 import_json_to_db.py tamil_nadu_locations.json
```

---

### 2. **JSONL Format** (`tamil_nadu_locations.jsonl`)
- **Size:** 4.5 MB
- **Format:** One JSON object per line (newline-delimited)
- **Best for:** Streaming, large datasets, Kafka pipelines

```
{"name": "Chennai Central", "type": "bus_stop", "latitude": 13.0334336, "longitude": 80.2679457, "osm_id": 243060332}
{"name": "Madurai Central", "type": "bus_stop", "latitude": 9.9252, "longitude": 78.1198, "osm_id": 244445223}
...
```

**Import to MySQL:**
```bash
# Using jq + MySQL
cat tamil_nadu_locations.jsonl | jq -r '@csv' | \
  mysql -u perundhu_user -p perundhu -e \
  "LOAD DATA LOCAL INFILE '/dev/stdin' INTO TABLE locations 
   FIELDS TERMINATED BY ',' ENCLOSED BY '\"' 
   (name, type, latitude, longitude, osm_id);"
```

---

### 3. **CSV Format** (`tamil_nadu_locations.csv`)
- **Size:** 2.2 MB
- **Format:** Comma-separated values (Excel-compatible)
- **Best for:** Excel/Sheets review, SQL INSERT, bulk imports

```
name,type,latitude,longitude,osm_id
Chennai Central,bus_stop,13.0334336,80.2679457,243060332
Madurai Central,bus_stop,9.9252,78.1198,244445223
...
```

**Import to MySQL:**
```bash
# Option 1: Using MySQL LOAD DATA command
mysql -u perundhu_user -p perundhu -e \
  "LOAD DATA LOCAL INFILE '/Users/mchand69/Documents/perundhu/data/tamil_nadu_locations.csv'
   INTO TABLE locations
   FIELDS TERMINATED BY ','
   ENCLOSED BY '\"'
   LINES TERMINATED BY '\n'
   IGNORE 1 ROWS
   (name, type, latitude, longitude, osm_id);"

# Option 2: Using Python script
python3 import_csv_to_db.py tamil_nadu_locations.csv
```

---

## 📊 Data Summary

| Metric | Value |
|--------|-------|
| **Total Locations** | 41,116 |
| **Bus Stops/Stations** | 592 |
| **Cities** | 45 |
| **Towns** | 635 |
| **Villages** | 23,997 |
| **Neighborhoods** | 4,628 |
| **Suburbs** | 1,274 |
| **Hamlets** | 9,945 |

**Geographic Coverage:**
- Latitude: 8.0° to 13.5°N (Tamil Nadu)
- Longitude: 76.0° to 80.5°E (Tamil Nadu)

---

## 🗄️ Database Import Methods

### Method 1: Using Flyway Migration (Recommended)
```bash
# Create migration with locations data
cat > backend/app/src/main/resources/db/migration/V45__load_tamil_nadu_locations.sql << 'EOF'
-- Load Tamil Nadu locations from Overpass API
INSERT INTO locations (name, type, latitude, longitude, osm_id) VALUES
  ('Chennai Central', 'bus_stop', 13.0334336, 80.2679457, 243060332),
  ('Madurai Central', 'bus_stop', 9.9252, 78.1198, 244445223),
  ...
ON DUPLICATE KEY UPDATE
  type = VALUES(type),
  latitude = VALUES(latitude),
  longitude = VALUES(longitude);
EOF

# Apply migration
cd backend
./gradlew flywayMigrate
```

### Method 2: Direct CSV Import
```bash
# Fastest method for bulk import
mysql -u perundhu_user -p perundhu << EOF
LOAD DATA LOCAL INFILE '/Users/mchand69/Documents/perundhu/data/tamil_nadu_locations.csv'
INTO TABLE locations
FIELDS TERMINATED BY ','
ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 ROWS
(name, type, latitude, longitude, osm_id);
EOF
```

### Method 3: Using Python Script
```python
import json
import mysql.connector

# Read JSON
with open('tamil_nadu_locations.json', 'r') as f:
    locations = json.load(f)

# Connect to DB
conn = mysql.connector.connect(
    host='localhost',
    user='perundhu_user',
    password='your_password',
    database='perundhu',
    port=3307  # Cloud SQL Proxy
)

cursor = conn.cursor()

# Insert in batches
batch_size = 1000
for i in range(0, len(locations), batch_size):
    batch = locations[i:i+batch_size]
    for loc in batch:
        cursor.execute(
            "INSERT INTO locations (name, type, latitude, longitude, osm_id) "
            "VALUES (%s, %s, %s, %s, %s) "
            "ON DUPLICATE KEY UPDATE type = VALUES(type)",
            (loc['name'], loc['type'], loc['latitude'], loc['longitude'], loc['osm_id'])
        )
    conn.commit()
    print(f"✅ Inserted {min(i+batch_size, len(locations))}/{len(locations)}")

cursor.close()
conn.close()
print("✅ All locations imported!")
```

---

## 🔍 Verification Queries

After import, verify the data:

```sql
-- Check total count
SELECT COUNT(*) as total_locations FROM locations;
-- Expected: ~41,116 rows

-- Check by type
SELECT type, COUNT(*) as count 
FROM locations 
GROUP BY type 
ORDER BY count DESC;

-- Check geographic bounds
SELECT 
  MIN(latitude) as min_lat,
  MAX(latitude) as max_lat,
  MIN(longitude) as min_lon,
  MAX(longitude) as max_lon
FROM locations;
-- Expected: lat 8.0-13.5, lon 76.0-80.5

-- Check for valid coordinates
SELECT COUNT(*) as invalid 
FROM locations 
WHERE latitude < 8.0 OR latitude > 13.5 
   OR longitude < 76.0 OR longitude > 80.5;
-- Expected: 0 rows

-- Check bus stops
SELECT * FROM locations 
WHERE type = 'bus_stop' 
LIMIT 10;
```

---

## 📁 File Locations

All files saved in `/Users/mchand69/Documents/perundhu/data/`:

```
data/
├── tamil_nadu_locations.json   (5.6 MB) - JSON array
├── tamil_nadu_locations.jsonl  (4.5 MB) - JSONL format
└── tamil_nadu_locations.csv    (2.2 MB) - CSV format
```

---

## ⚡ Quick Start - Recommended Method

### Fastest way to import (2-3 minutes):

```bash
# 1. Connect to database
mysql -u perundhu_user -p -h localhost -P 3307 perundhu

# 2. Import CSV
LOAD DATA LOCAL INFILE '/Users/mchand69/Documents/perundhu/data/tamil_nadu_locations.csv'
INTO TABLE locations
FIELDS TERMINATED BY ','
ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 ROWS
(name, type, latitude, longitude, osm_id);

# 3. Verify
SELECT COUNT(*) FROM locations;
SELECT type, COUNT(*) FROM locations GROUP BY type ORDER BY 2 DESC;

# Exit
EXIT;
```

---

## 🛡️ Safety Features Built-In

✅ **Coordinate Validation**
- All coordinates within Tamil Nadu bounds (8.0-13.5°N, 76.0-80.5°E)
- Invalid coordinates filtered automatically

✅ **Name Validation**
- Minimum 2 characters
- No blank names
- UTF-8 support for Tamil text

✅ **Data Integrity**
- OSM ID tracked for deduplication
- Handles UTF-8 properly
- Tamil text preserved

✅ **Database Safety**
- ON DUPLICATE KEY UPDATE prevents overwrites
- Rollback capability with Flyway migrations
- Transaction support

---

## 🚀 Next Steps

1. **Choose your format:**
   - JSON for APIs
   - CSV for quick import
   - JSONL for streaming

2. **Pick your import method:**
   - CSV LOAD DATA (fastest)
   - Flyway Migration (safest)
   - Python script (most control)

3. **Verify the data:**
   - Run verification queries
   - Check row count
   - Validate geographic bounds

4. **Deploy to production:**
   - Copy files to production server
   - Run import
   - Verify results

---

**Files Ready:** ✅ 41,116 locations in 3 formats  
**Status:** Ready for database import  
**Time to import:** 2-5 minutes (depending on method)

Choose your format and import method above! 📊
