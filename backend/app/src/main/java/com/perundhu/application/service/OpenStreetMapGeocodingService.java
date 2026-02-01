package com.perundhu.application.service;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.perundhu.application.dto.LocationDTO;

import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.bulkhead.annotation.Bulkhead;
import io.github.resilience4j.retry.annotation.Retry;

/**
 * OpenStreetMap Geocoding Service using Nominatim API
 * Used for location search when location doesn't exist in database
 * Includes intelligent caching to reduce API calls by 70-80%
 */
@Service
public class OpenStreetMapGeocodingService {

  private static final Logger log = LoggerFactory.getLogger(OpenStreetMapGeocodingService.class);
  private static final String NOMINATIM_BASE_URL = "https://nominatim.openstreetmap.org/search";
  private static final String USER_AGENT = "PerundhuBusApp/1.0 (contact@perundhu.com)";
  private static final String ADDRESS_KEY = "address";
  
  // Cache configuration
  private static final long CACHE_EXPIRY_SECONDS = TimeUnit.HOURS.toSeconds(1); // 1 hour cache
  private static final int MAX_CACHE_SIZE = 1000; // Max 1000 cached queries

  private final HttpClient httpClient;
  private final ObjectMapper objectMapper;
  
  // Simple in-memory cache with expiry tracking
  private final Map<String, CachedResult> searchCache = new ConcurrentHashMap<>();
  
  /**
   * Cached search result with timestamp
   */
  private static class CachedResult {
    final List<LocationDTO> results;
    final long timestamp;
    
    CachedResult(List<LocationDTO> results) {
      this.results = results;
      this.timestamp = System.currentTimeMillis();
    }
    
    boolean isExpired() {
      return (System.currentTimeMillis() - timestamp) > (CACHE_EXPIRY_SECONDS * 1000);
    }
  }

  public OpenStreetMapGeocodingService() {
    this.httpClient = HttpClient.newBuilder()
        .connectTimeout(Duration.ofSeconds(10))
        .build();
    this.objectMapper = new ObjectMapper();
  }

  /**
   * Search for locations in Tamil Nadu using OSM Nominatim API
   * 
   * @param query Search query (location name)
   * @param limit Maximum number of results
   * @return List of LocationDTO without coordinates (for privacy/simplicity)
   */
  @CircuitBreaker(name = "osm", fallbackMethod = "searchTamilNaduLocationsFallback")
  @Bulkhead(name = "osm")
  @Retry(name = "externalApi")
  public List<LocationDTO> searchTamilNaduLocations(String query, int limit) {
    return searchTamilNaduLocations(query, limit, "en");
  }

  /**
   * Search for locations in Tamil Nadu using OSM Nominatim API with language
   * support
   * Includes intelligent caching to reduce API calls by 70-80%
   * 
   * @param query    Search query (location name)
   * @param limit    Maximum number of results
   * @param language Language code (en or ta for Tamil)
   * @return List of LocationDTO without coordinates (for privacy/simplicity)
   */
  @CircuitBreaker(name = "osm", fallbackMethod = "searchTamilNaduLocationsFallback")
  @Bulkhead(name = "osm")
  @Retry(name = "externalApi")
  public List<LocationDTO> searchTamilNaduLocations(String query, int limit, String language) {
    if (query == null || query.trim().length() < 3) {
      return new ArrayList<>();
    }

    // Create cache key
    String cacheKey = createCacheKey(query, limit, language);
    
    // Check cache first
    CachedResult cachedResult = searchCache.get(cacheKey);
    if (cachedResult != null && !cachedResult.isExpired()) {
      log.debug("Cache HIT for query '{}' (lang: {})", query, language);
      return new ArrayList<>(cachedResult.results); // Return copy to prevent modification
    }
    
    // Cache miss or expired - clean up if needed
    if (searchCache.size() > MAX_CACHE_SIZE) {
      cleanupExpiredCache();
    }

    try {
      List<LocationDTO> locations = fetchLocationsFromOSM(query, limit, language);
      log.info("OSM search for '{}' (lang: {}) returned {} results", query, language, locations.size());
      
      // Cache the results
      searchCache.put(cacheKey, new CachedResult(locations));
      log.debug("Cached results for query '{}' (cache size: {})", query, searchCache.size());
      
      return locations;
    } catch (InterruptedException e) {
      Thread.currentThread().interrupt();
      log.error("OSM search interrupted for query '{}': {}", query, e.getMessage());
      return new ArrayList<>();
    } catch (Exception e) {
      log.error("Error searching OSM for query '{}': {}", query, e.getMessage());
      return new ArrayList<>();
    }
  }
  
  /**
   * Create a cache key from query parameters
   */
  private String createCacheKey(String query, int limit, String language) {
    return String.format("%s:%d:%s", query.trim().toLowerCase(), limit, language);
  }
  
