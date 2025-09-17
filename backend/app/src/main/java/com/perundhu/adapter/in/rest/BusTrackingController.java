package com.perundhu.adapter.in.rest;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.perundhu.application.dto.BusLocationDTO;
import com.perundhu.application.dto.BusLocationReportDTO;
import com.perundhu.application.dto.RewardPointsDTO;
import com.perundhu.application.service.BusTrackingService;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Controller for handling bus tracking features using crowd-sourced data
 */
@RestController
@RequestMapping("/api/v1/bus-tracking")
@CrossOrigin(origins = "*")
public class BusTrackingController {

    private static final Logger log = LoggerFactory.getLogger(BusTrackingController.class);
    private final BusTrackingService busTrackingService;

    public BusTrackingController(BusTrackingService busTrackingService) {
        this.busTrackingService = busTrackingService;
    }

    // Response records
    public record ErrorResponse(String error) {
    }

    public record DisembarkationRequest(Long busId, String userId, LocalDateTime timestamp) {
    }

    /**
     * Report a bus location
     */
    @PostMapping("/report")
    public ResponseEntity<RewardPointsDTO> reportBusLocation(@RequestBody BusLocationReportDTO report) {
        log.info("Received bus location report from user: {} for bus: {}",
                report.userId(), report.busId());

        RewardPointsDTO points = busTrackingService.processLocationReport(report);
        return ResponseEntity.ok(points);
    }

    /**
     * Report bus location with simplified auto-detection
     */
    @PostMapping("/report-simple")
    public ResponseEntity<BusLocationDTO> reportBusLocationSimple(
            @RequestBody BusTrackingService.BusLocationRequest request) {
        log.info("Received simplified bus location report for bus: {} from user: {}",
                request.getBusId(), request.getUserId());

        try {
            BusLocationDTO result = busTrackingService.reportBusLocation(request);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Error processing simplified bus location report", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Get current bus locations
     */
    @GetMapping("/live")
    public ResponseEntity<Map<Long, BusLocationDTO>> getActiveBusLocations() {
        log.info("Request received for active bus locations");

        Map<Long, BusLocationDTO> locations = busTrackingService.getActiveBusLocations();
        return ResponseEntity.ok(locations);
    }

    /**
     * Get bus location history for a specific bus
     */
    @GetMapping("/history/{busId}")
    public ResponseEntity<List<BusLocationDTO>> getBusLocationHistory(@PathVariable Long busId) {
        log.info("Request received for location history of bus: {}", busId);

        List<BusLocationDTO> history = busTrackingService.getBusLocationHistory(
                busId, LocalDateTime.now().minusHours(12));

        return ResponseEntity.ok(history);
    }

    /**
     * Get estimated arrival time for a bus at a specific stop
     */
    @GetMapping("/eta/{busId}/{stopId}")
    public ResponseEntity<?> getEstimatedArrival(
            @PathVariable Long busId,
            @PathVariable Long stopId) {
        log.info("Request received for ETA of bus: {} at stop: {}", busId, stopId);

        try {
            Map<String, Object> result = busTrackingService.getEstimatedArrival(busId, stopId);
            if (result == null || result.isEmpty() || result.containsKey("error")) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException e) {
            log.warn("Could not calculate ETA: {}", e.getMessage());
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }

    /**
     * Get bus locations for a specific route
     */
    @GetMapping("/route/{fromLocationId}/{toLocationId}")
    public ResponseEntity<List<BusLocationDTO>> getBusLocationsOnRoute(
            @PathVariable Long fromLocationId,
            @PathVariable Long toLocationId) {
        log.info("Request received for bus locations on route: {} to {}", fromLocationId, toLocationId);

        List<BusLocationDTO> locations = busTrackingService.getBusLocationsOnRoute(fromLocationId, toLocationId);
        return ResponseEntity.ok(locations);
    }

    /**
     * Get user reward points
     */
    @GetMapping("/rewards/{userId}")
    public ResponseEntity<RewardPointsDTO> getUserRewardPoints(@PathVariable String userId) {
        log.info("Request received for reward points of user: {}", userId);

        RewardPointsDTO rewards = busTrackingService.getUserRewardPoints(userId);
        return ResponseEntity.ok(rewards);
    }

    /**
     * Report user disembarkation (when they get off the bus)
     */
    @PostMapping("/disembark")
    public ResponseEntity<Void> reportDisembarkation(@RequestBody DisembarkationRequest request) {
        log.info("Received disembarkation report from user: {} for bus: {}",
                request.userId(), request.busId());

        busTrackingService.processDisembarkation(request.busId(), request.timestamp());
        return ResponseEntity.ok().build();
    }
}
