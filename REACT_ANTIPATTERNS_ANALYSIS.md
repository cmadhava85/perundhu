# React Anti-Patterns & Issues Found

## Critical Issues Found

### 1. ⚠️ **Missing Cleanup in useEffect - Memory Leak Risk**

**File:** `frontend/src/hooks/useBusSearchEnhanced.tsx` (Lines 39-77)

**Problem:**
```tsx
React.useEffect(() => {
  if (!busSearchQuery.data?.buses || busSearchQuery.data.buses.length === 0) {
    setStopsMap({});
    return;
  }

  // Fetch stops for all buses
  const fetchAllStops = async () => {
    const newStopsMap: Record<number, Stop[]> = {};
    
    for (const bus of busSearchQuery.data.buses) {
      try {
        const response = await api.get(`/api/v1/bus-schedules/buses/${bus.id}/stops/basic`);
        // ... process response
        newStopsMap[bus.id] = stops.map(...)
      } catch (error) {
        newStopsMap[bus.id] = [];
      }
    }
    
    setStopsMap(newStopsMap);  // ⚠️ Can set state after unmount
  };

  fetchAllStops();
}, [busSearchQuery.data?.buses]);
```

**Issues:**
1. No cleanup function to cancel pending requests
2. State updates can happen after component unmounts → Memory leak warning
3. Sequential API calls in for-loop (slow performance)
4. No loading state while fetching

**Fix Required:**
```tsx
React.useEffect(() => {
  if (!busSearchQuery.data?.buses || busSearchQuery.data.buses.length === 0) {
    setStopsMap({});
    return;
  }

  let isMounted = true;
  const abortController = new AbortController();

  const fetchAllStops = async () => {
    const newStopsMap: Record<number, Stop[]> = {};
    
    // Parallel fetching instead of sequential
    const promises = busSearchQuery.data.buses.map(async (bus) => {
      try {
        const response = await api.get(
          `/api/v1/bus-schedules/buses/${bus.id}/stops/basic`,
          { signal: abortController.signal }
        );
        return { busId: bus.id, stops: response.data || [] };
      } catch (error) {
        if (error.name === 'AbortError') return null;
        return { busId: bus.id, stops: [] };
      }
    });

    const results = await Promise.all(promises);
    
    if (isMounted) {
      results.forEach(result => {
        if (result) {
          newStopsMap[result.busId] = result.stops.map(...);
        }
      });
      setStopsMap(newStopsMap);
    }
  };

  fetchAllStops();

  return () => {
    isMounted = false;
    abortController.abort();
  };
}, [busSearchQuery.data?.buses]);
```

---

### 2. ⚠️ **Stale Closure in useCallback**

**File:** `frontend/src/hooks/useBusSearchEnhanced.tsx` (Lines 81-95)

**Problem:**
```tsx
const searchBuses = React.useCallback(
  async (from: Location, to: Location) => {
    console.log(`🔍 Search triggered for: ${from.name} → ${to.name}`);
    setFromLocation(from);
    setToLocation(to);
    
    // Uses fromLocation/toLocation from closure
    if (fromLocation?.id === from.id && toLocation?.id === to.id) {
      await busSearchQuery.refetch();
    }
  },
  [fromLocation, toLocation, busSearchQuery]  // ⚠️ Recreated on every location change
);
```

**Issues:**
1. Dependencies include state that changes frequently
2. Callback recreated on every render when locations change
3. Defeats the purpose of `useCallback`

**Fix Required:**
```tsx
const searchBuses = React.useCallback(
  async (from: Location, to: Location) => {
    console.log(`🔍 Search triggered for: ${from.name} → ${to.name}`);
    
    // Use refs to avoid stale closure
    setFromLocation(prevFrom => {
      setToLocation(prevTo => {
        // Check if locations unchanged
        if (prevFrom?.id === from.id && prevTo?.id === to.id) {
          busSearchQuery.refetch();
        }
        return prevTo;
      });
      return from;
    });
    setToLocation(to);
  },
  [busSearchQuery]  // Only depends on query, not state
);
```

---

### 3. ⚠️ **Array Dependency Reference Issue**

**File:** `frontend/src/components/SearchResults.tsx` (Lines 48-58)

