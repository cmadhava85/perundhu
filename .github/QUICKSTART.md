# GitHub Actions Quick Start Guide

Get your CI/CD pipeline running in 15 minutes!

## ⚡ Quick Setup (5 steps)

### Step 1: Fork/Clone Repository ✅

```bash
git clone https://github.com/YOUR_USERNAME/perundhu.git
cd perundhu
```

### Step 2: Enable GitHub Actions ✅

1. Go to your repository on GitHub
2. Click `Settings` > `Actions` > `General`
3. Under "Actions permissions", select:
   - ✅ "Allow all actions and reusable workflows"
4. Under "Workflow permissions", select:
   - ✅ "Read and write permissions"
   - ✅ "Allow GitHub Actions to create and approve pull requests"
5. Click **Save**

### Step 3: Add Required Secrets 🔐

Go to `Settings` > `Secrets and variables` > `Actions` > `New repository secret`

**Minimum Required (for CI only):**
- None! CI pipeline works out of the box

**For Staging/Production Deployment:**

```
Name: GCP_PROJECT_ID
Value: astute-strategy-406601

Name: GCP_SA_KEY
Value: (See the service account JSON file you downloaded: astute-strategy-406601-83852e13a75a.json)
       Copy and paste the entire JSON content from that file

# Your service account details:
# Email: perundhu@astute-strategy-406601.iam.gserviceaccount.com
# Project: astute-strategy-406601
# Note: Keep this JSON key secure and never commit it to git!

Name: STAGING_DB_URL
Value: jdbc:mysql://staging-host:3306/perundhu

Name: STAGING_DB_USER
Value: staging_user

Name: STAGING_DB_PASSWORD
Value: staging_password
```

### Step 4: Create Production Environment 🏭

1. Go to `Settings` > `Environments`
2. Click **New environment**
3. Name it: `production`
4. Add protection rules:
   - ✅ Required reviewers: 1-2 people
   - ✅ Wait timer: 5 minutes
5. Click **Save protection rules**

### Step 5: Test Your Setup 🧪

Push a commit to trigger CI:

```bash
git checkout -b test-ci
echo "# Test" >> README.md
git add README.md
git commit -m "test: trigger CI pipeline"
git push origin test-ci
```

Then:
1. Go to `Pull Requests` > Create PR
2. Watch the checks run! ✨

## 🎯 What You Get Out of the Box

### ✅ Continuous Integration (Automatic)

**Runs on every PR and push to main/develop:**

- Frontend linting and type checking
- Frontend unit tests
- Frontend production build
- Backend unit tests (with MySQL)
- Backend build (JAR creation)
- Code quality analysis
- Security vulnerability scanning
- E2E tests (Playwright)

### 🚀 Continuous Deployment (Manual)

**Deploy to staging:**
```
Actions > CD - Deploy to Staging > Run workflow
```

**Deploy to production:**
```
Create a release with tag v1.0.0
```

### 🔄 Automated Maintenance (Scheduled)

**Every Monday at 9 AM UTC:**
- Dependency updates
- Security audits
- Automatic PR creation

## 📋 Common Workflows

### Create Your First Release

```bash
# 1. Ensure develop is merged to main
git checkout main
git pull origin main

# 2. Create and push version tag
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0

# 3. Create GitHub Release
# Go to: Releases > Create a new release
# Choose tag: v1.0.0
# Click: Generate release notes
# Click: Publish release

# 4. Production deployment starts automatically!
```

### Run Database Migration

```bash
# Via GitHub UI:
Actions > Database Migration > Run workflow
  Environment: staging
  Action: migrate
  Dry run: true (for testing)

# After verifying dry run works:
Actions > Database Migration > Run workflow
  Environment: staging
  Action: migrate
  Dry run: false
```

### Manual Staging Deployment

```bash
# Via GitHub UI:
Actions > CD - Deploy to Staging > Run workflow
  Branch: develop
  Environment: staging
```

## 🐛 Troubleshooting

### "Workflow not running"

✅ **Solution**: Check if workflows are enabled
- Settings > Actions > General
- Verify "Allow all actions" is selected

### "Secrets not found"

✅ **Solution**: Add secrets
- Settings > Secrets and variables > Actions
- Add required secrets (see Step 3)

### "Permission denied"

✅ **Solution**: Update workflow permissions
- Settings > Actions > General > Workflow permissions
- Select "Read and write permissions"

### "E2E tests failing"

✅ **Solution**: This is normal initially
- E2E tests require the app to be running
- They'll work after first deployment
- Or disable them temporarily:
  ```yaml
  # In .github/workflows/e2e-tests.yml
  on:
    push:
      branches: [ main ]  # Remove develop
  ```

## 🎓 Next Steps

### Level 1: Basic CI/CD ✅
- [x] CI pipeline running
- [ ] First deployment to staging
- [ ] First release to production

### Level 2: Advanced Features
- [ ] Enable SonarCloud for code quality
- [ ] Add Slack notifications
- [ ] Set up custom domain
- [ ] Configure auto-scaling

### Level 3: Enterprise
- [ ] Multi-region deployment
- [ ] Blue-green deployments
- [ ] Canary releases
- [ ] Performance testing

## 📚 Additional Documentation

- [Full Workflows README](.github/workflows/README.md)
- [GCP Deployment Guide](../CLOUDBUILD_GUIDE.md)
- [Database Migration Guide](../infrastructure/README.md)

## 🆘 Getting Help

**Issues with workflows?**
1. Check workflow logs: Actions tab > Select workflow > View details
2. Review error messages carefully
3. Verify all secrets are set correctly
4. Check service account permissions (for GCP)

**Need specific examples?**
- Look in `.github/workflows/` for yaml files
- Each workflow has detailed comments
- Check workflow logs for actual commands used

## 🎉 Success Checklist

- [ ] CI pipeline runs on PR
- [ ] All tests pass
- [ ] Security scan completes
- [ ] Can deploy to staging
- [ ] Can create production release
- [ ] Database migrations work
- [ ] Notifications configured (optional)

---

**Time to get started**: ~15 minutes  
**Time to first deployment**: ~30 minutes  
**Time to production release**: ~1 hour

🚀 Happy deploying!
