package com.perundhu.adapter.in.rest;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.perundhu.application.dto.LocationDTO;
import com.perundhu.application.dto.LocationGroupDTO;
import com.perundhu.application.service.BusScheduleService;
import com.perundhu.application.service.OpenStreetMapGeocodingService;
import com.perundhu.domain.model.Location;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;

/**
 * REST API Controller for location-related operations.
 * Extracted from BusScheduleController for better separation of concerns.
 */
@RestController
@RequestMapping("/api/v1/locations")

@Tag(name = "Locations", description = "Location search and autocomplete operations")
public class LocationController {

  private static final Logger log = LoggerFactory.getLogger(LocationController.class);

  private final BusScheduleService busScheduleService;
  private final OpenStreetMapGeocodingService geocodingService;

  public LocationController(
      BusScheduleService busScheduleService,
      OpenStreetMapGeocodingService geocodingService) {
    this.busScheduleService = busScheduleService;
    this.geocodingService = geocodingService;
  }

  /**
   * Get all locations with language support
   */
  @Operation(summary = "Get all locations", description = "Retrieves all locations in the system with optional language translation")
  @ApiResponses({
      @ApiResponse(responseCode = "200", description = "Locations retrieved successfully", content = @Content(schema = @Schema(implementation = LocationDTO.class))),
      @ApiResponse(responseCode = "500", description = "Internal server error")
  })
  @GetMapping
  public ResponseEntity<List<LocationDTO>> getAllLocations(
      @Parameter(description = "Language code (en, ta)") @RequestParam(name = "lang", defaultValue = "en") String language) {
    log.info("Getting all locations with language: {}", language);
    try {
      List<LocationDTO> locations = busScheduleService.getAllLocations(language);
      log.info("Found {} locations", locations != null ? locations.size() : 0);
      return ResponseEntity.ok(locations);
    } catch (Exception e) {
      log.error("Error getting all locations", e);
      return ResponseEntity.internalServerError().build();
    }
  }

  /**
   * Autocomplete endpoint for location search with Tamil/English support
   */
  @Operation(summary = "Location autocomplete", description = """
      Search for locations with autocomplete support.
      Supports both Tamil and English queries.
      Falls back to OpenStreetMap if location not found in database.
      """)
  @ApiResponses({
      @ApiResponse(responseCode = "200", description = "Locations found", content = @Content(schema = @Schema(implementation = LocationDTO.class))),
      @ApiResponse(responseCode = "400", description = "Query too short (minimum 2 characters)"),
      @ApiResponse(responseCode = "500", description = "Internal server error")
  })
  @GetMapping("/autocomplete")
  public ResponseEntity<List<LocationDTO>> getLocationAutocomplete(
      @Parameter(description = "Search query (minimum 2 characters)", required = true) @RequestParam("q") String query,
      @Parameter(description = "Language code (en, ta)") @RequestParam(defaultValue = "en") String language) {
    log.info("Location autocomplete search: '{}' with language: {}", query, language);

    if (query == null || query.trim().length() < 2) {
      log.warn("Query too short for autocomplete: '{}'", query);
      return ResponseEntity.badRequest().build();
    }

    try {
      List<Location> locations = busScheduleService.searchLocationsByName(query.trim());

      if (!locations.isEmpty()) {
        List<LocationDTO> result = locations.stream()
            .map(location -> {
              String englishName = location.name();
              String displayName = englishName;
              String translatedName = englishName;

              if ("ta".equals(language)) {
                String tamilName = busScheduleService.getLocationTranslation(
                    location.id().value(), "ta");
                if (tamilName != null && !tamilName.isEmpty()) {
                  translatedName = tamilName;
                  displayName = tamilName;
                }
              }

              return LocationDTO.withTranslation(
                  location.id().value(),
                  englishName,
                  translatedName,
                  null, null);
            })
            .toList();

        log.info("Found {} locations in database for query '{}'", result.size(), query);
        return ResponseEntity.ok(result);
      }

      log.info("No locations in database for '{}', falling back to OpenStreetMap", query);
      List<LocationDTO> osmResults = geocodingService.searchTamilNaduLocations(query.trim(), 10, language);
      log.info("Found {} locations from OpenStreetMap for query '{}' in language '{}'", osmResults.size(), query, language);
      return ResponseEntity.ok(osmResults);

    } catch (Exception e) {
      log.error("Error in location autocomplete search for query: '{}'", query, e);
      return ResponseEntity.internalServerError().build();
    }
  }

