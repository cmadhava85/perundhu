# Cloud SQL Complete Reference - All Details

## Executive Summary
The Perundhu project uses **Google Cloud SQL** (MySQL 8.0) for the Pre-Production environment. The database is configured with cost optimization in mind and deployed in the `asia-south1` region to match application services.

---

## 🗂️ Cloud SQL Instance Details

### **Pre-Production Environment**

| Property | Value | Notes |
|----------|-------|-------|
| **Instance Name** | `perundhu-preprod-mysql-asia` | Deployed in asia-south1 |
| **Database Version** | MySQL 8.0 | Fully managed by Google |
| **Region** | `asia-south1` | Mumbai region (low latency for India) |
| **Zone** | `asia-south1-a` | Primary zone |
| **Tier** | `db-f1-micro` | Smallest/cheapest tier (~$6-9/month) |
| **Disk Type** | HDD (PD_HDD) | 85% cheaper than SSD |
| **Disk Size** | 10 GB minimum | Auto-resizes up to 20 GB max |
| **Availability** | ZONAL | Single zone (cheaper than REGIONAL HA) |
| **Project ID** | `astute-strategy-406601` | GCP project where instance lives |

---

## 📊 Database Configuration

### **Database Details**

| Item | Configuration |
|------|----------------|
| **Database Name** | `perundhu` |
| **Database Charset** | `utf8mb4` |
| **Collation** | `utf8mb4_unicode_ci` |
| **Test Database** | `perundhu_test` (created) |

### **Database Users**

| User | Purpose | Host | Password |
|------|---------|------|----------|
| `perundhu_user` | Read/Write access | `%` (any host) | Generated (32 chars, special) |
| `perundhu_user_readonly` | Read-only access | `%` (any host) | Generated (32 chars, special) |

---

## 🔌 Connection Details

### **Connection String (JDBC - for Spring Boot)**
```
jdbc:mysql://google/perundhu?socketFactory=com.google.cloud.sql.mysql.SocketFactory&cloudSqlInstance=astute-strategy-406601:asia-south1:perundhu-preprod-mysql-asia&connectTimeout=60000&socketTimeout=120000
```

### **Cloud SQL Connection Name**
```
astute-strategy-406601:asia-south1:perundhu-preprod-mysql-asia
```

### **Direct Connection (via Cloud SQL Proxy)**
```bash
# Via Cloud SQL Proxy
cloud_sql_proxy -instances=astute-strategy-406601:asia-south1:perundhu-preprod-mysql-asia=tcp:3306

# Then connect locally on port 3306
mysql -h 127.0.0.1 -u perundhu_user -p
```

### **Using gcloud CLI**
```bash
gcloud sql connect perundhu-preprod-mysql-asia \
  --user=perundhu_user \
  --project=astute-strategy-406601
```

---

## 🔐 Security & Network

### **Network Configuration**
- **Public IP**: ❌ Disabled
- **Private IP**: ✅ Enabled (VPC network)
- **VPC Service Connection**: ✅ Private service connection for Google Cloud services
- **VPC Network**: Deployed in `perundhu-vpc` (private network)

### **Access Methods**
1. **Application (Cloud Run)**: Via private IP through VPC connector
2. **GitHub Actions (Migrations)**: Via Cloud SQL Proxy authenticated with GCP service account
3. **Manual Admin Access**: Via `gcloud sql connect` or Cloud SQL Proxy with authentication

### **Required IAM Roles**
- `roles/cloudsql.client` - Connect to Cloud SQL instance
- `roles/cloudsql.admin` - Manage instance (for CI/CD pipelines)

---

## ⚙️ Backup & Maintenance Configuration

