# 🤖 Test Automation Strategy - Perundhu Application

**Version:** 1.0  
**Date:** January 8, 2026  
**Purpose:** Automate 149 manual test cases to ensure continuous functionality

---

## 📊 Executive Summary

Instead of running 149 manual tests every release, implement **tiered automation**:
- **Tier 1 (Critical Path):** 25-30 E2E tests (80% coverage with 20% effort)
- **Tier 2 (API Tests):** 40-50 integration tests (backend validation)
- **Tier 3 (Unit Tests):** 100+ unit tests (code quality)
- **Tier 4 (Performance):** 10-15 performance benchmarks
- **Tier 5 (Security):** 5-10 security scans

**Result:** Run 200+ automated tests in <10 minutes vs. 3-5 days manual testing

---

## 🎯 Automation Mapping by Test Category

### USER PERSPECTIVE TESTS (68 cases)

#### Module 1: Bus Search (8 cases) → **AUTOMATE WITH E2E**
```
Status: HIGH PRIORITY (Critical Path)
Tools: Playwright / Cypress
Coverage: 6/8 cases

E2E Tests to Create:
1. ✅ Search buses between two valid locations
2. ✅ Search with invalid location shows error
3. ✅ Autocomplete functionality works
4. ✅ Location select clears and resets form
5. ✅ Results display correct bus details
6. ✅ Schedule sorting (time, fare, duration)

Not Automated (Manual):
- UI responsiveness on different screen sizes (Visual regression)
- Exact styling/colors (Visual testing)
```

#### Module 2: Bus Tracking (6 cases) → **AUTOMATE WITH E2E**
```
Status: HIGH PRIORITY (Critical Path)
Tools: Playwright with mock location data
Coverage: 4/6 cases

E2E Tests to Create:
1. ✅ Tracking button appears and opens map
2. ✅ Map displays bus marker
3. ✅ Next stops show with ETAs
4. ✅ Route polyline renders correctly

Not Automated (Manual):
- Real GPS data accuracy (requires live tracking)
- Map smoothness/responsiveness (Visual testing)
```

#### Module 3: Authentication (12 cases) → **AUTOMATE WITH E2E + API**
```
Status: CRITICAL (Must Automate)
Tools: Playwright + REST Assured for API
Coverage: 10/12 cases

E2E Tests to Create:
1. ✅ Register new user with valid data
2. ✅ Register with invalid email shows error
3. ✅ Register with weak password rejected
4. ✅ Login with correct credentials
5. ✅ Login with wrong password fails
6. ✅ Profile page loads correctly
7. ✅ Change password works
8. ✅ Logout clears session

API Tests (Backend):
1. ✅ POST /auth/register creates user
2. ✅ POST /auth/login returns JWT token
3. ✅ GET /auth/profile requires token
4. ✅ POST /auth/change-password updates DB

Not Automated (Manual):
- Email confirmation flow (requires email service)
```

#### Module 4: User Contributions (15 cases) → **AUTOMATE WITH E2E + API**
```
Status: HIGH PRIORITY (Core Feature)
Tools: Playwright + REST Assured
Coverage: 12/15 cases

E2E Tests to Create:
1. ✅ Navigate to contribution form
2. ✅ Submit route with valid data
3. ✅ Submit with missing required fields (error)
4. ✅ Add bus stops to route
5. ✅ Can remove added stops
6. ✅ View contribution in dashboard
7. ✅ Edit contribution updates it
8. ✅ Cancel contribution discards changes

API Tests (Backend):
1. ✅ POST /contributions creates pending contribution
2. ✅ GET /contributions lists user contributions
3. ✅ PUT /contributions/{id} updates contribution
4. ✅ DELETE /contributions/{id} removes contribution

Not Automated (Manual):
- Image upload (requires file handling in test)
- Voice recording (requires microphone mocking)
- Image quality validation
```