  /**
   * Get locations with disambiguation info for duplicate names
   */
  @Operation(summary = "Get locations with disambiguation", description = "Returns locations with district/nearby city info for places with duplicate names")
  @ApiResponses({
      @ApiResponse(responseCode = "200", description = "Locations retrieved successfully"),
      @ApiResponse(responseCode = "500", description = "Internal server error")
  })
  @GetMapping("/with-disambiguation")
  public ResponseEntity<List<LocationDTO>> getLocationsWithDisambiguation(
      @Parameter(description = "Language code (en, ta)") @RequestParam(name = "lang", defaultValue = "en") String lang) {
    log.info("Getting locations with disambiguation info, lang: {}", lang);

    try {
      List<LocationDTO> locations = busScheduleService.getAllLocations(lang);

      Map<String, List<LocationDTO>> byName = new HashMap<>();
      for (LocationDTO loc : locations) {
        byName.computeIfAbsent(loc.getName(), k -> new ArrayList<>()).add(loc);
      }

      List<LocationDTO> result = new ArrayList<>();
      for (LocationDTO loc : locations) {
        List<LocationDTO> sameName = byName.get(loc.getName());
        if (sameName != null && sameName.size() > 1) {
          result.add(LocationDTO.withDistrict(
              loc.getId(), loc.getName(), loc.getTranslatedName(),
              loc.getLatitude(), loc.getLongitude(),
              loc.getDistrict(), loc.getNearbyCity()));
        } else {
          result.add(loc);
        }
      }

      return ResponseEntity.ok(result);
    } catch (Exception e) {
      log.error("Error getting locations with disambiguation", e);
      return ResponseEntity.internalServerError().build();
    }
  }

  /**
   * Grouped location autocomplete - returns results grouped by city with variants
   * Perfect for handling multiple location variants like "Salem", "Salem - New Bus Stand", "Salem - Old Bus Stand"
   */
  @Operation(summary = "Grouped location autocomplete", description = """
      Search for locations with results grouped by city/base name.
      Groups city options, bus stands, and neighborhoods together.
      Provides better UX when there are multiple variants of the same city.
      Example: "Salem" returns {cityOption: Salem, busStands: [Salem New Bus Stand, Salem Old Bus Stand]}
      """)
  @ApiResponses({
      @ApiResponse(responseCode = "200", description = "Grouped locations found", content = @Content(schema = @Schema(implementation = LocationGroupDTO.class))),
      @ApiResponse(responseCode = "400", description = "Query too short (minimum 2 characters)"),
      @ApiResponse(responseCode = "500", description = "Internal server error")
  })
  @GetMapping("/autocomplete-grouped")
  public ResponseEntity<List<LocationGroupDTO>> getLocationAutocompleteGrouped(
      @Parameter(description = "Search query (minimum 2 characters)", required = true) @RequestParam("q") String query,
      @Parameter(description = "Language code (en, ta)") @RequestParam(defaultValue = "en") String language) {
    log.info("Grouped location autocomplete search: '{}' with language: {}", query, language);

    if (query == null || query.trim().length() < 2) {
      log.warn("Query too short for grouped autocomplete: '{}'", query);
      return ResponseEntity.badRequest().build();
    }

    try {
      List<LocationGroupDTO> groupedResults = busScheduleService.searchLocationsGrouped(query.trim(), language);
      log.info("Grouped location search for '{}' returned {} groups (language: {})", 
               query, groupedResults.size(), language);
      return ResponseEntity.ok(groupedResults);
    } catch (Exception e) {
      log.error("Error in grouped location autocomplete search for query: '{}'", query, e);
      return ResponseEntity.internalServerError().build();
    }
  }

  /**
   * Get locations with disambiguation info for duplicate names
   */

  /**
   * Search for neighborhoods and localities (e.g., Adyar, Besant Nagar, T. Nagar)
   * This endpoint directly queries OpenStreetMap Nominatim API for neighborhood-level locations
   * within Tamil Nadu. Perfect for city-specific neighborhoods and localities.
   */
  @Operation(summary = "Search neighborhoods and localities", description = """
      Search for neighborhoods, localities, and suburbs within Tamil Nadu.
      Supports queries like: Adyar, Besant Nagar, T. Nagar, Kodambakkam, etc.
      Returns results from OpenStreetMap with full coordinates for mapping.
      """)
  @ApiResponses({
      @ApiResponse(responseCode = "200", description = "Neighborhoods found", content = @Content(schema = @Schema(implementation = LocationDTO.class))),
      @ApiResponse(responseCode = "400", description = "Query too short (minimum 2 characters)"),
      @ApiResponse(responseCode = "500", description = "Internal server error")
  })
  @GetMapping("/neighborhoods")
  public ResponseEntity<List<LocationDTO>> searchNeighborhoods(
      @Parameter(description = "Neighborhood/locality name (minimum 2 characters)", required = true) @RequestParam("q") String query,
      @Parameter(description = "City name to narrow search (e.g., Chennai, Madurai)", required = false) @RequestParam(required = false) String city,
      @Parameter(description = "Language code (en, ta)") @RequestParam(defaultValue = "en") String language) {
    
    log.info("Neighborhood search: query='{}', city='{}', language='{}'", query, city, language);

    if (query == null || query.trim().length() < 2) {
      log.warn("Query too short for neighborhood search: '{}'", query);
      return ResponseEntity.badRequest().build();
    }

    try {
      // Build search query with city context if provided
      String searchQuery = query.trim();
      if (city != null && !city.isBlank()) {
        searchQuery = searchQuery + ", " + city.trim();
      }

      List<LocationDTO> neighborhoods = geocodingService.searchTamilNaduLocations(searchQuery, 15, language);
      log.info("Found {} neighborhoods for query '{}'", neighborhoods.size(), query);
      return ResponseEntity.ok(neighborhoods);
    } catch (Exception e) {
      log.error("Error in neighborhood search for query: '{}', city: '{}'", query, city, e);
      return ResponseEntity.internalServerError().build();
    }
  }

