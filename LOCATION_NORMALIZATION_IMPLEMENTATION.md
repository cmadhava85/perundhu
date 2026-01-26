# Location Name Normalization Implementation

## Summary
Implemented intelligent location name normalization to handle bus terminus/stand variations in search. Now users can search with "Besant Nagar MTC Terminus" and it will match "Besant Nagar" in the database.

## Changes Made

### 1. **New Utility: `locationNormalizer.ts`**
   - **File**: `frontend/src/utils/locationNormalizer.ts`
   - **Functions**:
     - `normalizeLocationName()`: Removes bus terminus/stand suffixes and clarifications
     - `extractBaseLocationName()`: Gets base location from compound names
     - `areLocationsEquivalent()`: Checks semantic equivalence between location names
     - `findLocationByNormalizedName()`: Finds location ID by normalized name

   - **Supported Variations**:
     ```
     "Besant Nagar MTC Terminus" -> "Besant Nagar"
     "Vadapalani Bus Stand" -> "Vadapalani"
     "Salem Bus Stop" -> "Salem"
     "Chennai - CMBT (Koyambedu)" -> "Chennai"
     "Madurai - TNSTC Terminus" -> "Madurai"
     "Coimbatore - KSRTC Bus Station" -> "Coimbatore"
     "Bangalore (Main)" -> "Bangalore"
     ```

### 2. **Updated: `TransitSearchForm.tsx`**
   - **File**: `frontend/src/components/TransitSearchForm.tsx`
   - **Changes**:
     - Added import for location normalization functions
     - Enhanced `handleSearch()` function to normalize location names during matching
     - Now matches locations by normalized name instead of exact match only
     
   - **Matching Strategy**:
     1. If location already selected, use it as-is
     2. Normalize input query: "Besant Nagar MTC Terminus" → "Besant Nagar"
     3. Find database location with matching normalized name
     4. Fall back to partial matching if needed

### 3. **Updated: `locationAutocompleteService.ts`**
   - **File**: `frontend/src/services/locationAutocompleteService.ts`
   - **Changes**:
     - Enhanced `deduplicateResults()` to handle terminus/stand variations
     - Better grouping of "Besant Nagar" and "Besant Nagar MTC Terminus" as the same location
     - Improved deduplication logic to normalize names before comparing

### 4. **Test Suite: `locationNormalizer.test.ts`**
   - **File**: `frontend/src/utils/__tests__/locationNormalizer.test.ts`
   - **Coverage**:
     - Tests for MTC Terminus removal
     - Tests for Bus Stop/Stand variations
     - Tests for compound location names with bus codes
     - Tests for parenthetical clarifications
     - Tests for multi-operator handling (TNSTC, KSRTC, etc.)
     - Tests for case-insensitivity
     - Tests for edge cases (empty strings, whitespace)

## How It Works

### Search Flow:
```
User Input: "Besant Nagar MTC Terminus" → "Vadapalani"
                    ↓
         Normalize Input Names
                    ↓
  "Besant Nagar" matches DB entry "Besant Nagar"
    "Vadapalani" matches DB entry "Vadapalani"
                    ↓
           Perform Bus Search
                    ↓
         Display Results (Same as if user
                  typed "Besant Nagar" → "Vadapalani")
```

### Matching Priority:
1. **Already Selected**: Use selected location directly
2. **Exact Match**: "Besant Nagar" = "Besant Nagar"
3. **Normalized Match**: "Besant Nagar MTC Terminus" → "Besant Nagar" (matches)
4. **Partial Match**: "Besant Nagar MTC Terminus" contains "Besant Nagar" (matches)

## Supported Terminus/Stand Patterns

The normalizer recognizes and removes:
- Operator codes: MTC, TNSTC, CMBT, DTC, SETC, KSRTC, KSDC
- Location types: Bus Stand, Bus Stop, Bus Station, Terminus, Bus Terminus
- Clarifications: (Koyambedu), (Downtown), (Main), etc.
- Separators: " - ", " _ ", etc.

## Examples

### Example 1: MTC Terminus
```
Search: "Besant Nagar MTC Terminus" → "Vadapalani"
Result: Same as searching "Besant Nagar" → "Vadapalani"
        (User still sees MTC buses clearly identified)
```

### Example 2: Bus Stand
```
Search: "Salem Bus Stop" → "Coimbatore Bus Station"
Result: Matches "Salem" → "Coimbatore" in database
```

### Example 3: Compound Names
```
Search: "Chennai - CMBT (Koyambedu)" → "Bangalore"
Result: Matches "Chennai" → "Bangalore" in database
        (Koyambedu location code is ignored)
```

## Benefits

1. **Better UX**: Users don't need to remember exact database naming
2. **Flexible Search**: Accepts natural language with terminus/stand names
3. **Reduced Errors**: Fewer "location not found" messages
4. **Multi-operator Support**: Works across all bus operators (MTC, TNSTC, etc.)
5. **Future-proof**: Easy to add more variations as needed

## Testing

Run tests with:
```bash
npm test -- locationNormalizer.test.ts
```

## Future Enhancements

1. **Backend Integration**: Add similar normalization in backend search API
2. **Autocomplete Improvement**: Auto-suggest "Besant Nagar" when user types "Besant Nagar MTC"
3. **Bilingual Support**: Handle Tamil translations of terminus names
4. **Historical Variants**: Support old/renamed bus stand names
