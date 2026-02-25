# Terraform Best Practices - Avoiding State and Resource Conflicts

## Overview

This guide addresses the two main issues encountered during deployment:
1. **State conflicts** (stale plans, concurrent modifications)
2. **Resource already exists errors** (infrastructure exists but not in state)

---

## 1. Remote State Backend (CRITICAL - Implement First)

### Problem We Had:
- Local state file (`terraform.tfstate`) on single machine
- No locking mechanism
- No state history/versioning
- Risk of state file loss

### Solution: Use Google Cloud Storage Backend

**Step 1: Create GCS bucket for state**
```bash
# Create bucket (one-time setup)
gsutil mb -p perundhu-prod-001 -l asia-south1 gs://perundhu-prod-001-terraform-state

# Enable versioning (state history)
gsutil versioning set on gs://perundhu-prod-001-terraform-state

# Set lifecycle policy (keep 10 versions)
cat > lifecycle.json <<EOF
{
  "lifecycle": {
    "rule": [
      {
        "action": {"type": "Delete"},
        "condition": {"numNewerVersions": 10}
      }
    ]
  }
}
EOF
gsutil lifecycle set lifecycle.json gs://perundhu-prod-001-terraform-state
```

**Step 2: Update backend configuration**

Create/update `infrastructure/terraform/environments/production/backend.tf`:
```hcl
terraform {
  backend "gcs" {
    bucket  = "perundhu-prod-001-terraform-state"
    prefix  = "production/state"
  }
}
```

**Step 3: Migrate existing state**
```bash
cd infrastructure/terraform/environments/production

# Backup current state
cp terraform.tfstate terraform.tfstate.backup.$(date +%Y%m%d_%H%M%S)

# Initialize with new backend (will prompt to migrate)
terraform init -migrate-state

# Verify state is in GCS
gsutil ls -la gs://perundhu-prod-001-terraform-state/production/state/
```

**Benefits:**
- ✅ State locking prevents concurrent modifications
- ✅ Automatic state versioning (recover from mistakes)
- ✅ Team collaboration (shared state)
- ✅ No more "stale plan" errors from local state changes

---

## 2. Infrastructure Import Strategy

### Problem We Had:
- Resources created manually in GCP console
- Terraform tried to CREATE instead of MANAGE
- Required importing 40+ resources one by one

### Solution A: Import-First Approach (For Existing Infrastructure)

**Create an import script** (`infrastructure/terraform/scripts/import_existing.sh`):
```bash
#!/bin/bash
set -e

PROJECT_ID="perundhu-prod-001"
REGION="asia-south1"
ENV="production"

# Color output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo "Starting import of existing resources..."

# Function to import with error handling
import_resource() {
    local resource=$1
    local id=$2
    
    echo "Importing: $resource"
    if terraform import "$resource" "$id" 2>&1 | grep -q "successfully imported"; then
        echo -e "${GREEN}✓ Imported: $resource${NC}"
    else
        echo -e "${RED}✗ Failed or already imported: $resource${NC}"
    fi
}

# VPC Resources
import_resource "module.vpc.google_compute_network.vpc_network" \
    "projects/${PROJECT_ID}/global/networks/perundhu-${ENV}-vpc"

import_resource "module.vpc.google_compute_subnetwork.public_subnet" \
    "projects/${PROJECT_ID}/regions/${REGION}/subnetworks/perundhu-${ENV}-public-subnet"

import_resource "module.vpc.google_compute_subnetwork.private_subnet" \
    "projects/${PROJECT_ID}/regions/${REGION}/subnetworks/perundhu-${ENV}-private-subnet"

# Database
import_resource "module.database.google_sql_database_instance.instance" \
    "perundhu-${ENV}-mysql"

import_resource "module.database.google_sql_database.database" \
    "${PROJECT_ID}/perundhu-${ENV}-mysql/perundhu"

# Secrets
import_resource "module.secrets.google_secret_manager_secret.db_username" \
    "projects/${PROJECT_ID}/secrets/db-username"

import_resource "module.secrets.google_secret_manager_secret.db_password" \
    "projects/${PROJECT_ID}/secrets/db-password"

# Add more as needed...

echo "Import complete! Run 'terraform plan' to verify."
```

Make it executable:
```bash
chmod +x infrastructure/terraform/scripts/import_existing.sh
```

**Usage:**
```bash
cd infrastructure/terraform/environments/production
../scripts/import_existing.sh
terraform plan  # Should show "No changes" if all imported correctly
```

