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

/**
 * OpenStreetMap Geocoding Service using Nominatim API
 * Used for location search when location doesn't exist in database
 */
@Service
public class OpenStreetMapGeocodingService {

  private static final Logger log = LoggerFactory.getLogger(OpenStreetMapGeocodingService.class);
  private static final String NOMINATIM_BASE_URL = "https://nominatim.openstreetmap.org/search";
  private static final String USER_AGENT = "PerundhuBusApp/1.0 (contact@perundhu.com)";
  private static final String ADDRESS_KEY = "address";

  private final HttpClient httpClient;
  private final ObjectMapper objectMapper;

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
  public List<LocationDTO> searchTamilNaduLocations(String query, int limit) {
    if (query == null || query.trim().length() < 3) {
      return new ArrayList<>();
    }

    try {
      List<LocationDTO> locations = fetchLocationsFromOSM(query, limit);
      log.info("OSM search for '{}' returned {} results", query, locations.size());
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
   * Fetch locations from OSM Nominatim API
   */
  private List<LocationDTO> fetchLocationsFromOSM(String query, int limit) throws Exception {
    // Build the Nominatim API URL - restrict to Tamil Nadu, India
    String searchQuery = query.trim() + ", Tamil Nadu, India";
    String encodedQuery = URLEncoder.encode(searchQuery, StandardCharsets.UTF_8);
    String url = String.format("%s?q=%s&format=json&limit=%d&addressdetails=1&countrycodes=in",
        NOMINATIM_BASE_URL, encodedQuery, limit * 2); // Fetch more to filter

    HttpRequest request = HttpRequest.newBuilder()
        .uri(URI.create(url))
        .header("User-Agent", USER_AGENT)
        .header("Accept", "application/json")
        .timeout(Duration.ofSeconds(10))
        .GET()
        .build();

    HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

    if (response.statusCode() != 200) {
      log.warn("OSM Nominatim API returned status {}", response.statusCode());
      return new ArrayList<>();
    }

    return parseOSMResults(response.body(), limit);
  }

  /**
   * Parse OSM JSON results into LocationDTO list
   */
  private List<LocationDTO> parseOSMResults(String jsonBody, int limit) throws Exception {
    JsonNode results = objectMapper.readTree(jsonBody);
    List<LocationDTO> locations = new ArrayList<>();

    for (JsonNode result : results) {
      if (locations.size() >= limit) {
        break;
      }

      String displayName = result.has("display_name") ? result.get("display_name").asText() : "";

      // Skip if not in Tamil Nadu
      if (!isInTamilNadu(result, displayName)) {
        continue;
      }

      String name = extractPlaceName(result, displayName);
      // Create LocationDTO without coordinates for search display (ID is null since
      // not from DB)
      locations.add(LocationDTO.of((Long) null, name));
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
}