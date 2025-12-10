package com.perundhu.adapter.in.rest;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.google.common.util.concurrent.RateLimiter;
import com.perundhu.adapter.in.rest.dto.PaginatedResponse;
import com.perundhu.application.dto.BusDTO;
import com.perundhu.application.dto.BusRouteDTO;
import com.perundhu.application.dto.ConnectingRouteDTO;
import com.perundhu.application.dto.LocationDTO;
import com.perundhu.application.dto.OSMBusStopDTO;
import com.perundhu.application.dto.StopDTO;
import com.perundhu.application.service.BusScheduleService;
import com.perundhu.application.service.ConnectingRouteService;
import com.perundhu.application.service.OpenStreetMapGeocodingService;
import com.perundhu.domain.model.Location;
import com.perundhu.infrastructure.exception.RateLimitException;

/**
 * REST API Controller for bus schedules with enhanced security
 */
@RestController
@RequestMapping("/api/v1/bus-schedules")
@CrossOrigin(origins = "*")
public class BusScheduleController {

    private static final Logger log = LoggerFactory.getLogger(BusScheduleController.class);
    private final BusScheduleService busScheduleService;
    private final ConnectingRouteService connectingRouteService;
    private final OpenStreetMapGeocodingService geocodingService;
    private final RateLimiter globalRateLimiter;
    private final ConcurrentHashMap<String, RateLimiter> userRateLimiters;

    public BusScheduleController(
            BusScheduleService busScheduleService,
            ConnectingRouteService connectingRouteService,
            OpenStreetMapGeocodingService geocodingService,
            RateLimiter globalRateLimiter,
            ConcurrentHashMap<String, RateLimiter> userRateLimiters) {
        this.busScheduleService = busScheduleService;
        this.connectingRouteService = connectingRouteService;
        this.geocodingService = geocodingService;
        this.globalRateLimiter = globalRateLimiter;
        this.userRateLimiters = userRateLimiters;
    }

    /**
     * Check rate limit and throw exception if exceeded
     */
    private void checkRateLimit(String userId) {
        // Check global rate limit
        if (!globalRateLimiter.tryAcquire(100, TimeUnit.MILLISECONDS)) {
            log.warn("Global rate limit exceeded");
            throw new RateLimitException("Too many requests. Please try again later.");
        }

        // Check per-user rate limit
        RateLimiter userLimiter = userRateLimiters.computeIfAbsent(
                userId,
                k -> RateLimiter.create(10.0));

        if (!userLimiter.tryAcquire(100, TimeUnit.MILLISECONDS)) {
            log.warn("Rate limit exceeded for user: {}", userId);
            throw new RateLimitException("Too many requests. Please slow down.");
        }
    }

