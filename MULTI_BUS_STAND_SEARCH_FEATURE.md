# Multi-Bus Stand Search Feature - Specification

**Date:** December 16, 2025  
**Status:** Feature Specification (Design Phase)  
**Priority:** High (Better UX & Bus Availability)

---

## Overview

When a user searches with only a **city name** (without specifying a bus stand), the system should:
1. Identify all bus stands in that city
2. Fetch buses from ALL bus stands simultaneously
3. Merge and display results with bus stand information
4. Allow filtering by bus stand preference

---

## Current Limitation

**Before:**
```
User searches: "Aruppukottai → Coimbatore"
System: Only shows buses from default bus stand
Problem: User might miss available buses from other stands
```

**After (Proposed):**
```
User searches: "Aruppukottai → Coimbatore"
System: Shows ALL buses from:
  ✓ Aruppukottai New Bus Stand
  ✓ Aruppukottai Old Bus Stand
Result: Complete availability visibility
```

---

## Example Cities & Multiple Bus Stands

### Tamil Nadu Major Cities

#### Madurai
- **Madurai Central Bus Stand** (Main, TNSTC)
- **Aravind Bus Stand** (Private)
- **Arapalayam Bus Stand** (Private)
- **Palanpur Bus Stand** (Private)

#### Chennai
- **Chennai Moffusil Bus Stand (CMBT)** (Main, TNSTC)
- **Koyambedu Bus Terminal** (Main, TNSTC)
- **Parkkottai Bus Stand** (TNSTC)
- **Broadway Bus Stand** (TNSTC)
- **Kodambakkam Bus Stand** (TNSTC)

#### Coimbatore
- **Coimbatore Central Bus Stand** (Main, TNSTC)
- **Gandhipuram Bus Stand** (Private)
- **Sai Ram Bus Stand** (Private)
- **Ukkadam Bus Stand** (Private)

#### Salem
- **Salem Central Bus Stand** (Main, TNSTC)
- **Salem Pallikaranai** (TNSTC)
- **Ayyampalayam Bus Stand** (Private)

#### Aruppukottai
- **Aruppukottai New Bus Stand** (TNSTC)
- **Aruppukottai Old Bus Stand** (TNSTC)
- **Aruppukottai Bypass Bus Stand** (Private)

#### Trichy
- **Trichy Central Bus Stand** (Main, TNSTC)
- **Trichy West Bus Stand** (TNSTC)
- **Chintamani Bus Stand** (Private)

---

## Database Schema Updates

### Bus Stand Table
```sql
CREATE TABLE IF NOT EXISTS bus_stands (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    bus_stand_name VARCHAR(255) NOT NULL,
    city_id BIGINT NOT NULL,
    city_name VARCHAR(100) NOT NULL,
    latitude DOUBLE NOT NULL,
    longitude DOUBLE NOT NULL,
    address VARCHAR(500),
    contact_phone VARCHAR(20),
    bus_stand_type ENUM('MAIN', 'PRIVATE', 'TNSTC'),
    
    -- Operating hours
    opening_time TIME,
    closing_time TIME,
    
    -- Facilities
    has_food_court BOOLEAN DEFAULT FALSE,
    has_waiting_area BOOLEAN DEFAULT FALSE,
    has_parking BOOLEAN DEFAULT FALSE,
    has_atm BOOLEAN DEFAULT FALSE,
    has_restroom BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL,
    
    FOREIGN KEY (city_id) REFERENCES locations(id),
    INDEX idx_city_id (city_id),
    INDEX idx_bus_stand_type (bus_stand_type),
    UNIQUE KEY unique_bus_stand_city (bus_stand_name, city_id)
);
```

