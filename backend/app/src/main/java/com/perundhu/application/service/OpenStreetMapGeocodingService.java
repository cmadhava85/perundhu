package com.perundhu.application.service;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Pattern;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.perundhu.application.dto.LocationDTO;
import com.perundhu.domain.model.Location;
import com.perundhu.domain.port.LocationRepository;

/**
 * Enhanced service for geocoding locations using OpenStreetMap Nominatim API
 * Now supports all Indian cities with improved city name formatting
 */
@Service
public class OpenStreetMapGeocodingService {

  private static final Logger log = LoggerFactory.getLogger(OpenStreetMapGeocodingService.class);
  private static final String NOMINATIM_BASE_URL = "https://nominatim.openstreetmap.org/search";

  // Enhanced patterns for better city name extraction
  private static final Pattern EXCLUDE_TERMS = Pattern.compile(
      "\\b(bus stand|railway station|bus stop|junction|depot|terminal|station|road|street|area|sector|phase|extension|circle|flyover|bridge)\\b",
      Pattern.CASE_INSENSITIVE);

  private static final Pattern STATE_COUNTRY = Pattern.compile(
      "\\b(india|bharat|tamil nadu|karnataka|kerala|andhra pradesh|telangana|maharashtra|gujarat|rajasthan|madhya pradesh|uttar pradesh|bihar|west bengal|odisha|punjab|haryana|himachal pradesh|uttarakhand|jharkhand|chhattisgarh|assam|meghalaya|manipur|mizoram|nagaland|tripura|sikkim|arunachal pradesh|goa|delhi|jammu and kashmir|ladakh|chandigarh|puducherry|andaman and nicobar islands|dadra and nagar haveli|daman and diu|lakshadweep)\\b",
      Pattern.CASE_INSENSITIVE);

  private final LocationRepository locationRepository;
  private final RestTemplate restTemplate;
  private final ObjectMapper objectMapper;

  public OpenStreetMapGeocodingService(LocationRepository locationRepository, RestTemplate restTemplate) {
    this.locationRepository = locationRepository;
    this.restTemplate = restTemplate;
    this.objectMapper = new ObjectMapper();
  }

  /**
   * Search for cities across India using OpenStreetMap
   * Returns clean city names without street/road details
   * PRIORITIZES TAMIL NADU cities first, then other Indian cities
   */
  public List<LocationDTO> searchIndianCities(String query, int limit) {
    List<LocationDTO> results = new ArrayList<>();

    if (query == null || query.trim().length() < 2) {
      return results;
    }

    try {
      // PRIORITY 1: Search specifically in Tamil Nadu first
      List<LocationDTO> tnResults = searchInTamilNadu(query, limit);
      results.addAll(tnResults);

      log.info("Found {} Tamil Nadu results for '{}'", tnResults.size(), query);

      // PRIORITY 2: If we don't have enough results, search other Indian states
      if (results.size() < limit) {
        List<LocationDTO> otherResults = searchInOtherStates(query, limit - results.size());
        results.addAll(otherResults);

        log.info("Added {} other Indian state results for '{}'", otherResults.size(), query);
      }

    } catch (Exception e) {
      log.error("Error searching Indian cities for query: {}", query, e);
    }

    return results;
  }

  /**
   * Search specifically in Tamil Nadu with highest priority
   */
  private List<LocationDTO> searchInTamilNadu(String query, int limit) {
    List<LocationDTO> results = new ArrayList<>();

    try {
      // Enhanced search queries specifically for Tamil Nadu
      String[] tnSearchVariations = {
          query + ", Tamil Nadu, India",
          query + " city, Tamil Nadu, India",
          query + " town, Tamil Nadu, India",
          query + ", TN, India"
      };

      for (String searchQuery : tnSearchVariations) {
        String url = String.format(
            "%s?q=%s&format=json&limit=%d&countrycodes=in&addressdetails=1&extratags=1&namedetails=1&bounded=1&viewbox=76.0,8.0,81.0,13.5",
            NOMINATIM_BASE_URL,
            URLEncoder.encode(searchQuery, StandardCharsets.UTF_8),
            Math.min(limit, 10));

        log.debug("Searching Tamil Nadu for: {}", searchQuery);

        String response = restTemplate.getForObject(url, String.class);

        if (response != null && !response.trim().equals("[]")) {
          JsonNode jsonArray = objectMapper.readTree(response);

          for (JsonNode result : jsonArray) {
            LocationDTO locationDTO = processNominatimResult(result);
            if (locationDTO != null && isInTamilNadu(locationDTO)) {
              results.add(locationDTO);

              if (results.size() >= limit) {
                return results;
              }
            }
          }
        }

        // Rate limiting - respect Nominatim's terms
        Thread.sleep(1000);

        if (results.size() >= limit) {
          break;
        }
      }

    } catch (Exception e) {
      log.error("Error searching Tamil Nadu cities for query: {}", query, e);
    }

    return results;
  }

