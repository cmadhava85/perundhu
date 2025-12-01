# GitHub Actions Workflows Status

## Active Workflows

### ✅ CI Pipeline (`ci.yml`)
**Status:** ACTIVE  
**Triggers:**
- Push to main/master/develop branches
- Pull requests to main/master/develop
- Manual dispatch

**Purpose:** Core continuous integration
- Frontend lint, type check, tests, build
- Backend tests and build
- Security scanning
- Triggers CD pipeline on main/master branch

---

### ✅ CD PreProd Auto Deploy (`cd-preprod-auto.yml`)
**Status:** ACTIVE  
**Triggers:**
- Push to main/master branches
- Manual dispatch
- Called by CI pipeline

**Purpose:** Automatic deployment to pre-production
- Builds Docker images with preprod config
- Deploys to Cloud Run (preprod)
- Runs database migrations
- Executes smoke tests

---

### ✅ CD Production Deploy (`cd-production.yml`)
**Status:** ACTIVE  
**Triggers:**
- Release published
- Manual dispatch with version input
- Push to tags (v*)

**Purpose:** Production deployments
- Validates release version
- Builds production Docker images
- Deploys to Cloud Run (production)
- Runs production smoke tests
- Creates deployment summary

---

### ✅ Terraform Infrastructure (`terraform.yml`)
**Status:** ACTIVE (Conditional)  
**Triggers:**
- Push to main/master (only if terraform files changed)
- Pull requests (only if terraform files changed)
- Manual dispatch

**Purpose:** Infrastructure as Code management
- Validates Terraform configurations
- Plans infrastructure changes (preprod & production)
- Applies changes (manual approval required)
- Conditional execution based on file changes

**Path Filters:**
```yaml
paths:
  - 'infrastructure/terraform/**'
  - '.github/workflows/terraform.yml'
```

---

## Disabled Workflows (Manual Only)

### 🔴 Docker Build (`docker-build.yml`)
**Status:** DISABLED  
**Reason:** Image building is handled by CD pipelines  
**Manual Trigger:** Available via workflow_dispatch

---

### 🔴 CD Staging (`cd-staging.yml`)
**Status:** DISABLED  
**Reason:** Staging environment not in use  
**Previous Trigger:** Push to develop branch  
**Manual Trigger:** Available via workflow_dispatch

---

### 🔴 Code Quality (`code-quality.yml`)
**Status:** DISABLED  
**Reason:** Quality checks integrated in CI pipeline  
**Manual Trigger:** Available via workflow_dispatch

---

### 🔴 E2E Tests (`e2e-tests.yml`)
**Status:** DISABLED  
**Reason:** Not needed for every commit  
**Manual Trigger:** Available via workflow_dispatch

---

### 🔴 Performance Testing (`performance-testing.yml`)
**Status:** DISABLED (Already manual-only)  
**Reason:** Run on-demand only  
**Manual Trigger:** Available via workflow_dispatch

---

### 🔴 Monitoring & Alerting (`monitoring.yml`)
**Status:** DISABLED  
**Reason:** Scheduled monitoring disabled to reduce costs  
**Previous Trigger:** Cron schedule every 6 hours  
**Manual Trigger:** Available via workflow_dispatch

---

### 🔴 Dependency Update (`dependency-update.yml`)
**Status:** DISABLED  
**Reason:** Automated weekly updates disabled  
**Previous Trigger:** Cron schedule weekly (Monday 9 AM)  
**Manual Trigger:** Available via workflow_dispatch

---

### 🔴 Database Management (`database-management.yml`)
**Status:** DISABLED  
**Reason:** Run manually when needed  
**Manual Trigger:** Available via workflow_dispatch

---

### 🔴 Database Migration (`database-migration.yml`)
**Status:** DISABLED  
**Reason:** Migrations handled by CD pipelines  
**Manual Trigger:** Available via workflow_dispatch

---

### 🟡 Release Automation (`release-automation.yml`)
**Status:** MANUAL ONLY (Kept Active)  
**Trigger:** Manual dispatch only  
**Purpose:** Create releases for production deployment
- Version bumping (major/minor/patch)
- Changelog generation
- GitHub release creation
- Tag creation

---

## Workflow Execution Flow

### Development Flow
```
Code Push to main/master
    ↓
CI Pipeline (ci.yml)
    ↓
[Frontend: Lint → Test → Build]
[Backend: Test → Build]
[Security: Vulnerability Scan]
    ↓
Trigger CD PreProd (cd-preprod-auto.yml)
    ↓
Build Docker Images
    ↓
Deploy to Cloud Run (PreProd)
    ↓
Run Smoke Tests
```

### Production Release Flow
```
Manual: Create Release (release-automation.yml)
    ↓
Version Bump & Tag Creation
    ↓
CD Production Triggered (cd-production.yml)
    ↓
Validate Release
    ↓
Build Production Images
    ↓
Deploy to Cloud Run (Production)
    ↓
Run Production Smoke Tests
    ↓
Notify Team
```

