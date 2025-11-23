# CI/CD Pipeline Documentation

## 📋 Overview

This project uses GitHub Actions for a comprehensive CI/CD pipeline with the following workflows:

## 🔄 Workflows

### 1. **CI Pipeline** (`ci.yml`)
**Trigger**: Push to main/master/develop, Pull Requests
**Purpose**: Continuous Integration

**Jobs**:
- ✅ Frontend Lint & Type Check
- ✅ Frontend Unit Tests
- ✅ Frontend Build
- ✅ Backend Tests (with H2)
- ✅ Backend Build
- ✅ Security Scan (Trivy)
- 🚀 Trigger CD Pipeline (on main/master)

**Duration**: ~10-15 minutes

---

### 2. **CD PreProd** (`cd-preprod-auto.yml`)
**Trigger**: Automatically by CI on main/master, Manual dispatch
**Purpose**: Deploy to PreProd environment

**Jobs**:
- 🏗️ Build & Push Docker Images
- 🚀 Deploy to Cloud Run (asia-south1)
  - Backend: `perundhu-backend-preprod`
  - Frontend: `perundhu-frontend-preprod`
- 🧪 Smoke Tests
- 📊 Deployment Summary

**Duration**: ~15-20 minutes

---

### 3. **CD Production** (`cd-production.yml`)
**Trigger**: Release published, Manual dispatch
**Purpose**: Deploy to Production environment

**Jobs**:
- ✅ Validate Release Tag (vX.Y.Z format)
- 🏗️ Build & Push Production Images
- 📦 Run Database Migrations
- 🚀 Deploy to Production Cloud Run
- 🧪 Production Smoke Tests
- 📊 Deployment Summary
- 📢 Slack Notification (if configured)

**Duration**: ~20-25 minutes
**Requirements**: Semantic version tag (e.g., v1.0.0)

---

### 4. **Code Quality** (`code-quality.yml`)
**Trigger**: Push, Pull Requests, Manual
**Purpose**: Comprehensive code quality checks

**Jobs**:
- 🎨 Frontend Quality
  - ESLint analysis
  - TypeScript checking
  - Bundle size analysis
  - Console statement detection
  - TODO/FIXME detection
- ☕ Backend Quality
  - SpotBugs analysis
  - Checkstyle checking
  - PMD static analysis
  - JaCoCo coverage reports
  - Code smell detection
- 🔒 CodeQL Security Analysis (Java & JavaScript)
- 🔍 Dependency Review (PRs only)
- 🕵️ Secret Scanning (TruffleHog)
- 📜 License Compliance Check
- 💅 Code Formatting Check (Prettier)

**Duration**: ~15-20 minutes
**Non-blocking**: Reports issues but doesn't fail builds

---

### 5. **E2E Tests** (`e2e-tests.yml`)
**Trigger**: Manual only (workflow_dispatch)
**Purpose**: End-to-end testing with Playwright

**Jobs**:
- 🎭 Playwright Tests (Chromium, Firefox, WebKit, Mobile)
- 📸 Screenshot capture on failure
- 📊 HTML Test Report

**Duration**: ~10-15 minutes

---

### 6. **Terraform Infrastructure** (`terraform.yml`)
**Trigger**: Manual only (workflow_dispatch)
**Purpose**: Infrastructure as Code management

**Jobs**:
- ✅ Terraform Validation
- 📋 Terraform Plan (PreProd/Production)
- 🚀 Terraform Apply (with approval)
- 💥 Terraform Destroy (with approval)

**Duration**: ~5-10 minutes
**Environments**: preprod, production

---

### 7. **Performance Testing** (`performance-testing.yml`) ⭐ NEW
**Trigger**: Manual only
**Purpose**: Performance, load, and accessibility testing

**Jobs**:
- 🚀 Lighthouse Performance Audit
  - Performance score
  - Accessibility score
  - Best practices
  - SEO metrics
- 📊 Load Testing with K6
  - Configurable virtual users
  - Response time thresholds
  - Error rate monitoring
- ♿ Accessibility Testing (axe)
  - WCAG compliance
  - Color contrast
  - Keyboard navigation

**Duration**: ~5-10 minutes

---

### 8. **Database Management** (`database-management.yml`) ⭐ NEW
**Trigger**: Manual only
**Purpose**: Database operations and migration management

**Jobs**:
- 💾 Database Backup
  - Cloud SQL automatic backup
  - Timestamped backups
- ✅ Validate Flyway Migrations
  - Migration script validation
  - Naming convention check
- 📊 Migration Status Check
  - Current migration version
  - Pending migrations

**Duration**: ~3-5 minutes

---

### 9. **Release Automation** (`release-automation.yml`) ⭐ NEW
**Trigger**: Manual only
**Purpose**: Automated release creation

**Jobs**:
- 🏷️ Version Bumping (major/minor/patch)
- 📝 Changelog Generation
- 🎉 GitHub Release Creation
- 📦 Update package.json version
- 📢 Team Notification

**Duration**: ~2-3 minutes

---

### 10. **Monitoring & Alerting** (`monitoring.yml`) ⭐ NEW
**Trigger**: Schedule (every 6 hours), Manual
**Purpose**: Continuous monitoring and health checks

**Jobs**:
- 🏥 Uptime & Health Check
  - Backend API status
  - Frontend availability
  - Response time monitoring
- 🔒 SSL Certificate Expiry Check
  - Certificate validity
  - Expiry warnings (< 30 days)
