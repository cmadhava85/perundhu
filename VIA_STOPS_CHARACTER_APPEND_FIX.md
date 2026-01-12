# Via Stops Character Append Issue - Analysis & Fix

**Issue Date:** January 11, 2026  
**Issue Type:** Route Data Formatting Bug  
**Priority:** Medium  
**Status:** Identified

---

## 🔍 Problem Description

When approving an image contribution with **via (intermediate) stops**, the route's `scheduleInfo` field is constructed with the format:

```
"Via: Stop1, Stop2, Stop3"
```

However, there appears to be an issue where an **extra character** (potentially a comma, whitespace, or newline) is being appended to this field, resulting in improper formatting when the route is displayed or used later.

### Example Scenario
```
Submitted Route: Salem → Krishnagiri via (Viadharmapuri, Kaveripattinam)

❌ Incorrect Result:
"Via: Viadharmapuri, Kaveripattinam," (trailing comma)
or
"Via: Viadharmapuri, Kaveripattinam\n" (trailing newline)

✅ Expected Result:
"Via: Viadharmapuri, Kaveripattinam" (clean, no trailing character)
```

---

## 📍 Issue Location

### Backend File
**File:** `ImageContributionProcessingService.java`  
**Lines:** 487, 572

**Code:**
```java
// Line 487 - First instance
String viaInfo = !viaStops.isEmpty() ? "Via: " + String.join(", ", viaStops) : null;

// Line 572 - Second instance  
String viaInfo = !viaStops.isEmpty() ? "Via: " + String.join(", ", viaStops) : null;
```

### Issues Identified

1. **No Trimming:** The viaStops list items might contain leading/trailing whitespace
2. **No Validation:** Stop names from OCR might include special characters
3. **Null Handling:** Empty or null stops could cause issues
4. **Character Encoding:** Special characters from image OCR might not be properly sanitized

---

## 🔧 Root Cause Analysis

### 1. Stop Data May Contain Whitespace
When extracting stops from images using Gemini AI, the extracted text might include:
- Leading spaces: `" Viadharmapuri"`
- Trailing spaces: `"Viadharmapuri "`
- Extra commas: `"Viadharmapuri,"`
- Newlines: `"Viadharmapuri\n"`

### 2. Join Operation Doesn't Clean Items
```java
String.join(", ", viaStops)
// If viaStops = ["Viadharmapuri ", " Kaveripattinam,"]
// Result = "Viadharmapuri ,  Kaveripattinam,"
//          ↑ extra space  ↑ extra space  ↑ trailing comma
```

### 3. Gemini OCR Extraction
Looking at line 387-430 in ImageContributionProcessingService:
```java
List<String> viaStops = extractViaStops(routes.get(route_number));
```

The `extractViaStops()` method might return uncleaned text.

---

## ✅ Solution

### Option 1: Clean Individual Stop Names (Recommended)

**File:** `ImageContributionProcessingService.java`

Apply at extraction point:

```java
private List<String> extractAndCleanViaStops(List<String> rawStops) {
    if (rawStops == null || rawStops.isEmpty()) {
        return new ArrayList<>();
    }
    
    return rawStops.stream()
        .filter(Objects::nonNull)                    // Remove nulls
        .map(String::trim)                          // Remove whitespace
        .map(s -> s.replaceAll("[,;:]+$", ""))     // Remove trailing punctuation
        .filter(s -> !s.isEmpty())                  // Remove empty strings
        .filter(s -> !s.equals("-") && !s.equals("N/A"))  // Remove placeholders
        .distinct()                                  // Remove duplicates
        .collect(Collectors.toList());
}
```

### Option 2: Clean the Final viaInfo String

**File:** `ImageContributionProcessingService.java` (Lines 487, 572)

```java
// Before (WRONG):
String viaInfo = !viaStops.isEmpty() ? "Via: " + String.join(", ", viaStops) : null;

// After (CORRECT):
String viaInfo = null;
if (!viaStops.isEmpty()) {
    String cleanedStops = viaStops.stream()
        .filter(Objects::nonNull)
        .map(String::trim)
        .filter(s -> !s.isEmpty())
        .collect(Collectors.joining(", "));
    
    if (!cleanedStops.isEmpty()) {
        viaInfo = "Via: " + cleanedStops;
    }
}
```

### Option 3: Add Validation in RouteContribution Entity

**File:** `RouteContribution.java`

