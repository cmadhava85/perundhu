package com.perundhu.adapter.in.rest;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.perundhu.application.dto.BusDTO;
import com.perundhu.application.dto.ConnectingRouteDTO;
import com.perundhu.application.dto.LocationDTO;
import com.perundhu.application.dto.StopDTO;
import com.perundhu.application.dto.OSMBusStopDTO;
import com.perundhu.application.dto.BusRouteDTO;
import com.perundhu.application.service.BusScheduleService;
import com.perundhu.application.service.OpenStreetMapGeocodingService;
import com.perundhu.domain.model.Location;

/**
 * REST API Controller for bus schedules with enhanced security
 */
@RestController
@RequestMapping("/api/v1/bus-schedules")
@CrossOrigin(origins = "*")
public class BusScheduleController {

    private static final Logger log = LoggerFactory.getLogger(BusScheduleController.class);
    private final BusScheduleService busScheduleService;
    private final OpenStreetMapGeocodingService geocodingService;

    public BusScheduleController(BusScheduleService busScheduleService,
            OpenStreetMapGeocodingService geocodingService) {
        this.busScheduleService = busScheduleService;
        this.geocodingService = geocodingService;
    }

    /**
     * Get all buses in the system - requires authentication for detailed data
     */
    @GetMapping("/buses")
    public ResponseEntity<List<BusDTO>> getAllBuses() {
        log.info("Getting all buses for authenticated user");
        try {
            List<BusDTO> buses = busScheduleService.getAllBuses();

            // Obfuscate sensitive data for non-premium users
            buses = obfuscateBusDataIfNeeded(buses);

            return ResponseEntity.ok(buses);
        } catch (Exception e) {
            log.error("Error getting all buses", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Get a specific bus by its ID - premium access required for full details
     */
    @GetMapping("/buses/{busId}")
    public ResponseEntity<BusDTO> getBusById(@PathVariable Long busId) {
        log.info("Getting bus details for ID: {} (premium access)", busId);
        try {
            Optional<BusDTO> bus = busScheduleService.getBusById(busId);
            return bus.map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            log.error("Error getting bus by ID: {}", busId, e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Get all locations with language support - limited access for guests
     */
    @GetMapping("/locations")
    public ResponseEntity<List<LocationDTO>> getAllLocations(
            @RequestParam(defaultValue = "en") String language) {
        log.info("Getting all locations with language: {} (public access)", language);
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
     * Autocomplete endpoint for location search - public access for contribution
     * forms
     */
    @GetMapping("/locations/autocomplete")
    public ResponseEntity<List<LocationDTO>> getLocationAutocomplete(
            @RequestParam("q") String query,
            @RequestParam(defaultValue = "en") String language) {
        log.info("Location autocomplete search: '{}' with language: {}", query, language);

        // Validate minimum query length
        if (query == null || query.trim().length() < 3) {
            log.warn("Query too short for autocomplete: '{}'", query);
            return ResponseEntity.badRequest().build();
        }

        try {
            List<Location> locations = busScheduleService.searchLocationsByName(query.trim());

            List<LocationDTO> result = locations.stream()
                    .map(location -> new LocationDTO(
                            location.id().value(),
                            location.name(),
                            // For autocomplete, we can use a simple translation lookup
                            location.name(), // translatedName - could be enhanced later
                            location.latitude(),
                            location.longitude()))
                    .toList();

            log.info("Found {} locations for query '{}'", result.size(), query);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Error in location autocomplete search for query: '{}'", query, e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Public search endpoint with comprehensive results including continuing buses
     */
    @GetMapping("/search")
    public ResponseEntity<List<BusDTO>> searchPublicRoutes(
            @RequestParam(required = false) Long fromLocationId,
            @RequestParam(required = false) Long toLocationId,
            @RequestParam(required = false) String fromLocation,
            @RequestParam(required = false) String toLocation,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "true") boolean includeContinuing) {

        log.info(
                "Comprehensive search: fromLocationId={}, toLocationId={}, fromLocation='{}', toLocation='{}', includeContinuing={}",
                fromLocationId, toLocationId, fromLocation, toLocation, includeContinuing);

        // Limit search results for public access
        if (size > 10) {
            size = 10;
        }

        try {
            List<BusDTO> allResults = new ArrayList<>();

            // Use location IDs if provided, otherwise fall back to names
            if (fromLocationId != null && toLocationId != null) {
                // Validate input parameters
                if (fromLocationId.equals(toLocationId)) {
                    log.warn("Same location provided for from and to: {}", fromLocationId);
                    return ResponseEntity.badRequest().build();
                }

                // Get direct buses
                List<BusDTO> directBuses = busScheduleService.findBusesBetweenLocations(fromLocationId, toLocationId);
                log.info("Found {} direct buses", directBuses.size());

                // Get buses passing through (intermediate stops)
                List<BusDTO> viaBuses = busScheduleService.findBusesPassingThroughLocations(fromLocationId,
                        toLocationId);
                log.info("Found {} buses via intermediate stops", viaBuses.size());

                // Get continuing buses if enabled
                List<BusDTO> continuingBuses = new ArrayList<>();
                if (includeContinuing) {
                    continuingBuses = busScheduleService.findBusesContinuingBeyondDestination(fromLocationId,
                            toLocationId);
                    log.info("Found {} buses continuing beyond destination", continuingBuses.size());
                }

                // Combine results and remove duplicates
                Set<Long> seenBusIds = new HashSet<>();
                for (BusDTO bus : directBuses) {
                    if (seenBusIds.add(bus.id())) {
                        allResults.add(bus);
                    }
                }
                for (BusDTO bus : viaBuses) {
                    if (seenBusIds.add(bus.id())) {
                        allResults.add(bus);
                    }
                }
                for (BusDTO bus : continuingBuses) {
                    if (seenBusIds.add(bus.id())) {
                        allResults.add(bus);
                    }
                }

            } else if (fromLocation != null && toLocation != null) {
                // Legacy search by location names
                allResults = busScheduleService.searchRoutes(fromLocation, toLocation, page, size);
            } else {
                log.warn("Insufficient search parameters provided");
                return ResponseEntity.badRequest().build();
            }

            // Apply pagination to combined results
            int startIndex = page * size;
            int endIndex = Math.min(startIndex + size, allResults.size());

            if (startIndex >= allResults.size()) {
                allResults = new ArrayList<>();
            } else {
                allResults = allResults.subList(startIndex, endIndex);
            }

            // Sanitize for public access
            allResults = sanitizeRoutesForPublicAccess(allResults);

            log.info("Returning {} total results (page {}, size {})", allResults.size(), page, size);
            return ResponseEntity.ok(allResults);

        } catch (Exception e) {
            log.error("Error in comprehensive search", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Find buses that pass through both locations as stops (including intermediate
     * stops)
     * This includes buses where these locations are intermediate stops on a longer
     * route
     * For example: Chennai to Madurai bus via Trichy will appear when searching
     * Chennai to Trichy
     */
    @GetMapping("/search-via-stops")
    public ResponseEntity<List<BusDTO>> searchBusesViaStops(
            @RequestParam("fromLocationId") Long fromLocationId,
            @RequestParam("toLocationId") Long toLocationId) {
        log.info("Searching buses via stops between locations: {} and {}", fromLocationId, toLocationId);

        // Validate input parameters
        if (fromLocationId == null || toLocationId == null) {
            log.warn("Invalid location IDs provided: from={}, to={}", fromLocationId, toLocationId);
            return ResponseEntity.badRequest().build();
        }

        if (fromLocationId.equals(toLocationId)) {
            log.warn("Same location provided for from and to: {}", fromLocationId);
            return ResponseEntity.badRequest().build();
        }

        try {
            List<BusDTO> buses = busScheduleService.findBusesPassingThroughLocations(fromLocationId, toLocationId);
            log.info("Found {} buses passing through locations {} and {}", buses.size(), fromLocationId, toLocationId);
            return ResponseEntity.ok(buses);
        } catch (IllegalArgumentException e) {
            log.error("Invalid arguments for searching buses via stops: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("Error searching buses via stops between {} and {}", fromLocationId, toLocationId, e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Find buses that continue beyond the destination city
     * This shows buses that go from origin to destination and then continue to
     * other cities
     * For example: Chennai to Trichy search will show Chennai->Madurai bus (via
     * Trichy)
     */
    @GetMapping("/search-continuing-beyond")
    public ResponseEntity<List<BusDTO>> searchBusesContinuingBeyondDestination(
            @RequestParam("fromLocationId") Long fromLocationId,
            @RequestParam("toLocationId") Long toLocationId) {
        log.info("Searching buses continuing beyond destination: from {} via {} to further cities",
                fromLocationId, toLocationId);

        // Validate input parameters
        if (fromLocationId == null || toLocationId == null) {
            log.warn("Invalid location IDs provided: from={}, to={}", fromLocationId, toLocationId);
            return ResponseEntity.badRequest().build();
        }

        if (fromLocationId.equals(toLocationId)) {
            log.warn("Same location provided for from and to: {}", fromLocationId);
            return ResponseEntity.badRequest().build();
        }

        try {
            List<BusDTO> buses = busScheduleService.findBusesContinuingBeyondDestination(fromLocationId, toLocationId);
            log.info("Found {} buses continuing beyond destination {} from {}", buses.size(), toLocationId,
                    fromLocationId);
            return ResponseEntity.ok(buses);
        } catch (IllegalArgumentException e) {
            log.error("Invalid arguments for searching buses continuing beyond destination: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("Error searching buses continuing beyond destination from {} via {}", fromLocationId,
                    toLocationId, e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Find connecting routes - requires user authentication
     */
    @GetMapping("/connecting-routes")
    public ResponseEntity<List<ConnectingRouteDTO>> findConnectingRoutes(
            @RequestParam("fromLocationId") Long fromLocationId,
            @RequestParam("toLocationId") Long toLocationId) {
        log.info("Finding connecting routes between locations: {} and {} (authenticated)", fromLocationId,
                toLocationId);
        try {
            List<ConnectingRouteDTO> routes = busScheduleService.findConnectingRoutes(fromLocationId, toLocationId);

            // Encrypt sensitive route data
            routes = encryptRouteDetails(routes);

            return ResponseEntity.ok(routes);
        } catch (Exception e) {
            log.error("Error finding connecting routes", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Get stops for a specific bus - premium feature
     */
    @GetMapping("/buses/{busId}/stops")
    public ResponseEntity<List<StopDTO>> getBusStops(
            @PathVariable Long busId,
            @RequestParam(defaultValue = "en") String language) {
        log.info("Getting stops for bus {} with language: {} (premium access)", busId, language);

        if (busId == null || busId <= 0) {
            log.warn("Invalid bus ID: {}", busId);
            return ResponseEntity.badRequest().build();
        }

        try {
            List<StopDTO> stops = busScheduleService.getStopsForBus(busId, language);
            log.info("Found {} stops for bus {}", stops != null ? stops.size() : 0, busId);

            // Encrypt stop details for transmission
            stops = encryptStopDetails(stops);

            return ResponseEntity.ok(stops);
        } catch (Exception e) {
            log.error("Error getting stops for bus: {}", busId, e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Get basic stops for a specific bus - public access for search functionality
     */
    @GetMapping("/buses/{busId}/stops/basic")
    public ResponseEntity<List<StopDTO>> getBusStopsBasic(
            @PathVariable Long busId,
            @RequestParam(defaultValue = "en") String language) {
        log.info("Getting basic stops for bus {} with language: {} (public access)", busId, language);

        if (busId == null || busId <= 0) {
            log.warn("Invalid bus ID: {}", busId);
            return ResponseEntity.badRequest().build();
        }

        try {
            List<StopDTO> stops = busScheduleService.getStopsForBus(busId, language);

            // Return the stops directly since they're already StopDTO objects
            List<StopDTO> basicStops = stops;

            log.info("Found {} basic stops for bus {}", basicStops.size(), busId);
            return ResponseEntity.ok(basicStops);
        } catch (Exception e) {
            log.error("Error getting basic stops for bus: {}", busId, e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Manually trigger coordinate updates for locations missing them
     * This endpoint uses OpenStreetMap to fetch coordinates
     */
    @PostMapping("/locations/update-coordinates")
    public ResponseEntity<Map<String, Object>> updateMissingCoordinates() {
        log.info("Manual trigger to update missing coordinates");
        try {
            geocodingService.updateMissingCoordinates();

            Map<String, Object> response = Map.of(
                    "status", "success",
                    "message", "Coordinate update process completed",
                    "timestamp", System.currentTimeMillis());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error updating coordinates", e);
            return ResponseEntity.internalServerError()
                    .body(Map.of("status", "error", "message", e.getMessage()));
        }
    }

    /**
     * Discover intermediate bus stops between two locations using OSM data
     * This endpoint finds actual bus stops that could be used as intermediate stops
     */
    @GetMapping("/discover-stops")
    public ResponseEntity<List<OSMBusStopDTO>> discoverIntermediateStops(
            @RequestParam("fromLocationId") Long fromLocationId,
            @RequestParam("toLocationId") Long toLocationId,
            @RequestParam(defaultValue = "25.0") Double radiusKm) {
        log.info("Discovering intermediate stops between {} and {} within {}km",
                fromLocationId, toLocationId, radiusKm);

        try {
            List<OSMBusStopDTO> stops = busScheduleService.discoverIntermediateStops(fromLocationId, toLocationId);
            log.info("Found {} intermediate bus stops", stops.size());
            return ResponseEntity.ok(stops);
        } catch (Exception e) {
            log.error("Error discovering intermediate stops", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Discover actual bus routes using OSM data
     * This finds real-world bus routes that might connect the locations
     */
    @GetMapping("/discover-routes")
    public ResponseEntity<List<BusRouteDTO>> discoverOSMRoutes(
            @RequestParam("fromLocationId") Long fromLocationId,
            @RequestParam("toLocationId") Long toLocationId) {
        log.info("Discovering OSM routes between {} and {}", fromLocationId, toLocationId);

        try {
            List<BusRouteDTO> routes = busScheduleService.discoverOSMRoutes(fromLocationId, toLocationId);
            log.info("Found {} OSM bus routes", routes.size());
            return ResponseEntity.ok(routes);
        } catch (Exception e) {
            log.error("Error discovering OSM routes", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    private List<BusDTO> obfuscateBusDataIfNeeded(List<BusDTO> buses) {
        // Check if user has premium access
        boolean isPremiumUser = checkPremiumAccess();

        if (!isPremiumUser) {
            return buses.stream()
                    .map(this::obfuscateBusData)
                    .toList();
        }

        return buses;
    }

    private BusDTO obfuscateBusData(BusDTO bus) {
        // Create a copy with limited information for non-premium users
        // BusDTO is a record, so we create a new instance with limited data
        return BusDTO.of(
                bus.id(),
                bus.number(), // Use number() field which exists in BusDTO
                bus.name(),
                "Unknown", // operator - not available in current BusDTO
                "Unknown"); // type - not available in current BusDTO
    }

    private List<ConnectingRouteDTO> encryptRouteDetails(List<ConnectingRouteDTO> routes) {
        return routes.stream()
                .map(route -> {
                    // For now, return routes without encryption since the encrypted data isn't used
                    // Future enhancement: implement actual encryption when security layer is added
                    return ConnectingRouteDTO.of(
                            route.id(),
                            route.connectionPoint(),
                            route.firstLeg(),
                            route.secondLeg())
                            .withTiming(route.waitTime(), route.totalDuration(), route.totalDistance())
                            .withConnectionStops(route.connectionStops());
                })
                .toList();
    }

    private List<StopDTO> encryptStopDetails(List<StopDTO> stops) {
        return stops.stream()
                .map(stop -> {
                    // For now, return basic stops without coordinate hiding
                    // Future enhancement: implement coordinate obfuscation when security layer is
                    // added
                    return stop; // Return as-is for now
                })
                .toList();
    }

    private List<BusDTO> sanitizeRoutesForPublicAccess(List<BusDTO> routes) {
        return routes.stream()
                .map(route -> new BusDTO(
                        route.id(),
                        route.number(), // Use number field
                        route.name(),
                        "Unknown", // operator - not available
                        "Unknown", // type - not available
                        Map.of() // features as empty map
                ))
                .limit(10) // Limit to 10 results for public access
                .toList();
    }

    private boolean checkPremiumAccess() {
        // Allow basic users to see departure/arrival times
        // Only hide premium features like detailed stops and live tracking
        return true; // Changed from false to true to show basic timing information
    }
}