### Bus Routes Table (Update)
```sql
-- Add bus stand reference to existing bus routes
ALTER TABLE bus_routes ADD COLUMN bus_stand_id BIGINT AFTER city_id;
ALTER TABLE bus_routes ADD FOREIGN KEY (bus_stand_id) REFERENCES bus_stands(id);
ALTER TABLE bus_routes ADD INDEX idx_bus_stand_id (bus_stand_id);

-- So a bus route now has:
-- - route_id (unique)
-- - from_location_id (city)
-- - from_bus_stand_id (specific stand in city)
-- - to_location_id (city)
-- - to_bus_stand_id (specific stand in city)
```

---

## Data Mapping Examples

### Aruppukottai Bus Stands

```
City: Aruppukottai (location_id: 15)

Bus Stand 1:
- id: 201
- name: "Aruppukottai New Bus Stand"
- city_id: 15
- type: "TNSTC"
- latitude: 9.5089
- longitude: 78.0931
- facilities: restroom, waiting_area, atm

Bus Stand 2:
- id: 202
- name: "Aruppukottai Old Bus Stand"
- city_id: 15
- type: "TNSTC"
- latitude: 9.5095
- longitude: 78.0920
- facilities: parking, food_court

Bus Stand 3:
- id: 203
- name: "Aruppukottai Bypass Bus Stand"
- city_id: 15
- type: "PRIVATE"
- latitude: 9.5200
- longitude: 78.1000
- facilities: parking
```

### Madurai Bus Stands

```
City: Madurai (location_id: 4)

Bus Stand 1:
- id: 101
- name: "Madurai Central Bus Stand"
- city_id: 4
- type: "TNSTC"
- latitude: 9.9252
- longitude: 78.1198

Bus Stand 2:
- id: 102
- name: "Aravind Bus Stand"
- city_id: 4
- type: "PRIVATE"
- latitude: 9.9300
- longitude: 78.1150

Bus Stand 3:
- id: 103
- name: "Arapalayam Bus Stand"
- city_id: 4
- type: "PRIVATE"
- latitude: 9.9100
- longitude: 78.1300

Bus Stand 4:
- id: 104
- name: "Palanpur Bus Stand"
- city_id: 4
- type: "PRIVATE"
- latitude: 9.9400
- longitude: 78.1000
```

---

## Backend API Changes

### Current Endpoint
```
GET /api/v1/bus-schedules/search
Query: ?fromCity=Aruppukottai&toCity=Coimbatore&date=2025-12-20
Response: Buses from single bus stand only
```

### Updated Endpoint (Multi-Stand)
```
GET /api/v1/bus-schedules/search
Query: ?fromCity=Aruppukottai&toCity=Coimbatore&date=2025-12-20&includeAllBusStands=true

Response:
{
  "search_query": {
    "from_city": "Aruppukottai",
    "to_city": "Coimbatore",
    "date": "2025-12-20",
    "user_searched_by": "city_only"
  },
  "available_bus_stands": {
    "from": [
      {
        "bus_stand_id": 201,
        "bus_stand_name": "Aruppukottai New Bus Stand",
        "bus_stand_type": "TNSTC",
        "bus_count": 12,
        "facilities": ["restroom", "waiting_area", "atm"],
        "latitude": 9.5089,
        "longitude": 78.0931
      },
      {
        "bus_stand_id": 202,
        "bus_stand_name": "Aruppukottai Old Bus Stand",
        "bus_stand_type": "TNSTC",
        "bus_count": 8,
        "facilities": ["parking", "food_court"],
        "latitude": 9.5095,
        "longitude": 78.0920
      },
      {
        "bus_stand_id": 203,
        "bus_stand_name": "Aruppukottai Bypass Bus Stand",
        "bus_stand_type": "PRIVATE",
        "bus_count": 3,
        "facilities": ["parking"],
        "latitude": 9.5200,
        "longitude": 78.1000
      }
    ],
    "to": [
      {
        "bus_stand_id": 301,
        "bus_stand_name": "Coimbatore Central Bus Stand",
        "bus_stand_type": "TNSTC",
        "arrival_bus_count": 12,
        "latitude": 11.0168,
        "longitude": 76.9558
      },
      {
        "bus_stand_id": 302,
        "bus_stand_name": "Gandhipuram Bus Stand",
        "bus_stand_type": "PRIVATE",
        "arrival_bus_count": 8,
        "latitude": 11.0200,
        "longitude": 76.9600
      }
    ]
  },
  "buses": [
    {
      "id": "route_123",
      "bus_number": "150",
      "bus_name": "Express AC",
      "from_bus_stand_id": 201,
      "from_bus_stand_name": "Aruppukottai New Bus Stand",
      "to_bus_stand_id": 301,
      "to_bus_stand_name": "Coimbatore Central Bus Stand",
      "departure_time": "06:00 AM",
      "arrival_time": "08:30 AM",
      "duration": "2h 30m",
      "price": 180,
      "bus_type": "AC",
      "seats_available": 15
    },
    {
      "id": "route_124",
      "bus_number": "151A",
      "bus_name": "Ordinary",
      "from_bus_stand_id": 202,
      "from_bus_stand_name": "Aruppukottai Old Bus Stand",
      "to_bus_stand_id": 301,
      "to_bus_stand_name": "Coimbatore Central Bus Stand",
      "departure_time": "06:30 AM",
      "arrival_time": "09:00 AM",
      "duration": "2h 30m",
      "price": 120,
      "bus_type": "Ordinary",
      "seats_available": 28
    },
    // ... more buses from all combinations
  ],
  "total_buses": 23,
  "total_combined_buses_across_stands": 23
}
```