#### Module 5: Reviews & Ratings (9 cases) → **AUTOMATE WITH E2E + API**
```
Status: MEDIUM-HIGH PRIORITY
Tools: Playwright + REST Assured
Coverage: 8/9 cases

E2E Tests to Create:
1. ✅ Submit review with rating and comment
2. ✅ Submit review without comment (rating only)
3. ✅ View all reviews for a bus
4. ✅ Filter reviews by rating
5. ✅ Edit own review
6. ✅ Delete own review
7. ✅ View review helpfulness voting

API Tests (Backend):
1. ✅ POST /reviews creates review
2. ✅ GET /reviews/{busId} lists reviews
3. ✅ PUT /reviews/{id} updates review
4. ✅ DELETE /reviews/{id} removes review

Not Automated (Manual):
- Profanity filter validation (manual QA)
```

#### Modules 6-11: Other User Features (18 cases) → **AUTOMATE 50%**
```
Status: MEDIUM PRIORITY
Coverage: 9/18 cases

E2E Tests (9 cases):
1. ✅ View announcements banner
2. ✅ View personal analytics dashboard
3. ✅ Change language to Tamil
4. ✅ Switch to dark mode
5. ✅ Share bus route via URL
6. ✅ Report bus issue
7. ✅ Enable/disable notifications
8. ✅ View nearby stops
9. ✅ View connecting routes

Manual Tests (9 cases):
- Exact Tamil character rendering
- Dark mode styling across all components
- Social media share dialog integration
- Notification permission handling
```

---

### ADMIN PERSPECTIVE TESTS (51 cases)

#### Module 1: Admin Auth (3 cases) → **AUTOMATE WITH E2E + API**
```
Status: CRITICAL
Coverage: 3/3 cases

E2E Tests:
1. ✅ Admin login with admin credentials
2. ✅ Non-admin user blocked from /admin
3. ✅ Admin logout clears session

API Tests:
1. ✅ POST /admin/login with admin user
2. ✅ GET /admin/dashboard requires admin role
```

#### Module 2: Route Management (10 cases) → **AUTOMATE WITH E2E + API**
```
Status: CRITICAL (Core Admin Feature)
Coverage: 9/10 cases

E2E Tests:
1. ✅ View all route contributions
2. ✅ Filter by status (pending, approved, rejected)
3. ✅ Search route by number
4. ✅ Approve route contribution
5. ✅ Approve with comments
6. ✅ Reject with reason
7. ✅ Edit contribution
8. ✅ Delete contribution
9. ✅ Approve changes integration into search

API Tests (Backend):
1. ✅ GET /admin/contributions lists all
2. ✅ GET /admin/contributions?status=PENDING filters
3. ✅ PUT /admin/contributions/{id}/approve
4. ✅ PUT /admin/contributions/{id}/reject
5. ✅ PUT /admin/contributions/{id} updates
6. ✅ DELETE /admin/contributions/{id}

Manual Test (1 case):
- Map preview rendering accuracy
```

#### Module 3: Image Management (5 cases) → **AUTOMATE WITH API**
```
Status: HIGH PRIORITY
Coverage: 5/5 cases

API Tests (Backend):
1. ✅ GET /admin/images?status=PENDING lists pending
2. ✅ GET /admin/images/{id}/preview gets full image
3. ✅ PUT /admin/images/{id}/approve approves
4. ✅ PUT /admin/images/{id}/reject rejects with reason
5. ✅ PUT /admin/images/{id}/flag flags for moderation

Note: E2E testing image uploads is complex, focus on API
```

#### Module 4: Route Issues (4 cases) → **AUTOMATE WITH API**
```
Status: MEDIUM PRIORITY
Coverage: 4/4 cases

API Tests:
1. ✅ GET /admin/issues lists all issues
2. ✅ GET /admin/issues/{id} gets details
3. ✅ PUT /admin/issues/{id}/resolve resolves
4. ✅ PUT /admin/issues/{id}/reopen reopens
```

#### Module 5: User Management (8 cases) → **AUTOMATE WITH E2E + API**
```
Status: CRITICAL (Security)
Coverage: 8/8 cases

E2E Tests:
1. ✅ View all users list
2. ✅ Search user by email
3. ✅ Promote user to moderator
4. ✅ Demote moderator to user
5. ✅ Ban user (can't login after)
6. ✅ Unban user (can login again)
7. ✅ Warn user (user sees warning)

API Tests:
1. ✅ GET /admin/users lists all users
2. ✅ GET /admin/users?search=email filters
3. ✅ PUT /admin/users/{id}/role updates role
4. ✅ PUT /admin/users/{id}/ban bans user
5. ✅ PUT /admin/users/{id}/unban unbans
```

