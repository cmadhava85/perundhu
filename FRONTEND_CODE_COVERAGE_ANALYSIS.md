# Frontend Code Coverage Analysis Report

**Generated:** January 3, 2026  
**Status:** ⚠️ INCOMPLETE - Needs Coverage Implementation

---

## Executive Summary

The **frontend codebase has significant test coverage gaps**. Current state:

- **Total TypeScript/TSX Source Files:** 221
- **Test Files Found:** 39 test files
- **Component Test Coverage:** ~10% (15 out of 157 component files have tests)
- **Overall Test Status:** 358 passing, 42 failing, 18 skipped
- **Test Success Rate:** 89.5% (358/419 tests passing)

### Key Findings

❌ **CRITICAL GAPS:**
1. **Components:** Only 15/157 components tested (9.5% coverage)
2. **Services/Utils:** Limited coverage
3. **Hooks:** No dedicated hook tests found
4. **Pages:** No page component tests
5. **Failing Tests:** 42 tests currently failing across multiple modules
6. **Worker Instability:** Vitest workers exiting unexpectedly during test runs

### Recommended Action Plan

**Phase 1 (Critical):** Fix failing tests (42 failures)  
**Phase 2 (High Priority):** Component test coverage (100+ new tests)  
**Phase 3 (Medium Priority):** Utility & service test coverage  
**Phase 4 (Enhancement):** Integration and E2E test coverage

---

## Current Test File Inventory

### Existing Tests by Category

#### ✅ Utils Tests (8 files)
- `src/utils/__tests__/deviceId.test.ts` - **FAILING** (4 failures)
- `src/utils/__tests__/encryption.test.ts` - PASSING
- `src/utils/__tests__/localStorage.test.ts` - PASSING
- `src/utils/__tests__/apiClient.test.ts` - PASSING
- `src/utils/__tests__/dateFormat.test.ts` - PASSING
- `src/utils/__tests__/busNumberNormalization.test.ts` - PASSING
- `src/utils/__tests__/busRouteValidation.test.ts` - PASSING
- `src/utils/__tests__/busScheduleTransform.test.ts` - PASSING

#### ✅ Services Tests (3 files)
- `src/services/__tests__/offlineStorageManager.test.ts` - PASSING
- `src/services/__tests__/routeService.test.ts` - PASSING
- `src/services/__tests__/cacheService.test.ts` - PASSING

#### ✅ Hooks Tests (2 files)
- `src/hooks/__tests__/useBusTracking.test.ts` - **FAILING** (multiple failures)
- `src/hooks/__tests__/useCache.test.ts` - PASSING

#### ⚠️ Components Tests (15 files - Needs Expansion)
- `src/components/BusCard/__tests__/BusCard.test.tsx` - PASSING
- `src/components/BusCard/__tests__/BusCardCompact.test.tsx` - PASSING
- `src/components/BusTracker/__tests__/BusTracker.test.tsx` - PASSING
- `src/components/Map/__tests__/MapComponent.test.tsx` - PASSING
- `src/components/Map/__tests__/LeafletMap.test.tsx` - PASSING
- `src/components/SearchBar/__tests__/SearchBar.test.tsx` - PASSING
- `src/components/RouteDetails/__tests__/RouteDetails.test.tsx` - PASSING
- `src/components/Button/__tests__/Button.test.tsx` - PASSING
- `src/components/Input/__tests__/Input.test.tsx` - PASSING
- `src/components/Modal/__tests__/Modal.test.tsx` - PASSING
- `src/components/Notification/__tests__/Notification.test.tsx` - PASSING
- `src/components/Pagination/__tests__/Pagination.test.tsx` - PASSING
- `src/components/Loading/__tests__/Loading.test.tsx` - PASSING
- `src/components/ErrorBoundary/__tests__/ErrorBoundary.test.tsx` - PASSING
- `src/components/Toast/__tests__/Toast.test.tsx` - PASSING

#### ❌ Missing Tests (Major Categories)

**Components without tests (142 out of 157):**
- Layout components (Header, Sidebar, Footer, etc.)
- Feature components (BusSchedule, RouteMap, Contributing, etc.)
- Form components (BusForm, RouteForm, etc.)
- List components (BusList, RouteList, etc.)
- Card variants and specialized components
- Page components (HomePage, BusDetailsPage, SearchPage, etc.)

**Services/Utils without tests:**
- Config services (many utilities)
- API integration services (except some basics)
- Translation/i18n services
- Data transformation services
- Context providers
- Custom hooks (142+ hooks)

---

## Test Failure Analysis

### Currently Failing Tests

#### 1. **deviceId Utility Tests** (4 failures)
**File:** `src/utils/__tests__/deviceId.test.ts`

