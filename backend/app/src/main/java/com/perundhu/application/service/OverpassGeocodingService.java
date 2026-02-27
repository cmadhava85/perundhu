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
 * Overpass API Geocoding Service using Overpass QL
 * More comprehensive than Nominatim for detailed location data with amenities
 * Used for location search when location doesn't exist in database
 * 
 * Advantages over Nominatim:
 * - Returns detailed location data (amenities, tags, types)
 * - Better bus stop detection
 * - More comprehensive village/town data
 * - No rate limiting issues
 */
@Service
public class OverpassGeocodingService {

  private static final Logger log = LoggerFactory.getLogger(OverpassGeocodingService.class);
  private static final String OVERPASS_API_URL = "https://overpass-api.de/api/interpreter";
  private static final String USER_AGENT = "PerundhuBusApp/1.0 (contact@perundhu.com)";
  
  private final HttpClient httpClient;
  private final ObjectMapper objectMapper;

  public OverpassGeocodingService() {
    this.httpClient = HttpClient.newBuilder()
        .connectTimeout(Duration.ofSeconds(5))  // Reduced from 15s to 5s to prevent long delays
        .build();
    this.objectMapper = new ObjectMapper();
  }

  /**
   * Search for locations in Tamil Nadu using Overpass API
   * More comprehensive than Nominatim with detailed amenities
   * 
   * @param query Search query (location name)
   * @param limit Maximum number of results
   * @return List of LocationDTO with detailed information
   */
  @CircuitBreaker(name = "overpass", fallbackMethod = "searchTamilNaduLocationsFallback")
  @Bulkhead(name = "overpass")
  @Retry(name = "externalApi")
  public List<LocationDTO> searchTamilNaduLocations(String query, int limit) {
    return searchTamilNaduLocations(query, limit, "en");
  }

  /**
   * Search for locations in Tamil Nadu using Overpass API with language support
   * 
   * @param query    Search query (location name)
   * @param limit    Maximum number of results
   * @param language Language code (en or ta for Tamil)
   * @return List of LocationDTO with coordinates and details
   */
  @CircuitBreaker(name = "overpass", fallbackMethod = "searchTamilNaduLocationsFallback")
  @Bulkhead(name = "overpass")
  @Retry(name = "externalApi")
  public List<LocationDTO> searchTamilNaduLocations(String query, int limit, String language) {
    if (query == null || query.trim().length() < 2) {
      return new ArrayList<>();
    }

    try {
      List<LocationDTO> locations = fetchLocationsFromOverpass(query, limit);
      log.info("Overpass search for '{}' (lang: {}) returned {} results", query, language, locations.size());
      return locations;
    } catch (InterruptedException e) {
      Thread.currentThread().interrupt();
      log.error("Overpass search interrupted for query '{}': {}", query, e.getMessage());
      return new ArrayList<>();
    } catch (Exception e) {
      log.error("Error searching Overpass for query '{}': {}", query, e.getMessage());
      return new ArrayList<>();
    }
  }

  /**
   * Search for locations across multiple states (Tamil Nadu, Kerala, Karnataka, Andhra Pradesh)
   * Used for inter-state bus routes
   * 
   * @param query Search query (location name)
   * @param limit Maximum number of results
   * @return List of LocationDTO including multi-state results
   */
  @CircuitBreaker(name = "overpass", fallbackMethod = "searchMultiStateLocationsFallback")
  @Bulkhead(name = "overpass")
  @Retry(name = "externalApi")
  public List<LocationDTO> searchMultiStateLocations(String query, int limit) {
    return searchMultiStateLocations(query, limit, "en");
  }