#### Module 6: Analytics (6 cases) → **AUTOMATE WITH API**
```
Status: MEDIUM PRIORITY
Coverage: 5/6 cases

API Tests:
1. ✅ GET /admin/analytics/contributions gets stats
2. ✅ GET /admin/analytics/users gets user stats
3. ✅ GET /admin/analytics/tracking gets tracking stats
4. ✅ GET /admin/analytics/contributions/export downloads CSV
5. ✅ GET /admin/analytics/users/export downloads PDF

Manual Test (1 case):
- Chart rendering accuracy and real-time updates
```

#### Module 7: Settings (6 cases) → **AUTOMATE WITH API**
```
Status: MEDIUM PRIORITY
Coverage: 5/6 cases

API Tests:
1. ✅ PUT /admin/settings/feature-flags updates flags
2. ✅ GET /admin/settings/feature-flags/{name} gets status
3. ✅ PUT /admin/settings/email configures email
4. ✅ GET /admin/settings/database/stats gets stats
5. ✅ POST /admin/settings/database/backup triggers backup

Manual Test (1 case):
- Actual backup file creation and recovery
```

#### Module 8: Announcements (5 cases) → **AUTOMATE WITH E2E + API**
```
Status: MEDIUM PRIORITY
Coverage: 5/5 cases

E2E Tests:
1. ✅ Create app-wide announcement
2. ✅ Create route-specific announcement
3. ✅ Edit announcement
4. ✅ Delete announcement
5. ✅ Users see announcement on UI

API Tests:
1. ✅ POST /admin/announcements creates
2. ✅ PUT /admin/announcements/{id} updates
3. ✅ DELETE /admin/announcements/{id} deletes
```

#### Module 9: Security (4 cases) → **AUTOMATE WITH API**
```
Status: CRITICAL
Coverage: 4/4 cases

API Tests:
1. ✅ PUT /admin/security/ip-block blocks IP
2. ✅ DELETE /admin/security/ip-block/{ip} unblocks
3. ✅ GET /admin/security/rate-limit-violations lists
4. ✅ GET /admin/audit-logs lists admin actions
```

---

### CROSS-MODULE & SPECIAL TESTS (30 cases)

#### Integration Tests (5 cases) → **AUTOMATE WITH E2E**
```
Coverage: 5/5 cases

Tests to Create:
1. ✅ User submits contribution → Admin approves → Route appears in search
2. ✅ User leaves review → Review appears for other users immediately
3. ✅ Admin creates announcement → Users see it on home page
4. ✅ User tracks bus → Real-time position updates every 5s
5. ✅ Admin ban user → User can't login, existing sessions end
```

#### Performance Tests (5 cases) → **AUTOMATE WITH JMeter/Gatling**
```
Coverage: 5/5 cases

Benchmark Tests:
1. ✅ Search 1000 buses - response < 500ms
2. ✅ Load tracking map - initial render < 1s
3. ✅ Admin list 5000 contributions - paginated load < 300ms
4. ✅ API rate limit - 1000 req/min accepted, 1001st rejected
5. ✅ Database query - top 10 buses < 50ms

Tools: Apache JMeter or Gatling
Thresholds:
- P95 latency < acceptable threshold
- P99 latency < acceptable threshold
- 0% error rate
```

#### Security Tests (5 cases) → **AUTOMATE WITH OWASP ZAP / Manual**
```
Coverage: 3/5 cases (2 require manual)

Automated:
1. ✅ No SQL injection in search fields
2. ✅ No XSS in user review submissions
3. ✅ API requires authentication for protected endpoints

Manual Security Testing:
4. ⚠️ Admin-only endpoints enforce role checks
5. ⚠️ JWT token expiration and refresh
```