### Query Type Detection Logic
```java
public enum SearchQueryType {
    CITY_ONLY,           // User entered: "Aruppukottai"
    BUS_STAND_SPECIFIC,  // User entered: "Aruppukottai New Bus Stand"
    WITH_DETAILS         // User selected from dropdown
}

// Pseudo code
public SearchQueryType detectQueryType(String fromLocation, String toLocation) {
    // If user typed only city name (exact match with locations table)
    if (isExactCityMatch(fromLocation)) {
        return SearchQueryType.CITY_ONLY;
    }
    
    // If user typed exact bus stand name
    if (isExactBusStandMatch(fromLocation)) {
        return SearchQueryType.BUS_STAND_SPECIFIC;
    }
    
    // Otherwise, it's a partial/detailed search
    return SearchQueryType.WITH_DETAILS;
}

// Implementation
public List<Bus> searchBuses(String fromLocation, String toLocation, LocalDate date) {
    SearchQueryType queryType = detectQueryType(fromLocation, toLocation);
    
    if (queryType == SearchQueryType.CITY_ONLY) {
        // Get all bus stands for the city
        List<BusStand> fromBusStands = busStandRepository.findByCityName(fromLocation);
        List<BusStand> toBusStands = busStandRepository.findByCityName(toLocation);
        
        // Fetch buses from ALL combinations
        List<Bus> allBuses = new ArrayList<>();
        for (BusStand fromStand : fromBusStands) {
            for (BusStand toStand : toBusStands) {
                List<Bus> buses = busRepository.findByBusStandAndDate(
                    fromStand.getId(), 
                    toStand.getId(), 
                    date
                );
                allBuses.addAll(buses);
            }
        }
        return allBuses;
    }
    
    // Otherwise, use existing logic for specific bus stand search
    return existingSearchLogic(fromLocation, toLocation, date);
}
```

---

## Frontend Changes

### Search Form Behavior

**Before:**
```
User enters: "Aruppukottai"
↓
Autocomplete shows: "Aruppukottai" (city)
↓
User clicks on it
↓
Search submitted with: fromLocation = "Aruppukottai"
↓
Backend fetches from default/primary bus stand only
```

**After:**
```
User enters: "Aruppukottai"
↓
Autocomplete shows:
  - "Aruppukottai" (city) ← User might click
  - "Aruppukottai New Bus Stand" (specific stand)
  - "Aruppukottai Old Bus Stand" (specific stand)
  - "Aruppukottai Bypass Bus Stand" (specific stand)
↓
If user clicks just "Aruppukottai":
  - Set flag: includeAllBusStands = true
  - Send query with city name
↓
Backend returns: Buses from ALL bus stands
↓
Frontend displays with bus stand information highlighted
```

