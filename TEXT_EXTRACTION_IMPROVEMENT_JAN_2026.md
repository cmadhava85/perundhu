# Text Extraction Improvement - January 10, 2026

## Problem Identified

The AI bus schedule analyzer was performing poorly on **simple text input** (paste screen), causing:

### Screenshot 2: "Bus from Chennai to Madurai at 6 PM"
- ❌ Extracted "6" as bus number (should be "-")
- ❌ From: "Bus from Chennai" (should be "Chennai")  
- ❌ To: "Madurai at" (should be "Madurai")

### Screenshot 3: "Chennai to Madurai bus at 6 PM"  
- ❌ From: "Madu" (partial word - should be "Chennai")
- ❌ To: "Rai" (partial word - should be "Madurai")
- ❌ Bus number: "6" (time misinterpreted as bus number)

## Root Cause

The bus schedule extraction prompt was designed **exclusively for OCR on bus board images**, not for conversational text input. It had no logic to handle simple text descriptions, causing the AI to:

1. **Misinterpret time values as bus numbers** ("6 PM" → bus number "6")
2. **Extract partial words** ("Madurai" → "Madu" and "Rai")
3. **Include extra words in location fields** ("Bus from Chennai" instead of "Chennai")

## Solution Applied

### Enhanced Prompt with Input Type Detection

Added a new section at the beginning of the prompt:

```
🚨 INPUT TYPE DETECTION (CRITICAL - CHECK FIRST):

**TYPE A: SIMPLE TEXT INPUT** (e.g., "Bus from Chennai to Madurai at 6 PM")
  - User is providing simple text description of a bus route
  - DO NOT interpret time values as bus numbers!
  - DO NOT extract partial words from location names!
  - DO NOT assume arrival times unless explicitly mentioned
  - Extract information AS STATED, fill missing fields with "-"
  
  🚨 CRITICAL RULES FOR TEXT INPUT:
  - If no bus number mentioned → Use "-" for bus_num (NEVER use time as bus number!)
  - If only one time mentioned → Use it as dep_time, set arr_time to "-"
  - Extract full city names, not partial words (Chennai, not "Chen"; Madurai, not "Madu")
  - Preserve location names exactly as written
  - If origin not specified → Use "-" for from_location
  
**TYPE B: IMAGE INPUT** (bus board photographs, timing charts, schedules)
  - OCR extraction from actual bus board images
  - Follow detailed image analysis rules below
```

### Added Text Input Examples

Inserted 4 new examples showing correct extraction for text input:

**Example 3A**: "Bus from Chennai to Madurai at 6 PM"
```
ORIGIN:Chennai
TYPE:departure_board
ROUTES:
-|Chennai|Madurai|18:00|-|-|-
```

**Example 3B**: "Chennai to Madurai bus at 6 PM"
```
ORIGIN:Chennai
TYPE:departure_board
ROUTES:
-|Chennai|Madurai|18:00|-|-|-
```

**Example 3C**: With bus number and stops
```
27D|Chennai|Madurai|06:00|14:00|-|Tambaram,Chengalpattu,Villupuram,Trichy
```

**Example 3D**: Minimal information
```
-|-|Madurai|18:00|-|-|-
```

## Expected Results After Fix

### Test Case 1: "Bus from Chennai to Madurai at 6 PM"
✅ **Expected Output**:
- Bus Number: - (not specified)
- From: Chennai (NOT "Bus from Chennai")
- To: Madurai (NOT "Madurai at")
- Timings: 18:00 (departure), - (arrival not specified)
- Stops: None

### Test Case 2: "Chennai to Madurai bus at 6 PM"
✅ **Expected Output**:
- Bus Number: - (not specified)
- From: Chennai (NOT "Madu")
- To: Madurai (NOT "Rai")
- Timings: 18:00 (departure), - (arrival not specified)
- Stops: None

### Test Case 3: "Bus 27D from Chennai to Madurai, Departure: 6:00 AM, Arrival: 2:00 PM"
✅ **Expected Output** (already working correctly):
- Bus Number: 27D
- From: Chennai
- To: Madurai
- Timings: 06:00 AM (departure), 14:00 (arrival)
- Stops: (if provided)

## Files Changed

**File**: `backend/app/src/main/resources/prompts/bus-schedule-extraction.txt`

**Changes**:
1. Added "INPUT TYPE DETECTION" section at the beginning
2. Clear distinction between TEXT INPUT (Type A) and IMAGE INPUT (Type B)
3. Added 4 new examples (3A, 3B, 3C, 3D) demonstrating text extraction
4. Emphasized critical rules for text parsing:
   - Never use time as bus number
   - Extract full city names, not partial words
   - Use "-" for missing information
   - Preserve exact location names

## How It Works