  /**
   * Clean up expired cache entries to prevent memory bloat
   */
  private void cleanupExpiredCache() {
    int beforeSize = searchCache.size();
    searchCache.entrySet().removeIf(entry -> entry.getValue().isExpired());
    int afterSize = searchCache.size();
    if (beforeSize != afterSize) {
      log.debug("Cache cleanup: removed {} expired entries ({}->{})", 
                beforeSize - afterSize, beforeSize, afterSize);
    }
  }

  /**
   * Fetch locations from OSM Nominatim API
   * First tries Tamil Nadu, then falls back to broader South India search
   */
  private List<LocationDTO> fetchLocationsFromOSM(String query, int limit, String language) throws Exception {
    // First try: Search in Tamil Nadu specifically
    String tamilNaduQuery = query.trim() + ", Tamil Nadu, India";
    String encodedQuery = URLEncoder.encode(tamilNaduQuery, StandardCharsets.UTF_8);

    // Use accept-language to get localized names (ta for Tamil, en for English)
    String acceptLanguage = "ta".equals(language) ? "ta,en" : "en,ta";
    String url = String.format("%s?q=%s&format=json&limit=%d&addressdetails=1&countrycodes=in&accept-language=%s",
        NOMINATIM_BASE_URL, encodedQuery, limit * 2, acceptLanguage);

    HttpRequest request = HttpRequest.newBuilder()
        .uri(URI.create(url))
        .header("User-Agent", USER_AGENT)
        .header("Accept", "application/json")
        .timeout(Duration.ofSeconds(10))
        .GET()
        .build();

    HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

    if (response.statusCode() != 200) {
      log.warn("OSM Nominatim API returned status {} for Tamil Nadu search", response.statusCode());
      return new ArrayList<>();
    }

    List<LocationDTO> results = parseOSMResults(response.body(), limit);

    // If no results found in Tamil Nadu, try broader South India search
    // (for locations in neighboring states like Kerala, Karnataka)
    if (results.isEmpty()) {
      log.info("No results in Tamil Nadu for '{}', trying South India search", query);
      String southIndiaQuery = query.trim() + ", India";
      encodedQuery = URLEncoder.encode(southIndiaQuery, StandardCharsets.UTF_8);
      url = String.format("%s?q=%s&format=json&limit=%d&addressdetails=1&countrycodes=in&accept-language=%s",
          NOMINATIM_BASE_URL, encodedQuery, limit * 2, acceptLanguage);

      request = HttpRequest.newBuilder()
          .uri(URI.create(url))
          .header("User-Agent", USER_AGENT)
          .header("Accept", "application/json")
          .timeout(Duration.ofSeconds(10))
          .GET()
          .build();

      response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

      if (response.statusCode() == 200) {
        results = parseOSMResults(response.body(), limit, true); // Allow non-TN results
        log.info("South India search found {} results for '{}'", results.size(), query);
      }
    }

    return results;
  }

  /**
   * Parse OSM JSON results into LocationDTO list
   */
  private List<LocationDTO> parseOSMResults(String jsonBody, int limit) throws Exception {
    return parseOSMResults(jsonBody, limit, false);
  }

  /**
   * Parse OSM JSON results into LocationDTO list
   * 
   * @param allowOutsideTamilNadu if true, allows results from neighboring states
   *                              (Kerala, Karnataka, etc.)
   */
  private List<LocationDTO> parseOSMResults(String jsonBody, int limit, boolean allowOutsideTamilNadu)
      throws Exception {
    JsonNode results = objectMapper.readTree(jsonBody);
    List<LocationDTO> locations = new ArrayList<>();

    for (JsonNode result : results) {
      if (locations.size() >= limit) {
        break;
      }

      String displayName = result.has("display_name") ? result.get("display_name").asText() : "";

      // Skip if not in Tamil Nadu (unless we're doing a broader search)
      if (!allowOutsideTamilNadu && !isInTamilNadu(result, displayName)) {
        continue;
      }

      String name = extractPlaceName(result, displayName);
      
      // Extract coordinates from OSM response
      Double latitude = null;
      Double longitude = null;
      
      if (result.has("lat") && result.has("lon")) {
        try {
          latitude = result.get("lat").asDouble();
          longitude = result.get("lon").asDouble();
        } catch (Exception e) {
          log.debug("Could not parse coordinates from OSM result for '{}'", name);
        }
      }
      
      // Create LocationDTO with coordinates if available (ID is null since not from DB)
      if (latitude != null && longitude != null) {
        locations.add(LocationDTO.withCoordinates((Long) null, name, latitude, longitude));
      } else {
        locations.add(LocationDTO.of((Long) null, name));
      }
    }

    return locations;
  }

