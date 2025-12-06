package com.perundhu.application.service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Service;

import com.perundhu.domain.model.Location;
import com.perundhu.domain.port.FuzzyMatcherPort;
import com.perundhu.domain.port.GeocodingPort;
import com.perundhu.domain.port.LocationRepository;

import lombok.extern.slf4j.Slf4j;

/**
 * Service for resolving location names from OCR text to standardized location
 * data.
 * 
 * Uses a multi-tier approach:
 * 1. Static pattern matching (fast, for common cities)
 * 2. Database lookup (known locations)
 * 3. Fuzzy matching with known cities
 * 4. OpenStreetMap/Nominatim API (for unknown locations)
 * 5. Accept as-is if all else fails (for manual review)
 * 
 * Results are cached to minimize repeated lookups.
 */
@Service
@Slf4j
public class LocationResolutionService {

    private final LocationRepository locationRepository;
    private final FuzzyMatcherPort fuzzyMatcher;
    private final GeocodingPort geocodingClient;

    // Cache for resolved locations
    private final ConcurrentHashMap<String, LocationResolution> resolutionCache;

    // Static list of known Tamil Nadu cities for fuzzy matching
    private static final List<String> KNOWN_CITIES = List.of(
            "CHENNAI", "COIMBATORE", "MADURAI", "TRICHY", "SALEM", "TIRUNELVELI",
            "KANYAKUMARI", "THANJAVUR", "ERODE", "VELLORE", "TIRUPPUR", "KARUR",
            "KUMBAKONAM", "THOOTHUKUDI", "PATTUKKOTTAI", "VIRUDHUNAGAR", "THENI",
            "DINDIGUL", "PUDUKKOTTAI", "NAGERCOIL", "BENGALURU", "TIRUVANNAMALAI",
            "ARIYALUR", "PERAMBALUR", "NAMAKKAL", "KRISHNAGIRI", "DHARMAPURI",
            "HOSUR", "THIRUCHENDUR", "ARANI", "KANCHIPURAM", "RAMANATHAPURAM",
            "RAMESHWARAM", "SIVAKASI", "SIVAGANGA", "CUDDALORE", "VILLUPURAM",
            "TINDIVANAM", "CHIDAMBARAM", "NAGAPATTINAM", "MAYILADUTHURAI",
            "TIRUVARUR", "KARAIKAL", "PONDICHERRY", "OOTY", "COONOOR", "METTUPALAYAM",
            "POLLACHI", "UDUMALPET", "PALANI", "KODAIKANAL", "TENKASI", "SANKARANKOVIL",
            "KOVILPATTI", "TUTICORIN", "TIRUCHENDUR", "ARUPPUKKOTTAI", "PARAMAKUDI",
            "RAMESWARAM", "MANDAPAM", "PAMBAN", "DHANUSHKODI");

    // Tamil patterns for common cities (for Tamil OCR text)
    private static final Map<String, String[]> TAMIL_PATTERNS = new HashMap<>();

    static {
        TAMIL_PATTERNS.put("RAMESHWARAM", new String[] { "இராமேஸ்வரம்", "ராமேஸ்வரம்", "ராமே", "இராமே" });
        TAMIL_PATTERNS.put("CHENNAI", new String[] { "சென்னை", "செண்ணை" });
        TAMIL_PATTERNS.put("MADURAI", new String[] { "மதுரை", "மதுரா" });
        TAMIL_PATTERNS.put("COIMBATORE", new String[] { "கோயம்புத்தூர்", "கோவை" });
        TAMIL_PATTERNS.put("TRICHY", new String[] { "திருச்சி", "திருச்சிராப்பள்ளி" });
        TAMIL_PATTERNS.put("SALEM", new String[] { "சேலம்" });
        TAMIL_PATTERNS.put("TIRUNELVELI", new String[] { "திருநெல்வேலி", "நெல்லை" });
        TAMIL_PATTERNS.put("KANYAKUMARI", new String[] { "கன்னியாகுமரி", "குமரி" });
        TAMIL_PATTERNS.put("THANJAVUR", new String[] { "தஞ்சாவூர்", "தஞ்சை" });
        TAMIL_PATTERNS.put("THOOTHUKUDI", new String[] { "தூத்துக்குடி" });
        TAMIL_PATTERNS.put("BENGALURU", new String[] { "பெங்களூரு", "பெங்களூர்" });
        // Add more as needed...
    }

