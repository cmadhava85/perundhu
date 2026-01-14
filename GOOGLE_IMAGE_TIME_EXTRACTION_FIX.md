# Google Image Bus Time Extraction - Bug Fix Report

**Date**: January 13, 2026  
**Issue**: Time extraction from bus schedules had incorrect regex pattern and AM/PM conversion logic

## Problems Identified

### 1. **Incorrect Time Regex Pattern** 
**File**: `scripts/google_image_bus_scraper.py` (Line 278)

**Old Pattern**:
```regex
([0-2]?[0-9]):([0-5][0-9])\s*(AM|PM|am|pm)?
```

**Problem**: This pattern incorrectly matched times like "30:45" because:
- `[0-2]?` means 0-2 optionally
- `[0-9]` means 0-9
- Together they can match 0-29 as hours, allowing invalid hours 20-29

**New Pattern**:
```regex
\b(0[0-9]|1[0-9]|2[0-3]):([0-5][0-9])\b(?:\s*(AM|PM|am|pm))?
```

**Benefits**:
- Correctly matches only 00-23 hours
- Rejects invalid times like 24:30, 25:00, 30:45
- Uses word boundaries `\b` to prevent partial matches

---

### 2. **Incorrect AM/PM Conversion Logic**
**File**: `scripts/google_image_bus_scraper.py` (Lines 304-308)

**Old Logic**:
```python
if period and period.upper() == 'PM' and hour != 12:
    hour += 12
```

**Problem**: When time was already in 24-hour format (e.g., "18:45 PM"), adding 12 resulted in invalid time "30:45"

**New Logic**:
```python
if period:
    if period.upper() == 'PM' and hour != 12 and hour <= 11:
        hour += 12
    elif period.upper() == 'AM' and hour == 12:
        hour = 0
```

**Benefits**:
- Only converts 12-hour format times (1-11)
- Ignores AM/PM if hour is already 12-23 (already in 24-hour format)
- Properly handles edge cases

---

### 3. **Incomplete Time Validation**
**File**: `scripts/advanced_bus_image_processor.py` (Lines 290-291)

**Old Validator**:
```python
def validate_time_format(time_str: str) -> bool:
    """Validate if time is in HH:MM format."""
    return bool(re.match(r'^\d{2}:\d{2}$', time_str))
```

**Problem**: Only checked format, not actual time ranges. "25:00" was considered valid.

**New Validator**:
```python
def validate_time_format(time_str: str) -> bool:
    """Validate if time is in HH:MM format with valid ranges."""
    match = re.match(r'^(\d{2}):(\d{2})$', time_str)
    if not match:
        return False
    
    hour = int(match.group(1))
    minute = int(match.group(2))
    
    # Validate hour and minute ranges
    return 0 <= hour <= 23 and 0 <= minute <= 59
```

**Benefits**:
- Validates format AND ranges
- Rejects invalid times like 25:00, 24:30, 09:60
- Ensures all times are in valid 24-hour format

---

## Test Results

### Before Fix ❌
```
Text: Chennai to Madurai bus departs at 09:30 AM and arrives at 18:45 PM
Extracted times: ['09:30', '30:45']  ← WRONG!
Expected: ['09:30', '18:45']
```

### After Fix ✅
```
Text: Chennai to Madurai bus departs at 09:30 AM and arrives at 18:45 PM
Extracted times: ['09:30', '18:45']  ← CORRECT!
Expected: ['09:30', '18:45']
```

### Validation Tests ✅
```
✅ Valid time: 09:30 -> True
✅ Valid time: 18:45 -> True
✅ Valid time 23:59: 23:59 -> True
✅ Valid time 00:00: 00:00 -> True
✅ Invalid hour 25: 25:00 -> False
✅ Invalid hour 24: 24:30 -> False
✅ Invalid minute 60: 09:60 -> False
✅ Invalid format (no leading 0): 9:30 -> False
```

---

## Files Modified

1. **`scripts/google_image_bus_scraper.py`**
   - Line 278: Fixed time regex pattern
   - Lines 304-308: Fixed AM/PM conversion logic

2. **`scripts/advanced_bus_image_processor.py`**
   - Lines 290-300: Enhanced time validation with range checking

---

## Impact

- ✅ Correct time extraction from bus schedule images
- ✅ Accurate validation of extracted times
- ✅ Better data quality for bus route database
- ✅ Prevents invalid times from being stored in database
- ✅ All existing tests now pass

---

## Example Corrections

| Before | After | Status |
|--------|-------|--------|
| `30:45` | Rejected | ✅ Fixed |
| `24:30` | Rejected | ✅ Fixed |
| `09:30 -> 09:30` | `09:30 -> 09:30` | ✅ Correct |
| `06:45 PM -> 18:45` | `06:45 PM -> 18:45` | ✅ Correct |
| `18:45 PM -> 30:45` | `18:45 PM -> 18:45` | ✅ Fixed |

