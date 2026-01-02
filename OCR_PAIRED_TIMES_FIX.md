# OCR Schedule Extraction Fix - Two-Column Paired Times

## Problem Identified

When extracting bus schedules from TSS/TNSTC boards showing a **two-column layout with paired times**, the OCR was incorrectly treating the data.

### Example from Your Image (Hosur ↔ Chennai):

**LEFT COLUMN (Hosur → Chennai):**
```
Departure (மணி) | Arrival (மணி)
     07:45      |    17:35
     14:30      |    20:35
     17:00      |    23:10
```

**RIGHT COLUMN (Chennai → Hosur):**
```
Departure (மணி) | Arrival (மணி)
     05:30      |    10:15
     07:00      |    13:10
     08:40      |    21:35
```

### What Was Wrong:

The system was incorrectly parsing this as:
- 3 separate departure times from Hosur (07:45, 14:30, 17:00) combined with
- 3 separate arrival times at Chennai (17:35, 20:35, 23:10)
- Similarly for Chennai column

**Instead of correctly understanding:** Each row is a COMPLETE route with paired departure/arrival times.

---

## Solution Implemented

### Enhanced Gemini Vision Prompt

Updated the OCR extraction prompt in `GeminiVisionServiceImpl.java` with:

#### 1. **Critical Pattern Recognition Section** (New)
Added at the top of the prompt to immediately alert Gemini about this exact layout:

```
🚨 CRITICAL PATTERN - TWO-COLUMN PAIRED TIMES (TSS/TNSTC Boards):

LEFT COLUMN: "STATION_A → STATION_B"      |  RIGHT COLUMN: "STATION_B → STATION_A"
Departure | Arrival                        |  Departure | Arrival
07:45     | 17:35                          |  05:30     | 10:15
14:30     | 20:35                          |  07:00     | 13:10
17:00     | 23:10                          |  08:40     | 21:35

CRITICAL EXTRACTION: Each PAIR of times = ONE ROUTE (not merged!)
RESULT: 6 SEPARATE ROUTES extracted (NOT 3 merged routes!)
```

#### 2. **Enhanced Bidirectional Route Pattern Section**
Replaced generic explanation with detailed, specific instructions:

```
BIDIRECTIONAL ROUTE PATTERN WITH PAIRED TIMES:

If you see a layout like:
LEFT COLUMN:
[STATION_A → STATION_B]
[Departure from A: DEP1] [Arrival at B: ARR1]
[Departure from A: DEP2] [Arrival at B: ARR2]
[Departure from A: DEP3] [Arrival at B: ARR3]

RIGHT COLUMN:
[STATION_B → STATION_A]
[Departure from B: DEP4] [Arrival at A: ARR4]
[Departure from B: DEP5] [Arrival at A: ARR5]
[Departure from B: DEP6] [Arrival at A: ARR6]

Then IMPORTANT - Extract as follows:
- Each PAIR of times in left column = ONE complete route: STATION_A → STATION_B
  * First time (e.g., 07:45) = Departure FROM STATION_A
  * Second time (e.g., 17:35) = Arrival AT STATION_B
  * If 3 departure/arrival pairs shown: this is 3 BUSES for this direction

CRITICAL - DO NOT merge or average times. Each row is a SEPARATE BUS SCHEDULE.
Extract as 6 separate routes total (3 Hosur→Chennai + 3 Chennai→Hosur).
```

#### 3. **Improved Time Extraction Rules**
Enhanced with explicit guidance on paired times:

```
CRITICAL FOR PAIRED TIMES (Departure/Arrival pairs):
- When a board shows times in PAIRS (e.g., "07:45 | 17:35"), this means:
  * LEFT time = Departure from origin
  * RIGHT time = Arrival at destination
  * This is ONE bus schedule, NOT two separate schedules
  
- Extract as SEPARATE ROUTES for each pair:
  * If 3 pairs in left column (Hosur→Chennai): Create 3 routes, each with one dep_time and one arr_time
  * If 3 pairs in right column (Chennai→Hosur): Create 3 more routes, each with one dep_time and one arr_time
  
- Example from image:
  PAIR 1: "07:45 → 17:35" = Route: Hosur→Chennai, dep_time=07:45, arr_time=17:35
  PAIR 2: "14:30 → 20:35" = Route: Hosur→Chennai, dep_time=14:30, arr_time=20:35
  PAIR 3: "17:00 → 23:10" = Route: Hosur→Chennai, dep_time=17:00, arr_time=23:10
  
- Do NOT merge as: dep_time=07:45,14:30,17:00 arr_time=17:35,20:35,23:10
```