    public LocationResolutionService(
            LocationRepository locationRepository,
            FuzzyMatcherPort fuzzyMatcher,
            GeocodingPort geocodingClient) {
        this.locationRepository = locationRepository;
        this.fuzzyMatcher = fuzzyMatcher;
        this.geocodingClient = geocodingClient;
        this.resolutionCache = new ConcurrentHashMap<>();
        log.info("LocationResolutionService initialized with {} known cities", KNOWN_CITIES.size());
    }

    /**
     * Resolve a location name from OCR text to a standardized location.
     * 
     * @param rawText The raw location name from OCR
     * @return Resolution result with confidence and resolved name
     */
    public LocationResolution resolve(String rawText) {
        if (rawText == null || rawText.trim().isEmpty()) {
            return LocationResolution.unknown(rawText);
        }

        String normalized = rawText.trim().toUpperCase();

        // Check cache first
        if (resolutionCache.containsKey(normalized)) {
            return resolutionCache.get(normalized);
        }

        LocationResolution result = resolveInternal(rawText, normalized);
        resolutionCache.put(normalized, result);
        return result;
    }

    private LocationResolution resolveInternal(String rawText, String normalized) {
        // Step 1: Check Tamil patterns first (for Tamil text)
        for (Map.Entry<String, String[]> entry : TAMIL_PATTERNS.entrySet()) {
            for (String pattern : entry.getValue()) {
                if (rawText.contains(pattern)) {
                    log.debug("Resolved Tamil '{}' -> '{}'", rawText, entry.getKey());
                    return LocationResolution.fromPattern(entry.getKey(), rawText, 0.95);
                }
            }
        }

        // Step 2: OCR error correction
        String corrected = fuzzyMatcher.correctCommonOCRErrors(normalized);
        if (!corrected.equals(normalized)) {
            log.debug("OCR corrected: {} -> {}", normalized, corrected);
            normalized = corrected;
        }

        // Step 3: Exact match in known cities
        if (KNOWN_CITIES.contains(normalized)) {
            return LocationResolution.exact(normalized, rawText);
        }

        // Step 4: Database lookup
        Optional<Location> dbLocation = locationRepository.findByExactName(normalized);
        if (dbLocation.isPresent()) {
            return LocationResolution.fromDatabase(dbLocation.get(), rawText);
        }

        // Step 5: Fuzzy match against known cities (max 2 edits)
        String fuzzyMatch = fuzzyMatcher.findBestMatch(normalized, KNOWN_CITIES, 2);
        if (fuzzyMatch != null) {
            double similarity = fuzzyMatcher.similarity(normalized, fuzzyMatch);
            log.debug("Fuzzy matched '{}' -> '{}' (similarity: {})", normalized, fuzzyMatch, similarity);
            return LocationResolution.fromFuzzyMatch(fuzzyMatch, rawText, similarity);
        }

        // Step 6: Try database fuzzy search
        List<Location> similarLocations = locationRepository.findByNameContaining(normalized);
        if (!similarLocations.isEmpty()) {
            Location bestMatch = similarLocations.get(0);
            double similarity = fuzzyMatcher.similarity(normalized, bestMatch.getName());
            if (similarity > 0.7) {
                return LocationResolution.fromDatabase(bestMatch, rawText, similarity);
            }
        }

        // Step 7: OpenStreetMap/Nominatim lookup (for unknown locations)
        // This is slower but can find smaller towns and villages
        try {
            Optional<GeocodingPort.GeocodingResult> osmResult = geocodingClient.searchTamilNadu(rawText);
            if (osmResult.isPresent()) {
                GeocodingPort.GeocodingResult result = osmResult.get();
                String canonicalName = result.getCanonicalName();
                if (canonicalName != null && !canonicalName.isEmpty()) {
                    log.info("Geocoding resolved '{}' -> '{}'", rawText, canonicalName);
                    return LocationResolution.fromNominatim(
                            canonicalName,
                            rawText,
                            result.getLatitude(),
                            result.getLongitude(),
                            0.8);
                }
            }
        } catch (Exception e) {
            log.warn("Geocoding lookup failed for '{}': {}", rawText, e.getMessage());
        }

        // Step 8: Accept as-is if it looks like a valid location name
        // (at least 4 letters, no numbers, not a keyword)
        String cleaned = normalized.replaceAll("[^A-Z]", "");
        if (cleaned.length() >= 4 && !isKeyword(cleaned)) {
            log.info("Accepting unresolved location as-is: {} (needs manual review)", rawText);
            return LocationResolution.unverified(cleaned, rawText);
        }

        // Couldn't resolve
        return LocationResolution.unknown(rawText);
    }

