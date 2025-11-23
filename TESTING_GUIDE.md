# Perundhu Testing Guide

## 🧪 Testing Stack

### Unit & Integration Tests
- **Frontend**: Vitest + React Testing Library
- **Backend**: JUnit 5 + Spring Boot Test
- **Coverage**: JaCoCo (Backend), Vitest Coverage (Frontend)

### E2E Tests
- **Playwright**: Cross-browser testing (Chromium, Firefox, WebKit, Mobile)

### Performance Tests
- **Lighthouse CI**: Performance, Accessibility, SEO audits
- **K6**: Load and stress testing

### Code Quality
- **Backend**: Checkstyle, PMD, SpotBugs, JaCoCo
- **Frontend**: ESLint, Prettier, TypeScript

## 🚀 Running Tests Locally

### Frontend Tests

```bash
cd frontend

# Unit tests
npm test                    # Run once
npm run test:watch          # Watch mode
npm run test:coverage       # With coverage

# Type checking
npm run type-check

# Linting
npm run lint
npm run lint:fix

# Formatting
npm run format              # Format all files
npm run format:check        # Check only

# All quality checks
npm run quality

# E2E tests
npm run test:e2e            # Run all E2E tests
npm run test:e2e:ui         # Interactive UI
npm run test:e2e:headed     # Show browser
npm run test:e2e:debug      # Debug mode
npm run test:e2e:chromium   # Chromium only
npm run test:e2e:mobile     # Mobile viewport
```

### Backend Tests

```bash
cd backend

# Unit tests
./gradlew test

# With coverage
./gradlew test jacocoTestReport

# Hexagonal architecture tests
./gradlew hexagonalTest

# All quality checks
./gradlew qualityCheck

# Individual quality tools
./gradlew checkstyleMain
./gradlew pmdMain
./gradlew spotbugsMain

# Check for dependency updates
./gradlew dependencyUpdates
```

### Performance Tests

```bash
# Lighthouse (requires built frontend)
cd frontend
npm run build
npm run preview &
npx @lhci/cli autorun
kill %1

# K6 Load Testing
k6 run tests/load/load-test.js

# With custom parameters
k6 run \
  --vus 20 \
  --duration 2m \
  -e API_URL=https://your-api-url.com \
  tests/load/load-test.js
```

## 📊 Test Coverage Goals

### Backend
- **Overall**: 50% minimum (configured in build.gradle)
- **Critical paths**: 80%+
- **Services**: 70%+
- **Controllers**: 60%+

### Frontend
- **Overall**: 60%+
- **Components**: 70%+
- **Utils/Helpers**: 80%+
- **Critical flows**: 90%+

## 🎯 Pre-Commit Checklist

Before committing code:

```bash
# Frontend
cd frontend
npm run quality      # Lint, format, type-check
npm test            # Unit tests
npm run build       # Verify build works

# Backend
cd backend
./gradlew qualityCheck  # All quality checks
./gradlew test         # Unit tests
./gradlew build        # Verify build works
```

## 🔄 CI/CD Test Flow

### On Pull Request
1. ✅ Frontend lint & type check
2. ✅ Frontend unit tests
3. ✅ Backend unit tests
4. ✅ Code quality checks (non-blocking)
5. ✅ Security scans
6. ✅ Dependency review

### On Main Branch Push
1. All PR checks +
2. ✅ Build Docker images
3. ✅ Deploy to PreProd
4. ✅ Smoke tests

### Manual Workflows
- 🎭 E2E tests (workflow_dispatch)
- 🚀 Performance tests (workflow_dispatch)
- 📊 Load tests (workflow_dispatch)

## 🛠️ Troubleshooting

### Frontend Tests Fail

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Update snapshots
npm test -- -u
```

### Backend Tests Fail

```bash
# Clean build
./gradlew clean build

# Run specific test
./gradlew test --tests "ClassName.testMethod"

# Debug mode
./gradlew test --debug-jvm
```

### E2E Tests Fail

```bash
# Install/update browsers
npx playwright install

# Run in headed mode to see what's happening
npm run test:e2e:headed

# Generate trace for debugging
npx playwright test --trace on
```

### Performance Tests

```bash
# Lighthouse fails
npx @lhci/cli healthcheck

# K6 not installed
# macOS
brew install k6

# Linux
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6
```

## 📈 Continuous Improvement

### Regular Tasks
- **Weekly**: Review code quality reports
- **Monthly**: Update dependencies
- **Quarterly**: Review and update coverage goals
- **Per Release**: Full E2E and performance testing

### Metrics to Track
- Test coverage trends
- Build time trends
- Test execution time
- Performance scores
- Accessibility scores

## 🔗 Related Documentation
- [Code Quality Guide](CODE_QUALITY_GUIDE.md)
- [CI/CD Documentation](CI_CD_DOCUMENTATION.md)
- [Playwright Docs](https://playwright.dev/)
- [Vitest Docs](https://vitest.dev/)
- [K6 Docs](https://k6.io/docs/)