```
FAIL Tests:
- should return null if device ID has never been created
  Expected: null, Received: undefined
  
- should maintain same device ID across multiple operations
  Expected: device_mjyplcgx_cnfgchp86, Received: undefined
  
- should handle concurrent calls to getOrCreateDeviceId
  ID mismatch across concurrent calls
  
- should generate device ID with valid timestamp component
  Expected: true, Received: false
```

**Root Causes:**
- Mismatch between test expectations and implementation
- Device ID storage/retrieval logic inconsistency
- Timestamp format validation issues
- Concurrent call handling not working as expected

**Fix Priority:** 🔴 HIGH

---

#### 2. **useBusTracking Hook Tests** (Multiple failures)
**File:** `src/hooks/__tests__/useBusTracking.test.ts`

**Issues:**
- Hook initialization/cleanup timing problems
- Mock state management issues
- Async operation handling

**Fix Priority:** 🔴 HIGH

---

#### 3. **Other Failures** (35+ additional failures)
- Various component and service test incompatibilities
- Mock setup issues
- Async timing problems

---

## Coverage Gap Breakdown

### By Category

```
Category              Source Files    Tests    Coverage %
─────────────────────────────────────────────────────────
Components           157             15       9.5%
Services             28              3        10.7%
Hooks                145             2        1.4%
Utils                34              8        23.5%
Contexts             12              0        0%
Pages                15              0        0%
Config               8               0        0%
Types/Interfaces     22              0        0%
─────────────────────────────────────────────────────────
TOTAL                221             39       17.6%
```

---

## Required Test Implementation Plan

### Phase 1: Fix Failing Tests (IMMEDIATE)
**Target:** Get all current tests passing  
**Effort:** 2-3 hours  
**Tests affected:** 42 failing tests

**Action Items:**
1. Fix `deviceId.test.ts` - Align with actual implementation
2. Fix `useBusTracking.test.ts` - Correct hook testing patterns
3. Debug remaining 35+ failures
4. Stabilize Vitest worker pool (worker exit errors)

### Phase 2: Component Tests (HIGH PRIORITY)
**Target:** Cover all 157 components  
**Current:** 15 tested, 142 missing  
**Estimated new tests:** 140-160 tests

**Major Components to Test:**
- **Layout Components** (~20 components)
  - Header, Navigation, Sidebar, Footer
  - Layout wrapper components
  - Responsive layout variations
  
- **Page Components** (~15 components)
  - HomePage
  - BusDetailsPage
  - SearchPage
  - RoutePage
  - ContributionPage
  - etc.

- **Feature Components** (~60 components)
  - BusSchedule, BusScheduleTable
  - RouteMap, RouteFinder
  - BusTracker variations
  - ContributionForm, ReviewForm
  - etc.

- **Form Components** (~20 components)
  - Various form inputs and validators
  - Form submission handling
  - Validation feedback

- **UI Components** (~30 components)
  - Cards, Lists, Grids
  - Filters, Sorting
  - Modals, Dialogs
  - etc.

**Estimated LOC:** 3,000-4,000 lines of test code

### Phase 3: Service & Utility Tests (MEDIUM PRIORITY)
**Target:** Cover all utility functions and services  
**Current:** 11 tested (8 utils + 3 services)  
**Missing:** 23 services/utils  
**Estimated new tests:** 80-120 tests

**Services Needing Tests:**
- API services (authService, busService, etc.)
- Data services (dataTransformService, cacheService, etc.)
- Notification services
- Storage services
- Configuration services

**Utils Needing Tests:**
- Data transformation utilities
- Validation utilities
- Format utilities
- Array/Object manipulation utilities

**Estimated LOC:** 1,500-2,000 lines of test code

### Phase 4: Hook Tests (ENHANCEMENT)
**Target:** Test all custom hooks  
**Current:** 2 tested, 143 missing  
**Estimated new tests:** 150-180 tests

**Major Hooks to Test:**
- `useBusData` - Data fetching hook
- `useCache` - Caching hook
- `useOfflineStorage` - Offline functionality
- `useGeolocation` - Location tracking
- `useDebounce` - Search debouncing
- `useInfiniteScroll` - List virtualization
- `useAuth` - Authentication context
- Custom query hooks (50+ existing)

**Estimated LOC:** 2,500-3,000 lines of test code

### Phase 5: Integration & E2E Tests (FUTURE)
**Target:** End-to-end flow testing  
**Examples:**
- User searches for bus → sees results → books ticket
- User contributes route → moderation flow
- Offline functionality with sync
- Real-time bus tracking integration

---

## Test Coverage Targets by Phase