    /**
     * Resolve multiple locations in batch
     */
    public List<LocationResolution> resolveAll(List<String> rawTexts) {
        List<LocationResolution> results = new ArrayList<>();
        for (String text : rawTexts) {
            results.add(resolve(text));
        }
        return results;
    }

    /**
     * Check if a word is a keyword (not a location)
     */
    private boolean isKeyword(String word) {
        return word.matches(
                "ORDINARY|SEATER|SUPER|DELUXE|EXPRESS|ROUTE|TIME|VIA|DESTINATION|FAST|SLEEPER|VOLVO|LUXURY|DEPARTURE|ARRIVAL|FARE|BUS|STAND|STATION");
    }

    /**
     * Clear resolution cache
     */
    public void clearCache() {
        resolutionCache.clear();
        log.info("Location resolution cache cleared");
    }

    /**
     * Get cache statistics
     */
    public Map<String, Object> getCacheStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("cacheSize", resolutionCache.size());
        stats.put("knownCities", KNOWN_CITIES.size());
        stats.put("geocodingCacheSize", geocodingClient.getCacheSize());
        return stats;
    }

    /**
     * Resolution result with confidence score and metadata
     */
    @lombok.Data
    @lombok.Builder
    public static class LocationResolution {
        private String resolvedName; // The standardized name
        private String originalText; // Original OCR text
        private double confidence; // 0.0 to 1.0
        private ResolutionSource source; // How it was resolved
        private Double latitude; // Optional coordinates
        private Double longitude;
        private boolean verified; // Whether this is a verified location
        private String message; // Optional message for UI

        public enum ResolutionSource {
            PATTERN, // Matched Tamil pattern
            EXACT, // Exact match in known list
            DATABASE, // Found in database
            FUZZY, // Fuzzy string matching
            NOMINATIM, // OpenStreetMap lookup
            UNVERIFIED, // Accepted but needs verification
            UNKNOWN // Could not resolve
        }

        public static LocationResolution exact(String name, String original) {
            return LocationResolution.builder()
                    .resolvedName(name)
                    .originalText(original)
                    .confidence(1.0)
                    .source(ResolutionSource.EXACT)
                    .verified(true)
                    .build();
        }

        public static LocationResolution fromPattern(String name, String original, double confidence) {
            return LocationResolution.builder()
                    .resolvedName(name)
                    .originalText(original)
                    .confidence(confidence)
                    .source(ResolutionSource.PATTERN)
                    .verified(true)
                    .build();
        }

        public static LocationResolution fromDatabase(Location location, String original) {
            return fromDatabase(location, original, 1.0);
        }

        public static LocationResolution fromDatabase(Location location, String original, double confidence) {
            return LocationResolution.builder()
                    .resolvedName(location.getName().toUpperCase())
                    .originalText(original)
                    .confidence(confidence)
                    .source(ResolutionSource.DATABASE)
                    .latitude(location.getLatitude())
                    .longitude(location.getLongitude())
                    .verified(true)
                    .build();
        }

        public static LocationResolution fromFuzzyMatch(String name, String original, double similarity) {
            return LocationResolution.builder()
                    .resolvedName(name)
                    .originalText(original)
                    .confidence(similarity)
                    .source(ResolutionSource.FUZZY)
                    .verified(similarity >= 0.9)
                    .message(similarity < 0.9 ? "Please verify: Did you mean " + name + "?" : null)
                    .build();
        }

        public static LocationResolution fromNominatim(String name, String original,
                double lat, double lon, double confidence) {
            return LocationResolution.builder()
                    .resolvedName(name)
                    .originalText(original)
                    .confidence(confidence)
                    .source(ResolutionSource.NOMINATIM)
                    .latitude(lat)
                    .longitude(lon)
                    .verified(false)
                    .message("New location from OpenStreetMap - please verify")
                    .build();
        }

        public static LocationResolution unverified(String name, String original) {
            return LocationResolution.builder()
                    .resolvedName(name)
                    .originalText(original)
                    .confidence(0.5)
                    .source(ResolutionSource.UNVERIFIED)
                    .verified(false)
                    .message("Unknown location - needs manual verification")
                    .build();
        }

        public static LocationResolution unknown(String original) {
            return LocationResolution.builder()
                    .resolvedName(null)
                    .originalText(original)
                    .confidence(0.0)
                    .source(ResolutionSource.UNKNOWN)
                    .verified(false)
                    .message("Could not resolve location")
                    .build();
        }
    }
}