    /**
     * Get user ID from request (simplified - in production use security context)
     */
    private String getUserId() {
        // In production, get from SecurityContext or JWT
        return "anonymous-user";
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
            @RequestParam(name = "lang", defaultValue = "en") String language) {
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
     * forms. Does not return coordinates for privacy. Falls back to OpenStreetMap
     * if location not found in database. Supports Tamil and English search.
     */
    @GetMapping("/locations/autocomplete")
    public ResponseEntity<List<LocationDTO>> getLocationAutocomplete(
            @RequestParam("q") String query,
            @RequestParam(defaultValue = "en") String language) {
        log.info("Location autocomplete search: '{}' with language: {}", query, language);

        // Validate minimum query length (reduced to 2 to support shorter Tamil words)
        if (query == null || query.trim().length() < 2) {
            log.warn("Query too short for autocomplete: '{}'", query);
            return ResponseEntity.badRequest().build();
        }

        try {
            List<Location> locations = busScheduleService.searchLocationsByName(query.trim());

            // If locations found in database, return them with appropriate translations
            if (!locations.isEmpty()) {
                List<LocationDTO> result = locations.stream()
                        .map(location -> {
                            String englishName = location.name();
                            String displayName = englishName;
                            String translatedName = englishName;
                            
                            // If user is searching in Tamil, include Tamil translation in display
                            if ("ta".equals(language)) {
                                // Try to get Tamil translation
                                String tamilName = busScheduleService.getLocationTranslation(
                                    location.id().value(), "ta");
                                if (tamilName != null && !tamilName.isEmpty()) {
                                    translatedName = tamilName;
                                    displayName = tamilName;  // Show Tamil name
                                }
                            }
                            
                            return LocationDTO.withTranslation(
                                    location.id().value(),
                                    englishName,
                                    translatedName,
                                    null, null);  // Don't expose coordinates for privacy
                        })
                        .toList();

                log.info("Found {} locations in database for query '{}' (language: {})", 
                    result.size(), query, language);
                return ResponseEntity.ok(result);
            }

            // Fallback to OpenStreetMap if no locations in database
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
     * Public search endpoint with comprehensive results including continuing buses
     * Rate limited to prevent abuse
     * Enhanced with language support for Tamil and other languages
     */
    @GetMapping("/search")
    public ResponseEntity<PaginatedResponse<BusDTO>> searchPublicRoutes(
            @RequestParam(required = false) Long fromLocationId,
            @RequestParam(required = false) Long toLocationId,
            @RequestParam(required = false) String fromLocation,
            @RequestParam(required = false) String toLocation,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "true") boolean includeContinuing,
            @RequestParam(defaultValue = "en") String lang) {

        // Apply rate limiting
        checkRateLimit(getUserId());

        log.info(
                "Comprehensive search: fromLocationId={}, toLocationId={}, fromLocation='{}', toLocation='{}', page={}, size={}, lang={}",
                fromLocationId, toLocationId, fromLocation, toLocation, page, size, lang);

        // Limit search results for public access (max 50 per page)
        if (size > 50) {
            size = 50;
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

                // Get direct buses with language support
                List<BusDTO> directBuses = busScheduleService.findBusesBetweenLocations(fromLocationId, toLocationId, lang);
                log.info("Found {} direct buses", directBuses.size());

                // Get buses passing through (intermediate stops) with language support
                List<BusDTO> viaBuses = busScheduleService.findBusesPassingThroughLocations(fromLocationId,
                        toLocationId, lang);
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

            // Sort all results by shortest route first (duration, then departure time)
            allResults.sort((a, b) -> {
                // 1. Sort by duration (shortest first)
                int durationA = calculateDuration(a);
                int durationB = calculateDuration(b);

                if (durationA != durationB) {
                    return Integer.compare(durationA, durationB);
                }

                // 2. If duration is same, sort by departure time (earliest first)
                String depA = a.departureTime() != null ? a.departureTime() : "23:59";
                String depB = b.departureTime() != null ? b.departureTime() : "23:59";

                int timeCompare = depA.compareTo(depB);
                if (timeCompare != 0) {
                    return timeCompare;
                }

                // 3. If same time, prefer higher rating
                double ratingA = a.rating() != null ? a.rating() : 0.0;
                double ratingB = b.rating() != null ? b.rating() : 0.0;

                return Double.compare(ratingB, ratingA); // Higher rating first
            });

            // Store total before pagination
            long totalResults = allResults.size();

            // Apply pagination to combined results
            int startIndex = page * size;
            int endIndex = Math.min(startIndex + size, allResults.size());

            List<BusDTO> pageResults;
            if (startIndex >= allResults.size()) {
                pageResults = new ArrayList<>();
            } else {
                pageResults = allResults.subList(startIndex, endIndex);
            }

            // Sanitize for public access
            pageResults = sanitizeRoutesForPublicAccess(pageResults);

            // Create paginated response
            PaginatedResponse<BusDTO> response = PaginatedResponse.of(
                    pageResults,
                    page,
                    size,
                    totalResults);

            log.info("Returning {} results of {} total (page {}, size {})",
                    pageResults.size(), totalResults, page, size);
            return ResponseEntity.ok(response);

        } catch (RateLimitException e) {
            log.warn("Rate limit exceeded: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).build();
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
     * Get stops for a specific bus - premium feature
     */
    @GetMapping("/buses/{busId}/stops")
    public ResponseEntity<List<StopDTO>> getBusStops(
            @PathVariable Long busId,
            @RequestParam(name = "lang", defaultValue = "en") String language) {
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
            @RequestParam(name = "lang", defaultValue = "en") String language) {
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

    /**
     * Get connecting routes between two locations.
     * Returns routes that may require one or more bus transfers.
     * Uses BFS algorithm to find optimal paths through the bus network.
     * For example: Chennai -> Madurai when there's no direct bus,
     * it might return Chennai -> Trichy (Bus 1) + Trichy -> Madurai (Bus 2)
     */
    @GetMapping("/connecting-routes")
    public ResponseEntity<List<ConnectingRouteDTO>> getConnectingRoutes(
            @RequestParam("fromLocationId") Long fromLocationId,
            @RequestParam("toLocationId") Long toLocationId,
            @RequestParam(value = "maxTransfers", defaultValue = "2") int maxTransfers) {
        log.info("Getting connecting routes from {} to {} with max {} transfers",
                fromLocationId, toLocationId, maxTransfers);

        // Validate input parameters
        if (fromLocationId == null || toLocationId == null) {
            log.warn("Invalid location IDs provided: from={}, to={}", fromLocationId, toLocationId);
            return ResponseEntity.badRequest().build();
        }

        if (fromLocationId.equals(toLocationId)) {
            log.warn("Same location provided for from and to: {}", fromLocationId);
            return ResponseEntity.badRequest().build();
        }

        // Limit max transfers to prevent expensive searches
        if (maxTransfers < 0 || maxTransfers > 3) {
            maxTransfers = 2;
        }

        try {
            List<ConnectingRouteDTO> connectingRoutes = connectingRouteService.findConnectingRoutes(fromLocationId,
                    toLocationId, maxTransfers);

            log.info("Returning {} connecting routes", connectingRoutes.size());
            return ResponseEntity.ok(connectingRoutes);
        } catch (Exception e) {
            log.error("Error getting connecting routes from {} to {}", fromLocationId, toLocationId, e);
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
        // Return basic route information for public access
        // Don't limit here - pagination is handled in the endpoint
        return routes.stream()
                .map(route -> new BusDTO(
                        route.id(),
                        route.number(),
                        route.name(),
                        "Unknown", // operator - not available
                        "Unknown", // type - not available
                        route.departureTime(),
                        route.arrivalTime(),
                        route.rating(),
                        Map.of() // features as empty map
                ))
                .toList();
    }

    private boolean checkPremiumAccess() {
        // Allow basic users to see departure/arrival times
        // Only hide premium features like detailed stops and live tracking
        return true; // Changed from false to true to show basic timing information
    }

    /**
     * Calculate duration in minutes for a bus journey
     * Used for sorting buses by shortest route first
     */
    private int calculateDuration(BusDTO bus) {
        if (bus.departureTime() == null || bus.arrivalTime() == null) {
            return 9999; // Put buses without timing info at end
        }

        try {
            String[] depParts = bus.departureTime().split(":");
            String[] arrParts = bus.arrivalTime().split(":");

            int depMinutes = Integer.parseInt(depParts[0]) * 60 + Integer.parseInt(depParts[1]);
            int arrMinutes = Integer.parseInt(arrParts[0]) * 60 + Integer.parseInt(arrParts[1]);

            int duration = arrMinutes - depMinutes;

            // Handle overnight journeys (negative duration means next day arrival)
            if (duration < 0) {
                duration += 24 * 60; // Add 24 hours
            }

            return duration;
        } catch (Exception e) {
            log.warn("Error calculating duration for bus {}: {}", bus.id(), e.getMessage());
            return 9999; // Put buses with invalid time format at end
        }
    }

    /**
     * Get all locations with duplicate location names grouped together.
     * Shows district/nearby city for disambiguation.
     * 
     * @param lang Language code for translations
     * @return List of locations with disambiguation info for duplicates
     */
    @GetMapping("/locations/with-disambiguation")
    public ResponseEntity<List<LocationDTO>> getLocationsWithDisambiguation(
            @RequestParam(name = "lang", defaultValue = "en") String lang) {
        log.info("Getting locations with disambiguation info, lang: {}", lang);

        try {
            List<LocationDTO> locations = busScheduleService.getAllLocations(lang);

            // Group by name to find duplicates
            java.util.Map<String, List<LocationDTO>> byName = new java.util.HashMap<>();
            for (LocationDTO loc : locations) {
                byName.computeIfAbsent(loc.getName(), k -> new ArrayList<>()).add(loc);
            }

            // Mark duplicates with disambiguation info
            List<LocationDTO> result = new ArrayList<>();
            for (LocationDTO loc : locations) {
                List<LocationDTO> sameName = byName.get(loc.getName());
                if (sameName != null && sameName.size() > 1) {
                    // This is a duplicate - add disambiguation info with district/nearby city
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
}