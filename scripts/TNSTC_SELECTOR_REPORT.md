# TNSTC Website Analysis – Correct Selectors & Approach

## Date: January 12, 2026

## Problem Summary
Original scraper failed because it used incorrect field selectors and didn't properly handle the site's autocomplete/validation mechanism.

## Discovered Selectors (Verified)

### Form Fields
- **Source Input**: `matchStartPlace` (ID)
- **Destination Input**: `matchEndPlace` (ID)
- **Journey Date**: `txtdeptDateOtrip` (ID) – *readonly, must set via JS*
- **Search Button**: `searchButton` (ID)
- **Popup Close Button**: `popup-close` (ID)

### Hidden Fields (Required for Validation)
- `selectStartPlace` – must contain source place code
- `selectEndPlace` – must contain destination place code
- `hiddenStartPlaceID` – must contain source place ID
- `hiddenEndPlaceID` – must contain destination place ID
- `txtStartPlaceCode` – source code
- `txtEndPlaceCode` – destination code
- `hiddenStartPlaceName` – source name
- `hiddenEndPlaceName` – destination name
- `txtJourneyDate` – journey date (DD/MM/YYYY)
- `hiddenOnwardJourneyDate` – same as txtJourneyDate

### JavaScript Global Variables (Must Set)
- `fromPlaceID` – source place ID
- `fromPlaceCode` – source place code
- `toPlaceID` – destination place ID
- `toPlaceCode` – destination place code

## Validation Logic
The search button's `onClick` handler (`setSearchAction`) validates:
1. `matchStartPlace` and `matchEndPlace` not empty
2. Source ≠ destination
3. **`selectStartPlace` and `selectEndPlace` are not empty/null** ← This was failing!
4. Date validation

If validation fails, alerts show "Invalid From Place" or "Invalid To Place".

## Autocomplete Endpoint
Backend API for place lookup:
- **URL**: `https://www.tnstc.in/OTRSOnline/jqreq.do?`
- **Method**: POST
- **For Source**: `hiddenAction=LoadFromPlaceList&matchStartPlace=<term>`
- **For Destination**: `hiddenAction=LoadTOPlaceList&matchEndPlace=<term>`
- **Response Format**: `PlaceID:PlaceCode:PlaceName^PlaceID:PlaceCode:PlaceName^...`

Example:
```
Input: MADURAI
Output: 123:MDU:MADURAI^456:MDUA:MADURAI AARAPPALAYAM^...
```

## Correct Approach

### Phase 1: Lookup Place Info
1. Call backend API with term (e.g., "MADURAI")
2. Parse response to extract `(PlaceName, PlaceID, PlaceCode)`
3. Pick first match containing the term

### Phase 2: Populate Form
Use JavaScript to set:
```javascript
// For source
document.forms[0].matchStartPlace.value = name;
document.forms[0].selectStartPlace.value = code;
document.forms[0].hiddenStartPlaceID.value = id;
document.forms[0].txtStartPlaceCode.value = code;
document.forms[0].hiddenStartPlaceName.value = name;
window.fromPlaceID = id;
window.fromPlaceCode = code;

// For destination
document.forms[0].matchEndPlace.value = name;
document.forms[0].selectEndPlace.value = code;
document.forms[0].hiddenEndPlaceID.value = id;
document.forms[0].txtEndPlaceCode.value = code;
document.forms[0].hiddenEndPlaceName.value = name;
window.toPlaceID = id;
window.toPlaceCode = code;
```

### Phase 3: Set Date
```javascript
const dateField = document.getElementById('txtdeptDateOtrip');
dateField.removeAttribute('readonly');
dateField.value = 'DD/MM/YYYY';
document.forms[0].txtJourneyDate.value = 'DD/MM/YYYY';
document.forms[0].hiddenOnwardJourneyDate.value = 'DD/MM/YYYY';
```

### Phase 4: Submit
```javascript
document.getElementById('searchButton').click();
```

## Results Selectors
*(To be discovered after successful search)*
- Try: `//div[@id='SearchResult']/div`
- Or: `//div[contains(@class,'bus-')]`
- Or: `//table//tr` if results are in table

## Recommendation
Replace the brittle UI automation (typing, waiting for dropdowns, clicking suggestions) with direct backend API calls plus JavaScript field population. This is more reliable and faster.