### Search Results Display

**New Result Card with Bus Stand Info:**
```
┌─────────────────────────────────────────┐
│ 🚌 150 - Express AC                     │
│ From: Aruppukottai New Bus Stand        │ ← NEW
│ To: Coimbatore Central Bus Stand        │ ← NEW
│ ⏱️ 06:00 AM → 08:30 AM (2h 30m)        │
│ 💰 ₹180 • Seats: 15 available           │
│ [View Details] [Book]                   │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ 🚌 151A - Ordinary                      │
│ From: Aruppukottai Old Bus Stand        │ ← NEW
│ To: Coimbatore Central Bus Stand        │
│ ⏱️ 06:30 AM → 09:00 AM (2h 30m)        │
│ 💰 ₹120 • Seats: 28 available           │
│ [View Details] [Book]                   │
└─────────────────────────────────────────┘
```

### Filter Options

**New Filter Panel:**
```
FILTER BY DEPARTURE BUS STAND:
☐ Aruppukottai New Bus Stand (12 buses)
☐ Aruppukottai Old Bus Stand (8 buses)
☐ Aruppukottai Bypass Bus Stand (3 buses)
[All Selected ✓] [Apply]

FILTER BY ARRIVAL BUS STAND:
☐ Coimbatore Central Bus Stand (12 buses)
☐ Gandhipuram Bus Stand (8 buses)
[All Selected ✓] [Apply]
```

### Sticky Header Modification

**Before:**
```
Aruppukottai → Coimbatore (15 buses)
```

**After:**
```
Aruppukottai (All Stands) → Coimbatore (All Stands)
23 buses total across 6 combinations
[Edit Search]
```

### Bus Stand Selector Modal

**When user wants to select specific stand after search:**
```
┌──────────────────────────────────┐
│ SELECT DEPARTURE BUS STAND        │
│ Aruppukottai                      │
├──────────────────────────────────┤
│ ● Aruppukottai New Bus Stand      │ ← Selected by default
│   TNSTC • 12 buses               │
│   🅿️ 🚻 📱 (facilities icons)   │
│   📍 9.5089°N, 78.0931°E         │
│                                   │
│ ○ Aruppukottai Old Bus Stand      │
│   TNSTC • 8 buses                │
│   🅿️ 🍴 (facilities icons)       │
│   📍 9.5095°N, 78.0920°E         │
│                                   │
│ ○ Aruppukottai Bypass Bus Stand   │
│   Private • 3 buses              │
│   🅿️ (facilities icons)          │
│   📍 9.5200°N, 78.1000°E         │
│                                   │
│ [Apply Filter] [Cancel]          │
└──────────────────────────────────┘
```

---

## Implementation Steps

### Phase 1: Database Setup (Week 1)
- [ ] Create `bus_stands` table with city references
- [ ] Populate bus stand data for all major cities
- [ ] Update `bus_routes` table to include `bus_stand_id`
- [ ] Migrate existing data (assign buses to primary bus stands)

### Phase 2: Backend API (Week 2)
- [ ] Implement `searchBusesMultiStand()` method
- [ ] Add query type detection logic
- [ ] Update search endpoint to support multi-stand
- [ ] Add bus stand information to response
- [ ] Implement filtering by bus stand

### Phase 3: Frontend Search (Week 3)
- [ ] Update autocomplete to show bus stands
- [ ] Detect when user selects city-only vs specific stand
- [ ] Update search API call with `includeAllBusStands` flag
- [ ] Display bus stand info in search results

### Phase 4: UI/UX (Week 4)
- [ ] Add bus stand filter panel
- [ ] Create bus stand selector modal
- [ ] Highlight bus stand information in results
- [ ] Add "Edit Search" to change bus stand filter
- [ ] Update sticky header with multi-stand info

