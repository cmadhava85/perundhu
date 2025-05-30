package com.perundhu.application.service;

import java.time.LocalDateTime;
import java.util.List;

import com.perundhu.application.dto.BusLocationDTO;
import com.perundhu.application.dto.BusLocationReportDTO;
import com.perundhu.application.dto.RewardPointsDTO;

/**
 * Service for managing crowd-sourced bus tracking functionality
 */
public interface BusTrackingService {
    
    /**
     * Process a location report from a user who is on a bus
     * 
     * @param report The location report containing bus position data
     * @return Reward points earned for the report
     */
    RewardPointsDTO processLocationReport(BusLocationReportDTO report);
    
    /**
     * Process a user disembarking from a bus
     * 
     * @param busId The bus ID the user was on
     * @param timestamp When the user disembarked
     */
    void processDisembarkation(Long busId, LocalDateTime timestamp);
    
    /**
     * Get the current location of a specific bus
     * 
     * @param busId The ID of the bus to locate
     * @return Current location information for the bus
     */
    BusLocationDTO getCurrentBusLocation(Long busId);
    
    /**
     * Get locations of all buses operating on a specific route
     * 
     * @param fromLocationId Origin location ID
     * @param toLocationId Destination location ID
     * @return List of bus locations for the route
     */
    List<BusLocationDTO> getBusLocationsOnRoute(Long fromLocationId, Long toLocationId);
    
    /**
     * Get reward points for a specific user
     * 
     * @param userId The user's ID
     * @return Reward points information for the user
     */
    RewardPointsDTO getUserRewardPoints(String userId);
}