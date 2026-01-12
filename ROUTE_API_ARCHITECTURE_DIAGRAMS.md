# Route API Architecture Diagrams

## Current vs. Proposed Architecture

### CURRENT FLOW (LIMITED)
```
┌─────────────────────────────────────────────────────────────────┐
│ USER SEARCH: "Salem to Madurai"                                 │
└─────────────────────────────────────────────────────────────────┘
                           ↓
         ┌──────────────────────────────────────┐
         │ User types "Salem"                    │
         │ Frontend calls autocomplete-grouped   │
         └──────────────────────────────────────┘
                           ↓
         ┌──────────────────────────────────────┐
         │ Response includes:                    │
         │ • Salem (id=123)                      │
         │ • Salem - New Bus Stand (id=124)      │
         │ • Salem - Old Bus Stand (id=125)      │
         │ (But user only sees "Salem")          │
         └──────────────────────────────────────┘
                           ↓
         ┌──────────────────────────────────────┐
         │ ❌ PROBLEM:                           │
         │ User must manually select bus stand   │
         │ OR clicks first option (id=123)       │
         └──────────────────────────────────────┘
                           ↓
         ┌──────────────────────────────────────┐
         │ API: GET /connecting-routes           │
         │   ?fromLocationId=123                 │
         │   &toLocationId=200                   │
         │ ❌ Only searches from id=123          │
         │ ❌ Misses buses from id=124, id=125   │
         └──────────────────────────────────────┘
                           ↓
         ┌──────────────────────────────────────┐
         │ Results: 8 routes                     │
         │ ❌ INCOMPLETE - Missing:              │
         │   • 5 routes from New Bus Stand       │
         │   • 3 routes from Old Bus Stand       │
         └──────────────────────────────────────┘
```

---

### PROPOSED FLOW (COMPLETE)
```
┌─────────────────────────────────────────────────────────────────┐
│ USER SEARCH: "Salem to Madurai"                                 │
└─────────────────────────────────────────────────────────────────┘
                           ↓
         ┌──────────────────────────────────────┐
         │ User types "Salem"                    │
         │ Presses search                        │
         └──────────────────────────────────────┘
                           ↓
         ┌─────────────────────────────────────────────────────────┐
         │ ✅ NEW ENDPOINT:                                         │
         │ GET /connecting-routes-by-name                           │
         │   ?from=Salem                                            │
         │   &to=Madurai                                            │
         │   &language=en                                           │
         │   &maxTransfers=2                                        │
         └─────────────────────────────────────────────────────────┘
                           ↓
         ┌────────────────────────────────────────────────────────────┐
         │ STEP 1: Resolve all locations                              │
         │ searchLocationsGrouped("Salem", "en") →                    │
         │ [                                                           │
         │   LocationGroupDTO{                                        │
         │     cityName: "Salem",                                     │
         │     cityOption: {id: 123, name: "Salem"},                  │
         │     busStands: [                                           │
         │       {id: 124, name: "Salem - New Bus Stand"},            │
         │       {id: 125, name: "Salem - Old Bus Stand"}             │
         │     ]                                                      │
         │   }                                                        │
         │ ]                                                          │
         └────────────────────────────────────────────────────────────┘
                           ↓
         ┌─────────────────────────────────────────────────────────┐
         │ STEP 2: Extract all location IDs                        │
         │ fromLocationIds = [123, 124, 125]                       │
         │ toLocationIds = [200, 201]                              │
         └─────────────────────────────────────────────────────────┘
                           ↓
         ┌─────────────────────────────────────────────────────────┐
         │ STEP 3: Search across all combinations                  │
         │ for each fromId in [123, 124, 125]:                     │
         │   for each toId in [200, 201]:                          │
         │     findConnectingRoutes(fromId, toId, 2)               │
         │                                                          │
         │ Total: 6 searches (but deduplicated)                    │
         └─────────────────────────────────────────────────────────┘
                           ↓
         ┌─────────────────────────────────────────────────────────┐
         │ ✅ COMPLETE RESULTS:                                     │
         │ {                                                        │
         │   "fromLocations": [                                     │
         │     {id: 123, name: "Salem", type: "CITY"},              │
         │     {id: 124, name: "Salem - New Bus Stand", ...},       │
         │     {id: 125, name: "Salem - Old Bus Stand", ...}        │
         │   ],                                                     │
         │   "toLocations": [...],                                  │
         │   "routes": [                                            │
         │     Route1 from Salem (123) to Madurai (200),            │
         │     Route2 from Salem - New (124) to Madurai (200),      │
         │     Route3 from Salem - Old (125) to Madurai (201),      │
         │     ...                                                  │
         │   ],                                                     │
         │   "totalRoutes": 16  ✅ (vs 8 previously)                │
         │ }                                                        │
         └─────────────────────────────────────────────────────────┘
```

