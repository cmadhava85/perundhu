package com.perundhu.infrastructure.adapter.geocoding;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Component;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.perundhu.domain.port.GeocodingPort;

import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.bulkhead.annotation.Bulkhead;
import io.github.resilience4j.retry.annotation.Retry;
import lombok.extern.slf4j.Slf4j;

/**
 * Client for OpenStreetMap Nominatim API for geocoding location names.
 * Used to resolve unknown city/town names to standardized names and
 * coordinates.
 * 
 * Rate limit: 1 request per second (Nominatim usage policy)
 * Results are cached to minimize API calls.
 * 
 * Enhanced with multi-query strategy to find bus stands like:
 * - Arapalayam, Periyar in Madurai
 * - CMBT in Chennai
 */
@Component
@Slf4j
public class NominatimClient implements GeocodingPort {

    private static final String NOMINATIM_BASE_URL = "https://nominatim.openstreetmap.org/search";
    private static final String TAMIL_NADU_SUFFIX = ", Tamil Nadu, India";
    private static final Duration REQUEST_TIMEOUT = Duration.ofSeconds(10);
    private static final long RATE_LIMIT_MS = 1100; // 1.1 seconds between requests

    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;
    private final ConcurrentHashMap<String, NominatimResult> cache;
    private long lastRequestTime = 0;

    // Major cities in Tamil Nadu for query enhancement
    private static final String[] MAJOR_CITIES = {
            "Madurai", "Chennai", "Coimbatore", "Trichy", "Tiruchirappalli",
            "Salem", "Tirunelveli", "Erode", "Vellore", "Thanjavur",
            "Dindigul", "Theni", "Nagercoil", "Thoothukudi", "Karaikudi"
    };

    public NominatimClient() {
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(REQUEST_TIMEOUT)
                .build();
        this.objectMapper = new ObjectMapper();
        this.cache = new ConcurrentHashMap<>();
    }

    /**
     * Search for a location in Tamil Nadu, India
     * 
     * @param query The location name to search for (English or Tamil)
     * @return Optional containing the result if found
     */
    @Override
    public Optional<GeocodingResult> searchTamilNadu(String query) {
        return searchTamilNaduInternal(query).map(r -> r);
    }

    /**
     * Internal search method that returns NominatimResult.
     * Uses multi-query strategy for better bus stand discovery.
     */
    @CircuitBreaker(name = "osm", fallbackMethod = "searchTamilNaduInternalFallback")
    @Bulkhead(name = "osm")
    @Retry(name = "externalApi")
    public Optional<NominatimResult> searchTamilNaduInternal(String query) {
        if (query == null || query.trim().isEmpty()) {
            return Optional.empty();
        }

        String normalizedQuery = query.trim().toUpperCase();

        // Check cache first
        if (cache.containsKey(normalizedQuery)) {
            log.debug("Nominatim cache hit for: {}", normalizedQuery);
            return Optional.ofNullable(cache.get(normalizedQuery));
        }

        // Generate multiple search queries to improve bus stand discovery
        List<String> searchQueries = generateBusStandSearchQueries(query);

        for (String searchQuery : searchQueries) {
            Optional<NominatimResult> result = executeNominatimSearch(searchQuery);
            if (result.isPresent()) {
                cache.put(normalizedQuery, result.get());
                return result;
            }
        }

        // Cache negative result to avoid repeated lookups
        cache.put(normalizedQuery, null);
        return Optional.empty();
    }