### Solution B: Use Data Sources (For Resources You Don't Want to Manage)

If you have shared infrastructure managed elsewhere, use data sources instead of resources:

**Example - Using existing VPC instead of managing it:**
```hcl
# Instead of creating:
# resource "google_compute_network" "vpc_network" {
#   name = "existing-vpc"
# }

# Use data source:
data "google_compute_network" "existing_vpc" {
  name    = "existing-vpc"
  project = var.project_id
}

# Reference it:
resource "google_compute_subnetwork" "my_subnet" {
  network = data.google_compute_network.existing_vpc.id
  # ...
}
```

**When to use data sources vs resources:**
- **Data source**: Shared infrastructure, managed by another team, not yours to modify
- **Resource**: Infrastructure you own and want Terraform to fully manage

---

## 3. Prevent Configuration Drift

### Problem We Had:
- terraform.tfvars said `db-g1-small`, actual instance was `db-f1-micro`
- Terraform wanted to REPLACE the database (destructive!)

### Solution: Automated Configuration Validation

**Create drift detection script** (`infrastructure/terraform/scripts/check_drift.sh`):
```bash
#!/bin/bash
set -e

cd infrastructure/terraform/environments/production

echo "=== Checking for configuration drift ==="

# Run terraform plan and check if any resources need replacement
if terraform plan -detailed-exitcode > /dev/null 2>&1; then
    echo "✓ No changes needed - state matches configuration"
    exit 0
elif [ $? -eq 2 ]; then
    echo "⚠ Configuration drift detected. Running plan..."
    terraform plan | grep -E "(will be created|will be destroyed|will be updated|must be replaced)" || true
    
    # Check for destructive changes
    if terraform plan 2>&1 | grep -q "must be replaced"; then
        echo ""
        echo "❌ DESTRUCTIVE CHANGES DETECTED!"
        echo "Resources will be replaced. Review carefully!"
        exit 1
    fi
    exit 2
else
    echo "❌ Terraform plan failed"
    exit 1
fi
```

**Run before deployments:**
```bash
# In CI/CD pipeline or pre-deploy check
./infrastructure/terraform/scripts/check_drift.sh
```

### Use Lifecycle Rules to Ignore Harmless Drift

Update `infrastructure/terraform/modules/database/main.tf`:
```hcl
resource "google_sql_database_instance" "instance" {
  # ... existing config ...

  lifecycle {
    # Prevent Terraform from replacing instance due to these changes
    ignore_changes = [
      settings[0].backup_configuration,     # Backups can be managed manually
      settings[0].disk_type,                # Disk changes don't require replacement
      settings[0].disk_size,                # Disk size grows automatically
      settings[0].activation_policy,        # Start/stop manually for cost savings
      settings[0].ip_configuration,         # IP settings may be adjusted manually
      deletion_protection                   # Can be toggled for maintenance
    ]
    
    # Always require replacement approval for these critical changes
    prevent_destroy = false  # Set to true in production!
  }
}
```

**Strategic use of ignore_changes:**
- ✅ Use for: Settings you intentionally change manually (activation_policy, disk_size)
- ❌ Don't use for: Critical settings that must match code (machine_type, version)

---

## 4. Workflow Best Practices

### Golden Rule: Never Mix Manual + Terraform Changes

**BAD Workflow (What Caused Our Issues):**
```
1. Create resource manually in GCP Console
2. Write Terraform code for same resource
3. Run terraform apply
4. ERROR: Resource already exists! 😢
```

**GOOD Workflow Option A: Terraform-First**
```
1. Write Terraform configuration
2. Run terraform plan
3. Review changes
4. Run terraform apply
5. All resources created AND tracked ✅
```

**GOOD Workflow Option B: Import-First (For Existing Infra)**
```
1. Audit what exists: gcloud commands, console check
2. Write Terraform configuration to match existing
3. Import existing resources: terraform import
4. Run terraform plan (should show "No changes")
5. Future changes via Terraform only ✅
```

### Pre-Deployment Checklist