### **Backup Settings**
| Setting | Value | Notes |
|---------|-------|-------|
| **Backups Enabled** | ❌ Disabled (preprod) | Enabled only in production |
| **Backup Start Time** | 02:00 UTC | Off-peak hours |
| **Retained Backups** | 3 | Reduced from 7 to save storage costs |
| **Retention Unit** | COUNT | Keep 3 recent backups |
| **Binary Logging** | ❌ Disabled | Saves ~$1/month on disk I/O |
| **Transaction Log Retention** | 1 day | Minimum retention |

### **Maintenance Window**
| Property | Value |
|----------|-------|
| **Day** | Sunday (day 7) |
| **Time** | 03:00 UTC |

### **Logging Configuration**
| Flag | Value | Purpose |
|------|-------|---------|
| `slow_query_log` | OFF (preprod) | Disabled for non-prod (saves disk I/O) |
| `general_log` | OFF | Disabled (saves disk space) |
| `log_output` | FILE | Logs written to file (not memory) |

---

## 📋 Infrastructure as Code (Terraform)

### **Terraform Module Location**
```
infrastructure/
  terraform/
    modules/
      database/
        main.tf          ← Cloud SQL instance/database/users
        variables.tf     ← Configuration options
        outputs.tf       ← Exports connection details
```

### **Terraform Environment Configuration**
```
infrastructure/
  terraform/
    environments/
      preprod/
        main.tf          ← Instantiates database module
        variables.tf     ← Preprod-specific values
        outputs.tf       ← Exports DB connection name
```

### **Key Terraform Variables** (from preprod/variables.tf)
```hcl
region                  = "asia-south1"
db_version              = "MYSQL_8_0"
db_instance_tier        = "db-f1-micro"
db_instance_name_suffix = "-asia"     # Makes instance name: perundhu-preprod-mysql-asia
```

### **Terraform Outputs**
The preprod environment exports:
- `db_connection_name` → `astute-strategy-406601:asia-south1:perundhu-preprod-mysql-asia`
- `db_username` → `perundhu_user`
- `database_url` → Full JDBC connection string

---

## 🔄 GitHub Actions Integration

### **CI/CD Pipeline References**

#### **CD Pipeline (cd-preprod-auto.yml)**
```yaml
# Cloud SQL Proxy for migrations
cloud_sql_proxy \
  -instances=astute-strategy-406601:asia-south1:perundhu-preprod-mysql-asia=tcp:3306 \
  --max-connections=5 &

# Environment variables for deployment
--set-env-vars="SPRING_PROFILES_ACTIVE=preprod,\
  GCP_INSTANCE_CONNECTION_NAME=astute-strategy-406601:asia-south1:perundhu-preprod-mysql-asia,...

# Cloud SQL connection for Cloud Run
--add-cloudsql-instances=astute-strategy-406601:asia-south1:perundhu-preprod-mysql-asia
```

#### **Database Management Workflow (database-management.yml)**
```yaml
# Backup management
instance: perundhu-preprod-mysql-asia
gcloud sql backups create --instance=${instance}
```

#### **Flyway Migrations**
```yaml
FLYWAY_URL: "jdbc:mysql://127.0.0.1:3306/perundhu?useSSL=false&allowPublicKeyRetrieval=true"
FLYWAY_USER: ${{ secrets.PREPROD_DB_USER }}
FLYWAY_PASSWORD: ${{ secrets.PREPROD_DB_PASSWORD }}
```

---

## 🧪 Application Configuration

### **Backend Application Properties**

#### **Preprod Profile** (application-preprod.properties)
```properties
spring.datasource.url=jdbc:mysql://google/perundhu?socketFactory=com.google.cloud.sql.mysql.SocketFactory&cloudSqlInstance=${GCP_INSTANCE_CONNECTION_NAME}&connectTimeout=60000&socketTimeout=120000
spring.jpa.hibernate.ddl-auto=validate
spring.jpa.show-sql=false
```

#### **Environment Variables Set by CI/CD**
```
GCP_INSTANCE_CONNECTION_NAME=astute-strategy-406601:asia-south1:perundhu-preprod-mysql-asia
DB_USERNAME=perundhu_user
MYSQL_USERNAME=perundhu_user
```