---

## Request/Response Comparison

### CURRENT: ID-based Search
```
REQUEST:
─────────
GET /api/v1/bus-schedules/connecting-routes
  ?fromLocationId=123
  &toLocationId=200
  &maxTransfers=2

RESPONSE:
─────────
[
  {
    "id": "route-1",
    "legs": [
      {
        "busId": 1,
        "departure": "08:00",
        "arrival": "11:30",
        "duration": 210
      },
      {
        "busId": 2,
        "departure": "13:00",
        "arrival": "16:45",
        "duration": 225
      }
    ],
    "transfers": 1,
    "totalDuration": 510
  },
  ...
]

❌ Problems:
- No indication which bus stand bus departs from
- No indication which bus stand bus arrives at
- User doesn't know if this is from "Salem" or "Salem - New Bus Stand"
```

---

### PROPOSED: Name-based Search
```
REQUEST:
─────────
GET /api/v1/bus-schedules/connecting-routes-by-name
  ?from=Salem
  &to=Madurai
  &maxTransfers=2
  &language=en

RESPONSE:
─────────
{
  "fromLocationName": "Salem",
  "toLocationName": "Madurai",
  "fromLocations": [
    {
      "locationId": 123,
      "name": "Salem",
      "type": "CITY",
      "busStandName": null,
      "busCount": 12
    },
    {
      "locationId": 124,
      "name": "Salem - New Bus Stand",
      "type": "BUS_STAND",
      "busStandName": "Salem - New Bus Stand",
      "busCount": 8
    },
    {
      "locationId": 125,
      "name": "Salem - Old Bus Stand",
      "type": "BUS_STAND",
      "busStandName": "Salem - Old Bus Stand",
      "busCount": 7
    }
  ],
  "toLocations": [
    {
      "locationId": 200,
      "name": "Madurai",
      "type": "CITY",
      "busStandName": null,
      "busCount": 15
    },
    {
      "locationId": 201,
      "name": "Madurai - Central Bus Stand",
      "type": "BUS_STAND",
      "busStandName": "Madurai - Central Bus Stand",
      "busCount": 10
    }
  ],
  "routes": [
    {
      "id": "route-1",
      "legs": [
        {
          "busId": 1,
          "busNumber": "TN-01-AB-1001",
          "operatorName": "TNSTC",
          "departure": "08:00",
          "arrival": "11:30",
          "duration": 210,
          "fromStopName": "Salem",
          "toStopName": "Trichy"
        },
        {
          "busId": 15,
          "busNumber": "TN-01-AB-1015",
          "operatorName": "TNSTC",
          "departure": "13:00",
          "arrival": "16:45",
          "duration": 225,
          "fromStopName": "Trichy",
          "toStopName": "Madurai"
        }
      ],
      "transfers": 1,
      "totalDuration": 510,
      "fromBusStand": {
        "locationId": 124,
        "name": "Salem - New Bus Stand",
        "city": "Salem",
        "type": "BUS_STAND",
        "latitude": 11.6643,
        "longitude": 78.1460
      },
      "toBusStand": {
        "locationId": 201,
        "name": "Madurai - Central Bus Stand",
        "city": "Madurai",
        "type": "BUS_STAND",
        "latitude": 9.9252,
        "longitude": 78.1198
      },
      "isFromPreferredStand": true,
      "isToPreferredStand": false
    },
    ...
  ],
  "totalFromLocations": 3,
  "totalToLocations": 2,
  "totalRoutes": 16
}

✅ Benefits:
- Clear which bus stand each route uses
- Shows all location options upfront
- Includes all routes from all bus stands
- Matches user input type (city name)
- Provides bus count for each location
- Indicates user preferences
```

---

## Service Layer Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                    REST Controller Layer                          │
│ BusScheduleController.getConnectingRoutesByName()                │
└──────────────────────────────────────────────────────────────────┘
                           ↓
        ┌──────────────────────────────────────┐
        │ 1. Validate & Sanitize Input        │
        │ 2. Check Rate Limits                │
        └──────────────────────────────────────┘
                           ↓
┌──────────────────────────────────────────────────────────────────┐
│              BusScheduleService Layer (NEW)                       │
│                                                                   │
│  findConnectingRoutesByName(from, to, maxTransfers, language)    │
│    ├─ searchLocationsGrouped(from, language)    [REUSE]          │
│    ├─ searchLocationsGrouped(to, language)      [REUSE]          │
│    ├─ extractAllLocationIds(groups)             [NEW HELPER]      │
│    └─ findConnectingRoutesAcrossLocations(...)  [DELEGATE]        │
└──────────────────────────────────────────────────────────────────┘
                           ↓