**Problem:**
```tsx
const allStops = Object.keys(stopsMap).length > 0 
  ? Object.values(stopsMap).flat() 
  : stops;
  
useEffect(() => {
  if (selectedBusId) {
    const busStops = stopsMap[selectedBusId] || allStops.filter(...);
    setSelectedBusStops(busStops);
  } else {
    setSelectedBusStops([]);
  }
}, [selectedBusId, stopsMap, allStops]);  // ⚠️ allStops recreated every render
```

**Issues:**
1. `allStops` is recalculated on every render (new array reference)
2. Causes useEffect to run unnecessarily
3. Dependency array includes derived value instead of source

**Fix Required:**
```tsx
useEffect(() => {
  if (selectedBusId) {
    // Calculate inside effect, don't use derived dependency
    const allStops = Object.keys(stopsMap).length > 0 
      ? Object.values(stopsMap).flat() 
      : stops;
    const busStops = stopsMap[selectedBusId] || allStops.filter(...);
    setSelectedBusStops(busStops);
  } else {
    setSelectedBusStops([]);
  }
}, [selectedBusId, stopsMap, stops]);  // Only source dependencies
```

---

### 4. ⚠️ **React.memo Without Comparison Function**

**Files:** Multiple components use React.memo but may not benefit

**Problem:**
```tsx
// TransitBusList.tsx
export default React.memo(TransitBusList);

// TransitSearchForm.tsx
export default React.memo(TransitSearchForm);

// TransitBusCard.tsx
export default React.memo(TransitBusCard);
```

**Issues:**
1. Props include objects/arrays that change references frequently
2. Shallow comparison always fails → memo is useless
3. Adding overhead without benefit

**Example - TransitSearchForm props:**
```tsx
interface TransitSearchFormProps {
  fromLocation?: AppLocation;       // Object - new ref each time
  toLocation?: AppLocation;         // Object - new ref each time
  onLocationChange?: (from, to) => void;  // Function - new ref each time
  onSearch?: (from, to, opts) => void;     // Function - new ref each time
  locations?: AppLocation[];        // Array - new ref each time
}
```

**Fix Options:**

**Option 1:** Add custom comparison
```tsx
export default React.memo(TransitSearchForm, (prevProps, nextProps) => {
  return (
    prevProps.fromLocation?.id === nextProps.fromLocation?.id &&
    prevProps.toLocation?.id === nextProps.toLocation?.id &&
    prevProps.locations?.length === nextProps.locations?.length
  );
});
```