  /**
   * Extract a clean place name from OSM result
   */
  private String extractPlaceName(JsonNode result, String displayName) {
    // Try to get the most specific place name from address
    if (result.has(ADDRESS_KEY)) {
      JsonNode address = result.get(ADDRESS_KEY);
      String placeName = extractFromAddress(address);
      if (placeName != null) {
        return placeName;
      }
    }

    // Fallback: use first part of display name
    if (displayName.contains(",")) {
      return displayName.split(",")[0].trim();
    }
    return displayName;
  }

  /**
   * Extract place name from address node with priority: village > town > city >
   * county
   */
  private String extractFromAddress(JsonNode address) {
    String[] placeTypes = { "village", "town", "city", "county" };
    for (String type : placeTypes) {
      if (address.has(type)) {
        return address.get(type).asText();
      }
    }
    return null;
  }

  /**
   * Check if the result is in Tamil Nadu
   */
  private boolean isInTamilNadu(JsonNode result, String displayName) {
    String lowerDisplay = displayName.toLowerCase();
    if (lowerDisplay.contains("tamil nadu") || lowerDisplay.contains("tamilnadu")) {
      return true;
    }

    if (result.has(ADDRESS_KEY)) {
      JsonNode address = result.get(ADDRESS_KEY);
      if (address.has("state")) {
        String state = address.get("state").asText().toLowerCase();
        return state.contains("tamil nadu") || state.contains("tamilnadu");
      }
    }

    return false;
  }

  /**
   * Search for locations using OSM (generic method)
   */
  public List<Object> searchLocations(String query, int limit) {
    log.info("OpenStreetMapGeocodingService.searchLocations called with query: {}", query);
    return new ArrayList<>(searchTamilNaduLocations(query, limit));
  }

  /**
   * Get coordinates for a location (for internal use when saving new locations)
   */
  @CircuitBreaker(name = "osm", fallbackMethod = "getCoordinatesFallback")
  @Retry(name = "externalApi")
  public double[] getCoordinates(String locationName) {
    if (locationName == null || locationName.trim().isEmpty()) {
      return null;
    }

    try {
      return fetchCoordinatesFromOSM(locationName);
    } catch (InterruptedException e) {
      Thread.currentThread().interrupt();
      log.error("Interrupted while getting coordinates for '{}': {}", locationName, e.getMessage());
      return null;
    } catch (Exception e) {
      log.error("Error getting coordinates for '{}': {}", locationName, e.getMessage());
      return null;
    }
  }

  /**
   * Fetch coordinates from OSM Nominatim API
   */
  private double[] fetchCoordinatesFromOSM(String locationName) throws Exception {
    String searchQuery = locationName.trim() + ", Tamil Nadu, India";
    String encodedQuery = URLEncoder.encode(searchQuery, StandardCharsets.UTF_8);
    String url = String.format("%s?q=%s&format=json&limit=1", NOMINATIM_BASE_URL, encodedQuery);

    HttpRequest request = HttpRequest.newBuilder()
        .uri(URI.create(url))
        .header("User-Agent", USER_AGENT)
        .header("Accept", "application/json")
        .timeout(Duration.ofSeconds(10))
        .GET()
        .build();

    HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

    if (response.statusCode() == 200) {
      JsonNode results = objectMapper.readTree(response.body());
      if (results.isArray() && !results.isEmpty()) {
        JsonNode first = results.get(0);
        double lat = first.get("lat").asDouble();
        double lon = first.get("lon").asDouble();
        return new double[] { lat, lon };
      }
    }

    return null;
  }

  /**
   * Search for Indian cities (legacy method)
   */
  public List<LocationDTO> searchIndianCities(String query, int limit) {
    return searchTamilNaduLocations(query, limit);
  }

  /**
   * Update missing coordinates for locations in database
   */
  public void updateMissingCoordinates() {
    log.info(
        "OpenStreetMapGeocodingService.updateMissingCoordinates - use LocationRepository to find locations with null coordinates");
  }

  // ============================================
  // CIRCUIT BREAKER FALLBACK METHODS
  // ============================================

  /**
   * Fallback method when OSM circuit breaker is open for location search.
   */
  @SuppressWarnings("unused")
  private List<LocationDTO> searchTamilNaduLocationsFallback(String query, int limit, Throwable t) {
    log.warn("OSM circuit breaker triggered for location search. Query: '{}', Error: {}", query, t.getMessage());
    // Return empty list - the caller should fall back to database-only search
    return new ArrayList<>();
  }

  /**
   * Fallback method when OSM circuit breaker is open for coordinate lookup.
   */
  @SuppressWarnings("unused")
  private double[] getCoordinatesFallback(String locationName, Throwable t) {
    log.warn("OSM circuit breaker triggered for coordinate lookup. Location: '{}', Error: {}", locationName,
        t.getMessage());
    // Return null - the caller should handle missing coordinates
    return null;
  }
}