┌──────────────────────────────────────────────────────────────────┐
│            ConnectingRouteService Layer (ENHANCED)                │
│                                                                   │
│  findConnectingRoutesAcrossLocations(fromIds, toIds, max)        │
│    ├─ for each fromId in fromIds:                                │
│    │   for each toId in toIds:                                   │
│    │     ├─ findConnectingRoutes(fromId, toId, max) [EXISTING]   │
│    │     └─ Collect & deduplicate results                        │
│    │                                                              │
│    └─ Return sorted, top-10 results [FINAL]                      │
└──────────────────────────────────────────────────────────────────┘
                           ↓
┌──────────────────────────────────────────────────────────────────┐
│            Repository Layer (UNCHANGED)                           │
│                                                                   │
│  ├─ LocationRepository.findByName()                              │
│  ├─ BusRepository.findBusesBetweenLocations()                    │
│  ├─ StopRepository.findByLocationId()                            │
│  └─ BusStandRepository.findByCityName()                          │
└──────────────────────────────────────────────────────────────────┘
```

---

## Data Flow: Multi-Location Search

```
Input:
  from="Salem"
  to="Madurai"
  maxTransfers=2
  language="en"

                     ↓

Step 1: Location Resolution
┌─────────────────────────────────────────────────────────┐
│ BusScheduleService.searchLocationsGrouped("Salem", "en")│
│                                                          │
│ Query: Find locations matching "Salem"                 │
│   ↓                                                     │
│ LocationRepository: SELECT * FROM locations             │
│   WHERE name LIKE '%Salem%'                             │
│                                                          │
│ Response:                                               │
│   LocationGroupDTO {                                    │
│     cityName: "Salem"                                   │
│     cityOption: Location{id:123, name:"Salem"}          │
│     busStands: [                                        │
│       Location{id:124, name:"Salem - New Bus Stand"},   │
│       Location{id:125, name:"Salem - Old Bus Stand"}    │
│     ]                                                   │
│   }                                                     │
└─────────────────────────────────────────────────────────┘
                     ↓
Step 2: Extract IDs
┌─────────────────────────────────────────────────────────┐
│ fromLocationIds = [123, 124, 125]                       │
│ toLocationIds = [200, 201, ...]                         │
└─────────────────────────────────────────────────────────┘
                     ↓
Step 3: Multi-Location Dijkstra Search
┌─────────────────────────────────────────────────────────┐
│ For each (fromId, toId) pair:                           │
│                                                          │
│ Pair 1: 123 → 200                                       │
│   ConnectingRouteService.findConnectingRoutes(123, 200) │
│   → Uses Dijkstra to find routes                        │
│   → Returns: [Route1, Route2, Route3]                   │
│                                                          │
│ Pair 2: 123 → 201                                       │
│   ConnectingRouteService.findConnectingRoutes(123, 201) │
│   → Returns: [Route4, Route5]                           │
│                                                          │
│ Pair 3: 124 → 200                                       │
│   ConnectingRouteService.findConnectingRoutes(124, 200) │
│   → Returns: [Route1(dup), Route6, Route7]              │
│                                                          │
│ Pair 4: 124 → 201                                       │
│   → Returns: [Route8]                                   │
│                                                          │
│ ... and so on ...                                       │
└─────────────────────────────────────────────────────────┘
                     ↓
Step 4: Deduplication
┌─────────────────────────────────────────────────────────┐
│ Unique Routes (by bus IDs + times):                     │
│ [Route1, Route2, Route3, Route4, Route5, Route6, Route7,│
│  Route8, ...]                                           │
│                                                          │
│ Removed: Route1(dup from pair 3)                        │
└─────────────────────────────────────────────────────────┘
                     ↓
Step 5: Sort & Limit
┌─────────────────────────────────────────────────────────┐
│ Sort by: Cost (time + transfer penalty)                 │
│ Keep: Top 10 results                                    │
│                                                          │
│ Final Routes:                                           │
│ 1. Route2 (cost: 520) - 1 transfer                      │
│ 2. Route3 (cost: 535) - 1 transfer                      │
│ 3. Route4 (cost: 540) - 1 transfer                      │
│ ... (10 total)                                          │
└─────────────────────────────────────────────────────────┘
                     ↓