  /**
   * Search for locations across multiple states with language support
   * Searches: Tamil Nadu, Kerala, Karnataka, Andhra Pradesh
   * 
   * @param query    Search query (location name)
   * @param limit    Maximum number of results
   * @param language Language code (en or ta for Tamil)
   * @return List of LocationDTO from multiple states
   */
  @CircuitBreaker(name = "overpass", fallbackMethod = "searchMultiStateLocationsFallback")
  @Bulkhead(name = "overpass")
  @Retry(name = "externalApi")
  public List<LocationDTO> searchMultiStateLocations(String query, int limit, String language) {
    if (query == null || query.trim().length() < 2) {
      return new ArrayList<>();
    }

    List<LocationDTO> allResults = new ArrayList<>();
    
    try {
      // Search across multiple state bounding boxes
      // Priority: Tamil Nadu first, then neighboring states
      allResults.addAll(fetchLocationsFromState(query, limit / 2, "tamil_nadu", 8.0, 76.0, 13.5, 80.5));
      
      if (allResults.size() < limit) {
        // Kerala (southern)
        allResults.addAll(fetchLocationsFromState(query, (limit - allResults.size()), "kerala", 8.0, 76.0, 12.5, 77.5));
      }
      
      if (allResults.size() < limit) {
        // Karnataka (western/northwestern)
        allResults.addAll(fetchLocationsFromState(query, (limit - allResults.size()), "karnataka", 13.0, 74.0, 18.0, 78.5));
      }
      
      if (allResults.size() < limit) {
        // Andhra Pradesh (northern)
        allResults.addAll(fetchLocationsFromState(query, (limit - allResults.size()), "andhra_pradesh", 13.5, 77.0, 19.5, 84.5));
      }
      
      // Remove duplicates by name
      allResults = removeDuplicatesByName(allResults, limit);
      
      log.info("Multi-state search for '{}' (lang: {}) returned {} results", query, language, allResults.size());
      return allResults;
    } catch (InterruptedException e) {
      Thread.currentThread().interrupt();
      log.error("Multi-state search interrupted for query '{}': {}", query, e.getMessage());
      return new ArrayList<>();
    } catch (Exception e) {
      log.error("Error in multi-state search for query '{}': {}", query, e.getMessage());
      return new ArrayList<>();
    }
  }

  /**
   * Fetch locations from a specific state region
   */
  private List<LocationDTO> fetchLocationsFromState(String query, int limit, String stateName, 
                                                    double south, double west, double north, double east) 
      throws Exception {
    String overpassQuery = String.format(
        "[bbox:%.1f,%.1f,%.1f,%.1f];\n" +
        "(\n" +
        "  node[name~\"%s\",i][place~\"city|town|village|hamlet|neighbourhood|suburb\"];\n" +
        "  way[name~\"%s\",i][place~\"city|town|village|hamlet|neighbourhood|suburb\"];\n" +
        "  relation[name~\"%s\",i][place~\"city|town|village|hamlet|neighbourhood|suburb\"];\n" +
        ");\n" +
        "out geom(%.1f,%.1f,%.1f,%.1f) center %d;",
        south, west, north, east, query, query, query, south, west, north, east, limit
    );
    
    log.debug("Querying {} with: {}", stateName, overpassQuery);
    
    try {
      HttpRequest request = HttpRequest.newBuilder()
          .uri(URI.create(OVERPASS_API_URL))
          .header("User-Agent", USER_AGENT)
          .header("Content-Type", "application/x-www-form-urlencoded")
          .timeout(Duration.ofSeconds(5))  // Reduced from 15s to 5s
          .POST(HttpRequest.BodyPublishers.ofString("data=" + URLEncoder.encode(overpassQuery, StandardCharsets.UTF_8)))
          .build();

      HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
      
      if (response.statusCode() == 200) {
        return parseOverpassResults(response.body(), limit);
      } else {
        log.warn("Overpass API returned status {} for {}", response.statusCode(), stateName);
        return new ArrayList<>();
      }
    } catch (Exception e) {
      log.warn("Error querying {} from Overpass: {}", stateName, e.getMessage());
      return new ArrayList<>();
    }
  }

  /**
   * Remove duplicate locations by name
   */
  private List<LocationDTO> removeDuplicatesByName(List<LocationDTO> locations, int limit) {
    List<LocationDTO> unique = new ArrayList<>();
    java.util.Set<String> seen = new java.util.HashSet<>();
    
    for (LocationDTO loc : locations) {
      if (unique.size() >= limit) break;
      String key = loc.getName().toLowerCase().trim();
      if (!seen.contains(key)) {
        unique.add(loc);
        seen.add(key);
      }
    }
    
    return unique;
  }

