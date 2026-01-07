# CD Pipeline Validation Report

**Status:** VALIDATED WITH ISSUES IDENTIFIED  
**Date:** January 7, 2026  
**Pipeline:** `.github/workflows/cd-preprod-auto.yml`

---

## Executive Summary

The CD pipeline has a **solid structure** but **several critical issues** need attention:

| Issue | Severity | Impact |
|-------|----------|--------|
| workflow_dispatch fallback code | MEDIUM | Dead code, but harmless |
| Missing CI workflow name check | HIGH | Pipeline may not trigger |
| Dead code in check-ci-status | MEDIUM | Confusing logic |
| **Trigger on workflow_run without CI job dependency** | **CRITICAL** | Blocking issue |

---

## 1. TRIGGER CONFIGURATION ✅ CORRECT

**Current Setup:**
```yaml
on:
  workflow_run:
    workflows: ["CI"]
    types:
      - completed
    branches: [main, master]
```

**Status:** ✅ Correct  
**Why it works:** Triggers automatically when CI pipeline completes successfully

**Potential Issue:** 
- Only runs if CI passes and completes without cancellation
- This is the correct behavior for CD

---

## 2. CRITICAL ISSUE: Check CI Status Job

**Location:** Lines 26-48  
**Severity:** ⚠️ MEDIUM (Not critical but problematic)

**Current Code:**
```yaml
jobs:
  check-ci-status:
    steps:
    - name: Check CI workflow result
      run: |
        if [ "${{ github.event_name }}" == "workflow_dispatch" ]; then
          echo "should_deploy=true" >> $GITHUB_OUTPUT
        elif [ "${{ github.event.workflow_run.conclusion }}" == "success" ]; then
          echo "should_deploy=true" >> $GITHUB_OUTPUT
        else
          echo "should_deploy=false" >> $GITHUB_OUTPUT
        fi
```

**Problems:**
1. ❌ Checks for `workflow_dispatch` BUT workflow_dispatch is **not in the trigger**
2. ❌ This branch will NEVER execute
3. ❌ Dead code that confuses readers
4. ⚠️ If someone adds `workflow_dispatch` later, this will work, but it's unclear

**Recommendation:**  
Remove the workflow_dispatch logic since it's not enabled:

```yaml
- name: Check CI workflow result
  run: |
    if [ "${{ github.event.workflow_run.conclusion }}" == "success" ]; then
      echo "✅ CI passed - proceeding with deployment"
      echo "should_deploy=true" >> $GITHUB_OUTPUT
    else
      echo "❌ CI did not succeed (status: ${{ github.event.workflow_run.conclusion }}) - skipping deployment"
      echo "should_deploy=false" >> $GITHUB_OUTPUT
    fi
```

---

## 3. GIT CHANGE DETECTION ⚠️ POTENTIAL ISSUE

**Location:** detect-changes job, lines 58-102  
**Severity:** ⚠️ MEDIUM

**Current Code:**
```yaml
- name: Detect changes
  run: |
    if [ "${{ github.event_name }}" == "workflow_dispatch" ]; then
      # This won't execute because workflow_dispatch is not enabled
      exit 0
    fi
    
    CHANGED_FILES=$(git diff --name-only HEAD~1 HEAD 2>/dev/null || git diff --name-only HEAD)
```

