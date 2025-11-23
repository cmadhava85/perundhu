# Code Quality & Static Analysis Tools

This project uses multiple **FREE** code quality tools to ensure high-quality code. All tools are integrated into the CI/CD pipeline.

## 🛠️ Tools Overview

### Frontend (JavaScript/TypeScript)

| Tool | Purpose | Cost | CI Integration |
|------|---------|------|----------------|
| **ESLint** | JavaScript/TypeScript linting | Free | ✅ Yes |
| **TypeScript** | Type checking | Free | ✅ Yes |
| **Prettier** | Code formatting | Free | ✅ Yes |
| **Vitest** | Unit testing with coverage | Free | ✅ Yes |

### Backend (Java/Spring Boot)

| Tool | Purpose | Cost | CI Integration |
|------|---------|------|----------------|
| **Checkstyle** | Code style checking | Free | ✅ Yes |
| **PMD** | Static code analysis | Free | ✅ Yes |
| **SpotBugs** | Bug pattern detection | Free | ✅ Yes |
| **JaCoCo** | Test coverage reporting | Free | ✅ Yes |

### Security & General

| Tool | Purpose | Cost | CI Integration |
|------|---------|------|----------------|
| **CodeQL** | Security vulnerability scanning | Free (GitHub) | ✅ Yes |
| **TruffleHog** | Secret detection | Free | ✅ Yes |
| **Trivy** | Dependency vulnerability scanning | Free | ✅ Yes |
| **Dependency Review** | Dependency security check | Free (GitHub) | ✅ Yes |
| **License Checker** | License compliance | Free | ✅ Yes |

## 📋 Running Locally

### Frontend Quality Checks

```bash
cd frontend

# Run all quality checks
npm run quality

# Individual checks
npm run lint              # ESLint
npm run lint:fix          # Auto-fix ESLint issues
npm run format            # Format code with Prettier
npm run format:check      # Check formatting
npm run type-check        # TypeScript type checking
npm test                  # Run unit tests
npm run test:coverage     # Test coverage report
```

### Backend Quality Checks

```bash
cd backend

# Run all quality checks
./gradlew qualityCheck

# Individual checks
./gradlew checkstyleMain  # Checkstyle for main code
./gradlew pmdMain         # PMD analysis
./gradlew spotbugsMain    # SpotBugs analysis
./gradlew test            # Run tests
./gradlew jacocoTestReport # Coverage report
```

## 🚀 CI/CD Integration

### Workflows

1. **`code-quality.yml`** - Comprehensive code quality checks
   - Runs on every push and PR
   - Includes frontend quality, backend quality, CodeQL, secret scanning
   - Non-blocking (won't fail builds, provides reports)

2. **`ci.yml`** - Main CI pipeline
   - Includes linting and testing
   - Runs before deployment

3. **Security scanning** in CI pipeline
   - Trivy for vulnerability scanning
   - CodeQL for security analysis

## 📊 Quality Reports

### Viewing Reports Locally

**Frontend:**
- ESLint: Terminal output
- Test Coverage: `frontend/coverage/index.html`

**Backend:**
- Checkstyle: `backend/build/reports/checkstyle/main.html`
- PMD: `backend/build/reports/pmd/main.html`
- SpotBugs: `backend/build/reports/spotbugs/main.html`
- JaCoCo Coverage: `backend/build/reports/jacoco/test/html/index.html`

### GitHub Action Artifacts

After CI runs, download artifacts from GitHub Actions:
- `backend-test-results` - Test results
- `backend-coverage` - Coverage reports
- Code quality summaries in job summaries

## ⚙️ Configuration Files

### Frontend
- `.prettierrc` - Prettier configuration
- `.prettierignore` - Prettier ignore patterns
- `eslint.config.js` - ESLint configuration

### Backend
- `config/checkstyle/checkstyle.xml` - Checkstyle rules
- `config/pmd/ruleset.xml` - PMD rules
- `build.gradle` - Tool versions and settings

## 🎯 Quality Metrics

### Current Targets

**Backend:**
- Test Coverage: 50% minimum (configurable in build.gradle)
- Checkstyle: Max 500 lines per file
- PMD: Max 100 lines per method
- SpotBugs: Medium effort, medium report level

**Frontend:**
- ESLint: All rules enforced
- TypeScript: Strict mode
- Prettier: 100 character line width

## 🔧 Customization

### Adjusting Backend Rules

Edit `backend/config/checkstyle/checkstyle.xml` or `backend/config/pmd/ruleset.xml`:

```gradle
// In build.gradle, adjust coverage minimum
jacocoTestCoverageVerification {
    violationRules {
        rule {
            limit {
                minimum = 0.70  // Change to 70%
            }
        }
    }
}
```

### Adjusting Frontend Rules

Edit `frontend/.prettierrc` or `frontend/eslint.config.js`:

```json
{
  "printWidth": 120,  // Change line width
  "semi": false       // Remove semicolons
}
```

## 🚨 Pre-commit Hooks (Optional)

To run quality checks before committing:

```bash
# Frontend
cd frontend
npm install --save-dev husky lint-staged
npx husky install

# Add to package.json:
"lint-staged": {
  "src/**/*.{js,jsx,ts,tsx}": [
    "prettier --write",
    "eslint --fix"
  ]
}
```

## 💡 Best Practices

1. **Run quality checks locally** before pushing
2. **Fix issues incrementally** - don't let them pile up
3. **Review reports** in GitHub Actions summaries
4. **Keep dependencies updated** - use `gradlew dependencyUpdates`
5. **Address security findings** from CodeQL and Trivy
6. **Don't commit secrets** - TruffleHog will catch them

## 📚 Tool Documentation

- [ESLint](https://eslint.org/docs/latest/)
- [Prettier](https://prettier.io/docs/en/)
- [Checkstyle](https://checkstyle.org/)
- [PMD](https://pmd.github.io/)
- [SpotBugs](https://spotbugs.github.io/)
- [JaCoCo](https://www.jacoco.org/jacoco/trunk/doc/)
- [CodeQL](https://codeql.github.com/docs/)
- [TruffleHog](https://github.com/trufflesecurity/trufflehog)
- [Trivy](https://aquasecurity.github.io/trivy/)

## ❓ FAQ

**Q: Will quality checks fail my build?**  
A: No, most are configured with `ignoreFailures = true` to provide reports without blocking.

**Q: How do I disable a specific rule?**  
A: Edit the respective config file and add exclusions or disable rules.

**Q: Can I run quality checks on only changed files?**  
A: Yes, use git hooks or configure tools to check only staged files.

**Q: Are these tools really free?**  
A: Yes! All tools listed are open source and free for public and private repositories.

## 🆘 Troubleshooting

**Gradle build fails with "config file not found":**
```bash
# Create config directories if missing
mkdir -p backend/config/checkstyle
mkdir -p backend/config/pmd
```

**ESLint errors on valid code:**
```bash
# Update ESLint config
cd frontend
npm update eslint
```

**Coverage reports not generated:**
```bash
# Ensure JaCoCo task runs after tests
./gradlew test jacocoTestReport
```
