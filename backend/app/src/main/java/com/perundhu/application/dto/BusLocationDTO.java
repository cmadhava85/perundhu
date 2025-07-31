package com.perundhu.application.dto;

/**
 * DTO representing the current location of a bus
 * Implemented as a Java 17 record for immutability
 */
public record BusLocationDTO(
        Long busId,
        String busName,
        String busNumber,
        String fromLocation,
        String toLocation,
        double latitude,
        double longitude,
        double speed, // Speed in meters per second
        double heading, // Direction in degrees
        String timestamp,
        String lastReportedStopName,
        String nextStopName,
        String estimatedArrivalTime,
        int reportCount, // Number of users currently reporting this bus location
        int confidenceScore // Score between 1-100 indicating confidence in location accuracy
) {
    /**
     * Default constructor for compatibility with existing code
     */
    public BusLocationDTO() {
        this(null, null, null, null, null, 0.0, 0.0, 0.0, 0.0, null, null, null, null, 0, 0);
    }

    /**
     * Creates a builder for BusLocationDTO
     * Since Java 17 records don't natively support the builder pattern, this
     * provides backward compatibility
     */
    public static Builder builder() {
        return new Builder();
    }

    /**
     * Builder class for BusLocationDTO
     */
    public static class Builder {
        private Long busId;
        private String busName;
        private String busNumber;
        private String fromLocation;
        private String toLocation;
        private double latitude;
        private double longitude;
        private double speed;
        private double heading;
        private String timestamp;
        private String lastReportedStopName;
        private String nextStopName;
        private String estimatedArrivalTime;
        private int reportCount;
        private int confidenceScore;

        public Builder busId(Long busId) {
            this.busId = busId;
            return this;
        }

        public Builder busName(String busName) {
            this.busName = busName;
            return this;
        }

        public Builder busNumber(String busNumber) {
            this.busNumber = busNumber;
            return this;
        }

        public Builder fromLocation(String fromLocation) {
            this.fromLocation = fromLocation;
            return this;
        }

        public Builder toLocation(String toLocation) {
            this.toLocation = toLocation;
            return this;
        }

        public Builder latitude(double latitude) {
            this.latitude = latitude;
            return this;
        }

        public Builder longitude(double longitude) {
            this.longitude = longitude;
            return this;
        }

        public Builder speed(double speed) {
            this.speed = speed;
            return this;
        }

        public Builder heading(double heading) {
            this.heading = heading;
            return this;
        }

        public Builder accuracy(double accuracy) {
            // Store accuracy as part of the confidence score calculation
            // This is an approximation since the actual record doesn't have a direct accuracy field
            this.confidenceScore = (int) (100.0 / (1.0 + accuracy)); // Higher accuracy = higher score
            return this;
        }

        public Builder timestamp(String timestamp) {
            this.timestamp = timestamp;
            return this;
        }

        public Builder lastReportedStopName(String lastReportedStopName) {
            this.lastReportedStopName = lastReportedStopName;
            return this;
        }

        public Builder nextStopName(String nextStopName) {
            this.nextStopName = nextStopName;
            return this;
        }

        public Builder estimatedArrivalTime(String estimatedArrivalTime) {
            this.estimatedArrivalTime = estimatedArrivalTime;
            return this;
        }

        public Builder reportCount(int reportCount) {
            this.reportCount = reportCount;
            return this;
        }

        public Builder confidenceScore(int confidenceScore) {
            this.confidenceScore = confidenceScore;
            return this;
        }

        public BusLocationDTO build() {
            return new BusLocationDTO(
                busId,
                busName,
                busNumber,
                fromLocation,
                toLocation,
                latitude,
                longitude,
                speed,
                heading,
                timestamp,
                lastReportedStopName,
                nextStopName,
                estimatedArrivalTime,
                reportCount,
                confidenceScore
            );
        }
    }

    /**
     * Creates a mutable copy of this object with the busId set
     * Provides compatibility with existing code that expects setter methods
     */
    public BusLocationDTO setBusId(Long busId) {
        return new BusLocationDTO(
                busId, this.busName, this.busNumber, this.fromLocation, this.toLocation,
                this.latitude, this.longitude, this.speed, this.heading, this.timestamp,
                this.lastReportedStopName, this.nextStopName, this.estimatedArrivalTime,
                this.reportCount, this.confidenceScore);
    }

    /**
     * Creates a mutable copy of this object with the busName set
     */
    public BusLocationDTO setBusName(String busName) {
        return new BusLocationDTO(
                this.busId, busName, this.busNumber, this.fromLocation, this.toLocation,
                this.latitude, this.longitude, this.speed, this.heading, this.timestamp,
                this.lastReportedStopName, this.nextStopName, this.estimatedArrivalTime,
                this.reportCount, this.confidenceScore);
    }

    /**
     * Creates a mutable copy of this object with the busNumber set
     */
    public BusLocationDTO setBusNumber(String busNumber) {
        return new BusLocationDTO(
                this.busId, this.busName, busNumber, this.fromLocation, this.toLocation,
                this.latitude, this.longitude, this.speed, this.heading, this.timestamp,
                this.lastReportedStopName, this.nextStopName, this.estimatedArrivalTime,
                this.reportCount, this.confidenceScore);
    }

    /**
     * Creates a mutable copy of this object with the fromLocation set
     */
    public BusLocationDTO setFromLocation(String fromLocation) {
        return new BusLocationDTO(
                this.busId, this.busName, this.busNumber, fromLocation, this.toLocation,
                this.latitude, this.longitude, this.speed, this.heading, this.timestamp,
                this.lastReportedStopName, this.nextStopName, this.estimatedArrivalTime,
                this.reportCount, this.confidenceScore);
    }

    /**
     * Creates a mutable copy of this object with the toLocation set
     */
    public BusLocationDTO setToLocation(String toLocation) {
        return new BusLocationDTO(
                this.busId, this.busName, this.busNumber, this.fromLocation, toLocation,
                this.latitude, this.longitude, this.speed, this.heading, this.timestamp,
                this.lastReportedStopName, this.nextStopName, this.estimatedArrivalTime,
                this.reportCount, this.confidenceScore);
    }

    /**
     * Creates a mutable copy of this object with the latitude set
     */
    public BusLocationDTO setLatitude(double latitude) {
        return new BusLocationDTO(
                this.busId, this.busName, this.busNumber, this.fromLocation, this.toLocation,
                latitude, this.longitude, this.speed, this.heading, this.timestamp,
                this.lastReportedStopName, this.nextStopName, this.estimatedArrivalTime,
                this.reportCount, this.confidenceScore);
    }

    /**
     * Creates a mutable copy of this object with the longitude set
     */
    public BusLocationDTO setLongitude(double longitude) {
        return new BusLocationDTO(
                this.busId, this.busName, this.busNumber, this.fromLocation, this.toLocation,
                this.latitude, longitude, this.speed, this.heading, this.timestamp,
                this.lastReportedStopName, this.nextStopName, this.estimatedArrivalTime,
                this.reportCount, this.confidenceScore);
    }

    /**
     * Creates a mutable copy of this object with the speed set
     */
    public BusLocationDTO setSpeed(double speed) {
        return new BusLocationDTO(
                this.busId, this.busName, this.busNumber, this.fromLocation, this.toLocation,
                this.latitude, this.longitude, speed, this.heading, this.timestamp,
                this.lastReportedStopName, this.nextStopName, this.estimatedArrivalTime,
                this.reportCount, this.confidenceScore);
    }

    /**
     * Creates a mutable copy of this object with the heading set
     */
    public BusLocationDTO setHeading(double heading) {
        return new BusLocationDTO(
                this.busId, this.busName, this.busNumber, this.fromLocation, this.toLocation,
                this.latitude, this.longitude, this.speed, heading, this.timestamp,
                this.lastReportedStopName, this.nextStopName, this.estimatedArrivalTime,
                this.reportCount, this.confidenceScore);
    }

    /**
     * Creates a mutable copy of this object with the timestamp set
     */
    public BusLocationDTO setTimestamp(String timestamp) {
        return new BusLocationDTO(
                this.busId, this.busName, this.busNumber, this.fromLocation, this.toLocation,
                this.latitude, this.longitude, this.speed, this.heading, timestamp,
                this.lastReportedStopName, this.nextStopName, this.estimatedArrivalTime,
                this.reportCount, this.confidenceScore);
    }

    /**
     * Creates a mutable copy of this object with the lastReportedStopName set
     */
    public BusLocationDTO setLastReportedStopName(String lastReportedStopName) {
        return new BusLocationDTO(
                this.busId, this.busName, this.busNumber, this.fromLocation, this.toLocation,
                this.latitude, this.longitude, this.speed, this.heading, this.timestamp,
                lastReportedStopName, this.nextStopName, this.estimatedArrivalTime,
                this.reportCount, this.confidenceScore);
    }

    /**
     * Creates a mutable copy of this object with the nextStopName set
     */
    public BusLocationDTO setNextStopName(String nextStopName) {
        return new BusLocationDTO(
                this.busId, this.busName, this.busNumber, this.fromLocation, this.toLocation,
                this.latitude, this.longitude, this.speed, this.heading, this.timestamp,
                this.lastReportedStopName, nextStopName, this.estimatedArrivalTime,
                this.reportCount, this.confidenceScore);
    }

    /**
     * Creates a mutable copy of this object with the estimatedArrivalTime set
     */
    public BusLocationDTO setEstimatedArrivalTime(String estimatedArrivalTime) {
        return new BusLocationDTO(
                this.busId, this.busName, this.busNumber, this.fromLocation, this.toLocation,
                this.latitude, this.longitude, this.speed, this.heading, this.timestamp,
                this.lastReportedStopName, this.nextStopName, estimatedArrivalTime,
                this.reportCount, this.confidenceScore);
    }

    /**
     * Creates a mutable copy of this object with the reportCount set
     */
    public BusLocationDTO setReportCount(int reportCount) {
        return new BusLocationDTO(
                this.busId, this.busName, this.busNumber, this.fromLocation, this.toLocation,
                this.latitude, this.longitude, this.speed, this.heading, this.timestamp,
                this.lastReportedStopName, this.nextStopName, this.estimatedArrivalTime,
                reportCount, this.confidenceScore);
    }

    /**
     * Creates a mutable copy of this object with the confidenceScore set
     */
    public BusLocationDTO setConfidenceScore(int confidenceScore) {
        return new BusLocationDTO(
                this.busId, this.busName, this.busNumber, this.fromLocation, this.toLocation,
                this.latitude, this.longitude, this.speed, this.heading, this.timestamp,
                this.lastReportedStopName, this.nextStopName, this.estimatedArrivalTime,
                this.reportCount, confidenceScore);
    }
}

