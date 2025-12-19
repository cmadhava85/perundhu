# Duplicate Detection & Route Enhancement System

## Executive Summary

This document outlines a comprehensive solution for handling duplicate bus route contributions while maximizing data quality through crowdsourced enhancements.

---

## 1. Problem Statement

### Current Challenges

1. **Multiple users contributing same bus**: Users may not find existing routes in search and re-submit
2. **Varying knowledge levels**: Some users know full details (bus number, stops, timings), others know only origin/destination
3. **Same bus number, multiple services**: Bus 27D may run at 6 AM, 2 PM, and 10 PM - each is a separate service
4. **Pass-through routes**: Bus going Sivakasi→Madurai passes through Virudhunagar; both routes should be findable
5. **Approximate timings**: Users know times ±10-15 minutes, not exact schedules

### Goals

- ✅ Prevent duplicate bus entries
- ✅ Allow users to enhance existing routes with additional stops
- ✅ Minimize admin workload
- ✅ Maintain high data quality
- ✅ Encourage user contributions

---

## 2. Core Principle: Unique Bus Identification

### A bus service is uniquely identified by:

```
UNIQUE BUS = Origin + Final Destination + Departure Time (±15 min window)
```

| Field | Required | Purpose |
|-------|----------|---------|
| Origin | ✅ Yes | Route start point |
| Destination | ✅ Yes | Route end point (terminus) |
| Departure Time | ✅ Yes | Differentiates multiple services |
| Bus Number | ❌ Optional | Additional identifier (user may not know) |

### Why Time is Required

Users **do know** approximate departure times (±10 min). They took the bus - they know when it left.

```
"I don't know exact time" → RARE
"My bus leaves around 6 AM" → COMMON (this is ±15 min)
```

---

## 3. Match Types

### 3.1 EXACT MATCH
Same origin + Same final destination + Time within ±15 min

```
User: Sivakasi → Virudhunagar, 5:00 PM
DB:   Sivakasi → Virudhunagar, 5:10 PM
Result: ✅ EXACT MATCH (same bus)
```

### 3.2 PASSES THROUGH
Same origin + User's destination is intermediate stop + Time within ±15 min

```
User: Sivakasi → Virudhunagar, 5:00 PM
DB:   Sivakasi → Madurai (via Virudhunagar), 5:05 PM
Result: ℹ️ PASSES THROUGH (different bus, but relevant)
```

### 3.3 DIFFERENT SERVICE
Same route + Time difference > 15 min

```
User: Chennai → Madurai, 6:00 AM
DB:   Chennai → Madurai, 2:00 PM
Result: ❌ DIFFERENT SERVICE (same route, different timing)
```

### 3.4 NO MATCH
No buses found on this route at this time

```
User: Kovilpatti → Tenkasi, 7:00 AM
DB:   (no matching buses)
Result: 🆕 NEW BUS (create contribution)
```

---

## 4. User Contribution Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     CONTRIBUTION FLOW                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  STEP 1: User enters basic info                                 │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  Origin*:        [________________]                         ││
│  │  Destination*:   [________________]                         ││
│  │  Departure Time*:[________________] (approximate is OK)     ││
│  │  Bus Number:     [________________] (optional)              ││
│  │                                                             ││
│  │  [Check for Existing Buses]                                 ││
│  └─────────────────────────────────────────────────────────────┘│
│                          │                                       │
│                          ▼                                       │
│  STEP 2: System checks for duplicates (±15 min window)          │
│                          │                                       │
│         ┌────────────────┼────────────────┐                     │
│         │                │                │                      │
│         ▼                ▼                ▼                      │
│    EXACT MATCH     PASSES THROUGH     NO MATCH                  │
│         │                │                │                      │
│         ▼                ▼                ▼                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │ "Found your │  │ "These buses│  │ "New bus!   │              │
│  │  bus!"      │  │  pass thru" │  │  Add details│              │
│  │             │  │             │  │  below"     │              │
│  │ [Confirm]   │  │ [This is it]│  │             │              │
│  │ [Add Stops] │  │ [Add Stops] │  │ [Submit]    │              │
│  │ [Different] │  │ [Different] │  │             │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5. User Actions & Outcomes

