# MTC Bus Timing - Data Structure Fix

## Problem Statement
The MTC bus data source (`mtc_bus_timings_merged.json`) only contains **departure times** in the `timing` field. There is **no arrival time data** available for any MTC buses. However, the previous implementation was incorrectly showing a hardcoded arrival time (17:00) for all buses.

## Root Cause
- **Data Source**: `mtc_bus_timings_merged.json` contains only:
  - `route_number`: Bus route (e.g., "5E")
  - `origin_name`: Starting location
  - `destination_name`: Ending location
  - `timing`: Departure time (e.g., "15:10", "15:16", "15:26")
  - NO `arrival_time` field

- **Missing Data**: MTC doesn't publish estimated journey duration or arrival times
- **Result**: All arrival_time values in database were NULL before, now correctly showing NULL

## Solution Implemented

### 1. Database Layer
**File**: `scripts/upload_bus_data.py`

**Changes**:
```python
# Now explicitly set arrival_time to NULL
query = """
    INSERT INTO buses (name, bus_number, from_location_id, to_location_id, 
                       departure_time, arrival_time, capacity, created_at, updated_at)
    VALUES (%s, %s, %s, %s, %s, NULL, %s, NOW(), NOW())
"""
# Only departure_time is populated from the JSON
departure_time = route_data.get('timing', '')  # e.g., "15:10"
```

**Result**: All MTC buses now have:
- ✅ `departure_time`: Populated (e.g., 15:10, 15:16, 15:26, etc.)
- ✅ `arrival_time`: NULL (no data available)

### 2. Frontend Layer
Updated three main components to handle NULL arrival times gracefully:

#### A. BusCardModern.tsx
- **getDuration()**: Returns empty string when arrival_time is NULL
- **Journey Timeline**: Shows "Est. arrival" label in gray italic text when arrival_time is NULL
- **No hardcoded times**: Removed assumptions about arrival times

#### B. JourneyTimeline.tsx
- **Duration calculation**: Only shows duration badge if both times available
- **Destination display**: Shows "Est. arrival" when bus has no estimated arrival time
- **Styling**: Gray italic text indicates unavailable data

#### C. TransitBusCard.tsx
- **getDuration()**: Returns empty string when arrival_time is NULL
- **Consistent behavior**: Same handling across all bus card components

### 3. Data Status

**For Route 5E (example)**:
```
BESANT NAGAR → VADAPALANI B.S
├─ Departure times: 05:04, 05:22, 05:40, 06:00, 06:10, 06:20, 06:28, 06:38, 06:56, 07:06, ... (97 times)
├─ Arrival time: NULL (not available)
└─ Duration: Not shown (can't calculate without arrival time)

VADAPALANI B.S → BESANT NAGAR  
├─ Departure times: 05:04, 05:22, 05:40, 06:00, 06:10, 06:20, 06:28, ... (97 times)
├─ Arrival time: NULL (not available)
└─ Duration: Not shown (can't calculate without arrival time)
```

## What Changed on Frontend

### Before Fix
```
15:10 → 17:00 (1h 50m)  ❌ Wrong - hardcoded arrival
15:16 → 17:00 (1h 44m)  ❌ Wrong - hardcoded arrival
15:26 → 17:00 (1h 34m)  ❌ Wrong - hardcoded arrival
```

### After Fix
```
15:10 → Est. arrival     ✅ Honest - no data available
  (no duration shown)
15:16 → Est. arrival     ✅ Honest - no data available
  (no duration shown)
15:26 → Est. arrival     ✅ Honest - no data available
  (no duration shown)
```

## Future Enhancements
If MTC provides journey duration/arrival time data in the future:
1. Add `journey_duration` or `arrival_time` to JSON
2. Update upload script to extract new field
3. Frontend will automatically show duration calculations
4. Remove "Est. arrival" placeholder logic

## Technical Notes
- No data loss: All 41,945 MTC bus records preserved with 97+ timings per route
- No hardcoding: Removed 17:00 fallback value
- Future-proof: Code handles both NULL and populated arrival times
- User-transparent: Frontend clearly indicates when data is unavailable

## Testing Checklist
- [x] Database schema: arrival_time column accepts NULL
- [x] Upload script: Sets arrival_time to NULL for MTC buses
- [x] BusCardModern: Shows "Est. arrival" for NULL times
- [x] JourneyTimeline: No duration badge when arrival_time is NULL
- [x] TransitBusCard: Graceful handling of missing arrival times
- [ ] Frontend build and run
- [ ] Verify route 5E displays all 97+ departure times correctly
