# Reset Cloud SQL Password via Terraform

## Overview

Yes, you can absolutely reset the Cloud SQL password through Terraform. The password is:
1. **Generated** by Terraform as a random 32-character password (`random_password.db_password`)
2. **Stored** in Google Secret Manager (`db-password` secret)
3. **Applied** to the Cloud SQL user during creation

Since the database module has `lifecycle { ignore_changes = [password] }` on the user resource, Terraform won't automatically recreate the user on every apply, but you can force a password reset.

---

## How It Works Currently

### Database Module (`infrastructure/terraform/modules/database/main.tf`)

```hcl
# Generate random password for database
resource "random_password" "db_password" {
  length  = 32
  special = true
}

# Database user with lifecycle to ignore password changes
resource "google_sql_user" "users" {
  name     = var.database_user
  instance = google_sql_database_instance.mysql_instance.name
  password = random_password.db_password.result  # Initial password
  host     = "%"
  type     = "BUILT_IN"

  lifecycle {
    ignore_changes = [password]  # ← Prevents Terraform from constantly recreating user
  }
}
```

### Secrets Module (`infrastructure/terraform/modules/secrets/main.tf`)

The password is automatically stored in Secret Manager:

```hcl
resource "google_secret_manager_secret" "db_password" {
  secret_id = "db-password"
  replication {
    auto {}
  }
}

resource "google_secret_manager_secret_version" "db_password" {
  secret      = google_secret_manager_secret.db_password.id
  secret_data = var.db_password  # From database module output
}
```

---

## How to Reset the Password

### Option 1: Force Terraform to Regenerate (Recommended)

Run `terraform taint` to force Terraform to recreate the random password and user:

```bash
cd infrastructure/terraform/environments/preprod

# Taint the random password resource to force regeneration
terraform taint 'module.database.random_password.db_password'

# Taint the database user to force recreation
terraform taint 'module.database.google_sql_user.users'

# Apply changes
terraform apply

# Verify the password was updated in Secret Manager
gcloud secrets versions list db-password --project=astute-strategy-406601 --limit=3
```

**What happens:**
1. Terraform generates a new 32-character random password
2. Terraform recreates the Cloud SQL user with the new password
3. The secrets module automatically updates Secret Manager with the new password
4. The `sync-db-password.sh` script can then sync it across all services

### Option 2: Manual Password Generation & Update

If you want to use a custom password:

```bash
cd infrastructure/terraform/environments/preprod

# Edit terraform.tfvars or pass it via command line
# Option A: Update the variables
# Option B: Override during apply:

terraform apply -var="database_user=perundhu_user"
```

---

## Complete Reset Workflow

### Step 1: Regenerate the Password in Terraform

```bash
cd infrastructure/terraform/environments/preprod

# Taint resources to force regeneration
terraform taint 'module.database.random_password.db_password'
terraform taint 'module.database.google_sql_user.users'

# Plan to see what will change
terraform plan

# Apply the changes
terraform apply

# Wait for Cloud SQL user to be recreated (30-60 seconds)
sleep 60
```

### Step 2: Verify Password in Secret Manager

```bash
# Check the new secret version was created
gcloud secrets versions list db-password \
  --project=astute-strategy-406601 \
  --limit=3

# View the new password (for testing)
gcloud secrets versions access latest \
  --secret=db-password \
  --project=astute-strategy-406601
```

### Step 3: Sync Password to Cloud SQL User

```bash
cd /Users/mchand69/Documents/perundhu

# Run the sync script to ensure consistency
bash sync-db-password.sh
```

### Step 4: Update Cloud Run Environment

```bash
cd infrastructure/terraform/environments/preprod

# The Cloud Run deployment should automatically pick up the new password
# from Secret Manager when it starts. You may need to redeploy:

terraform apply -target=module.cloud_run
```

### Step 5: Test Connection

```bash
# Test the connection with new credentials
source .venv/bin/activate
python3 test_conn_after_sync.py
```

---

## Why Lifecycle Ignore_Changes?

The `lifecycle { ignore_changes = [password] }` is intentional because:

1. **Prevents accidental password changes** - Every `terraform apply` won't reset the password
2. **Allows manual password management** - You can update password via `sync-db-password.sh`
3. **Avoids constant user recreation** - Improves Terraform stability

To force a password reset, you must explicitly taint the resource.

---

## Important Notes

- **Shared Resources**: The `db-password` secret is shared across all environments (preprod, production)
- **Secret Versions**: Each reset creates a new version in Secret Manager. Old versions are retained.
- **User Recreation**: When you taint the user, Terraform will:
  1. Delete the existing user
  2. Create a new user with the same name but new password
  3. The readonly user (`perundhu_user_readonly`) should be tainted separately if needed

---

## Command Reference

```bash
# Check current password version
gcloud secrets versions list db-password --project=astute-strategy-406601

# Force password regeneration
cd infrastructure/terraform/environments/preprod
terraform taint 'module.database.random_password.db_password'
terraform taint 'module.database.google_sql_user.users'
terraform apply

# Verify in Cloud SQL
gcloud sql users list \
  --instance=perundhu-preprod-mysql \
  --project=astute-strategy-406601 \
  --format="table(name,host)"
```

---

## Troubleshooting

**If user deletion fails with "Operation DROP USER failed":**

Run the sync script to clean up malformed entries:
```bash
cd /Users/mchand69/Documents/perundhu
bash sync-db-password.sh
```

**If Terraform apply hangs:**

The Cloud SQL operations can take time. Use `Ctrl+C` and check the Cloud SQL instance status:
```bash
gcloud sql instances describe perundhu-preprod-mysql \
  --project=astute-strategy-406601
```