```java
public void setScheduleInfo(String scheduleInfo) {
    if (scheduleInfo != null) {
        // Remove trailing commas, spaces, and special characters
        this.scheduleInfo = scheduleInfo
            .trim()
            .replaceAll("[,;:]*\\s*$", "");  // Remove trailing punctuation/spaces
    } else {
        this.scheduleInfo = null;
    }
}
```

---

## 🐛 Additional Issues Found

### Related Issue 1: Null Via Stops
The code sets viaInfo to `null` if stops list is empty:
```java
String viaInfo = !viaStops.isEmpty() ? "Via: " + String.join(", ", viaStops) : null;
```

This is correct, but could be clearer with a helper method.

### Related Issue 2: Special Characters in Stop Names
Stop names extracted from OCR might contain:
- Unicode characters (Tamil text)
- Extra punctuation
- Parentheses or brackets

These should be validated against the location database.

---

## 🚀 Implementation Steps

### Step 1: Add Helper Method

Add this helper method to `ImageContributionProcessingService.java`:

```java
/**
 * Clean and validate a list of stop names from OCR extraction
 */
private List<String> cleanViaStops(List<String> rawStops) {
    if (rawStops == null || rawStops.isEmpty()) {
        return new ArrayList<>();
    }
    
    return rawStops.stream()
        .filter(Objects::nonNull)
        .map(String::trim)
        .map(s -> s.replaceAll("^[,;:]*\\s*", ""))        // Remove leading punctuation
        .map(s -> s.replaceAll("[,;:]*\\s*$", ""))        // Remove trailing punctuation
        .filter(s -> !s.isEmpty())
        .filter(s -> !s.matches("^[-N/A?]*$"))            // Filter out placeholders
        .distinct()
        .collect(Collectors.toList());
}
```

### Step 2: Update Both viaInfo Constructions

Replace lines 487 and 572:

```java
// OLD:
String viaInfo = !viaStops.isEmpty() ? "Via: " + String.join(", ", viaStops) : null;

// NEW:
List<String> cleanedStops = cleanViaStops(viaStops);
String viaInfo = !cleanedStops.isEmpty() ? "Via: " + String.join(", ", cleanedStops) : null;
```

### Step 3: Update where viaStops is Used

Update line 464-469 where viaStops is created to clean it immediately:

```java
// OLD:
List<String> viaStops = extractViaStops(routes.get(route_number));

// NEW:
List<String> viaStops = cleanViaStops(extractViaStops(routes.get(route_number)));
```

### Step 4: Test

**Test Case 1: Clean via stops**
```
Input: [" Viadharmapuri ", " Kaveripattinam"]
Expected: "Via: Viadharmapuri, Kaveripattinam"
```

**Test Case 2: Via stops with punctuation**
```
Input: ["Viadharmapuri,", "Kaveripattinam,"]
Expected: "Via: Viadharmapuri, Kaveripattinam"
```

**Test Case 3: Empty/null via stops**
```
Input: [] or null
Expected: null (no viaInfo field)
```

---

## 📊 Impact Analysis

| Component | Impact | Risk |
|-----------|--------|------|
| ImageContributionProcessingService | Medium | Low - Only affects OCR extraction |
| RouteContribution display | Low | Low - Just formatting |
| Route approval workflow | None | None |
| Database storage | Low | None - Only display string |

---

## 🎯 Benefits

✅ **Cleaner route data** - No trailing characters  
✅ **Better UX** - Routes display properly without artifacts  
✅ **More reliable** - Handles edge cases from OCR  
✅ **Easier debugging** - Consistent data format  
✅ **Future-proof** - Handles Unicode and special characters  

---

## 📝 Files to Modify

1. **Backend:**
   - `ImageContributionProcessingService.java` (add helper method + update 2 locations)
   - Optional: `RouteContribution.java` (add setter validation)

2. **Testing:**
   - Create unit test for `cleanViaStops()` method
   - Test edge cases with special characters

---

## 🔍 Verification Steps

After implementing the fix:

1. **Submit an image** with route having multiple stops
2. **Check the route details** modal for scheduleInfo field
3. **Verify no trailing characters** appear
4. **Test with special characters** in stop names
5. **Check database** to confirm clean data is stored

---

## 📌 Notes

- This fix focuses on output cleaning rather than input validation
- Consider adding a separate location validation layer for stop names
- Document the via stops format in API specification
- Consider limiting via stops count (e.g., max 10 stops per route)

---

**Last Updated:** January 11, 2026  
**Priority for Implementation:** Next Sprint  
**Estimated Effort:** 1-2 hours
