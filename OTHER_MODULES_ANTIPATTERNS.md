# React Anti-Patterns Analysis - Other Modules

## Issues Found Across Modules

### 🔴 CRITICAL ISSUES

#### 1. **Missing Cleanup in useLocationData Hook**
**File:** `frontend/src/hooks/useLocationData.ts`

**Problem:**
```typescript
useEffect(() => {
  const fetchLocations = async () => {
    // ... API call
    const data = await getLocations(currentLanguage);
    setLocations(data);  // ⚠️ Can set state after unmount
  };
  fetchLocations();
}, [i18n.language, language]);  // ⚠️ No cleanup
```

**Issues:**
- No cleanup function to prevent state updates after unmount
- No AbortController to cancel pending requests
- `isFetching` flag prevents concurrent requests but doesn't cancel them
- Potential memory leak

**Fix Required:**
```typescript
useEffect(() => {
  let isMounted = true;
  const abortController = new AbortController();
  
  const fetchLocations = async () => {
    // ... existing code
    const data = await getLocations(currentLanguage, { signal: abortController.signal });
    
    if (isMounted) {
      setLocations(data);
      // ... other state updates
    }
  };
  
  fetchLocations();
  
  return () => {
    isMounted = false;
    abortController.abort();
  };
}, [i18n.language, language]);
```

---

#### 2. **Missing Cleanup in useLiveBusTracking Hook**
**File:** `frontend/src/hooks/useLiveBusTracking.ts`

**Problem:**
```typescript
useEffect(() => {
  fetchBusLocations();  // Initial fetch
  intervalRef.current = setInterval(fetchBusLocations, 30000);
  
  return () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };
}, [routeId, isEnabled]);  // ⚠️ fetchBusLocations not in dependencies
```

**Issues:**
- `fetchBusLocations` is defined outside useEffect but used inside
- Potential stale closure if function changes
- No AbortController for pending API calls when cleanup occurs

**Fix Required:**
```typescript
useEffect(() => {
  if (!isEnabled) {
    // ... cleanup code
    return;
  }

  let isMounted = true;
  const abortController = new AbortController();

  const fetchBusLocations = async () => {
    if (!isEnabled || !isMounted) return;

    try {
      setLoading(true);
      setError(null);
      const locations = await getCurrentBusLocations({ 
        signal: abortController.signal 
      });
      
      if (isMounted) {
        setBusLocations(locations);
        setLastUpdated(new Date());
      }
    } catch (err) {
      if (err.name === 'AbortError') return;
      if (isMounted) {
        setError(err instanceof Error ? err.message : 'Failed to fetch');
      }
    } finally {
      if (isMounted) {
        setLoading(false);
      }
    }
  };

  fetchBusLocations();
  const intervalId = setInterval(fetchBusLocations, 30000);

  return () => {
    isMounted = false;
    abortController.abort();
    clearInterval(intervalId);
  };
}, [routeId, isEnabled]);
```

---

#### 3. **State Initialized from Props Anti-Pattern**
**File:** `frontend/src/hooks/useBusTracking.ts`

**Problem:**
```typescript
export const useBusTracking = ({ buses, stops }: UseBusTrackingProps) => {
  const [busesState, setBuses] = useState<Bus[]>(buses);  // ⚠️ Initialized from props
  
  // ... later
  
  useEffect(() => {
    setBuses(buses);  // Syncing manually
  }, [buses]);
```

**Issues:**
- Duplicates state unnecessarily
- Props changes are synced via useEffect (anti-pattern)
- Should just use props directly

**Fix Required:**
```typescript
export const useBusTracking = ({ buses, stops }: UseBusTrackingProps) => {
  // Remove busesState, use buses directly
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // ... other state
  
  // Use buses prop directly
  return {
    buses,  // Use prop directly instead of state
    isLoading,
    error,
    // ...
  };
};
```

---

### 🟡 MEDIUM PRIORITY ISSUES

#### 4. **Multiple useEffects for Related Operations**
**File:** `frontend/src/components/admin/RouteAdminPanel.tsx`