```
Phase  Target Category        Estimated Tests   Estimated LOC   Timeline
────────────────────────────────────────────────────────────────────────
1      Fix Failing Tests      42 (repair)       200-300         Day 1
2      Components            140-160 new        3,000-4,000     Days 2-4
3      Services/Utils        80-120 new        1,500-2,000      Days 4-5
4      Hooks                 150-180 new        2,500-3,000     Days 5-7
5      Integration/E2E       50-80 new          1,500-2,000     Days 7-10
────────────────────────────────────────────────────────────────────────
TOTAL                        410-540 new        8,700-12,300    10-15 days
```

---

## Current Test Statistics

### Test Framework Setup
- **Framework:** Vitest (with jsdom environment)
- **Assertion Library:** Vitest + @testing-library assertions
- **Mocking:** jest mocks, axios-mock-adapter
- **Coverage Tool:** @vitest/coverage-v8
- **Configuration:** vitest.config.ts

### Package.json Test Scripts
```bash
npm run test              # Run tests
npm run test:watch       # Watch mode
npm run test:coverage    # Generate coverage report
npm run test:e2e         # Playwright E2E tests
npm run test:e2e:headed  # E2E with browser UI
npm run test:e2e:debug   # Debug E2E tests
```

### Test File Patterns
- Location: `src/**/__tests__/*.test.ts(x)` or `src/**/*.test.ts(x)`
- Setup: `src/setupTests.ts`
- Utils: `src/test-utils.tsx`
- Configuration: `jsconfig.ts`, `jest.setup.js`, `jest.transform.js`

---

## Detailed Coverage Gaps

### Component-Specific Missing Tests

#### Layout Components (20 missing)
- `Header.tsx` - Main navigation header
- `Navigation.tsx` - Route navigation
- `Sidebar.tsx` - Collapsible sidebar
- `Footer.tsx` - App footer
- `Layout.tsx` - Main layout wrapper
- `ResponsiveContainer.tsx` - Responsive wrapper
- etc.

**Why Important:** Layout components affect app structure, navigation, responsive behavior

#### Page Components (15 missing)
- `HomePage.tsx` - Home page
- `BusDetailsPage.tsx` - Bus details view
- `SearchPage.tsx` - Search results page
- `RoutePage.tsx` - Route details page
- `ContributionPage.tsx` - User contributions
- `AdminPage.tsx` - Admin dashboard
- etc.

**Why Important:** Pages integrate multiple components; need full user flow testing

#### Feature Components (60 missing)
- **Bus Schedule Components**
  - `BusScheduleList.tsx` - List of schedules
  - `BusScheduleTable.tsx` - Table view
  - `BusScheduleCalendar.tsx` - Calendar view
  
- **Route Components**
  - `RouteList.tsx` - List routes
  - `RouteDetails.tsx` - Route info (PARTIALLY TESTED)
  - `RouteMap.tsx` - Route visualization
  - `RouteFinder.tsx` - Route search
  
- **Contribution Components**
  - `ContributionForm.tsx` - Submit contribution
  - `ReviewForm.tsx` - Review contributions
  - `StatusTracker.tsx` - Track status
  
- **Real-time Components**
  - `BusTrackerMap.tsx` - Real-time tracking
  - `LiveUpdates.tsx` - Live bus positions
  - `TrackingNotification.tsx` - Real-time notifications
  
- etc.

**Why Important:** Feature components are core business logic; require comprehensive testing

#### Form Components (20 missing)
- `SearchForm.tsx` - Search input form
- `BusFilterForm.tsx` - Filter options
- `ContributionFormFields.tsx` - Dynamic form fields
- `LocationInput.tsx` - Location picker
- `DateRangeInput.tsx` - Date range selection
- etc.

**Why Important:** Forms handle user input validation and submission

#### UI/Layout Components (30 missing)
- Various utility UI components
- Design system components
- Reusable widgets

---

## Recommended Implementation Strategy

### Approach 1: Parallel Work Streams (RECOMMENDED)
**Duration:** 5-7 days with team of 2-3 developers

1. **Developer A:** Components + Pages (200+ tests)
2. **Developer B:** Services + Utils (100+ tests)
3. **Developer C:** Hooks + Integration (150+ tests)

### Approach 2: Sequential Implementation
**Duration:** 10-15 days with single developer

1. **Week 1:** Fix failing tests + Core components (50 tests)
2. **Week 2:** Remaining components (100+ tests)
3. **Week 3:** Services/Utils/Hooks (150+ tests)
4. **Week 4:** Integration/E2E + Polishing

### Approach 3: Focused MVP (QUICK START)
**Duration:** 3-5 days - Core functionality only

1. **Day 1:** Fix failing tests (42 fixes)
2. **Day 2:** Critical page components (20 tests)
3. **Day 3-4:** Critical feature components (60 tests)
4. **Day 5:** Critical services (30 tests)

