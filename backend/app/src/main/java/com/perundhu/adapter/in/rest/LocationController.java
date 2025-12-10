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
@CrossOrigin(origins = "*")
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
      List<LocationDTO> osmResults = geocodingService.searchTamilNaduLocations(query.trim(), 10);
      log.info("Found {} locations from OpenStreetMap for query '{}'", osmResults.size(), query);
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
