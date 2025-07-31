package com.perundhu.adapter.in.rest;

import java.util.List;
import java.util.Optional;
import java.util.concurrent.TimeUnit;
import java.util.function.Function;
import java.util.ArrayList;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

// Import specific DTOs with their proper paths
import com.perundhu.application.dto.BusDTO;
import com.perundhu.application.dto.BusScheduleDTO;
import com.perundhu.application.dto.ConnectingRouteDTO;
import com.perundhu.application.dto.LocationDTO;
import com.perundhu.application.dto.StopDTO;
import com.perundhu.application.service.BusScheduleService;
import com.perundhu.domain.model.Location;

/**
 * REST API Controller for bus schedules
 */
@RestController
@RequestMapping("/api/v1/bus-schedules")
@CrossOrigin(origins = "*")
public class BusScheduleController {

    private static final Logger log = LoggerFactory.getLogger(BusScheduleController.class);

    private final BusScheduleService busScheduleService;

    // Explicit constructor injection instead of using @RequiredArgsConstructor
    public BusScheduleController(BusScheduleService busScheduleService) {
        this.busScheduleService = busScheduleService;
    }

    // Using Java 17 Records for immutable DTOs
    private record SearchRequest(Long fromLocationId, Long toLocationId) {
        // Validation using compact constructor
        public SearchRequest {
            if (fromLocationId == null) {
                throw new IllegalArgumentException("fromLocationId must not be null");
            }
            if (toLocationId == null) {
                throw new IllegalArgumentException("toLocationId must not be null");
            }
            if (fromLocationId.equals(toLocationId)) {
                throw new IllegalArgumentException("fromLocationId and toLocationId must be different");
            }
        }
    }

    private record StopRequest(Long busId, String languageCode) {
        // Validation using compact constructor
        public StopRequest {
            if (busId == null) {
                throw new IllegalArgumentException("busId must not be null");
            }
            if (languageCode == null || languageCode.isBlank()) {
                languageCode = "en";
            }
        }
    }

    // Response records for API responses
    private record ErrorResponse(String error, String details) {
    }

    /**
     * Get all available buses
     */
    @GetMapping
    public ResponseEntity<List<BusDTO>> getAllBuses() {
        log.info("Request received for all buses");
        var buses = busScheduleService.getAllBuses();
        return ResponseEntity.ok()
                .cacheControl(CacheControl.maxAge(30, TimeUnit.MINUTES))
                .body(buses);
    }

