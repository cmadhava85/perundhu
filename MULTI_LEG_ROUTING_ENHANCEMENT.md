# Multi-Leg Routing Enhancement - Implementation Plan

**Date:** January 23, 2026  
**Requirement:** Show multi-leg journey suggestions when no direct bus exists

---

## Current Problem

When user searches Broadway → Madurai with NO direct bus:

**Current Response:**
```json
{
  "items": [
    {
      "id": 101,
      "number": "12A",
      "name": "12A - BROADWAY to KILAMBAKKAM",
      "fromLocationName": "Broadway",
      "toLocationName": "Kilambakkam",
      "departureTime": "10:45",
      "arrivalTime": "11:15"
    },
    {
      "id": 102,
      "number": "25B",
      "name": "25B - KILAMBAKKAM to MADURAI",
      "fromLocationName": "Kilambakkam",
      "toLocationName": "Madurai",
      "departureTime": "12:00",
      "arrivalTime": "16:30"
    }
  ]
}
```

**Frontend Problem:** Can't tell these are connected!
- Shows them as 2 separate buses
- User doesn't know they form a journey
- No "connecting bus" badge

---

## Required Solution

### Backend Changes Needed

1. **Add Multi-Leg fields to BusDTO:**
   ```java
   @JsonInclude(JsonInclude.Include.NON_NULL)
   public class BusDTO {
       // ... existing fields ...
       
       // NEW: Multi-leg journey metadata
       private Boolean isMultiLegJourney;
       private Integer legNumber;
       private Integer totalLegs;
       private String journeyId;
       private Long intermediateLocationId;
       private String intermediateLocationName;
   }
   ```

2. **Generate Unique Journey ID:**
   - Format: `broadway_kilambakkam_madurai_journey_12a_25b`
   - Identifies complete multi-leg journey
   - Groups related buses together

3. **Mark Each Bus with Metadata:**
   - Leg 1: `legNumber=1, totalLegs=2, journeyId=...`
   - Leg 2: `legNumber=2, totalLegs=2, journeyId=..., intermediateLocationId=xyz`

4. **Update Response:**
   ```json
   {
     "items": [
       {
         "id": 101,
         "number": "12A",
         "name": "12A - BROADWAY to KILAMBAKKAM",
         "isMultiLegJourney": true,
         "legNumber": 1,
         "totalLegs": 2,
         "journeyId": "broadway_kilambakkam_madurai_journey_12a_25b",
         "intermediateLocationId": 456,
         "intermediateLocationName": "Kilambakkam"
       },
       {
         "id": 102,
         "number": "25B",
         "name": "25B - KILAMBAKKAM to MADURAI",
         "isMultiLegJourney": true,
         "legNumber": 2,
         "totalLegs": 2,
         "journeyId": "broadway_kilambakkam_madurai_journey_12a_25b",
         "intermediateLocationId": 456
       }
     ]
   }
   ```

---

### Frontend Changes Needed

1. **Group buses by journeyId in UI**
   ```typescript
   const groupedBuses = buses.reduce((acc, bus) => {
     const key = bus.isMultiLegJourney ? bus.journeyId : bus.id;
     if (!acc[key]) acc[key] = [];
     acc[key].push(bus);
     return acc;
   }, {});
   ```

2. **Render multi-leg journeys specially:**
   ```tsx
   {isMultiLegJourney ? (
     <MultiLegJourneyCard
       legs={journeyBuses}
       totalDuration={calculateDuration(leg1.departure, leg2.arrival)}
     />
   ) : (
     <BusCard bus={bus} />
   )}
   ```

3. **Multi-Leg Card Design:**
   ```
   ┌─────────────────────────────────────┐
   │  🔗 Multi-Leg Journey (2 buses)     │
   ├─────────────────────────────────────┤
   │                                     │
   │  10:45    1h 30m    11:15          │
   │  BROADWAY ────────> KILAMBAKKAM    │
   │  Bus 12A (Standard)                 │
   │                                     │
   │  12:00    4h 30m    16:30          │
   │  KILAMBAKKAM ────> MADURAI         │
   │  Bus 25B (Express)                  │
   │                                     │
   │  ────────────────────────────────  │
   │  Total: 7h 45m  |  Connections: 45m│
   │                                     │
   └─────────────────────────────────────┘
   ```

---

## Implementation Steps

### Step 1: Update BusDTO
```java
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class BusDTO {
    // ... existing fields ...
    
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private Boolean isMultiLegJourney;
    
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private Integer legNumber;
    
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private Integer totalLegs;
    
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private String journeyId;
    
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private Long intermediateLocationId;
    
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private String intermediateLocationName;
}
```

