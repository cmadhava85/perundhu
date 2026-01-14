# Multi-City Terminal Testing Guide

## Quick Test Cases

### Test 1: Coimbatore Inter-State Route
**API Call:**
```bash
curl "http://localhost:8080/api/v1/terminals/resolve?source=Coimbatore&destination=Bangalore"
```

**Expected Response:**
```json
{
  "originalSource": "Coimbatore",
  "destination": "Bangalore",
  "needsTerminalInfo": true,
  "resolvedSource": "Gandhipuram",
  "terminal": {
    "displayName": "Gandhipuram Central Bus Stand",
    "address": "Gandhipuram, Coimbatore, Tamil Nadu 641012",
    "city": "Coimbatore",
    "latitude": 11.0036,
    "longitude": 76.9462,
    "majorDestinations": ["Tiruppur", "Erode", "Hosur", "Bangalore", "Mysore", "Hyderabad", "Salem"],
    "operatedBy": "TNSTC"
  },
  "message": "Buses to Bangalore depart from Gandhipuram Central Bus Stand"
}
```

---

### Test 2: Coimbatore Intra-State Route
**API Call:**
```bash
curl "http://localhost:8080/api/v1/terminals/resolve?source=Coimbatore&destination=Madurai"
```

**Expected Terminal:** Singanallur Bus Terminus
**Route Type:** Southern routes (intra-state)

---

### Test 3: Coimbatore Western Route
**API Call:**
```bash
curl "http://localhost:8080/api/v1/terminals/resolve?source=CBE&destination=Palakkad"
```

**Expected Terminal:** Ukkadam Bus Terminus
**Route Type:** Western routes

---

### Test 4: Tirupati Inter-State Route
**API Call:**
```bash
curl "http://localhost:8080/api/v1/terminals/resolve?source=Tirupati&destination=Hyderabad"
```

**Expected Response:**
```json
{
  "originalSource": "Tirupati",
  "destination": "Hyderabad",
  "needsTerminalInfo": true,
  "resolvedSource": "Central Bus Terminal",
  "terminal": {
    "displayName": "Sri Padmavati Bus Terminus",
    "address": "Tiruchirappalli Road, Tirupati, Andhra Pradesh 517501",
    "city": "Tirupati",
    "latitude": 13.1939,
    "longitude": 79.8944,
    "operatedBy": "APSRTC"
  }
}
```

---

### Test 5: Tirupati Local Route
**API Call:**
```bash
curl "http://localhost:8080/api/v1/terminals/resolve?source=Tirupati&destination=Kalahasti"
```

**Expected Terminal:** Tirupati Moffusil Bus Terminus
**Route Type:** Local/suburban routes

---

### Test 6: Salem Northern Route
**API Call:**
```bash
curl "http://localhost:8080/api/v1/terminals/resolve?source=Salem&destination=Bangalore"
```

**Expected Response:**
```json
{
  "originalSource": "Salem",
  "destination": "Bangalore",
  "needsTerminalInfo": true,
  "resolvedSource": "Central Bus Terminus",
  "terminal": {
    "displayName": "Salem Central Bus Terminus",
    "address": "Arignar Anna Road, Salem, Tamil Nadu 636001",
    "city": "Salem",
    "latitude": 11.4647,
    "longitude": 78.1411,
    "operatedBy": "TNSTC"
  }
}
```

---

### Test 7: Salem Southern Route
**API Call:**
```bash
curl "http://localhost:8080/api/v1/terminals/resolve?source=Salem&destination=Trichy"
```

**Expected Terminal:** Salem Moffusil Bus Terminus
**Route Type:** Southern routes

---

### Test 8: Chennai Existing Routes (Regression Test)
**API Call:**
```bash
curl "http://localhost:8080/api/v1/terminals/resolve?source=Chennai&destination=Madurai"
```

**Expected Terminal:** Kilambakkam Bus Terminus
**Expected Response:** Should match existing Chennai terminal system

---

### Test 9: Alternate City Names
**API Call - CBE Abbreviation:**
```bash
curl "http://localhost:8080/api/v1/terminals/resolve?source=CBE&destination=Bangalore"
```

**Expected:** Should resolve Coimbatore terminals (city detection handles abbreviations)

---

### Test 10: Case-Insensitive Routing
**API Call - Mixed Case:**
```bash
curl "http://localhost:8080/api/v1/terminals/resolve?source=COIMBATORE&destination=BANGALORE"
```

**Expected:** Should resolve correctly (normalization handles case)

---

## Frontend Testing

### Search Results Component Test