#### Mobile Tests (4 cases) → **AUTOMATE WITH Appium / MANUAL**
```
Coverage: 0/4 (Recommend Manual or Appium setup)

Tests (Manual for now):
1. ⚠️ Search works on mobile (iOS/Android)
2. ⚠️ Tracking map responsive on small screens
3. ⚠️ Contribution form usable on mobile
4. ⚠️ Admin panel responsive on tablet

Future Automation:
- Set up Appium for mobile E2E testing
- Use BrowserStack for cloud device testing
```

#### Localization Tests (3 cases) → **AUTOMATE WITH E2E**
```
Coverage: 3/3 cases

Tests:
1. ✅ Switch to Tamil - entire UI translates
2. ✅ Tamil input in search works (autocomplete)
3. ✅ Switching languages persists preference

Automation:
- Check all text nodes contain translation keys
- Validate no hardcoded English strings
- Test Tamil character rendering
```

#### Data Validation Tests (3 cases) → **AUTOMATE WITH API**
```
Coverage: 3/3 cases

Tests:
1. ✅ Email format validation (frontend & backend)
2. ✅ Password strength validation (8+ chars, mixed case)
3. ✅ Fare must be positive number

Automation:
- API tests reject invalid input
- Error messages are clear
- Database constraints enforced
```

---

## 🛠️ Recommended Tech Stack

### Frontend E2E Testing
```
Tool: Playwright (preferred) or Cypress
Why: 
  ✅ Fast test execution
  ✅ Good debugging experience
  ✅ Parallel test execution
  ✅ Cross-browser support (Chrome, Firefox, Safari)
  ✅ Can mock API responses
  ✅ Screenshots on failure

Setup:
npm install -D @playwright/test
npm install -D @faker-js/faker  # For test data

Tests Location: frontend/tests/e2e/
Test Framework: Playwright
Language: JavaScript/TypeScript

Example Test Structure:
```

### Backend API Testing
```
Tool: REST Assured (Java) or Postman (API)
Why:
  ✅ Test Spring Boot endpoints directly
  ✅ No UI needed - faster
  ✅ Can test error scenarios
  ✅ Database assertions possible
  ✅ Parallel test execution

Setup:
gradle testImplementation 'io.rest-assured:rest-assured:5.3.1'

Tests Location: backend/src/test/java/com/perundhu/integration/
Test Framework: JUnit 5
Language: Java

Example Test Structure:
```

### Performance Testing
```
Tool: Apache JMeter or Gatling
Why:
  ✅ Simulate concurrent users
  ✅ Measure response time percentiles
  ✅ Identify bottlenecks
  ✅ Load testing before production

Setup:
- JMeter: GUI tool, no coding
- Gatling: Code-based, better for CI/CD

Tests Location: performance-tests/
```

### Security Testing
```
Tool: OWASP ZAP (Open Source) or Burp Suite
Why:
  ✅ Automated vulnerability scanning
  ✅ SQL injection detection
  ✅ XSS vulnerability detection
  ✅ Security headers validation

Already in your CI:
- Trivy for container image scanning (✅ configured)
- Can add ZAP scanning to pipeline
```

---

## 📋 Implementation Roadmap (Phase-by-Phase)

### Phase 1: Foundation (Week 1-2) → 60% Coverage
**Goal:** Automate critical path tests

Priority Order:
1. ✅ **Auth Tests** (3 tests)
   - Register → Login → Logout flows
   - Validation: Error handling for invalid input

2. ✅ **Search Tests** (4-5 tests)
   - Search between two locations
   - Autocomplete functionality
   - Error handling (invalid location)
   - Results display validation

3. ✅ **Admin Route Approval** (4 tests)
   - Contribution workflow: Submit → Approve → Verify in search
   - Rejection with feedback

4. ✅ **Admin User Management** (3 tests)
   - Ban/unban user
   - Promote/demote roles
   - User search

**Estimated Time:** 40-50 hours
**Expected ROI:** 80% of bugs caught with 20% of test code

---

### Phase 2: Core Features (Week 3-4) → 85% Coverage
**Goal:** Automate major user and admin workflows

