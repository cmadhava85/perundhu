# TNSTC Scraper - Update Summary
**Date**: January 12, 2026

## Problem Resolved ✅
The scraper was failing because it used incorrect field IDs and didn't properly populate the hidden form fields required by the site's validation logic.

## Root Cause
The TNSTC website validates that hidden fields `selectStartPlace` and `selectEndPlace` contain place codes before allowing search. The old scraper only typed into visible fields and attempted to click autocomplete dropdowns, which never set these hidden fields.

## Solution Implemented
1. **Backend API Integration**: Call the site's autocomplete endpoint directly via JavaScript `fetch()` to resolve place names to `(name, id, code)` tuples
2. **Explicit Field Population**: Use JavaScript to set all required fields:
   - Visible: `matchStartPlace`, `matchEndPlace`, `txtdeptDateOtrip`
   - Hidden: `selectStartPlace`, `selectEndPlace`, `hiddenStartPlaceID`, `hiddenEndPlaceID`, `txtStartPlaceCode`, `txtEndPlaceCode`, `hiddenStartPlaceName`, `hiddenEndPlaceName`, `txtJourneyDate`, `hiddenOnwardJourneyDate`
   - Globals: `window.fromPlaceID`, `window.fromPlaceCode`, `window.toPlaceID`, `window.toPlaceCode`
3. **Date Handling**: Remove `readonly` attribute and set date via JS
4. **Search Click**: Target `searchButton` by ID

## Test Results
- ✅ Popup closes correctly
- ✅ Place resolution works (MADURAI → `75/MAD`, TRICHY → `74/TRI`)
- ✅ Form validation passes
- ✅ Search submits successfully
- ✅ Results page loads (shows "SORRY NO SERVICES AVAILABLE" for MAD→TRI on 15/01/2026)

## Next Steps
1. Test with routes that have available buses (e.g., CHENNAI ↔ MADURAI, COIMBATORE ↔ SALEM)
2. Discover result selectors for bus cards once buses are found
3. Update `parse_search_results()` with correct selectors
4. Test stop details extraction

## Files Updated
- `tnstc_bus_scraper_selenium.py` – Fixed `search_buses()` method
- `TNSTC_SELECTOR_REPORT.md` – Documented correct selectors and approach
- `tnstc_probe.py` – Updated test script

## Correct Selectors Reference
```
Field IDs:
- matchStartPlace (visible source)
- matchEndPlace (visible dest)
- txtdeptDateOtrip (visible date)
- searchButton (submit)
- popup-close (popup dismiss)

Autocomplete API:
- POST https://www.tnstc.in/OTRSOnline/jqreq.do?
- Source: hiddenAction=LoadFromPlaceList&matchStartPlace=<term>
- Dest: hiddenAction=LoadTOPlaceList&matchEndPlace=<term>
- Response: ID:CODE:NAME^ID:CODE:NAME^...
```
