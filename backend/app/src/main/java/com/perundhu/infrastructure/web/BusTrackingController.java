package com.perundhu.infrastructure.web;

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

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Controller for handling bus tracking features using crowd-sourced data
 */
@RestController
@RequestMapping("/api/v1/bus-tracking")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
@Slf4j
public class BusTrackingController {
    
    private final BusTrackingService busTrackingService;
    
    /**
     * Report a bus location from a user who is on the bus
     * 
     * @param report The location report from the user
     * @return ResponseEntity with reward points earned for the report
     */
    @PostMapping("/report")
    public ResponseEntity<RewardPointsDTO> reportBusLocation(
            @RequestBody BusLocationReportDTO report) {
        log.info("Received location report: {}", report);
        RewardPointsDTO points = busTrackingService.processLocationReport(report);
        return ResponseEntity.ok(points);
    }
    
    /**
     * Report that a user has disembarked from a bus
     * 
     * @param busId The ID of the bus
     * @param body Map containing the timestamp of disembarkation
     * @return ResponseEntity with acknowledgement
     */
    @PostMapping("/disembark/{busId}")
    public ResponseEntity<Map<String, String>> reportDisembarkation(
            @PathVariable Long busId,
            @RequestBody Map<String, Object> body) {
        
        log.info("User disembarked from bus {}", busId);
        String timestamp = (String) body.get("timestamp");
        LocalDateTime disembarkTime = LocalDateTime.parse(timestamp);
        
        busTrackingService.processDisembarkation(busId, disembarkTime);
        return ResponseEntity.ok(Map.of("message", "Disembarkation recorded successfully"));
    }
    
    /**
     * Get the current location of a bus
     * 
     * @param busId The ID of the bus to track
     * @return ResponseEntity with the current location information
     */
    @GetMapping("/location/{busId}")
    public ResponseEntity<BusLocationDTO> getBusLocation(@PathVariable Long busId) {
        BusLocationDTO location = busTrackingService.getCurrentBusLocation(busId);
        return ResponseEntity.ok(location);
    }
    
    /**
     * Get the current locations of all buses in a route
     * 
     * @param fromLocationId The origin location ID
     * @param toLocationId The destination location ID
     * @return ResponseEntity with a list of bus locations
     */
    @GetMapping("/route/{fromLocationId}/{toLocationId}")
    public ResponseEntity<List<BusLocationDTO>> getBusesOnRoute(
            @PathVariable Long fromLocationId,
            @PathVariable Long toLocationId) {
        
        List<BusLocationDTO> locations = busTrackingService
                .getBusLocationsOnRoute(fromLocationId, toLocationId);
        return ResponseEntity.ok(locations);
    }
    
    /**
     * Get user's reward points for contributing to bus tracking
     * 
     * @param userId The user ID
     * @return ResponseEntity with the user's reward information
     */
    @GetMapping("/rewards/{userId}")
    public ResponseEntity<RewardPointsDTO> getUserRewardPoints(@PathVariable String userId) {
        RewardPointsDTO rewardPoints = busTrackingService.getUserRewardPoints(userId);
        return ResponseEntity.ok(rewardPoints);
    }
}