### Phase 5: Testing & Launch (Week 5)
- [ ] Test multi-stand search for all cities
- [ ] Test filtering and selection
- [ ] Mobile responsiveness testing
- [ ] Performance testing (ensure no slowdown)
- [ ] Soft launch with 10% of users
- [ ] Full launch

---

## Example Search Flows

### Flow 1: User Searches by City Name (New Feature)
```
User Input: "Aruppukottai" → "Coimbatore"
↓
Detection: City-only search
↓
Backend Query:
  - Get all bus stands in Aruppukottai (3 stands found)
  - Get all bus stands in Coimbatore (2 stands found)
  - Query buses from 3×2 = 6 combinations
↓
Results: Show 23 buses with bus stand labels
  - 12 from Aruppukottai New → Coimbatore Central
  - 8 from Aruppukottai Old → Coimbatore Central
  - 3 from Aruppukottai New → Gandhipuram
  - etc.
↓
User can filter by specific bus stand using filter panel
```

### Flow 2: User Searches by Specific Bus Stand (Existing Behavior)
```
User Input: "Aruppukottai New Bus Stand" → "Coimbatore Central Bus Stand"
↓
Detection: Specific bus stand search
↓
Backend Query:
  - Query buses from exactly these 2 stands only
↓
Results: Show only buses from this combination
  - 12 buses shown
↓
No filter panel needed (already specific)
```

### Flow 3: User Searches City, Then Filters to Specific Stand
```
User Input: "Aruppukottai" → "Coimbatore"
↓
Initial Results: 23 buses from all combinations
↓
User clicks Filter → Selects "Aruppukottai New Bus Stand"
↓
Filtered Results: 12 buses from just New Bus Stand
↓
User sees: "Aruppukottai New Bus Stand → Coimbatore (All Stands)"
```

---

## SQL Migration Script

```sql
-- Create bus_stands table
CREATE TABLE bus_stands (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    bus_stand_name VARCHAR(255) NOT NULL,
    city_id BIGINT NOT NULL,
    city_name VARCHAR(100) NOT NULL,
    latitude DOUBLE NOT NULL,
    longitude DOUBLE NOT NULL,
    address VARCHAR(500),
    contact_phone VARCHAR(20),
    bus_stand_type ENUM('MAIN', 'PRIVATE', 'TNSTC'),
    opening_time TIME,
    closing_time TIME,
    has_food_court BOOLEAN DEFAULT FALSE,
    has_waiting_area BOOLEAN DEFAULT FALSE,
    has_parking BOOLEAN DEFAULT FALSE,
    has_atm BOOLEAN DEFAULT FALSE,
    has_restroom BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL,
    FOREIGN KEY (city_id) REFERENCES locations(id),
    INDEX idx_city_id (city_id),
    INDEX idx_bus_stand_type (bus_stand_type),
    UNIQUE KEY unique_bus_stand_city (bus_stand_name, city_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Add bus_stand_id to bus_routes
ALTER TABLE bus_routes ADD COLUMN bus_stand_id BIGINT AFTER city_id;
ALTER TABLE bus_routes ADD FOREIGN KEY (bus_stand_id) REFERENCES bus_stands(id);
ALTER TABLE bus_routes ADD INDEX idx_bus_stand_id (bus_stand_id);

-- Insert Aruppukottai bus stands
INSERT INTO bus_stands (bus_stand_name, city_id, city_name, latitude, longitude, bus_stand_type, address, contact_phone) VALUES
('Aruppukottai New Bus Stand', 15, 'Aruppukottai', 9.5089, 78.0931, 'TNSTC', 'New Bus Stand, Aruppukottai', '+91 4565 222333'),
('Aruppukottai Old Bus Stand', 15, 'Aruppukottai', 9.5095, 78.0920, 'TNSTC', 'Old Bus Stand, Aruppukottai', '+91 4565 222334'),
('Aruppukottai Bypass Bus Stand', 15, 'Aruppukottai', 9.5200, 78.1000, 'PRIVATE', 'Bypass Road, Aruppukottai', '+91 4565 222335');

-- Insert Madurai bus stands
INSERT INTO bus_stands (bus_stand_name, city_id, city_name, latitude, longitude, bus_stand_type, address, contact_phone) VALUES
('Madurai Central Bus Stand', 4, 'Madurai', 9.9252, 78.1198, 'TNSTC', 'Central Bus Stand, Madurai', '+91 452 234 2347'),
('Aravind Bus Stand', 4, 'Madurai', 9.9300, 78.1150, 'PRIVATE', 'Aravind Street, Madurai', '+91 452 234 2348'),
('Arapalayam Bus Stand', 4, 'Madurai', 9.9100, 78.1300, 'PRIVATE', 'Arapalayam, Madurai', '+91 452 234 2349'),
('Palanpur Bus Stand', 4, 'Madurai', 9.9400, 78.1000, 'PRIVATE', 'Palanpur, Madurai', '+91 452 234 2350');

-- Update existing bus routes to reference bus stands
UPDATE bus_routes SET bus_stand_id = (
    SELECT id FROM bus_stands 
    WHERE city_id = bus_routes.city_id 
    AND bus_stand_type = 'TNSTC' 
    LIMIT 1
) WHERE bus_stand_id IS NULL;
```