### 5.1 When EXACT MATCH Found

| User Action | System Response | Admin Work |
|-------------|-----------------|------------|
| **"This is my bus!"** | +1 confirmation count | ❌ None |
| **"Add stops to this bus"** | Opens stop enhancement UI | ❌ None (auto-approved) |
| **"This is a different bus"** | Create new contribution | ✅ Review needed |

### 5.2 When PASSES THROUGH Found

| User Action | System Response | Admin Work |
|-------------|-----------------|------------|
| **"This is my bus!"** | +1 confirmation count | ❌ None |
| **"Add stops to this bus"** | Opens stop enhancement UI | ❌ None |
| **"This is a different bus"** | Create new contribution | ✅ Review needed |

### 5.3 When NO MATCH Found

| User Action | System Response | Admin Work |
|-------------|-----------------|------------|
| **Submit new bus** | Create pending contribution | ✅ Review needed |

---

## 6. Stop Enhancement Feature

When user clicks "Add Stops to This Bus":

```
┌─────────────────────────────────────────────────────────────────┐
│  Enhancing: Bus 27D (Chennai → Madurai)                         │
│                                                                  │
│  Current Route:                                                  │
│  ● Chennai (06:00) ─────────────────────────────────            │
│  │                                                               │
│  │  ➕ [Add stop between Chennai and Madurai]                   │
│  │                                                               │
│  ● Madurai (14:30) ─────────────────────────────────            │
│                                                                  │
│  ─────────────────────────────────────────────────────          │
│  Add New Stop:                                                   │
│                                                                  │
│  Stop Name*:      [Trichy                    ]                   │
│  Arrival Time:    [09:30                     ]                   │
│  Departure Time:  [09:45                     ]                   │
│                                                                  │
│  [Add Stop]  [Cancel]                                            │
└─────────────────────────────────────────────────────────────────┘
```

### After Enhancement:

```
Before:                          After:
● Chennai (06:00)                ● Chennai (06:00)
│                                │
│                                ● Trichy (09:30-09:45) ← NEW!
│                                │
● Madurai (14:30)                ● Madurai (14:30)
```

### Stop Enhancement Rules

1. **Auto-approved**: Stop additions don't need admin review
2. **Time validation**: Stop time must be between origin and destination times
3. **Attribution**: Track which user added which stop
4. **Gamification**: User gets contribution points

---

## 7. Matching Algorithm

### 7.1 Location Matching

```java
// Handles aliases and fuzzy matching
public Set<Long> findMatchingLocationIds(String locationName) {
    // 1. Exact match
    // 2. Alias match (Chennai = Madras, CMBT = Chennai Mofussil Bus Terminus)
    // 3. Fuzzy match (Levenshtein distance > 0.8)
    // 4. Contains match (partial)
}
```

### 7.2 Time Window Matching

```java
private static final int TIME_WINDOW_MINUTES = 15;

public boolean isTimeMatch(LocalTime existing, LocalTime input) {
    if (existing == null || input == null) return false;
    long diffMinutes = Math.abs(Duration.between(existing, input).toMinutes());
    return diffMinutes <= TIME_WINDOW_MINUTES;
}
```

### 7.3 Route Type Detection

```java
public MatchType determineMatchType(Bus existingBus, ContributionInput input) {
    boolean originMatches = matchesLocation(existingBus.getFromLocation(), input.getOrigin());
    boolean destIsTerminus = matchesLocation(existingBus.getToLocation(), input.getDestination());
    boolean destIsIntermediate = existingBus.getStops().stream()
        .anyMatch(stop -> matchesLocation(stop.getName(), input.getDestination()));
    boolean timeMatches = isTimeMatch(existingBus.getDepartureTime(), input.getDepartureTime());
    
    if (originMatches && destIsTerminus && timeMatches) {
        return MatchType.EXACT;
    } else if (originMatches && destIsIntermediate && timeMatches) {
        return MatchType.PASSES_THROUGH;
    } else if (originMatches && (destIsTerminus || destIsIntermediate)) {
        return MatchType.DIFFERENT_SERVICE; // Same route, different time
    }
    return MatchType.NO_MATCH;
}
```