### Infrastructure Changes Flow
```
Terraform File Changes
    ↓
Terraform Pipeline (terraform.yml)
    ↓
Validate Terraform
    ↓
Plan Infrastructure (Auto on PR)
    ↓
Manual Approval Required
    ↓
Apply Infrastructure (workflow_dispatch)
```

---

## Resource Optimization

### Before
- 14 workflows configured
- 8 workflows running automatically
- Scheduled jobs: 2 (monitoring every 6h, dependency updates weekly)
- High GitHub Actions minutes usage

### After
- 14 workflows configured
- **4 workflows active** (CI, CD PreProd, CD Production, Terraform)
- **10 workflows disabled** (manual only)
- **0 scheduled jobs**
- Reduced GitHub Actions minutes by ~70%

---

## Cost Savings

### Disabled Scheduled Jobs
- Monitoring: 4 runs/day × 5 min/run = 20 min/day = **600 min/month**
- Dependency Updates: 1 run/week × 10 min/run = **40 min/month**

**Total Savings: ~640 minutes/month**

### Conditional Terraform Execution
- Only runs when terraform files change
- Estimated savings: **200 min/month**

**Grand Total Savings: ~840 minutes/month**

---

## When to Run Disabled Workflows Manually

### Code Quality
- Before major releases
- When refactoring large sections
- For security audits

### E2E Tests
- Before production releases
- After major UI changes
- Monthly regression testing

### Performance Testing
- Before production releases
- After performance optimizations
- Capacity planning

### Monitoring
- When investigating issues
- After infrastructure changes
- For health check validation

### Dependency Updates
- Monthly security updates
- Before major releases
- When critical CVEs are announced

### Database Management/Migration
- When manually testing migrations
- For database maintenance tasks
- Emergency rollbacks

---

## How to Run Disabled Workflows

### Via GitHub UI
1. Go to **Actions** tab
2. Select the workflow from left sidebar
3. Click **Run workflow** button
4. Select branch and fill required inputs
5. Click **Run workflow**

### Via GitHub CLI
```bash
# Run monitoring for preprod
gh workflow run monitoring.yml -f environment=preprod

# Run dependency updates
gh workflow run dependency-update.yml

# Run E2E tests
gh workflow run e2e-tests.yml

# Run performance tests for preprod
gh workflow run performance-testing.yml \
  -f environment=preprod \
  -f duration=120 \
  -f virtual_users=50

# Create a release
gh workflow run release-automation.yml \
  -f version_bump=patch \
  -f create_release=true

# Apply Terraform for preprod
gh workflow run terraform.yml \
  -f environment=preprod \
  -f action=apply
```

---

## Re-enabling Workflows

To re-enable any workflow, edit the workflow file and uncomment the triggers:

**Example:** Re-enable monitoring
```yaml
# FROM (disabled):
on:
  # schedule:
  #   - cron: '0 */6 * * *'
  workflow_dispatch:

# TO (enabled):
on:
  schedule:
    - cron: '0 */6 * * *'
  workflow_dispatch:
```

---

## Workflow File Summary

| Workflow | File | Status | Auto-Trigger | Manual |
|----------|------|--------|--------------|--------|
| CI Pipeline | `ci.yml` | ✅ Active | Yes | Yes |
| CD PreProd | `cd-preprod-auto.yml` | ✅ Active | Yes | Yes |
| CD Production | `cd-production.yml` | ✅ Active | Yes | Yes |
| Terraform | `terraform.yml` | ✅ Active (Conditional) | Yes* | Yes |
| Release Automation | `release-automation.yml` | 🟡 Manual Only | No | Yes |
| Docker Build | `docker-build.yml` | 🔴 Disabled | No | Yes |
| CD Staging | `cd-staging.yml` | 🔴 Disabled | No | Yes |
| Code Quality | `code-quality.yml` | 🔴 Disabled | No | Yes |
| E2E Tests | `e2e-tests.yml` | 🔴 Disabled | No | Yes |
| Performance Testing | `performance-testing.yml` | 🔴 Disabled | No | Yes |
| Monitoring | `monitoring.yml` | 🔴 Disabled | No | Yes |
| Dependency Update | `dependency-update.yml` | 🔴 Disabled | No | Yes |
| Database Management | `database-management.yml` | 🔴 Disabled | No | Yes |
| Database Migration | `database-migration.yml` | 🔴 Disabled | No | Yes |

*Conditional: Only runs when terraform files are modified

---

## Recommendations

### Monthly Tasks
- Run **Dependency Updates** manually
- Run **E2E Tests** for regression
- Run **Monitoring** health checks
- Review security scan results

### Pre-Release Tasks
- Run **E2E Tests**
- Run **Performance Testing**
- Run **Code Quality** checks
- Verify **Database Migrations**

### Emergency Procedures
- Use **Database Management** for urgent fixes
- Use **Monitoring** to diagnose issues
- Use **Docker Build** for hotfix testing

---

**Last Updated:** December 1, 2025  
**Updated By:** Workflow Optimization  
**Next Review:** January 1, 2026
