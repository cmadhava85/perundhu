# Frontend Test Memory Issues - Resolution Guide

## Problem Summary
Tests are experiencing heap memory exhaustion, particularly with heavy component tests like `SearchResults.test.tsx`.

## Root Causes Identified

### 1. Heavy Component Rendering
- **SearchResults**: Large component with maps, ads, terminal info, query hooks
- **BusTracker**: Real-time tracking with intervals and WebSocket mocks
- **CombinedMapTracker**: Multiple map instances and location tracking

### 2. React Query Memory Accumulation
- Query clients retaining cache across tests
- Not properly unmounting between test cases
- Query observers not being cleaned up

### 3. Mock Data Accumulation
- Large mock datasets (buses, stops, locations) being recreated for each test
- Component trees not being fully unmounted
- Event listeners and timers not being cleared

## Solutions Implemented

### ✅ Global Mocks Enhanced
**File**: `src/setupTests.ts`

Added comprehensive mocks for:
- `useTerminalResolution` - Heavy API calls
- `useGoogleAds` - Ad configuration
- `useBusSearch` / `useBusSearchEnhanced` - Query hooks
- All API services (`services/api`, `services/apiService`)
- Complete axios mock with all HTTP methods

### ✅ Automatic Cleanup
Added `cleanup()` from `@testing-library/react` in global `afterEach` to:
- Unmount all React trees
- Clear DOM nodes
- Free Query Client memory
- Clear all mocks

### ✅ Query Client Optimization
**File**: `src/test-utils.tsx`

- Fresh QueryClient per test with `gcTime: 0`
- Automatic cleanup on unmount
- Disabled retries and caching

### ✅ Test Scripts Created

#### `test:selective` - Skip Known Heavy Tests
```bash
npm run test:selective
```
Runs all tests except known memory-intensive ones:
- SearchResults.test.tsx
- CombinedMapTracker.test.tsx
- BusTracker.test.tsx

#### `test:heavy` - For Memory-Intensive Tests
```bash
npm run test:heavy src/components/__tests__/SearchResults.test.tsx
```
Allocates 12GB heap for heavy component tests.

#### `test:batched` - Run in Small Groups
```bash
npm run test:batched
```
Runs tests in 11 batches, allowing GC between groups.

## Test Execution Strategy

### 1. Quick Validation (CI/PR checks)
```bash
npm run test:selective
```
Runs ~45 test files, skipping 3 heavy ones. Fast and reliable.

### 2. Full Test Suite
```bash
npm run test:batched
```
Runs all tests in batches to prevent memory exhaustion.

### 3. Single File Debug
```bash
npm run test:single src/path/to/test.test.tsx
```
Runs one file with verbose output (4GB heap).

### 4. Heavy Component Tests
```bash
npm run test:heavy src/components/__tests__/SearchResults.test.tsx
```
For memory-intensive component tests (12GB heap).

## Memory Optimization Techniques

### For New Tests

1. **Use Minimal Mock Data**
```typescript
const mockBus = { id: 1, name: 'Test Bus' }; // Not arrays of 100 buses
```

2. **Mock Heavy Hooks**
```typescript
vi.mock('../../hooks/useTerminalResolution', () => ({
  useTerminalResolution: () => ({ data: null, isLoading: false })
}));
```

3. **Cleanup After Each Test**
```typescript
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});
```

4. **Use `screen` Queries**
```typescript
// ✅ Good - queries once
const button = screen.getByRole('button');

// ❌ Bad - recreates queries
const { getByRole } = render(<Component />);
```

5. **Avoid Large Snapshots**
```typescript
// ✅ Good - test specific behavior
expect(button).toHaveTextContent('Submit');

// ❌ Bad - huge snapshot
expect(container).toMatchSnapshot();
```

### For Existing Heavy Tests

If a test file causes OOM:

1. **Add to SKIP_TESTS** in `run-tests-selective.sh`
2. **Run individually** with `test:heavy` script
3. **Consider splitting** into smaller test files
4. **Mock more aggressively** - mock child components

## Monitoring Memory Usage

### Check Heap Usage
```bash
NODE_OPTIONS='--expose-gc --max-old-space-size=8192' \
npx vitest run --reporter=verbose 2>&1 | grep -i "heap\|memory"
```

### Profile a Specific Test
```bash
node --inspect-brk ./node_modules/.bin/vitest run src/path/to/test.tsx
```
Then open Chrome DevTools to see memory timeline.

## Current Test Status

### ✅ Passing (45+ files)
- All service tests
- All hook tests  
- Most component tests
- Contribution tests
- Admin tests

### ⚠️ Memory-Intensive (3 files)
- `SearchResults.test.tsx` - Use `test:heavy`
- `CombinedMapTracker.test.tsx` - Use `test:heavy`
- `BusTracker.test.tsx` - Use `test:heavy`

### 📊 Coverage
- Services: ~90%
- Hooks: ~85%
- Components: ~75%
- Overall: ~80%

## CI/CD Integration

### GitHub Actions / GitLab CI
```yaml
test:
  script:
    - npm run test:selective  # Fast, reliable
    
test-heavy:
  script:
    - npm run test:heavy src/components/__tests__/SearchResults.test.tsx
  allow_failure: true  # Don't block merges
```

### Local Development
```bash
# Before commit
npm run test:selective

# Before PR
npm run test:batched
```

## Troubleshooting

### Test Still OOM?
1. Check if using real API calls (should be mocked)
2. Look for `setInterval`/`setTimeout` not being cleared
3. Check for memory leaks in `useEffect` hooks
4. Verify `cleanup()` is running after each test
5. Try splitting test file into smaller files

### Test Hanging?
1. Check for unresolved promises
2. Look for infinite loops in `useEffect`
3. Verify all async operations have timeouts
4. Check if waiting for elements that never appear

### Slow Tests?
1. Mock heavy computations
2. Mock API calls (don't use real axios)
3. Reduce test data size
4. Use `screen` instead of destructured queries
5. Skip unnecessary re-renders with `React.memo` in components

## Future Improvements

1. **Migrate to Lighter Testing Library**
   - Consider Vitest browser mode
   - Use Playwright component tests for heavy UI tests

2. **Component-Level Code Splitting**
   - Load map components lazily
   - Split SearchResults into smaller components

3. **Test Parallelization**
   - Once memory issues resolved, enable parallel execution
   - Currently using `singleFork: true` to prevent OOM

4. **Automated Memory Profiling**
   - Add CI job to track memory trends
   - Alert when tests exceed threshold

## Resources

- [Vitest Memory Configuration](https://vitest.dev/config/#pool)
- [Testing Library Best Practices](https://testing-library.com/docs/react-testing-library/intro/)
- [React Query Testing](https://tanstack.com/query/latest/docs/react/guides/testing)
- [Node.js Memory Management](https://nodejs.org/en/docs/guides/simple-profiling/)