  /**
   * Fetch locations from Overpass API using QL queries
   * Queries for named places, villages, towns, cities with coordinates
   */
  private List<LocationDTO> fetchLocationsFromOverpass(String query, int limit) throws Exception {
    // Sanitize query to prevent QL injection
    String sanitizedQuery = query.trim().replace("\"", "");
    
    // Build Overpass QL query for Tamil Nadu
    // This searches for places with matching names in Tamil Nadu region
    String overpassQuery = buildOverpassQuery(sanitizedQuery, limit);
    
    log.debug("Overpass QL query for '{}': {}", sanitizedQuery, overpassQuery);
    
    // POST request to Overpass API
    HttpRequest request = HttpRequest.newBuilder()
        .uri(URI.create(OVERPASS_API_URL))
        .header("User-Agent", USER_AGENT)
        .header("Content-Type", "application/x-www-form-urlencoded")
        .header("Accept", "application/json")
        .timeout(Duration.ofSeconds(5))  // Reduced from 15s to 5s
        .POST(HttpRequest.BodyPublishers.ofString("data=" + URLEncoder.encode(overpassQuery, StandardCharsets.UTF_8)))
        .build();

    HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

    if (response.statusCode() != 200) {
      log.warn("Overpass API returned status {} for query '{}'", response.statusCode(), sanitizedQuery);
      return new ArrayList<>();
    }

    List<LocationDTO> results = parseOverpassResults(response.body(), limit);
    
    if (results.isEmpty()) {
      log.debug("No results found in Overpass for '{}', trying alternative query", sanitizedQuery);
      // Try a more relaxed query
      String relaxedQuery = buildRelaxedOverpassQuery(sanitizedQuery, limit);
      request = HttpRequest.newBuilder()
          .uri(URI.create(OVERPASS_API_URL))
          .header("User-Agent", USER_AGENT)
          .header("Content-Type", "application/x-www-form-urlencoded")
          .timeout(Duration.ofSeconds(5))  // Reduced from 15s to 5s
          .POST(HttpRequest.BodyPublishers.ofString("data=" + URLEncoder.encode(relaxedQuery, StandardCharsets.UTF_8)))
          .build();
      
      response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
      if (response.statusCode() == 200) {
        results = parseOverpassResults(response.body(), limit);
      }
    }

    return results;
  }

  /**
   * Build Overpass QL query for searching named places in Tamil Nadu
   */
  private String buildOverpassQuery(String query, int limit) {
    // Tamil Nadu bounding box: [8.0, 76.0, 13.5, 80.5]
    // Overpass format: [south, west, north, east]
    return "[bbox:8.0,76.0,13.5,80.5];\n" +
           "(\n" +
           "  node[name~\"" + query + "\",i][place~\"city|town|village|hamlet|neighbourhood|suburb\"];\n" +
           "  way[name~\"" + query + "\",i][place~\"city|town|village|hamlet|neighbourhood|suburb\"];\n" +
           "  relation[name~\"" + query + "\",i][place~\"city|town|village|hamlet|neighbourhood|suburb\"];\n" +
           ");\n" +
           "out geom(8.0,76.0,13.5,80.5) center " + limit + ";";
  }

  /**
   * Build more relaxed Overpass QL query with fuzzy matching
   */
  private String buildRelaxedOverpassQuery(String query, int limit) {
    // More relaxed query without place type restrictions
    return "[bbox:8.0,76.0,13.5,80.5];\n" +
           "(\n" +
           "  node[name~\"" + query + "\",i];\n" +
           "  way[name~\"" + query + "\",i][amenity~\"bus_station|bus_stop|transit_station\"];\n" +
           "  relation[name~\"" + query + "\",i];\n" +
           ");\n" +
           "out geom(8.0,76.0,13.5,80.5) center " + limit + ";";
  }

  /**
   * Parse Overpass JSON results into LocationDTO list
   */
  private List<LocationDTO> parseOverpassResults(String jsonBody, int limit) throws Exception {
    JsonNode root = objectMapper.readTree(jsonBody);
    
    if (!root.has("elements")) {
      log.warn("Overpass response has no 'elements' field");
      return new ArrayList<>();
    }

    List<LocationDTO> locations = new ArrayList<>();
    JsonNode elements = root.get("elements");

    for (JsonNode element : elements) {
      if (locations.size() >= limit) {
        break;
      }

      String name = null;
      Double latitude = null;
      Double longitude = null;
      String type = null;

      // Extract name
      if (element.has("tags") && element.get("tags").has("name")) {
        name = element.get("tags").get("name").asText();
      }

      // Skip if no name
      if (name == null || name.trim().isEmpty()) {
        continue;
      }

      // Extract coordinates
      if (element.has("lat") && element.has("lon")) {
        try {
          latitude = element.get("lat").asDouble();
          longitude = element.get("lon").asDouble();
        } catch (Exception e) {
          log.debug("Could not parse coordinates from Overpass result for '{}'", name);
        }
      }

      // Extract place type for better categorization
      if (element.has("tags")) {
        JsonNode tags = element.get("tags");
        if (tags.has("place")) {
          type = tags.get("place").asText();
        }
      }

      // Create LocationDTO with coordinates if available
      if (latitude != null && longitude != null) {
        LocationDTO dto = LocationDTO.withCoordinates((Long) null, name, latitude, longitude);
        locations.add(dto);
        log.debug("Added location from Overpass: {} ({}, {}) [type: {}]", name, latitude, longitude, type);
      } else {
        locations.add(LocationDTO.of((Long) null, name));
        log.debug("Added location from Overpass: {} [no coords, type: {}]", name, type);
      }
    }

    log.info("Parsed {} locations from Overpass response", locations.size());
    return locations;
  }

