# 🚀 Quick Test Case Reference Guide

**Quick Overview of All Test Cases by Module**

---

## 👥 USER PERSPECTIVE - 11 MODULES

| # | Module | Key Test Cases | Count |
|---|--------|----------------|-------|
| 1 | **Bus Search & Schedule** | Basic search, location autocomplete, schedule display | 8 |
| 2 | **Bus Tracking** | Live location, map visualization | 6 |
| 3 | **Authentication** | Register, login, profile management | 12 |
| 4 | **Contributions** | Route, image, voice contributions, status tracking | 15 |
| 5 | **Reviews & Ratings** | Submit, view, edit, delete reviews | 9 |
| 6 | **Announcements** | View app-wide & route-specific announcements | 2 |
| 7 | **Analytics & History** | Personal stats, tracking history | 2 |
| 8 | **Rewards** | Points, badges, achievements | 4 |
| 9 | **Settings** | Language, theme, notifications | 5 |
| 10 | **Advanced Search** | Connecting routes, nearby stops | 2 |
| 11 | **Share & Social** | Share routes, report issues | 3 |
| | **TOTAL USER TESTS** | | **68 Test Cases** |

---

## 🛡️ ADMIN PERSPECTIVE - 9 MODULES

| # | Module | Key Test Cases | Count |
|---|--------|----------------|-------|
| 1 | **Admin Auth** | Login, authorization, logout | 3 |
| 2 | **Route Management** | View, filter, approve, reject, edit, delete | 10 |
| 3 | **Image Management** | Review, preview, approve, reject, flag | 5 |
| 4 | **Route Issues** | View, investigate, resolve, reopen | 4 |
| 5 | **User Management** | View users, role management, moderation (ban/warn) | 8 |
| 6 | **Analytics** | Contribution stats, user analytics, reports & export | 6 |
| 7 | **Settings & Config** | Feature flags, email, database maintenance | 6 |
| 8 | **Announcements** | Create, edit, delete announcements | 5 |
| 9 | **Security** | IP blocking, rate limiting, audit logs | 4 |
| | **TOTAL ADMIN TESTS** | | **51 Test Cases** |

---

## 🔗 INTEGRATION & SPECIAL TESTS

| Test Type | Count |
|-----------|-------|
| **Integration Tests** | 5 |
| **Performance Tests** | 5 |
| **Security Tests** | 5 |
| **Edge Case Tests** | 5 |
| **Mobile Tests** | 4 |
| **Localization Tests** | 3 |
| **Data Validation Tests** | 3 |
| **TOTAL SPECIAL TESTS** | **30 Test Cases** |

---

## 📊 TOTAL TEST COVERAGE

```
User Tests:           68 cases
Admin Tests:          51 cases
Integration Tests:    30 cases
────────────────────────────
TOTAL:              149 Test Cases
```

---

## ⚡ QUICK TEST EXECUTION GUIDE

### Phase 1: User Flow Tests (Start Here)
1. **Authentication Flow** (TC-U3.1.1 to TC-U3.3.4)
   - Register new user
   - Login/logout
   - Change password
   - View profile

2. **Search Flow** (TC-U1.1.1 to TC-U1.2.4)
   - Search buses
   - View schedules
   - Use autocomplete

3. **Contribution Flow** (TC-U4.1.1 to TC-U4.4.4)
   - Submit route
   - Upload image
   - Track status

### Phase 2: Admin Management Tests
1. **Contribution Review** (TC-A2.1.1 to TC-A2.4.2)
   - View pending
   - Approve/reject
   - Edit/delete

2. **User Administration** (TC-A5.1.1 to TC-A5.3.3)
   - View users
   - Manage roles
   - Ban/unban

### Phase 3: Advanced Testing
1. **Integration Tests**
   - End-to-end contribution
   - Cross-module features
   - Notification cascades

2. **Performance Tests**
   - Search performance
   - Concurrent users
   - File uploads

3. **Security Tests**
   - SQL injection
   - XSS attacks
   - CSRF protection

---

## 🎯 PRIORITY TEST CASES (Must Test First)

**Critical Path Tests (P0):**
- TC-U3.2.1: User login works
- TC-U1.1.1: Bus search works
- TC-U4.1.1: Route contribution works
- TC-A2.2.1: Admin can approve contributions
- TC-A2.3.1: Admin can reject contributions