---

## 8. API Design

### 8.1 Check for Duplicates

```
GET /api/v1/contributions/check-duplicate
    ?origin=Chennai
    &destination=Madurai
    &departureTime=06:00
    &busNumber=27D (optional)
```

**Response:**

```json
{
  "hasMatches": true,
  "matches": [
    {
      "busId": 59,
      "busNumber": "27D",
      "route": "Chennai → Madurai",
      "departureTime": "06:10",
      "arrivalTime": "14:30",
      "matchType": "EXACT",
      "stops": [
        {"name": "Chennai", "departureTime": "06:10"},
        {"name": "Madurai", "arrivalTime": "14:30"}
      ],
      "confirmationCount": 5,
      "actions": ["CONFIRM", "ADD_STOPS", "REPORT_DIFFERENT"]
    },
    {
      "busId": 42,
      "busNumber": "123",
      "route": "Chennai → Trichy → Madurai → Ramnad",
      "departureTime": "06:05",
      "matchType": "PASSES_THROUGH",
      "stopsOnUserRoute": [
        {"name": "Chennai", "departureTime": "06:05"},
        {"name": "Madurai", "arrivalTime": "14:00"}
      ],
      "actions": ["CONFIRM", "ADD_STOPS", "REPORT_DIFFERENT"]
    }
  ],
  "canAddNew": true
}
```

### 8.2 Confirm Existing Bus

```
POST /api/v1/buses/{busId}/confirm
```

**Response:**
```json
{
  "success": true,
  "newConfirmationCount": 6,
  "message": "Thank you for confirming this bus!"
}
```

### 8.3 Add Stop to Existing Bus

```
POST /api/v1/buses/{busId}/stops
Content-Type: application/json

{
  "stopName": "Trichy",
  "arrivalTime": "09:30",
  "departureTime": "09:45"
}
```

**Response:**
```json
{
  "success": true,
  "stopId": 156,
  "message": "Stop added successfully!",
  "updatedRoute": ["Chennai", "Trichy", "Madurai"]
}
```

### 8.4 Report as Different Bus

```
POST /api/v1/contributions/new
Content-Type: application/json

{
  "origin": "Chennai",
  "destination": "Madurai",
  "departureTime": "06:00",
  "busNumber": "27D-Express",
  "reportedDifferentFrom": 59,  // Links to bus user said is different
  "additionalNotes": "This is the express service, not the regular one"
}
```

---

## 9. Database Schema Updates

### 9.1 New Fields for buses Table

```sql
ALTER TABLE buses ADD COLUMN confirmation_count INT DEFAULT 0;
ALTER TABLE buses ADD COLUMN last_confirmed_at TIMESTAMP;
ALTER TABLE buses ADD COLUMN confidence_score DECIMAL(3,2) DEFAULT 0.50;
```

### 9.2 New Table: bus_confirmations

```sql
CREATE TABLE bus_confirmations (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    bus_id BIGINT NOT NULL,
    user_id VARCHAR(255),
    confirmed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45),
    FOREIGN KEY (bus_id) REFERENCES buses(id)
);
```

### 9.3 New Table: stop_contributions

```sql
CREATE TABLE stop_contributions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    bus_id BIGINT NOT NULL,
    stop_name VARCHAR(255) NOT NULL,
    arrival_time TIME,
    departure_time TIME,
    contributed_by VARCHAR(255),
    contributed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('PENDING', 'APPROVED', 'REJECTED') DEFAULT 'APPROVED',
    FOREIGN KEY (bus_id) REFERENCES buses(id)
);
```

---

## 10. UI Mockups

### 10.1 Contribution Form with Duplicate Check