1. ✅ **Contribution Workflow** (6-8 tests)
   - Submit route contribution
   - Status tracking
   - Edit/delete contribution

2. ✅ **Reviews & Ratings** (5-6 tests)
   - Submit review
   - Edit/delete review
   - Filter by rating

3. ✅ **Tracking Feature** (3-4 tests)
   - Open tracking
   - Mock GPS data
   - Next stops display

4. ✅ **Analytics API Tests** (4-5 tests)
   - Contribution statistics
   - User statistics
   - Export CSV/PDF

5. ✅ **Security Tests** (3-4 tests)
   - Admin-only endpoint access
   - Non-admin user blocked
   - Rate limiting

**Estimated Time:** 50-60 hours

---

### Phase 3: Integration & Performance (Week 5-6) → 95% Coverage
**Goal:** End-to-end workflows and performance benchmarks

1. ✅ **Integration Tests** (5 tests)
   - Multi-step workflows
   - Real-time data validation

2. ✅ **Performance Tests** (5 tests)
   - API response time benchmarks
   - Database query optimization
   - Load testing

3. ✅ **Localization Tests** (3 tests)
   - Tamil translation verification
   - Character rendering

4. ✅ **Data Validation Tests** (3 tests)
   - Input validation (frontend & backend)
   - Database constraints

**Estimated Time:** 30-40 hours

---

### Phase 4: Advanced Testing (Week 7+) → 98%+ Coverage
**Goal:** Security, accessibility, mobile

1. **Security Scanning**
   - OWASP ZAP automation
   - Dependency vulnerability scanning (already have Trivy)

2. **Mobile Testing**
   - Appium setup (if needed)
   - BrowserStack integration for cross-device

3. **Visual Regression Testing**
   - Percy or Chromatic for UI regression
   - Screenshot comparison

**Estimated Time:** 20-30 hours (ongoing)

---

## 📁 Folder Structure for Test Code

```
perundhu/
├── frontend/
│   ├── tests/
│   │   ├── e2e/
│   │   │   ├── auth.spec.ts
│   │   │   ├── search.spec.ts
│   │   │   ├── contributions.spec.ts
│   │   │   ├── reviews.spec.ts
│   │   │   ├── tracking.spec.ts
│   │   │   ├── admin-routes.spec.ts
│   │   │   ├── admin-users.spec.ts
│   │   │   ├── admin-analytics.spec.ts
│   │   │   ├── integration.spec.ts
│   │   │   ├── localization.spec.ts
│   │   │   └── fixtures/
│   │   │       ├── test-data.ts
│   │   │       ├── mock-api.ts
│   │   │       └── test-users.ts
│   │   ├── unit/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   └── utils/
│   │   └── performance/
│   │       └── lighthouse.spec.ts
│   └── playwright.config.ts
│
├── backend/
│   ├── src/test/java/com/perundhu/
│   │   ├── integration/
│   │   │   ├── AuthIntegrationTest.java
│   │   │   ├── SearchIntegrationTest.java
│   │   │   ├── ContributionIntegrationTest.java
│   │   │   ├── AdminRouteManagementTest.java
│   │   │   ├── AdminUserManagementTest.java
│   │   │   ├── AnalyticsIntegrationTest.java
│   │   │   ├── ReviewIntegrationTest.java
│   │   │   ├── TrackingIntegrationTest.java
│   │   │   ├── SecurityIntegrationTest.java
│   │   │   └── PerformanceBenchmarkTest.java
│   │   └── unit/
│   │       └── [domain & service tests]
│   └── build.gradle [test dependencies]
│
└── performance-tests/
    ├── jmeter/
    │   ├── search-performance.jmx
    │   ├── admin-performance.jmx
    │   └── load-test.jmx
    └── gatling/
        └── [optional: Scala-based load tests]
```

---

## 🔄 CI/CD Integration

### Update GitHub Actions Workflow

Add test execution to your CI pipeline:

