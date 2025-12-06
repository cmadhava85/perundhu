# Scalable Location Resolution System

## Problem Statement

The OCR system previously used a hardcoded `TAMIL_CITY_PATTERNS` map with only ~30 cities. Tamil Nadu has thousands of cities, towns, and villages that need to be recognized from OCR text.

## Solution: Multi-Strategy Location Resolution

We implemented a hybrid approach that combines multiple strategies for maximum coverage:

### 1. Static Pattern Cache (Fastest)
- ~30 common cities in `TAMIL_CITY_PATTERNS`
- Used for quick lookups of frequently occurring cities
- Handles common OCR variations

### 2. Database Lookup
- Check `locations` table for known locations
- Uses `LocationRepository.findByExactName()` and `findByNameContaining()`
- Includes translations from `translations` table

### 3. Fuzzy Matching (Levenshtein Distance)
- **File:** `FuzzyMatcher.java`
- Handles OCR errors like:
  - "CHENNAL" → "CHENNAI"
  - "BANGALORE" → "BENGALURU"
  - "TUTICORIN" → "THOOTHUKUDI"
- Uses Levenshtein distance algorithm
- Configurable maximum edit distance (default: 2)
- Returns matches with confidence scores (0.0-1.0)

### 4. OpenStreetMap/Nominatim API (For Unknown Locations)
- **File:** `NominatimClient.java`
- Queries OSM for locations in Tamil Nadu
- Rate-limited (1 request/second) to respect OSM guidelines
- Cached results to minimize API calls
- Validates coordinates are within Tamil Nadu bounds:
  - Latitude: 8.0° - 14.0° N
  - Longitude: 76.0° - 81.0° E

### 5. Accept Unknown (Fallback)
- Locations not found anywhere are accepted with `UNVERIFIED` status
- Marked for manual review
- At least 4 letters, no numbers, not a keyword

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     OCRServiceImpl                               │
│  - matchTamilToEnglish()                                        │
│  - normalizeEnglishCity()                                       │
│  - findAllCitiesInText()                                        │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│               LocationResolutionService                          │
│  - resolve(rawText) → LocationResolution                        │
│  - resolveAll(List<String>) → List<LocationResolution>          │
└───────────────────────────┬─────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│ FuzzyMatcher  │   │LocationRepo   │   │NominatimClient│
│               │   │               │   │               │
│ - Levenshtein │   │ - Database    │   │ - OSM API     │
│ - OCR errors  │   │ - findByName  │   │ - Caching     │
└───────────────┘   └───────────────┘   └───────────────┘
```

## New Files Created

### 1. `NominatimClient.java`
Location: `backend/app/src/main/java/com/perundhu/infrastructure/adapter/geocoding/`

```java
// Key features:
- HTTP client for Nominatim API
- Rate limiting (1.1 sec between requests)
- ConcurrentHashMap cache
- Tamil Nadu coordinate validation
- NominatimResult with name, lat/lon, city, district
```

### 2. `FuzzyMatcher.java`
Location: `backend/app/src/main/java/com/perundhu/infrastructure/adapter/geocoding/`

```java
// Key methods:
- findBestMatch(text, candidates, maxDistance)
- findMatches(text, candidates, maxDistance)
- similarity(s1, s2) → 0.0 to 1.0
- correctCommonOCRErrors(text) → corrected text

// OCR corrections included:
- CHENNAL → CHENNAI
- BANGALOR → BENGALURU
- TUTICORIN → THOOTHUKUDI
- TRICCHY → TRICHY
// ... and 15+ more
```

### 3. `LocationResolutionService.java`
Location: `backend/app/src/main/java/com/perundhu/application/service/`

```java
// Resolution strategy (in order):
1. Tamil patterns
2. OCR error correction
3. Exact match in known cities
4. Database lookup
5. Fuzzy matching
6. Database fuzzy search
7. Nominatim API
8. Accept as unverified

// LocationResolution contains:
- resolvedName
- originalText
- confidence (0.0 - 1.0)
- source (PATTERN, EXACT, DATABASE, FUZZY, NOMINATIM, UNVERIFIED, UNKNOWN)
- latitude/longitude (if available)
- verified flag
- message (for UI)
```

## Configuration

### HexagonalConfig.java Updates

Added beans:
```java
@Bean
public FuzzyMatcher fuzzyMatcher() {
    return new FuzzyMatcher();
}

@Bean
public NominatimClient nominatimClient() {
    return new NominatimClient();
}

@Bean
public LocationResolutionService locationResolutionService(
    LocationRepository locationRepository,
    FuzzyMatcher fuzzyMatcher,
    NominatimClient nominatimClient) {
  return new LocationResolutionService(locationRepository, fuzzyMatcher, nominatimClient);
}
```

### OCRServiceImpl Updates

- Added `LocationResolutionService` injection (optional/nullable)
- Enhanced `matchTamilToEnglish()` with fallback to resolution service
- Enhanced `normalizeEnglishCity()` with fallback to resolution service
- Enhanced `findAllCitiesInText()` with fallback to resolution service

## Usage

The resolution happens automatically when OCR text is processed:

```java
// In OCRServiceImpl.matchTamilToEnglish()
if (locationResolutionService != null) {
    LocationResolutionService.LocationResolution resolution = 
        locationResolutionService.resolve(text);
    if (resolution.getResolvedName() != null && resolution.getConfidence() >= 0.7) {
        return resolution.getResolvedName();
    }
}
```

## Confidence Thresholds

| Source | Confidence | Verified |
|--------|------------|----------|
| PATTERN | 0.95 | Yes |
| EXACT | 1.0 | Yes |
| DATABASE | 1.0 | Yes |
| FUZZY | 0.7-1.0 | Yes if ≥0.9 |
| NOMINATIM | 0.8 | No |
| UNVERIFIED | 0.5 | No |
| UNKNOWN | 0.0 | No |

## Rate Limiting

Nominatim API requires:
- 1 request per second maximum
- User-Agent header with contact info
- No bulk geocoding

Our implementation:
- 1.1 second delay between requests
- Results cached in memory
- Batch requests use sequential processing

## Future Improvements

1. **Persist Nominatim Cache**: Save to database for persistence across restarts
2. **Machine Learning**: Train a model on Tamil city names for better OCR correction
3. **User Contributions**: Let users add new city mappings through the app
4. **Offline Data**: Download OSM data for Tamil Nadu for offline resolution
5. **Admin Panel**: Add UI for managing unverified locations

## Testing

```bash
cd backend && ./gradlew compileJava
# BUILD SUCCESSFUL
```

The system will:
1. First check static patterns (fast)
2. Check database if pattern fails
3. Try fuzzy matching
4. Fall back to OSM Nominatim
5. Accept as unverified if all else fails

This allows handling thousands of Tamil Nadu locations without maintaining a huge static map.
