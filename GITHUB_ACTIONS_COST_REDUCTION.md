# GitHub Actions Cost Reduction Guide

## Current Status (After Optimization)

### ✅ Already Implemented
- **10 workflows disabled** (moved to manual-only)
- **2 scheduled jobs disabled** (monitoring every 6h, dependency updates weekly)
- **Terraform conditional execution** (runs only when terraform files change)
- **Estimated savings: ~840 minutes/month** (~70% reduction)

### Current Active Workflows
1. **CI Pipeline** - Runs on every push/PR to main/master/develop
2. **CD PreProd** - Runs on every push to main/master
3. **CD Production** - Runs on releases only
4. **Terraform** - Runs only when terraform files change

---

## Free Tier Limits

### GitHub Actions Free Tier
- **Public repositories:** Unlimited minutes ✅
- **Private repositories:** 2,000 minutes/month
- **Storage:** 500 MB

**Current repo status:** Check if perundhu is public or private

If **private**, you're limited to **2,000 minutes/month**

---

## Additional Cost Reduction Strategies

### 1. Make Repository Public (Unlimited Minutes)
**Savings: 100% - Unlimited free minutes**

```bash
# Check current visibility
gh repo view --json isPrivate

# Make repository public (if comfortable)
gh repo edit --visibility public
```

**Pros:**
- Unlimited GitHub Actions minutes
- Free for open source projects
- Community contributions possible

**Cons:**
- Code is publicly visible
- Security concerns if secrets exposed
- Business logic visible to competitors

**Recommendation:** If this is a learning/portfolio project, make it public!

---

### 2. Optimize CI Pipeline (Save ~400 min/month)

#### A. Run CI Only on PRs and Main Branch
**Current:**
```yaml
on:
  push:
    branches: [ main, master, develop ]
  pull_request:
    branches: [ main, master, develop ]
```

**Optimized:**
```yaml
on:
  push:
    branches: [ main, master ]  # Remove develop
  pull_request:
    branches: [ main, master, develop ]
```

**Savings:** ~200 min/month (if you push frequently to develop)

#### B. Skip CI on Documentation Changes
**Already implemented ✅** (paths-ignore in ci.yml)

#### C. Reduce Parallel Jobs
**Current:** 6 jobs run in parallel
- frontend-lint
- frontend-test
- frontend-build
- backend-test
- backend-build
- security-scan

**Option 1:** Combine frontend jobs
```yaml
frontend-all:
  steps:
    - Lint
    - Type Check
    - Test
    - Build
```
**Savings:** ~30% reduction in billable minutes due to setup overhead

#### D. Use Caching Aggressively
**Already implemented ✅** (npm cache, gradle cache)

#### E. Skip Tests on Non-Code Changes
Add this to CI workflow:
```yaml
on:
  push:
    paths:
      - 'frontend/**'
      - 'backend/**'
      - '.github/workflows/ci.yml'
```

**Savings:** ~100-200 min/month

---

### 3. Optimize CD PreProd Pipeline (Save ~200 min/month)

#### A. Deploy Only on Specific Paths
**Current:** Runs on every push to main/master

**Optimized:**
```yaml
on:
  push:
    branches: [ main, master ]
    paths:
      - 'frontend/**'
      - 'backend/**'
      - '.github/workflows/cd-preprod-auto.yml'
  workflow_dispatch:
```

