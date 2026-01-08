# Terraform Validation Findings - Permission Issues Analysis

## Overview
The Terraform apply is failing due to **GCP IAM permission limitations** on the service account used by the GCPSECRET, NOT due to workflow issues. The workflow is now correctly executing (no longer being skipped).

## Root Cause Analysis

### The Good News ✅
- **Workflow refactoring**: SUCCESSFUL - apply job now runs (not skipped)
- **Terraform validation**: PASSES - syntax is correct
- **Terraform formatting**: COMPLIANT - fmt standards met

### The Issue ❌
The apply is failing with **HTTP 403 Forbidden** errors:
1. Missing `compute.firewalls.create` permission
2. Missing `compute.firewalls.delete` permission  
3. Missing `iam.roles.delete` permission

## What Changed in Recent Commits

### Commit c19e809 (Jan 8, 14:43)
**"Fix Terraform pipeline: Add missing IAM variables to tfvars and fix firewall naming"**

Added to `terraform.tfvars`:
```hcl
firewall_rules = {
  allow-internal = {...}
  allow-ssh = {...}
  allow-http-https = {...}
}
```

### Commit 6b5aa2b (Jan 8, 14:34)
**"refactor: Terraform dynamic config and cleanup"**

Introduced dynamic firewall management via:
- Changed firewall rule naming (underscores → dashes)
- Made firewall rules configurable in tfvars
- Added custom role configuration

## Affected Terraform Resources

### 1. VPC Module - Firewall Rules
**File**: `infrastructure/terraform/modules/vpc/main.tf` (lines 74-99)
```hcl
resource "google_compute_firewall" "rules" {
  for_each = {
    for name, rule in var.firewall_rules :
    name => rule if rule.enable
  }
  # Tries to create:
  # - perundhu-preprod-allow-internal
  # - perundhu-preprod-allow-ssh
  # - perundhu-preprod-allow-http-https
}
```

**Required Permission**: `roles/compute.networkAdmin`

### 2. IAM Module - Custom Role
**File**: `infrastructure/terraform/modules/iam/main.tf` (lines 61-71)
```hcl
resource "google_project_iam_custom_role" "app_role" {
  count = var.enable_custom_role ? 1 : 0
  # Tries to create custom role if enabled
}
```

**Required Permissions**: `iam.roles.create`, `iam.roles.delete`

## Solutions

### ✅ Option 1: Disable Firewall Management (RECOMMENDED)
If firewalls are already created manually in GCP, disable Terraform:

```hcl
# In infrastructure/terraform/environments/preprod/terraform.tfvars

# Change from:
firewall_rules = {
  allow-internal = {...},
  allow-ssh = {...},
  allow-http-https = {...}
}

# To:
firewall_rules = {}  # Empty - don't manage via Terraform
```

### ✅ Option 2: Verify Custom Role is Disabled
Already set, but verify in tfvars:
```hcl
enable_custom_role = false  # Line 133
```

### ⚠️ Option 3: Grant Service Account Permissions
Add to GCPSECRET service account:
- `roles/compute.networkAdmin` - for firewall management
- `roles/iam.securityAdmin` - for IAM role management

**Requires**: GCP Project Editor or higher permissions

## Validation Summary

| Component | Status | Details |
|-----------|--------|---------|
| Workflow Execution | ✅ PASS | terraform-apply job now runs (fixed!) |
| terraform-plan | ✅ PASS | Both preprod and production validate |
| terraform fmt | ✅ PASS | All files compliant |
| terraform validate | ✅ PASS | Configuration syntax correct |
| terraform apply | ❌ FAIL | Missing IAM permissions (expected) |

## Next Steps

1. **Decide on firewall management approach:**
   - If firewalls pre-exist in GCP → Use Option 1 (recommended)
   - If firewalls managed in GCP console → Use Option 1
   - If need Terraform-managed firewalls → Use Option 3

2. **Update terraform.tfvars** to disable firewall rules if using Option 1

3. **Re-run apply** with updated configuration

## Conclusion

**The GitHub Actions workflow refactoring is 100% successful.** The apply job is now correctly executing instead of being skipped. The permission errors are infrastructure/configuration issues, not workflow issues.