```yaml
# .github/workflows/ci.yml

jobs:
  frontend-e2e-tests:
    name: Frontend E2E Tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        working-directory: ./frontend
        run: npm ci
      
      - name: Run Playwright tests
        working-directory: ./frontend
        run: npm run test:e2e
      
      - name: Upload test report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: frontend/test-results/
  
  backend-integration-tests:
    name: Backend Integration Tests
    runs-on: ubuntu-latest
    services:
      mysql:
        image: mysql:8.0
        env:
          MYSQL_ROOT_PASSWORD: root
          MYSQL_DATABASE: perundhu_test
        options: >-
          --health-cmd="mysqladmin ping"
          --health-interval=10s
          --health-timeout=5s
          --health-retries=3
        ports:
          - 3306:3306
    
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with:
          java-version: '21'
          distribution: 'temurin'
          cache: 'gradle'
      
      - name: Run integration tests
        working-directory: ./backend
        run: |
          chmod +x gradlew
          ./gradlew test -DintegrationTests
        env:
          SPRING_DATASOURCE_URL: jdbc:mysql://localhost:3306/perundhu_test
          SPRING_DATASOURCE_USERNAME: root
          SPRING_DATASOURCE_PASSWORD: root
      
      - name: Generate coverage report
        working-directory: ./backend
        run: ./gradlew jacocoTestReport
      
      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          files: ./backend/build/reports/jacoco/test/jacocoTestReport.xml

  performance-tests:
    name: Performance Tests
    runs-on: ubuntu-latest
    needs: [frontend-e2e-tests, backend-integration-tests]
    if: github.event_name == 'push' && github.ref == 'refs/heads/master'
    
    steps:
      - uses: actions/checkout@v4
      - name: Run JMeter tests
        working-directory: ./performance-tests
        run: |
          # Install JMeter
          brew install jmeter || apt-get install -y jmeter
          # Run tests
          jmeter -n -t search-performance.jmx -l results.jtl

  security-tests:
    name: Security Scan
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      - name: Run OWASP ZAP scan
        uses: zaproxy/action-baseline@v0.7.0
        with:
          target: 'https://perundhu-preprod-frontend-xxx.asia-south1.run.app'
          rules_file_name: '.zap/rules.tsv'
          cmd_options: '-a'
```

---

## 📊 Test Execution Dashboard

After setting up automation, track metrics:

```
METRICS TO MONITOR:
├── Test Coverage
│   ├── Code Coverage: 70%+ (target)
│   ├── Feature Coverage: 90%+ (target)
│   └── Scenario Coverage: 95%+ (target)
│
├── Test Health
│   ├── Pass Rate: 98%+ (target)
│   ├── Flakiness: <2% (target)
│   └── Execution Time: <10 min (target)
│
├── Defect Detection
│   ├── Bugs caught by automation: 85%+ (target)
│   ├── Regression bugs: <1% (target)
│   └── Production issues: <2% (target)
│
└── Team Metrics
    ├── Time saved per release: 3-4 days
    ├── Manual testing time: Reduced to 4-6 hours
    └── Faster feedback loop: <15 min per commit
```

---

## ⚠️ What STAYS Manual (5-10% of Tests)

Even with 95% automation, some tests remain manual:

1. **Visual/UI Testing** (3-5% of tests)
   - Exact colors, fonts, spacing
   - Dark mode styling consistency
   - Responsive design on various devices

2. **User Experience** (1-2% of tests)
   - Accessibility (WCAG compliance)
   - Usability flows
   - Accessibility screen readers

3. **Hardware Integration** (1% of tests)
   - Real GPS tracking (requires device)
   - Microphone permission flows
   - Camera access

4. **Real-World Scenarios** (1-2% of tests)
   - Network latency conditions
   - Offline mode behavior
   - Low battery scenarios

---

## 📈 Expected Results Timeline

### Week 1-2 (Phase 1)
- ✅ 20-30 automated tests
- ✅ 60% coverage of critical paths
- ✅ Execution time: 2-3 minutes
- 📊 **Manual testing time reduced from 5 days to 3 days**

### Week 3-4 (Phase 2)
- ✅ 60-80 automated tests
- ✅ 85% coverage of all features
- ✅ Execution time: 5-7 minutes
- 📊 **Manual testing time reduced to 1-2 days**