  /**
   * Search in other Indian states (lower priority)
   */
  private List<LocationDTO> searchInOtherStates(String query, int limit) {
    List<LocationDTO> results = new ArrayList<>();

    try {
      // Search in major neighboring states first, then all India
      String[] otherStateVariations = {
          query + ", Karnataka, India",
          query + ", Kerala, India",
          query + ", Andhra Pradesh, India",
          query + ", India"
      };

      for (String searchQuery : otherStateVariations) {
        String url = String.format("%s?q=%s&format=json&limit=%d&countrycodes=in&addressdetails=1&extratags=1",
            NOMINATIM_BASE_URL,
            URLEncoder.encode(searchQuery, StandardCharsets.UTF_8),
            Math.min(limit, 5)); // Lower limit for non-TN results

        log.debug("Searching other states for: {}", searchQuery);

        String response = restTemplate.getForObject(url, String.class);

        if (response != null && !response.trim().equals("[]")) {
          JsonNode jsonArray = objectMapper.readTree(response);

          for (JsonNode result : jsonArray) {
            LocationDTO locationDTO = processNominatimResult(result);
            if (locationDTO != null && isValidIndianCity(locationDTO) && !isInTamilNadu(locationDTO)) {
              results.add(locationDTO);

              if (results.size() >= limit) {
                return results;
              }
            }
          }
        }

        // Rate limiting
        Thread.sleep(1000);

        if (results.size() >= limit) {
          break;
        }
      }

    } catch (Exception e) {
      log.error("Error searching other Indian states for query: {}", query, e);
    }

    return results;
  }

  /**
   * Check if location is specifically in Tamil Nadu
   */
  private boolean isInTamilNadu(LocationDTO location) {
    double lat = location.getLatitude();
    double lon = location.getLongitude();

    // Tamil Nadu approximate bounds
    return lat >= 8.0 && lat <= 13.5 && lon >= 76.0 && lon <= 81.0;
  }

  /**
   * Process a single Nominatim result and extract clean city information
   */
  private LocationDTO processNominatimResult(JsonNode result) {
    try {
      double latitude = result.get("lat").asDouble();
      double longitude = result.get("lon").asDouble();
      String displayName = result.get("display_name").asText();
      String type = result.has("type") ? result.get("type").asText() : "";
      String addressType = result.has("addresstype") ? result.get("addresstype").asText() : "";

      // Extract clean city name
      String cleanCityName = extractCleanCityName(displayName, type, addressType);

      if (cleanCityName != null && cleanCityName.length() > 1) {
        return new LocationDTO(
            System.currentTimeMillis(), // Temporary ID for external results
            cleanCityName,
            cleanCityName, // translatedName same as name for now
            latitude,
            longitude);
      }

    } catch (Exception e) {
      log.debug("Error processing Nominatim result: {}", e.getMessage());
    }

    return null;
  }

  /**
   * Extract clean city name from OpenStreetMap display name
   * Removes street names, roads, and other non-city identifiers
   */
  private String extractCleanCityName(String displayName, String type, String addressType) {
    if (displayName == null || displayName.trim().isEmpty()) {
      return null;
    }

    log.debug("Extracting city name from: {} (type: {}, addresstype: {})", displayName, type, addressType);

    // Split by comma and process each part
    String[] parts = displayName.split(",");

    for (String part : parts) {
      String cleanPart = part.trim();

      // Skip empty parts
      if (cleanPart.isEmpty())
        continue;

      // Skip parts that contain excluded terms
      if (EXCLUDE_TERMS.matcher(cleanPart).find())
        continue;

      // Skip state and country names
      if (STATE_COUNTRY.matcher(cleanPart).find())
        continue;

      // Skip postal codes
      if (cleanPart.matches("\\d{5,6}"))
        continue;

      // Skip very short parts (likely abbreviations)
      if (cleanPart.length() < 3)
        continue;

      // Clean up common prefixes/suffixes
      cleanPart = cleanPart.replaceAll("\\b(new|old|north|south|east|west)\\s+", "")
          .replaceAll("\\s+(district|taluk|block|mandal)$", "")
          .trim();

      // If this looks like a valid city name, return it
      if (cleanPart.length() >= 3 && !cleanPart.matches("\\d+")) {
        log.debug("Extracted city name: {}", cleanPart);
        return cleanPart;
      }
    }

    // Fallback: return first non-excluded part
    for (String part : parts) {
      String cleanPart = part.trim();
      if (cleanPart.length() >= 3 && !EXCLUDE_TERMS.matcher(cleanPart).find()) {
        return cleanPart;
      }
    }

    return null;
  }

  /**
   * Validate if the location is a valid Indian city
   */
  private boolean isValidIndianCity(LocationDTO location) {
    // Check if coordinates are within India bounds (approximate)
    double lat = location.getLatitude();
    double lon = location.getLongitude();

    return lat >= 6.0 && lat <= 37.0 && lon >= 68.0 && lon <= 97.0;
  }

