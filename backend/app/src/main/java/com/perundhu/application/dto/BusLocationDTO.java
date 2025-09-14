package com.perundhu.application.dto;

/**
 * DTO representing the current location of a bus using Java 17 record
 */
public record BusLocationDTO(
        Long busId,
        String busName,
        String busNumber,
        String fromLocation,
        String toLocation,
        double latitude,
        double longitude,
        double accuracy,
        double speed,
        double heading,
        String timestamp,
        String lastReportedStopName,
        String nextStopName,
        String estimatedArrivalTime,
        int reportCount,
        int confidenceScore,
        String userId) {

    /**
     * Compact constructor for validation
     */
    public BusLocationDTO {
        if (latitude < -90.0 || latitude > 90.0) {
            throw new IllegalArgumentException("Latitude must be between -90 and 90");
        }
        if (longitude < -180.0 || longitude > 180.0) {
            throw new IllegalArgumentException("Longitude must be between -180 and 180");
        }
        if (confidenceScore < 0 || confidenceScore > 100) {
            throw new IllegalArgumentException("Confidence score must be between 0 and 100");
        }
    }

    /**
     * Convenience getter methods for backward compatibility
     */
    public Long getBusId() {
        return busId;
    }

    public String getBusName() {
        return busName;
    }

    public String getBusNumber() {
        return busNumber;
    }

    public String getFromLocation() {
        return fromLocation;
    }

    public String getToLocation() {
        return toLocation;
    }

    public double getLatitude() {
        return latitude;
    }

    public double getLongitude() {
        return longitude;
    }

    public double getAccuracy() {
        return accuracy;
    }

    public double getSpeed() {
        return speed;
    }

    public double getHeading() {
        return heading;
    }

    public String getTimestamp() {
        return timestamp;
    }

    public String getLastReportedStopName() {
        return lastReportedStopName;
    }

    public String getNextStopName() {
        return nextStopName;
    }

    public String getEstimatedArrivalTime() {
        return estimatedArrivalTime;
    }

    public int getReportCount() {
        return reportCount;
    }

    public int getConfidenceScore() {
        return confidenceScore;
    }

    public String getUserId() {
        return userId;
    }

    /**
     * Factory method for creating basic location data with 8 parameters
     */
    public static BusLocationDTO of(Long busId, String busName, String busNumber,
            String fromLocation, String toLocation,
            double latitude, double longitude, String timestamp) {
        return new BusLocationDTO(busId, busName, busNumber, fromLocation, toLocation,
                latitude, longitude, 0.0, 0.0, 0.0, timestamp,
                null, null, null, 0, 50, null);
    }

    /**
     * Factory method for detailed location with movement data (12 parameters)
     */
    public static BusLocationDTO withMovement(Long busId, String busName, String busNumber,
            String fromLocation, String toLocation,
            double latitude, double longitude,
            double accuracy, double speed, double heading,
            String timestamp, String userId) {
        return new BusLocationDTO(busId, busName, busNumber, fromLocation, toLocation,
                latitude, longitude, accuracy, speed, heading, timestamp,
                null, null, null, 1, 75, userId);
    }

    /**
     * Create a copy with updated location using Java 17 record features
     */
    public BusLocationDTO withLocation(double newLatitude, double newLongitude, String newTimestamp) {
        return new BusLocationDTO(busId, busName, busNumber, fromLocation, toLocation,
                newLatitude, newLongitude, accuracy, speed, heading, newTimestamp,
                lastReportedStopName, nextStopName, estimatedArrivalTime,
                reportCount + 1, confidenceScore, userId);
    }

    public BusLocationDTO withStopInfo(String lastStop, String nextStop, String estimatedArrival) {
        return new BusLocationDTO(busId, busName, busNumber, fromLocation, toLocation,
                latitude, longitude, accuracy, speed, heading, timestamp,
                lastStop, nextStop, estimatedArrival,
                reportCount, confidenceScore, userId);
    }

    public BusLocationDTO withConfidence(int newConfidenceScore) {
        return new BusLocationDTO(busId, busName, busNumber, fromLocation, toLocation,
                latitude, longitude, accuracy, speed, heading, timestamp,
                lastReportedStopName, nextStopName, estimatedArrivalTime,
                reportCount, newConfidenceScore, userId);
    }
}