package com.perundhu.adapter.in.rest;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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

/**
 * Controller for handling bus tracking features using crowd-sourced data
 */
@RestController
@RequestMapping("/api/v1/bus-tracking")
@CrossOrigin(origins = "*")
public class BusTrackingController {

    private static final Logger log = LoggerFactory.getLogger(BusTrackingController.class);
    private final BusTrackingService busTrackingService;

    /**
     * Constructor for dependency injection
     */
    public BusTrackingController(BusTrackingService busTrackingService) {
        this.busTrackingService = busTrackingService;
    }

    // Response records
    private record ErrorResponse(String error) {
    }

    /**
     * Report a bus location
     */
    @PostMapping("/report")
    public ResponseEntity<RewardPointsDTO> reportBusLocation(@RequestBody BusLocationReportDTO report) {
        log.info("Received bus location report from user: {} for bus: {}",
                report.getUserId(), report.getBusId());

        var points = busTrackingService.processLocationReport(report);
        return ResponseEntity.ok(points);
    }

    /**
     * Get current bus locations
     */
    @GetMapping("/live")
    public ResponseEntity<Map<Long, BusLocationDTO>> getActiveBusLocations() {
        log.info("Request received for active bus locations");

        var locations = busTrackingService.getActiveBusLocations();
        return ResponseEntity.ok(locations);
    }

    /**
     * Get bus location history for a specific bus
     */
    @GetMapping("/history/{busId}")
    public ResponseEntity<List<BusLocationDTO>> getBusLocationHistory(@PathVariable Long busId) {
        log.info("Request received for location history of bus: {}", busId);

        var history = busTrackingService.getBusLocationHistory(
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
            if (result == null || result.isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            if (result.containsKey("error")) {
                return ResponseEntity.badRequest().body(
                        new ErrorResponse(result.get("error").toString()));
            }
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException e) {
            log.warn("Could not calculate ETA: {}", e.getMessage());
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }
}