Create `infrastructure/terraform/PRE_DEPLOY_CHECKLIST.md`:
```markdown
# Pre-Deployment Checklist

Before running `terraform apply`:

## 1. State Validation
- [ ] Remote state backend configured (GCS)
- [ ] Run `terraform init` (no errors)
- [ ] State lock is released (no stuck operations)

## 2. Configuration Validation
- [ ] Run `terraform validate` (no syntax errors)
- [ ] Run `terraform fmt -check` (code formatted)
- [ ] Review `terraform.tfvars` matches environment

## 3. Plan Review
- [ ] Run `terraform plan -out=tfplan`
- [ ] Review all resource changes
- [ ] Check for unexpected replacements (must be replaced)
- [ ] No destroying production databases/data stores

## 4. Drift Check
- [ ] Run drift detection script
- [ ] If drift exists, update config to match OR import existing

## 5. Backup
- [ ] State file backed up (automatic with GCS versioning)
- [ ] Database backup taken (if changes affect data)
- [ ] Rollback plan documented

## 6. Apply
- [ ] Run `terraform apply tfplan`
- [ ] Monitor output for errors
- [ ] Verify resources in GCP console
- [ ] Test application endpoints

## 7. Post-Deployment
- [ ] Document any manual changes needed
- [ ] Update runbooks/documentation
- [ ] Tag release in Git
```

---

## 5. Team Collaboration Setup

### Protect Main Branch

**`.github/workflows/terraform-validate.yml`:**
```yaml
name: Terraform Validation

on:
  pull_request:
    paths:
      - 'infrastructure/terraform/**'

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Terraform
        uses: hashicorp/setup-terraform@v2
        
      - name: Terraform Format Check
        run: terraform fmt -check -recursive
        working-directory: infrastructure/terraform
        
      - name: Terraform Init
        run: terraform init -backend=false
        working-directory: infrastructure/terraform/environments/production
        
      - name: Terraform Validate
        run: terraform validate
        working-directory: infrastructure/terraform/environments/production
        
      - name: Terraform Plan
        run: terraform plan -lock=false
        working-directory: infrastructure/terraform/environments/production
        env:
          GOOGLE_CREDENTIALS: ${{ secrets.GCP_SA_KEY }}
```

### State Locking Best Practices

**If you see "state locked" error:**
```bash
# Check who locked state
terraform force-unlock <LOCK_ID>

# Only use if you're SURE no other operation is running!
# Forcing unlock during active apply can corrupt state
```

**Prevent stuck locks:**
```bash
# Use timeout for long operations
timeout 30m terraform apply -auto-approve

# Always run in tmux/screen for SSH sessions
tmux new -s terraform-deploy
# ... run terraform ...
# Can detach: Ctrl+B, D
# Can reattach: tmux attach -t terraform-deploy
```

---

## 6. Project-Specific Quick Wins

### Immediate Actions for Perundhu Project

**Action 1: Set up remote state (TODAY - 10 minutes)**
```bash
cd infrastructure/terraform/environments/production
gsutil mb -p perundhu-prod-001 -l asia-south1 gs://perundhu-prod-001-terraform-state
gsutil versioning set on gs://perundhu-prod-001-terraform-state

# Create backend.tf (see section 1)
# Run: terraform init -migrate-state
```

**Action 2: Create import script (15 minutes)**
- Use the import script template from Section 2
- List all resources from `terraform state list`
- Document import commands for future reference

**Action 3: Document current state (5 minutes)**
```bash
# Save current infrastructure snapshot
terraform state list > infrastructure/terraform/CURRENT_STATE_SNAPSHOT.txt
terraform show > infrastructure/terraform/CURRENT_CONFIG_SNAPSHOT.txt
git add -A && git commit -m "docs: snapshot current terraform state"
```

**Action 4: Set lifecycle rules (10 minutes)**
- Add ignore_changes to database module (already done ✓)
- Add prevent_destroy to critical resources:
```hcl
resource "google_sql_database_instance" "instance" {
  lifecycle {
    prevent_destroy = true  # Cannot destroy via terraform
  }
}
```

---

## 7. Troubleshooting Guide

### Issue: "Resource already exists"

**Solution:**
```bash
# 1. Confirm resource exists in GCP
gcloud <resource-type> describe <resource-name>

# 2. Get correct import ID format from Terraform docs
# https://registry.terraform.io/providers/hashicorp/google/latest/docs/resources/<resource>

# 3. Import it
terraform import <module.resource> <import-id>

# 4. Verify
terraform plan  # Should show no changes for that resource
```

### Issue: "Stale plan"

**Solution:**
```bash
# 1. Delete plan file
rm tfplan

# 2. Refresh state
terraform refresh

# 3. Generate fresh plan
terraform plan -out=tfplan

# 4. Apply
terraform apply tfplan
```

### Issue: Configuration wants to replace resource

