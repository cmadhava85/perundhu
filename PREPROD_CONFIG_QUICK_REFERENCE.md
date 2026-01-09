# Preprod Configuration - Quick Reference (January 8, 2024)

## ✅ APPLICATION PROPERTIES STATUS: UP-TO-DATE

### Key Secrets Configuration
| Secret/Config | Value | Status | Source |
|---|---|---|---|
| Database Password | DB_PASSWORD | ✅ | GCP Secret: db-password |
| Database Username | perundhu_user | ✅ | Env var: DB_USERNAME |
| JWT Secret | ${JWT_SECRET:...} | ✅ | GCP Secret: preprod-jwt-secret |
| Admin Username | ${ADMIN_USERNAME:admin} | ✅ | GCP Secret: admin-username |
| Admin Password | ${ADMIN_PASSWORD:password} | ✅ | GCP Secret: admin-password |
| Gemini API Key | ${GEMINI_API_KEY} | ✅ | GCP Secret: gemini-api-key |
| reCAPTCHA Site Key | ${RECAPTCHA_SITE_KEY:} | ✅ | Env var (currently empty) |
| reCAPTCHA Secret Key | ${RECAPTCHA_SECRET_KEY:} | ✅ | Env var (currently empty) |

### Database Configuration
```
Instance: astute-strategy-406601:asia-south1:perundhu-preprod-mysql
Database: perundhu
User: perundhu_user (env var)
Password: From GCP Secret (db-password:latest)
Connection Pool: 0-10 instances (min-idle=0, max-pool-size=10)
Flyway: Disabled (migrations run via CD pipeline before deployment)
```

### Security Features
```
Rate Limiting: ✅ Enabled (100 read, 20 write, 10 upload/min)
Origin Validation: ✅ Enabled (non-strict for testing)
Honeypot: ✅ Enabled
IP Filtering: ✅ Enabled
Security Monitoring: ✅ Enabled
Audit Logging: ✅ Enabled
Data Encryption: ⚠️ Disabled (can enable via DATA_ENCRYPTION_ENABLED env var)
reCAPTCHA: ⚠️ Enabled but unconfigured (keys empty)
```

### CD Pipeline Secrets
```bash
--update-secrets="
  DB_PASSWORD=db-password:latest,
  SPRING_DATASOURCE_PASSWORD=db-password:latest,
  GEMINI_API_KEY=gemini-api-key:latest,
  ADMIN_USERNAME=admin-username:latest,
  ADMIN_PASSWORD=admin-password:latest,
  JWT_SECRET=preprod-jwt-secret:latest
"
```

### Changes Made Today
- ✅ Updated reCAPTCHA to use env vars (was ${sm://...})
- ✅ Updated JWT to use env vars (was ${sm://preprod-jwt-secret})
- ✅ Updated Admin credentials to use env vars (was ${sm://...})
- ✅ Updated CD pipeline to pass reCAPTCHA keys and JWT_SECRET
- ✅ Fixed Cloud Run max_instances from 10 to 3

### What Needs to Exist in GCP Secret Manager
```
✅ db-password (auto-created by Terraform)
✅ db-username (auto-created by Terraform)  
✅ admin-username (from shared-secrets module)
✅ admin-password (from shared-secrets module)
✅ gemini-api-key (from shared-secrets module)
⚠️ preprod-jwt-secret (needed for JWT_SECRET in CD pipeline)
```

---

## 🚀 Deployment Ready
All application properties are now properly configured with environment variables instead of Spring Cloud Secret Manager references. The system is ready for deployment once all required GCP Secrets exist.

**Verify before deployment:**
```bash
# Check all required secrets exist
gcloud secrets list --project=astute-strategy-406601 | grep -E "db-password|admin-username|admin-password|gemini-api-key|preprod-jwt-secret"
```