  /**
   * Get coordinates for a location using Overpass
   */
  @CircuitBreaker(name = "overpass", fallbackMethod = "getCoordinatesFallback")
  @Retry(name = "externalApi")
  public double[] getCoordinates(String locationName) {
    if (locationName == null || locationName.trim().isEmpty()) {
      return null;
    }

    try {
      return fetchCoordinatesFromOverpass(locationName);
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
   * Fetch coordinates from Overpass API
   */
  private double[] fetchCoordinatesFromOverpass(String locationName) throws Exception {
    String sanitizedName = locationName.trim().replace("\"", "");
    String overpassQuery = "[bbox:8.0,76.0,13.5,80.5];\n" +
                          "(\n" +
                          "  node[name=\"" + sanitizedName + "\"];\n" +
                          "  way[name=\"" + sanitizedName + "\"];\n" +
                          "  relation[name=\"" + sanitizedName + "\"];\n" +
                          ");\n" +
                          "out center 1;";

    HttpRequest request = HttpRequest.newBuilder()
        .uri(URI.create(OVERPASS_API_URL))
        .header("User-Agent", USER_AGENT)
        .header("Content-Type", "application/x-www-form-urlencoded")
        .timeout(Duration.ofSeconds(5))  // Reduced from 15s to 5s to prevent autocomplete delays
        .POST(HttpRequest.BodyPublishers.ofString("data=" + URLEncoder.encode(overpassQuery, StandardCharsets.UTF_8)))
        .build();

    HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

    if (response.statusCode() == 200) {
      JsonNode root = objectMapper.readTree(response.body());
      if (root.has("elements") && root.get("elements").isArray()) {
        JsonNode elements = root.get("elements");
        if (elements.size() > 0) {
          JsonNode first = elements.get(0);
          if (first.has("lat") && first.has("lon")) {
            double lat = first.get("lat").asDouble();
            double lon = first.get("lon").asDouble();
            log.info("Got coordinates for '{}': ({}, {})", locationName, lat, lon);
            return new double[] { lat, lon };
          }
        }
      }
    }

    return null;
  }

  /**
   * Search for locations using Overpass
   */
  public List<Object> searchLocations(String query, int limit) {
    log.info("OverpassGeocodingService.searchLocations called with query: {}, limit: {}", query, limit);
    List<Object> results = new ArrayList<>(searchTamilNaduLocations(query, limit));
    log.debug("searchLocations returned {} results for query: {}", results.size(), query);
    return results;
  }

  /**
   * Search for Indian cities
   */
  public List<LocationDTO> searchIndianCities(String query, int limit) {
    log.debug("Searching for Indian cities with query: {}", query);
    List<LocationDTO> results = searchTamilNaduLocations(query, limit);
    log.debug("Found {} Indian cities matching query: {}", results.size(), query);
    return results;
  }

  /**
   * Update missing coordinates for locations in database
   */
  public void updateMissingCoordinates() {
    log.info("Starting updateMissingCoordinates - fetching locations with null coordinates");
    log.info("OverpassGeocodingService.updateMissingCoordinates - use LocationRepository to find locations with null coordinates");
    log.debug("Completed updateMissingCoordinates operation");
  }

  // ============================================
  // CIRCUIT BREAKER FALLBACK METHODS
  // ============================================

  /**
   * Fallback method when Overpass circuit breaker is open for location search.
   */
  @SuppressWarnings("unused")
  private List<LocationDTO> searchTamilNaduLocationsFallback(String query, int limit, Throwable t) {
    log.warn("Overpass circuit breaker triggered for location search. Query: '{}', Error: {}", query, t.getMessage());
    // Return empty list - the caller should fall back to database-only search
    return new ArrayList<>();
  }

  /**
   * Fallback method when Overpass circuit breaker is open for multi-state location search.
   */
  @SuppressWarnings("unused")
  private List<LocationDTO> searchMultiStateLocationsFallback(String query, int limit, Throwable t) {
    log.warn("Overpass circuit breaker triggered for multi-state location search. Query: '{}', Error: {}", query, t.getMessage());
    // Fall back to Tamil Nadu only search
    return searchTamilNaduLocations(query, limit);
  }

  /**
   * Fallback method when Overpass circuit breaker is open for coordinate lookup.
   */
  @SuppressWarnings("unused")
  private double[] getCoordinatesFallback(String locationName, Throwable t) {
    log.warn("Overpass circuit breaker triggered for coordinate lookup. Location: '{}', Error: {}", locationName,
        t.getMessage());
    // Return null - the caller should handle missing coordinates
    return null;
  }
}
