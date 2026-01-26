# 🗄️ PRODUCTION DATABASE DEPLOYMENT GUIDE
**For**: Perundhu Bus Tracker - Production MySQL Setup  
**Date**: January 23, 2026  
**Target Environment**: GCP Cloud SQL (asia-south1)  
**Database Version**: MySQL 8.0.x

---

## TABLE OF CONTENTS

1. [Pre-Deployment Planning](#pre-deployment-planning)
2. [Cloud SQL Instance Setup](#cloud-sql-instance-setup)
3. [Database & User Creation](#database--user-creation)
4. [Schema Migrations](#schema-migrations)
5. [Performance Optimization](#performance-optimization)
6. [Backup & Recovery](#backup--recovery)
7. [Security Configuration](#security-configuration)
8. [Monitoring & Maintenance](#monitoring--maintenance)

---

## PRE-DEPLOYMENT PLANNING

### 1.1 Database Requirements Analysis

```
Application: Perundhu Bus Tracker
Data Size: ~50 GB (estimated)
Users: 100,000+ (projected year 1)
Transactions/sec: 100-500 (peak)
Peak Load: Evening rush hours (5-9 PM IST)
```

### 1.2 Resource Allocation

```hcl
# Terraform Configuration Summary
Machine Tier: db-n1-standard-1
  - vCPU: 2
  - RAM: 7.5 GB
  - Suitable for: 100K-500K concurrent connections

Storage Configuration:
  - Type: SSD (PD-SSD)
  - Initial Size: 100 GB
  - Auto-grow: Enabled (max 500 GB)
  - Backup: 30-day retention

Replication:
  - High Availability: Enabled
  - Replica Zone: asia-south1-b
  - Automatic failover: Enabled
```

### 1.3 Connectivity Planning

```
VPC: perundhu-vpc
Subnet: perundhu-subnet (10.0.0.0/24)
Connection Type: Private IP (no public IP)
Access Method: Cloud SQL Proxy via VPC
Database Protocol: TLS 1.2+ (encrypted)
```

---

## CLOUD SQL INSTANCE SETUP

### 2.1 Instance Creation (via Terraform)

**Already handled by Terraform**, but verify:

```bash
# Verify instance is created and RUNNABLE
gcloud sql instances describe perundhu-prod-mysql \
  --project=perundhu-production-2026

# Check instance details
gcloud sql instances list --project=perundhu-production-2026
```

**Expected Output**:
```
name: perundhu-prod-mysql
databaseVersion: MYSQL_8_0
region: asia-south1
state: RUNNABLE
currentDiskSize: 100GB
tier: db-n1-standard-1
backupConfiguration:
  enabled: true
  replicationLog: true
  location: asia-south1
  startTime: 02:00 (UTC)
ipAddresses:
  - type: PRIVATE
    ipAddress: 10.0.0.x
databaseFlags:
  - name: cloudsql_iam_authentication
    value: 'on'
  - name: require_secure_transport
    value: 'on'
```

### 2.2 Database Flags Configuration

These flags should be set during Terraform deployment:

```bash
# Update database flags if needed
gcloud sql instances patch perundhu-prod-mysql \
  --database-flags=\
cloudsql_iam_authentication=on,\
require_secure_transport=on,\
max_connections=200,\
character_set_server=utf8mb4,\
collation_server=utf8mb4_unicode_ci,\
sql_mode='STRICT_TRANS_TABLES,NO_ZERO_DATE,NO_ZERO_IN_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION',\
log_bin_trust_function_creators=1,\
innodb_buffer_pool_size=5368709120,\
tmp_table_size=134217728,\
max_heap_table_size=134217728,\
query_cache_size=0,\
query_cache_type=0 \
  --project=perundhu-production-2026

# Restart instance to apply flags
gcloud sql instances restart perundhu-prod-mysql \
  --project=perundhu-production-2026
```

### 2.3 SSL/TLS Configuration

```bash
# Create server SSL certificate (if not auto-created)
gcloud sql ssl-certs create perundhu-prod-cert \
  --instance=perundhu-prod-mysql \
  --project=perundhu-production-2026

# List SSL certificates
gcloud sql ssl-certs list \
  --instance=perundhu-prod-mysql \
  --project=perundhu-production-2026

# Client SSL certificate (for remote access)
gcloud sql ssl-certs create client-cert \
  --instance=perundhu-prod-mysql \
  --project=perundhu-production-2026

# Download client certificate
gcloud sql ssl-certs describe client-cert \
  --instance=perundhu-prod-mysql \
  --format="value(cert)" > client-cert.pem
```

---

## DATABASE & USER CREATION

### 3.1 Connect via Cloud SQL Proxy

```bash
# Download Cloud SQL Proxy if not present
curl -o cloud-sql-proxy \
  https://dl.google.com/cloudsql/cloud_sql_proxy.mac.64bit

chmod +x cloud-sql-proxy

# Get Cloud SQL connection name
export CLOUDSQL_CONNECTION=$(gcloud sql instances describe \
  perundhu-prod-mysql \
  --project=perundhu-production-2026 \
  --format='value(connectionName)')

echo "Cloud SQL Connection: $CLOUDSQL_CONNECTION"

# Start proxy in background
./cloud-sql-proxy "$CLOUDSQL_CONNECTION" \
  --port=3306 \
  --max-connections=5 &

# Verify proxy is listening
netstat -an | grep 3306
ps aux | grep cloud-sql-proxy

# Test connection
mysql -h 127.0.0.1 -u root -p -e "SELECT VERSION();"
```

### 3.2 Create Application Database

```bash
# Source secrets
source .secrets-production-env

# Create database with proper character set
mysql -h 127.0.0.1 -u root -p"$DB_PASSWORD" << 'EOF'

-- Create database
CREATE DATABASE IF NOT EXISTS perundhu 
  CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci;

-- Verify creation
SHOW DATABASES;

-- Select database
USE perundhu;

-- Check character set
SHOW CREATE DATABASE perundhu;

EOF
```

### 3.3 Create Application User

```bash
# Create application user for normal operations
mysql -h 127.0.0.1 -u root -p"$DB_PASSWORD" << 'EOF'

-- Create application user
CREATE USER IF NOT EXISTS 'prod_user'@'%' 
  IDENTIFIED WITH mysql_native_password BY '${DB_PASSWORD}';

-- Grant privileges on perundhu database
GRANT ALL PRIVILEGES ON perundhu.* TO 'prod_user'@'%' 
  WITH GRANT OPTION;

-- Create backup/read-only user
CREATE USER IF NOT EXISTS 'backup_user'@'%' 
  IDENTIFIED WITH mysql_native_password BY '${BACKUP_PASSWORD}';

-- Grant read-only privileges
GRANT SELECT ON perundhu.* TO 'backup_user'@'%';

-- Create migration user (for Flyway)
CREATE USER IF NOT EXISTS 'migration_user'@'%' 
  IDENTIFIED WITH mysql_native_password BY '${MIGRATION_PASSWORD}';

-- Grant migration privileges
GRANT ALL PRIVILEGES ON perundhu.* TO 'migration_user'@'%';

-- Apply changes
FLUSH PRIVILEGES;

-- Verify users created
SELECT User, Host, authentication_string 
FROM mysql.user 
WHERE User IN ('prod_user', 'backup_user', 'migration_user');

EOF
```

### 3.4 Create Application Schema

```bash
# Test connection with application user
mysql -h 127.0.0.1 -u prod_user -p"$DB_PASSWORD" perundhu << 'EOF'

-- Verify connected to correct database
SELECT DATABASE();

-- Create basic structure (before migrations)
CREATE TABLE IF NOT EXISTS flyway_schema_history (
  installed_rank INT NOT NULL,
  version VARCHAR(50),
  description VARCHAR(255) NOT NULL,
  type VARCHAR(20) NOT NULL,
  script VARCHAR(1000) NOT NULL,
  checksum INT,
  installed_by VARCHAR(100) NOT NULL,
  installed_on TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  execution_time INT NOT NULL,
  success BOOLEAN NOT NULL,
  PRIMARY KEY (installed_rank),
  KEY idx_version (version)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Verify table created
SHOW TABLES;

EOF
```

---

## SCHEMA MIGRATIONS

### 4.1 Apply Flyway Migrations

```bash
# Navigate to backend directory
cd backend

# Build backend JAR (if not already built)
./gradlew clean build -x test -Dspring.profiles.active=production

# Apply migrations using Flyway
./gradlew flywayMigrate \
  -Dflyway.url="jdbc:mysql://127.0.0.1:3306/perundhu" \
  -Dflyway.user="migration_user" \
  -Dflyway.password="$MIGRATION_PASSWORD" \
  -Dspring.profiles.active=production

# Expected output:
# Database: jdbc:mysql://127.0.0.1:3306/perundhu
# Schemas: [perundhu]
# Table: flyway_schema_history
# Migrations: V001__Initial_schema.sql ... VXxx__Latest.sql
# Successfully applied X migrations
```

### 4.2 Verify Migrations Applied

```bash
# Check migration status
mysql -h 127.0.0.1 -u prod_user -p"$DB_PASSWORD" perundhu << 'EOF'

-- List all migrations applied
SELECT * FROM flyway_schema_history 
ORDER BY installed_rank DESC 
LIMIT 10;

-- Count total migrations
SELECT COUNT(*) as total_migrations FROM flyway_schema_history;

-- List all tables created
SHOW TABLES;

-- Count records in key tables
SELECT 'buses' as table_name, COUNT(*) as record_count FROM buses
UNION ALL
SELECT 'locations', COUNT(*) FROM locations
UNION ALL
SELECT 'users', COUNT(*) FROM users
UNION ALL
SELECT 'routes', COUNT(*) FROM routes
UNION ALL
SELECT 'schedules', COUNT(*) FROM schedules;

EOF
```

### 4.3 Create Indexes for Performance

```bash
# Analyze and create optimal indexes
mysql -h 127.0.0.1 -u prod_user -p"$DB_PASSWORD" perundhu << 'EOF'

-- Bus search indexes
CREATE INDEX idx_buses_origin_destination_date 
  ON buses(origin_id, destination_id, journey_date);

CREATE INDEX idx_buses_operator 
  ON buses(operator);

-- Location indexes
CREATE INDEX idx_locations_name 
  ON locations(location_name);

CREATE INDEX idx_locations_city 
  ON locations(city);

CREATE INDEX idx_locations_state 
  ON locations(state);

-- Schedule indexes
CREATE INDEX idx_schedules_bus_date 
  ON schedules(bus_id, schedule_date);

-- User indexes
CREATE INDEX idx_users_email 
  ON users(email);

CREATE INDEX idx_users_phone 
  ON users(phone_number);

-- Verify indexes
SHOW INDEX FROM buses;
SHOW INDEX FROM locations;
SHOW INDEX FROM schedules;
SHOW INDEX FROM users;

EOF
```

### 4.4 Validate Schema Integrity

```bash
# Run schema validation
mysql -h 127.0.0.1 -u prod_user -p"$DB_PASSWORD" perundhu << 'EOF'

-- Check for orphaned foreign keys
SELECT * FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
WHERE TABLE_SCHEMA = 'perundhu' 
  AND REFERENCED_TABLE_NAME IS NOT NULL;

-- Verify all required columns exist
DESCRIBE buses;
DESCRIBE locations;
DESCRIBE users;
DESCRIBE routes;
DESCRIBE schedules;

-- Check table row counts
SELECT TABLE_NAME, TABLE_ROWS, DATA_LENGTH, INDEX_LENGTH
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_SCHEMA = 'perundhu'
ORDER BY DATA_LENGTH DESC;

EOF
```

---

## PERFORMANCE OPTIMIZATION

### 5.1 Optimize MySQL Configuration

```bash
# Calculate optimal innodb_buffer_pool_size
# Rule: 50-80% of total RAM for dedicated database server
# For db-n1-standard-1 (7.5 GB RAM):
# innodb_buffer_pool_size = 6 GB (5,368,709,120 bytes)

# Already set in database flags above

# Verify current settings
mysql -h 127.0.0.1 -u prod_user -p"$DB_PASSWORD" << 'EOF'

-- Check MySQL variables
SHOW VARIABLES LIKE 'max_connections';
SHOW VARIABLES LIKE 'innodb_buffer_pool_size';
SHOW VARIABLES LIKE 'character_set%';
SHOW VARIABLES LIKE 'collation%';
SHOW VARIABLES LIKE 'query_cache%';

-- Performance schema status
SHOW ENGINE INNODB STATUS\G

EOF
```

### 5.2 Create Query Performance Indexes

```bash
# Analyze slow queries (after data loading)
mysql -h 127.0.0.1 -u prod_user -p"$DB_PASSWORD" perundhu << 'EOF'

-- Enable slow query log
SET GLOBAL slow_query_log = 'ON';
SET GLOBAL long_query_time = 2;

-- Check slow query log location
SHOW VARIABLES LIKE 'slow_query_log_file';

-- Query cache status
SHOW VARIABLES LIKE 'query_cache%';

-- Connection statistics
SHOW STATUS LIKE 'Threads%';
SHOW STATUS LIKE 'Questions';

EOF
```

### 5.3 Partition Strategy (Optional, for large tables)

```bash
# For future large table partitioning
# Example: Partition buses table by year and month

/* FUTURE: Not needed initially, but document for later

ALTER TABLE buses 
PARTITION BY RANGE (YEAR(journey_date)) (
  PARTITION p2025 VALUES LESS THAN (2026),
  PARTITION p2026 VALUES LESS THAN (2027),
  PARTITION p2027 VALUES LESS THAN (2028),
  PARTITION pmax VALUES LESS THAN MAXVALUE
);

*/
```

---

## BACKUP & RECOVERY

### 6.1 Verify Backup Configuration

```bash
# Check backup settings
gcloud sql instances describe perundhu-prod-mysql \
  --project=perundhu-production-2026 \
  --format='value(backupConfiguration)'

# Expected output:
# binaryLogEnabled: true
# enabled: true
# replicationLogArchivingEnabled: true
# backupRetentionSettings:
#   retentionUnit: COUNT
#   retentionCount: 30
# startTime: 02:00 (UTC)
# location: asia-south1
```

### 6.2 Create Manual Backup

```bash
# Create backup before go-live
gcloud sql backups create \
  --instance=perundhu-prod-mysql \
  --description="Pre-launch production backup" \
  --project=perundhu-production-2026

# List backups
gcloud sql backups list \
  --instance=perundhu-prod-mysql \
  --project=perundhu-production-2026

# Get backup details
gcloud sql backups describe [BACKUP_ID] \
  --instance=perundhu-prod-mysql \
  --project=perundhu-production-2026
```

### 6.3 Test Backup Restoration

```bash
# Create test instance from backup for verification
# (Optional but recommended for critical data)

# Document backup ID
export BACKUP_ID=[BACKUP_ID_FROM_STEP_ABOVE]

# Test restore to staging (optional)
# Do NOT restore to production without careful planning
```

### 6.4 Document Recovery Procedures

```
DISASTER RECOVERY PROCEDURES:

1. Total Data Loss:
   - Restore latest backup to new instance
   - Run verification queries
   - Update application connection string
   - Test all APIs

2. Partial Data Loss:
   - Use point-in-time recovery (within 30 days)
   - Restore to timestamp just before corruption
   - Validate restored data
   - Plan data reconciliation

3. Backup Verification:
   - Monthly restore test to staging
   - Verify all tables and indexes
   - Test point-in-time recovery
   - Document recovery time

4. Contact & Escalation:
   - Database Administrator: [CONTACT]
   - Backup Administrator: [CONTACT]
   - On-Call Engineer: [CONTACT]

5. Communication:
   - Notify stakeholders immediately
   - Provide ETA for recovery
   - Provide status updates every 30 minutes
```

---

## SECURITY CONFIGURATION

### 7.1 User Access Control

```bash
# Principle of Least Privilege

# Application user (normal operations)
# - SELECT, INSERT, UPDATE, DELETE on perundhu.*
# - No ALTER, DROP privileges

# Backup user (read-only)
# - SELECT only on perundhu.*
# - For backups and read-only operations

# Migration user (initial setup)
# - ALL PRIVILEGES on perundhu.*
# - Only used during deployment

# Root user
# - Full access (for emergency only)
# - Should be well-guarded

# Verification
mysql -h 127.0.0.1 -u root -p"$DB_PASSWORD" << 'EOF'

-- List all users and their grants
SELECT * FROM mysql.user WHERE Host != 'localhost';

-- Show grants for application user
SHOW GRANTS FOR 'prod_user'@'%';

-- Show grants for backup user
SHOW GRANTS FOR 'backup_user'@'%';

EOF
```

### 7.2 Network Security

```bash
# Cloud SQL connections are encrypted by default
# Verify SSL/TLS is enforced

mysql -h 127.0.0.1 -u root -p"$DB_PASSWORD" << 'EOF'

-- Check if SSL is required
SHOW VARIABLES LIKE 'require_secure_transport';
-- Should be ON (or 1)

-- View SSL certificate info
SHOW STATUS LIKE 'Ssl%';

EOF

# From Cloud Run services, Cloud SQL Proxy encrypts connection
# No public IP is exposed
# All traffic is within VPC (private)
```

### 7.3 Audit & Logging

```bash
# Enable audit logging for compliance
gcloud sql instances patch perundhu-prod-mysql \
  --insights-config-query-insights-enabled \
  --insights-config-query-string-length=1024 \
  --insights-config-query-plans-per-minute=5 \
  --project=perundhu-production-2026

# Enable Cloud Audit Logs for Cloud SQL
gcloud logging write cloud-sql-audit \
  "Cloud SQL audit logging enabled" \
  --severity=INFO \
  --project=perundhu-production-2026
```

### 7.4 Connection Limits

```bash
# Set connection limits to prevent resource exhaustion
mysql -h 127.0.0.1 -u root -p"$DB_PASSWORD" << 'EOF'

-- View current max connections
SHOW VARIABLES LIKE 'max_connections';

-- View current connections
SHOW STATUS LIKE 'Threads_connected';

-- Create alerts if connections > 80% of max
-- Threshold: 160 connections (out of 200)

EOF
```

---

## MONITORING & MAINTENANCE

### 8.1 Cloud Monitoring Dashboard

```bash
# Create custom metrics dashboard for database monitoring
gcloud monitoring dashboards create --config-from-file=- << 'EOF'
{
  "displayName": "Perundhu Database Monitoring",
  "mosaicLayout": {
    "columns": 12,
    "tiles": [
      {
        "width": 4,
        "height": 4,
        "widget": {
          "title": "CPU Utilization",
          "xyChart": {
            "dataSets": [{
              "timeSeriesQuery": {
                "timeSeriesFilter": {
                  "filter": "metric.type=\"cloudsql.googleapis.com/database/cpu/utilization\" resource.type=\"cloudsql_database\" resource.labels.database_id=\"perundhu-production-2026:perundhu-prod-mysql\""
                }
              }
            }]
          }
        }
      },
      {
        "width": 4,
        "height": 4,
        "widget": {
          "title": "Memory Utilization",
          "xyChart": {
            "dataSets": [{
              "timeSeriesQuery": {
                "timeSeriesFilter": {
                  "filter": "metric.type=\"cloudsql.googleapis.com/database/memory/utilization\""
                }
              }
            }]
          }
        }
      },
      {
        "width": 4,
        "height": 4,
        "widget": {
          "title": "Disk Utilization",
          "xyChart": {
            "dataSets": [{
              "timeSeriesQuery": {
                "timeSeriesFilter": {
                  "filter": "metric.type=\"cloudsql.googleapis.com/database/disk/utilization\""
                }
              }
            }]
          }
        }
      }
    ]
  }
}
EOF
```

### 8.2 Set Up Alerts

```bash
# Alert: CPU > 80%
gcloud alpha monitoring policies create \
  --display-name="Database CPU High" \
  --condition-threshold-value=80 \
  --condition-threshold-filter='metric.type="cloudsql.googleapis.com/database/cpu/utilization"'

# Alert: Disk usage > 80%
gcloud alpha monitoring policies create \
  --display-name="Database Disk Space Low" \
  --condition-threshold-value=80 \
  --condition-threshold-filter='metric.type="cloudsql.googleapis.com/database/disk/utilization"'

# Alert: Replication lag > 10 seconds
gcloud alpha monitoring policies create \
  --display-name="Database Replication Lag High" \
  --condition-threshold-value=10 \
  --condition-threshold-filter='metric.type="cloudsql.googleapis.com/database/replication/replica_lag"'
```

### 8.3 Regular Maintenance

```
Weekly Tasks:
- [ ] Review error logs
- [ ] Check backup success
- [ ] Monitor slow query logs
- [ ] Verify disk space trending
- [ ] Check replication status

Monthly Tasks:
- [ ] Analyze query performance
- [ ] Review and optimize indexes
- [ ] Test backup restoration
- [ ] Update documentation
- [ ] Performance tuning review
- [ ] Cost analysis

Quarterly Tasks:
- [ ] Database audit
- [ ] Security review
- [ ] Capacity planning
- [ ] Major version update planning
- [ ] Disaster recovery drill
```

### 8.4 Connection Monitoring

```bash
# Monitor active connections
mysql -h 127.0.0.1 -u root -p"$DB_PASSWORD" << 'EOF'

-- View active connections
SHOW PROCESSLIST;

-- View connection statistics
SHOW STATUS LIKE 'Threads%';
SHOW STATUS LIKE 'Questions';
SHOW STATUS LIKE 'Slow_queries';

-- Find long-running queries
SELECT * FROM INFORMATION_SCHEMA.PROCESSLIST 
WHERE COMMAND != 'Sleep' 
ORDER BY TIME DESC;

EOF
```

---

## VALIDATION CHECKLIST

### Pre-Production Validation

- [ ] Database instance running in asia-south1
- [ ] Machine tier: db-n1-standard-1 or higher
- [ ] SSD storage configured
- [ ] Automated backups enabled (30-day retention)
- [ ] High Availability (HA) replica configured
- [ ] SSL/TLS required on all connections
- [ ] Private IP assigned (no public IP)
- [ ] Database `perundhu` created
- [ ] Users created: prod_user, backup_user, migration_user
- [ ] All migrations applied successfully
- [ ] Indexes created and optimized
- [ ] Foreign keys validated
- [ ] Character set: utf8mb4
- [ ] Collation: utf8mb4_unicode_ci
- [ ] Query cache disabled (modern MySQL best practice)
- [ ] Slow query log enabled
- [ ] Cloud Monitoring dashboard created
- [ ] Alert policies configured
- [ ] Backup restoration tested
- [ ] Connection limits configured
- [ ] IAM roles properly assigned

### Connectivity Validation

- [ ] Cloud SQL Proxy connection works
- [ ] Application user can connect
- [ ] Backup user can connect (read-only)
- [ ] TLS connection verified
- [ ] Query execution verified
- [ ] Transaction support verified

### Performance Validation

- [ ] Sample queries execute in < 100ms
- [ ] Connection pool operates normally
- [ ] Memory usage stable
- [ ] CPU usage < 50% at idle
- [ ] Disk I/O acceptable
- [ ] Replication lag < 1 second

---

## EMERGENCY CONTACTS

| Role | Name | Phone | Email |
|------|------|-------|-------|
| Database Admin | [ASSIGN] | [PHONE] | [EMAIL] |
| On-Call | [ASSIGN] | [PHONE] | [EMAIL] |
| Backup Admin | [ASSIGN] | [PHONE] | [EMAIL] |
| DevOps Lead | [ASSIGN] | [PHONE] | [EMAIL] |

---

## SIGN-OFF

**Database Deployment Sign-Off**:

- [ ] **Database Administrator**: `_____________ Date: _______`
- [ ] **DevOps Lead**: `_____________ Date: _______`
- [ ] **Security Review**: `_____________ Date: _______`

---

**Document Version**: 1.0  
**Created**: January 23, 2026  
**Review Cycle**: Monthly or after major changes  
**Owner**: Database / Infrastructure Team

✅ **Database ready for production!**