#### 4. **New Example (Example 3B)**
Added complete worked example showing exact extraction for two-column paired layout:

```
Example 3B - TWO-COLUMN BIDIRECTIONAL PAIRED TIMES:

ORIGIN:Hosur
TYPE:route_schedule
ROUTES:
-|Hosur|Chennai|-|07:45|17:35|-
-|Hosur|Chennai|-|14:30|20:35|-
-|Hosur|Chennai|-|17:00|23:10|-
-|Chennai|Hosur|-|05:30|10:15|-
-|Chennai|Hosur|-|07:00|13:10|-
-|Chennai|Hosur|-|08:40|21:35|-
END

EXTRACTION EXPLANATION:
- Left column: Each row creates one Hosur→Chennai route with paired times
- Right column: Each row creates one Chennai→Hosur route with paired times
- Result: 6 SEPARATE routes total (NOT combined)
```

---

## Files Modified

**File:** `backend/app/src/main/java/com/perundhu/infrastructure/adapter/service/impl/GeminiVisionServiceImpl.java`

**Changes:**
1. Added CRITICAL PATTERN section (lines ~70-85)
2. Enhanced BIDIRECTIONAL ROUTE PATTERN WITH PAIRED TIMES section (lines ~95-125)
3. Improved TIME EXTRACTION RULES with paired times guidance (lines ~242-260)
4. Added new Example 3B - TWO-COLUMN BIDIRECTIONAL PAIRED TIMES (lines ~310-345)

---

## Expected Behavior After Fix

### For the Hosur-Chennai image:

**Before Fix:**
- System might return 3 Hosur→Chennai routes OR misparse times

**After Fix:**
- System returns **6 routes total**:
  1. Hosur → Chennai, departs 07:45, arrives 17:35
  2. Hosur → Chennai, departs 14:30, arrives 20:35
  3. Hosur → Chennai, departs 17:00, arrives 23:10
  4. Chennai → Hosur, departs 05:30, arrives 10:15
  5. Chennai → Hosur, departs 07:00, arrives 13:10
  6. Chennai → Hosur, departs 08:40, arrives 21:35

### Each route has:
- ✅ Separate departure time
- ✅ Separate arrival time
- ✅ Correct from/to locations
- ✅ No merged or averaged times

---

## Testing Recommendations

1. **Test with the Hosur-Chennai image:**
   - Upload to admin dashboard
   - Run OCR extraction
   - Verify 6 routes are extracted (not 3)
   - Verify each route has correct paired departure/arrival times

2. **Test with other bidirectional boards:**
   - Look for other TSS/TNSTC boards with two-column layout
   - Verify all columns are parsed correctly

3. **Verify database:**
   - Check that 6 separate bus records are created
   - Each should have distinct departure/arrival times
   - No duplicate or merged records

---

## Why This Pattern is Common

Tamil Nadu State Transport System (TSS) and TNSTC boards commonly use this two-column layout for:
- Bidirectional routes (A ↔ B)
- Long-distance buses with multiple daily services
- Efficient space usage on physical boards

The left column shows all Hosur→Chennai services, and the right shows all Chennai→Hosur services. Each row represents one complete bus schedule, not just a time slot to be merged with others.

---

## Notes for Future Maintenance

- This pattern is **VERY COMMON** in Tamil Nadu bus boards
- Always assume paired times = separate routes
- When you see "X | Y" times side by side, treat as ONE route (not two separate times from one bus)
- Do NOT average or merge paired times across multiple rows
- Each row = one bus schedule = one route extraction

---

## Testing Command

```bash
curl 'https://perundhu-backend-preprod-1032721240281.asia-south1.run.app/api/admin/contributions/images/{image-id}/extract-ocr' \
  -X 'POST' \
  -H 'authorization: Bearer dev-admin-token'
```

Expected output should show 6 separate routes with correct paired times.
