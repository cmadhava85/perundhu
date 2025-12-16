# GCP Secret Manager Integration

This document describes how secrets are managed in the Perundhu application for preprod and production environments.

## Overview

- **Local Development**: Uses environment variables with default values (no Secret Manager)
- **PreProd/Prod**: Secrets are read from GCP Secret Manager using the `sm://` prefix

## Terraform Structure

Secrets are managed by Terraform in two parts:

1. **Shared Secrets** (`infrastructure/terraform/environments/shared/`)
   - Apply ONCE per project
   - Contains: `gemini-api-key`, `PUBLIC_API_KEY`, `recaptcha-site-key`, `recaptcha-secret-key`

2. **Environment Secrets** (`infrastructure/terraform/environments/{preprod|production}/`)
   - Apply per environment
   - Contains: `{env}-db-url`, `{env}-db-username`, `{env}-db-password`, `{env}-jwt-secret`, `{env}-data-encryption-key`

## Required Secrets

### Shared Secrets (Same for all environments)

| Secret Name | Description | Source |
|------------|-------------|--------|
| `gemini-api-key` | Google Gemini API key | Manual input |
| `PUBLIC_API_KEY` | Frontend API key | Auto-generated |
| `recaptcha-site-key` | Google reCAPTCHA v3 site key | Manual input |
| `recaptcha-secret-key` | Google reCAPTCHA v3 secret key | Manual input |
| `admin-username` | Admin panel username | Manual input |
| `admin-password` | Admin panel password | Manual input |

### PreProd Environment (`preprod` profile)

| Secret Name | Description | Source |
|------------|-------------|--------|
| `preprod-db-url` | JDBC URL for preprod database | Terraform (from database module) |
| `preprod-db-username` | Preprod database username | Terraform (from database module) |
| `preprod-db-password` | Preprod database password | Terraform (auto-generated) |
| `preprod-jwt-secret` | JWT signing secret | Terraform (auto-generated) |
| `preprod-data-encryption-key` | Data encryption key (AES-256) | Terraform (auto-generated) |

### Production Environment (`production` profile)

| Secret Name | Description | Source |
|------------|-------------|--------|
| `production-db-url` | JDBC URL for production database | Terraform (from database module) |
| `production-db-username` | Production database username | Terraform (from database module) |
| `production-db-password` | Production database password | Terraform (auto-generated) |
| `production-jwt-secret` | JWT signing secret | Terraform (auto-generated) |
| `production-data-encryption-key` | Data encryption key (AES-256) | Terraform (auto-generated) |

## Terraform Deployment Order

```bash
export PROJECT_ID="astute-strategy-406601"

# 1. First, create shared secrets (ONCE)
cd infrastructure/terraform/environments/shared
terraform init
terraform apply \
  -var="project_id=$PROJECT_ID" \
  -var="gemini_api_key=YOUR_GEMINI_KEY" \
  -var="recaptcha_site_key=YOUR_SITE_KEY" \
  -var="recaptcha_secret_key=YOUR_SECRET_KEY"

# 2. Then, create preprod environment
cd ../preprod
terraform init
terraform apply \
  -var="project_id=$PROJECT_ID" \
  -var="notification_email=your@email.com"

# 3. Finally, create production environment
cd ../production
terraform init
terraform apply \
  -var="project_id=$PROJECT_ID" \
  -var="notification_email=your@email.com" \
  -var="container_image=gcr.io/$PROJECT_ID/perundhu-backend:latest"
```

## Manual Secret Creation (Alternative)

If not using Terraform, create secrets manually:

```bash
export PROJECT_ID="astute-strategy-406601"
gcloud config set project $PROJECT_ID

# Shared secrets (create once)
echo -n "your-gemini-api-key" | gcloud secrets create gemini-api-key --data-file=-
echo -n "your-recaptcha-site-key" | gcloud secrets create recaptcha-site-key --data-file=-
echo -n "your-recaptcha-secret-key" | gcloud secrets create recaptcha-secret-key --data-file=-

# Admin credentials for admin panel access
echo -n "your-admin-username" | gcloud secrets create admin-username --data-file=-
echo -n "your-strong-admin-password" | gcloud secrets create admin-password --data-file=-

# Production environment secrets
echo -n "jdbc:mysql://..." | gcloud secrets create production-db-url --data-file=-
echo -n "your-db-username" | gcloud secrets create production-db-username --data-file=-
echo -n "your-db-password" | gcloud secrets create production-db-password --data-file=-
echo -n "your-jwt-secret-key-at-least-64-chars" | gcloud secrets create production-jwt-secret --data-file=-
echo -n "your-32-character-encryption-key" | gcloud secrets create production-data-encryption-key --data-file=-
```

## Granting Access to Cloud Run Service

The Cloud Run service account needs access to read secrets:

```bash
# Get the service account email
export SA_EMAIL="perundhu-backend-sa@${PROJECT_ID}.iam.gserviceaccount.com"

# Grant access to each secret
gcloud secrets add-iam-policy-binding preprod-mysql-username \
    --member="serviceAccount:${SA_EMAIL}" \
    --role="roles/secretmanager.secretAccessor"

# Repeat for all secrets...
```

**Note**: The Terraform configuration already includes `roles/secretmanager.secretAccessor` for the service accounts.

## How It Works

1. **bootstrap.yml** - Configures Spring Cloud GCP Secret Manager based on active profile
2. **application-{profile}.properties** - References secrets using `${sm://secret-name}` syntax
3. **Spring Cloud GCP** - Resolves `sm://` prefixed values from GCP Secret Manager at application startup

## Local Development

For local development, the `application.properties` file uses environment variables with defaults:

```properties
spring.datasource.username=${DB_USERNAME:root}
spring.datasource.password=${DB_PASSWORD:root}
```

Secret Manager is **disabled** for local development (see `bootstrap.yml`).

## Security Notes

1. **Never commit secrets** to version control
2. **Rotate secrets regularly** - Update the secret version in GCP Secret Manager
3. **Use least privilege** - Only grant `secretAccessor` role to required service accounts
4. **Audit access** - Enable Cloud Audit Logs for Secret Manager operations
5. **Version your secrets** - GCP Secret Manager automatically versions secrets

## Troubleshooting

### Secret Not Found
```
com.google.cloud.secretmanager.v1.SecretManagerServiceClient: NOT_FOUND
```
- Verify the secret name matches exactly
- Check the project ID in bootstrap.yml
- Ensure the secret exists in GCP Secret Manager

### Permission Denied
```
PERMISSION_DENIED: Permission 'secretmanager.versions.access' denied
```
- Verify the service account has `roles/secretmanager.secretAccessor` role
- Check the IAM bindings on the specific secret

### Bootstrap Not Processing
- Ensure `spring-cloud-starter-bootstrap` dependency is included
- Verify `bootstrap.yml` is in `src/main/resources`
