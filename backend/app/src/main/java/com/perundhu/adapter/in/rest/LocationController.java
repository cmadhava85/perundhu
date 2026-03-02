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
@RequestMapping("/v1/locations")

@Tag(name = "Locations", description = "Location search and autocomplete operations")
public class LocationController {

  private static final Logger log = LoggerFactory.getLogger(LocationController.class);

  private final BusScheduleService busScheduleService;

  public LocationController(BusScheduleService busScheduleService) {
    this.busScheduleService = busScheduleService;
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
      // Note: OpenStreetMap fallback disabled - only returning database results
      // Users can still type their own locations in the frontend
      return ResponseEntity.ok(result);

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
   * Perfect for handling multiple location variants like "Salem", "Salem - New
   * Bus Stand", "Salem - Old Bus Stand"
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
}