  /**
   * Update coordinates for all locations that don't have them
   */
  public void updateMissingCoordinates() {
    log.info("Starting to update missing coordinates for locations");

    List<Location> locationsWithoutCoordinates = locationRepository.findAll()
        .stream()
        .filter(location -> location.getLatitude() == null || location.getLongitude() == null)
        .toList();

    log.info("Found {} locations without coordinates", locationsWithoutCoordinates.size());

    for (Location location : locationsWithoutCoordinates) {
      try {
        updateLocationCoordinates(location);
        // Add delay to respect rate limits
        Thread.sleep(1000);
      } catch (Exception e) {
        log.error("Failed to update coordinates for location: {}", location.getName(), e);
      }
    }

    log.info("Finished updating coordinates");
  }

  /**
   * Update coordinates for a specific location
   */
  public void updateLocationCoordinates(Location location) {
    if (location.getLatitude() != null && location.getLongitude() != null) {
      log.debug("Location {} already has coordinates", location.getName());
      return;
    }

    try {
      String searchQuery = buildSearchQuery(location.getName());
      String url = String.format("%s?q=%s&format=json&limit=1&countrycodes=in&addressdetails=1",
          NOMINATIM_BASE_URL, URLEncoder.encode(searchQuery, StandardCharsets.UTF_8));

      log.debug("Fetching coordinates for location: {} using query: {}", location.getName(), searchQuery);

      String response = restTemplate.getForObject(url, String.class);

      if (response != null && !response.trim().equals("[]")) {
        JsonNode jsonArray = objectMapper.readTree(response);
        if (jsonArray.isArray() && jsonArray.size() > 0) {
          JsonNode firstResult = jsonArray.get(0);

          double latitude = firstResult.get("lat").asDouble();
          double longitude = firstResult.get("lon").asDouble();
          String displayName = firstResult.get("display_name").asText();

          // Validate coordinates are in India (expanded bounds)
          if (isInIndia(latitude, longitude)) {
            Location updatedLocation = new Location(
                location.getId(),
                location.getName(),
                latitude,
                longitude);

            locationRepository.save(updatedLocation);
            log.info("Updated coordinates for {}: lat={}, lon={}, source='{}'",
                location.getName(), latitude, longitude, displayName);
          } else {
            log.warn("Coordinates for {} are outside India bounds: lat={}, lon={}",
                location.getName(), latitude, longitude);
          }
        }
      } else {
        log.warn("No coordinates found for location: {}", location.getName());
      }

    } catch (Exception e) {
      log.error("Error fetching coordinates for location: {}", location.getName(), e);
    }
  }

  /**
   * Build search query with India context
   */
  private String buildSearchQuery(String locationName) {
    // Add India context to improve search accuracy for all Indian cities
    return locationName + ", India";
  }

  /**
   * Check if coordinates are within India bounds (expanded from Tamil Nadu only)
   */
  private boolean isInIndia(double latitude, double longitude) {
    // Approximate bounds for India (including all states)
    return latitude >= 6.0 && latitude <= 37.0 &&
        longitude >= 68.0 && longitude <= 97.0;
  }

  /**
   * Fetch coordinates for a single location by name
   */
  public CoordinateResult fetchCoordinates(String locationName) {
    try {
      String searchQuery = buildSearchQuery(locationName);
      String url = String.format("%s?q=%s&format=json&limit=1&countrycodes=in&addressdetails=1",
          NOMINATIM_BASE_URL, URLEncoder.encode(searchQuery, StandardCharsets.UTF_8));

      String response = restTemplate.getForObject(url, String.class);

      if (response != null && !response.trim().equals("[]")) {
        JsonNode jsonArray = objectMapper.readTree(response);
        if (jsonArray.isArray() && jsonArray.size() > 0) {
          JsonNode firstResult = jsonArray.get(0);

          double latitude = firstResult.get("lat").asDouble();
          double longitude = firstResult.get("lon").asDouble();
          String displayName = firstResult.get("display_name").asText();

          if (isInIndia(latitude, longitude)) {
            return new CoordinateResult(latitude, longitude, displayName, true);
          }
        }
      }

      return new CoordinateResult(null, null, null, false);

    } catch (Exception e) {
      log.error("Error fetching coordinates for: {}", locationName, e);
      return new CoordinateResult(null, null, null, false);
    }
  }

  /**
   * Result class for coordinate fetching
   */
  public static class CoordinateResult {
    private final Double latitude;
    private final Double longitude;
    private final String displayName;
    private final boolean found;

    public CoordinateResult(Double latitude, Double longitude, String displayName, boolean found) {
      this.latitude = latitude;
      this.longitude = longitude;
      this.displayName = displayName;
      this.found = found;
    }

    public Double getLatitude() {
      return latitude;
    }

    public Double getLongitude() {
      return longitude;
    }

    public String getDisplayName() {
      return displayName;
    }

    public boolean isFound() {
      return found;
    }
  }
}