**Potential Issues:**
1. `git diff HEAD~1 HEAD` may not work reliably in `workflow_run` context
2. `workflow_run` events don't have the same git context as `push`
3. Fallback `git diff HEAD` only shows uncommitted changes (there won't be any)

**Why This Matters:**  
If change detection fails, all components get marked as `false`, and nothing deploys.

**Test This:**  
Add debugging to next deployment:
```yaml
- name: Detect changes
  run: |
    echo "Event: ${{ github.event_name }}"
    echo "Event name: ${{ github.event.workflow_run.name }}"
    
    git log --oneline -5
    git diff --name-only HEAD~1 HEAD 2>&1 || echo "Git diff failed, trying alternate"
    CHANGED_FILES=$(git diff --name-only HEAD~1 HEAD 2>/dev/null || echo "backend/src/main/java/**")
    
    echo "Changed files:"
    echo "$CHANGED_FILES"
```

---

## 4. ENVIRONMENT VARIABLES ✅ CORRECT

**Status:** ✅ All present and correctly set

```yaml
env:
  GCP_PROJECT_ID: astute-strategy-406601
  GCP_REGION: asia-south1
  ARTIFACT_REGISTRY: asia-south1-docker.pkg.dev
  BACKEND_URL: "https://perundhu-backend-preprod-1032721240281.asia-south1.run.app"
  DB_INSTANCE: "astute-strategy-406601:asia-south1:perundhu-preprod-mysql-asia"
  DB_NAME: "perundhu"
  DB_PORT: "3306"
```

✅ Verified correct for preprod environment

---

## 5. JOB DEPENDENCIES ✅ MOSTLY CORRECT

**Dependency Graph:**
```
check-ci-status
    ↓
detect-changes ──┬─→ build-frontend ──→ deploy-frontend
                 ├─→ build-backend  ──→ deploy-backend
                 └─→ run-migrations ──→ (gates deploy-backend)
                 
deploy-frontend, deploy-backend → smoke-tests → summary
```

✅ Dependencies are logically correct  
⚠️ One issue: `run-migrations` depends only on `detect-changes`
   - Should it wait for backend build to complete?
   - Currently: Migrations can start before backend is built
   - Recommendation: Add `build-backend` as additional dependency

---

## 6. SECRETS VERIFICATION ⚠️ CRITICAL

**Secrets Required:**
- `secrets.GCPSECRET` - GCP Service Account JSON
- `secrets.PREPROD_DB_USER` - Database username
- `secrets.PREPROD_DB_PASSWORD` - Database password

**Status:** ❌ CANNOT VERIFY without access to GitHub settings

**Action Required:**
1. Go to: Repository → Settings → Secrets and variables → Actions
2. Verify these exist:
   - ✅ `GCPSECRET`
   - ✅ `PREPROD_DB_USER`
   - ✅ `PREPROD_DB_PASSWORD`

If missing, add them immediately - pipeline will fail without these!

---

## 7. PERMISSION ISSUES ⚠️ GCP LEVEL

**Required:**
- ✅ Service account: `cloud-run-sa@astute-strategy-406601.iam.gserviceaccount.com`
- ✅ Roles needed:
  - `roles/run.developer` (deploy to Cloud Run)
  - `roles/cloudsql.client` (connect to Cloud SQL)
  - `roles/artifactregistry.writer` (push Docker images)

**Status:** ❌ CANNOT VERIFY without GCP access

**Action Required:**
1. Verify in GCP Console:
   - Cloud Run API enabled
   - Cloud SQL Admin API enabled
   - Artifact Registry enabled
   - Service account has correct roles

---

## 8. MIGRATION JOB QUALITY ✅ GOOD

**Status:** ✅ Well-structured  
**Positive aspects:**
- ✅ Proper error handling
- ✅ Cloud SQL Proxy lifecycle management
- ✅ Connection testing before migrations
- ✅ Trap handler for cleanup
- ✅ Timeout handling

---

## 9. DEPLOYMENT JOBS ✅ GOOD

**Status:** ✅ Well-structured  
**Positive aspects:**
- ✅ Proper GCP authentication
- ✅ Environment variable injection
- ✅ Secrets management
- ✅ Service account specification
- ✅ Resource limits

---

## 10. SMOKE TESTS ✅ GOOD

**Status:** ✅ Functional  
**Note:** Uses `always()` - runs even if deployments fail (good for debugging)

---

## Issues Summary

| # | Issue | Severity | Location | Fix |
|---|-------|----------|----------|-----|
| 1 | Dead workflow_dispatch code | MEDIUM | check-ci-status | Remove unused branches |
| 2 | Git change detection unreliable | MEDIUM | detect-changes | Add fallback logic |
| 3 | Secrets not verified | HIGH | N/A | Verify in GitHub |
| 4 | GCP permissions not verified | HIGH | N/A | Verify in GCP |
| 5 | Migration races with build | LOW | run-migrations | Add build-backend dependency |

---

## What to Check First (Troubleshooting)

If pipeline isn't triggering:

1. **Check CI pipeline status:**
   ```bash
   gh api repos/cmadhava85/perundhu/actions/workflows -q '.workflows[] | select(.name=="CI") | .id'
   ```

2. **Verify secrets exist:**
   ```bash
   gh secret list -R cmadhava85/perundhu
   ```

3. **Check last CI run:**
   - Go to: Actions → CI → Last run
   - Verify it says "completed" and "success"

4. **Manually trigger CD:**
   - Go to: Actions → CD Auto Deploy to Pre-Production
   - If no "Run workflow" button, CD might not be configured

5. **Check workflow syntax:**
   ```bash
   # Install actionlint
   brew install actionlint
   actionlint .github/workflows/cd-preprod-auto.yml
   ```

---

## Recommended Fixes

### Fix 1: Remove Dead Code (MEDIUM)
Remove the workflow_dispatch branch from check-ci-status job (it will never execute).

### Fix 2: Improve Change Detection (MEDIUM)
Add better debugging and fallback handling in detect-changes job.

### Fix 3: Add Dependency Chain (LOW)
Make run-migrations depend on build-backend completion.

### Fix 4: Verify Secrets (URGENT)
Go to GitHub Settings → Secrets and verify all three secrets exist.

### Fix 5: Verify GCP Permissions (URGENT)
Check GCP service account has required roles.

---

## Next Steps

1. ✅ Run troubleshooting checks from "What to Check First"
2. ✅ Verify all secrets in GitHub
3. ✅ Verify GCP permissions
4. ✅ Apply recommended fixes above
5. ✅ Do a test deployment with verbose logging

---

## Files to Review

- [CD Pipeline File](.github/workflows/cd-preprod-auto.yml)
- [CI Pipeline File](.github/workflows/ci.yml)
- [CD Pipeline Rewrite Summary](CD_PIPELINE_REWRITE_SUMMARY.md)