**Solution:**
```bash
# 1. Check what's different
terraform plan | grep -A 5 "must be replaced"

# 2. Option A: Update config to match reality
#    - Update terraform.tfvars to match actual GCP resource
#    - Run terraform plan (should no longer replace)

# 3. Option B: Add to lifecycle ignore_changes
#    - If it's a setting you change manually (disk_size, activation_policy)
#    - Add to ignore_changes block

# 4. Option C: Accept the replacement (DANGEROUS!)
#    - Only if you WANT to replace the resource
#    - Backup data first!
```

---

## 8. Architecture Decision Records

### ADR: Use GCS for State Backend

**Status:** RECOMMENDED

**Context:** 
- Single developer now, but may grow team
- Local state file on laptop is fragile
- No version history or locking

**Decision:** Use Google Cloud Storage backend with versioning enabled

**Consequences:**
- ✅ State is safe and versioned
- ✅ Can collaborate with team
- ✅ State locking prevents conflicts
- ⚠️ Requires GCP credentials to run Terraform
- ⚠️ Very small GCS storage cost (~$0.01/month)

---

### ADR: Import Existing Resources Instead of Recreating

**Status:** ACCEPTED

**Context:**
- Production infrastructure already exists
- Recreating would cause downtime
- Database contains data that cannot be lost

**Decision:** Import all existing resources into Terraform state

**Consequences:**
- ✅ Zero downtime
- ✅ Existing data preserved
- ✅ Infrastructure now in version control
- ⏳ One-time import effort (2-3 hours)
- ⚠️ Must ensure config matches reality exactly

---

### ADR: Use Lifecycle Ignore Changes for Cost-Saving Manual Operations

**Status:** ACCEPTED

**Context:**
- We manually stop/start Cloud SQL to save costs
- Terraform would want to "fix" this back to ALWAYS running
- Cost savings are significant ($19/month)

**Decision:** Add activation_policy to lifecycle ignore_changes

**Consequences:**
- ✅ Can manually control database start/stop
- ✅ Terraform won't fight manual cost optimizations
- ⚠️ Configuration drift is intentional and accepted
- ⚠️ Must document which settings are "manual control"

---

## 9. Summary - Preventing Future Issues

### Primary Prevention: Remote State Backend
```bash
# ONE-TIME SETUP (DO THIS FIRST!)
gsutil mb -p perundhu-prod-001 -l asia-south1 gs://perundhu-prod-001-terraform-state
gsutil versioning set on gs://perundhu-prod-001-terraform-state

# Add backend.tf with gcs backend
# Run: terraform init -migrate-state
```

### Secondary Prevention: Import Before Apply
```bash
# When adding existing resources to Terraform:
# 1. List what exists in GCP
gcloud sql instances list
gcloud compute networks list
# etc...

# 2. Write Terraform config to match
# 3. Import existing resources
terraform import <resource> <id>

# 4. Verify no changes
terraform plan  # Should output: No changes
```

### Tertiary Prevention: Workflow Discipline
- ✅ Always run `terraform plan` before `apply`
- ✅ Review plan output for unexpected replacements
- ✅ Never create resources manually in console (use Terraform)
- ✅ Document any manual changes in code comments
- ✅ Use lifecycle rules for intentional drift
- ✅ Commit terraform.tfvars changes to Git

### Monitoring: Regular Drift Checks
```bash
# Run weekly or before major deployments
terraform plan -detailed-exitcode
# Exit code 0: No changes
# Exit code 2: Changes detected (investigate!)
```

---

## Quick Reference Commands

```bash
# Initialize with remote backend
terraform init -migrate-state

# Check for drift
terraform plan -detailed-exitcode

# Import existing resource
terraform import <module.resource> <gcp-resource-id>

# Refresh state from reality
terraform refresh

# List all resources in state
terraform state list

# Show details of specific resource
terraform state show <module.resource>

# Unlock stuck state
terraform force-unlock <LOCK_ID>

# Validate configuration
terraform validate

# Format code
terraform fmt -recursive

# Generate plan file
terraform plan -out=tfplan

# Apply specific plan
terraform apply tfplan

# Target specific resource
terraform apply -target=module.database.google_sql_database_instance.instance
```

---

## Next Steps

1. **TODAY**: Set up GCS remote state backend
2. **THIS WEEK**: Create import script for existing resources
3. **THIS WEEK**: Add pre-commit hooks for terraform fmt
4. **THIS MONTH**: Set up GitHub Actions for terraform validation
5. **ONGOING**: Never create resources manually - Terraform only!