### Week 5-6 (Phase 3)
- ✅ 100-120 automated tests
- ✅ 95% coverage across all modules
- ✅ Execution time: 8-10 minutes
- 📊 **Manual testing time reduced to 4-6 hours (smoke testing only)**

### Week 7+ (Phase 4)
- ✅ 150+ automated tests
- ✅ 98%+ coverage including security/performance
- ✅ Execution time: 10-12 minutes
- 📊 **Manual testing: Only visual/UX validation**

---

## 🎯 Quick Start: First Test

### Create your first E2E test (Playwright)

**1. Setup**
```bash
cd frontend
npm install -D @playwright/test @faker-js/faker
npx playwright install
```

**2. Create test file**
```
frontend/tests/e2e/auth.spec.ts
```

**3. Example test:**
```typescript
import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
  });

  test('User can register with valid email', async ({ page }) => {
    // Click register button
    await page.click('text=Register');
    
    // Fill form
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'Test@1234');
    await page.fill('input[name="confirmPassword"]', 'Test@1234');
    
    // Submit
    await page.click('button:has-text("Register")');
    
    // Verify success
    await expect(page).toHaveURL(/.*confirmation/);
    await expect(page).toContainText('Check your email');
  });

  test('Login with correct credentials succeeds', async ({ page }) => {
    // Go to login
    await page.click('text=Login');
    
    // Fill credentials
    await page.fill('input[type="email"]', 'user@example.com');
    await page.fill('input[type="password"]', 'Test@1234');
    
    // Submit
    await page.click('button:has-text("Login")');
    
    // Verify dashboard loaded
    await expect(page).toHaveURL(/.*\/home/);
    await expect(page).toContainText('user@example.com');
  });

  test('Login with wrong password fails', async ({ page }) => {
    await page.click('text=Login');
    await page.fill('input[type="email"]', 'user@example.com');
    await page.fill('input[type="password"]', 'WrongPassword');
    await page.click('button:has-text("Login")');
    
    // Verify error message
    await expect(page).toContainText('Invalid credentials');
    await expect(page).toHaveURL(/.*\/login/); // Still on login page
  });
});
```

**4. Run tests**
```bash
npm run test:e2e
# Or with UI
npm run test:e2e -- --ui
```

---

## 💡 Pro Tips

1. **Use fixtures for test data:**
   ```typescript
   const TEST_USER = {
     email: 'test@example.com',
     password: 'Test@1234'
   };
   ```

2. **Mock API responses for speed:**
   ```typescript
   await page.route('**/api/buses/**', route => {
     route.abort('blockedbyclient');
     // Or return mock data
   });
   ```

3. **Run tests in parallel:**
   ```typescript
   test.describe.parallel('Feature Tests', () => { ... });
   ```

4. **Use test retry for flaky tests:**
   ```typescript
   test.setTimeout(30000); // 30s timeout
   test.retries = 2; // Retry flaky tests
   ```

5. **Screenshot on failure:**
   ```
   # playwright.config.ts
   use: {
     screenshot: 'only-on-failure',
     video: 'retain-on-failure',
   }
   ```

---

## Summary: Automation vs Manual

| Aspect | Manual Testing | Automated Testing |
|--------|---|---|
| **Time per test cycle** | 3-5 days | <10 minutes |
| **Coverage** | 149 test cases | 150+ test cases |
| **Consistency** | Variable | 100% |
| **Regression detection** | Manual review | Immediate |
| **Cost per bug** | High (time-intensive) | Low (caught early) |
| **Scalability** | Doesn't scale | Scales easily |
| **Team velocity** | Slower | Faster |
| **Production issues** | 5-10% slip through | <1% slip through |

---

**Next Steps:**
1. ✅ Choose automation tool (recommend Playwright)
2. ✅ Set up first test file
3. ✅ Get team training (4-6 hours)
4. ✅ Implement Phase 1 (2 weeks)
5. ✅ Integrate into CI/CD pipeline
6. ✅ Measure coverage and ROI

**Questions?** This guide covers implementation of ~120-150 automated tests covering 95%+ of your 149 manual test cases!