**Step 1:** Navigate to bus search
**Step 2:** Enter source as one of: Coimbatore, Tirupati, Salem, Chennai
**Step 3:** Enter destination matching the city's routes
**Step 4:** Verify terminal info appears in search results

**Test Routes:**
| Source | Destination | Expected Terminal |
|--------|-------------|-------------------|
| Coimbatore | Bangalore | Gandhipuram |
| Coimbatore | Madurai | Singanallur |
| Coimbatore | Palani | Ukkadam |
| Tirupati | Hyderabad | Tirupati Central |
| Tirupati | Kalahasti | Tirupati Moffusil |
| Salem | Bangalore | Salem Central |
| Salem | Madurai | Salem Moffusil |
| Chennai | Madurai | Kilambakkam |

---

## Admin Validation Testing

### Option 1: Terminal Validation Dialog

**Test Scenario 1: Approve Image with Correct Terminal**
1. Admin uploads bus image for route Coimbatore → Bangalore
2. Image approval panel shows terminal validation
3. System resolves → Gandhipuram Central Bus Stand
4. Admin verifies map and coordinates
5. Admin checks "I have verified this terminal information is correct"
6. Admin approves image
7. **Expected:** Image approved with correct terminal stored

**Test Scenario 2: Admin Corrects Terminal During Approval**
1. Admin uploads image for route Tirupati → Hyderabad
2. System resolves → Tirupati Central
3. Admin disagrees with terminal
4. Admin can click "Edit Terminal" (if available)
5. Admin selects correct terminal from available options
6. Admin validates and approves
7. **Expected:** Image stored with admin-corrected terminal

---

## Error Scenarios

### Scenario 1: Unknown Destination
**API Call:**
```bash
curl "http://localhost:8080/api/v1/terminals/resolve?source=Coimbatore&destination=UnknownCity123"
```

**Expected Behavior:**
- Should return default city terminal (Gandhipuram)
- OR return `needsTerminalInfo: false` if destination completely unknown

---

### Scenario 2: Invalid City
**API Call:**
```bash
curl "http://localhost:8080/api/v1/terminals/resolve?source=InvalidCity&destination=Bangalore"
```

**Expected Response:**
```json
{
  "originalSource": "InvalidCity",
  "destination": "Bangalore",
  "needsTerminalInfo": false
}
```

---

### Scenario 3: Empty Parameters
**API Call:**
```bash
curl "http://localhost:8080/api/v1/terminals/resolve?source=&destination="
```

**Expected:** Should handle gracefully (400 Bad Request or empty response)

---

## Performance Testing

### Load Test: 100 Concurrent Requests

**Command:**
```bash
ab -n 100 -c 10 "http://localhost:8080/api/v1/terminals/resolve?source=Coimbatore&destination=Bangalore"
```

**Expected:**
- Response time: < 50ms per request
- Success rate: 100%
- No memory leaks

---

## Integration Points to Verify

✅ **Frontend Integration:**
- [ ] useTerminalResolution hook fetches from backend
- [ ] TerminalInfoAlert displays correctly for all cities
- [ ] SearchResults shows terminal info after search
- [ ] Map view opens with correct coordinates

✅ **Admin Integration:**
- [ ] Terminal validation dialog appears during image approval
- [ ] Admin can verify terminal on map
- [ ] Checkbox blocks approval until confirmed
- [ ] Terminal info saved with approval

✅ **Backend Integration:**
- [ ] TerminalController endpoint responds
- [ ] All city terminals initialize
- [ ] Destination mappings work correctly
- [ ] Fallback logic functions

✅ **Database:**
- [ ] BusTerminal entities persist correctly
- [ ] Coordinates are accurate
- [ ] City names match search inputs

---

## Debugging Tips

### Check City Detection
```java
// In TerminalResolutionService
System.out.println("isCoimbatoreGeneric: " + isCoimbatoreGeneric("coimbatore")); // Should be true
System.out.println("isTirupatiGeneric: " + isTirupatiGeneric("tirupati"));     // Should be true
```

### Check Terminal Resolution
```java
BusTerminal terminal = findCoimbatoreTerminalForDestination("bangalore");
System.out.println("Resolved Terminal: " + terminal.getDisplayName());
```

### Check API Response
```bash
curl -v "http://localhost:8080/api/v1/terminals/resolve?source=Coimbatore&destination=Bangalore" | jq .
```

---

## Summary

✅ Multi-city terminal support is complete with:
- 11 terminals across 4 cities
- Smart destination routing
- Seamless frontend integration
- Admin validation support
- Comprehensive fallback logic

All tests should pass to confirm successful multi-city deployment.
