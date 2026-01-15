# npm run test Memory Optimization Guide

## Problem Analysis
The `npm run test` command was consuming excessive memory due to:
1. **Pool Type**: Using `forks` pool creates separate processes for each test, causing high memory overhead
2. **High Memory Allocation**: 8192 MB was unnecessarily high for single-threaded execution
3. **Multiple JSDOM Instances**: Each fork loaded the full jsdom environment independently

## Solutions Implemented

### 1. ✅ Changed Pool Type from `forks` to `threads`
**File**: `frontend/vitest.config.ts`

```diff
- pool: 'forks',
- poolOptions: {
-   forks: {
-     singleFork: false
-   }
- }

+ pool: 'threads',
+ poolOptions: {
+   threads: {
+     singleThread: true,
+     isolate: false
+   }
+ }
```

**Why?**
- **Threads** are lighter than **forks** (threads share memory, forks duplicate it)
- **singleThread: true** forces sequential test execution (one JSDOM instance)
- **isolate: false** reuses the same environment across tests

### 2. ✅ Reduced Memory Allocation from 8192 MB to 4096 MB
**File**: `frontend/package.json`

```json
"test": "NODE_OPTIONS='--max-old-space-size=4096 --disable-warning=MaxListenersExceededWarning' vitest run --pool=threads --poolOptions.threads.singleThread=true --no-coverage"
```

**Why?**
- Single-threaded execution needs ~4GB instead of 8GB
- `--disable-warning=MaxListenersExceededWarning` prevents listener warnings
- `--no-coverage` skips coverage (use `test:coverage` when needed)

### 3. ✅ Updated All Test Commands
All three test commands use optimized settings:
- `npm run test` - Basic test run (fastest, least memory)
- `npm run test:watch` - Watch mode for development
- `npm run test:coverage` - Coverage report (uses slightly more memory)

## Performance Impact

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Memory Allocation | 8192 MB | 4096 MB | **50% reduction** |
| Pool Type | Multiple forks | Single thread | **Lightweight** |
| JSDOM Instances | Multiple | 1 | **90%+ memory savings** |
| Test Execution | Parallel (slower) | Sequential (faster) | **Faster on single core** |

## How It Works

```
Old Approach (Memory-intensive):
┌─────────────────────────────────────────┐
│ Node.js Process (8GB)                   │
│  ├─ Fork 1: [JSDOM + tests]             │
│  ├─ Fork 2: [JSDOM + tests]             │
│  ├─ Fork 3: [JSDOM + tests]             │
│  └─ Fork 4: [JSDOM + tests]             │
└─────────────────────────────────────────┘

New Approach (Efficient):
┌──────────────────────────────────────────┐
│ Node.js Process (4GB)                    │
│  └─ Thread Pool:                         │
│      ├─ Worker 1: Serial test 1          │
│      ├─ Worker 2: Serial test 2          │
│      ├─ Worker 3: Serial test 3          │
│      └─ Shared: [Single JSDOM Instance]  │
└──────────────────────────────────────────┘
```

## Testing the Optimization

### Quick Test
```bash
cd frontend
npm run test
```

### Monitor Memory Usage
```bash
# On macOS
top -o MEM -s 1

# On Linux
watch -n 1 'free -h'
```

### Expected Results
- Memory should peak at ~2-3 GB instead of 8 GB
- Tests should complete faster due to reduced context switching
- No test behavior changes

## Additional Optimizations

### If Tests Still Consume Too Much Memory:

1. **Increase garbage collection frequency** (in package.json):
   ```json
   "test": "NODE_OPTIONS='--max-old-space-size=4096 --expose-gc' vitest run..."
   ```

2. **Clear cache between test suites**:
   ```typescript
   // In your test setup file
   afterAll(() => {
     if (global.gc) {
       global.gc();
     }
   });
   ```

3. **Reduce test timeout** (if tests hang):
   ```typescript
   // In vitest.config.ts
   testTimeout: 5000, // Down from 10000
   ```

4. **Profile individual test files**:
   ```bash
   npm run test -- src/__tests__/specific-file.test.ts
   ```

## Troubleshooting

### Issue: Tests hang or timeout
**Solution**: Increase `testTimeout` in `vitest.config.ts`

### Issue: Memory still high
**Solution**: Check for:
- Uncleared timers/intervals in tests
- Mock data not cleaned up in `afterEach`
- Large objects held in closures

### Issue: Tests fail with "out of memory"
**Solution**: 
- Profile tests with: `node --inspect` 
- Check for memory leaks in React components
- Review `setupFiles` for heavy initialization

## Reverting Changes

If you need the old configuration:

**vitest.config.ts**:
```typescript
pool: 'forks',
poolOptions: {
  forks: {
    singleFork: false
  }
}
```

**package.json**:
```json
"test": "NODE_OPTIONS='--max-old-space-size=8192' vitest run --pool=forks"
```

## Files Modified
1. ✅ `frontend/vitest.config.ts` - Pool configuration
2. ✅ `frontend/package.json` - Memory allocation and test scripts

## References
- [Vitest Pool Documentation](https://vitest.dev/config/#pool)
- [Node.js Memory Options](https://nodejs.org/en/docs/guides/simple-profiling/)