#### **Secrets (from Secret Manager)**
```
DB_PASSWORD → preprod-db-password (secret)
MYSQL_PASSWORD → preprod-db-password (secret)
```

---

## 🚀 Deployment Commands

### **Connect to Database (Manual)**
```bash
# Option 1: Using gcloud
gcloud sql connect perundhu-preprod-mysql-asia \
  --user=perundhu_user \
  --project=astute-strategy-406601

# Option 2: Using Cloud SQL Proxy
cloud_sql_proxy \
  -instances=astute-strategy-406601:asia-south1:perundhu-preprod-mysql-asia=tcp:3306 &

# Then in another terminal
mysql -h 127.0.0.1 -u perundhu_user -p
```

### **List Databases**
```bash
gcloud sql databases list \
  --instance=perundhu-preprod-mysql-asia \
  --project=astute-strategy-406601
```

### **List Users**
```bash
gcloud sql users list \
  --instance=perundhu-preprod-mysql-asia \
  --project=astute-strategy-406601
```

### **Check Instance Status**
```bash
gcloud sql instances describe perundhu-preprod-mysql-asia \
  --project=astute-strategy-406601
```

### **Create Manual Backup**
```bash
gcloud sql backups create \
  --instance=perundhu-preprod-mysql-asia \
  --project=astute-strategy-406601
```

---

## 📊 Cost Optimization Details

| Optimization | Saves Per Month | Status |
|--------------|-----------------|--------|
| db-f1-micro tier | ~$100 | ✅ Active |
| HDD disk instead of SSD | ~$8-10 | ✅ Active |
| ZONAL instead of REGIONAL | ~$10 | ✅ Active |
| Disabled backups (preprod) | ~$2 | ✅ Active |
| Disabled binary logging | ~$1 | ✅ Active |
| Disabled slow query log | ~$0.50 | ✅ Active |
| Disk max-resize limit (20 GB) | Prevents runaway | ✅ Active |

**Total Preprod Cost**: ~$6-9/month (extremely cost-effective)

---

## ⚠️ Important Notes

### **⚠️ CRITICAL: Region Mismatch Issue (FIXED)**
- **Before**: Database was in `us-central1`, but Cloud Run services were in `asia-south1`
- **After**: ✅ Database moved to `asia-south1` to match backend services
- **Impact**: Eliminates cross-region latency and data transfer costs

### **Database Lifecycle Management**
- `lifecycle { ignore_changes = [...] }` configured in Terraform
- Allows Terraform to manage the resource without destroying manually created instances
- Protects against accidental deletions

### **Charset & Collation**
- All data uses `utf8mb4` (supports emoji, special characters)
- Collation `utf8mb4_unicode_ci` for case-insensitive Unicode searches

### **Connection Pooling**
- Spring Boot manages connection pooling
- Cloud SQL Auth proxy handles authentication
- No manual pool configuration needed

---

## 📚 Related Documentation
- [Terraform Database Module](infrastructure/terraform/modules/database/)
- [CD Pipeline Configuration](.github/workflows/cd-preprod-auto.yml)
- [Backend Application Properties](backend/app/src/main/resources/)
- [Production Ready Checklist](PRODUCTION_READINESS_CHECKLIST.md)

---

## 🔗 Quick Links

**View all instances:**
```bash
gcloud sql instances list --project=astute-strategy-406601
```

**Check current database contents:**
```bash
gcloud sql databases list --instance=perundhu-preprod-mysql-asia --project=astute-strategy-406601
```

**Monitor instance health:**
```bash
gcloud sql operations list --instance=perundhu-preprod-mysql-asia --project=astute-strategy-406601
```

---

**Last Updated**: January 7, 2026  
**Environment**: Pre-Production  
**Status**: ✅ Fully Configured & Operational
