package com.perundhu.application.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

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
     * @param busId     The bus ID the user was on
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
     * @param toLocationId   Destination location ID
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

    /**
     * Get all current active bus locations
     * 
     * @return Map of bus IDs to their current locations
     */
    Map<Long, BusLocationDTO> getActiveBusLocations();

    /**
     * Get historical location data for a specific bus
     * 
     * @param busId The ID of the bus
     * @param since Timestamp to retrieve data from
     * @return List of historical bus locations
     */
    List<BusLocationDTO> getBusLocationHistory(Long busId, LocalDateTime since);

    /**
     * Get estimated arrival time of a bus at a specific stop
     * 
     * @param busId  The ID of the bus
     * @param stopId The ID of the stop
     * @return Map containing estimated arrival information
     */
    Map<String, Object> getEstimatedArrival(Long busId, Long stopId);

    /**
     * Predict the next stop for a bus based on its current location
     *
     * @param busId The bus ID
     * @return The next predicted stop
     */
    com.perundhu.domain.model.Stop predictNextStop(Long busId);

    /**
     * Report bus location with simplified auto-detection
     */
    BusLocationDTO reportBusLocation(BusLocationRequest request);

    /**
     * Simple request class for bus location reporting
     */
    public static class BusLocationRequest {
        private Long busId;
        private String userId;
        private Double latitude;
        private Double longitude;
        private Double accuracy;
        private Double speed;
        private Double heading;
        private String timestamp;
        private Long stopId; // Optional - will be auto-detected if null
        private String deviceInfo;

        // Constructors
        public BusLocationRequest() {
        }

        public BusLocationRequest(Long busId, String userId, Double latitude, Double longitude,
                Double accuracy, Double speed, Double heading, String timestamp,
                Long stopId, String deviceInfo) {
            this.busId = busId;
            this.userId = userId;
            this.latitude = latitude;
            this.longitude = longitude;
            this.accuracy = accuracy;
            this.speed = speed;
            this.heading = heading;
            this.timestamp = timestamp;
            this.stopId = stopId;
            this.deviceInfo = deviceInfo;
        }

        // Getters and setters
        public Long getBusId() {
            return busId;
        }

        public void setBusId(Long busId) {
            this.busId = busId;
        }

        public String getUserId() {
            return userId;
        }

        public void setUserId(String userId) {
            this.userId = userId;
        }

        public Double getLatitude() {
            return latitude;
        }

        public void setLatitude(Double latitude) {
            this.latitude = latitude;
        }

        public Double getLongitude() {
            return longitude;
        }

        public void setLongitude(Double longitude) {
            this.longitude = longitude;
        }

        public Double getAccuracy() {
            return accuracy;
        }

        public void setAccuracy(Double accuracy) {
            this.accuracy = accuracy;
        }

        public Double getSpeed() {
            return speed;
        }

        public void setSpeed(Double speed) {
            this.speed = speed;
        }

        public Double getHeading() {
            return heading;
        }

        public void setHeading(Double heading) {
            this.heading = heading;
        }

        public String getTimestamp() {
            return timestamp;
        }

        public void setTimestamp(String timestamp) {
            this.timestamp = timestamp;
        }

        public Long getStopId() {
            return stopId;
        }

        public void setStopId(Long stopId) {
            this.stopId = stopId;
        }

        public String getDeviceInfo() {
            return deviceInfo;
        }

        public void setDeviceInfo(String deviceInfo) {
            this.deviceInfo = deviceInfo;
        }
    

    

    

    

    

    

    

    

    

    

    

    

    

    

    

    

    

    

    