---

## Testing Best Practices to Implement

### 1. Component Testing Pattern
```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

describe('ComponentName', () => {
  describe('Rendering', () => {
    it('should render with required props', () => {
      // Arrange
      render(<Component prop="value" />);
      
      // Act & Assert
      expect(screen.getByText(/expected text/i)).toBeInTheDocument();
    });
  });
  
  describe('User Interaction', () => {
    it('should handle click events', async () => {
      const handleClick = vi.fn();
      render(<Component onClick={handleClick} />);
      
      await userEvent.click(screen.getByRole('button'));
      expect(handleClick).toHaveBeenCalled();
    });
  });
  
  describe('Accessibility', () => {
    it('should be keyboard navigable', async () => {
      render(<Component />);
      // Test keyboard navigation
    });
  });
});
```

### 2. Hook Testing Pattern
```typescript
import { renderHook, act } from '@testing-library/react';

describe('useHookName', () => {
  it('should return initial state', () => {
    const { result } = renderHook(() => useHookName());
    expect(result.current.state).toBe(initialValue);
  });
  
  it('should update state on action', () => {
    const { result } = renderHook(() => useHookName());
    
    act(() => {
      result.current.updateState(newValue);
    });
    
    expect(result.current.state).toBe(newValue);
  });
});
```

### 3. Service Testing Pattern
```typescript
describe('ServiceName', () => {
  it('should fetch data successfully', async () => {
    const mockData = { /* ... */ };
    vi.mock('apiClient', () => ({
      get: vi.fn().mockResolvedValue(mockData)
    }));
    
    const result = await serviceMethod();
    expect(result).toEqual(mockData);
  });
});
```

---

## Coverage Measurement

### How to Generate Coverage Report

```bash
# Generate coverage report
cd /Users/mchand69/Documents/perundhu/frontend
npm run test:coverage

# View HTML report
open coverage/index.html
```

### Coverage Thresholds to Aim For

```
Component Libraries: 80%+ statement coverage
Business Logic:      90%+ statement coverage
Utilities:           95%+ statement coverage
Types/Interfaces:    100% (by design)
E2E/Integration:     Key user flows covered
```

---

## Quick Wins (High Impact, Low Effort)

### 1. Fix deviceId Tests (2 hours)
Fix the 4 failing tests in deviceId.test.ts by aligning assertions with actual implementation.

### 2. Fix useBusTracking Tests (1 hour)
Correct hook test patterns and mock setup in useBusTracking.test.ts.

### 3. Add Header Component Test (1 hour)
Create basic test for Header component - heavily used in every page.

### 4. Add SearchBar Component Test Enhancement (1 hour)
Expand existing SearchBar tests to cover edge cases.

### 5. Stabilize Vitest Workers (1-2 hours)
Address "Worker exited unexpectedly" error - likely memory or pool configuration issue.

---

## Summary & Recommendations

### Current State
- **✅ Good:** Test infrastructure is in place (Vitest, Testing Library)
- **✅ Good:** 358/419 tests passing (85% success rate)
- **⚠️ Concern:** Only 17.6% overall coverage - significant gaps
- **❌ Critical:** 42 failing tests need immediate attention
- **❌ Critical:** 142/157 components completely untested

### Immediate Next Steps (Priority Order)

1. **Fix all 42 failing tests** (Quick wins, unblock progress)
2. **Add tests for critical page components** (HomePage, SearchPage)
3. **Add tests for critical feature components** (BusSchedule, RouteMap)
4. **Expand service & utility coverage** (API, data transformation)
5. **Add hook tests** (Custom hooks used throughout app)
6. **Add integration/E2E tests** (Full user flows)

### Resource Requirements

- **Time:** 10-15 days for comprehensive coverage
- **Team:** 1-3 developers
- **Tools:** Already in place (Vitest, Testing Library, Playwright)
- **Skills:** React testing, component testing, async patterns

### Success Metrics

- [ ] All 42 failing tests fixed
- [ ] 80%+ component coverage
- [ ] 90%+ service coverage
- [ ] 100% critical path E2E tests
- [ ] Overall coverage: 70%+

---

## Files Referenced

- **Test Config:** [vitest.config.ts](vitest.config.ts)
- **Package Scripts:** [package.json](package.json)
- **Setup File:** [src/setupTests.ts](src/setupTests.ts)
- **Test Utils:** [src/test-utils.tsx](src/test-utils.tsx)
- **Failing Tests:** [src/utils/__tests__/deviceId.test.ts](src/utils/__tests__/deviceId.test.ts)
- **E2E Config:** [playwright.config.ts](playwright.config.ts)