    /**
     * Get bus details by ID
     */
    @GetMapping("/{busId}")
    public ResponseEntity<?> getBusById(@PathVariable Long busId) {
        log.info("Request received for bus: {}", busId);

        if (busId == null || busId <= 0) {
            return ResponseEntity.badRequest()
                    .body(new ErrorResponse("Invalid bus ID", "Bus ID must be a positive number"));
        }

        return busScheduleService.getBusById(busId)
                // Using pattern matching with instanceof (Java 17)
                .map(bus -> ResponseEntity.ok()
                        .cacheControl(CacheControl.maxAge(30, TimeUnit.MINUTES))
                        .body(bus))
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Get all available locations
     */
    @GetMapping("/locations")
    public ResponseEntity<List<LocationDTO>> getLocations(
            @RequestParam(value = "lang", defaultValue = "en") String languageCode) {
        log.info("Request received for all locations with language {}", languageCode);
        var locations = busScheduleService.getAllLocations(languageCode);
        return ResponseEntity.ok()
                .cacheControl(CacheControl.maxAge(1, TimeUnit.HOURS))
                .body(locations);
    }

    /**
     * Find buses between locations
     */
    @GetMapping("/search")
    public ResponseEntity<?> searchBuses(
            @RequestParam("fromLocationId") Long fromLocationId,
            @RequestParam("toLocationId") Long toLocationId) {
        try {
            var request = new SearchRequest(fromLocationId, toLocationId);
            log.info("Searching for buses between locations: {} and {}",
                    request.fromLocationId(), request.toLocationId());

            var buses = busScheduleService.findBusesBetweenLocations(
                    request.fromLocationId(),
                    request.toLocationId());

            // Using Java 17 switch expression with pattern matching
            return switch (buses.size()) {
                case 0 -> ResponseEntity.ok()
                        .body(List.of()); // Return empty list instead of 404
                default -> ResponseEntity.ok()
                        .cacheControl(CacheControl.maxAge(15, TimeUnit.MINUTES))
                        .body(buses);
            };
        } catch (IllegalArgumentException e) {
            log.error("Error in search parameters", e);
            return ResponseEntity.badRequest()
                    .body(new ErrorResponse("Invalid search parameters", e.getMessage()));
        }
    }

    /**
     * Find connecting routes between locations when no direct buses are available
     */
    @GetMapping("/connecting-routes")
    public ResponseEntity<?> findConnectingRoutes(
            @RequestParam("fromLocationId") Long fromLocationId,
            @RequestParam("toLocationId") Long toLocationId,
            @RequestParam(value = "maxDepth", required = false, defaultValue = "3") Integer maxDepth) {
        try {
            var request = new SearchRequest(fromLocationId, toLocationId);
            log.info("Searching for connecting routes between locations: {} and {} with maxDepth: {}",
                    request.fromLocationId(), request.toLocationId(), maxDepth);

            var connectingRoutes = busScheduleService.findConnectingRoutes(
                    request.fromLocationId(), request.toLocationId(), maxDepth);

            // Using Java 17 switch expression with pattern matching
            return switch (connectingRoutes.size()) {
                case 0 -> ResponseEntity.ok()
                        .body(List.of()); // Return empty list instead of 404
                default -> ResponseEntity.ok()
                        .cacheControl(CacheControl.maxAge(30, TimeUnit.MINUTES))
                        .body(connectingRoutes);
            };
        } catch (IllegalArgumentException e) {
            log.error("Error in search parameters", e);
            return ResponseEntity.badRequest()
                    .body(new ErrorResponse("Invalid search parameters", e.getMessage()));
        }
    }

    /**
     * Get stops for a specific bus
     */
    @GetMapping("/{busId}/stops")
    public ResponseEntity<?> getStopsForBus(
            @PathVariable Long busId,
            @RequestParam(value = "lang", defaultValue = "en") String languageCode) {
        try {
            var request = new StopRequest(busId, languageCode);
            log.info("Request received for stops for bus {} with language {}",
                    request.busId(), request.languageCode());

            var stops = busScheduleService.getStopsForBus(request.busId(), request.languageCode());

            // Using Java 17 style for handling empty collections
            if (stops.isEmpty()) {
                return ResponseEntity.ok()
                        .body(List.of()); // Return empty list instead of 404
            }

            return ResponseEntity.ok()
                    .cacheControl(CacheControl.maxAge(30, TimeUnit.MINUTES))
                    .body(stops);

        } catch (IllegalArgumentException e) {
            log.error("Error getting stops for bus", e);
            return ResponseEntity.badRequest()
                    .body(new ErrorResponse("Invalid request parameters", e.getMessage()));
        }
    }

    /**
     * Find buses that travel via specified locations
     * This endpoint returns buses that have stops at both locations in the
     * specified order,
     * even if they're not the start and end points of the route
     */
    @GetMapping("/search/via-stops")
    public ResponseEntity<?> searchBusesViaStops(
            @RequestParam("fromLocationId") Long fromLocationId,
            @RequestParam("toLocationId") Long toLocationId) {
        try {
            var request = new SearchRequest(fromLocationId, toLocationId);
            log.info("Searching for buses passing through locations: {} and {}",
                    request.fromLocationId(), request.toLocationId());

            var buses = busScheduleService.findBusesPassingThroughLocations(
                    request.fromLocationId(),
                    request.toLocationId());

            // Combine with direct buses to ensure we get all possible routes
            var directBuses = busScheduleService.findBusesBetweenLocations(
                    request.fromLocationId(),
                    request.toLocationId());

            // Merge the lists, avoiding duplicates
            var allBuses = new ArrayList<>(directBuses);
            for (var bus : buses) {
                if (directBuses.stream().noneMatch(b -> b.id().equals(bus.id()))) {
                    allBuses.add(bus);
                }
            }

            // Using Java 17 switch expression with pattern matching
            return switch (allBuses.size()) {
                case 0 -> ResponseEntity.ok()
                        .body(List.of()); // Return empty list instead of 404
                default -> ResponseEntity.ok()
                        .cacheControl(CacheControl.maxAge(15, TimeUnit.MINUTES))
                        .body(allBuses);
            };
        } catch (IllegalArgumentException e) {
            log.error("Error in search parameters", e);
            return ResponseEntity.badRequest()
                    .body(new ErrorResponse("Invalid search parameters", e.getMessage()));
        }
    }

    /**
     * Helper method to process responses using functional programming pattern
     */
    private <T> ResponseEntity<?> processServiceCall(
            Function<Void, T> serviceCall,
            String errorMessage) {
        try {
            var result = serviceCall.apply(null);
            return ResponseEntity.ok()
                    .cacheControl(CacheControl.maxAge(30, TimeUnit.MINUTES))
                    .body(result);
        } catch (Exception e) {
            log.error(errorMessage, e);
            return ResponseEntity.badRequest()
                    .body(new ErrorResponse("Error processing request", e.getMessage()));
        }
    }
}