### Step 2: Create MultiLegJourney Record
```java
@Data
@AllArgsConstructor
public class MultiLegJourney {
    private Long fromLocationId;
    private Long toLocationId;
    private Long intermediateLocationId;
    private String intermediateLocationName;
    private List<BusDTO> legs;
    private String journeyId;
    
    public static String generateJourneyId(
        Long from, Long intermediate, Long to, 
        List<BusDTO> legs) {
        String busNumbers = legs.stream()
            .map(b -> b.number().toLowerCase())
            .collect(Collectors.joining("_"));
        return String.format("%d_%d_%d_journey_%s", 
            from, intermediate, to, busNumbers);
    }
}
```

### Step 3: Update BusScheduleServiceImpl
```java
private List<BusDTO> findMultiLegViaIntermediateStops(
        Long fromLocationId, 
        Long toLocationId, 
        String languageCode) {
    
    List<BusDTO> allBuses = new ArrayList<>();
    Map<String, MultiLegJourney> journeys = new HashMap<>();
    
    // ... existing logic to find intermediate stops ...
    
    for (Long intermediateId : intermediateLocationIds) {
        List<BusDTO> leg1 = findBusesBetweenLocations(fromLocationId, intermediateId, languageCode);
        List<BusDTO> leg2 = findBusesBetweenLocations(intermediateId, toLocationId, languageCode);
        
        if (!leg1.isEmpty() && !leg2.isEmpty()) {
            String journeyId = MultiLegJourney.generateJourneyId(
                fromLocationId, intermediateId, toLocationId,
                leg1);
            
            // Get intermediate location name
            Optional<Location> intermediateLoc = locationRepository.findById(intermediateId);
            String intermediateLocName = intermediateLoc.map(Location::name).orElse("Unknown");
            
            // Mark leg 1
            for (BusDTO bus : leg1) {
                bus = bus.toBuilder()
                    .isMultiLegJourney(true)
                    .legNumber(1)
                    .totalLegs(2)
                    .journeyId(journeyId)
                    .intermediateLocationId(intermediateId)
                    .intermediateLocationName(intermediateLocName)
                    .build();
                allBuses.add(bus);
            }
            
            // Mark leg 2
            for (BusDTO bus : leg2) {
                bus = bus.toBuilder()
                    .isMultiLegJourney(true)
                    .legNumber(2)
                    .totalLegs(2)
                    .journeyId(journeyId)
                    .intermediateLocationId(intermediateId)
                    .build();
                allBuses.add(bus);
            }
        }
    }
    
    return allBuses;
}
```

### Step 4: Frontend Changes
```typescript
// In BusSearch component
const groupBusesByJourney = (buses) => {
  const groups: { [key: string]: Bus[] } = {};
  
  buses.forEach(bus => {
    const key = bus.isMultiLegJourney ? bus.journeyId : bus.id;
    if (!groups[key]) groups[key] = [];
    groups[key].push(bus);
  });
  
  return Object.entries(groups).map(([, buses]) => 
    buses[0].isMultiLegJourney ? 
      { type: 'multi-leg', buses, journeyId: buses[0].journeyId } :
      { type: 'direct', buses: buses[0] }
  );
};

// Render
{groupedJourneys.map(journey => 
  journey.type === 'multi-leg' ? (
    <MultiLegJourneyCard key={journey.journeyId} buses={journey.buses} />
  ) : (
    <BusCard key={journey.buses.id} bus={journey.buses} />
  )
)}
```

---

## Benefits

✅ Frontend can identify multi-leg journeys  
✅ Group related buses together  
✅ Show "Connecting bus" badge  
✅ Display total journey time  
✅ Highlight connection point  
✅ Calculate layover time  
✅ Better user experience

---

## Testing

### Test Case 1: Broadway → Madurai (No Direct Bus)
```bash
curl 'http://localhost:8080/api/v1/bus-schedules/search?fromLocationId=BROADWAY&toLocationId=MADURAI'
```

**Expected:** Returns buses marked with `isMultiLegJourney=true` and grouped by `journeyId`

### Test Case 2: Salem → Coimbatore (Direct Buses Exist)
```bash
curl 'http://localhost:8080/api/v1/bus-schedules/search?fromLocationId=5&toLocationId=2'
```

**Expected:** Direct buses have `isMultiLegJourney=null` (not returned in JSON)

---

## API Contract Evolution

### Version 1 (Current)
```json
{
  "items": [BusDTO]
}
```

### Version 2 (After This Enhancement)
```json
{
  "items": [
    {
      ...BusDTO,
      "isMultiLegJourney": boolean,
      "legNumber": integer,
      "totalLegs": integer,
      "journeyId": string,
      "intermediateLocationId": long,
      "intermediateLocationName": string
    }
  ]
}
```

**Backward Compatibility:** ✅ New fields are optional (`@JsonInclude(NON_NULL)`)