**Option 2:** Remove memo (if parent doesn't re-render often)
```tsx
export default TransitSearchForm;
```

---

### 5. ⚠️ **Unnecessary State Initialization from Props**

**File:** `frontend/src/hooks/useBusTracking.ts`

**Problem:**
```tsx
const useBusTracking = ({ buses }: { buses: Bus[] }) => {
  const [busesState, setBuses] = useState<Bus[]>(buses);  // ⚠️ Ignores prop updates
  
  // buses prop changes won't update busesState!
}
```

**Issues:**
1. Initial state from props only runs once
2. Subsequent prop changes ignored
3. Creates stale data

**Fix Required:**

**Option 1:** Use prop directly
```tsx
const useBusTracking = ({ buses }: { buses: Bus[] }) => {
  // Just use buses directly, no state needed
  return { buses, ... };
}
```

**Option 2:** Sync with useEffect
```tsx
const useBusTracking = ({ buses }: { buses: Bus[] }) => {
  const [busesState, setBuses] = useState<Bus[]>(buses);
  
  useEffect(() => {
    setBuses(buses);
  }, [buses]);
  
  return { buses: busesState, ... };
}
```

---

### 6. ⚠️ **Missing Keys in Map Functions**

**File:** `frontend/src/components/Loading.tsx`

**Problem:**
```tsx
{[...Array(5)].map((_, index) => (
  <div key={index} className="loading-item">  // ⚠️ Index as key (anti-pattern)
    ...
  </div>
))}
```

**Issues:**
1. Using array index as key
2. Can cause rendering bugs if list reorders
3. React can't track items correctly

**Fix:**
```tsx
// Generate stable IDs
{Array.from({ length: 5 }, (_, i) => i).map((id) => (
  <div key={`skeleton-${id}`} className="loading-item">
    ...
  </div>
))}
```

---

### 7. ⚠️ **Multiple useEffect for Related Operations**

**File:** `frontend/src/components/admin/ImageAdminPanel.tsx`

**Problem:**
```tsx
useEffect(() => {
  fetchContributions();
}, []);

useEffect(() => {
  fetchStatistics();
}, []);
```

**Issues:**
1. Two separate effects that could be combined
2. Potential race conditions
3. Harder to maintain

**Fix:**
```tsx
useEffect(() => {
  const loadData = async () => {
    await Promise.all([
      fetchContributions(),
      fetchStatistics()
    ]);
  };
  loadData();
}, []);
```

---

## Performance Issues

### 1. Sequential API Calls (Not Parallelized)

**Location:** useBusSearchEnhanced.tsx - fetchAllStops

**Current:**
```tsx
for (const bus of busSearchQuery.data.buses) {
  const response = await api.get(...);  // Sequential
}
```

**Impact:** If 10 buses, 10 sequential requests = slow

**Fix:** Use Promise.all() for parallel requests

---

### 2. No Request Cancellation

**Impact:**
- Memory leaks
- State updates after unmount
- Wasted network bandwidth

**Files Affected:**
- useBusSearchEnhanced.tsx
- useLocationData.ts
- All components with useEffect + API calls

---

### 3. Derived State Recalculation

**Example:** SearchResults.tsx
```tsx
const allStops = Object.values(stopsMap).flat();  // Recalculated every render
```

**Fix:** Use useMemo
```tsx
const allStops = useMemo(() => 
  Object.values(stopsMap).flat(),
  [stopsMap]
);
```

---

## Code Quality Issues

### 1. Inconsistent Hook Usage

**Mixed patterns:**
- Some files use `React.useState`, others use `useState`
- Some files use `React.useEffect`, others use `useEffect`
- Some files use `React.useCallback`, others use `useCallback`

**Recommendation:** Pick one style and stick to it (prefer direct imports)

---

### 2. Empty Dependency Arrays

Several useEffect hooks have empty arrays `[]` meaning they run once.
This is fine, but ensure it's intentional and not missing dependencies.

---

## Summary of Fixes Needed

### High Priority (Memory Leaks / Bugs):
1. ✅ Add cleanup to useBusSearchEnhanced useEffect
2. ✅ Fix stale closure in searchBuses callback
3. ✅ Fix allStops dependency in SearchResults
4. ✅ Remove state from props in useBusTracking

### Medium Priority (Performance):
5. ✅ Parallelize API calls in useBusSearchEnhanced
6. ✅ Add request cancellation to all useEffect with API calls
7. ✅ Use useMemo for derived computations
8. ✅ Review React.memo usage - remove or add custom comparisons

### Low Priority (Code Quality):
9. ⚠️ Standardize React hook imports
10. ⚠️ Combine related useEffect calls
11. ⚠️ Use stable keys instead of index in maps

---

## Files Requiring Updates

1. **frontend/src/hooks/useBusSearchEnhanced.tsx** - HIGH PRIORITY
   - Add cleanup to useEffect
   - Parallelize API calls
   - Fix useCallback dependencies

2. **frontend/src/components/SearchResults.tsx** - HIGH PRIORITY
   - Fix allStops dependency issue

3. **frontend/src/hooks/useBusTracking.ts** - MEDIUM PRIORITY
   - Remove state initialization from props

4. **frontend/src/components/TransitSearchForm.tsx** - MEDIUM PRIORITY
   - Review React.memo effectiveness

5. **frontend/src/hooks/useLocationData.ts** - MEDIUM PRIORITY
   - Add request cancellation

6. **frontend/src/components/admin/ImageAdminPanel.tsx** - LOW PRIORITY
   - Combine related useEffects

---

## Recommended Actions

1. **Immediate:** Fix memory leak in useBusSearchEnhanced
2. **This Week:** Add cleanup to all useEffect hooks with API calls
3. **This Month:** Review and optimize React.memo usage
4. **Ongoing:** Standardize code patterns across codebase