**Problem:**
```typescript
useEffect(() => {
  loadRoutes();
}, [statusFilter]);

useEffect(() => {
  if (searchQuery.trim() === '') {
    setFilteredRoutes(routes);
  } else {
    // ... filtering logic
  }
}, [searchQuery, routes]);
```

**Issues:**
- Two separate effects that could potentially race
- No cleanup if search query changes rapidly

**Fix Required:**
```typescript
useEffect(() => {
  loadRoutes();
}, [statusFilter]);

useEffect(() => {
  // Debounce search filtering
  const timer = setTimeout(() => {
    if (searchQuery.trim() === '') {
      setFilteredRoutes(routes);
    } else {
      const filtered = routes.filter(/* ... */);
      setFilteredRoutes(filtered);
    }
  }, 300);
  
  return () => clearTimeout(timer);
}, [searchQuery, routes]);
```

---

#### 5. **Missing Cleanup in Admin Panels**
**Files:**
- `frontend/src/components/admin/ImageAdminPanel.tsx`
- `frontend/src/components/admin/ImageContributionAdminPanel.tsx`
- `frontend/src/components/admin/EnhancedImageAdminPanel.tsx`

**Problem:**
```typescript
useEffect(() => {
  fetchImageContributions();
}, []);

const fetchImageContributions = async () => {
  setLoading(true);
  const data = await AdminService.getImageContributions();
  setContributions(data);  // ⚠️ Can set state after unmount
  setLoading(false);
};
```

**Issues:**
- No cleanup to prevent state updates after unmount
- No error handling for aborted requests

**Fix Required:**
```typescript
useEffect(() => {
  let isMounted = true;
  const abortController = new AbortController();
  
  const fetchImageContributions = async () => {
    try {
      setLoading(true);
      const data = await AdminService.getImageContributions({ 
        signal: abortController.signal 
      });
      
      if (isMounted) {
        setContributions(data);
      }
    } catch (error) {
      if (error.name === 'AbortError') return;
      if (isMounted) {
        console.error('Error:', error);
      }
    } finally {
      if (isMounted) {
        setLoading(false);
      }
    }
  };
  
  fetchImageContributions();
  
  return () => {
    isMounted = false;
    abortController.abort();
  };
}, []);
```

---

#### 6. **UserSessionHistory Missing Cleanup**
**File:** `frontend/src/components/UserSessionHistory.tsx`

**Problem:**
```typescript
useEffect(() => {
  const fetchSessions = async () => {
    setLoading(true);
    const data = await getUserSessions(userId);
    setSessions(data);  // ⚠️ No cleanup
    setLoading(false);
  };
  fetchSessions();
}, [userId]);
```

**Same issue as above - needs cleanup.**

---

#### 7. **BusTracker Complex State Management**
**File:** `frontend/src/components/BusTracker.tsx`

**Problem:**
```typescript
const [selectedBusId, setSelectedBusId] = useState<number | null>(null);
const [selectedStopId, setSelectedStopId] = useState<number | null>(null);
const [isTracking, setIsTracking] = useState(false);
const [userLocation, setUserLocation] = useState<GeolocationPosition | null>(null);
const [trackingEnabled, setTrackingEnabled] = useState<boolean>(
  localStorage.getItem('perundhu-tracking-enabled') === 'true'
);
const [lastReportTime, setLastReportTime] = useState<Date | null>(null);
const [movementDetected, setMovementDetected] = useState<boolean>(false);
const [busStops, setBusStops] = useState<Stop[]>([]);
const [isOnboard, setIsOnboard] = useState<boolean>(false);
const [error, setError] = useState<string | null>(null);
```

**Issues:**
- 10 separate useState hooks - hard to manage
- Related state not grouped together
- Could benefit from useReducer