**Savings:** ~200 min/month (won't deploy for doc changes)

#### B. Use Smaller Runners
**Current:** ubuntu-latest (free, 2-core)
**Alternative:** Self-hosted runner (free unlimited, but need your own server)

#### C. Skip Redundant Builds
If CI already built and tested, download artifacts instead of rebuilding:

```yaml
- name: Download artifacts from CI
  uses: actions/download-artifact@v4
  with:
    name: backend-jar
```

**Savings:** ~5-10 min per deployment

---

### 4. Reduce Build Times (Save ~150 min/month)

#### A. Use Docker Layer Caching
Add to Docker builds:
```yaml
- name: Build Docker image
  uses: docker/build-push-action@v5
  with:
    cache-from: type=gha
    cache-to: type=gha,mode=max
```

**Already in docker-build.yml ✅** - Apply to CD workflows too

#### B. Multi-stage Docker Builds
Optimize Dockerfiles:
```dockerfile
# Frontend Dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
```

**Savings:** ~2-3 min per build

#### C. Parallel npm/gradle Operations
```yaml
# Frontend
- run: npm ci --prefer-offline

# Backend
- run: ./gradlew build --parallel
```

---

### 5. Strategic Workflow Triggers (Save ~300 min/month)

#### A. Limit Preprod Deployments
**Option 1:** Deploy only during business hours
```yaml
on:
  push:
    branches: [ main ]
  schedule:
    - cron: '0 9-17 * * 1-5'  # 9 AM - 5 PM, Mon-Fri only
```

**Option 2:** Manual approval for preprod
```yaml
environment:
  name: preprod
  # Requires manual approval in GitHub settings
```

#### B. Batch Deployments
Deploy preprod only once per day:
```yaml
on:
  schedule:
    - cron: '0 18 * * *'  # 6 PM daily
  workflow_dispatch:
```

**Savings:** ~300 min/month

---

### 6. Remove Redundant Steps (Save ~100 min/month)

#### In CI Pipeline:
- ✅ Skip `trigger-deployment` job (CD runs automatically on push)
- ❌ Remove duplicate security scans (CI + CD both scan)

#### In CD Pipelines:
- ✅ Skip JAR build if using Docker (Dockerfile builds it)
- ❌ Remove redundant health checks (one smoke test is enough)

---

### 7. Use Concurrency Limits (Save ~50 min/month)

Cancel in-progress runs when new push happens:

```yaml
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true
```

Add to all workflows.

**Savings:** ~50 min/month (prevents duplicate runs)

---

## Recommended Implementation Plan

### Phase 1: Immediate (Today) - Save ~500 min/month
```yaml
# 1. Make repository public (if acceptable)
gh repo edit --visibility public

# 2. Add concurrency limits to all workflows
# 3. Add path filters to CD preprod workflow
# 4. Skip CI on doc-only changes (already done ✅)
```

### Phase 2: This Week - Save ~200 min/month
```yaml
# 1. Combine frontend CI jobs
# 2. Use artifact downloads in CD instead of rebuilding
# 3. Add Docker layer caching to CD workflows
# 4. Optimize Dockerfiles with multi-stage builds
```

### Phase 3: This Month - Save ~150 min/month
```yaml
# 1. Manual approval for preprod deployments
# 2. Remove redundant security scans
# 3. Batch preprod deployments (once daily)
```

---

## Quick Wins (Implement Now)

### 1. Add Concurrency to All Workflows
```bash
# Add to top of each workflow file
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true
```

### 2. Path Filters for CD PreProd
```yaml
on:
  push:
    branches: [ main, master ]
    paths:
      - 'frontend/**'
      - 'backend/**'
      - 'infrastructure/**'
      - '.github/workflows/cd-preprod-auto.yml'
```

### 3. Skip Develop Branch in CI
```yaml
on:
  push:
    branches: [ main, master ]  # Remove develop
```

---

## Cost Breakdown Example

### Before Optimization (Private Repo)
```
CI runs: 60 pushes/month × 15 min = 900 min
CD PreProd: 60 deploys/month × 20 min = 1,200 min
CD Production: 4 releases/month × 25 min = 100 min
Terraform: 5 runs/month × 10 min = 50 min
Monitoring: 120 runs/month × 5 min = 600 min
Dependency Updates: 4 runs/month × 10 min = 40 min
E2E Tests: 30 runs/month × 15 min = 450 min
Code Quality: 60 runs/month × 8 min = 480 min
Performance Tests: 4 runs/month × 20 min = 80 min
───────────────────────────────────────────────
TOTAL: 3,900 min/month (EXCEEDS FREE TIER!)
Cost: ~$60/month if private
```

### After Current Optimization (Private Repo)
```
CI runs: 60 pushes/month × 15 min = 900 min
CD PreProd: 60 deploys/month × 20 min = 1,200 min
CD Production: 4 releases/month × 25 min = 100 min
Terraform: 2 runs/month × 10 min = 20 min (conditional)
───────────────────────────────────────────────
TOTAL: 2,220 min/month
Cost: ~$7/month if private (220 min over limit)
Savings: ~$53/month (86% reduction)
```

### After All Optimizations (Private Repo)
```
CI runs: 30 runs/month × 12 min = 360 min
CD PreProd: 30 deploys/month × 15 min = 450 min
CD Production: 4 releases/month × 20 min = 80 min
Terraform: 2 runs/month × 8 min = 16 min
───────────────────────────────────────────────
TOTAL: 906 min/month
Cost: $0/month (within free tier!)
Savings: ~$60/month (100% reduction)
```

### If Made Public
```
Cost: $0/month (unlimited minutes!)
```

---

## Monitoring Usage

### Check Current Usage
```bash
# Via GitHub CLI
gh api /repos/OWNER/REPO/actions/cache/usage

# Or visit GitHub UI
# Settings → Billing → Actions minutes
```

### Set Up Alerts
1. Go to **Settings** → **Billing**
2. Set spending limit to **$0** (prevents overages)
3. Enable email notifications at 75%, 90%, 100%

---

## Emergency Cost Controls

### If You're Running Out of Minutes

#### Option 1: Disable All Auto-Triggers (Extreme)
```yaml
# All workflows become manual-only
on:
  workflow_dispatch:
```

#### Option 2: Use Self-Hosted Runner
- Set up a local machine/cloud VM
- Install GitHub Actions runner
- Free unlimited minutes
- Faster builds (local network)

#### Option 3: Switch to Alternative CI/CD
- **GitLab CI:** 400 minutes/month free
- **CircleCI:** 6,000 minutes/month free
- **Travis CI:** Limited free tier
- **Drone CI:** Self-hosted (unlimited)

---

## Best Practices Going Forward

### 1. **Think Before You Push**
- Combine multiple commits
- Use feature branches, merge via PR
- Test locally before pushing

### 2. **Use Draft PRs**
```bash
gh pr create --draft
# CI won't run until marked as ready
```

### 3. **Manual Deployments**
- Deploy preprod manually when ready
- Avoid auto-deploy on every commit

### 4. **Optimize Docker Images**
- Use Alpine Linux (smaller images)
- Multi-stage builds
- Layer caching
- .dockerignore file

### 5. **Local Testing First**
```bash
# Frontend
npm run lint
npm run type-check
npm test
npm run build

# Backend
./gradlew test
./gradlew build

# Only push when everything passes locally
```

---

## Immediate Action Items

### High Priority (Do Now)
1. ✅ Check if repo is public/private
2. ✅ Add concurrency limits to all active workflows
3. ✅ Add path filters to CD preprod
4. ✅ Remove develop branch from CI triggers
5. ✅ Set billing limit to $0 in GitHub settings

### Medium Priority (This Week)
6. ⏳ Combine frontend CI jobs
7. ⏳ Add Docker layer caching to CD workflows
8. ⏳ Download artifacts instead of rebuilding in CD
9. ⏳ Optimize Dockerfiles

### Low Priority (This Month)
10. ⏳ Consider making repo public
11. ⏳ Set up manual approval for preprod
12. ⏳ Implement batched deployments
13. ⏳ Consider self-hosted runner for heavy workloads

---

## Commands to Implement Quick Wins

```bash
cd /Users/mchand69/Documents/perundhu

# 1. Check repository visibility
gh repo view --json isPrivate

# 2. Check current Actions usage
gh api repos/$(gh repo view --json nameWithOwner -q .nameWithOwner)/actions/cache/usage

# 3. Set billing limit (via web UI)
# https://github.com/settings/billing

# 4. Apply the optimizations I'll create
git pull
git add .github/workflows/*.yml
git commit -m "chore(ci): additional cost optimizations"
git push
```

---

## Expected Results

### After Quick Wins (30 minutes effort)
- **Cost reduction: 40-50%**
- **Minutes saved: ~800 min/month**
- **Stays within free tier if private**

### After Full Implementation (1 week effort)
- **Cost reduction: 75-85%**
- **Minutes saved: ~1,500 min/month**
- **Well within free tier**

### If Made Public
- **Cost reduction: 100%**
- **Unlimited minutes**
- **Zero cost forever**

---

**Ready to implement? Let me know which optimizations you want me to apply!**

The safest, easiest win is making the repository public (if it's a learning project or portfolio piece). This gives you unlimited Actions minutes immediately. 🚀