    /**
     * Generate multiple search query variations for better bus stand discovery.
     * OpenStreetMap may have bus stands named differently than user input.
     */
    private List<String> generateBusStandSearchQueries(String query) {
        List<String> queries = new ArrayList<>();
        String cleanQuery = query.trim();

        // Extract city name if present (e.g., "Arapalayam Madurai" -> city = "Madurai")
        String cityName = extractCityFromQuery(cleanQuery);
        String locationName = cleanQuery.replace(cityName, "").trim();

        // Strategy 1: Direct query with "bus stand" appended (if not already present)
        if (!cleanQuery.toLowerCase().contains("bus stand") &&
                !cleanQuery.toLowerCase().contains("bus station")) {
            queries.add(cleanQuery + " bus stand" + TAMIL_NADU_SUFFIX);
        }

        // Strategy 2: Original query with Tamil Nadu context
        queries.add(cleanQuery + TAMIL_NADU_SUFFIX);

        // Strategy 3: If city is detected, search with city context
        if (!cityName.isEmpty() && !locationName.isEmpty()) {
            queries.add(locationName + " bus stand " + cityName + TAMIL_NADU_SUFFIX);
            queries.add(locationName + " " + cityName + TAMIL_NADU_SUFFIX);
        }

        // Strategy 4: Search as suburb/area (for places like Arapalayam)
        if (!cleanQuery.toLowerCase().contains("bus")) {
            queries.add(cleanQuery + " India");
        }

        return queries;
    }

    /**
     * Extract city name from query if present.
     */
    private String extractCityFromQuery(String query) {
        String queryLower = query.toLowerCase();
        for (String city : MAJOR_CITIES) {
            if (queryLower.contains(city.toLowerCase())) {
                return city;
            }
        }
        return "";
    }

    /**
     * Execute a single Nominatim search with rate limiting.
     */
    private Optional<NominatimResult> executeNominatimSearch(String searchQuery) {
        try {
            enforceRateLimit();

            String encodedQuery = URLEncoder.encode(searchQuery, StandardCharsets.UTF_8);
            String url = String.format(
                    "%s?q=%s&format=json&addressdetails=1&limit=5&accept-language=en",
                    NOMINATIM_BASE_URL, encodedQuery);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .header("User-Agent", "Perundhu-BusSchedule/1.0 (contact@perundhu.com)")
                    .timeout(REQUEST_TIMEOUT)
                    .GET()
                    .build();

            log.debug("Nominatim search: {}", searchQuery);
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 200) {
                return findBestResult(response.body(), searchQuery);
            } else {
                log.warn("Nominatim returned status {}: {}", response.statusCode(), response.body());
            }

        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            log.warn("Nominatim request interrupted for: {}", searchQuery);
        } catch (Exception e) {
            log.error("Nominatim search failed for '{}': {}", searchQuery, e.getMessage());
        }