**Fix Required:**
```typescript
interface TrackingState {
  selectedBusId: number | null;
  selectedStopId: number | null;
  isTracking: boolean;
  userLocation: GeolocationPosition | null;
  trackingEnabled: boolean;
  lastReportTime: Date | null;
  movementDetected: boolean;
  busStops: Stop[];
  isOnboard: boolean;
  error: string | null;
}

type TrackingAction = 
  | { type: 'SELECT_BUS'; busId: number; stops: Stop[] }
  | { type: 'SELECT_STOP'; stopId: number }
  | { type: 'START_TRACKING'; location: GeolocationPosition }
  | { type: 'STOP_TRACKING' }
  | { type: 'SET_ERROR'; error: string | null }
  // ... other actions

const trackingReducer = (state: TrackingState, action: TrackingAction): TrackingState => {
  switch (action.type) {
    case 'SELECT_BUS':
      return { 
        ...state, 
        selectedBusId: action.busId,
        busStops: action.stops,
        selectedStopId: null 
      };
    // ... other cases
  }
};

const BusTracker: React.FC<BusTrackerProps> = ({ buses, stops }) => {
  const [state, dispatch] = useReducer(trackingReducer, initialState);
  // ...
};
```

---

### 🟢 LOW PRIORITY / CODE QUALITY

#### 8. **Inconsistent Hook Import Styles**

Some files use:
```typescript
import { useState, useEffect } from 'react';
```

Others use:
```typescript
import React, { useState, useEffect } from 'react';
```

**Recommendation:** Standardize to direct imports for better tree-shaking.

---

#### 9. **Missing Dependency Array in useCallback**
**File:** `frontend/src/hooks/useLocationData.ts`

```typescript
const getDestinations = useCallback((fromLocationId: number) => {
  const filtered = locations.filter(location => location.id !== fromLocationId);
  setDestinations(filtered);
  return filtered;
}, [locations]);  // ✅ Good - has dependency
```

This one is actually correct, but verify all useCallback uses have proper dependencies.

---

## Summary of Fixes Needed

### Critical (Memory Leaks):
1. ✅ Add cleanup to `useLocationData` hook
2. ✅ Add cleanup to `useLiveBusTracking` hook  
3. ✅ Fix state-from-props in `useBusTracking` hook
4. ✅ Add cleanup to `UserSessionHistory` component
5. ✅ Add cleanup to all admin panel components (5 files)

### Medium (Performance/UX):
6. ✅ Debounce search filtering in `RouteAdminPanel`
7. ✅ Consider useReducer for `BusTracker` complex state

### Low (Code Quality):
8. ⚠️ Standardize React import style
9. ⚠️ Verify all useCallback dependencies

---

## Files Requiring Updates

**Hooks (High Priority):**
1. `frontend/src/hooks/useLocationData.ts`
2. `frontend/src/hooks/useLiveBusTracking.ts`
3. `frontend/src/hooks/useBusTracking.ts`

**Components (High Priority):**
4. `frontend/src/components/UserSessionHistory.tsx`
5. `frontend/src/components/admin/ImageAdminPanel.tsx`
6. `frontend/src/components/admin/ImageContributionAdminPanel.tsx`
7. `frontend/src/components/admin/EnhancedImageAdminPanel.tsx`
8. `frontend/src/components/admin/RouteAdminPanel.tsx`

**Components (Medium Priority):**
9. `frontend/src/components/BusTracker.tsx`

**Total:** 9 files need fixes for memory leaks and anti-patterns

---

## Pattern to Follow

For ALL useEffect hooks that make API calls:

```typescript
useEffect(() => {
  let isMounted = true;
  const abortController = new AbortController();
  
  const fetchData = async () => {
    try {
      const data = await apiCall({ signal: abortController.signal });
      
      if (isMounted) {
        setState(data);
      }
    } catch (error) {
      if (error.name === 'AbortError' || error.name === 'CanceledError') {
        return; // Ignore cancelled requests
      }
      if (isMounted) {
        setError(error);
      }
    } finally {
      if (isMounted) {
        setLoading(false);
      }
    }
  };
  
  fetchData();
  
  return () => {
    isMounted = false;
    abortController.abort();
  };
}, [dependencies]);
```