---

## Pseudo Code Examples

### Backend Service Method
```java
@Service
public class BusSearchService {
    
    private BusStandRepository busStandRepository;
    private BusRepository busRepository;
    private LocationRepository locationRepository;
    
    public SearchResponse searchBuses(SearchRequest request) {
        // Step 1: Detect query type
        SearchQueryType queryType = detectSearchQueryType(
            request.getFromLocation(), 
            request.getToLocation()
        );
        
        // Step 2: Resolve locations
        Location fromCity = locationRepository.findByName(request.getFromLocation());
        Location toCity = locationRepository.findByName(request.getToLocation());
        
        SearchResponse response = new SearchResponse();
        
        // Step 3: Based on query type, fetch appropriate data
        if (queryType == SearchQueryType.CITY_ONLY) {
            // Multi-stand search
            List<BusStand> fromStands = busStandRepository.findByCityId(fromCity.getId());
            List<BusStand> toStands = busStandRepository.findByCityId(toCity.getId());
            
            response.setAvailableBusStands(fromStands, toStands);
            
            // Fetch buses from all combinations
            List<Bus> allBuses = new ArrayList<>();
            for (BusStand fromStand : fromStands) {
                for (BusStand toStand : toStands) {
                    List<Bus> buses = busRepository.findByBusStands(
                        fromStand.getId(),
                        toStand.getId(),
                        request.getTravelDate()
                    );
                    allBuses.addAll(buses);
                }
            }
            
            response.setBuses(allBuses);
            response.setQueryType(SearchQueryType.CITY_ONLY);
            response.setShowBusStandInfo(true);
            
        } else if (queryType == SearchQueryType.BUS_STAND_SPECIFIC) {
            // Single bus stand search (existing logic)
            BusStand fromStand = busStandRepository.findByName(request.getFromLocation());
            BusStand toStand = busStandRepository.findByName(request.getToLocation());
            
            List<Bus> buses = busRepository.findByBusStands(
                fromStand.getId(),
                toStand.getId(),
                request.getTravelDate()
            );
            
            response.setBuses(buses);
            response.setQueryType(SearchQueryType.BUS_STAND_SPECIFIC);
            response.setShowBusStandInfo(false);
        }
        
        return response;
    }
    
    private SearchQueryType detectSearchQueryType(String fromLocation, String toLocation) {
        // Check if it's an exact city name match
        if (locationRepository.existsByNameIgnoreCase(fromLocation) &&
            locationRepository.existsByNameIgnoreCase(toLocation)) {
            return SearchQueryType.CITY_ONLY;
        }
        
        // Check if it's a bus stand match
        if (busStandRepository.existsByNameIgnoreCase(fromLocation) &&
            busStandRepository.existsByNameIgnoreCase(toLocation)) {
            return SearchQueryType.BUS_STAND_SPECIFIC;
        }
        
        return SearchQueryType.WITH_DETAILS;
    }
}
```