- 📦 Dependency Outdated Check
  - npm outdated
  - Gradle dependency updates

**Duration**: ~3-5 minutes

---

## 🚀 Deployment Flow

```
┌─────────────┐
│   Push to   │
│ main/master │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ CI Pipeline │ (10-15 min)
│   Lint      │
│   Test      │
│   Build     │
│  Security   │
└──────┬──────┘
       │
       ▼ (Auto-trigger)
┌─────────────┐
│ CD PreProd  │ (15-20 min)
│   Build     │
│   Deploy    │
│   Test      │
└──────┬──────┘
       │
       ▼ (Manual: Create Release)
┌─────────────┐
│  Release    │
│ Automation  │
└──────┬──────┘
       │
       ▼ (Triggered by release)
┌─────────────┐
│CD Production│ (20-25 min)
│  Validate   │
│   Deploy    │
│   Monitor   │
└─────────────┘
```

## 🎯 Quality Gates

### CI Pipeline Requirements:
- ✅ Frontend linting passes
- ✅ All unit tests pass
- ✅ TypeScript compilation succeeds
- ✅ Backend tests pass
- ✅ Security scan completes
- ⚠️ Code quality checks (advisory only)

### CD PreProd Requirements:
- ✅ CI pipeline success
- ✅ Docker images build successfully
- ✅ Cloud Run deployment succeeds
- ✅ Smoke tests pass

### CD Production Requirements:
- ✅ Valid semantic version tag
- ✅ Database migrations succeed
- ✅ Production deployment succeeds
- ✅ Production smoke tests pass

## 🔐 Secrets Required

### GitHub Secrets:
- `GCPSECRET` - GCP service account credentials (JSON)
- `SLACK_WEBHOOK_URL` - Slack notifications (optional)

### GCP Secret Manager:
**PreProd**:
- `preprod-db-password`
- `preprod-jwt-secret`
- `preprod-db-url` (optional)
- `preprod-db-username` (optional)

**Production**:
- `prod-db-password`
- `prod-jwt-secret`
- `prod-db-url`
- `prod-db-username`

## 📊 Workflow Comparison

| Workflow | Frequency | Duration | Blocking | Environment |
|----------|-----------|----------|----------|-------------|
| CI | Every push/PR | 10-15m | Yes | - |
| CD PreProd | Auto on main | 15-20m | No | PreProd |
| CD Production | Manual/Release | 20-25m | No | Production |
| Code Quality | Every push/PR | 15-20m | No | - |
| E2E Tests | Manual | 10-15m | No | - |
| Terraform | Manual | 5-10m | No | Both |
| Performance | Manual | 5-10m | No | Both |
| DB Management | Manual | 3-5m | No | Both |
| Release | Manual | 2-3m | No | - |
| Monitoring | Scheduled (6h) | 3-5m | No | Both |

## 🛠️ Common Operations

### Deploy to PreProd
```bash
# Automatic: Just push to main/master
git push origin main

# Manual: Use GitHub Actions UI
# Actions → CD - Auto Deploy to Pre-Production → Run workflow
```

### Deploy to Production
```bash
# Option 1: Create a release
# Actions → Release Automation → Run workflow
# Select version bump type → Creates release

# Option 2: Manual dispatch
# Actions → CD - Deploy to Production → Run workflow
# Enter version tag (e.g., v1.0.0)
```

### Run Performance Tests
```bash
# GitHub Actions → Performance & Load Testing → Run workflow
# Select: environment, duration, virtual users
```

### Create Database Backup
```bash
# GitHub Actions → Database Management → Run workflow
# Action: backup, Environment: preprod/production
```

### Check Migration Status
```bash
# GitHub Actions → Database Management → Run workflow
# Action: migration-status
```

## 📈 Monitoring

### Health Checks (Automatic every 6 hours)
- Backend API availability
- Frontend accessibility
- SSL certificate expiry
- Dependency updates

### Manual Checks Available
- Performance testing (Lighthouse)
- Load testing (K6)
- Accessibility testing (axe)
- Database status

## 🆘 Troubleshooting

### CI Pipeline Fails
1. Check ESLint errors in logs
2. Review TypeScript compilation errors
3. Check test failures
4. Review security scan results

### CD Deployment Fails
1. Check Docker build logs
2. Verify GCP credentials
3. Check Cloud Run deployment logs
4. Verify secrets are configured

### Performance Issues
1. Run performance testing workflow
2. Check Lighthouse scores
3. Review load test results
4. Analyze bundle size

### Database Issues
1. Check migration status
2. Review Flyway validation
3. Create backup before changes
4. Test migrations on preprod first

## 🎓 Best Practices

1. **Always test on PreProd first**
   - Automatic deployment on main
   - Manual verification
   - Then release to production

2. **Use semantic versioning**
   - v1.0.0 for major releases
   - v1.1.0 for features
   - v1.0.1 for fixes

3. **Monitor regularly**
   - Check scheduled monitoring results
   - Run performance tests before releases
   - Review code quality reports

4. **Database safety**
   - Create backups before migrations
   - Test migrations on preprod
   - Use Terraform for infrastructure

5. **Security**
   - Review CodeQL findings
   - Check dependency vulnerabilities
   - Monitor secret scanning alerts

## 📚 Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Google Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Terraform Google Provider](https://registry.terraform.io/providers/hashicorp/google/latest/docs)
- [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)
- [K6 Load Testing](https://k6.io/docs/)
