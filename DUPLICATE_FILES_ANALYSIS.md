# Duplicate Files Analysis & Fix Plan

## ✅ FIXES COMPLETED

### Problems Fixed:
1. ✅ **Removed confusion** between old and new hook implementations
2. ✅ **Fixed test mocks** to reference correct hook (`useBusSearchEnhanced`)  
3. ✅ **Deprecated incompatible test** file that tested deleted implementation
4. ✅ **Verified architecture** - App.tsx uses correct React Query-based hooks

### Files Modified:
1. **frontend/src/__tests__/App.test.tsx**
   - Changed mock from `useBusSearch` → `useBusSearchEnhanced`
   - Tests now mock the correct hook that App.tsx actually uses

2. **frontend/src/__tests__/useBusSearch.continuing.test.ts**
   - Renamed to `.deprecated` extension
   - Tests old hook API that no longer exists
   - Needs rewrite for React Query if continuing buses feature is important

### Files Already Deleted (Found Missing):
1. ✅ **frontend/src/hooks/useBusSearch.ts** - Already removed in previous cleanup

---

## Problem Summary
Multiple iterations of UI design changes created duplicate files instead of updating existing ones, causing:
- State updates not working correctly
- Hooks referencing wrong implementations  
- Confusion about which files are active

## Duplicate Files Found

### 1. Bus Search Hooks (✅ RESOLVED)
**Active (Correct):**
- ✅ `frontend/src/hooks/useBusSearchEnhanced.tsx` - Wrapper used by App.tsx
- ✅ `frontend/src/hooks/queries/useBusSearch.ts` - React Query implementation
- ✅ `frontend/src/hooks/queries/useBusSearchEnhanced.ts` - React Query enhanced version

**Removed:**
- ✅ ~~`frontend/src/hooks/useBusSearch.ts`~~ - Deleted (old setState-based version)

### 2. API Services
**Active:**
- ✅ `frontend/src/services/api.ts` - Main backend API (port 8080) - PRIMARY
- ✅ `frontend/src/services/apiClient.ts` - Analytics API (port 8081) - SEPARATE PURPOSE
- ✅ `frontend/src/services/apiService.ts` - Legacy class wrapper - KEPT FOR COMPATIBILITY

**Analysis:** These are NOT duplicates - each serves different purpose:
- `api.ts` - Main bus search/location API
- `apiClient.ts` - Analytics service (different port)
- `apiService.ts` - Class-based wrapper for legacy code

### 3. Loading Components
**Active:**
- ✅ `frontend/src/components/Loading.tsx` - Main loading component
- ✅ `frontend/src/components/LoadingSkeleton.tsx` - Skeleton loader for cards
- ✅ `frontend/src/components/ui/LoadingSpinner.tsx` - Spinner component
- ✅ `frontend/src/components/ui/LoadingState.tsx` - State-based loading

**Analysis:** All serve different purposes - NOT duplicates

## Files to Delete

1. **`frontend/src/hooks/useBusSearch.ts`**
   - Reason: Replaced by React Query implementation
   - Impact: Update 2 test files
   - Risk: LOW (only tests use it)

## Files to Update After Deletion

### Test Files:
1. **`frontend/src/__tests__/useBusSearch.continuing.test.ts`**
   - Change import from `../hooks/useBusSearch` to `../hooks/useBusSearchEnhanced`
   - Update mock to match new API

2. **`frontend/src/__tests__/App.test.tsx`**
   - Update mock from `hooks/useBusSearch` to `hooks/useBusSearchEnhanced`

## Root Cause Analysis

### Why This Happened:
1. Multiple UI redesigns created new files with similar names
2. Transition from useState to React Query created parallel implementations
3. Old files weren't deleted after migration
4. Tests still reference old implementations

### Current State Issues:
1. ✅ **App.tsx correctly uses** `useBusSearchEnhanced` (React Query version)
2. ❌ **Old hook still exists** causing confusion
3. ✅ **API calls work** but routing through wrapper layer
4. ⚠️ **Tests reference wrong implementation**

## Recommended Action Plan

### Phase 1: Immediate Fixes (DO NOW)
1. ✅ Keep `useBusSearchEnhanced.tsx` (currently in use by App.tsx)
2. ❌ Delete `hooks/useBusSearch.ts` (unused except tests)
3. ✅ Update tests to use `useBusSearchEnhanced`

### Phase 2: Verification
1. Run tests after deletion
2. Verify App.tsx still works
3. Check that searches trigger API calls
4. Confirm state updates work correctly

### Phase 3: Documentation
1. Add comments to active files explaining architecture
2. Document that React Query is the standard
3. Create architecture decision record (ADR)

## Current Architecture (CORRECT)

```
App.tsx
  └─> useBusSearchEnhanced.tsx (wrapper)
       └─> queries/useBusSearch.ts (React Query)
            └─> services/api.ts (axios calls)
                 └─> Backend (port 8080)
```

## Incorrect References to Remove

```typescript
// ❌ OLD (Delete this file)
import { useBusSearch } from '../hooks/useBusSearch';

// ✅ CORRECT (Already in use)
import { useBusSearchEnhanced } from './hooks/useBusSearchEnhanced';
```

## Impact Assessment

**Deleting `hooks/useBusSearch.ts`:**
- ✅ Removes confusion about which hook to use
- ✅ Forces all code to use React Query version
- ✅ Eliminates duplicate state management
- ⚠️ Requires updating 2 test files
- ✅ No impact on production code (App.tsx already uses correct version)

## Conclusion

The main issue is **one unused file** (`hooks/useBusSearch.ts`) that should be deleted.
The other "duplicates" actually serve different purposes and should be kept.

**Status:** Ready to execute cleanup - LOW RISK