Step 6: Enrich Response
┌─────────────────────────────────────────────────────────┐
│ For each route, add:                                    │
│ - Which bus stand it departs from (123, 124, or 125)   │
│ - Which bus stand it arrives at (200, 201, etc.)       │
│ - User preference flags                                 │
│ - Bus stand details (location, type, facilities)       │
│                                                          │
│ Return: ConnectingRoutesByNameDTO {                     │
│   fromLocations: [3 locations with bus counts],         │
│   toLocations: [2+ locations with bus counts],          │
│   routes: [10 top routes with full details],            │
│   totalRoutes: 16                                       │
│ }                                                       │
└─────────────────────────────────────────────────────────┘
```

---

## Caching Strategy

```
Level 1: Repository Cache
┌─────────────────────────────────────────┐
│ Locations by name ("Salem")             │ 24 hours
│ Cached: LocationGroupDTO[]              │
│ Hit ratio: High (popular searches)      │
└─────────────────────────────────────────┘
                ↓
Level 2: Service Cache (NEW)
┌─────────────────────────────────────────┐
│ Connecting routes across locations      │ 1 hour
│ Key: sorted([123,124,125]) + "2"        │
│ Value: List<ConnectingRouteDTO>         │
│ Hit ratio: Medium (user re-searches)    │
└─────────────────────────────────────────┘
                ↓
Level 3: Dijkstra Result Cache (EXISTING)
┌─────────────────────────────────────────┐
│ Individual route pairs                  │ 2 hours
│ Key: "123-200-2"                        │
│ Value: List<ConnectingRouteDTO>         │
│ Hit ratio: High (popular routes)        │
└─────────────────────────────────────────┘


Cache Invalidation:
  - Bus schedule changes → Clear all levels
  - New bus added → Clear Level 3 only
  - User preference changed → Clear user-specific results
```

---

## Performance Comparison

```
SCENARIO: Search "Salem to Madurai"
(Assume: 3 Salem locations, 2 Madurai locations)

CURRENT APPROACH:
─────────────────
1 × Dijkstra search: 123 → 200
Result: ~50ms
Database queries: ~5
Routes found: 8

PROPOSED APPROACH (Without Optimization):
──────────────────────────────────────────
6 × Dijkstra searches: 
  123→200, 123→201, 124→200, 124→201, 125→200, 125→201
Time: 6 × 50ms = 300ms ⚠️ (6x slower)
Database queries: ~30
Routes found: 16 ✅

PROPOSED APPROACH (With Optimization - Batch Dijkstra):
────────────────────────────────────────────────────────
Single graph traversal from all 3 Salem locations
  ↓
Multi-destination Dijkstra to both Madurai locations
Time: 1 × 120ms = 120ms ✅ (2.4x slower, but acceptable)
Database queries: ~8
Routes found: 16 ✅

CACHE HIT SCENARIO:
───────────────────
User searches "Salem to Madurai" again
Time: <5ms (instant from cache)
Database queries: 0
Routes found: 16 ✅
```

---

## Implementation Dependency Graph

```
┌─────────────────────────────────────────────────────────┐
│ Step 1: Helper Methods (Day 1)                          │
│ • extractAllLocationIds(groups) → List<Long>            │
│ • generateRouteKey(route) → String                      │
│ • calculateRouteCost(route) → Double                    │
└─────────────────────────────────────────────────────────┘
  ↓                                    ↓
┌──────────────────────────────────┐ ┌─────────────────────┐
│ Step 2: Service Interface        │ │ Step 3: Unit Tests  │
│ • findConnectingRoutesByName()   │ │ (for helpers)       │
│ • findConnectingRoutesAcross()   │ │                     │
└──────────────────────────────────┘ └─────────────────────┘
  ↓                                    ↓
┌──────────────────────────────────────────────────────────┐
│ Step 4: Service Implementation (Day 2)                   │
│ • BusScheduleServiceImpl                                  │
│ • ConnectingRouteServiceImpl                              │
└──────────────────────────────────────────────────────────┘
  ↓
┌──────────────────────────────────────────────────────────┐
│ Step 5: REST Endpoint (Day 2)                            │
│ • BusScheduleController                                  │
│ • getConnectingRoutesByName()                            │
└──────────────────────────────────────────────────────────┘
  ↓
┌──────────────────────────────────────────────────────────┐
│ Step 6: Integration Tests (Day 2)                        │
│ • End-to-end name-based search                           │
│ • Multi-location deduplication                           │
│ • Response structure validation                          │
└──────────────────────────────────────────────────────────┘
  ↓
┌──────────────────────────────────────────────────────────┐
│ Step 7: Frontend Integration (Day 3)                     │
│ • Update search form to use new endpoint                 │
│ • Display location options upfront                       │
│ • Show bus stand information                             │
└──────────────────────────────────────────────────────────┘
  ↓
┌──────────────────────────────────────────────────────────┐
│ Step 8: Optimization & Caching (Day 3)                   │
│ • Add caching layer                                      │
│ • Batch Dijkstra optimization                            │
│ • Performance testing & tuning                           │
└──────────────────────────────────────────────────────────┘
```