  /**
   * Search locations with neighborhood-aware autocomplete
   * Combines database locations with neighborhood-level OSM results
   */
  @Operation(summary = "Neighborhood-aware location search", description = """
      Search for both database locations and OSM neighborhoods.
      Falls back to neighborhood search if exact location not found in database.
      Perfect for finding neighborhoods within cities.
      """)
  @ApiResponses({
      @ApiResponse(responseCode = "200", description = "Locations found"),
      @ApiResponse(responseCode = "400", description = "Query too short"),
      @ApiResponse(responseCode = "500", description = "Internal server error")
  })
  @GetMapping("/search-comprehensive")
  public ResponseEntity<List<LocationDTO>> searchComprehensive(
      @Parameter(description = "Search query", required = true) @RequestParam("q") String query,
      @Parameter(description = "Language code (en, ta)") @RequestParam(defaultValue = "en") String language) {
    
    log.info("Comprehensive location search: query='{}', language='{}'", query, language);

    if (query == null || query.trim().length() < 2) {
      return ResponseEntity.badRequest().build();
    }

    try {
      List<Location> dbLocations = busScheduleService.searchLocationsByName(query.trim());
      List<LocationDTO> locations = dbLocations.stream()
          .map(location -> LocationDTO.of(location.id().value(), location.name()))
          .toList();
      
      // If no exact matches in database, search OSM for neighborhoods
      if (locations.isEmpty()) {
        log.info("No database locations found for '{}', searching OSM for neighborhoods", query);
        try {
          // Call OSM with a timeout - if it fails, return empty to let frontend fallback to client-side Nominatim
          List<LocationDTO> osmResults = geocodingService.searchTamilNaduLocations(query.trim(), 20, language);
          log.info("Found {} OSM results (neighborhoods/localities) for '{}'", osmResults.size(), query);
          return ResponseEntity.ok(osmResults);
        } catch (Exception osmError) {
          log.warn("OSM search failed for '{}', returning empty to trigger client-side fallback: {}", query, osmError.getMessage());
          // Return empty list to trigger client-side Nominatim fallback
          return ResponseEntity.ok(new ArrayList<>());
        }
      }

      // Enhance database results with OSM neighborhood results
      List<LocationDTO> allResults = new ArrayList<>(locations);
      try {
        List<LocationDTO> osmResults = geocodingService.searchTamilNaduLocations(query.trim(), 10, language);
        
        // Add OSM results that don't duplicate database results
        for (LocationDTO osmResult : osmResults) {
          boolean isDuplicate = allResults.stream()
              .anyMatch(dbLoc -> dbLoc.getName().equalsIgnoreCase(osmResult.getName()));
          if (!isDuplicate) {
            allResults.add(osmResult);
          }
        }
      } catch (Exception osmError) {
        log.warn("OSM enhancement failed for '{}', using database results only: {}", query, osmError.getMessage());
        // Just use database results if OSM fails
      }

      log.info("Comprehensive search found {} total results for '{}'", allResults.size(), query);
      return ResponseEntity.ok(allResults);
    } catch (Exception e) {
      log.error("Error in comprehensive search for query: '{}'", query, e);
      // Return empty list instead of error to allow client-side fallback
      return ResponseEntity.ok(new ArrayList<>());
    }
  }

  /**
   * Update coordinates for locations using geocoding
   */
  @Operation(summary = "Update location coordinates", description = "Updates coordinates for locations that are missing them using OpenStreetMap geocoding service")
  @ApiResponses({
      @ApiResponse(responseCode = "200", description = "Coordinates updated successfully"),
      @ApiResponse(responseCode = "500", description = "Internal server error")
  })
  @PostMapping("/update-coordinates")
  public ResponseEntity<Map<String, Object>> updateLocationCoordinates() {
    log.info("Starting location coordinate update via OpenStreetMap");
    try {
      geocodingService.updateMissingCoordinates();
      Map<String, Object> result = new HashMap<>();
      result.put("status", "success");
      result.put("message", "Coordinate update process completed");
      result.put("timestamp", System.currentTimeMillis());
      return ResponseEntity.ok(result);
    } catch (Exception e) {
      log.error("Error updating location coordinates", e);
      return ResponseEntity.internalServerError().build();
    }
  }
}
