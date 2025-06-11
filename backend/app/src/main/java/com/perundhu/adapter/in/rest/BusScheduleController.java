package com.perundhu.adapter.in.rest;

import java.util.List;
import java.util.Optional;
import java.util.concurrent.TimeUnit;
import java.util.function.Function;

import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.perundhu.application.dto.*;
import com.perundhu.application.service.BusScheduleService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * REST API Controller for bus schedules
 */
@RestController
@RequestMapping("/api/v1/bus-schedules")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
@Slf4j
public class BusScheduleController {

    private final BusScheduleService busScheduleService;

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
    private record ErrorResponse(String error, String details) {}
    
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
            @RequestParam("toLocationId") Long toLocationId) {
        try {
            var request = new SearchRequest(fromLocationId, toLocationId);
            log.info("Searching for connecting routes between locations: {} and {}", 
                request.fromLocationId(), request.toLocationId());
            
            var connectingRoutes = busScheduleService.findConnectingRoutes(
                request.fromLocationId(), request.toLocationId());
            
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