        return Optional.empty();
    }

    /**
     * Enforce rate limiting for Nominatim API.
     */
    private void enforceRateLimit() throws InterruptedException {
        synchronized (this) {
            long now = System.currentTimeMillis();
            long elapsed = now - lastRequestTime;
            if (elapsed < RATE_LIMIT_MS) {
                Thread.sleep(RATE_LIMIT_MS - elapsed);
            }
            lastRequestTime = System.currentTimeMillis();
        }
    }

    /**
     * Find the best result from Nominatim response, preferring bus_station type.
     */
    private Optional<NominatimResult> findBestResult(String responseBody, String searchQuery) {
        try {
            JsonNode results = objectMapper.readTree(responseBody);

            if (results.isArray() && results.size() > 0) {
                NominatimResult busStationResult = null;
                NominatimResult anyResult = null;

                for (JsonNode result : results) {
                    NominatimResult parsed = parseResult(result);
                    if (parsed != null && isInTamilNadu(parsed)) {
                        // Prefer bus_station type
                        if ("bus_station".equals(parsed.getType())) {
                            busStationResult = parsed;
                            break;
                        }
                        if (anyResult == null) {
                            anyResult = parsed;
                        }
                    }
                }

                NominatimResult bestResult = busStationResult != null ? busStationResult : anyResult;
                if (bestResult != null) {
                    log.info("Nominatim resolved '{}' to '{}' (type: {})",
                            searchQuery, bestResult.getDisplayName(), bestResult.getType());
                    return Optional.of(bestResult);
                }
            }
        } catch (Exception e) {
            log.error("Failed to parse Nominatim response: {}", e.getMessage());
        }
        return Optional.empty();
    }

    /**
     * Batch search for multiple locations
     */
    public List<NominatimResult> searchMultiple(List<String> queries) {
        List<NominatimResult> results = new ArrayList<>();
        for (String query : queries) {
            searchTamilNaduInternal(query).ifPresent(results::add);
        }
        return results;
    }

    private NominatimResult parseResult(JsonNode node) {
        try {
            String displayName = node.path("display_name").asText();
            String name = node.path("name").asText();
            double lat = node.path("lat").asDouble();
            double lon = node.path("lon").asDouble();
            String type = node.path("type").asText();
            String osmType = node.path("osm_type").asText();

            // Extract address details
            JsonNode address = node.path("address");
            String city = address.path("city").asText(
                    address.path("town").asText(
                            address.path("village").asText("")));
            String state = address.path("state").asText("");
            String district = address.path("state_district").asText(
                    address.path("county").asText(""));

            return NominatimResult.builder()
                    .name(name)
                    .displayName(displayName)
                    .latitude(lat)
                    .longitude(lon)
                    .type(type)
                    .osmType(osmType)
                    .city(city)
                    .district(district)
                    .state(state)
                    .build();

        } catch (Exception e) {
            log.warn("Failed to parse Nominatim result: {}", e.getMessage());
            return null;
        }
    }

    private boolean isInTamilNadu(NominatimResult result) {
        if (result == null)
            return false;

        String state = result.getState();
        if (state != null) {
            String stateLower = state.toLowerCase();
            return stateLower.contains("tamil") || stateLower.contains("nadu");
        }

        // Fallback: check coordinates are within Tamil Nadu bounds
        // TN bounds: Lat 8.0-13.5, Lon 76.0-80.5
        double lat = result.getLatitude();
        double lon = result.getLongitude();
        return lat >= 8.0 && lat <= 13.5 && lon >= 76.0 && lon <= 80.5;
    }

    /**
     * Clear the cache (useful for testing)
     */
    public void clearCache() {
        cache.clear();
    }

    /**
     * Get cache size
     */
    public int getCacheSize() {
        return cache.size();
    }

    // ============================================
    // CIRCUIT BREAKER FALLBACK METHODS
    // ============================================

    /**
     * Fallback method when Nominatim circuit breaker is open.
     */
    @SuppressWarnings("unused")
    private Optional<NominatimResult> searchTamilNaduInternalFallback(String query, Throwable t) {
        log.warn("Nominatim circuit breaker triggered. Query: '{}', Error: {}", query, t.getMessage());
        // Check cache as fallback
        String normalizedQuery = query != null ? query.trim().toUpperCase() : "";
        if (cache.containsKey(normalizedQuery)) {
            log.info("Returning cached result for '{}' during circuit breaker open state", query);
            return Optional.ofNullable(cache.get(normalizedQuery));
        }
        return Optional.empty();
    }

    /**
     * Result from Nominatim search
     */
    @lombok.Data
    @lombok.Builder
    public static class NominatimResult implements GeocodingResult {
        private String name;
        private String displayName;
        private double latitude;
        private double longitude;
        private String type;
        private String osmType;
        private String city;
        private String district;
        private String state;

        /**
         * Get the canonical English name for this location
         */
        @Override
        public String getCanonicalName() {
            // Prefer city name, then the direct name
            if (city != null && !city.isEmpty()) {
                return city.toUpperCase().replaceAll("[^A-Z]", "");
            }
            if (name != null && !name.isEmpty()) {
                return name.toUpperCase().replaceAll("[^A-Z]", "");
            }
            return null;
        }

        @Override
        public String getDisplayName() {
            return displayName;
        }
    }
}
