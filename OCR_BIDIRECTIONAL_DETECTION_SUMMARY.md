# OCR Bidirectional Route Detection Enhancement

## Summary
Enhanced the OCR extraction system to automatically detect and create bidirectional bus routes from schedule images.

## Problem
The previous OCR system only extracted routes in one direction. When a bus schedule image showed bidirectional service (e.g., Salem ⇄ Krishnagiri), it would only extract the forward routes, missing the return journey routes.

### Example Issue
**Image showed:** Salem ⇄ Krishnagiri/Dharmapuri (4 timings)
- Route: TN30BM1040
- Timings: 01:35, 12:45, 08:40, 18:40
- Via: Dharmapuri, Kaveripattinam

**Previous behavior:** Extracted only 4 routes (all Salem → destination)
**Expected behavior:** Should extract 8 routes (4 forward + 4 reverse)

## Solution Implemented

### 1. Enhanced Prompt (bus-schedule-extraction.txt)
Added bidirectional detection instructions to the Gemini Vision AI prompt:

```
🚨 CRITICAL - BIDIRECTIONAL ROUTE DETECTION:
MUST check for bidirectional indicators in the image/text:
- Visual indicators: ⇄, ↔, ←→, ⟷, ↕, or two opposite arrows
- Text indicators (English): "bidirectional", "both ways", "two-way", "return service"
- Text indicators (Tamil): "இருவழி" (iruvazhi), "இரு திசை" (iru thisai)
- Layout indicators: Two columns with opposite direction headers
- "NON-STOP" services with two columns typically indicate bidirectional

WHEN BIDIRECTIONAL DETECTED:
1. Add "BIDIRECTIONAL:true" line after TYPE line
2. Extract routes for BOTH directions
3. Create separate route entries for each direction
```

### 2. Updated Parsing Logic (GeminiVisionServiceImpl.java)
Added parsing for the `BIDIRECTIONAL` flag:

```java
} else if (line.startsWith("BIDIRECTIONAL:")) {
    String bidirectional = line.substring(14).trim();
    result.put("bidirectional", bidirectional.equalsIgnoreCase("true"));
}
```

### 3. Enhanced Route Creation (ImageContributionProcessingService.java)
Modified `createRouteDataFromOCR()` to:

1. Check for `bidirectional` flag in extracted data
2. Create forward direction routes (as before)
3. If bidirectional=true, automatically create reverse direction routes:
   - Swap fromLocation ↔ toLocation
   - Reverse the via stops order
   - Use same departure times
   - Create separate database entries

```java
// Check if bidirectional flag is set
Boolean isBidirectional = (Boolean) extractedData.get("bidirectional");
if (isBidirectional == null) {
    isBidirectional = false;
}

// ... create forward routes ...

// If bidirectional, create reverse direction routes
if (isBidirectional) {
    logger.info("Creating reverse direction routes for bidirectional service: {} -> {}",
            validatedTo, validatedFrom);

    // Reverse the via stops if present
    String reverseVia = via;
    if (via != null && !via.isEmpty()) {
        String[] viaStops = via.split(",");
        StringBuilder reversedVia = new StringBuilder();
        for (int i = viaStops.length - 1; i >= 0; i--) {
            if (reversedVia.length() > 0) {
                reversedVia.append(",");
            }
            reversedVia.append(viaStops[i].trim());
        }
        reverseVia = reversedVia.toString();
    }

    // Create reverse routes with same times
    for (String departureTime : departureTimes) {
        RouteContribution reverseRoute = createRouteContributionWithDepartureTime(
                contribution,
                busNumber,
                validatedTo,  // Swap: destination becomes origin
                validatedFrom, // Swap: origin becomes destination
                reverseVia,
                null, // operatorName
                null, // fare
                departureTime,
                List.of(departureTime),
                null, // stops
                status);

        RouteContribution savedReverseRoute = routeContributionOutputPort.save(reverseRoute);
        createdRoutes.add(savedReverseRoute);
    }

    logger.info("Created {} reverse route entries for {} -> {}",
            departureTimes.size(), validatedTo, validatedFrom);
}
```

## Expected Output Format

When Gemini detects bidirectional indicators, it will now output:

```
ORIGIN:SALEM
TYPE:route_schedule
BIDIRECTIONAL:true
ROUTES:
TN30BM1040|SALEM|KRISHNAGIRI|01:35|-|-|Dharmapuri,Kaveripattinam
TN30BM1040|SALEM|KRISHNAGIRI|12:45|-|-|Dharmapuri,Kaveripattinam
TN30BM1040|SALEM|DHARMAPURI|08:40|-|-|Dharmapuri,Kaveripattinam
TN30BM1040|SALEM|DHARMAPURI|18:40|-|-|Dharmapuri,Kaveripattinam
END
```

The backend will then automatically create:
1. **Forward routes (4 routes):** Salem → Krishnagiri/Dharmapuri
2. **Reverse routes (4 routes):** Krishnagiri/Dharmapuri → Salem

Total: **8 route database entries** from 4 extracted route lines.

## Benefits

1. **Automatic Detection:** No manual intervention needed for bidirectional routes
2. **Complete Data:** Both directions captured from a single image
3. **Accurate VIA Stops:** Reverse direction stops are automatically reversed
4. **Database Consistency:** Separate entries for each direction with proper origin/destination
5. **User Contributions:** Contributors don't need to upload separate images for each direction

## Files Modified

1. `/backend/app/src/main/resources/prompts/bus-schedule-extraction.txt`
   - Added bidirectional detection instructions
   - Added example format with BIDIRECTIONAL flag

2. `/backend/app/src/main/java/com/perundhu/infrastructure/adapter/service/impl/GeminiVisionServiceImpl.java`
   - Added parsing for `BIDIRECTIONAL:` line in response

3. `/backend/app/src/main/java/com/perundhu/application/service/ImageContributionProcessingService.java`
   - Enhanced `createRouteDataFromOCR()` to check bidirectional flag
   - Added logic to create reverse direction routes automatically

## Testing

To test with the existing image:
```bash
curl -X POST http://localhost:8080/api/admin/contributions/images/2030b75e-2c7a-4d0a-9119-c65753f9e5db/extract-ocr
```

Expected result: 8 routes (4 forward + 4 reverse) instead of 4 routes

## Next Steps

1. Test OCR extraction on the uploaded bidirectional image
2. Verify that 8 routes are created (4 forward + 4 reverse)
3. Check that via stops are properly reversed
4. Validate database entries show correct origin/destination for both directions

## Status
✅ Implementation Complete
⏳ Testing Pending (requires authentication for OCR endpoint)
