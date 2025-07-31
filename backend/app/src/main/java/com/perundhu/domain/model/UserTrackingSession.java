package com.perundhu.domain.model;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Domain model for user tracking sessions
 * Implemented as a Java 17 record for immutability
 */
public record UserTrackingSession(
        Long id,
        String sessionId,
        String userId,
        Long busId,
        Long startLocationId,
        String deviceInfo,
        String ipAddress,
        LocalDateTime startTime,
        LocalDateTime endTime,
        String userAgent,
        Long endLocationId) {
    /**
     * Static factory method to create a new session
     */
    public static UserTrackingSession create(
            String userId,
            Long busId,
            Long startLocationId,
            String deviceInfo,
            String ipAddress,
            String userAgent) {
        return new UserTrackingSession(
                null, // id (to be set when saved)
                UUID.randomUUID().toString(), // sessionId
                userId,
                busId,
                startLocationId,
                deviceInfo,
                ipAddress,
                LocalDateTime.now(), // startTime
                null, // endTime (to be set when session ends)
                userAgent,
                null // endLocationId (to be set when session ends)
        );
    }

    /**
     * Creates a builder for UserTrackingSession
     * Since records don't natively support the builder pattern, this provides
     * compatibility
     */
    public static Builder builder() {
        return new Builder();
    }

    /**
     * Builder class for UserTrackingSession
     */
    public static class Builder {
        private Long id;
        private String sessionId;
        private String userId;
        private Long busId;
        private Long startLocationId;
        private String deviceInfo;
        private String ipAddress;
        private LocalDateTime startTime;
        private LocalDateTime endTime;
        private String userAgent;
        private Long endLocationId;

        public Builder id(Long id) {
            this.id = id;
            return this;
        }

        public Builder sessionId(String sessionId) {
            this.sessionId = sessionId;
            return this;
        }

        public Builder userId(String userId) {
            this.userId = userId;
            return this;
        }

        public Builder busId(Long busId) {
            this.busId = busId;
            return this;
        }

        public Builder startLocationId(Long startLocationId) {
            this.startLocationId = startLocationId;
            return this;
        }

        public Builder deviceInfo(String deviceInfo) {
            this.deviceInfo = deviceInfo;
            return this;
        }

        public Builder ipAddress(String ipAddress) {
            this.ipAddress = ipAddress;
            return this;
        }

        public Builder startTime(LocalDateTime startTime) {
            this.startTime = startTime;
            return this;
        }

        public Builder endTime(LocalDateTime endTime) {
            this.endTime = endTime;
            return this;
        }

        public Builder userAgent(String userAgent) {
            this.userAgent = userAgent;
            return this;
        }

        public Builder endLocationId(Long endLocationId) {
            this.endLocationId = endLocationId;
            return this;
        }

        public UserTrackingSession build() {
            return new UserTrackingSession(id, sessionId, userId, busId, startLocationId, deviceInfo,
                    ipAddress, startTime, endTime, userAgent, endLocationId);
        }
    }

    /**
     * Creates a new session with the end time and location set
     * 
     * @param endLocationId The ID of the end location
     * @return A new session with the end data set
     */
    public UserTrackingSession withEndData(Long endLocationId) {
        return new UserTrackingSession(
                this.id,
                this.sessionId,
                this.userId,
                this.busId,
                this.startLocationId,
                this.deviceInfo,
                this.ipAddress,
                this.startTime,
                LocalDateTime.now(), // Set end time to now
                this.userAgent,
                endLocationId);
    }
}