### Before Fix
```
Input: "Bus from Chennai to Madurai at 6 PM"
      ↓
AI sees "6" in text → Assumes bus number
AI sees "Madurai at" → Extracts as-is
      ↓
Result: Bus #6, To: "Madurai at" ❌
```

### After Fix
```
Input: "Bus from Chennai to Madurai at 6 PM"
      ↓
AI detects: Simple text (Type A), not image
AI applies text rules:
  - "6 PM" is time, not bus number
  - Extract "Chennai" (clean location)
  - Extract "Madurai" (clean location)
  - "6 PM" = 18:00 departure time
      ↓
Result: Bus -, From: Chennai, To: Madurai, Time: 18:00 ✅
```

## Testing the Fix

### Local Testing

1. **Navigate to the text analyzer page**

2. **Test Case 1**:
   ```
   Input: Bus from Chennai to Madurai at 6 PM
   Expected: Bus:-, From: Chennai, To: Madurai, Time: 18:00, Arrival: -
   ```

3. **Test Case 2**:
   ```
   Input: Chennai to Madurai bus at 6 PM
   Expected: Bus:-, From: Chennai, To: Madurai, Time: 18:00, Arrival: -
   ```

4. **Test Case 3**:
   ```
   Input: Madurai at 6 PM
   Expected: Bus:-, From: -, To: Madurai, Time: 18:00, Arrival: -
   ```

5. **Test Case 4** (should still work):
   ```
   Input: Bus 27D from Chennai to Madurai, Departure: 6:00 AM, Arrival: 2:00 PM, Stops: Tambaram, Chengalpattu
   Expected: Bus: 27D, From: Chennai, To: Madurai, Dep: 06:00, Arr: 14:00, Stops: Tambaram, Chengalpattu
   ```

### Deployment

The prompt file is loaded on application startup (or on first use). To apply the changes:

1. **If running locally**:
   ```bash
   # Restart the backend
   cd backend
   ./mvnw spring-boot:run
   ```

2. **If deployed to Cloud Run**:
   ```bash
   # Rebuild and redeploy (or wait for next CD pipeline run)
   git add backend/app/src/main/resources/prompts/bus-schedule-extraction.txt
   git commit -m "fix: Improve text extraction for conversational input"
   git push origin master
   ```

## Why This Matters

### User Experience Impact

**Before**: Users typing simple queries like "Bus from Chennai to Madurai at 6 PM" got nonsensical results, making them think the feature is broken.

**After**: Clear, accurate extraction for both:
- 📸 **Image uploads** (bus board photos) - OCR extraction
- ✍️ **Text paste** (conversational input) - Natural language parsing

### Use Cases Now Supported

1. **Quick route lookup**: "Chennai to Madurai 6 PM"
2. **Informal descriptions**: "Bus from Salem at 8 AM"
3. **Partial information**: "Trichy bus at noon"
4. **Complete details**: "Bus 27D from Chennai to Madurai, Departure: 6:00 AM, Arrival: 2:00 PM, Stops: Tambaram, Chengalpattu, Villupuram, Trichy"
5. **Image OCR** (unchanged): Still works perfectly for bus board photos

## Additional Improvements

### Confidence Scoring

The AI should now provide more accurate confidence scores:
- **High confidence (90-95%)**: Complete, clear information
- **Medium confidence (70-85%)**: Partial information or ambiguous text
- **Low confidence (<70%)**: Very minimal or unclear input

### Error Handling

The prompt now better handles:
- Missing bus numbers → Returns "-"
- Missing origin → Returns "-"
- Single time mentioned → Uses as departure, sets arrival to "-"
- Partial location names → Extracts full names correctly

## Future Enhancements

Consider adding:
1. **Multi-route parsing**: Handle "Chennai to Madurai 6 PM and 8 PM" → 2 routes
2. **Natural language stops**: "via Tambaram and Villupuram" → Structured stops list
3. **Relative times**: "morning bus" → Interpret as 06:00-09:00
4. **Date parsing**: "January 15 bus" → Include date in extraction
5. **Return trip detection**: "Chennai to Madurai and back" → 2 routes

## Validation Checklist

After deployment, verify:

- [ ] "Bus from Chennai to Madurai at 6 PM" extracts correctly
- [ ] "Chennai to Madurai bus at 6 PM" extracts correctly  
- [ ] No time values appear as bus numbers
- [ ] No partial city names (e.g., "Madu", "Rai")
- [ ] Image OCR still works for bus board photos
- [ ] Confidence scores are reasonable (80-95% for clear text)
- [ ] Missing information shows as "-" not empty/null

---

**Status**: ✅ Fix Applied - Ready for Testing

**Date**: January 10, 2026  
**Impact**: HIGH - Fixes broken text extraction feature  
**Backward Compatibility**: ✅ YES - Image OCR unchanged, only added text handling