**High Priority Tests (P1):**
- TC-U2.1.1: Bus tracking works
- TC-U5.1.1: Reviews work
- TC-A5.3.1: Admin ban/unban works
- TC-A6.1.1: Analytics display
- TC-A7.1.1: Feature flags work

---

## 📱 DEVICE MATRIX

**Browsers to Test:**
- [ ] Chrome (Desktop, Mobile)
- [ ] Safari (Desktop, iOS)
- [ ] Firefox (Desktop, Mobile)
- [ ] Edge (Desktop)
- [ ] Samsung Internet (Android)

**Devices:**
- [ ] iPhone 12/13/14/15
- [ ] iPad Pro
- [ ] Pixel 5/6/7
- [ ] Galaxy Tab
- [ ] Desktop 1080p
- [ ] Desktop 4K

---

## 🌐 LANGUAGES TO TEST

- [ ] **English** - Full UI coverage
- [ ] **Tamil** - Full UI coverage with Tamil input

---

## ✅ SIGN-OFF CHECKLIST

Before Release:
- [ ] All 68 user tests executed and passed
- [ ] All 51 admin tests executed and passed
- [ ] All 30 special tests executed and passed
- [ ] All P0 bugs fixed
- [ ] All P1 bugs fixed
- [ ] Performance thresholds met
- [ ] Security tests passed
- [ ] Mobile tests passed (iOS & Android)
- [ ] Language tests passed (EN & TA)
- [ ] UAT sign-off from stakeholders
- [ ] Production deployment approved

---

## 📞 TEST RESOURCES

**Test Environment:**
- Frontend: https://preprod.perundhu.local or deployed URL
- Backend API: https://api-preprod.perundhu.local or deployed URL
- Admin Panel: https://preprod.perundhu.local/admin

**Test Data:**
- Admin Email: admin@perundhu.local
- Test User: testuser@perundhu.local
- Test Routes: 41A, 41E, 42, 43, etc.
- Test Locations: See location database

---

## 📋 TEST RESULT TEMPLATE

```
═══════════════════════════════════════════════════════════════
Test Execution Report - [DATE]
═══════════════════════════════════════════════════════════════

Tester Name: ___________________________
Test Environment: [ ] Local [ ] Preprod [ ] Staging
Browser/Device: ___________________________

Total Tests Run: _________
Tests Passed: _________ (___%)
Tests Failed: _________
Tests Blocked: _________

Critical Issues Found:
1. ___________________________
2. ___________________________

Notes:
___________________________
___________________________

Signed: ___________________________
Date: ___________________________
═══════════════════════════════════════════════════════════════
```

---

## 🎓 TEST GUIDELINES

1. **Test Each Case Independently** - Don't assume previous test success
2. **Test in Different Browsers** - UI behavior may differ
3. **Test on Mobile First** - Then expand to desktop
4. **Verify Both Happy & Sad Paths** - Success AND error cases
5. **Check Data Persistence** - Data should survive page reload
6. **Verify Timestamps** - All timestamps should be accurate
7. **Test Search Thoroughly** - Try partial matches, empty, special chars
8. **Test Permissions** - Verify access control working
9. **Check Error Messages** - Should be helpful, not technical
10. **Test Notifications** - Should appear timely, no duplicates

---

## 🚨 When to Stop Testing

**Stop and escalate immediately if:**
- [ ] App crashes frequently (P0)
- [ ] Data is corrupted or lost (P0)
- [ ] Security vulnerability found (P0)
- [ ] Core feature completely broken (P1)
- [ ] Users can access unauthorized data (P0)

**Can continue with known issues:**
- [ ] UI alignment slightly off (P3)
- [ ] Typo in help text (P3)
- [ ] Slow performance but functional (P2)
- [ ] Feature partially working (P1/P2 - after analysis)

---

## 🔄 Regression Testing

After each major fix:
1. Run full test suite (all 149 tests)
2. Focus on:
   - Related modules
   - Recently modified code
   - Integration points
3. Document results in test log

---

**Keep this guide handy during testing!**

For detailed test steps, refer to MANUAL_TEST_CASES_COMPREHENSIVE.md