### Frontend Autocomplete Logic
```typescript
export const searchLocations = async (query: string) => {
  const response = await fetch(`/api/v1/locations/autocomplete?q=${query}`);
  const data = await response.json();
  
  // Response structure:
  // {
  //   cities: [
  //     { id: 1, name: "Aruppukottai", type: "city" }
  //   ],
  //   busStands: [
  //     { id: 201, name: "Aruppukottai New Bus Stand", type: "bus_stand", cityId: 1 },
  //     { id: 202, name: "Aruppukottai Old Bus Stand", type: "bus_stand", cityId: 1 }
  //   ]
  // }
  
  // Format for display
  const options = [
    // First show city
    ...data.cities.map(city => ({
      label: city.name,
      value: city.name,
      type: 'city',
      searchType: 'CITY_ONLY'
    })),
    // Then show bus stands
    ...data.busStands.map(stand => ({
      label: stand.name,
      value: stand.name,
      type: 'bus_stand',
      subtext: `${stand.cityName} - Bus Stand`,
      searchType: 'BUS_STAND_SPECIFIC'
    }))
  ];
  
  return options;
};

// When user selects an option
const handleLocationSelect = (option: any) => {
  setSearchParams({
    from: option.value,
    includeAllBusStands: option.searchType === 'CITY_ONLY'
  });
};
```

---

## Benefits

1. **Complete Availability** - Users see all options, not just primary bus stand
2. **Better User Experience** - More choices, easier to find convenient bus stand
3. **Revenue Impact** - More buses = higher chance of booking
4. **Flexibility** - Users can filter to specific bus stand if desired
5. **Better Search Results** - Higher conversion rate when more options visible

---

## Risks & Mitigations

### Risk 1: Performance Degradation
**Issue:** Fetching from multiple bus stands might slow search
**Mitigation:**
- Use database indexes on bus_stand_id
- Implement response caching
- Limit to max 4 bus stands per city
- Use parallel queries (CompletableFuture in Java)

### Risk 2: Confusing UI
**Issue:** Too many similar buses from different stands might confuse users
**Mitigation:**
- Clearly highlight bus stand in results
- Add visual indicators (badges, colors)
- Provide easy filtering by bus stand
- Show distance/walking time to each stand

### Risk 3: Data Consistency
**Issue:** Bus data might be duplicated across stands
**Mitigation:**
- Enforce unique constraint: (bus_number + from_stand + to_stand + time)
- Regular data audit reports
- Add duplicate detection logic

---

## Future Enhancements

1. **Smart Bus Stand Selection**
   - Based on user's current location, suggest nearest bus stand
   - "3 km away" label showing distance

2. **Bus Stand Comparison**
   - Compare facilities (parking, food, ATM)
   - Show travel time between stands
   - Display price differences

3. **Real-time Bus Stand Occupancy**
   - Show how crowded each bus stand is
   - Suggest least crowded option

4. **Predictive Bus Stand Routing**
   - ML to predict which stand user prefers
   - Based on booking history and location

---

## Rollout Plan

**Week 1-5:** Development & Testing (as per Implementation Steps)

**Week 6:** Soft Launch
- Enable for 10% of users searching city names
- Monitor: search time, filter usage, booking rate
- Collect user feedback

**Week 7:** Scale to 50% users
- Monitor performance metrics
- Address any issues found

**Week 8:** Full Launch to 100% users
- Monitor for 2 weeks
- Compare: before vs after booking rates

---

**Questions?** Refer to this specification during implementation.