```
┌─────────────────────────────────────────────────────────────────┐
│  🚌 Add Bus Route                                                │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  From*         [Chennai                              🔍]   ││
│  │  To*           [Madurai                              🔍]   ││
│  │  Departure*    [06:00                                  ]   ││
│  │  Bus Number    [27D                                    ]   ││
│  │                                                             ││
│  │  💡 Enter approximate time - we'll match ±15 minutes       ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  [Check Existing Buses]                                          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 10.2 Duplicate Found Screen

```
┌─────────────────────────────────────────────────────────────────┐
│  ✅ We found matching buses!                                     │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  🎯 EXACT MATCH                                             ││
│  │                                                             ││
│  │  🚌 Bus 27D: Chennai → Madurai                              ││
│  │     Departs: 06:10 | Arrives: 14:30                         ││
│  │     Stops: Chennai → Madurai (2 stops)                      ││
│  │     ✓ Confirmed by 5 users                                  ││
│  │                                                             ││
│  │  [✓ This is my bus!]  [➕ Add stops]  [✗ Different bus]    ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  ℹ️ ALSO PASSES THROUGH                                      ││
│  │                                                             ││
│  │  🚌 Bus 123: Chennai → Ramnad (via Madurai)                 ││
│  │     Departs: 06:05 | Madurai: 14:00                         ││
│  │                                                             ││
│  │  [✓ This is my bus!]  [➕ Add stops]                        ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  ─────────────────────────────────────────────────────────────  │
│  None of these match?  [Add as New Bus]                          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 10.3 Add Stops Screen

```
┌─────────────────────────────────────────────────────────────────┐
│  ➕ Add Stop to Bus 27D                                          │
│                                                                  │
│  Current Route:                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  ● Chennai (06:10)                                          ││
│  │  │                                                          ││
│  │  │  [+ Add stop here]                                       ││
│  │  │                                                          ││
│  │  ● Madurai (14:30)                                          ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  New Stop Details:                                               │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  Stop Name*     [Trichy                         🔍]        ││
│  │  Arrival        [09:30                            ]        ││
│  │  Departure      [09:45                            ]        ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  [Add Stop]  [Cancel]                                            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 11. Benefits Summary

| Benefit | How Achieved |
|---------|--------------|
| **Prevents duplicates** | Same route + same time = same bus |
| **Reduces admin work** | Confirmations & stop additions are auto-approved |
| **Improves data quality** | Multiple users contribute stops |
| **Encourages participation** | Users can enhance, not just add |
| **Handles all scenarios** | Exact match, pass-through, new bus |
| **User-friendly** | Approximate time OK, optional bus number |

---

## 12. Implementation Priority

### Phase 1: MVP (Week 1-2)
- [ ] Add `/check-duplicate` API endpoint
- [ ] Add confirmation count to buses table
- [ ] UI: Show existing buses before contribution
- [ ] UI: "This is my bus" confirmation button

### Phase 2: Enhancement (Week 3-4)
- [ ] Add `/buses/{id}/stops` API for adding stops
- [ ] UI: Add stops to existing bus flow
- [ ] Track stop contributors

### Phase 3: Polish (Week 5)
- [ ] Fuzzy location matching
- [ ] Alias support
- [ ] Admin dashboard for duplicate reports
- [ ] Gamification points for contributions

---

## 13. Decision Summary

| Scenario | Decision |
|----------|----------|
| Same route, same time (±15 min) | = SAME BUS → Confirm or enhance |
| Same route, different time (>15 min) | = DIFFERENT SERVICE → New bus |
| Same origin, dest is intermediate | = PASSES THROUGH → Show but different bus |
| Bus number different, rest same | = Could be same → Ask user |
| No match found | = NEW BUS → Create contribution |
| Time required? | = YES (users know ±10 min) |
| Bus number required? | = NO (optional, user may not know) |
| Stop additions need admin? | = NO (auto-approved) |
| New bus needs admin? | = YES (review needed) |

---

## 14. Open Questions for Review

1. **Time window**: Is ±15 minutes appropriate, or should it be ±10 or ±20?
2. **Stop auto-approval**: Should stop additions be auto-approved or require review?
3. **Confidence threshold**: At what confirmation count should a bus be considered "verified"?
4. **Duplicate reports**: How to handle when user says "different bus" but it looks the same?
5. **Rate limiting**: How many contributions per user per day?

---

*Document created: December 18, 2025*
*Status: Ready for Review*
