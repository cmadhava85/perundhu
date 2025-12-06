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

import lombok.extern.slf4j.Slf4j;

/**
 * Client for OpenStreetMap Nominatim API for geocoding location names.
 * Used to resolve unknown city/town names to standardized names and
 * coordinates.
 * 
 * Rate limit: 1 request per second (Nominatim usage policy)
 * Results are cached to minimize API calls.
 */
@Component
@Slf4j
public class NominatimClient implements GeocodingPort {

    private static final String NOMINATIM_BASE_URL = "https://nominatim.openstreetmap.org/search";
    private static final Duration REQUEST_TIMEOUT = Duration.ofSeconds(10);
    private static final long RATE_LIMIT_MS = 1100; // 1.1 seconds between requests

    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;
    private final ConcurrentHashMap<String, NominatimResult> cache;
    private long lastRequestTime = 0;

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
     * Internal search method that returns NominatimResult
     */
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

        try {
            // Rate limiting
            synchronized (this) {
                long now = System.currentTimeMillis();
                long elapsed = now - lastRequestTime;
                if (elapsed < RATE_LIMIT_MS) {
                    Thread.sleep(RATE_LIMIT_MS - elapsed);
                }
                lastRequestTime = System.currentTimeMillis();
            }

            // Build the search URL - restrict to Tamil Nadu, India
            String searchQuery = query + ", Tamil Nadu, India";
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

            log.debug("Nominatim search: {}", query);
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 200) {
                JsonNode results = objectMapper.readTree(response.body());

                if (results.isArray() && results.size() > 0) {
                    // Find the best match (prefer cities/towns over other types)
                    for (JsonNode result : results) {
                        NominatimResult parsed = parseResult(result);
                        if (parsed != null && isInTamilNadu(parsed)) {
                            cache.put(normalizedQuery, parsed);
                            log.info("Nominatim resolved '{}' to '{}'", query, parsed.getDisplayName());
                            return Optional.of(parsed);
                        }
                    }
                }
            } else {
                log.warn("Nominatim returned status {}: {}", response.statusCode(), response.body());
            }

        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            log.warn("Nominatim request interrupted for: {}", query);
        } catch (Exception e) {
            log.error("Nominatim search failed for '{}': {}", query, e.getMessage());
        }

        // Cache negative result to avoid repeated lookups
        cache.put(normalizedQuery, null);
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
